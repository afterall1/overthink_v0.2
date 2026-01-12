/**
 * Streak Engine - Utility for calculating and managing goal streaks
 * 
 * A streak represents consecutive days of goal activity.
 * Uses date-fns for reliable date calculations.
 */

import {
    differenceInDays,
    parseISO,
    startOfDay,
    isToday,
    isYesterday,
    format,
    subDays
} from 'date-fns'
import type { GoalEntry, Goal } from '@/types/database.types'

// =====================================================
// Types
// =====================================================

export interface StreakInfo {
    currentStreak: number
    longestStreak: number
    isActiveToday: boolean
    lastActivityDate: Date | null
    streakStatus: StreakStatus
    streakMessage: string
}

export type StreakStatus =
    | 'thriving'    // 7+ day streak
    | 'building'    // 3-6 day streak
    | 'starting'    // 1-2 day streak
    | 'at_risk'     // No activity today but streak can be saved
    | 'broken'      // Streak is broken (missed yesterday)
    | 'inactive'    // No recent activity

export interface GoalHealthInfo {
    healthLevel: 1 | 2 | 3 | 4 | 5
    healthStatus: 'critical' | 'struggling' | 'steady' | 'thriving' | 'champion'
    healthMessage: string
    healthColor: string
}

export interface VelocityInfo {
    currentVelocity: number       // Units per day
    requiredVelocity: number      // Units per day needed to complete on time
    velocityDelta: number         // Percentage difference
    isOnTrack: boolean
    estimatedCompletionDate: Date | null
    velocityMessage: string
}

// =====================================================
// Streak Calculations
// =====================================================

/**
 * Calculate streak information from goal entries
 */
export function calculateStreak(entries: GoalEntry[]): StreakInfo {
    if (!entries || entries.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            isActiveToday: false,
            lastActivityDate: null,
            streakStatus: 'inactive',
            streakMessage: 'Henüz bir aktivite yok. İlk adımı at!'
        }
    }

    // Sort entries by date descending
    const sortedEntries = [...entries].sort(
        (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    )

    // Get unique activity dates
    const activityDates = getUniqueActivityDates(sortedEntries)

    if (activityDates.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            isActiveToday: false,
            lastActivityDate: null,
            streakStatus: 'inactive',
            streakMessage: 'Henüz bir aktivite yok. İlk adımı at!'
        }
    }

    const lastActivity = activityDates[0]
    const isActiveToday = isToday(lastActivity)
    const wasActiveYesterday = isYesterday(lastActivity)

    // Calculate current streak
    let currentStreak = 0
    const today = startOfDay(new Date())

    // If active today, start counting from today
    // If active yesterday (but not today), streak is at risk
    // Otherwise, streak is broken

    if (isActiveToday || wasActiveYesterday) {
        currentStreak = countConsecutiveDays(activityDates)
    }

    // Calculate longest streak
    const longestStreak = calculateLongestStreak(activityDates)

    // Determine streak status
    const streakStatus = getStreakStatus(currentStreak, isActiveToday, wasActiveYesterday)
    const streakMessage = getStreakMessage(streakStatus, currentStreak)

    return {
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        isActiveToday,
        lastActivityDate: lastActivity,
        streakStatus,
        streakMessage
    }
}

/**
 * Get unique dates with activity (normalized to start of day)
 */
function getUniqueActivityDates(entries: GoalEntry[]): Date[] {
    const dateSet = new Set<string>()
    const dates: Date[] = []

    for (const entry of entries) {
        const date = startOfDay(parseISO(entry.logged_at))
        const dateKey = format(date, 'yyyy-MM-dd')

        if (!dateSet.has(dateKey)) {
            dateSet.add(dateKey)
            dates.push(date)
        }
    }

    // Sort descending (most recent first)
    return dates.sort((a, b) => b.getTime() - a.getTime())
}

/**
 * Count consecutive days starting from the most recent activity
 */
function countConsecutiveDays(sortedDates: Date[]): number {
    if (sortedDates.length === 0) return 0

    let streak = 1
    const today = startOfDay(new Date())
    const firstDate = sortedDates[0]

    // Check if the streak should start from today or yesterday
    const daysFromToday = differenceInDays(today, firstDate)

    // If more than 1 day ago, streak is broken
    if (daysFromToday > 1) return 0

    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = sortedDates[i - 1]
        const currDate = sortedDates[i]
        const dayDiff = differenceInDays(prevDate, currDate)

        if (dayDiff === 1) {
            streak++
        } else if (dayDiff > 1) {
            break
        }
        // If dayDiff === 0, same day, don't increment but continue
    }

    return streak
}

