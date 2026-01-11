'use server'

import { getAuthenticatedClient, ensureDemoUserExists } from '@/lib/auth'
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

// Flag to track if demo user check has been done this session
let demoUserChecked = false

/**
 * Initialize demo user if needed (called once per session)
 */
async function initDemoUser(): Promise<void> {
    if (demoUserChecked) return

    await ensureDemoUserExists()
    demoUserChecked = true
}

// =====================================================
// GOAL CRUD OPERATIONS
// =====================================================

/**
 * Fetch all goals for current user, optionally filtered by period
 */
export async function getGoals(period?: GoalPeriod): Promise<GoalWithDetails[]> {
    await initDemoUser()
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
}

/**
 * Get active goals (not completed, within date range)
 */
export async function getActiveGoals(): Promise<GoalWithDetails[]> {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    const today = new Date().toISOString().split('T')[0]

    // DEBUG: Log user info
    console.log('🎯 getActiveGoals - User ID:', user.id, 'isDemo:', user.isDemo, 'today:', today)

    const { data, error } = await client
        .from('goals')
        .select(`
            *,
            categories (id, name, slug, color_code, icon_slug),
            goal_milestones (*),
            goal_entries (*)
        `)
        .eq('user_id', user.id)
        .eq('is_completed', false)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('start_date', { ascending: true })

    // DEBUG: Log query results
    console.log('🎯 getActiveGoals - Found:', data?.length || 0, 'goals, Error:', error?.message || 'none')

    if (error) {
        console.error('Error fetching active goals:', error)
        return []
    }

    return (data || []) as GoalWithDetails[]
}

/**
 * Get a single goal with all details
 */
export async function getGoalById(goalId: string): Promise<GoalWithDetails | null> {
    await initDemoUser()
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
}

/**
 * Create a new goal
 */
export async function createGoal(goalData: Omit<GoalInsert, 'user_id'>): Promise<Goal | null> {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('goals')
        .insert({
            ...goalData,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating goal:', error)
        throw new Error(`Failed to create goal: ${error.message}`)
    }

    return data
}

/**
 * Update an existing goal
 */
export async function updateGoal(goalId: string, goalData: GoalUpdate): Promise<Goal | null> {
    await initDemoUser()
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
    await initDemoUser()
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
    await initDemoUser()
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
            current_value: newStatus ? null : undefined // Reset if uncompleting
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
    await initDemoUser()
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
}

/**
 * Create a new milestone
 */
export async function createMilestone(
    goalId: string,
    milestoneData: Omit<GoalMilestoneInsert, 'goal_id'>
): Promise<GoalMilestone | null> {
    await initDemoUser()
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
    await initDemoUser()
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
    await initDemoUser()
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
    await initDemoUser()
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
 */
export async function logProgress(
    goalId: string,
    value: number,
    notes?: string
): Promise<GoalEntry | null> {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { data: entry, error: entryError } = await client
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
        console.error('Error logging progress:', entryError)
        throw new Error(`Failed to log progress: ${entryError.message}`)
    }

    // Update goal's current_value with the sum of all entries
    const { data: entries } = await client
        .from('goal_entries')
        .select('value')
        .eq('goal_id', goalId)

    if (entries) {
        const totalValue = entries.reduce((sum: number, e: { value: number | null }) => sum + (e.value || 0), 0)

        await client
            .from('goals')
            .update({ current_value: totalValue })
            .eq('id', goalId)
    }

    return entry
}

/**
 * Get progress history for a goal
 */
export async function getProgressHistory(
    goalId: string,
    days: number = 30
): Promise<GoalEntry[]> {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await client
        .from('goal_entries')
        .select('*')
        .eq('goal_id', goalId)
        .gte('logged_at', startDate.toISOString())
        .order('logged_at', { ascending: true })

    if (error) {
        console.error('Error fetching progress history:', error)
        return []
    }

    return data || []
}

/**
 * Delete a progress entry
 */
export async function deleteProgressEntry(entryId: string): Promise<boolean> {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    // Get entry to know which goal to update
    const { data: entry } = await client
        .from('goal_entries')
        .select('goal_id, value')
        .eq('id', entryId)
        .single()

    if (!entry) {
        return false
    }

    const { error } = await client
        .from('goal_entries')
        .delete()
        .eq('id', entryId)

    if (error) {
        console.error('Error deleting entry:', error)
        throw new Error(`Failed to delete entry: ${error.message}`)
    }

    // Update goal's current_value
    const { data: remainingEntries } = await client
        .from('goal_entries')
        .select('value')
        .eq('goal_id', entry.goal_id)

    if (remainingEntries) {
        const totalValue = remainingEntries.reduce((sum: number, e: { value: number | null }) => sum + (e.value || 0), 0)

        await client
            .from('goals')
            .update({ current_value: totalValue })
            .eq('id', entry.goal_id)
    }

    return true
}
