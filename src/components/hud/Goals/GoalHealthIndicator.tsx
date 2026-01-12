'use client'

import { motion } from 'framer-motion'
import { Heart, AlertTriangle, TrendingUp, TrendingDown, Minus, Trophy } from 'lucide-react'
import { clsx } from 'clsx'
import type { GoalHealthInfo } from '@/lib/streakEngine'

interface GoalHealthIndicatorProps {
    health: GoalHealthInfo
    variant?: 'bar' | 'hearts' | 'compact'
    showMessage?: boolean
    className?: string
}

export default function GoalHealthIndicator({
    health,
    variant = 'bar',
    showMessage = true,
    className
}: GoalHealthIndicatorProps) {
    const { healthLevel, healthStatus, healthMessage, healthColor } = health

    if (variant === 'hearts') {
        return (
            <div className={clsx('flex flex-col gap-1', className)}>
                <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((level) => (
                        <motion.div
                            key={level}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: level * 0.05, type: 'spring' }}
                        >
                            <Heart
                                className={clsx(
                                    'w-4 h-4 transition-colors',
                                    level <= healthLevel
                                        ? 'fill-current'
                                        : 'fill-slate-200 text-slate-200'
                                )}
                                style={{
                                    color: level <= healthLevel ? healthColor : undefined
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
                {showMessage && (
                    <p className="text-xs text-slate-500">{healthMessage}</p>
                )}
            </div>
        )
    }

    if (variant === 'compact') {
        const StatusIcon = getStatusIcon(healthStatus)

        return (
            <div
                className={clsx(
                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
                    className
                )}
                style={{
                    backgroundColor: `${healthColor}15`,
                    color: healthColor
                }}
            >
                <StatusIcon className="w-3 h-3" />
                <span className="capitalize">{getStatusLabel(healthStatus)}</span>
            </div>
        )
    }

    // Default: bar variant
    return (
        <div className={clsx('flex flex-col gap-2', className)}>
            {/* Progress Bar */}
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(healthLevel / 5) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ backgroundColor: healthColor }}
                />

                {/* Segment markers */}
                <div className="absolute inset-0 flex">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex-1 border-r border-white/50"
                        />
                    ))}
                    <div className="flex-1" />
                </div>
            </div>

            {/* Label */}
            {showMessage && (
                <div className="flex items-center justify-between text-xs">
                    <span
                        className="font-medium"
                        style={{ color: healthColor }}
                    >
                        {getStatusLabel(healthStatus)}
                    </span>
                    <span className="text-slate-400">{healthMessage}</span>
                </div>
            )}
        </div>
    )
}

function getStatusIcon(status: GoalHealthInfo['healthStatus']) {
    switch (status) {
        case 'champion':
            return Trophy
        case 'thriving':
            return TrendingUp
        case 'steady':
            return Minus
        case 'struggling':
            return TrendingDown
        case 'critical':
            return AlertTriangle
    }
}

function getStatusLabel(status: GoalHealthInfo['healthStatus']): string {
    switch (status) {
        case 'champion':
            return 'Şampiyon'
        case 'thriving':
            return 'Harika'
        case 'steady':
            return 'İstikrarlı'
        case 'struggling':
            return 'Zorlanıyor'
        case 'critical':
            return 'Kritik'
    }
}