/**
 * Calculate the longest streak ever achieved
 */
function calculateLongestStreak(sortedDates: Date[]): number {
    if (sortedDates.length === 0) return 0
    if (sortedDates.length === 1) return 1

    let maxStreak = 1
    let currentStreak = 1

    // Sort ascending for this calculation
    const ascending = [...sortedDates].sort((a, b) => a.getTime() - b.getTime())

    for (let i = 1; i < ascending.length; i++) {
        const dayDiff = differenceInDays(ascending[i], ascending[i - 1])

        if (dayDiff === 1) {
            currentStreak++
            maxStreak = Math.max(maxStreak, currentStreak)
        } else if (dayDiff > 1) {
            currentStreak = 1
        }
        // Same day (dayDiff === 0) - don't change streak
    }

    return maxStreak
}

/**
 * Determine streak status based on activity
 */
function getStreakStatus(
    streak: number,
    isActiveToday: boolean,
    wasActiveYesterday: boolean
): StreakStatus {
    if (streak === 0) {
        return wasActiveYesterday ? 'at_risk' : 'inactive'
    }

    if (!isActiveToday && wasActiveYesterday) {
        return 'at_risk'
    }

    if (streak >= 7) return 'thriving'
    if (streak >= 3) return 'building'
    return 'starting'
}

/**
 * Generate motivational message based on streak status
 */
function getStreakMessage(status: StreakStatus, streak: number): string {
    switch (status) {
        case 'thriving':
            if (streak >= 30) return `🔥 Efsane! ${streak} günlük zincir!`
            if (streak >= 14) return `🔥 İnanılmaz! ${streak} gündür devam ediyorsun!`
            return `🔥 Harika gidiyorsun! ${streak} günlük zincir!`

        case 'building':
            return `💪 Momentum kazanıyorsun! ${streak} günlük zincir.`

        case 'starting':
            return `🌱 İyi başlangıç! ${streak} günlük zincir.`

        case 'at_risk':
            return '⚠️ Zincirin risk altında! Bugün devam et.'

        case 'broken':
            return '💔 Zincir kırıldı. Yeniden başla!'

        case 'inactive':
        default:
            return '🎯 İlk adımı atmaya hazır mısın?'
    }
}

// =====================================================
// Goal Health Calculations
// =====================================================

/**
 * Calculate goal health based on activity consistency
 */
export function calculateGoalHealth(
    goal: Goal,
    entries: GoalEntry[]
): GoalHealthInfo {
    const streakInfo = calculateStreak(entries)
    const progress = calculateProgress(goal)
    const daysActive = entries.length

    // Calculate activity consistency in last 7 days
    const last7Days = getActivityInLastNDays(entries, 7)
    const consistencyScore = last7Days / 7

    // Determine health level (1-5)
    let healthLevel: 1 | 2 | 3 | 4 | 5

    if (progress >= 100) {
        healthLevel = 5
    } else if (consistencyScore >= 0.8 && streakInfo.currentStreak >= 5) {
        healthLevel = 5
    } else if (consistencyScore >= 0.6 && streakInfo.currentStreak >= 3) {
        healthLevel = 4
    } else if (consistencyScore >= 0.4 || streakInfo.currentStreak >= 2) {
        healthLevel = 3
    } else if (consistencyScore >= 0.2 || daysActive >= 1) {
        healthLevel = 2
    } else {
        healthLevel = 1
    }

    const statusMap: Record<number, GoalHealthInfo['healthStatus']> = {
        5: 'champion',
        4: 'thriving',
        3: 'steady',
        2: 'struggling',
        1: 'critical'
    }

    const colorMap: Record<number, string> = {
        5: '#8B5CF6', // violet
        4: '#10B981', // emerald
        3: '#3B82F6', // blue
        2: '#F59E0B', // amber
        1: '#EF4444'  // red
    }

    const messageMap: Record<number, string> = {
        5: 'Şampiyonlar gibi ilerliyorsun!',
        4: 'Harika performans!',
        3: 'İstikrarlı devam ediyorsun.',
        2: 'Biraz daha odaklan!',
        1: 'Dikkat! Hedefe odaklanma zamanı.'
    }

    return {
        healthLevel,
        healthStatus: statusMap[healthLevel],
        healthMessage: messageMap[healthLevel],
        healthColor: colorMap[healthLevel]
    }
}

