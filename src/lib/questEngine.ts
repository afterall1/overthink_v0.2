// =====================================================
// Quest Engine - XP Calculation and Quest Logic
// =====================================================

import { differenceInDays, startOfDay, isToday, parseISO, format } from 'date-fns'
import type {
    DailyQuest,
    QuestCompletion,
    Ritual,
    RitualCompletion,
    UserXpStats
} from '@/types/database.types'

// =====================================================
// XP CONSTANTS (Duolingo-inspired)
// =====================================================

export const QUEST_XP = {
    // Base XP for quest completion
    COMPLETE_BASE: 10,
    COMPLETE_ON_TIME: 15,        // Completed before due_time
    COMPLETE_EARLY: 20,          // Completed in first half of available time

    // Difficulty bonuses
    DIFFICULTY_EASY: 0,
    DIFFICULTY_MEDIUM: 5,
    DIFFICULTY_HARD: 10,

    // Streak bonuses
    STREAK_3_DAYS: 25,
    STREAK_7_DAYS: 75,
    STREAK_30_DAYS: 300,
    STREAK_100_DAYS: 1000,

    // Key Result progress bonuses
    KEY_RESULT_25_PERCENT: 50,
    KEY_RESULT_50_PERCENT: 100,
    KEY_RESULT_75_PERCENT: 150,
    KEY_RESULT_COMPLETE: 250,

    // Special achievements
    PERFECT_DAY: 100,            // All quests completed
    PERFECT_WEEK: 500,           // 7 perfect days in a row
    COMEBACK_BONUS: 50,          // Return after broken streak

    // Ritual bonuses
    RITUAL_BASE: 5,
    RITUAL_STREAK_MULTIPLIER: 1.5,  // Every 7 days = 1.5x
} as const

// =====================================================
// LEVEL SYSTEM (Duolingo-style)
// =====================================================

// XP required for each level (exponential growth)
export const LEVEL_THRESHOLDS = [
    0,      // Level 1
    60,     // Level 2
    150,    // Level 3
    300,    // Level 4
    500,    // Level 5
    750,    // Level 6
    1050,   // Level 7
    1400,   // Level 8
    1800,   // Level 9
    2250,   // Level 10
    2750,   // Level 11
    3300,   // Level 12
    3900,   // Level 13
    4550,   // Level 14
    5250,   // Level 15
    6000,   // Level 16
    6800,   // Level 17
    7650,   // Level 18
    8550,   // Level 19
    9500,   // Level 20
    // ... continues exponentially
] as const

export interface LevelInfo {
    currentLevel: number
    currentXp: number
    xpForCurrentLevel: number
    xpForNextLevel: number
    xpProgress: number        // Progress within current level (0-100)
    xpNeeded: number          // XP needed to reach next level
}

