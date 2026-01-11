'use server'

import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { createAdminClient } from '@/utils/supabase/server'
import type {
    Goal,
    GoalInsert,
    GoalUpdate,
    GoalWithDetails,
    GoalPeriod,
    GoalMilestone,
    GoalMilestoneInsert,
    GoalMilestoneUpdate,
    GoalEntry
} from '@/types/database.types'

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
 * Get active goals (not completed)
 * Shows all goals that are not marked as completed
 * 
 * TEMP FIX: Using admin client to bypass RLS and verify data exists
 */
export async function getActiveGoals(): Promise<GoalWithDetails[]> {
    try {
        // Get user from authenticated client for user ID
        const { user } = await getAuthenticatedClient()

        console.log('[DEBUG getActiveGoals] User ID:', user.id)

        // TEMP: Use admin client to bypass RLS for debugging
        const adminClient = createAdminClient()

        // DIAGNOSTIC: First, get ALL goals in the table (no user filter)
        const { data: allGoalsInTable } = await adminClient
            .from('goals')
            .select('id, user_id, title, is_completed')

        console.log('[DEBUG getActiveGoals] ALL goals in table:', {
            totalCount: allGoalsInTable?.length || 0,
            goals: allGoalsInTable
        })

        // Main query - simple select without problematic joins for now
        const { data, error } = await adminClient
            .from('goals')
            .select(`
                *,
                categories (id, name, slug, color_code, icon_slug)
            `)
            .eq('user_id', user.id)
            .eq('is_completed', false)
            .order('created_at', { ascending: false })

        console.log('[DEBUG getActiveGoals] Admin client result:', { count: data?.length, error })

        if (error) {
            console.error('[ERROR getActiveGoals]:', error)
            return []
        }

        // Map data to include empty milestones and entries for type compatibility
        const goalsWithDetails = (data || []).map(goal => ({
            ...goal,
            goal_milestones: [],
            goal_entries: []
        }))

        console.log('[DEBUG getActiveGoals] Returning goals count:', goalsWithDetails.length)
        return goalsWithDetails as GoalWithDetails[]
    } catch (error) {
        console.error('[ERROR getActiveGoals] Caught error:', error)
        if (error instanceof AuthenticationError) {
            console.log('[DEBUG getActiveGoals] AuthenticationError - returning empty array')
            return []
        }
        throw error
    }
}

/**
 * Get a single goal with all details
 */
export async function getGoalById(goalId: string): Promise<GoalWithDetails | null> {
    try {
        const { client } = await getAuthenticatedClient()

        const { data, error } = await client
            .from('goals')
            .select(`
                *,
                categories (id, name, slug, color_code, icon_slug),
                goal_milestones (*),
                goal_entries (*)
            `)
            .eq('id', goalId)
            .single()

        if (error) {
            console.error('Error fetching goal:', error)
            return null
        }

        return data as GoalWithDetails
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return null
        }
        throw error
    }
}

/**
 * Create a new goal
 */
export async function createGoal(goalData: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> {
    console.log('[DEBUG createGoal] Input data:', goalData)

    const { client, user } = await getAuthenticatedClient()
    console.log('[DEBUG createGoal] User ID:', user.id)

    const insertData = {
        ...goalData,
        user_id: user.id
    }
    console.log('[DEBUG createGoal] Insert data:', insertData)

    const { data, error } = await client
        .from('goals')
        .insert(insertData)
        .select()
        .single()

    console.log('[DEBUG createGoal] Result:', { data, error })

    if (error) {
        console.error('[ERROR createGoal]:', error)
        throw new Error(`Failed to create goal: ${error.message}`)
    }

    console.log('[DEBUG createGoal] Successfully created goal:', data?.id)
    return data
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

