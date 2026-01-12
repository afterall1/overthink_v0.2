'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Calendar, Zap } from 'lucide-react'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { VelocityInfo } from '@/lib/streakEngine'

interface VelocityMeterProps {
    velocity: VelocityInfo
    progress: number
    unit?: string
    variant?: 'full' | 'compact'
    className?: string
}

export default function VelocityMeter({
    velocity,
    progress,
    unit = 'birim',
    variant = 'full',
    className
}: VelocityMeterProps) {
    const {
        currentVelocity,
        velocityDelta,
        isOnTrack,
        estimatedCompletionDate,
        velocityMessage
    } = velocity

    const TrendIcon = velocityDelta > 5
        ? TrendingUp
        : velocityDelta < -5
            ? TrendingDown
            : Minus

    const trendColor = velocityDelta > 5
        ? '#10B981'
        : velocityDelta < -5
            ? '#EF4444'
            : '#3B82F6'

    if (variant === 'compact') {
        return (
            <div
                className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                    className
                )}
                style={{
                    backgroundColor: `${trendColor}15`,
                    color: trendColor
                }}
            >
                <TrendIcon className="w-3 h-3" />
                <span>
                    {velocityDelta > 0 ? '+' : ''}{velocityDelta.toFixed(0)}%
                </span>
            </div>
        )
    }

    // Full variant
    return (
        <div className={clsx('space-y-3', className)}>
            {/* Velocity Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${trendColor}15` }}
                    >
                        <Zap className="w-4 h-4" style={{ color: trendColor }} />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500">Günlük Hız</p>
                        <p className="text-sm font-bold text-slate-800">
                            {currentVelocity.toFixed(1)} {unit}/gün
                        </p>
                    </div>
                </div>

                {/* Trend Badge */}
                <div
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold"
                    style={{
                        backgroundColor: `${trendColor}15`,
                        color: trendColor
                    }}
                >
                    <TrendIcon className="w-4 h-4" />
                    <span>{velocityDelta > 0 ? '+' : ''}{velocityDelta.toFixed(0)}%</span>
                </div>
            </div>

            {/* Progress Bar with Velocity Indicator */}
            <div className="relative">
                {/* Background track */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    {/* Progress fill */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, progress)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full relative"
                        style={{
                            background: `linear-gradient(90deg, ${trendColor}80, ${trendColor})`
                        }}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                    </motion.div>
                </div>

                {/* Progress percentage label */}
                <div
                    className="absolute -top-1 transform -translate-x-1/2 transition-all duration-500"
                    style={{ left: `${Math.min(95, Math.max(5, progress))}%` }}
                >
                    <div
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: trendColor }}
                    >
                        {progress.toFixed(0)}%
                    </div>
                </div>
            </div>

            {/* Message and Estimated Completion */}
            <div className="flex items-center justify-between text-xs">
                <p style={{ color: trendColor }} className="font-medium">
                    {velocityMessage}
                </p>

                {estimatedCompletionDate && (
                    <div className="flex items-center gap-1 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                            Tahmini: {format(estimatedCompletionDate, 'd MMM', { locale: tr })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}
