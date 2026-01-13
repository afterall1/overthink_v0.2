'use client'

import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Edit3, Trash2, AlertTriangle } from 'lucide-react'
import { format, parseISO, subDays, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'

import type { GoalWithDetails, DailyQuest } from '@/types/database.types'
import {
    calculateStreak,
    calculateGoalHealth,
    calculateVelocity
} from '@/lib/streakEngine'
import { useHaptics } from '@/hooks/useHaptics'
import { useHealthProfile } from '@/hooks/useHealthProfile'

// Layout Components (iOS-native)
import { BottomSheet, SheetHeader } from './layout'

// Section Components
import HeroSection from './HeroSection'
import LinkedQuestsPanel from './LinkedQuestsPanel'
import JourneyPath from './JourneyPath'
import StatsGrid from './StatsGrid'
import StreakWarning from './StreakWarning'
import ContributionHeatmap from './ContributionHeatmap'
import ConfettiCelebration from '../ConfettiCelebration'

import {
    calculateProgress,
    getStreakTier,
    type GoalDetailProps
} from './types'

// =====================================================
// Constants - iOS Touch Targets
// =====================================================

const TOUCH_TARGET_SIZE = 44 // iOS HIG minimum

// =====================================================
// Delete Confirmation Dialog
// =====================================================

function DeleteConfirmDialog({
    goalTitle,
    isDeleting,
    onConfirm,
    onCancel
}: {
    goalTitle: string
    isDeleting: boolean
    onConfirm: () => void
    onCancel: () => void
}) {
    const { trigger } = useHaptics()

    const handleConfirm = useCallback(() => {
        trigger('error')
        onConfirm()
    }, [trigger, onConfirm])

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[60] 
                           max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Hedefi Sil</h3>
                        <p className="text-sm text-slate-500">Bu işlem geri alınamaz</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-800">&quot;{goalTitle}&quot;</span> hedefini
                        ve tüm ilerleme kayıtlarını silmek istediğinden emin misin?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-slate-100 text-slate-700 
                                   font-semibold hover:bg-slate-200 transition-colors 
                                   disabled:opacity-50 active:scale-[0.98]"
                        style={{ minHeight: `${TOUCH_TARGET_SIZE}px` }}
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-red-600 text-white 
                                   font-semibold hover:bg-red-700 transition-colors 
                                   disabled:opacity-50 flex items-center justify-center gap-2
                                   active:scale-[0.98]"
                        style={{ minHeight: `${TOUCH_TARGET_SIZE}px` }}
                    >
                        {isDeleting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Siliniyor...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Evet, Sil
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </>
    )
}

// =====================================================
// Helpers
// =====================================================

function calculateMomentumFallback(streak: number, entryCount: number): number {
    const streakBonus = streak >= 21 ? 60 :
        streak >= 14 ? 48 :
            streak >= 7 ? 42 :
                streak >= 3 ? 36 : 30

    const maturityBonus = entryCount >= 21 ? 20 :
        entryCount >= 14 ? 15 :
            entryCount >= 7 ? 10 : 5

    return Math.min(100, streakBonus + maturityBonus)
}

// =====================================================
// Main Component
// =====================================================

export default function GoalDetail({
    isOpen,
    onClose,
    goal,
    onUpdateProgress,
    onToggleMilestone,
    onEdit,
    onDelete,
    linkedQuests = [],
    onCompleteQuest,
    onSkipQuest,
    onDeleteQuest,
    isLoading = false
}: GoalDetailProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    const { trigger } = useHaptics()
    const { hasProfile: hasHealthProfile } = useHealthProfile()

    // Memoized calculations
    const metrics = useMemo(() => {
        if (!goal) return null

        const entries = goal.goal_entries || []
        const progress = calculateProgress(goal)
        const streakInfo = calculateStreak(entries)
        const healthInfo = calculateGoalHealth(goal, entries)
        const velocityInfo = calculateVelocity(goal, entries)

        const momentum = (goal as GoalWithDetails & { momentum_score?: number }).momentum_score ??
            calculateMomentumFallback(streakInfo.currentStreak, entries.length)

        const maturityDays = (goal as GoalWithDetails & { habit_maturity_days?: number }).habit_maturity_days ??
            entries.length

        // Calculate stats for StatsGrid
        const completedQuests = linkedQuests.filter(q => q.status === 'completed')
        const totalXpEarned = completedQuests.reduce((sum, q) => sum + (q.xp_reward || 0), 0)

        // Calculate XP this week
        const oneWeekAgo = subDays(new Date(), 7)
        const xpThisWeek = completedQuests
            .filter(q => q.completed_at && new Date(q.completed_at) >= oneWeekAgo)
            .reduce((sum, q) => sum + (q.xp_reward || 0), 0)

        // Find best day
        const dayActivityMap = new Map<string, number>()
        entries.forEach(entry => {
            if (!entry.logged_at) return
            const dateKey = format(parseISO(entry.logged_at), 'yyyy-MM-dd')
            dayActivityMap.set(dateKey, (dayActivityMap.get(dateKey) || 0) + (entry.value || 1))
        })

        let bestDay: { date: string; value: number } | null = null
        dayActivityMap.forEach((value, date) => {
            if (!bestDay || value > bestDay.value) {
                bestDay = { date, value }
            }
        })

        // Determine velocity trend based on velocityDelta
        const velocityTrend: 'up' | 'down' | 'stable' =
            velocityInfo.velocityDelta >= 10 ? 'up' :
                velocityInfo.velocityDelta <= -10 ? 'down' : 'stable'

        const velocityPercentage = Math.round(Math.abs(velocityInfo.velocityDelta))

        // Calculate streak status
        const lastActivity = (goal as GoalWithDetails & { last_activity_date?: string | null }).last_activity_date
        const hasActivityToday = entries.some(e => e.logged_at && isToday(parseISO(e.logged_at))) ||
            linkedQuests.some(q => q.status === 'completed' && q.completed_at && isToday(new Date(q.completed_at)))

        const streakStatus: 'safe' | 'at_risk' | 'broken' | 'frozen' =
            hasActivityToday ? 'safe' :
                streakInfo.currentStreak > 0 ? 'at_risk' :
                    streakInfo.currentStreak === 0 && streakInfo.longestStreak > 0 ? 'broken' : 'safe'

        // Build activity data for heatmap
        const activityData: { date: string; count: number }[] = []
        const activityMap = new Map<string, number>()

        // Count entries
        entries.forEach(entry => {
            if (!entry.logged_at) return
            const dateKey = format(parseISO(entry.logged_at), 'yyyy-MM-dd')
            activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1)
        })

        // Count completed quests
        completedQuests.forEach(quest => {
            if (quest.completed_at) {
                const dateKey = format(new Date(quest.completed_at), 'yyyy-MM-dd')
                activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + 1)
            }
        })

        activityMap.forEach((count, date) => {
            activityData.push({ date, count })
        })

        return {
            progress,
            streakInfo,
            healthInfo,
            velocityInfo,
            momentum,
            maturityDays,
            // New stats for StatsGrid
            totalXpEarned,
            xpThisWeek,
            questsCompleted: completedQuests.length,
            totalQuests: linkedQuests.length,
            bestDay,
            lastActivityDate: lastActivity || null,
            velocityTrend,
            velocityPercentage,
            // Streak warning
            streakStatus,
            hasActivityToday,
            // Heatmap data
            activityData
        }
    }, [goal, linkedQuests])

    const handleProgressSubmit = useCallback(async (value: number, notes?: string) => {
        if (!goal) return
        trigger('success')
        await onUpdateProgress(value, notes)
        setShowConfetti(true)
    }, [goal, onUpdateProgress, trigger])

    const handleDelete = useCallback(async () => {
        if (!onDelete || !goal || isDeleting) return
        setIsDeleting(true)
        try {
            await onDelete(goal.id)
            setShowDeleteConfirm(false)
            onClose()
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Delete failed:', error)
            }
        } finally {
            setIsDeleting(false)
        }
    }, [onDelete, goal, isDeleting, onClose])

    const handleClose = useCallback(() => {
        trigger('light')
        onClose()
    }, [trigger, onClose])

    if (!goal || !metrics) return null

    const {
        progress,
        streakInfo,
        velocityInfo,
        momentum,
        maturityDays,
        // New stats
        totalXpEarned,
        xpThisWeek,
        questsCompleted,
        totalQuests,
        bestDay,
        lastActivityDate,
        velocityTrend,
        velocityPercentage,
        streakStatus,
        hasActivityToday,
        activityData
    } = metrics

    const isCompleted = goal.is_completed || progress >= 100

    // Get goal emoji from category or default
    const goalEmoji = goal.categories?.icon_slug || '🎯'

    // Calculate days remaining
    const daysRemaining = goal.end_date
        ? Math.max(0, Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : null

    return (
        <>
            <ConfettiCelebration
                trigger={showConfetti}
                onComplete={() => setShowConfetti(false)}
                variant="progress"
                intensity="medium"
            />

            {/* iOS Bottom Sheet */}
            <BottomSheet
                isOpen={isOpen}
                onClose={handleClose}
                initialDetent="medium"
                showDragIndicator={true}
                onDetentChange={(detent) => {
                    if (detent === 'expanded') {
                        trigger('medium')
                    } else {
                        trigger('light')
                    }
                }}
                header={
                    <SheetHeader
                        title={goal.title}
                        subtitle={daysRemaining !== null ? `${daysRemaining} gün kaldı` : undefined}
                        emoji={goalEmoji}
                        onClose={handleClose}
                        showMoreOptions={!!(onEdit || onDelete)}
                        rightActions={
                            <div className="flex items-center gap-1">
                                {onEdit && (
                                    <button
                                        onClick={() => {
                                            trigger('light')
                                            onEdit(goal)
                                        }}
                                        aria-label="Düzenle"
                                        className="flex items-center justify-center gap-1.5 
                                                   px-3 rounded-xl text-sm font-medium text-slate-600
                                                   hover:bg-slate-100 active:scale-[0.98] transition-all"
                                        style={{ minHeight: `${TOUCH_TARGET_SIZE}px` }}
                                    >
                                        <Edit3 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Düzenle</span>
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            trigger('warning')
                                            setShowDeleteConfirm(true)
                                        }}
                                        aria-label="Sil"
                                        className="flex items-center justify-center gap-1.5 
                                                   px-3 rounded-xl text-sm font-medium text-red-500
                                                   hover:bg-red-50 active:scale-[0.98] transition-all"
                                        style={{ minHeight: `${TOUCH_TARGET_SIZE}px` }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Sil</span>
                                    </button>
                                )}
                            </div>
                        }
                    />
                }
            >
                {/* Scrollable Content */}
                <div className="px-6 py-4 space-y-6">
                    {/* Hero Section */}
                    <HeroSection
                        goal={goal}
                        progress={progress}
                        momentum={momentum}
                        streak={streakInfo.currentStreak}
                        maturityDays={maturityDays}
                        isCompleted={isCompleted}
                    />

                    {/* Streak Warning - Shows only when at risk */}
                    <StreakWarning
                        streak={streakInfo.currentStreak}
                        status={streakStatus}
                        lastActivityDate={lastActivityDate}
                        hasActivityToday={hasActivityToday}
                    />

                    {/* Stats Grid - Performance Analytics */}
                    <StatsGrid
                        totalXpEarned={totalXpEarned}
                        xpThisWeek={xpThisWeek}
                        questsCompleted={questsCompleted}
                        totalQuests={totalQuests}
                        bestDay={bestDay}
                        lastActivityDate={lastActivityDate}
                        velocityTrend={velocityTrend}
                        velocityPercentage={velocityPercentage}
                    />

                    {/* Contribution Heatmap - 30 Day Activity */}
                    <ContributionHeatmap
                        activities={activityData}
                        days={30}
                    />

                    {/* Linked Quests Panel */}
                    {(linkedQuests.length > 0 || (goal.categories?.slug === 'food' || goal.categories?.slug === 'sport')) && onCompleteQuest && onSkipQuest && (
                        <LinkedQuestsPanel
                            quests={linkedQuests}
                            goalUnit={goal.unit || undefined}
                            onCompleteQuest={async (questId) => {
                                trigger('success')
                                return onCompleteQuest(questId)
                            }}
                            onSkipQuest={async (questId) => {
                                trigger('warning')
                                return onSkipQuest(questId)
                            }}
                            onDeleteQuest={onDeleteQuest}
                            isLoading={isLoading}
                            // AI Regenerate props
                            goalId={goal.id}
                            goalTitle={goal.title}
                            categorySlug={goal.categories?.slug || null}
                            hasHealthProfile={hasHealthProfile ?? false}
                            onQuestsRefresh={() => {
                                // Parent should refresh quests
                                // This is handled via the onCompleteQuest pattern
                            }}
                        />
                    )}

                    {/* Journey Path (Milestones) */}
                    {(goal.goal_milestones?.length ?? 0) > 0 && (
                        <JourneyPath
                            milestones={goal.goal_milestones || []}
                            currentValue={goal.current_value || 0}
                            targetValue={goal.target_value || 100}
                            unit={goal.unit || undefined}
                            onMilestoneClick={(id) => {
                                trigger('medium')
                                onToggleMilestone?.(id)
                            }}
                        />
                    )}
                </div>
            </BottomSheet>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <DeleteConfirmDialog
                        goalTitle={goal.title}
                        isDeleting={isDeleting}
                        onConfirm={handleDelete}
                        onCancel={() => setShowDeleteConfirm(false)}
                    />
                )}
            </AnimatePresence>
        </>
    )
}
