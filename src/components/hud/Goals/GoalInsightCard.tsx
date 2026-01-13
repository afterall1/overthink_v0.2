'use client'

import { motion } from 'framer-motion'
import {
    AlertTriangle,
    Lightbulb,
    Target,
    Flame,
    Calendar,
    TrendingUp,
    Zap,
    CheckCircle2
} from 'lucide-react'
import { clsx } from 'clsx'
import type { GoalCalculation, FeasibilityLevel } from '@/lib/goalCalculator'

// =====================================================
// Types
// =====================================================

interface GoalInsightCardProps {
    calculation: GoalCalculation
    className?: string
}

// =====================================================
// Constants
// =====================================================

const FEASIBILITY_CONFIG: Record<FeasibilityLevel, {
    label: string
    emoji: string
    bgColor: string
    textColor: string
    ringColor: string
}> = {
    easy: {
        label: 'Kolay',
        emoji: '🌱',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-700',
        ringColor: 'ring-emerald-300'
    },
    moderate: {
        label: 'Dengeli',
        emoji: '💪',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        ringColor: 'ring-blue-300'
    },
    challenging: {
        label: 'Zorlu',
        emoji: '🔥',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-700',
        ringColor: 'ring-amber-300'
    },
    extreme: {
        label: 'Ekstrem',
        emoji: '⚡',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        ringColor: 'ring-red-300'
    },
    unrealistic: {
        label: 'Gerçekçi Değil',
        emoji: '🚫',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        ringColor: 'ring-red-400'
    }
}

// =====================================================
// Component
// =====================================================

export default function GoalInsightCard({ calculation, className }: GoalInsightCardProps) {
    const feasibilityConfig = FEASIBILITY_CONFIG[calculation.feasibility]

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
                'rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white/80 to-slate-50/80',
                'backdrop-blur-sm shadow-lg shadow-indigo-500/5',
                'overflow-hidden',
                className
            )}
        >
            {/* Header with Feasibility Score */}
            <div className="p-4 border-b border-slate-100/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 
                                      flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Target className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Akıllı Hesaplama</h4>
                    </div>

                    {/* Feasibility Badge */}
                    <div className={clsx(
                        'px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5',
                        'ring-2',
                        feasibilityConfig.bgColor,
                        feasibilityConfig.textColor,
                        feasibilityConfig.ringColor
                    )}>
                        <span>{feasibilityConfig.emoji}</span>
                        <span>{feasibilityConfig.label}</span>
                    </div>
                </div>

                {/* Feasibility Progress Bar */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Başarı Olasılığı</span>
                        <span className="font-semibold" style={{ color: calculation.feasibilityColor }}>
                            %{calculation.feasibilityScore}
                        </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculation.feasibilityScore}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: calculation.feasibilityColor }}
                        />
                    </div>
                </div>
            </div>

            {/* Breakdown Grid */}
            <div className="p-4">
                <div className="grid grid-cols-2 gap-2">
                    {calculation.breakdown.map((item, index) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="p-3 rounded-xl bg-slate-50/80 border border-slate-100"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{item.emoji}</span>
                                <span className="text-xs text-slate-500 truncate">{item.label}</span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-slate-800">
                                    {item.value}
                                </span>
                                <span className="text-xs text-slate-400">{item.unit}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Warnings */}
            {calculation.warnings.length > 0 && (
                <div className="px-4 pb-2">
                    {calculation.warnings.map((warning, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
                            className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 mb-2"
                        >
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">{warning}</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Tips */}
            {calculation.tips.length > 0 && (
                <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-semibold text-slate-600">İpuçları</span>
                    </div>
                    <div className="space-y-1.5">
                        {calculation.tips.slice(0, 3).map((tip, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.2, delay: 0.4 + index * 0.1 }}
                                className="flex items-start gap-2"
                            >
                                <div className="w-4 h-4 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-3 h-3 text-violet-500" />
                                </div>
                                <p className="text-xs text-slate-600">{tip}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recommended Quests Preview */}
            {calculation.recommendedQuestSlugs.length > 0 && (
                <div className="p-4 border-t border-slate-100/50 bg-gradient-to-br from-violet-50/50 to-indigo-50/50">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-semibold text-slate-700">
                            Önerilen Günlük Görevler
                        </span>
                        <span className="text-xs text-slate-400">
                            ({calculation.recommendedQuestSlugs.length})
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">
                        Sonraki adımda bu hedefe uygun görevler otomatik seçilecek.
                    </p>
                </div>
            )}
        </motion.div>
    )
}

// =====================================================
// Compact Version for Inline Display
// =====================================================

interface GoalInsightBadgeProps {
    calculation: GoalCalculation
    className?: string
}

export function GoalInsightBadge({ calculation, className }: GoalInsightBadgeProps) {
    const feasibilityConfig = FEASIBILITY_CONFIG[calculation.feasibility]

    return (
        <div className={clsx(
            'inline-flex items-center gap-3 px-4 py-2 rounded-xl',
            'bg-gradient-to-r from-slate-50 to-white border border-slate-200/60',
            className
        )}>
            {/* Daily Target */}
            <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" style={{ color: calculation.feasibilityColor }} />
                <span className="text-sm font-bold text-slate-800">
                    {calculation.dailyTarget.toLocaleString('tr-TR')}
                </span>
                <span className="text-xs text-slate-400">{calculation.targetUnit}</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-200" />

            {/* Duration */}
            <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{calculation.totalDays} gün</span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-slate-200" />

            {/* Feasibility */}
            <div className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                feasibilityConfig.bgColor,
                feasibilityConfig.textColor
            )}>
                {feasibilityConfig.emoji} {feasibilityConfig.label}
            </div>
        </div>
    )
}
