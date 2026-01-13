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
    isSameDay,
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
// XP Rewards System (Duolingo-inspired)
// =====================================================

export interface XPInfo {
    totalXP: number
    todayXP: number
    level: number
    levelProgress: number  // 0-100 within current level
    nextLevelXP: number
}

// XP reward constants
export const XP_REWARDS = {
    LOG_PROGRESS: 10,           // Any progress logged
    DAILY_TARGET: 25,           // Complete daily target bonus
    STREAK_BONUS: 5,            // Per streak day
    MILESTONE_COMPLETE: 50,     // Complete a milestone
    GOAL_COMPLETE: 200,         // Complete entire goal
    CONSISTENCY_BONUS: 15       // 5+ days in a row
} as const

// XP thresholds for levels (cumulative)
export const XP_LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000, 7000, 10000] as const

// Health calculation weights (Duolingo-inspired hybrid approach)
const HEALTH_WEIGHTS = {
    PROGRESS: 0.40,      // Overall progress toward goal
    CONSISTENCY: 0.35,   // Recent activity frequency  
    MOMENTUM: 0.25       // Trend direction (accelerating/decelerating)
} as const

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

    // Sort entries by date descending (filter out entries without logged_at)
    const validEntries = entries.filter(e => e.logged_at !== null)
    if (validEntries.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            isActiveToday: false,
            lastActivityDate: null,
            streakStatus: 'inactive',
            streakMessage: 'Henüz bir aktivite yok. İlk adımı at!'
        }
    }
    const sortedEntries = [...validEntries].sort(
        (a, b) => new Date(b.logged_at!).getTime() - new Date(a.logged_at!).getTime()
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
        if (!entry.logged_at) continue
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
 * Calculate goal health based on HYBRID approach
 * Uses progress + consistency + momentum (not just entries)
 * 
 * This solves the problem where a goal with 94% progress but 0 entries
 * would show as "Critical" - now it considers overall progress too.
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

    // Calculate momentum (trend direction)
    const momentumScore = calculateMomentum(goal, entries)

    // Normalize progress to 0-1 scale
    const normalizedProgress = progress / 100

    // HYBRID HEALTH FORMULA (Duolingo-inspired)
    // Even with 0 entries, high progress still gives decent health
    const hybridScore = (
        HEALTH_WEIGHTS.PROGRESS * normalizedProgress +
        HEALTH_WEIGHTS.CONSISTENCY * consistencyScore +
        HEALTH_WEIGHTS.MOMENTUM * Math.max(0, (momentumScore + 1) / 2) // Normalize -1..1 to 0..1
    )

    // Convert hybrid score (0-1) to health level (1-5)
    let healthLevel: 1 | 2 | 3 | 4 | 5

    if (progress >= 100) {
        healthLevel = 5  // Goal completed = always champion
    } else if (hybridScore >= 0.75) {
        healthLevel = 5  // Excellent across all metrics
    } else if (hybridScore >= 0.55) {
        healthLevel = 4  // Good progress and/or consistency
    } else if (hybridScore >= 0.35) {
        healthLevel = 3  // Moderate - making progress
    } else if (hybridScore >= 0.15 || daysActive >= 1) {
        healthLevel = 2  // Needs attention but not critical
    } else {
        healthLevel = 1  // Critical - no progress, no activity
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

    // Enhanced messages with momentum context
    const messageMap: Record<number, string> = {
        5: 'Şampiyonlar gibi ilerliyorsun! 🏆',
        4: 'Harika performans! Momentum sende.',
        3: 'İstikrarlı devam ediyorsun.',
        2: 'Küçük bir adım at, momentum kazan!',
        1: 'Bugün başla, her adım önemli!'
    }

    return {
        healthLevel,
        healthStatus: statusMap[healthLevel],
        healthMessage: messageMap[healthLevel],
        healthColor: colorMap[healthLevel]
    }
}

/**
 * Calculate momentum - detects if user is accelerating or decelerating
 * Returns: -1 (slowing down) to +1 (accelerating)
 */
function calculateMomentum(goal: Goal, entries: GoalEntry[]): number {
    // If no entries, check if there's progress (manual value updates)
    if (entries.length === 0) {
        const progress = calculateProgress(goal)
        // If goal has significant progress but no entries, 
        // assume neutral to slightly positive momentum
        if (progress >= 50) return 0.3
        if (progress >= 25) return 0.1
        return 0
    }

    if (entries.length < 2) {
        // Single entry = positive start
        return 0.2
    }

    // Compare last 3 days activity vs previous 3 days
    const today = startOfDay(new Date())
    const last3Days = getActivityInLastNDays(entries, 3)

    // Get activity from 4-7 days ago
    const olderEntries = entries.filter(e => {
        if (!e.logged_at) return false
        const entryDate = startOfDay(parseISO(e.logged_at))
        const daysAgo = differenceInDays(today, entryDate)
        return daysAgo >= 3 && daysAgo <= 6
    })
    const prev3Days = new Set(
        olderEntries.filter(e => e.logged_at).map(e => format(startOfDay(parseISO(e.logged_at!)), 'yyyy-MM-dd'))
    ).size

    // Calculate momentum (-1 to +1)
    const diff = last3Days - prev3Days

    if (diff >= 2) return 1      // Strong acceleration
    if (diff === 1) return 0.5   // Slight acceleration
    if (diff === 0) return 0     // Steady
    if (diff === -1) return -0.5 // Slight deceleration
    return -1                    // Strong deceleration
}

/**
 * Get number of unique active days in last N days
 */
function getActivityInLastNDays(entries: GoalEntry[], days: number): number {
    const today = startOfDay(new Date())
    const cutoff = subDays(today, days)

    const recentDates = new Set<string>()

    for (const entry of entries) {
        if (!entry.logged_at) continue
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

// =====================================================
// XP Calculation Functions (Duolingo-style)
// =====================================================

/**
 * Calculate XP information for a goal
 */
export function calculateXP(goal: Goal, entries: GoalEntry[], completedMilestones: number): XPInfo {
    let totalXP = 0
    let todayXP = 0
    const today = startOfDay(new Date())

    // XP for each logged entry
    for (const entry of entries) {
        totalXP += XP_REWARDS.LOG_PROGRESS

        if (!entry.logged_at) continue
        if (isSameDay(parseISO(entry.logged_at), today)) {
            todayXP += XP_REWARDS.LOG_PROGRESS
        }
    }

    // Streak bonus
    const streakInfo = calculateStreak(entries)
    if (streakInfo.currentStreak > 0) {
        totalXP += XP_REWARDS.STREAK_BONUS * streakInfo.currentStreak
    }

    // Consistency bonus (5+ active days in last 7)
    const last7Days = getActivityInLastNDays(entries, 7)
    if (last7Days >= 5) {
        totalXP += XP_REWARDS.CONSISTENCY_BONUS
    }

    // Milestone completion XP
    totalXP += completedMilestones * XP_REWARDS.MILESTONE_COMPLETE

    // Goal completion bonus
    if (goal.is_completed || calculateProgress(goal) >= 100) {
        totalXP += XP_REWARDS.GOAL_COMPLETE
    }

    // Calculate level from total XP
    const level = calculateLevel(totalXP)
    const currentLevelThreshold = XP_LEVELS[level - 1] || 0
    const nextLevelThreshold = XP_LEVELS[level] || XP_LEVELS[XP_LEVELS.length - 1]
    const xpInLevel = totalXP - currentLevelThreshold
    const xpNeededForLevel = nextLevelThreshold - currentLevelThreshold
    const levelProgress = Math.min(100, (xpInLevel / xpNeededForLevel) * 100)

    return {
        totalXP,
        todayXP,
        level,
        levelProgress,
        nextLevelXP: nextLevelThreshold
    }
}

/**
 * Calculate level from total XP
 */
function calculateLevel(totalXP: number): number {
    for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
        if (totalXP >= XP_LEVELS[i]) {
            return i + 1
        }
    }
    return 1
}

/**
 * Get XP reward message
 */
export function getXPRewardMessage(xpGained: number, reason: keyof typeof XP_REWARDS): string {
    const messages: Record<keyof typeof XP_REWARDS, string> = {
        LOG_PROGRESS: `+${xpGained} XP kazandın! 📝`,
        DAILY_TARGET: `+${xpGained} XP Bonus! Günlük hedef tamamlandı! 🎯`,
        STREAK_BONUS: `+${xpGained} XP Zincir bonusu! 🔥`,
        MILESTONE_COMPLETE: `+${xpGained} XP Milestone tamamlandı! 🏅`,
        GOAL_COMPLETE: `+${xpGained} XP HEDEF TAMAMLANDI! 🏆`,
        CONSISTENCY_BONUS: `+${xpGained} XP Tutarlılık bonusu! ⭐`
    }
    return messages[reason]
}

/**
 * Get level badge info
 */
export function getLevelBadge(level: number): { name: string; color: string; emoji: string } {
    const badges: Record<number, { name: string; color: string; emoji: string }> = {
        1: { name: 'Çaylak', color: '#94A3B8', emoji: '🌱' },
        2: { name: 'Acemi', color: '#84CC16', emoji: '🌿' },
        3: { name: 'Deneyimli', color: '#22C55E', emoji: '🌲' },
        4: { name: 'Uzman', color: '#3B82F6', emoji: '💎' },
        5: { name: 'Usta', color: '#8B5CF6', emoji: '⚡' },
        6: { name: 'Profesyonel', color: '#A855F7', emoji: '🔮' },
        7: { name: 'Şampiyon', color: '#EC4899', emoji: '🏆' },
        8: { name: 'Efsane', color: '#F59E0B', emoji: '👑' },
        9: { name: 'Titan', color: '#EF4444', emoji: '🔥' },
        10: { name: 'Tanrısal', color: '#DC2626', emoji: '⭐' },
        11: { name: 'Efsanevi', color: '#B91C1C', emoji: '💫' },
        12: { name: 'LEGEND', color: '#7C2D12', emoji: '🎖️' }
    }
    return badges[Math.min(level, 12)] || badges[1]
}
