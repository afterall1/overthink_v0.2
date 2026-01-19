'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import type {
    DailyQuest,
    DailyQuestInsert,
    DailyQuestUpdate,
    QuestCompletion,
    QuestCompletionInsert,
    UserXpStats,
    UserXpStatsUpdate,
    QuestTemplate,
    CategorySlug
} from '@/types/database.types'
import {
    calculateQuestXp,
    calculateLevel,
    QUEST_XP,
    getTodayDateString
} from '@/lib/questEngine'
import { getCurrentDate } from '@/lib/timeService'
import { generateWeeklyBatch } from './weeklyQuests'

// =====================================================
// Types
// =====================================================

interface ActionResult<T> {
    data: T | null
    error: string | null
}

interface QuestCompletionResult {
    completion: QuestCompletion
    xpBreakdown: {
        baseXp: number
        difficultyBonus: number
        timeBonus: number
        streakBonus: number
        totalXp: number
    }
    newStreak: number
    isPerfectDay: boolean
    levelUp: boolean
}

// =====================================================
// Quest CRUD Operations
// =====================================================

/**
 * Create a new daily quest
 */
export async function createQuest(
    questData: Omit<DailyQuestInsert, 'user_id'>
): Promise<ActionResult<DailyQuest>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_quests')
            .insert({
                ...questData,
                user_id: user.id
            })
            .select()
            .single()

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest oluşturulurken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Get all quests for today (including recurring ones that apply)
 * 
 * IMPORTANT: This function now includes Weekly Batch Daily Distribution.
 * When called, it checks if today's quests from weekly_quest_batches have been
 * distributed to daily_quests. If not, it distributes them automatically.
 * This enables the "different quests each day" feature from ADR-025.
 * 
 * @param targetDate - Optional date string (YYYY-MM-DD) for Time Travel testing.
 *                     If provided, uses this date instead of the real date.
 */