/**
 * Get number of unique active days in last N days
 */
function getActivityInLastNDays(entries: GoalEntry[], days: number): number {
    const today = startOfDay(new Date())
    const cutoff = subDays(today, days)

    const recentDates = new Set<string>()

    for (const entry of entries) {
        const entryDate = startOfDay(parseISO(entry.logged_at))
        if (entryDate >= cutoff) {
            recentDates.add(format(entryDate, 'yyyy-MM-dd'))
        }
    }

    return recentDates.size
}

// =====================================================
// Velocity Calculations
// =====================================================

/**
 * Calculate progress velocity and predictions
 */
export function calculateVelocity(goal: Goal, entries: GoalEntry[]): VelocityInfo {
    const currentValue = goal.current_value ?? 0
    const targetValue = goal.target_value ?? 100
    const startDate = goal.start_date ? parseISO(goal.start_date) : new Date()
    const endDate = goal.end_date ? parseISO(goal.end_date) : null

    const today = new Date()
    const daysElapsed = Math.max(1, differenceInDays(today, startDate))

    // Current velocity (units per day)
    const currentVelocity = currentValue / daysElapsed

    // Required velocity to finish on time
    let requiredVelocity = 0
    let daysRemaining = 0

    if (endDate) {
        daysRemaining = Math.max(1, differenceInDays(endDate, today))
        const remaining = targetValue - currentValue
        requiredVelocity = remaining / daysRemaining
    }

    // Velocity delta (percentage difference)
    let velocityDelta = 0
    if (requiredVelocity > 0) {
        velocityDelta = ((currentVelocity - requiredVelocity) / requiredVelocity) * 100
    }

    const isOnTrack = currentVelocity >= requiredVelocity || !endDate

    // Estimate completion date
    let estimatedCompletionDate: Date | null = null
    if (currentVelocity > 0) {
        const remaining = targetValue - currentValue
        const daysToComplete = Math.ceil(remaining / currentVelocity)
        estimatedCompletionDate = new Date(today.getTime() + daysToComplete * 24 * 60 * 60 * 1000)
    }

    // Generate message
    let velocityMessage: string
    if (currentVelocity <= 0) {
        velocityMessage = 'Henüz yeterli veri yok.'
    } else if (velocityDelta >= 20) {
        velocityMessage = `🚀 Harika! Planın %${Math.abs(velocityDelta).toFixed(0)} önündesin.`
    } else if (velocityDelta >= 0) {
        velocityMessage = '✅ Tam plana göre gidiyorsun.'
    } else if (velocityDelta >= -20) {
        velocityMessage = `⚡ Biraz hızlan! %${Math.abs(velocityDelta).toFixed(0)} gerideysin.`
    } else {
        velocityMessage = `⚠️ Dikkat! %${Math.abs(velocityDelta).toFixed(0)} geride kaldın.`
    }

    return {
        currentVelocity,
        requiredVelocity,
        velocityDelta,
        isOnTrack,
        estimatedCompletionDate,
        velocityMessage
    }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Calculate progress percentage
 */
function calculateProgress(goal: Goal): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value ?? 0
    return Math.min(100, Math.max(0, (current / goal.target_value) * 100))
}

/**
 * Get streak milestone thresholds
 */
export const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 90, 180, 365] as const

/**
 * Check if a streak has reached a new milestone
 */
export function checkStreakMilestone(
    previousStreak: number,
    currentStreak: number
): number | null {
    for (const milestone of STREAK_MILESTONES) {
        if (previousStreak < milestone && currentStreak >= milestone) {
            return milestone
        }
    }
    return null
}

/**
 * Get celebration message for milestone
 */
export function getStreakMilestoneMessage(milestone: number): string {
    const messages: Record<number, string> = {
        3: '🌟 3 günlük zincir! Harika başlangıç!',
        7: '🔥 1 haftalık zincir! Tebrikler!',
        14: '💪 2 hafta! Alışkanlık oluşmaya başlıyor!',
        21: '🏆 3 hafta! Artık bir alışkanlık bu!',
        30: '👑 1 ay! Efsane oldun!',
        60: '🚀 2 ay! Durdurulamaz!',
        90: '💎 3 ay! Ustalaştın!',
        180: '⚡ 6 ay! İnanılmaz disiplin!',
        365: '🎖️ 1 YIL! LEGEND!'
    }
    return messages[milestone] || `🎉 ${milestone} günlük zincir!`
}
