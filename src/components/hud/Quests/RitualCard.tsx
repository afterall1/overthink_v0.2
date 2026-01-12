'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Flame, Check, Coffee, ArrowRight } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { Ritual } from '@/types/database.types'
import { calculateRitualXp } from '@/lib/questEngine'

// =====================================================
// Types
// =====================================================

export interface RitualCardProps {
    ritual: Ritual
    onComplete: (ritualId: string) => Promise<void>
    onClick?: (ritual: Ritual) => void
    isCompletedToday?: boolean
    isLoading?: boolean
    className?: string
}

// =====================================================
// Component
// =====================================================

export default function RitualCard({
    ritual,
    onComplete,
    onClick,
    isCompletedToday = false,
    isLoading = false,
    className
}: RitualCardProps) {
    const [isCompleting, setIsCompleting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const { totalXp, streakMultiplier } = calculateRitualXp(ritual)
    const isInteractive = !isCompletedToday && !isLoading && !isCompleting

    const handleComplete = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isInteractive) return

        setIsCompleting(true)
        try {
            await onComplete(ritual.id)
            setShowSuccess(true)
            setTimeout(() => setShowSuccess(false), 2000)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                throw error
            }
        } finally {
            setIsCompleting(false)
        }
    }, [isInteractive, onComplete, ritual.id])

    const handleClick = useCallback(() => {
        if (onClick && !isCompleting) {
            onClick(ritual)
        }
    }, [onClick, ritual, isCompleting])

    // Streak status
    const streakStatus = ritual.current_streak === 0
        ? 'inactive'
        : ritual.current_streak >= 7
            ? 'active'
            : 'building'

    // Next milestone
    const nextMilestone = ritual.current_streak < 7
        ? 7
        : ritual.current_streak < 30
            ? 30
            : ritual.current_streak < 100
                ? 100
                : 365

    return (
        <motion.div
            onClick={handleClick}
            whileHover={isInteractive ? { scale: 1.01 } : undefined}
            whileTap={isInteractive ? { scale: 0.99 } : undefined}
            className={twMerge(
                "relative rounded-2xl overflow-hidden cursor-pointer",
                "bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-xl",
                "border border-white/40",
                "shadow-lg transition-all duration-300",
                isCompletedToday && "opacity-70",
                isInteractive && "hover:shadow-xl hover:border-violet-200/50",
                className
            )}
        >
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Ritual Icon */}
                    <div className={twMerge(
                        "flex-none w-10 h-10 rounded-xl flex items-center justify-center text-lg",
                        "transition-all duration-300",
                        isCompletedToday
                            ? "bg-emerald-100 border border-emerald-200"
                            : "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100"
                    )}>
                        {isCompleting ? (
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                                <RefreshCw className="w-5 h-5 text-violet-500" />
                            </motion.div>
                        ) : isCompletedToday ? (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                            >
                                <Check className="w-5 h-5 text-emerald-500" strokeWidth={3} />
                            </motion.div>
                        ) : (
                            <span>{ritual.emoji}</span>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Habit Stack Formula */}
                        <div className="flex items-center gap-2 text-sm mb-1">
                            <span className="font-medium text-slate-700 truncate max-w-[100px]">
                                {ritual.trigger_habit}
                            </span>
                            <ArrowRight className="w-4 h-4 text-slate-400 flex-none" />
                            <span className={twMerge(
                                "font-semibold truncate",
                                isCompletedToday ? "text-slate-500 line-through" : "text-slate-800"
                            )}>
                                {ritual.action}
                            </span>
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            {/* Streak */}
                            <div className={twMerge(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full",
                                streakStatus === 'active'
                                    ? "bg-orange-100 text-orange-600"
                                    : streakStatus === 'building'
                                        ? "bg-amber-50 text-amber-600"
                                        : "bg-slate-100 text-slate-500"
                            )}>
                                <Flame className={twMerge(
                                    "w-3 h-3",
                                    streakStatus === 'active' && "fill-current animate-pulse"
                                )} />
                                <span className="font-medium">{ritual.current_streak} gün</span>
                            </div>

                            {/* Multiplier */}
                            {streakMultiplier > 1 && (
                                <span className="text-violet-600 font-medium">
                                    {streakMultiplier.toFixed(1)}x
                                </span>
                            )}

                            {/* Next Milestone */}
                            <span className="text-slate-400">
                                Sonraki: {nextMilestone} gün
                            </span>
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-2">
                        {/* XP Badge */}
                        <div className={twMerge(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            "bg-gradient-to-r from-violet-500 to-indigo-500 text-white",
                            "shadow-sm shadow-violet-500/30"
                        )}>
                            +{totalXp} XP
                        </div>

                        {/* Complete Button */}
                        {isInteractive && (
                            <motion.button
                                onClick={handleComplete}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex-none w-8 h-8 rounded-xl bg-white/80 border border-slate-100 
                                           flex items-center justify-center hover:bg-emerald-50 
                                           hover:border-emerald-200 transition-colors group"
                                aria-label="Ritüeli tamamla"
                            >
                                <Check className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Streak Progress Bar */}
                {ritual.current_streak > 0 && ritual.current_streak < nextMilestone && (
                    <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>{ritual.current_streak} gün</span>
                            <span>{nextMilestone} gün hedef</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: ritual.current_streak / nextMilestone }}
                                style={{ transformOrigin: 'left' }}
                                className={twMerge(
                                    "h-full rounded-full",
                                    streakStatus === 'active'
                                        ? "bg-gradient-to-r from-orange-400 to-amber-500"
                                        : "bg-gradient-to-r from-violet-400 to-indigo-500"
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* Longest Streak Badge */}
                {ritual.longest_streak > 0 && ritual.longest_streak > ritual.current_streak && (
                    <div className="mt-2 text-xs text-slate-400">
                        En uzun seri: {ritual.longest_streak} gün
                    </div>
                )}
            </div>

            {/* Success Overlay */}
            {showSuccess && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 bg-emerald-500/90 flex items-center justify-center"
                >
                    <div className="text-white font-bold flex items-center gap-2">
                        <Check className="w-5 h-5" />
                        +{totalXp} XP
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
