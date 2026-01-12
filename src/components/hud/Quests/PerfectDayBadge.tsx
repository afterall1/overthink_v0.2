'use client'

import { motion } from 'framer-motion'
import { Trophy, Sparkles } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { QUEST_XP } from '@/lib/questEngine'

// =====================================================
// Types
// =====================================================

export interface PerfectDayBadgeProps {
    completed: number
    total: number
    isPerfect: boolean
    variant?: 'compact' | 'full'
    className?: string
}

// =====================================================
// Component
// =====================================================

export default function PerfectDayBadge({
    completed,
    total,
    isPerfect,
    variant = 'compact',
    className
}: PerfectDayBadgeProps) {
    const percentage = total > 0 ? (completed / total) * 100 : 0
    const remaining = total - completed

    if (variant === 'compact') {
        return (
            <motion.div
                animate={isPerfect ? {
                    scale: [1, 1.05, 1],
                    boxShadow: [
                        '0 0 0 rgba(234, 179, 8, 0)',
                        '0 0 20px rgba(234, 179, 8, 0.5)',
                        '0 0 0 rgba(234, 179, 8, 0)'
                    ]
                } : undefined}
                transition={{ duration: 2, repeat: Infinity }}
                className={twMerge(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full",
                    isPerfect
                        ? "bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/30"
                        : "bg-white/60 backdrop-blur-xl border border-white/40 text-slate-600",
                    className
                )}
            >
                <Trophy className={twMerge(
                    "w-4 h-4",
                    isPerfect ? "text-yellow-900" : "text-slate-400"
                )} />
                <span className="font-bold text-sm">
                    {completed}/{total}
                </span>
                {isPerfect && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 360] }}
                        transition={{ type: 'spring', duration: 0.5 }}
                    >
                        <Sparkles className="w-4 h-4 text-yellow-900" />
                    </motion.div>
                )}
            </motion.div>
        )
    }

    // Full variant
    return (
        <motion.div
            animate={isPerfect ? {
                boxShadow: [
                    '0 0 0 rgba(234, 179, 8, 0)',
                    '0 0 30px rgba(234, 179, 8, 0.4)',
                    '0 0 0 rgba(234, 179, 8, 0)'
                ]
            } : undefined}
            transition={{ duration: 2, repeat: Infinity }}
            className={twMerge(
                "relative overflow-hidden rounded-2xl p-4",
                isPerfect
                    ? "bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500"
                    : "bg-white/60 backdrop-blur-xl border border-white/40",
                className
            )}
        >
            {/* Background Pattern */}
            {isPerfect && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: [0, 0.3, 0],
                                y: [0, -100],
                                x: [Math.random() * 20 - 10]
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: i * 0.2
                            }}
                            className="absolute bottom-0 w-1 h-1 bg-white rounded-full"
                            style={{ left: `${(i / 12) * 100}%` }}
                        />
                    ))}
                </div>
            )}

            <div className="relative flex items-center gap-4">
                {/* Trophy Icon */}
                <motion.div
                    animate={isPerfect ? { rotate: [0, -10, 10, -10, 0] } : undefined}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className={twMerge(
                        "w-14 h-14 rounded-xl flex items-center justify-center",
                        isPerfect
                            ? "bg-white/20 backdrop-blur-sm"
                            : "bg-gradient-to-br from-slate-100 to-slate-50"
                    )}
                >
                    <Trophy className={twMerge(
                        "w-7 h-7",
                        isPerfect ? "text-white" : "text-slate-400"
                    )} />
                </motion.div>

                {/* Content */}
                <div className="flex-1">
                    <h3 className={twMerge(
                        "font-bold text-lg",
                        isPerfect ? "text-white" : "text-slate-800"
                    )}>
                        {isPerfect ? 'Mükemmel Gün! 🎉' : 'Perfect Day'}
                    </h3>

                    {isPerfect ? (
                        <p className="text-white/80 text-sm">
                            Tüm görevleri tamamladın! +{QUEST_XP.PERFECT_DAY} XP
                        </p>
                    ) : (
                        <p className="text-slate-500 text-sm">
                            {remaining} görev kaldı
                        </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-2 h-2 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: percentage / 100 }}
                            style={{ transformOrigin: 'left' }}
                            className={twMerge(
                                "h-full rounded-full",
                                isPerfect
                                    ? "bg-white"
                                    : "bg-gradient-to-r from-violet-500 to-indigo-500"
                            )}
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className={twMerge(
                    "text-right",
                    isPerfect ? "text-white" : "text-slate-600"
                )}>
                    <div className="text-2xl font-bold">
                        {completed}/{total}
                    </div>
                    <div className="text-xs opacity-70">
                        {Math.round(percentage)}%
                    </div>
                </div>
            </div>

            {/* Perfect Day XP Badge */}
            {isPerfect && (
                <motion.div
                    initial={{ scale: 0, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: 'spring', delay: 0.5 }}
                    className="absolute top-2 right-2 px-3 py-1 rounded-full 
                               bg-white text-amber-600 font-bold text-sm shadow-lg"
                >
                    +{QUEST_XP.PERFECT_DAY} XP
                </motion.div>
            )}
        </motion.div>
    )
}
