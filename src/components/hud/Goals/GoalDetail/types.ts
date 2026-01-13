'use client'

import type { GoalWithDetails, GoalEntry, DailyQuest, GoalMilestone } from '@/types/database.types'
import type { StreakInfo, VelocityInfo, GoalHealthInfo } from '@/lib/streakEngine'

// =====================================================
// Goal Detail Types
// =====================================================

export interface GoalDetailProps {
    isOpen: boolean
    onClose: () => void
    goal: GoalWithDetails | null
    onUpdateProgress: (value: number, notes?: string) => Promise<void>
    onToggleMilestone: (milestoneId: string) => void
    onEdit?: (goal: GoalWithDetails) => void
    onDelete?: (goalId: string) => Promise<void>
    linkedQuests?: DailyQuest[]
    // Quest management callbacks
    onCompleteQuest?: (questId: string) => Promise<void>
    onSkipQuest?: (questId: string) => Promise<void>
    onDeleteQuest?: (questId: string) => Promise<void>
    isLoading?: boolean
}

export interface GoalMetrics {
    progress: number
    streakInfo: StreakInfo
    healthInfo: GoalHealthInfo
    velocityInfo: VelocityInfo
    momentum: number
    maturityDays: number
    daysLeft: number | null
    isCompleted: boolean
}

export interface QuestContribution {
    id: string
    title: string
    emoji: string
    status: 'completed' | 'pending' | 'skipped'
    contributionType: 'direct' | 'momentum'
    contributionValue: number
    xpReward: number
}

export interface StreakDay {
    date: Date
    hasActivity: boolean
    activityLevel: 0 | 1 | 2 | 3 | 4 // GitHub-style intensity
    label: string
}

export interface MilestoneNode {
    id: string
    title: string
    targetValue: number
    progress: number
    isCompleted: boolean
    position: number // 0-100 percentage along path
}

// =====================================================
// Constants
// =====================================================

export const PERIOD_LABELS = {
    daily: 'Günlük',
    weekly: 'Haftalık',
    monthly: 'Aylık',
    yearly: 'Yıllık'
} as const

export const PERIOD_COLORS = {
    daily: {
        gradient: 'from-emerald-500 to-teal-600',
        ring: 'emerald',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200'
    },
    weekly: {
        gradient: 'from-blue-500 to-indigo-600',
        ring: 'blue',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200'
    },
    monthly: {
        gradient: 'from-violet-500 to-purple-600',
        ring: 'violet',
        text: 'text-violet-600',
        bg: 'bg-violet-50',
        border: 'border-violet-200'
    },
    yearly: {
        gradient: 'from-amber-500 to-orange-600',
        ring: 'amber',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200'
    }
} as const

export const STREAK_TIERS = [
    { min: 21, multiplier: 2.0, label: 'LEGEND', color: 'text-purple-600', bg: 'bg-purple-100' },
    { min: 14, multiplier: 1.6, label: 'MASTER', color: 'text-orange-600', bg: 'bg-orange-100' },
    { min: 7, multiplier: 1.4, label: 'STREAK', color: 'text-amber-600', bg: 'bg-amber-100' },
    { min: 3, multiplier: 1.2, label: 'RISING', color: 'text-yellow-600', bg: 'bg-yellow-100' }
] as const

export const MATURITY_STAGES = [
    { min: 21, emoji: '🌲', label: 'Olgun Alışkanlık', color: 'text-emerald-700' },
    { min: 14, emoji: '🌳', label: 'Büyüme Aşaması', color: 'text-green-600' },
    { min: 7, emoji: '🌿', label: 'Filiz Aşaması', color: 'text-lime-600' },
    { min: 0, emoji: '🌱', label: 'Tohum Aşaması', color: 'text-yellow-600' }
] as const

// =====================================================
// Utility Functions
// =====================================================

export function getStreakTier(streak: number) {
    return STREAK_TIERS.find(t => streak >= t.min) || null
}

export function getMaturityStage(days: number) {
    return MATURITY_STAGES.find(s => days >= s.min) || MATURITY_STAGES[MATURITY_STAGES.length - 1]
}

export function getPeriodStyle(period: keyof typeof PERIOD_COLORS) {
    return PERIOD_COLORS[period] || PERIOD_COLORS.monthly
}

export function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value || 0
    return Math.min(100, Math.max(0, (current / goal.target_value) * 100))
}

export function formatDaysLeft(endDate: string | null): { text: string; urgent: boolean } {
    if (!endDate) return { text: '∞', urgent: false }

    const now = new Date()
    const end = new Date(endDate)
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return { text: 'Süre Doldu', urgent: true }
    if (diffDays === 0) return { text: 'Son Gün!', urgent: true }
    if (diffDays <= 3) return { text: `${diffDays} gün`, urgent: true }
    return { text: `${diffDays} gün`, urgent: false }
}
