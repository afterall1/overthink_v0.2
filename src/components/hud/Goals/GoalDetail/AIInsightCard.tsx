'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { Sparkles, MessageCircle, Lightbulb } from 'lucide-react'
import type { GoalWithDetails } from '@/types/database.types'
import { getStreakTier, getMaturityStage, calculateProgress } from './types'

// =====================================================
// Types
// =====================================================

interface AIInsightCardProps {
    goal: GoalWithDetails
    streak: number
    momentum: number
    velocity: number
    maturityDays: number
    className?: string
    onAskAI?: () => void
}

// =====================================================
// Insight Generator
// =====================================================

function generateInsight(
    progress: number,
    streak: number,
    momentum: number,
    velocity: number,
    maturityDays: number
): { message: string; type: 'celebration' | 'motivation' | 'warning' | 'tip' } {
    // Completed
    if (progress >= 100) {
        return {
            message: "🎉 Muhteşem! Bu hedefi başarıyla tamamladın. Başarının tadını çıkar ve yeni ufuklara yelken aç!",
            type: 'celebration'
        }
    }

    // High momentum
    if (momentum >= 80) {
        return {
            message: `🚀 Muhteşem momentum! ${momentum} puanla zirvedesin. Bu tutarlılığı korursan hedefine çok önce ulaşacaksın!`,
            type: 'celebration'
        }
    }

    // Legend streak
    if (streak >= 21) {
        const tier = getStreakTier(streak)
        return {
            message: `👑 LEGEND! ${streak} günlük streak ile alışkanlığını kalıcı hale getirdin. ×${tier?.multiplier || 2.0} bonus seninle!`,
            type: 'celebration'
        }
    }

    // Good streak
    if (streak >= 7) {
        const tier = getStreakTier(streak)
        return {
            message: `🔥 ${streak} günlük streak! ${tier?.label || 'STREAK'} statüsünde ×${tier?.multiplier || 1.4} bonus kazanıyorsun. Devam et!`,
            type: 'motivation'
        }
    }

    // Positive velocity
    if (velocity >= 20) {
        return {
            message: `📈 Harika gidiyorsun! Hedefinin %${velocity.toFixed(0)} üzerinde ilerliyorsun. Bu tempoda erken bitireceksin!`,
            type: 'motivation'
        }
    }

    // Negative velocity - warning
    if (velocity < -20) {
        return {
            message: "⚡ Biraz hızlanman gerekebilir. Ama endişelenme, her gün yeni bir fırsat. Bugün küçük bir adım at!",
            type: 'warning'
        }
    }

    // Streak at risk (1-2 days)
    if (streak > 0 && streak < 3) {
        return {
            message: `⚠️ ${streak} günlük zincirin devam ediyor. 3 güne ulaşırsan ×1.2 bonus açılacak!`,
            type: 'tip'
        }
    }

    // Early stage (low maturity)
    if (maturityDays < 7 && progress < 30) {
        const maturity = getMaturityStage(maturityDays)
        return {
            message: `🌱 Henüz ${maturity.label} aşamasındasın. Her büyük yolculuk tek adımla başlar. Bugün bir görev tamamla!`,
            type: 'tip'
        }
    }

    // Default motivation
    return {
        message: `💪 İlerleme kaydediyorsun! Momentum'un ${momentum}, devam ettikçe artacak. Her gün seni hedefe yaklaştırıyor.`,
        type: 'motivation'
    }
}

// =====================================================
// Component
// =====================================================

export default function AIInsightCard({
    goal,
    streak,
    momentum,
    velocity,
    maturityDays,
    className,
    onAskAI
}: AIInsightCardProps) {
    const progress = useMemo(() => calculateProgress(goal), [goal])

    const insight = useMemo(
        () => generateInsight(progress, streak, momentum, velocity, maturityDays),
        [progress, streak, momentum, velocity, maturityDays]
    )

    const typeStyles = {
        celebration: 'from-emerald-50 via-teal-50 to-cyan-50 border-emerald-200',
        motivation: 'from-violet-50 via-indigo-50 to-blue-50 border-violet-200',
        warning: 'from-amber-50 via-orange-50 to-yellow-50 border-amber-200',
        tip: 'from-sky-50 via-blue-50 to-indigo-50 border-sky-200'
    }

    const iconStyles = {
        celebration: 'from-emerald-400 to-teal-500 shadow-emerald-500/30',
        motivation: 'from-violet-400 to-purple-500 shadow-violet-500/30',
        warning: 'from-amber-400 to-orange-500 shadow-amber-500/30',
        tip: 'from-sky-400 to-blue-500 shadow-sky-500/30'
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge(
                "relative overflow-hidden rounded-3xl border p-5",
                "bg-gradient-to-br",
                typeStyles[insight.type],
                className
            )}
        >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-start gap-3 relative">
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                    className={twMerge(
                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                        "bg-gradient-to-br shadow-lg",
                        iconStyles[insight.type]
                    )}
                >
                    {insight.type === 'tip' ? (
                        <Lightbulb className="w-5 h-5 text-white" />
                    ) : (
                        <Sparkles className="w-5 h-5 text-white" />
                    )}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        AI Insight
                    </p>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-slate-700 leading-relaxed"
                    >
                        {insight.message}
                    </motion.p>
                </div>
            </div>

            {/* Ask AI Button */}
            {onAskAI && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAskAI}
                    className="mt-4 w-full py-2.5 rounded-xl bg-white/60 backdrop-blur-sm 
                               border border-white/80 text-sm font-medium text-slate-600
                               hover:bg-white/80 transition-all flex items-center justify-center gap-2"
                >
                    <MessageCircle className="w-4 h-4" />
                    AI&apos;ya Sor
                </motion.button>
            )}
        </motion.section>
    )
}
