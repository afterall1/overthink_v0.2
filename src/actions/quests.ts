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
 */
export async function getQuestsForToday(): Promise<ActionResult<DailyQuest[]>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        const today = getTodayDateString()
        const dayOfWeek = new Date().getDay()

        // Get one-time quests scheduled for today
        const { data: scheduledQuests, error: scheduledError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_recurring', false)
            .eq('scheduled_date', today)

        if (scheduledError) {
            return { data: null, error: scheduledError.message }
        }

        // Get recurring quests
        const { data: recurringQuests, error: recurringError } = await supabase
            .from('daily_quests')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_recurring', true)

        if (recurringError) {
            return { data: null, error: recurringError.message }
        }

        // Filter recurring quests based on pattern
        // FIX: If is_recurring is true but no pattern defined, default to 'daily'
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
                    return true  // FIX: Show quest as fallback
            }
        })

        // Check completion status for today
        const allQuests = [...(scheduledQuests || []), ...activeRecurring]
        const questIds = allQuests.map(q => q.id)

        if (questIds.length > 0) {
            const { data: completions } = await supabase
                .from('quest_completions')
                .select('quest_id')
                .eq('user_id', user.id)
                .eq('completed_date', today)
                .in('quest_id', questIds)

            const completedIds = new Set((completions || []).map((c: { quest_id: string }) => c.quest_id))

            // Update status for completed quests
            return {
                data: allQuests.map(quest => ({
                    ...quest,
                    status: completedIds.has(quest.id) ? 'completed' : quest.status
                })) as DailyQuest[],
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
 * Delete a quest
 */
export async function deleteQuest(questId: string): Promise<ActionResult<void>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const { error } = await supabase
            .from('daily_quests')
            .delete()
            .eq('id', questId)
            .eq('user_id', user.id)

        if (error) {
            return { data: null, error: error.message }
        }

        revalidatePath('/')
        return { data: undefined, error: null }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli. Lütfen giriş yapın.' }
        }
        const message = error instanceof Error ? error.message : 'Quest silinirken hata oluştu'
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
        if (quest.goal_id) {
            // Get progress contribution from quest template
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const questAny = quest as any
            const progressContribution = questAny.progress_contribution ?? 1

            // Update goal's current_value
            const { data: goal } = await supabase
                .from('goals')
                .select('current_value, target_value')
                .eq('id', quest.goal_id)
                .single()

            if (goal) {
                const newValue = (goal.current_value ?? 0) + progressContribution
                const isNowCompleted = goal.target_value ? newValue >= goal.target_value : false

                await supabase
                    .from('goals')
                    .update({
                        current_value: newValue,
                        is_completed: isNowCompleted,
                        last_activity_date: today
                    })
                    .eq('id', quest.goal_id)
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
            if (hours >= 20) {
                streakStatus = 'at_risk'
            } else if (hours >= 23) {
                streakStatus = 'broken'
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
 * Get quest templates, optionally filtered by category
 */
export async function getQuestTemplates(
    categorySlug?: CategorySlug
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
            xp_reward: customizations?.xp_reward ?? typedTemplate.xp_reward,
            difficulty: customizations?.difficulty ?? typedTemplate.difficulty,
            is_recurring: customizations?.is_recurring ?? typedTemplate.is_recurring_default,
            // FIX: If template is recurring but has no pattern, default to 'daily'
            recurrence_pattern: customizations?.recurrence_pattern
                ?? typedTemplate.recurrence_pattern
                ?? (typedTemplate.is_recurring_default ? 'daily' : null),
            scheduled_date: customizations?.scheduled_date ?? getTodayDateString(),
            status: 'pending'
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
            status: 'pending'
        }))

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
