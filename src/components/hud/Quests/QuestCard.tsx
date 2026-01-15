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
    ChevronDown,
    Zap,
    Link2,
    Timer,
    Lightbulb
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

// Extended DailyQuest type for QuestCard with optional AI-generated fields
interface ExtendedDailyQuest extends DailyQuest {
    calorie_impact?: number
    estimated_minutes?: number
    scientific_rationale?: string
}

export interface QuestCardProps {
    quest: ExtendedDailyQuest
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
    const [isExpanded, setIsExpanded] = useState(false)

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
                    // Premium glassmorphism base
                    "relative backdrop-blur-xl border rounded-3xl p-4 cursor-pointer",
                    "transition-all duration-300",
                    // State-based backgrounds with enhanced opacity
                    state === 'pending' && "bg-white/80 border-white/60 shadow-lg shadow-violet-500/5",
                    state === 'completed' && "bg-gradient-to-br from-emerald-50/90 to-green-50/80 border-emerald-200/60 shadow-lg shadow-emerald-500/10",
                    state === 'skipped' && "bg-slate-50/70 border-slate-200/50",
                    state === 'at_risk' && "bg-gradient-to-br from-amber-50/90 to-orange-50/80 border-amber-200/60 shadow-lg shadow-amber-500/10",
                    state === 'loading' && "bg-white/70 border-violet-200/60",
                    // Hover effects
                    isInteractive && "hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-300/60 hover:-translate-y-0.5",
                    state === 'completed' && "opacity-85"
                )}
            >
                <div className="flex items-start gap-4">
                    {/* Premium Emoji Container with Gradient */}
                    <div className={twMerge(
                        "flex-none w-14 h-14 rounded-2xl flex items-center justify-center text-2xl",
                        "transition-all duration-300",
                        // Gradient backgrounds based on state
                        state === 'pending' && "bg-gradient-to-br from-violet-50 to-purple-100/80 border border-violet-100/80 shadow-lg shadow-violet-200/40",
                        state === 'completed' && "bg-gradient-to-br from-emerald-100 to-green-100/80 border border-emerald-200/80 shadow-lg shadow-emerald-200/40",
                        state === 'at_risk' && "bg-gradient-to-br from-amber-100 to-orange-100/80 border border-amber-200/80 shadow-lg shadow-amber-200/40",
                        state === 'loading' && "bg-gradient-to-br from-violet-100 to-purple-100/80 border border-violet-200/80 animate-pulse"
                    )}>
                        {isCompleting ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <Zap className="w-6 h-6 text-violet-500" />
                            </motion.div>
                        ) : state === 'completed' ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                <Check className="w-6 h-6 text-emerald-500" strokeWidth={3} />
                            </motion.div>
                        ) : (
                            <span className="drop-shadow-sm">{quest.emoji}</span>
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
                            {/* Premium XP Badge */}
                            <div className={twMerge(
                                "flex items-center gap-1 flex-none px-3 py-1 rounded-full text-xs font-bold",
                                "bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 text-white",
                                "shadow-lg shadow-violet-500/40"
                            )}>
                                <Sparkles className="w-3 h-3" />
                                +{quest.xp_reward} XP
                            </div>
                        </div>

                        {/* Premium Meta Row */}
                        <div className="flex items-center gap-2 text-xs flex-wrap mt-2">
                            {/* Estimated Duration - Pill Badge */}
                            {quest.estimated_minutes && quest.estimated_minutes > 0 && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 border border-slate-200/60 shadow-sm">
                                    <Timer className="w-3.5 h-3.5 text-slate-500" />
                                    {quest.estimated_minutes} dk
                                </span>
                            )}

                            {/* Goal Link - Premium Pill */}
                            {goal && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-violet-100 to-purple-50 text-violet-700 border border-violet-200/60 shadow-sm">
                                    <Target className="w-3.5 h-3.5" />
                                    {goal.title.length > 12 ? `${goal.title.slice(0, 12)}...` : goal.title}
                                </span>
                            )}

                            {/* Time */}
                            {quest.scheduled_time && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatQuestTime(quest.scheduled_time)}
                                </span>
                            )}

                            {/* Recurrence */}
                            {quest.is_recurring && quest.recurrence_pattern && (
                                <span className="text-slate-400">
                                    {getRecurrenceLabel(quest.recurrence_pattern)}
                                </span>
                            )}

                            {/* Difficulty - Premium Pill */}
                            <span className={twMerge(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                                quest.difficulty === 'easy' && 'bg-gradient-to-r from-emerald-100 to-green-50 text-emerald-700 border border-emerald-200/60',
                                quest.difficulty === 'medium' && 'bg-gradient-to-r from-blue-100 to-sky-50 text-blue-700 border border-blue-200/60',
                                quest.difficulty === 'hard' && 'bg-gradient-to-r from-red-100 to-orange-50 text-red-700 border border-red-200/60'
                            )}>
                                {quest.difficulty === 'easy' && '🌱 Kolay'}
                                {quest.difficulty === 'medium' && '💪 Orta'}
                                {quest.difficulty === 'hard' && '🔥 Zor'}
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

                            {/* AI Suggested Badge - Premium */}
                            {quest.is_ai_suggested && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-violet-50 text-indigo-700 border border-indigo-200/60 shadow-sm">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    AI
                                </span>
                            )}

                            {/* Multi-Goal Badge - Premium */}
                            {additionalGoals.length > 0 && (
                                <span
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-green-50 text-emerald-700 border border-emerald-200/60 shadow-sm"
                                    title={`${additionalGoals.length + 1} hedefe katkı sağlıyor`}
                                >
                                    <Link2 className="w-3.5 h-3.5" />
                                    <span className="font-bold">+{additionalGoals.length}</span>
                                </span>
                            )}

                            {/* Calorie Impact Badge - Premium Pill */}
                            {quest.calorie_impact !== undefined && quest.calorie_impact !== 0 && (() => {
                                // Determine quest type from emoji or title
                                const exerciseIndicators = ['🏃', '💪', '🚴', '🏋️', '🏊', '🧘', '🚶', '⚡', '🔥', '🏃‍♂️', '🏃‍♀️', '🏋️‍♂️', '🏋️‍♀️']
                                const isExercise = exerciseIndicators.some(e => quest.emoji?.includes(e)) ||
                                    quest.title?.toLowerCase().includes('egzersiz') ||
                                    quest.title?.toLowerCase().includes('koş') ||
                                    quest.title?.toLowerCase().includes('yürü') ||
                                    quest.title?.toLowerCase().includes('antrenman') ||
                                    quest.title?.toLowerCase().includes('spor')

                                const absValue = Math.abs(quest.calorie_impact)

                                return (
                                    <span className={twMerge(
                                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                                        isExercise
                                            ? "bg-gradient-to-r from-orange-100 to-amber-50 text-orange-700 border border-orange-200/60"
                                            : "bg-gradient-to-r from-teal-100 to-cyan-50 text-teal-700 border border-teal-200/60"
                                    )}>
                                        <Flame className="w-3.5 h-3.5" />
                                        {isExercise
                                            ? `${absValue} kcal yakılacak`
                                            : `${absValue} kcal tasarruf`}
                                    </span>
                                )
                            })()}
                        </div>

                        {/* Expandable Description Toggle */}
                        {(quest.description || quest.scientific_rationale) && state !== 'completed' && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsExpanded(!isExpanded)
                                }}
                                className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <ChevronDown className={twMerge(
                                    "w-3 h-3 transition-transform",
                                    isExpanded && "rotate-180"
                                )} />
                                {isExpanded ? 'Küçült' : 'Detaylar'}
                            </button>
                        )}

                        {/* Expandable Content */}
                        <AnimatePresence>
                            {isExpanded && (quest.description || quest.scientific_rationale) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="mt-2 pt-2 border-t border-slate-100/50 space-y-2">
                                        {/* Description */}
                                        {quest.description && (
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {quest.description}
                                            </p>
                                        )}

                                        {/* Scientific Rationale */}
                                        {quest.scientific_rationale && (
                                            <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/50 border border-amber-100">
                                                <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-[10px] text-amber-700 leading-relaxed">
                                                    {quest.scientific_rationale}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

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
            </motion.div >

            {/* Success Celebration Overlay with Progress Impact */}
            <AnimatePresence>
                {
                    showSuccess && (
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
                    )
                }
            </AnimatePresence >
        </div >
    )
}
