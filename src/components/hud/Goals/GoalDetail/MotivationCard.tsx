'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, ChevronDown, ChevronUp, Quote, Flame } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

// =====================================================
// Types
// =====================================================

interface MotivationCardProps {
    /** User's "why" - their motivation statement */
    motivation: string | null
    /** User's identity statement: "Ben ... olan biriyim" */
    identityStatement: string | null
    /** Goal title for contextual messaging */
    goalTitle: string
    /** Current streak days for personalized encouragement */
    streakDays: number
    /** Category slug for theming */
    categorySlug?: string | null
    /** Custom class name */
    className?: string
}

// =====================================================
// Category Themes
// =====================================================

const CATEGORY_THEMES: Record<string, { gradient: string; iconBg: string; quoteBg: string }> = {
    food: {
        gradient: 'from-emerald-50 via-teal-50 to-cyan-50',
        iconBg: 'from-emerald-400 to-teal-500',
        quoteBg: 'bg-emerald-100/50'
    },
    sport: {
        gradient: 'from-blue-50 via-indigo-50 to-violet-50',
        iconBg: 'from-blue-400 to-indigo-500',
        quoteBg: 'bg-blue-100/50'
    },
    dev: {
        gradient: 'from-violet-50 via-purple-50 to-fuchsia-50',
        iconBg: 'from-violet-400 to-purple-500',
        quoteBg: 'bg-violet-100/50'
    },
    trade: {
        gradient: 'from-amber-50 via-orange-50 to-yellow-50',
        iconBg: 'from-amber-400 to-orange-500',
        quoteBg: 'bg-amber-100/50'
    },
    etsy: {
        gradient: 'from-pink-50 via-rose-50 to-red-50',
        iconBg: 'from-pink-400 to-rose-500',
        quoteBg: 'bg-pink-100/50'
    },
    gaming: {
        gradient: 'from-cyan-50 via-sky-50 to-blue-50',
        iconBg: 'from-cyan-400 to-sky-500',
        quoteBg: 'bg-cyan-100/50'
    }
}

const DEFAULT_THEME = {
    gradient: 'from-rose-50 via-pink-50 to-orange-50',
    iconBg: 'from-rose-400 to-pink-500',
    quoteBg: 'bg-rose-100/50'
}

// =====================================================
// Helper Functions
// =====================================================

function getStreakEncouragement(streak: number): string {
    if (streak >= 21) return '🏆 Efsanevi tutarlılık!'
    if (streak >= 14) return '💪 Ustaca devam ediyorsun!'
    if (streak >= 7) return '🔥 Harika bir ritim yakaladın!'
    if (streak >= 3) return '⚡ İvme kazanıyorsun!'
    if (streak >= 1) return '🌱 Güzel bir başlangıç!'
    return ''
}

function truncateText(text: string, maxLength: number): { truncated: string; isTruncated: boolean } {
    if (text.length <= maxLength) {
        return { truncated: text, isTruncated: false }
    }
    return { truncated: text.slice(0, maxLength).trim() + '...', isTruncated: true }
}

// =====================================================
// Main Component
// =====================================================

export default function MotivationCard({
    motivation,
    identityStatement,
    goalTitle,
    streakDays,
    categorySlug,
    className
}: MotivationCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // Don't render if neither motivation nor identity is present
    if (!motivation && !identityStatement) {
        return null
    }

    // Get theme based on category
    const theme = categorySlug && CATEGORY_THEMES[categorySlug] 
        ? CATEGORY_THEMES[categorySlug] 
        : DEFAULT_THEME

    // Process motivation text
    const motivationDisplay = useMemo(() => {
        if (!motivation) return null
        return truncateText(motivation, 120)
    }, [motivation])

    const streakMessage = getStreakEncouragement(streakDays)

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={twMerge(
                "relative overflow-hidden rounded-3xl border border-white/60",
                "bg-gradient-to-br shadow-lg shadow-rose-500/5",
                theme.gradient,
                className
            )}
        >
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="relative p-5">
                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    {/* Icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className={twMerge(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            "bg-gradient-to-br shadow-lg",
                            theme.iconBg
                        )}
                    >
                        <Heart className="w-5 h-5 text-white" fill="white" />
                    </motion.div>

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Motivasyonun
                        </p>
                        <h4 className="text-sm font-semibold text-slate-700 truncate">
                            {goalTitle}
                        </h4>
                    </div>

                    {/* Streak Badge */}
                    {streakDays > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3, type: 'spring' }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700"
                        >
                            <Flame className="w-3 h-3" />
                            <span className="text-xs font-bold">{streakDays}</span>
                        </motion.div>
                    )}
                </div>

                {/* Identity Statement - Hero Element */}
                {identityStatement && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className={twMerge(
                            "rounded-2xl p-4 mb-3",
                            theme.quoteBg
                        )}
                    >
                        <div className="flex items-start gap-2">
                            <Quote className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                            <p className="text-base font-bold text-slate-800 leading-relaxed">
                                Ben <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                    {identityStatement}
                                </span> olan biriyim.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Motivation Text */}
                {motivationDisplay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.35 }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={isExpanded ? 'expanded' : 'collapsed'}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-sm text-slate-600 leading-relaxed"
                            >
                                {isExpanded ? motivation : motivationDisplay.truncated}
                            </motion.p>
                        </AnimatePresence>

                        {/* Expand/Collapse Button */}
                        {motivationDisplay.isTruncated && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="flex items-center gap-1 mt-2 text-xs font-medium text-slate-500 
                                         hover:text-slate-700 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        <ChevronUp className="w-3 h-3" />
                                        Daha az göster
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="w-3 h-3" />
                                        Devamını oku
                                    </>
                                )}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Streak Encouragement */}
                {streakMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="mt-3 pt-3 border-t border-slate-200/50"
                    >
                        <p className="text-xs text-slate-500">
                            {streakMessage}
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.section>
    )
}
