'use server'

// =====================================================
// Weekly Stats Server Actions
// Haftalık performans istatistikleri
// =====================================================

import { createAdminClient } from '@/utils/supabase/server'
import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { startOfWeek, endOfWeek, format, eachDayOfInterval, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { getCurrentDate } from '@/lib/timeService'

// =====================================================
// Types
// =====================================================

interface ActionResult<T> {
    data: T | null
    error: string | null
}

export interface DailyBreakdown {
    date: string
    dayName: string
    dayShort: string
    xp: number
    questsCompleted: number
    totalQuests: number
    isPerfect: boolean
    isToday: boolean
}

export interface WeeklyStats {
    xpThisWeek: number
    questsCompletedThisWeek: number
    totalQuestsThisWeek: number
    completionRate: number
    perfectDaysThisWeek: number
    currentStreak: number
    longestStreak: number
    bestDay: {
        date: string
        xp: number
        dayName: string
    } | null
    dailyBreakdown: DailyBreakdown[]
    weekRange: {
        start: string
        end: string
    }
}

// =====================================================
// Day name helpers
// =====================================================

const DAY_NAMES_TR: Record<string, string> = {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar'
}

const DAY_SHORTS_TR: Record<string, string> = {
    'Monday': 'Pzt',
    'Tuesday': 'Sal',
    'Wednesday': 'Çar',
    'Thursday': 'Per',
    'Friday': 'Cum',
    'Saturday': 'Cmt',
    'Sunday': 'Paz'
}

function getDayNameTR(date: Date): string {
    const englishDay = format(date, 'EEEE', { locale: tr })
    return DAY_NAMES_TR[englishDay] || englishDay
}

function getDayShortTR(date: Date): string {
    const englishDay = format(date, 'EEEE', { locale: tr })
    return DAY_SHORTS_TR[englishDay] || format(date, 'EEE', { locale: tr })
}

// =====================================================
// Main Action
// =====================================================

/**
 * Get weekly statistics for the current user
 * Includes XP, completion rate, streak, and daily breakdown
 */
export async function getWeeklyStats(): Promise<ActionResult<WeeklyStats>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()
        const today = getCurrentDate()

        // Calculate week boundaries (Monday-Sunday)
        const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 }) // Sunday

        const weekStartStr = format(weekStart, 'yyyy-MM-dd')
        const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

        // Get all days in the week
        const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

        // Fetch quest completions for this week
        const { data: completions, error: completionsError } = await supabase
            .from('quest_completions')
            .select('id, completed_date, xp_earned, quest_id')
            .eq('user_id', user.id)
            .gte('completed_date', weekStartStr)
            .lte('completed_date', weekEndStr)

        if (completionsError) {
            console.error('[getWeeklyStats] Completions error:', completionsError)
            return { data: null, error: completionsError.message }
        }

        // Fetch all daily quests for this week (to calculate total)
        const { data: allQuests, error: questsError } = await supabase
            .from('daily_quests')
            .select('id, scheduled_date, status')
            .eq('user_id', user.id)
            .gte('scheduled_date', weekStartStr)
            .lte('scheduled_date', weekEndStr)

        if (questsError) {
            console.error('[getWeeklyStats] Quests error:', questsError)
        }

        // Get user XP stats for streak info
        const { data: xpStats, error: xpError } = await supabase
            .from('user_xp_stats')
            .select('current_daily_streak, longest_quest_streak, xp_this_week')
            .eq('user_id', user.id)
            .single()

        if (xpError && xpError.code !== 'PGRST116') {
            console.error('[getWeeklyStats] XP stats error:', xpError)
        }

        // Calculate daily breakdown
        const dailyBreakdown: DailyBreakdown[] = daysInWeek.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayCompletions = completions?.filter(c => c.completed_date === dateStr) || []
            const dayQuests = allQuests?.filter(q => q.scheduled_date === dateStr) || []
            const completedCount = dayCompletions.length
            const totalCount = dayQuests.length
            const xp = dayCompletions.reduce((sum, c) => sum + (c.xp_earned || 0), 0)

            return {
                date: dateStr,
                dayName: getDayNameTR(day),
                dayShort: getDayShortTR(day),
                xp,
                questsCompleted: completedCount,
                totalQuests: totalCount,
                isPerfect: totalCount > 0 && completedCount === totalCount,
                isToday: isToday(day)
            }
        })

        // Calculate totals
        const xpThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.xp, 0)
        const questsCompletedThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.questsCompleted, 0)
        const totalQuestsThisWeek = dailyBreakdown.reduce((sum, d) => sum + d.totalQuests, 0)
        const completionRate = totalQuestsThisWeek > 0
            ? Math.round((questsCompletedThisWeek / totalQuestsThisWeek) * 100)
            : 0
        const perfectDaysThisWeek = dailyBreakdown.filter(d => d.isPerfect).length

        // Find best day
        const bestDayData = dailyBreakdown.reduce<DailyBreakdown | null>((best, current) => {
            if (!best || current.xp > best.xp) return current
            return best
        }, null)

        const bestDay = bestDayData && bestDayData.xp > 0
            ? {
                date: bestDayData.date,
                xp: bestDayData.xp,
                dayName: bestDayData.dayName
            }
            : null

        return {
            data: {
                xpThisWeek: xpStats?.xp_this_week || xpThisWeek,
                questsCompletedThisWeek,
                totalQuestsThisWeek,
                completionRate,
                perfectDaysThisWeek,
                currentStreak: xpStats?.current_daily_streak || 0,
                longestStreak: xpStats?.longest_quest_streak || 0,
                bestDay,
                dailyBreakdown,
                weekRange: {
                    start: format(weekStart, 'd MMM', { locale: tr }),
                    end: format(weekEnd, 'd MMM', { locale: tr })
                }
            },
            error: null
        }
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli' }
        }
        const message = error instanceof Error ? error.message : 'Haftalık istatistikler alınamadı'
        console.error('[getWeeklyStats] Error:', error)
        return { data: null, error: message }
    }
}