export function calculateLevel(totalXp: number): LevelInfo {
    let level = 1

    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
        if (totalXp >= LEVEL_THRESHOLDS[i]) {
            level = i + 1
        } else {
            break
        }
    }

    // For levels beyond defined thresholds
    if (level >= LEVEL_THRESHOLDS.length) {
        const lastThreshold = LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
        const extraXp = totalXp - lastThreshold
        const extraLevels = Math.floor(extraXp / 1000) // 1000 XP per level after max defined
        level = LEVEL_THRESHOLDS.length + extraLevels
    }

    const xpForCurrentLevel = level <= LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[level - 1]
        : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (level - LEVEL_THRESHOLDS.length) * 1000

    const xpForNextLevel = level < LEVEL_THRESHOLDS.length
        ? LEVEL_THRESHOLDS[level]
        : xpForCurrentLevel + 1000

    const xpProgress = ((totalXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100

    return {
        currentLevel: level,
        currentXp: totalXp,
        xpForCurrentLevel,
        xpForNextLevel,
        xpProgress: Math.min(Math.max(xpProgress, 0), 100),
        xpNeeded: xpForNextLevel - totalXp,
    }
}

// =====================================================
// QUEST XP CALCULATION
// =====================================================

export interface QuestXpBreakdown {
    baseXp: number
    difficultyBonus: number
    timeBonus: number
    streakBonus: number
    totalXp: number
}

export function calculateQuestXp(
    quest: DailyQuest,
    streakCount: number,
    completedAt?: Date
): QuestXpBreakdown {
    // Base XP from quest
    const baseXp = quest.xp_reward || QUEST_XP.COMPLETE_BASE

    // Difficulty bonus
    const difficultyBonus = quest.difficulty === 'hard'
        ? QUEST_XP.DIFFICULTY_HARD
        : quest.difficulty === 'medium'
            ? QUEST_XP.DIFFICULTY_MEDIUM
            : QUEST_XP.DIFFICULTY_EASY

    // Time bonus (if completed early)
    let timeBonus = 0
    if (completedAt && quest.due_time) {
        // TODO: Implement time-based bonus calculation
        // For now, give standard bonus
        timeBonus = 5
    }

    // Streak bonus
    let streakBonus = 0
    if (streakCount >= 100) {
        streakBonus = Math.floor(QUEST_XP.STREAK_100_DAYS / 10) // Spread over days
    } else if (streakCount >= 30) {
        streakBonus = Math.floor(QUEST_XP.STREAK_30_DAYS / 10)
    } else if (streakCount >= 7) {
        streakBonus = Math.floor(QUEST_XP.STREAK_7_DAYS / 7)
    } else if (streakCount >= 3) {
        streakBonus = Math.floor(QUEST_XP.STREAK_3_DAYS / 3)
    }

    return {
        baseXp,
        difficultyBonus,
        timeBonus,
        streakBonus,
        totalXp: baseXp + difficultyBonus + timeBonus + streakBonus
    }
}

// =====================================================
// RITUAL XP CALCULATION
// =====================================================

export interface RitualXpBreakdown {
    baseXp: number
    streakMultiplier: number
    totalXp: number
}

export function calculateRitualXp(ritual: Ritual): RitualXpBreakdown {
    const baseXp = ritual.base_xp || QUEST_XP.RITUAL_BASE

    // Streak multiplier: increases every 7 days
    const streakWeeks = Math.floor((ritual.current_streak ?? 0) / 7)
    const streakMultiplier = Math.min(1 + (streakWeeks * 0.5), 5) // Max 5x

    return {
        baseXp,
        streakMultiplier,
        totalXp: Math.round(baseXp * streakMultiplier)
    }
}

// =====================================================
// STREAK CALCULATION
// =====================================================

export interface QuestStreakInfo {
    currentStreak: number
    longestStreak: number
    streakStatus: 'active' | 'at_risk' | 'broken'
    lastActivityDate: Date | null
    daysUntilStreakBreaks: number
}

export function calculateQuestStreak(
    completions: QuestCompletion[],
    questId: string
): QuestStreakInfo {
    if (completions.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            streakStatus: 'broken',
            lastActivityDate: null,
            daysUntilStreakBreaks: 0,
        }
    }

    // Filter completions for this quest and sort by date
    const questCompletions = completions
        .filter(c => c.quest_id === questId)
        .sort((a, b) =>
            new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()
        )

    if (questCompletions.length === 0) {
        return {
            currentStreak: 0,
            longestStreak: 0,
            streakStatus: 'broken',
            lastActivityDate: null,
            daysUntilStreakBreaks: 0,
        }
    }

    const today = startOfDay(new Date())
    const lastCompletion = startOfDay(parseISO(questCompletions[0].completed_date))
    const daysSinceLastActivity = differenceInDays(today, lastCompletion)

    // Calculate current streak
    let currentStreak = 0
    let previousDate = today

    for (const completion of questCompletions) {
        const completionDate = startOfDay(parseISO(completion.completed_date))
        const gap = differenceInDays(previousDate, completionDate)

        if (gap <= 1) {
            currentStreak++
            previousDate = completionDate
        } else {
            break
        }
    }

    // Calculate longest streak
    let longestStreak = currentStreak
    let tempStreak = 0
    let tempPreviousDate: Date | null = null

    for (const completion of questCompletions) {
        const completionDate = startOfDay(parseISO(completion.completed_date))

        if (tempPreviousDate === null) {
            tempStreak = 1
        } else {
            const gap = differenceInDays(tempPreviousDate, completionDate)
            if (gap <= 1) {
                tempStreak++
            } else {
                longestStreak = Math.max(longestStreak, tempStreak)
                tempStreak = 1
            }
        }
        tempPreviousDate = completionDate
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    // Determine streak status
    let streakStatus: 'active' | 'at_risk' | 'broken'
    let daysUntilStreakBreaks = 0

    if (daysSinceLastActivity === 0) {
        streakStatus = 'active'
        daysUntilStreakBreaks = 1
    } else if (daysSinceLastActivity === 1) {
        streakStatus = 'at_risk'
        daysUntilStreakBreaks = 0 // Must complete today
    } else {
        streakStatus = 'broken'
        currentStreak = 0
        daysUntilStreakBreaks = 0
    }

    return {
        currentStreak,
        longestStreak,
        streakStatus,
        lastActivityDate: lastCompletion,
        daysUntilStreakBreaks,
    }
}

// =====================================================
// PERFECT DAY CALCULATION
// =====================================================

export interface PerfectDayInfo {
    isPerfectDay: boolean
    completedQuests: number
    totalQuests: number
    remainingQuests: DailyQuest[]
    xpBonus: number
}

export function checkPerfectDay(
    todayQuests: DailyQuest[],
    todayCompletions: QuestCompletion[]
): PerfectDayInfo {
    const completedIds = new Set(todayCompletions.map(c => c.quest_id))
    const remainingQuests = todayQuests.filter(q => !completedIds.has(q.id))

    const isPerfectDay = remainingQuests.length === 0 && todayQuests.length > 0

    return {
        isPerfectDay,
        completedQuests: todayQuests.length - remainingQuests.length,
        totalQuests: todayQuests.length,
        remainingQuests,
        xpBonus: isPerfectDay ? QUEST_XP.PERFECT_DAY : 0,
    }
}

// =====================================================
// RECURRENCE HELPERS
// =====================================================

export function shouldQuestRunToday(quest: DailyQuest): boolean {
    if (!quest.is_recurring) {
        // One-time quest: check if scheduled for today
        if (quest.scheduled_date) {
            return isToday(parseISO(quest.scheduled_date))
        }
        return true // No date means it's available
    }

    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday

    switch (quest.recurrence_pattern) {
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
}

export function getRecurrenceLabel(pattern: DailyQuest['recurrence_pattern']): string {
    switch (pattern) {
        case 'daily':
            return 'Her gün'
        case 'weekdays':
            return 'Hafta içi'
        case 'weekends':
            return 'Hafta sonu'
        case 'mwf':
            return 'Pzt, Çar, Cum'
        case 'tts':
            return 'Sal, Per, Cmt'
        case 'custom':
            return 'Özel'
        default:
            return 'Tek seferlik'
    }
}

// =====================================================
// DIFFICULTY HELPERS
// =====================================================

export function getDifficultyLabel(difficulty: DailyQuest['difficulty']): string {
    switch (difficulty) {
        case 'easy':
            return 'Kolay'
        case 'medium':
            return 'Orta'
        case 'hard':
            return 'Zor'
        default:
            return 'Orta'
    }
}

export function getDifficultyColor(difficulty: DailyQuest['difficulty']): string {
    switch (difficulty) {
        case 'easy':
            return 'text-emerald-500'
        case 'medium':
            return 'text-amber-500'
        case 'hard':
            return 'text-red-500'
        default:
            return 'text-amber-500'
    }
}

// =====================================================
// DATE HELPERS
// =====================================================

export function formatQuestTime(time: string | null): string {
    if (!time) return ''
    // time is in HH:MM:SS format
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
}

export function getTodayDateString(): string {
    return format(new Date(), 'yyyy-MM-dd')
}