export async function getQuestsForToday(targetDate?: string): Promise<ActionResult<DailyQuest[]>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        // Use targetDate if provided (for Time Travel), otherwise use real today
        const today = targetDate || getTodayDateString()
        // Calculate day of week from the target date
        const targetDateObj = targetDate ? new Date(targetDate + 'T12:00:00') : getCurrentDate()
        const dayOfWeek = targetDateObj.getDay()

        // ============================================================
        // PHASE 0: Auto-Regenerate Expired Weekly Batches
        // If a new week has started, generate fresh batches
        // ============================================================
        await checkAndRegenerateWeeklyBatches(user.id, today, supabase)

        // ============================================================
        // PHASE 1: Weekly Batch Daily Distribution
        // Check if today's quests from weekly batches need to be distributed
        // ============================================================
        await distributeWeeklyBatchQuestsForToday(user.id, today, supabase)

        // ============================================================
        // PHASE 2: Get one-time quests scheduled for today
        // ============================================================
        const { data: scheduledQuests, error: scheduledError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_recurring', false)
            .eq('scheduled_date', today)

        if (scheduledError) {
            return { data: null, error: scheduledError.message }
        }

        // ============================================================
        // PHASE 3: Get recurring quests (legacy support)
        // NOTE: New architecture uses is_recurring: false for all quests
        // This section remains for backward compatibility with older quests
        // ============================================================
        const { data: recurringQuests, error: recurringError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_recurring', true)

        if (recurringError) {
            return { data: null, error: recurringError.message }
        }

        // Filter recurring quests based on pattern
        const activeRecurring = (recurringQuests || []).filter((quest: DailyQuest) => {
            const pattern = quest.recurrence_pattern || 'daily'
            switch (pattern) {
                case 'daily':
                    return true
                case 'weekdays':
                    return dayOfWeek >= 1 && dayOfWeek <= 5
                case 'weekends':
                    return dayOfWeek === 0 || dayOfWeek === 6
                case 'mwf':
                    return [1, 3, 5].includes(dayOfWeek)
                case 'tts':
                    return [2, 4, 6].includes(dayOfWeek)
                case 'custom':
                    return quest.recurrence_days?.includes(dayOfWeek) ?? false
                default:
                    return true
            }
        })

        // ============================================================
        // PHASE 4: Filter out quests whose linked goal has ended
        // ============================================================
        const goalLinkedQuestIds = [...(scheduledQuests || []), ...activeRecurring]
            .filter(q => q.goal_id)
            .map(q => q.goal_id as string)

        let activeGoalIds: Set<string> = new Set()
        if (goalLinkedQuestIds.length > 0) {
            const uniqueGoalIds = [...new Set(goalLinkedQuestIds)]
            const { data: activeGoals } = await supabase
                .from('goals')
                .select('id')
                .in('id', uniqueGoalIds)
                .or(`end_date.is.null,end_date.gte.${today}`)

            activeGoalIds = new Set((activeGoals || []).map(g => g.id))
        }

        // Filter quests: show if no goal_id OR goal is still active
        const filteredScheduled = (scheduledQuests || []).filter(q =>
            !q.goal_id || activeGoalIds.has(q.goal_id)
        )
        const filteredRecurring = activeRecurring.filter(q =>
            !q.goal_id || activeGoalIds.has(q.goal_id)
        )

        // ============================================================
        // PHASE 5: Check completion status for today
        // ============================================================
        const allQuests = [...filteredScheduled, ...filteredRecurring]
        const questIds = allQuests.map(q => q.id)

        if (questIds.length > 0) {
            const { data: completions } = await supabase
                .from('quest_completions')
                .select('quest_id, completed_at')
                .eq('user_id', user.id)
                .eq('completed_date', today)
                .in('quest_id', questIds)

            const completionMap = new Map<string, string>()
            for (const c of completions || []) {
                if (c.completed_at) {
                    completionMap.set(c.quest_id, c.completed_at)
                }
            }

            return {
                data: allQuests.map(quest => {
                    const completedAt = completionMap.get(quest.id)
                    if (completedAt) {
                        // Quest was completed today
                        return {
                            ...quest,
                            status: 'completed' as const,
                            completed_at: completedAt
                        }
                    }
                    // CRITICAL FIX: For recurring quests, always reset status to 'pending'
                    // The DB may have stale 'completed' status from previous days
                    // The source of truth for recurring quests is quest_completions table
                    if (quest.is_recurring) {
                        return {
                            ...quest,
                            status: 'pending' as const,
                            completed_at: null
                        }
                    }
                    return quest
                }) as DailyQuest[],
                error: null
            }
        }

        return { data: allQuests, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Questler yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Distribute today's quests from weekly_quest_batches to daily_quests
 * This is the core mechanism for "different quests each day" feature
 * 
 * @param userId - User ID
 * @param today - Today's date string (YYYY-MM-DD)
 * @param supabase - Supabase client
 */
async function distributeWeeklyBatchQuestsForToday(
    userId: string,
    today: string,
    supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
    try {
        // Get day of week key (monday, tuesday, etc.)
        // Calculate from the passed today parameter for Time Travel support
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
        type DayOfWeekKey = typeof dayNames[number]
        const todayDateObj = new Date(today + 'T12:00:00') // Add time to avoid timezone issues
        const todayDayKey: DayOfWeekKey = dayNames[todayDateObj.getDay()]

        // Find active weekly batches for this user
        const { data: activeBatches, error: batchError } = await (supabase as ReturnType<typeof createAdminClient>)
            .from('weekly_quest_batches' as 'goals') // Type assertion for custom table
            .select('id, goal_id, quests_data, week_start, week_end')
            .eq('user_id', userId)
            .eq('status', 'active')
            .lte('week_start', today)
            .gte('week_end', today)

        if (batchError || !activeBatches || activeBatches.length === 0) {
            return // No active batches, nothing to distribute
        }

        // For each active batch, check if today's quests are already distributed
        for (const batch of activeBatches) {
            const typedBatch = batch as unknown as {
                id: string
                goal_id: string
                quests_data: Record<DayOfWeekKey, {
                    quests: Array<{
                        title: string
                        description: string
                        emoji: string
                        difficulty: 'easy' | 'medium' | 'hard'
                        xp_reward: number
                        calorie_impact?: number
                        estimated_minutes?: number
                        scientific_rationale?: string
                        category?: string
                    }>
                }>
            }

            // Check if quests for this goal+date already exist
            const { data: existingQuests } = await supabase
                .from('daily_quests')
                .select('id')
                .eq('user_id', userId)
                .eq('goal_id', typedBatch.goal_id)
                .eq('scheduled_date', today)
                .eq('is_ai_suggested', true)
                .limit(1)

            if (existingQuests && existingQuests.length > 0) {
                continue // Already distributed for today
            }

            // Get today's quests from the batch
            const todayQuests = typedBatch.quests_data?.[todayDayKey]?.quests

            if (!todayQuests || todayQuests.length === 0) {
                continue // No quests for today in this batch
            }

            // Create daily quests from weekly batch (is_recurring: false!)
            const questInserts = todayQuests.map((quest, index) => ({
                user_id: userId,
                goal_id: typedBatch.goal_id,
                title: quest.title,
                description: quest.description || '',
                emoji: quest.emoji || '🎯',
                difficulty: quest.difficulty || 'medium',
                xp_reward: quest.xp_reward || 20,
                calorie_impact: quest.calorie_impact || 0,
                estimated_minutes: quest.estimated_minutes || 15,
                scientific_rationale: quest.scientific_rationale || '',
                category: quest.category || 'habit',
                scheduled_date: today,
                is_recurring: false, // CRITICAL: Each day gets unique quests
                recurrence_pattern: null,
                status: 'pending' as const,
                is_ai_suggested: true,
                sort_order: index
            }))

            // Insert quests
            const { error: insertError } = await supabase
                .from('daily_quests')
                .insert(questInserts)

            if (insertError) {
                console.error(`[distributeWeeklyBatchQuestsForToday] Insert error for batch ${typedBatch.id}:`, insertError)
            } else {
                console.log(`[distributeWeeklyBatchQuestsForToday] Distributed ${questInserts.length} quests for ${todayDayKey}`)
            }
        }
    } catch (error) {
        // Non-blocking: Log error but don't fail the quest fetch
        console.error('[distributeWeeklyBatchQuestsForToday] Error:', error)
    }
}

/**
     * Check if weekly batches need regeneration and regenerate if needed
     * This ensures users always have fresh quests when a new week starts
     * 
     * @param userId - User ID
     * @param targetDate - Target date string (YYYY-MM-DD)
     * @param supabase - Supabase client
     */
async function checkAndRegenerateWeeklyBatches(
    userId: string,
    targetDate: string,
    supabase: ReturnType<typeof createAdminClient>
): Promise<void> {
    try {
        // 1. Get user's active goals that might need weekly batches
        const { data: activeGoals, error: goalsError } = await supabase
            .from('goals')
            .select('id, title')
            .eq('user_id', userId)
            .or(`end_date.is.null,end_date.gte.${targetDate}`)

        if (goalsError || !activeGoals || activeGoals.length === 0) {
            return // No active goals, nothing to regenerate
        }

        // 2. Check each goal for expired or missing batches
        for (const goal of activeGoals) {
            // Check if there's an active batch for this goal
            const { data: existingBatch, error: batchError } = await (supabase as ReturnType<typeof createAdminClient>)
                .from('weekly_quest_batches' as 'goals')
                .select('id, week_end, status')
                .eq('user_id', userId)
                .eq('goal_id', goal.id)
                .eq('status', 'active')
                .single()

            const typedBatch = existingBatch as unknown as {
                id: string
                week_end: string
                status: string
            } | null

            // 3. Regenerate if batch is missing or week_end has passed
            const needsRegeneration = !typedBatch ||
                batchError ||
                typedBatch.week_end < targetDate

            if (needsRegeneration) {
                console.log(`[checkAndRegenerateWeeklyBatches] Regenerating batch for goal "${goal.title}" (ID: ${goal.id})`)

                // Expire old batch if exists
                if (typedBatch) {
                    // weekly_quest_batches is a custom table not in generated types
                    // Use unknown conversion to avoid type errors
                    const client = supabase as unknown as {
                        from: (table: string) => {
                            update: (data: Record<string, unknown>) => {
                                eq: (column: string, value: string) => Promise<{ error: Error | null }>
                            }
                        }
                    }
                    await client.from('weekly_quest_batches').update({ status: 'expired' }).eq('id', typedBatch.id)
                }

                // Generate new batch - this is async but we don't wait for it
                // The daily distribution will happen on the next call
                try {
                    const targetDateObj = new Date(targetDate + 'T12:00:00')
                    await generateWeeklyBatch(goal.id, targetDateObj)
                    console.log(`[checkAndRegenerateWeeklyBatches] Successfully regenerated batch for goal "${goal.title}"`)
                } catch (genError) {
                    console.error(`[checkAndRegenerateWeeklyBatches] Failed to regenerate batch for goal ${goal.id}:`, genError)
                }
            }
        }
    } catch (error) {
        // Non-blocking: Log error but don't fail the quest fetch
        console.error('[checkAndRegenerateWeeklyBatches] Error:', error)
    }
}

/**
 * Get quests by goal ID
 */
export async function getQuestsByGoal(goalId: string): Promise<ActionResult<DailyQuest[]>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('goal_id', goalId)
            .order('sort_order', { ascending: true })

        if (error) {
            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Questler yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Update a quest
 */
export async function updateQuest(
    questId: string,
    updates: DailyQuestUpdate
): Promise<ActionResult<DailyQuest>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_quests')
            .update(updates)
            .eq('id', questId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest güncellenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Delete a quest and cascade delete all related data
 * 
 * This function:
 * 1. Gets all quest_completions for this quest
 * 2. Subtracts earned XP from user_xp_stats for each completion
 * 3. Rollbacks goal progress if quest was linked to a goal
 * 4. Deletes all quest_completions records
 * 5. Deletes the quest itself
 */
export async function deleteQuest(questId: string): Promise<ActionResult<void>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        // Step 1: Get the quest to check ownership and get goal_id
        const { data: quest, error: questFetchError } = await supabase
            .from('daily_quests')
            .select('id, user_id, goal_id, progress_contribution')
            .eq('id', questId)
            .eq('user_id', user.id)
            .single()

        if (questFetchError || !quest) {
            return { data: null, error: 'Quest bulunamadı veya erişim izniniz yok' }
        }

        // Step 2: Get all completions for this quest to calculate XP and progress to rollback
        const { data: completions, error: completionsError } = await supabase
            .from('quest_completions')
            .select('id, xp_earned, goal_id')
            .eq('quest_id', questId)
            .eq('user_id', user.id)

        if (completionsError) {
            console.error('[ERROR deleteQuest] Failed to fetch completions:', completionsError)
            return { data: null, error: completionsError.message }
        }

        const completionCount = completions?.length ?? 0
        const totalXpToSubtract = (completions || []).reduce((sum, c) => sum + (c.xp_earned || 0), 0)

        if (totalXpToSubtract > 0) {
            await updateUserXpStats(user.id, -totalXpToSubtract)
        }

        // Step 4: Rollback goal progress if quest was linked to a goal
        if (quest.goal_id && completionCount > 0) {
            // Calculate total progress contribution to subtract
            const progressPerCompletion = quest.progress_contribution ?? 1
            const totalProgressToSubtract = progressPerCompletion * completionCount

            // Get current goal value
            const { data: goal, error: goalError } = await supabase
                .from('goals')
                .select('current_value, user_id')
                .eq('id', quest.goal_id)
                .single()

            if (!goalError && goal && goal.user_id === user.id) {
                const currentValue = goal.current_value ?? 0
                const newValue = Math.max(0, currentValue - totalProgressToSubtract)

                await supabase
                    .from('goals')
                    .update({
                        current_value: newValue,
                        is_completed: false, // Reset completion status if progress reduced
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', quest.goal_id)
            }
        }

        // Step 5: Delete all quest_completions for this quest
        if (completionCount > 0) {
            const { error: deleteCompletionsError } = await supabase
                .from('quest_completions')
                .delete()
                .eq('quest_id', questId)
                .eq('user_id', user.id)

            if (deleteCompletionsError) {
                console.error('[ERROR deleteQuest] Failed to delete completions:', deleteCompletionsError)
                return { data: null, error: deleteCompletionsError.message }
            }
        }

        // Step 6: Delete the quest
        const { error: deleteQuestError } = await supabase
            .from('daily_quests')
            .delete()
            .eq('id', questId)
            .eq('user_id', user.id)

        if (deleteQuestError) {
            console.error('[ERROR deleteQuest] Failed to delete quest:', deleteQuestError)
            return { data: null, error: deleteQuestError.message }
        }

        revalidatePath('/')
        return { data: undefined, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest silinirken hata oluştu'
        console.error('[ERROR deleteQuest] Unexpected error:', message)
        return { data: null, error: message }
    }
}

// =====================================================
// Quest Completion
// =====================================================

/**
 * Complete a quest and award XP
 */
export async function completeQuest(
    questId: string,
    notes?: string
): Promise<ActionResult<QuestCompletionResult>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        const today = getTodayDateString()

        // 1. Get the quest
        const { data: quest, error: questError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('id', questId)
            .eq('user_id', user.id)
            .single()

        if (questError || !quest) {
            return { data: null, error: 'Quest bulunamadı' }
        }

        // 2. Check if already completed today
        const { data: existingCompletion } = await supabase
            .from('quest_completions')
            .select('id')
            .eq('quest_id', questId)
            .eq('completed_date', today)
            .single()

        if (existingCompletion) {
            return { data: null, error: 'Bu quest bugün zaten tamamlanmış' }
        }

        // 3. Get current streak for this quest
        const { data: recentCompletions } = await supabase
            .from('quest_completions')
            .select('completed_date, streak_count')
            .eq('quest_id', questId)
            .eq('user_id', user.id)
            .order('completed_date', { ascending: false })
            .limit(1)

        let newStreak = 1
        if (recentCompletions && recentCompletions.length > 0) {
            const lastCompletion = recentCompletions[0]
            const lastDate = new Date(lastCompletion.completed_date)
            const todayDate = new Date(today)
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
                newStreak = (lastCompletion.streak_count || 0) + 1
            } else if (diffDays > 1) {
                newStreak = 1 // Streak broken
            }
        }

        // 4. Calculate XP
        const xpBreakdown = calculateQuestXp(quest, newStreak, new Date())

        // 5. Create completion record
        const completionInsert: QuestCompletionInsert = {
            quest_id: questId,
            user_id: user.id,
            goal_id: quest.goal_id,
            completed_date: today,
            xp_earned: xpBreakdown.totalXp,
            base_xp: xpBreakdown.baseXp,
            streak_bonus_xp: xpBreakdown.streakBonus,
            time_bonus_xp: xpBreakdown.timeBonus,
            streak_count: newStreak,
            notes
        }

        const { data: completion, error: completionError } = await supabase
            .from('quest_completions')
            .insert(completionInsert)
            .select()
            .single()

        if (completionError) {
            return { data: null, error: completionError.message }
        }

        // 6. Update quest status (for non-recurring)
        if (!quest.is_recurring) {
            await supabase
                .from('daily_quests')
                .update({ status: 'completed', completed_at: new Date().toISOString() })
                .eq('id', questId)
        }

        // 7. Update user XP stats
        const xpUpdateResult = await updateUserXpStats(user.id, xpBreakdown.totalXp)
        const levelUp = xpUpdateResult.levelUp

        // 8. Check for perfect day
        const { data: todayQuests } = await supabase
            .from('daily_quests')
            .select('id')
            .eq('user_id', user.id)
            .or(`scheduled_date.eq.${today},is_recurring.eq.true`)

        const { data: todayCompletions } = await supabase
            .from('quest_completions')
            .select('quest_id')
            .eq('user_id', user.id)
            .eq('completed_date', today)

        const isPerfectDay = (todayQuests?.length || 0) > 0 &&
            (todayCompletions?.length || 0) >= (todayQuests?.length || 0)

        // 9. If perfect day achieved, award bonus XP
        if (isPerfectDay) {
            await updateUserXpStats(user.id, QUEST_XP.PERFECT_DAY)

            // Get current perfect_days_count and increment
            const { data: currentXpStats } = await supabase
                .from('user_xp_stats')
                .select('perfect_days_count')
                .eq('user_id', user.id)
                .single()

            await supabase
                .from('user_xp_stats')
                .update({
                    perfect_days_count: (currentXpStats?.perfect_days_count || 0) + 1,
                    last_perfect_day: today
                })
                .eq('user_id', user.id)
        }

        // 10. Update goal progress if quest is linked to a goal
        let momentumData: { momentum: number; streak: number; maturityDays: number } | null = null

        if (quest.goal_id) {
            // Get progress contribution from the quest (set from template)
            // Default to 1 if not set
            const progressContribution = quest.progress_contribution ?? 1

            // Get goal data
            const { data: goal } = await supabase
                .from('goals')
                .select('current_value, target_value, streak_count, longest_streak, habit_maturity_days, last_activity_date')
                .eq('id', quest.goal_id)
                .single()

            if (goal) {
                // Calculate new current_value - ALWAYS add progress contribution on completion
                const newValue = (goal.current_value ?? 0) + progressContribution
                const isNowCompleted = goal.target_value ? newValue >= goal.target_value : false

                // Calculate streak
                let newGoalStreak = goal.streak_count ?? 0
                const lastActivity = goal.last_activity_date
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                const yesterdayStr = yesterday.toISOString().split('T')[0]

                if (!lastActivity || lastActivity === yesterdayStr) {
                    newGoalStreak += 1
                } else if (lastActivity !== today) {
                    newGoalStreak = 1 // Reset streak if gap
                }
                // If activity is same day, streak stays the same

                // Streak multiplier
                const streakMultiplier =
                    newGoalStreak >= 21 ? 2.0 :
                        newGoalStreak >= 14 ? 1.6 :
                            newGoalStreak >= 7 ? 1.4 :
                                newGoalStreak >= 3 ? 1.2 : 1.0

                // Habit maturity
                const maturityDays = (goal.habit_maturity_days ?? 0) + (lastActivity !== today ? 1 : 0)
                const maturityScore =
                    maturityDays >= 21 ? 100 :
                        maturityDays >= 14 ? 75 :
                            maturityDays >= 7 ? 50 : 25

                // Get daily completion rate for this goal (including recurring quests)
                const { data: goalQuestsToday } = await supabase
                    .from('daily_quests')
                    .select('id, status, is_recurring, scheduled_date')
                    .eq('goal_id', quest.goal_id)

                // Filter to today's quests: either scheduled for today OR recurring
                const todayQuests = (goalQuestsToday || []).filter(q =>
                    q.is_recurring || q.scheduled_date === today
                )

                const goalTotal = todayQuests.length
                const goalCompleted = todayQuests.filter(q => q.status === 'completed').length
                const completionRate = goalTotal > 0 ? goalCompleted / goalTotal : 0

                // Early bird bonus (before 9 AM)
                const isEarlyBird = new Date().getHours() < 9

                // Calculate momentum score (0-100)
                const momentum = Math.min(100, Math.round(
                    (completionRate * 40) +
                    (streakMultiplier * 30) +
                    (maturityScore / 100 * 20) +
                    (isEarlyBird ? 10 : 0)
                ))

                // Update goal with all momentum data
                const { error: updateError } = await supabase
                    .from('goals')
                    .update({
                        current_value: newValue,
                        is_completed: isNowCompleted,
                        last_activity_date: today,
                        streak_count: newGoalStreak,
                        longest_streak: Math.max(newGoalStreak, goal.longest_streak ?? 0),
                        momentum_score: momentum,
                        habit_maturity_days: maturityDays
                    })
                    .eq('id', quest.goal_id)

                if (updateError && process.env.NODE_ENV === 'development') {
                    console.error('Goal update error:', updateError)
                }

                momentumData = { momentum, streak: newGoalStreak, maturityDays }
            }
        }

        revalidatePath('/')

        return {
            data: {
                completion,
                xpBreakdown,
                newStreak,
                isPerfectDay,
                levelUp
            },
            error: null
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest tamamlanırken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Skip a quest
 */
export async function skipQuest(questId: string): Promise<ActionResult<DailyQuest>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('daily_quests')
            .update({ status: 'skipped' })
            .eq('id', questId)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest atlanırken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Undo quest completion
 */
export async function undoQuestCompletion(
    questId: string,
    completionDate?: string
): Promise<ActionResult<void>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        const date = completionDate || getTodayDateString()

        // Get the completion to know XP to subtract
        const { data: completion } = await supabase
            .from('quest_completions')
            .select('xp_earned')
            .eq('quest_id', questId)
            .eq('user_id', user.id)
            .eq('completed_date', date)
            .single()

        if (completion) {
            // Subtract XP
            await updateUserXpStats(user.id, -(completion.xp_earned || 0))
        }

        // Get quest to check if linked to goal for progress rollback
        const { data: quest } = await supabase
            .from('daily_quests')
            .select('goal_id, progress_contribution')
            .eq('id', questId)
            .eq('user_id', user.id)
            .single()

        // Rollback goal progress if quest was linked to a goal
        if (quest?.goal_id && completion) {
            const progressToRollback = quest.progress_contribution ?? 1
            const { data: goal } = await supabase
                .from('goals')
                .select('current_value')
                .eq('id', quest.goal_id)
                .single()

            if (goal) {
                await supabase
                    .from('goals')
                    .update({
                        current_value: Math.max(0, (goal.current_value ?? 0) - progressToRollback),
                        is_completed: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', quest.goal_id)
            }
        }

        // Decrement quests_completed_count
        if (completion) {
            const { data: stats } = await supabase
                .from('user_xp_stats')
                .select('quests_completed_count')
                .eq('user_id', user.id)
                .single()

            if (stats) {
                await supabase
                    .from('user_xp_stats')
                    .update({
                        quests_completed_count: Math.max(0, (stats.quests_completed_count ?? 0) - 1)
                    })
                    .eq('user_id', user.id)
            }
        }

        // Delete completion
        const { error } = await supabase
            .from('quest_completions')
            .delete()
            .eq('quest_id', questId)
            .eq('user_id', user.id)
            .eq('completed_date', date)

        if (error) {
            return { data: null, error: error.message }
        }

        // Reset quest status
        await supabase
            .from('daily_quests')
            .update({ status: 'pending', completed_at: null })
            .eq('id', questId)

        revalidatePath('/')
        return { data: undefined, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Geri alma işlemi başarısız'
        return { data: null, error: message }
    }
}

// =====================================================
// User XP Stats
// =====================================================

/**
 * Get user XP stats
 */
export async function getUserXpStats(): Promise<ActionResult<UserXpStats>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { data, error } = await supabase
            .from('user_xp_stats')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error) {
            // Create stats if not exists
            if (error.code === 'PGRST116') {
                const { data: newStats, error: createError } = await supabase
                    .from('user_xp_stats')
                    .insert({ user_id: user.id })
                    .select()
                    .single()

                if (createError) {
                    return { data: null, error: createError.message }
                }

                return { data: newStats, error: null }
            }

            return { data: null, error: error.message }
        }

        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'XP istatistikleri yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Update user XP stats (internal helper)
 */
async function updateUserXpStats(
    userId: string,
    xpDelta: number
): Promise<{ levelUp: boolean }> {
    const supabase = createAdminClient()

    // Get current stats
    const { data: currentStats } = await supabase
        .from('user_xp_stats')
        .select('*')
        .eq('user_id', userId)
        .single()

    const currentXp = currentStats?.total_xp || 0
    const currentLevel = currentStats?.current_level || 1

    const newTotalXp = Math.max(0, currentXp + xpDelta)
    const newLevelInfo = calculateLevel(newTotalXp)
    const levelUp = newLevelInfo.currentLevel > currentLevel

    const updates: UserXpStatsUpdate = {
        total_xp: newTotalXp,
        current_level: newLevelInfo.currentLevel,
        xp_to_next_level: newLevelInfo.xpNeeded,
        xp_today: Math.max(0, (currentStats?.xp_today || 0) + xpDelta),
        xp_this_week: Math.max(0, (currentStats?.xp_this_week || 0) + xpDelta),
        xp_this_month: Math.max(0, (currentStats?.xp_this_month || 0) + xpDelta),
        quests_completed_count: xpDelta > 0
            ? (currentStats?.quests_completed_count || 0) + 1
            : currentStats?.quests_completed_count || 0,
        last_xp_earned_at: xpDelta > 0 ? new Date().toISOString() : currentStats?.last_xp_earned_at
    }

    if (currentStats) {
        await supabase
            .from('user_xp_stats')
            .update(updates)
            .eq('user_id', userId)
    } else {
        await supabase
            .from('user_xp_stats')
            .insert({ user_id: userId, ...updates })
    }

    return { levelUp }
}

/**
 * Get daily summary
 */
export async function getDailySummary(date?: string): Promise<ActionResult<{
    questsCompleted: number
    questsTotal: number
    xpEarned: number
    isPerfectDay: boolean
    streakStatus: 'maintained' | 'at_risk' | 'broken'
}>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        const targetDate = date || getTodayDateString()

        // Get today's quests
        const { data: quests } = await supabase
            .from('daily_quests')
            .select('id')
            .eq('user_id', user.id)
            .or(`scheduled_date.eq.${targetDate},is_recurring.eq.true`)

        // Get completions for today
        const { data: completions } = await supabase
            .from('quest_completions')
            .select('xp_earned')
            .eq('user_id', user.id)
            .eq('completed_date', targetDate)

        const questsTotal = quests?.length || 0
        const questsCompleted = completions?.length || 0
        const xpEarned = (completions || []).reduce((sum: number, c: { xp_earned: number | null }) => sum + (c.xp_earned || 0), 0)
        const isPerfectDay = questsTotal > 0 && questsCompleted >= questsTotal

        // Determine streak status
        let streakStatus: 'maintained' | 'at_risk' | 'broken' = 'maintained'
        const now = new Date()
        const hours = now.getHours()

        if (questsCompleted === 0) {
            if (hours >= 23) {
                streakStatus = 'broken'
            } else if (hours >= 20) {
                streakStatus = 'at_risk'
            }
        }

        return {
            data: {
                questsCompleted,
                questsTotal,
                xpEarned,
                isPerfectDay,
                streakStatus
            },
            error: null
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Günlük özet yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

// =====================================================
// Quest Templates
// =====================================================

/**
 * Get quest templates, optionally filtered by category or goal template
 * When goalTemplateId is provided, returns only quests linked to that goal
 */
export async function getQuestTemplates(
    categorySlug?: CategorySlug,
    goalTemplateId?: string
): Promise<ActionResult<QuestTemplate[]>> {
    try {
        const supabase = createAdminClient()

        // Note: quest_templates is a new table, using rpc or raw query
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        let query = client
            .from('quest_templates')
            .select('*')
            .order('sort_order', { ascending: true })

        // Filter by goal_template_id if provided (goal-specific quests)
        if (goalTemplateId) {
            query = query.eq('goal_template_id', goalTemplateId)
        }

        // Filter by category_slug if provided (fallback)
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

        return { data: (data ?? []) as QuestTemplate[], error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Quest şablonları yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Get all unique categories from templates
 */
export async function getTemplateCategories(): Promise<ActionResult<CategorySlug[]>> {
    try {
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        const { data, error } = await client
            .from('quest_templates')
            .select('category_slug')
            .order('category_slug')

        if (error) {
            if (error.message?.includes('relation') || error.code === '42P01') {
                return { data: [], error: null }
            }
            return { data: null, error: error.message }
        }

        // Get unique categories
        const uniqueCategories = [...new Set((data ?? []).map((d: { category_slug: string }) => d.category_slug))] as CategorySlug[]
        return { data: uniqueCategories, error: null }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Kategoriler yüklenirken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Create a quest from a template
 */
export async function createQuestFromTemplate(
    templateId: string,
    goalId: string | null,
    customizations?: Partial<Omit<DailyQuestInsert, 'user_id'>>
): Promise<ActionResult<DailyQuest>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        // Get template
        const { data: template, error: templateError } = await client
            .from('quest_templates')
            .select('*')
            .eq('id', templateId)
            .single()

        if (templateError || !template) {
            return { data: null, error: 'Quest şablonu bulunamadı' }
        }

        const typedTemplate = template as unknown as QuestTemplate

        // Create quest from template
        const questData: DailyQuestInsert = {
            user_id: user.id,
            goal_id: goalId,
            title: customizations?.title ?? typedTemplate.title,
            description: customizations?.description ?? typedTemplate.description,
            emoji: customizations?.emoji ?? typedTemplate.emoji,
            xp_reward: customizations?.xp_reward ?? typedTemplate.xp_reward ?? 10,
            difficulty: customizations?.difficulty ?? typedTemplate.difficulty,
            is_recurring: customizations?.is_recurring ?? typedTemplate.is_recurring_default,
            // FIX: If template is recurring but has no pattern, default to 'daily'
            recurrence_pattern: customizations?.recurrence_pattern
                ?? typedTemplate.recurrence_pattern
                ?? (typedTemplate.is_recurring_default ? 'daily' : null),
            scheduled_date: customizations?.scheduled_date ?? getTodayDateString(),
            status: 'pending',
            // CRITICAL FIX: Copy progress_contribution from template for goal progress sync
            progress_contribution: customizations?.progress_contribution
                ?? (typedTemplate as unknown as { progress_contribution?: number }).progress_contribution
                ?? 1 // Default to 1 if not specified
        }

        const { data, error } = await supabase
            .from('daily_quests')
            .insert(questData)
            .select()
            .single()

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest oluşturulurken hata oluştu'
        return { data: null, error: message }
    }
}

/**
 * Create multiple quests from templates in batch
 */
export async function createQuestsFromTemplates(
    templateIds: string[],
    goalId: string | null
): Promise<ActionResult<DailyQuest[]>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const client = supabase as any

        // Get templates
        const { data: templates, error: templatesError } = await client
            .from('quest_templates')
            .select('*')
            .in('id', templateIds)

        if (templatesError || !templates || templates.length === 0) {
            return { data: null, error: 'Quest şablonları bulunamadı' }
        }

        const typedTemplates = templates as unknown as QuestTemplate[]
        const today = getTodayDateString()

        // Create quests from templates
        // FIX: Add fallback for recurrence_pattern when template is recurring but has no pattern
        // FIX: Include progress_contribution for goal auto-progress
        const questsData: DailyQuestInsert[] = typedTemplates.map(template => ({
            user_id: user.id,
            goal_id: goalId,
            title: template.title,
            description: template.description,
            emoji: template.emoji,
            xp_reward: template.xp_reward,
            difficulty: template.difficulty,
            is_recurring: template.is_recurring_default,
            recurrence_pattern: template.recurrence_pattern
                ?? (template.is_recurring_default ? 'daily' : null),
            scheduled_date: today,
            status: 'pending',
            // Include progress_contribution for goal auto-progress
            progress_contribution: template.progress_contribution ?? 1
        } as DailyQuestInsert))

        const { data, error } = await supabase
            .from('daily_quests')
            .insert(questsData)
            .select()

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Questler oluşturulurken hata oluştu'
        return { data: null, error: message }
    }
}
