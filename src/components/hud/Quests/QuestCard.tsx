'use client'

import { useState, useCallback } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from 'framer-motion'
import {
    Check,
    Clock,
    Flame,
    Target,
    Sparkles,
    AlertCircle,
    ChevronRight,
    Zap,
    Link2
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { DailyQuest, Goal } from '@/types/database.types'
import {
    formatQuestTime,
    getDifficultyColor,
    getRecurrenceLabel
} from '@/lib/questEngine'

// =====================================================
// Types
// =====================================================

export interface QuestCardGoalInfo {
    id: string
    title: string
    current_value?: number
    target_value?: number
    progress_percent?: number
}

export interface LinkedGoalInfo {
    id: string
    title: string
    synergy_type: 'SYNERGISTIC' | 'COMPLEMENTARY'
    contribution_weight: number
}

export interface QuestCardProps {
    quest: DailyQuest
    goal?: QuestCardGoalInfo | null
    additionalGoals?: LinkedGoalInfo[]  // NEW: Multi-goal contributions
    streakCount?: number
    contributionDisplay?: string | null  // "+306 kcal (~1.1%)"
    contributionPercent?: number | null  // 1.14
    onComplete: (questId: string) => Promise<void>
    onSkip?: (questId: string) => Promise<void>
    onClick?: (quest: DailyQuest) => void
    isLoading?: boolean
    className?: string
}

type QuestState = 'pending' | 'completed' | 'skipped' | 'at_risk' | 'loading'

// =====================================================
// Constants
// =====================================================

const SWIPE_THRESHOLD = 80
const COMPLETE_ZONE_WIDTH = 100

const stateConfig: Record<QuestState, {
    bg: string
    border: string
    icon: typeof Check
    iconColor: string
    glow?: string
}> = {
    pending: {
        bg: 'bg-white/60',
        border: 'border-white/40',
        icon: Clock,
        iconColor: 'text-slate-400'
    },
    completed: {
        bg: 'bg-gradient-to-r from-emerald-50/80 to-green-50/60',
        border: 'border-emerald-200/50',
        icon: Check,
        iconColor: 'text-emerald-500',
        glow: 'shadow-emerald-500/20'
    },
    skipped: {
        bg: 'bg-slate-50/60',
        border: 'border-slate-200/50',
        icon: ChevronRight,
        iconColor: 'text-slate-400'
    },
    at_risk: {
        bg: 'bg-gradient-to-r from-amber-50/80 to-orange-50/60',
        border: 'border-amber-200/50',
        icon: AlertCircle,
        iconColor: 'text-amber-500',
        glow: 'shadow-amber-500/10'
    },
    loading: {
        bg: 'bg-white/60',
        border: 'border-violet-200/50',
        icon: Zap,
        iconColor: 'text-violet-500'
    }
}

// =====================================================
// Component
// =====================================================

export default function QuestCard({
    quest,
    goal,
    additionalGoals = [],
    streakCount = 0,
    contributionDisplay,
    contributionPercent,
    onComplete,
    onSkip,
    onClick,
    isLoading = false,
    className
}: QuestCardProps) {
    const [isCompleting, setIsCompleting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)
    const [prevProgress, setPrevProgress] = useState<number | null>(null)

    // Determine current state
    const getState = (): QuestState => {
        if (isLoading || isCompleting) return 'loading'
        if (quest.status === 'completed') return 'completed'
        if (quest.status === 'skipped') return 'skipped'
        // TODO: Add at_risk detection based on time remaining
        return 'pending'
    }

    const state = getState()
    const config = stateConfig[state]
    const isInteractive = state === 'pending' && !isLoading

    // Swipe gesture handling
    const x = useMotionValue(0)
    const completeOpacity = useTransform(x, [-COMPLETE_ZONE_WIDTH, -20, 0], [1, 0.5, 0])
    const cardScale = useTransform(x, [-COMPLETE_ZONE_WIDTH, 0], [0.98, 1])

    const handleDragEnd = useCallback(async (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!isInteractive) return

        if (info.offset.x < -SWIPE_THRESHOLD) {
            setIsCompleting(true)
            try {
                await onComplete(quest.id)
                setShowSuccess(true)
                setTimeout(() => setShowSuccess(false), 2000)
            } catch (error) {
                // Error handling - show toast
                if (process.env.NODE_ENV === 'development') {
                    throw error
                }
            } finally {
                setIsCompleting(false)
            }
        }
    }, [isInteractive, onComplete, quest.id])

    const handleClick = useCallback(() => {
        if (onClick && !isCompleting) {
            onClick(quest)
        }
    }, [onClick, quest, isCompleting])

    const handleQuickComplete = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isInteractive) return

        // Save previous progress for animation
        if (goal?.progress_percent !== undefined) {
            setPrevProgress(goal.progress_percent)
        }

        setIsCompleting(true)
        try {
            await onComplete(quest.id)
            setShowSuccess(true)
            setTimeout(() => {
                setShowSuccess(false)
                setPrevProgress(null)
            }, 2500)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                throw error
            }
        } finally {
            setIsCompleting(false)
        }
    }, [isInteractive, onComplete, quest.id, goal?.progress_percent])

    return (
        <div className={twMerge("relative overflow-hidden rounded-2xl", className)}>
            {/* Swipe Complete Zone (Hidden behind card) */}
            {isInteractive && (
                <motion.div
                    style={{ opacity: completeOpacity }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500 
                               rounded-2xl flex items-center justify-end pr-6"
                >
                    <div className="flex items-center gap-2 text-white font-bold">
                        <Check className="w-6 h-6" />
                        <span>Tamamla</span>
                    </div>
                </motion.div>
            )}

            {/* Main Card */}
            <motion.div
                style={{ x, scale: cardScale }}
                drag={isInteractive ? "x" : false}
                dragConstraints={{ left: -COMPLETE_ZONE_WIDTH, right: 0 }}
                dragElastic={0.1}
                onDragEnd={handleDragEnd}
                onClick={handleClick}
                whileTap={isInteractive ? { scale: 0.98 } : undefined}
                className={twMerge(
                    "relative backdrop-blur-xl border rounded-2xl p-4 cursor-pointer",
                    "transition-all duration-300",
                    config.bg,
                    config.border,
                    config.glow && `shadow-lg ${config.glow}`,
                    isInteractive && "hover:shadow-lg hover:border-violet-200/50",
                    state === 'completed' && "opacity-80"
                )}
            >
                <div className="flex items-start gap-3">
                    {/* Status/Emoji Icon */}
                    <div className={twMerge(
                        "flex-none w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                        "transition-all duration-300",
                        state === 'pending' && "bg-white/80 border border-slate-100",
                        state === 'completed' && "bg-emerald-100 border border-emerald-200",
                        state === 'at_risk' && "bg-amber-100 border border-amber-200",
                        state === 'loading' && "bg-violet-100 border border-violet-200 animate-pulse"
                    )}>
                        {isCompleting ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Zap className="w-5 h-5 text-violet-500" />
                            </motion.div>
                        ) : state === 'completed' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                <Check className="w-5 h-5 text-emerald-500" strokeWidth={3} />
                            </motion.div>
                        ) : (
                            <span>{quest.emoji}</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Title Row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                            <h3 className={twMerge(
                                "font-semibold text-slate-800 truncate",
                                state === 'completed' && "line-through text-slate-500"
                            )}>
                                {quest.title}
                            </h3>
                            <div className={twMerge(
                                "flex-none px-2 py-0.5 rounded-full text-xs font-bold",
                                "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
                                "shadow-sm shadow-violet-500/30"
                            )}>
                                +{quest.xp_reward} XP
                            </div>
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            {/* Time */}
                            {quest.scheduled_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatQuestTime(quest.scheduled_time)}
                                </span>
                            )}

                            {/* Goal Link */}
                            {goal && (
                                <span className="flex items-center gap-1 text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md">
                                    <Target className="w-3 h-3" />
                                    {goal.title.length > 15 ? `${goal.title.slice(0, 15)}...` : goal.title}
                                </span>
                            )}

                            {/* Recurrence */}
                            {quest.is_recurring && quest.recurrence_pattern && (
                                <span className="text-slate-400">
                                    {getRecurrenceLabel(quest.recurrence_pattern)}
                                </span>
                            )}

                            {/* Difficulty */}
                            <span className={getDifficultyColor(quest.difficulty)}>
                                {quest.difficulty === 'hard' ? '🔥' : quest.difficulty === 'medium' ? '⚡' : '✨'}
                            </span>

                            {/* Streak */}
                            {quest.is_recurring && streakCount > 0 && (
                                <span className={twMerge(
                                    "flex items-center gap-1 font-medium",
                                    streakCount >= 7 ? "text-orange-500" : "text-amber-500"
                                )}>
                                    <Flame className={twMerge(
                                        "w-3 h-3",
                                        streakCount >= 7 && "fill-current animate-pulse"
                                    )} />
                                    {streakCount}
                                </span>
                            )}

                            {/* AI Suggested Badge */}
                            {quest.is_ai_suggested && (
                                <span className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                    <Sparkles className="w-3 h-3" />
                                    AI
                                </span>
                            )}

                            {/* Multi-Goal Badge (NEW) */}
                            {additionalGoals.length > 0 && (
                                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md" title={`${additionalGoals.length + 1} hedefe katkı sağlıyor`}>
                                    <Link2 className="w-3 h-3" />
                                    <span className="text-[10px] font-bold">+{additionalGoals.length}</span>
                                </span>
                            )}
                        </div>

                        {/* Completion Time (if completed) */}
                        {state === 'completed' && quest.completed_at && (
                            <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Tamamlandı
                            </div>
                        )}

                        {/* Goal Progress Badge - Shows how this quest contributes to goal */}
                        {goal && goal.progress_percent !== undefined && state !== 'completed' && contributionDisplay && (
                            <div className="mt-2 pt-2 border-t border-slate-100/50">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-500 flex items-center gap-1">
                                        <Target className="w-3 h-3 text-violet-500" />
                                        <span className="truncate max-w-[100px]">{goal.title}</span>
                                    </span>
                                    <span className="font-semibold text-teal-600 text-[10px]">
                                        {contributionDisplay}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-400 to-indigo-500 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, goal.progress_percent || 0)}%` }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    />
                                </div>
                                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                                    <span>{(goal.progress_percent || 0).toFixed(1)}%</span>
                                    {contributionPercent && (
                                        <span className="text-teal-500">+{contributionPercent.toFixed(1)}%</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Complete Button (for non-swipe users) */}
                    {isInteractive && (
                        <motion.button
                            onClick={handleQuickComplete}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="flex-none w-8 h-8 rounded-xl bg-white/80 border border-slate-100 
                                       flex items-center justify-center hover:bg-emerald-50 
                                       hover:border-emerald-200 transition-colors group"
                            aria-label="Görevi tamamla"
                        >
                            <Check className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </motion.button>
                    )}
                </div>
            </motion.div>

            {/* Success Celebration Overlay with Progress Impact */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl
                                   flex flex-col items-center justify-center pointer-events-none p-4"
                    >
                        {/* Success Badge */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 
                                       flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-2"
                        >
                            <Check className="w-6 h-6 text-white" strokeWidth={3} />
                        </motion.div>

                        {/* XP Reward */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg font-bold text-emerald-600 mb-2"
                        >
                            +{quest.xp_reward} XP
                        </motion.div>

                        {/* Goal Progress Impact */}
                        {goal && prevProgress !== null && contributionPercent && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="w-full max-w-[180px]"
                            >
                                <p className="text-[10px] text-slate-500 text-center mb-1 flex items-center justify-center gap-1">
                                    <Target className="w-3 h-3 text-violet-500" />
                                    {goal.title}
                                </p>

                                {/* Animated Progress Bar */}
                                <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: `${prevProgress}%` }}
                                        animate={{ width: `${Math.min(100, prevProgress + contributionPercent)}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                                        className="absolute h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                                    />
                                </div>

                                {/* Progress Numbers */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center justify-center gap-2 mt-1"
                                >
                                    <span className="text-xs text-slate-400">{prevProgress.toFixed(1)}%</span>
                                    <span className="text-xs text-teal-500">→</span>
                                    <span className="text-xs font-bold text-teal-600">
                                        {Math.min(100, prevProgress + contributionPercent).toFixed(1)}%
                                    </span>
                                </motion.div>
                            </motion.div>
                        )}

                        {/* Multi-Goal Celebration (NEW) */}
                        {additionalGoals.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-3 w-full max-w-[200px]"
                            >
                                <div className="flex items-center justify-center gap-1 mb-2">
                                    <Link2 className="w-3 h-3 text-emerald-500" />
                                    <span className="text-[10px] font-medium text-emerald-600">
                                        +{additionalGoals.length} hedefe daha katkı!
                                    </span>
                                </div>
                                <div className="flex flex-wrap justify-center gap-1">
                                    {additionalGoals.slice(0, 3).map((g, idx) => (
                                        <motion.div
                                            key={g.id}
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.9 + idx * 0.1 }}
                                            className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${g.synergy_type === 'SYNERGISTIC'
                                                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                }`}
                                        >
                                            {g.title.length > 12 ? `${g.title.slice(0, 12)}...` : g.title}
                                        </motion.div>
                                    ))}
                                    {additionalGoals.length > 3 && (
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.2 }}
                                            className="text-[9px] text-slate-400"
                                        >
                                            +{additionalGoals.length - 3} daha
                                        </motion.span>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
