'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Flame,
    Target,
    Utensils,
    Zap,
    TrendingDown,
    TrendingUp,
    Sun,
    Coffee,
    Moon,
    Cookie,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    Loader2
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { getDailyCalorieStatus, type DailyCalorieStatus } from '@/actions/calorieTracking'

// =====================================================
// Types
// =====================================================

interface CalorieBudgetSummaryProps {
    /** Goal ID for filtering quests */
    goalId?: string
    /** Whether user has health profile */
    hasHealthProfile: boolean
    /** Custom class name */
    className?: string
}

// =====================================================
// Meal Icons
// =====================================================

const MEAL_ICONS = {
    breakfast: Sun,
    lunch: Utensils,
    dinner: Moon,
    snack: Cookie
} as const

const MEAL_LABELS = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle',
    dinner: 'Akşam',
    snack: 'Atıştırmalık'
} as const

// =====================================================
// Circular Progress Component
// =====================================================

function CircularProgress({
    percentage,
    size = 120,
    strokeWidth = 8,
    statusType
}: {
    percentage: number
    size?: number
    strokeWidth?: number
    statusType: DailyCalorieStatus['statusType']
}) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const cappedPercentage = Math.min(100, Math.max(0, percentage))
    const offset = circumference - (cappedPercentage / 100) * circumference

    const colorMap = {
        success: 'stroke-emerald-500',
        warning: 'stroke-amber-500',
        danger: 'stroke-red-500',
        neutral: 'stroke-slate-400'
    }

    const bgColorMap = {
        success: 'stroke-emerald-100',
        warning: 'stroke-amber-100',
        danger: 'stroke-red-100',
        neutral: 'stroke-slate-100'
    }

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
                className={bgColorMap[statusType]}
                strokeWidth={strokeWidth}
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
            />
            {/* Progress circle */}
            <motion.circle
                className={colorMap[statusType]}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="transparent"
                r={radius}
                cx={size / 2}
                cy={size / 2}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                style={{
                    strokeDasharray: circumference
                }}
            />
        </svg>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function CalorieBudgetSummary({
    goalId,
    hasHealthProfile,
    className
}: CalorieBudgetSummaryProps) {
    const [status, setStatus] = useState<DailyCalorieStatus | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExpanded, setIsExpanded] = useState(false)

    // Don't render if no health profile
    if (!hasHealthProfile) {
        return null
    }

    // Fetch calorie status
    useEffect(() => {
        async function fetchStatus() {
            setIsLoading(true)
            setError(null)

            try {
                const result = await getDailyCalorieStatus(undefined, goalId)

                if (result.success && result.data) {
                    setStatus(result.data)
                } else {
                    setError(result.error ?? 'Veri alınamadı')
                }
            } catch (err) {
                console.error('[CalorieBudgetSummary] Error:', err)
                setError('Beklenmeyen bir hata oluştu')
            } finally {
                setIsLoading(false)
            }
        }

        fetchStatus()
    }, [goalId])

    // Status colors
    const statusColorMap = useMemo(() => ({
        success: {
            gradient: 'from-emerald-50 via-teal-50 to-cyan-50',
            border: 'border-emerald-200',
            text: 'text-emerald-700',
            icon: CheckCircle2
        },
        warning: {
            gradient: 'from-amber-50 via-orange-50 to-yellow-50',
            border: 'border-amber-200',
            text: 'text-amber-700',
            icon: AlertCircle
        },
        danger: {
            gradient: 'from-red-50 via-rose-50 to-pink-50',
            border: 'border-red-200',
            text: 'text-red-700',
            icon: AlertCircle
        },
        neutral: {
            gradient: 'from-slate-50 via-gray-50 to-zinc-50',
            border: 'border-slate-200',
            text: 'text-slate-700',
            icon: Target
        }
    }), [])

    // Loading state
    if (isLoading) {
        return (
            <div className={twMerge(
                "p-5 rounded-3xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200",
                className
            )}>
                <div className="flex items-center justify-center gap-3 py-4">
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                    <span className="text-sm text-slate-500">Kalori durumu yükleniyor...</span>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !status) {
        return (
            <div className={twMerge(
                "p-5 rounded-3xl bg-gradient-to-br from-red-50 to-rose-50 border border-red-200",
                className
            )}>
                <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700">{error ?? 'Veri yüklenemedi'}</span>
                </div>
            </div>
        )
    }

    const {
        targetCalories,
        consumedCalories,
        questCalorieImpact,
        remainingCalories,
        percentageUsed,
        statusMessage,
        statusType,
        meals,
        quests
    } = status

    const style = statusColorMap[statusType]
    const StatusIcon = style.icon

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge(
                "relative overflow-hidden rounded-3xl border p-5",
                "bg-gradient-to-br",
                style.gradient,
                style.border,
                className
            )}
        >
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 
                              flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-slate-800">Günlük Kalori Bütçesi</h4>
                    <p className="text-xs text-slate-500">Hedef: {targetCalories} kcal</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex items-center gap-6">
                {/* Circular Progress */}
                <div className="relative flex-shrink-0">
                    <CircularProgress
                        percentage={percentageUsed}
                        statusType={statusType}
                    />
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800">
                            {remainingCalories}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                            kalan kcal
                        </span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-3">
                    {/* Consumed */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-slate-600">Tüketilen</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">
                            {consumedCalories} kcal
                        </span>
                    </div>

                    {/* Quest Impact */}
                    {questCalorieImpact !== 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {questCalorieImpact < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                )}
                                <span className="text-sm text-slate-600">
                                    {questCalorieImpact < 0 ? 'Yakılan' : 'Kazanılan'}
                                </span>
                            </div>
                            <span className={twMerge(
                                "text-sm font-bold",
                                questCalorieImpact < 0 ? "text-emerald-600" : "text-blue-600"
                            )}>
                                {questCalorieImpact < 0 ? '+' : ''}{Math.abs(questCalorieImpact)} kcal
                            </span>
                        </div>
                    )}

                    {/* Status Message */}
                    <div className={twMerge(
                        "flex items-center gap-2 p-2 rounded-xl",
                        statusType === 'success' && "bg-emerald-100/50",
                        statusType === 'warning' && "bg-amber-100/50",
                        statusType === 'danger' && "bg-red-100/50",
                        statusType === 'neutral' && "bg-slate-100/50"
                    )}>
                        <StatusIcon className={twMerge("w-4 h-4", style.text)} />
                        <span className={twMerge("text-xs font-medium", style.text)}>
                            {statusMessage}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expandable Details */}
            {(meals.length > 0 || quests.length > 0) && (
                <>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center justify-center gap-1 w-full mt-4 pt-3 
                                 border-t border-slate-200/50 text-xs text-slate-500 
                                 hover:text-slate-700 transition-colors"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-3 h-3" />
                                Detayları Gizle
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-3 h-3" />
                                Detayları Göster ({meals.length} öğün, {quests.length} görev)
                            </>
                        )}
                    </button>

                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-4 space-y-4">
                                    {/* Meals Breakdown */}
                                    {meals.length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                Öğünler
                                            </h5>
                                            <div className="space-y-2">
                                                {meals.map((meal, index) => {
                                                    const MealIcon = MEAL_ICONS[meal.type]
                                                    return (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-2 
                                                                     bg-white/60 rounded-xl"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <MealIcon className="w-4 h-4 text-slate-400" />
                                                                <div>
                                                                    <span className="text-sm text-slate-700">
                                                                        {MEAL_LABELS[meal.type]}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 ml-2">
                                                                        {meal.time}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800">
                                                                {meal.calories} kcal
                                                            </span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quest Contributions */}
                                    {quests.length > 0 && (
                                        <div>
                                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                Görev Katkıları
                                            </h5>
                                            <div className="space-y-2">
                                                {quests.map((quest) => (
                                                    <div
                                                        key={quest.id}
                                                        className="flex items-center justify-between p-2 
                                                                 bg-white/60 rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-violet-500" />
                                                            <span className="text-sm text-slate-700 truncate max-w-[150px]">
                                                                {quest.title}
                                                            </span>
                                                        </div>
                                                        <span className={twMerge(
                                                            "text-sm font-bold",
                                                            quest.calorie_impact < 0
                                                                ? "text-emerald-600"
                                                                : "text-blue-600"
                                                        )}>
                                                            {quest.calorie_impact < 0 ? '+' : ''}
                                                            {Math.abs(quest.calorie_impact)} kcal
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </motion.section>
    )
}
