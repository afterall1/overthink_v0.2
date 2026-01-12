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
    Zap
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

export interface QuestCardProps {
    quest: DailyQuest
    goal?: Pick<Goal, 'id' | 'title'> | null
    streakCount?: number
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
    streakCount = 0,
    onComplete,
    onSkip,
    onClick,
    isLoading = false,
    className
}: QuestCardProps) {
    const [isCompleting, setIsCompleting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

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

        setIsCompleting(true)
        try {
            await onComplete(quest.id)
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                throw error
            }
        } finally {
            setIsCompleting(false)
        }
    }, [isInteractive, onComplete, quest.id])

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
                        </div>

                        {/* Completion Time (if completed) */}
                        {state === 'completed' && quest.completed_at && (
                            <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Tamamlandı
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

            {/* Success Celebration Overlay */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            +{quest.xp_reward} XP
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
