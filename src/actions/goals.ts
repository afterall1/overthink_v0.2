'use server'

import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    Goal,
    GoalInsert,
    GoalUpdate,
    GoalWithDetails,
    GoalPeriod,
    GoalMilestone,
    GoalMilestoneInsert,
    GoalMilestoneUpdate,
    GoalEntry,
    GoalTemplate,
    GoalTemplateWithQuests,
    QuestTemplate,
    DailyQuest
} from '@/types/database.types'
import { createQuestsFromTemplates } from './quests'

// =====================================================
// GOAL CRUD OPERATIONS
// =====================================================

/**
 * Fetch all goals for current user, optionally filtered by period
 */
export async function getGoals(period?: GoalPeriod): Promise<GoalWithDetails[]> {
    try {
        const { client, user } = await getAuthenticatedClient()

        let query = client
            .from('goals')
            .select(`
                *,
                categories (id, name, slug, color_code, icon_slug),
                goal_milestones (*),
                goal_entries (*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (period) {
            query = query.eq('period', period)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching goals:', error)
            return []
        }

        return (data || []) as GoalWithDetails[]
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return []
        }
        throw error
    }
}

/**
 * Fetch goal entries for a specific goal
 * Handles schema cache issues gracefully
 */
async function fetchGoalEntries(goalId: string): Promise<GoalEntry[]> {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('goal_entries')
            .select('*')
            .eq('goal_id', goalId)
            .order('logged_at', { ascending: false })

        if (error) {
            // Schema cache error → return empty gracefully
            if (error.message.includes('schema cache') || error.code === 'PGRST200') {
                console.warn('[WARN fetchGoalEntries] Schema cache issue, returning empty')
                return []
            }
            console.error('[ERROR fetchGoalEntries]:', error)
            return []
        }
        return data || []
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('schema cache') || msg.includes('PGRST200')) {
            return []
        }
        console.error('[ERROR fetchGoalEntries] Unexpected:', err)
        return []
    }
}

/**
 * Fetch goal milestones for a specific goal
 * Handles schema cache issues gracefully
 */
async function fetchGoalMilestones(goalId: string): Promise<GoalMilestone[]> {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('goal_milestones')
            .select('*')
            .eq('goal_id', goalId)
            .order('sort_order', { ascending: true })

        if (error) {
            if (error.message.includes('schema cache') || error.code === 'PGRST200') {
                return []
            }
            console.error('[ERROR fetchGoalMilestones]:', error)
            return []
        }
        return data || []
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('schema cache') || msg.includes('PGRST200')) {
            return []
        }
        return []
    }
}

/**
 * Get active goals (not completed)
 * Fetches entries and milestones separately to handle schema cache issues
 */
export async function getActiveGoals(): Promise<GoalWithDetails[]> {
    try {
        const { user } = await getAuthenticatedClient()
        const adminClient = createAdminClient()

        // Fetch goals with categories
        const { data, error } = await adminClient
            .from('goals')
            .select(`
                *,
                categories (id, name, slug, color_code, icon_slug)
            `)
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[ERROR getActiveGoals]:', error)
            return []
        }

        if (!data || data.length === 0) {
            return []
        }

        // Fetch entries and milestones for each goal in parallel
        const goalsWithDetails = await Promise.all(
            data.map(async (goal) => {
                const [entries, milestones] = await Promise.all([
                    fetchGoalEntries(goal.id),
                    fetchGoalMilestones(goal.id)
                ])
                return {
                    ...goal,
                    goal_entries: entries,
                    goal_milestones: milestones
                }
            })
        )

        return goalsWithDetails as GoalWithDetails[]
    } catch (error) {
        console.error('[ERROR getActiveGoals] Caught error:', error)
        if (error instanceof AuthenticationError) {
            return []
        }
        throw error
    }
}

/**
 * Get a single goal with all details
 * Uses fallback mechanism for entries/milestones if schema cache fails
 */
export async function getGoalById(goalId: string): Promise<GoalWithDetails | null> {
    try {
        const { user } = await getAuthenticatedClient()
        const adminClient = createAdminClient()

        // First, try to get the goal with basic info
        const { data: goal, error } = await adminClient
            .from('goals')
            .select(`
                *,
                categories (id, name, slug, color_code, icon_slug)
            `)
            .eq('id', goalId)
            .single()

        if (error || !goal) {
            console.error('[ERROR getGoalById]:', error)
            return null
        }

        // Security: Verify user owns this goal
        if (goal.user_id !== user.id) {
            console.error('[ERROR getGoalById] Unauthorized access attempt')
            return null
        }

        // Fetch entries and milestones separately (handles schema cache issues)
        const [entries, milestones] = await Promise.all([
            fetchGoalEntries(goalId),
            fetchGoalMilestones(goalId)
        ])

        return {
            ...goal,
            goal_entries: entries,
            goal_milestones: milestones
        } as GoalWithDetails
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return null
        }
        throw error
    }
}

/**
 * Create a new goal
 * Backwards compatible - handles case where enhanced columns don't exist yet
 */
export async function createGoal(goalData: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> {
    console.log('[DEBUG createGoal] Input data:', goalData)

    const { client, user } = await getAuthenticatedClient()
    console.log('[DEBUG createGoal] User ID:', user.id)

    // Separate core fields from enhanced fields
    // Core fields exist in original schema
    const coreFields = {
        user_id: user.id,
        title: goalData.title,
        description: goalData.description ?? null,
        target_value: goalData.target_value ?? null,
        current_value: goalData.current_value ?? 0,
        unit: goalData.unit ?? null,
        period: goalData.period ?? 'weekly',
        is_completed: goalData.is_completed ?? false,
        start_date: goalData.start_date,
        end_date: goalData.end_date ?? null,
        category_id: goalData.category_id ?? null
    }

    // Enhanced fields from Expert Council update (may not exist in DB yet)
    const rawData = goalData as Record<string, unknown>
    const enhancedFields = {
        motivation: typeof rawData.motivation === 'string' ? rawData.motivation : null,
        identity_statement: typeof rawData.identity_statement === 'string' ? rawData.identity_statement : null,
        best_time_of_day: typeof rawData.best_time_of_day === 'string' ? rawData.best_time_of_day as 'morning' | 'afternoon' | 'evening' | 'anytime' : 'anytime' as const,
        difficulty_level: typeof rawData.difficulty_level === 'string' ? rawData.difficulty_level as 'easy' | 'medium' | 'hard' | 'extreme' : 'medium' as const,
        streak_count: 0,
        longest_streak: 0,
        last_activity_date: null as string | null
    }

    // First try with all fields (enhanced schema)
    const fullInsertData = { ...coreFields, ...enhancedFields }
    console.log('[DEBUG createGoal] Attempting with enhanced schema...')

    let result = await client
        .from('goals')
        .insert(fullInsertData)
        .select()
        .single()

    // If enhanced fields fail (schema not updated), fallback to core-only
    if (result.error && result.error.message.includes('schema cache')) {
        console.log('[DEBUG createGoal] Enhanced schema not available, falling back to core fields...')

        result = await client
            .from('goals')
            .insert(coreFields)
            .select()
            .single()
    }

    if (result.error) {
        console.error('[ERROR createGoal]:', result.error)
        throw new Error(`Failed to create goal: ${result.error.message}`)
    }

    console.log('[DEBUG createGoal] Successfully created goal:', result.data?.id)
    return result.data
}

/**
 * Update an existing goal
 */
export async function updateGoal(goalId: string, goalData: GoalUpdate): Promise<Goal | null> {
    const { client } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('goals')
        .update(goalData)
        .eq('id', goalId)
        .select()
        .single()

    if (error) {
        console.error('Error updating goal:', error)
        throw new Error(`Failed to update goal: ${error.message}`)
    }

    return data
}

/**
 * Delete a goal (cascades to milestones and entries)
 */
export async function deleteGoal(goalId: string): Promise<boolean> {
    const { client } = await getAuthenticatedClient()

    const { error } = await client
        .from('goals')
        .delete()
        .eq('id', goalId)

    if (error) {
        console.error('Error deleting goal:', error)
        throw new Error(`Failed to delete goal: ${error.message}`)
    }

    return true
}

/**
 * Toggle goal completion status
 */
export async function toggleGoalCompletion(goalId: string): Promise<Goal | null> {
    const { client } = await getAuthenticatedClient()

    // First get current status
    const { data: current, error: fetchError } = await client
        .from('goals')
        .select('is_completed')
        .eq('id', goalId)
        .single()

    if (fetchError || !current) {
        console.error('Error fetching goal status:', fetchError)
        return null
    }

    const newStatus = !current.is_completed

    const { data, error } = await client
        .from('goals')
        .update({
            is_completed: newStatus,
            current_value: newStatus ? null : undefined
        })
        .eq('id', goalId)
        .select()
        .single()

    if (error) {
        console.error('Error toggling goal:', error)
        throw new Error(`Failed to toggle goal: ${error.message}`)
    }

    return data
}

// =====================================================
// MILESTONE OPERATIONS
// =====================================================

/**
 * Get milestones for a goal
 */
export async function getMilestones(goalId: string): Promise<GoalMilestone[]> {
    try {
        const { client } = await getAuthenticatedClient()

        const { data, error } = await client
            .from('goal_milestones')
            .select('*')
            .eq('goal_id', goalId)
            .order('sort_order', { ascending: true })

        if (error) {
            console.error('Error fetching milestones:', error)
            return []
        }

        return data || []
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return []
        }
        throw error
    }
}

/**
 * Create a new milestone
 */
export async function createMilestone(
    goalId: string,
    milestoneData: Omit<GoalMilestoneInsert, 'goal_id'>
): Promise<GoalMilestone | null> {
    const { client } = await getAuthenticatedClient()

    // Get next sort order
    const { data: existing } = await client
        .from('goal_milestones')
        .select('sort_order')
        .eq('goal_id', goalId)
        .order('sort_order', { ascending: false })
        .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0

    const { data, error } = await client
        .from('goal_milestones')
        .insert({
            ...milestoneData,
            goal_id: goalId,
            sort_order: milestoneData.sort_order ?? nextOrder
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating milestone:', error)
        throw new Error(`Failed to create milestone: ${error.message}`)
    }

    return data
}

/**
 * Toggle milestone completion
 */
export async function toggleMilestone(milestoneId: string): Promise<GoalMilestone | null> {
    const { client } = await getAuthenticatedClient()

    // First get current status
    const { data: current, error: fetchError } = await client
        .from('goal_milestones')
        .select('is_completed')
        .eq('id', milestoneId)
        .single()

    if (fetchError || !current) {
        console.error('Error fetching milestone status:', fetchError)
        return null
    }

    const newStatus = !current.is_completed

    const { data, error } = await client
        .from('goal_milestones')
        .update({
            is_completed: newStatus,
            completed_at: newStatus ? new Date().toISOString() : null
        })
        .eq('id', milestoneId)
        .select()
        .single()

    if (error) {
        console.error('Error toggling milestone:', error)
        throw new Error(`Failed to toggle milestone: ${error.message}`)
    }

    return data
}

/**
 * Update a milestone
 */
export async function updateMilestone(
    milestoneId: string,
    milestoneData: GoalMilestoneUpdate
): Promise<GoalMilestone | null> {
    const { client } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('goal_milestones')
        .update(milestoneData)
        .eq('id', milestoneId)
        .select()
        .single()

    if (error) {
        console.error('Error updating milestone:', error)
        throw new Error(`Failed to update milestone: ${error.message}`)
    }

    return data
}

/**
 * Delete a milestone
 */
export async function deleteMilestone(milestoneId: string): Promise<boolean> {
    const { client } = await getAuthenticatedClient()

    const { error } = await client
        .from('goal_milestones')
        .delete()
        .eq('id', milestoneId)

    if (error) {
        console.error('Error deleting milestone:', error)
        throw new Error(`Failed to delete milestone: ${error.message}`)
    }

    return true
}

// =====================================================
// PROGRESS ENTRY OPERATIONS
// =====================================================

/**
 * Log progress for a goal
 * 
 * WORKAROUND: goal_entries table may not exist in Supabase schema cache.
 * Falls back to directly updating goal's current_value if table unavailable.
 */
export async function logProgress(
    goalId: string,
    value: number,
    notes?: string
): Promise<GoalEntry | null> {
    const { user } = await getAuthenticatedClient()
    const adminClient = createAdminClient()

    // First, get the current goal to verify ownership and get current_value
    const { data: goal, error: goalFetchError } = await adminClient
        .from('goals')
        .select('id, user_id, current_value, target_value')
        .eq('id', goalId)
        .single()

    if (goalFetchError || !goal) {
        console.error('[ERROR logProgress] Goal not found:', goalFetchError)
        throw new Error('Goal not found')
    }

    // Security check: verify user owns this goal
    if (goal.user_id !== user.id) {
        console.error('[ERROR logProgress] Unauthorized access attempt')
        throw new Error('Unauthorized: You do not own this goal')
    }

    // Try to insert into goal_entries table
    let entry: GoalEntry | null = null
    let useDirectUpdate = false

    try {
        const { data: entryData, error: entryError } = await adminClient
            .from('goal_entries')
            .insert({
                goal_id: goalId,
                value,
                notes: notes || null,
                logged_at: new Date().toISOString()
            })
            .select()
            .single()

        if (entryError) {
            // Check if it's schema cache error (table doesn't exist)
            if (entryError.message.includes('schema cache') || entryError.code === 'PGRST200') {
                console.warn('[WARN logProgress] goal_entries table not in schema cache, using direct update')
                useDirectUpdate = true
            } else {
                console.error('[ERROR logProgress] Entry insert failed:', entryError)
                throw new Error(`Failed to log progress: ${entryError.message}`)
            }
        } else {
            entry = entryData
        }
    } catch (err) {
        // Catch any other errors and fall back to direct update
        const errorMessage = err instanceof Error ? err.message : String(err)
        if (errorMessage.includes('schema cache') || errorMessage.includes('PGRST200')) {
            console.warn('[WARN logProgress] Falling back to direct goal update')
            useDirectUpdate = true
        } else {
            throw err
        }
    }

    // Calculate new current_value
    const currentValue = typeof goal.current_value === 'number' ? goal.current_value : 0
    const newValue = currentValue + value

    // Update goal's current_value
    const { data: updatedGoal, error: updateError } = await adminClient
        .from('goals')
        .update({
            current_value: newValue,
            updated_at: new Date().toISOString()
        })
        .eq('id', goalId)
        .select()
        .single()

    if (updateError) {
        console.error('[ERROR logProgress] Goal update failed:', updateError)
        throw new Error(`Failed to update goal progress: ${updateError.message}`)
    }

    console.log('[DEBUG logProgress] Progress logged successfully:', {
        goalId,
        addedValue: value,
        newTotal: newValue,
        usedDirectUpdate: useDirectUpdate
    })

    // If we used direct update (no entry table), return a synthetic entry object
    if (useDirectUpdate) {
        return {
            id: crypto.randomUUID(),
            goal_id: goalId,
            value,
            notes: notes || null,
            logged_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        } as GoalEntry
    }

    return entry
}

/**
 * Get progress history for a goal
 * 
 * WORKAROUND: Returns empty array if goal_entries table is unavailable
 */
export async function getProgressHistory(
    goalId: string,
    days: number = 30
): Promise<GoalEntry[]> {
    try {
        const { user } = await getAuthenticatedClient()
        const adminClient = createAdminClient()

        // Verify goal ownership first
        const { data: goal } = await adminClient
            .from('goals')
            .select('user_id')
            .eq('id', goalId)
            .single()

        if (!goal || goal.user_id !== user.id) {
            console.warn('[WARN getProgressHistory] Goal not found or unauthorized')
            return []
        }

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        try {
            const { data, error } = await adminClient
                .from('goal_entries')
                .select('*')
                .eq('goal_id', goalId)
                .gte('logged_at', startDate.toISOString())
                .order('logged_at', { ascending: true })

            if (error) {
                // Handle schema cache error gracefully
                if (error.message.includes('schema cache') || error.code === 'PGRST200') {
                    console.warn('[WARN getProgressHistory] goal_entries table not available')
                    return []
                }
                console.error('[ERROR getProgressHistory]:', error)
                return []
            }

            return data || []
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            if (errorMessage.includes('schema cache') || errorMessage.includes('PGRST200')) {
                console.warn('[WARN getProgressHistory] Returning empty array - table unavailable')
                return []
            }
            throw err
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return []
        }
        throw error
    }
}

/**
 * Delete a progress entry
 * 
 * WORKAROUND: Returns true if goal_entries table is unavailable (nothing to delete)
 */
export async function deleteProgressEntry(entryId: string): Promise<boolean> {
    try {
        const { user } = await getAuthenticatedClient()
        const adminClient = createAdminClient()

        // Get entry to know which goal to update
        let entry: { goal_id: string; value: number | null } | null = null

        try {
            const { data } = await adminClient
                .from('goal_entries')
                .select('goal_id, value')
                .eq('id', entryId)
                .single()
            entry = data
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err)
            if (errorMessage.includes('schema cache') || errorMessage.includes('PGRST200')) {
                console.warn('[WARN deleteProgressEntry] goal_entries table not available')
                return true // Nothing to delete if table doesn't exist
            }
            throw err
        }

        if (!entry) {
            return false
        }

        // Verify goal ownership
        const { data: goal } = await adminClient
            .from('goals')
            .select('user_id, current_value')
            .eq('id', entry.goal_id)
            .single()

        if (!goal || goal.user_id !== user.id) {
            console.error('[ERROR deleteProgressEntry] Unauthorized')
            throw new Error('Unauthorized: You do not own this goal')
        }

        const { error } = await adminClient
            .from('goal_entries')
            .delete()
            .eq('id', entryId)

        if (error) {
            if (error.message.includes('schema cache') || error.code === 'PGRST200') {
                console.warn('[WARN deleteProgressEntry] Cannot delete - table unavailable')
                return true
            }
            console.error('[ERROR deleteProgressEntry]:', error)
            throw new Error(`Failed to delete entry: ${error.message}`)
        }

        // Update goal's current_value by subtracting the deleted value
        const currentValue = typeof goal.current_value === 'number' ? goal.current_value : 0
        const deletedValue = typeof entry.value === 'number' ? entry.value : 0
        const newValue = Math.max(0, currentValue - deletedValue)

        await adminClient
            .from('goals')
            .update({
                current_value: newValue,
                updated_at: new Date().toISOString()
            })
            .eq('id', entry.goal_id)

        console.log('[DEBUG deleteProgressEntry] Entry deleted, goal updated:', {
            entryId,
            goalId: entry.goal_id,
            removedValue: deletedValue,
            newTotal: newValue
        })

        return true
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return false
        }
        throw error
    }
}

// =====================================================
// GOAL TEMPLATE OPERATIONS
// =====================================================

interface ActionResult<T> {
    data: T | null
    error: string | null
}

/**
 * Get all goal templates, optionally filtered by category
 */
export async function getGoalTemplates(
    categorySlug?: string
): Promise<ActionResult<GoalTemplate[]>> {
    try {
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        let query = client
            .from('goal_templates')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true })

        if (categorySlug) {
            query = query.eq('category_slug', categorySlug)
        }

        const { data, error } = await query

        if (error) {
            // Table might not exist yet
            if (error.message?.includes('relation') || error.code === '42P01') {
                return { data: [], error: null }
            }
            return { data: null, error: error.message }
        }

        return { data: (data ?? []) as GoalTemplate[], error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Goal şablonları yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Get a single goal template by slug with linked quest templates
 */
export async function getGoalTemplateBySlug(
    slug: string
): Promise<ActionResult<GoalTemplateWithQuests | null>> {
    try {
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        // Get goal template
        const { data: goalTemplate, error: goalError } = await client
            .from('goal_templates')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single()

        if (goalError || !goalTemplate) {
            return { data: null, error: goalError?.message || 'Şablon bulunamadı' }
        }

        // Get linked quest templates
        const { data: questTemplates } = await client
            .from('quest_templates')
            .select('*')
            .eq('goal_template_id', goalTemplate.id)
            .order('sort_order', { ascending: true })

        return {
            data: {
                ...(goalTemplate as GoalTemplate),
                quest_templates: (questTemplates ?? []) as QuestTemplate[]
            },
            error: null
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Goal şablonu yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Get all unique categories from goal templates
 */
export async function getGoalTemplateCategories(): Promise<ActionResult<string[]>> {
    try {
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        const { data, error } = await client
            .from('goal_templates')
            .select('category_slug')
            .eq('is_active', true)
            .order('category_slug')

        if (error) {
            if (error.message?.includes('relation') || error.code === '42P01') {
                return { data: [], error: null }
            }
            return { data: null, error: error.message }
        }

        // Get unique categories
        const uniqueCategories = [...new Set((data ?? []).map((d: { category_slug: string }) => d.category_slug))] as string[]
        return { data: uniqueCategories, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Kategoriler yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Create a goal from a template and auto-generate linked quests
 */
export async function createGoalFromTemplate(
    templateId: string,
    customizations?: {
        title?: string
        description?: string
        target_value?: number
        start_date?: string
        end_date?: string
    }
): Promise<ActionResult<{ goal: Goal; questsCreated: number }>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        // 1. Get the goal template
        const { data: template, error: templateError } = await client
            .from('goal_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (templateError || !template) {
            return { data: null, error: 'Goal şablonu bulunamadı' }
        }

        const typedTemplate = template as GoalTemplate

        // 2. Calculate dates
        const startDate = customizations?.start_date || new Date().toISOString().split('T')[0]
        const endDate = customizations?.end_date || (() => {
            const end = new Date()
            end.setDate(end.getDate() + typedTemplate.default_duration_days)
            return end.toISOString().split('T')[0]
        })()

        // 3. Create the goal
        const goalData: GoalInsert = {
            user_id: user.id,
            goal_template_id: typedTemplate.id,
            title: customizations?.title ?? typedTemplate.title,
            description: customizations?.description ?? typedTemplate.description,
            target_value: customizations?.target_value ?? typedTemplate.default_target_value,
            current_value: 0,
            unit: typedTemplate.metric_unit,
            period: typedTemplate.default_period,
            start_date: startDate,
            end_date: endDate,
            metric_unit: typedTemplate.metric_unit,
            metric_name: typedTemplate.metric_name,
            is_completed: false
        }

        const { data: goal, error: goalError } = await supabase
            .from('goals')
            .insert(goalData)
            .select()
            .single()

        if (goalError || !goal) {
            return { data: null, error: goalError?.message || 'Goal oluşturulurken hata oluştu' }
        }

        // 4. Get linked quest templates
        const { data: questTemplates, error: questTemplatesError } = await client
            .from('quest_templates')
            .select('id')
            .eq('goal_template_id', typedTemplate.id)

        // DEBUG: Log quest template linking
        console.log('[createGoalFromTemplate] Goal Template ID:', typedTemplate.id)
        console.log('[createGoalFromTemplate] Goal Template Slug:', typedTemplate.slug)
        console.log('[createGoalFromTemplate] Quest Templates Found:', questTemplates?.length ?? 0)
        console.log('[createGoalFromTemplate] Quest Templates Error:', questTemplatesError?.message ?? 'None')
        if (questTemplates && questTemplates.length > 0) {
            console.log('[createGoalFromTemplate] Quest Template IDs:', questTemplates.map((qt: { id: string }) => qt.id))
        }

        // 5. Create quests from templates
        let questsCreated = 0
        let templateIdsToCreate: string[] = []

        if (questTemplates && questTemplates.length > 0) {
            templateIdsToCreate = questTemplates.map((qt: { id: string }) => qt.id)
            console.log('[createGoalFromTemplate] Using linked quest templates:', templateIdsToCreate.length)
        } else {
            // FALLBACK: If no quests linked via goal_template_id, try category_slug match
            console.log('[createGoalFromTemplate] No linked quests, trying category_slug fallback...')

            const { data: categoryQuests } = await client
                .from('quest_templates')
                .select('id')
                .eq('category_slug', typedTemplate.category_slug)
                .eq('is_recurring_default', true)
                .limit(5)  // Get first 5 recurring quests from same category

            if (categoryQuests && categoryQuests.length > 0) {
                templateIdsToCreate = categoryQuests.map((qt: { id: string }) => qt.id)
                console.log('[createGoalFromTemplate] FALLBACK: Found', templateIdsToCreate.length, 'quests via category_slug:', typedTemplate.category_slug)
            } else {
                console.log('[createGoalFromTemplate] WARNING: No quest templates found even with category fallback!')
            }
        }

        // Create quests if we have any
        if (templateIdsToCreate.length > 0) {
            console.log('[createGoalFromTemplate] Creating quests from template IDs:', templateIdsToCreate)
            const questResult = await createQuestsFromTemplates(templateIdsToCreate, goal.id)

            console.log('[createGoalFromTemplate] Quest Result:', questResult.data?.length ?? 0, 'created, error:', questResult.error ?? 'None')
            if (questResult.data) {
                questsCreated = questResult.data.length
            }
        } else {
            console.log('[createGoalFromTemplate] ERROR: No quest templates to create!')
        }

        revalidatePath('/')
        return {
            data: {
                goal: goal as Goal,
                questsCreated
            },
            error: null
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Goal oluşturulurken hata oluştu'
        return { data: null, error: message }
    }
}

// =====================================================
// GOAL PROGRESS HISTORY (Timeline + Stats)
// =====================================================

/**
 * Timeline event types for goal progress visualization
 */
export interface ProgressTimelineEvent {
    id: string
    type: 'quest_completion' | 'progress_log' | 'milestone_reached'
    title: string
    emoji: string
    value: number | null
    xpEarned: number | null
    timestamp: Date
    metadata?: {
        questId?: string
        streakCount?: number
        notes?: string
        difficulty?: 'easy' | 'medium' | 'hard'
    }
}

/**
 * Goal progress stats summary
 */
export interface GoalProgressStats {
    totalXpEarned: number
    questsCompleted: number
    totalProgressLogged: number
    activeDays: number
}

/**
 * Get comprehensive progress history for a goal
 * Includes timeline events, linked quests, and summary stats
 */
export async function getGoalProgressHistory(goalId: string): Promise<ActionResult<{
    timeline: ProgressTimelineEvent[]
    linkedQuests: DailyQuest[]
    stats: GoalProgressStats
}>> {
    try {
        const { user } = await getAuthenticatedClient()
        const adminClient = createAdminClient()

        // Verify goal ownership
        const { data: goal, error: goalError } = await adminClient
            .from('goals')
            .select('id, user_id, title')
            .eq('id', goalId)
            .single()

        if (goalError || !goal) {
            return { data: null, error: 'Hedef bulunamadı' }
        }

        if (goal.user_id !== user.id) {
            return { data: null, error: 'Bu hedefe erişim yetkiniz yok' }
        }

        // Fetch all data in parallel
        const [questsResult, completionsResult, entriesResult, milestonesResult] = await Promise.all([
            // 1. Linked quests (active + completed)
            adminClient
                .from('daily_quests')
                .select('*')
                .eq('goal_id', goalId)
                .eq('user_id', user.id)
                .order('sort_order', { ascending: true }),

            // 2. Quest completions for this goal
            adminClient
                .from('quest_completions')
                .select(`
                    id,
                    quest_id,
                    completed_date,
                    completed_at,
                    xp_earned,
                    base_xp,
                    streak_bonus_xp,
                    streak_count,
                    notes,
                    daily_quests!inner (title, emoji, difficulty)
                `)
                .eq('goal_id', goalId)
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
                .limit(50),

            // 3. Progress log entries
            adminClient
                .from('goal_entries')
                .select('*')
                .eq('goal_id', goalId)
                .order('logged_at', { ascending: false })
                .limit(50),

            // 4. Milestones (for milestone_reached events)
            adminClient
                .from('goal_milestones')
                .select('*')
                .eq('goal_id', goalId)
                .eq('is_completed', true)
                .order('completed_at', { ascending: false })
        ])

        // Handle potential schema cache errors gracefully
        const linkedQuests = questsResult.data || []
        const completions = completionsResult.error?.message?.includes('schema cache')
            ? []
            : completionsResult.data || []
        const entries = entriesResult.error?.message?.includes('schema cache')
            ? []
            : entriesResult.data || []
        const completedMilestones = milestonesResult.error?.message?.includes('schema cache')
            ? []
            : milestonesResult.data || []

        // Build timeline events
        const timeline: ProgressTimelineEvent[] = []

        // Add quest completion events
        for (const completion of completions) {
            const questInfo = completion.daily_quests as unknown as {
                title: string
                emoji: string
                difficulty: 'easy' | 'medium' | 'hard'
            } | null

            timeline.push({
                id: completion.id,
                type: 'quest_completion',
                title: questInfo?.title || 'Görev tamamlandı',
                emoji: questInfo?.emoji || '✅',
                value: null,
                xpEarned: completion.xp_earned,
                timestamp: new Date(completion.completed_at),
                metadata: {
                    questId: completion.quest_id,
                    streakCount: completion.streak_count,
                    notes: completion.notes || undefined,
                    difficulty: questInfo?.difficulty
                }
            })
        }

        // Add progress log events
        for (const entry of entries) {
            timeline.push({
                id: entry.id,
                type: 'progress_log',
                title: `+${entry.value} ilerleme kaydedildi`,
                emoji: '📊',
                value: entry.value,
                xpEarned: null,
                timestamp: new Date(entry.logged_at),
                metadata: {
                    notes: entry.notes || undefined
                }
            })
        }

        // Add milestone events
        for (const milestone of completedMilestones) {
            if (milestone.completed_at) {
                timeline.push({
                    id: milestone.id,
                    type: 'milestone_reached',
                    title: milestone.title,
                    emoji: '🏆',
                    value: milestone.target_value,
                    xpEarned: null,
                    timestamp: new Date(milestone.completed_at),
                    metadata: {}
                })
            }
        }

        // Sort timeline by timestamp (newest first)
        timeline.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        // Calculate stats
        const totalXpEarned = completions.reduce((sum, c) => sum + (c.xp_earned || 0), 0)
        const questsCompleted = completions.length
        const totalProgressLogged = entries.reduce((sum, e) => sum + (e.value || 0), 0)

        // Calculate unique active days
        const uniqueDays = new Set<string>()
        for (const c of completions) {
            uniqueDays.add(c.completed_date)
        }
        for (const e of entries) {
            uniqueDays.add(new Date(e.logged_at).toISOString().split('T')[0])
        }
        const activeDays = uniqueDays.size

        return {
            data: {
                timeline,
                linkedQuests: linkedQuests as DailyQuest[],
                stats: {
                    totalXpEarned,
                    questsCompleted,
                    totalProgressLogged,
                    activeDays
                }
            },
            error: null
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'İlerleme geçmişi yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

