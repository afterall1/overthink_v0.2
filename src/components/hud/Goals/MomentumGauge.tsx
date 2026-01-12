'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

// =====================================================
// Types
// =====================================================

interface MomentumGaugeProps {
    /** Momentum score from 0 to 100 */
    momentum: number
    /** Current streak count */
    streak?: number
    /** Habit maturity days */
    maturityDays?: number
    /** Size of the gauge: 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg'
    /** Show streak badge */
    showStreak?: boolean
    /** Show maturity label */
    showMaturity?: boolean
    /** Optional className */
    className?: string
}

// =====================================================
// Constants
// =====================================================

const SIZE_CONFIG = {
    sm: { width: 64, strokeWidth: 6, iconSize: 16, fontSize: 'text-lg' },
    md: { width: 80, strokeWidth: 7, iconSize: 20, fontSize: 'text-xl' },
    lg: { width: 100, strokeWidth: 8, iconSize: 24, fontSize: 'text-2xl' }
} as const

const MATURITY_CONFIG = {
    seed: { label: 'Tohum', emoji: '🌱', min: 0 },
    sprouting: { label: 'Filiz', emoji: '🌿', min: 7 },
    growing: { label: 'Büyüme', emoji: '🌳', min: 14 },
    mature: { label: 'Olgun', emoji: '🌲', min: 21 }
} as const

// =====================================================
// Helpers
// =====================================================

function getMaturityStage(days: number): keyof typeof MATURITY_CONFIG {
    if (days >= 21) return 'mature'
    if (days >= 14) return 'growing'
    if (days >= 7) return 'sprouting'
    return 'seed'
}

function getStreakMultiplier(streak: number): number {
    if (streak >= 21) return 2.0
    if (streak >= 14) return 1.6
    if (streak >= 7) return 1.4
    if (streak >= 3) return 1.2
    return 1.0
}

function getMomentumColor(momentum: number): string {
    if (momentum >= 80) return '#10b981' // emerald
    if (momentum >= 60) return '#8b5cf6' // violet
    if (momentum >= 40) return '#3b82f6' // blue
    if (momentum >= 20) return '#f59e0b' // amber
    return '#94a3b8' // slate
}

// =====================================================
// Component
// =====================================================

export default function MomentumGauge({
    momentum,
    streak = 0,
    maturityDays = 0,
    size = 'md',
    showStreak = true,
    showMaturity = true,
    className
}: MomentumGaugeProps) {
    const config = SIZE_CONFIG[size]
    const radius = (config.width - config.strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const clampedMomentum = Math.min(100, Math.max(0, momentum))
    const offset = circumference - (clampedMomentum / 100) * circumference

    const maturityStage = getMaturityStage(maturityDays)
    const maturity = MATURITY_CONFIG[maturityStage]
    const streakMultiplier = getStreakMultiplier(streak)
    const momentumColor = getMomentumColor(momentum)

    return (
        <div className={twMerge("flex flex-col items-center gap-2", className)}>
            {/* Gauge */}
            <div
                className="relative flex items-center justify-center"
                style={{ width: config.width, height: config.width }}
            >
                <svg
                    width={config.width}
                    height={config.width}
                    className="transform -rotate-90"
                >
                    {/* Gradient Definition */}
                    <defs>
                        <linearGradient id="momentum-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f59e0b" />
                            <stop offset="50%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                    </defs>

                    {/* Background Track */}
                    <circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={config.strokeWidth}
                        className="stroke-slate-100"
                        style={{ strokeOpacity: 0.5 }}
                    />

                    {/* Progress Arc */}
                    <motion.circle
                        cx={config.width / 2}
                        cy={config.width / 2}
                        r={radius}
                        fill="none"
                        strokeWidth={config.strokeWidth}
                        strokeLinecap="round"
                        stroke={momentumColor}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            strokeDasharray: circumference,
                            filter: momentum >= 60 ? `drop-shadow(0 0 8px ${momentumColor}50)` : undefined
                        }}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Zap
                        className="text-amber-500"
                        style={{ width: config.iconSize, height: config.iconSize }}
                        fill={momentum >= 50 ? 'currentColor' : 'none'}
                    />
                    <span className={twMerge(config.fontSize, "font-bold text-slate-800")}>
                        {clampedMomentum}
                    </span>
                </div>

                {/* Streak Badge (top-right) */}
                {showStreak && streak > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 
                                   rounded-full bg-gradient-to-r from-orange-400 to-amber-500 
                                   text-white text-[10px] font-bold shadow-md"
                    >
                        🔥 {streak}
                        {streakMultiplier > 1 && (
                            <span className="text-[8px] opacity-80">×{streakMultiplier}</span>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Label */}
            <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Momentum
                </p>

                {/* Maturity Badge */}
                {showMaturity && (
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                        <span className="text-sm">{maturity.emoji}</span>
                        <span className="text-[10px] text-slate-500">
                            {maturity.label}
                            <span className="text-slate-400 ml-0.5">({maturityDays}g)</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

// =====================================================
// Compact Variant for Cards
// =====================================================

interface MomentumBadgeProps {
    momentum: number
    streak?: number
    className?: string
}

export function MomentumBadge({ momentum, streak = 0, className }: MomentumBadgeProps) {
    const color = getMomentumColor(momentum)

    return (
        <div className={twMerge(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg",
            "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100",
            className
        )}>
            <Zap
                className="w-3.5 h-3.5 text-amber-500"
                fill={momentum >= 50 ? 'currentColor' : 'none'}
            />
            <span
                className="text-xs font-bold"
                style={{ color }}
            >
                {momentum}
            </span>
            {streak > 0 && (
                <span className="text-[10px] text-orange-500 flex items-center gap-0.5">
                    🔥{streak}
                </span>
            )}
        </div>
    )
}

// =====================================================
// Animated Momentum Change
// =====================================================

interface MomentumChangeProps {
    from: number
    to: number
    streak?: number
    className?: string
}

export function MomentumChange({ from, to, streak = 0, className }: MomentumChangeProps) {
    const diff = to - from
    const isPositive = diff > 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge("flex flex-col items-center gap-1", className)}
        >
            <div className="flex items-center gap-2">
                <span className="text-slate-400 text-sm">{from}</span>
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-teal-500"
                >
                    →
                </motion.span>
                <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="text-lg font-bold text-teal-600"
                >
                    {to}
                </motion.span>
            </div>

            {isPositive && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium"
                >
                    <Zap className="w-3 h-3" />
                    +{diff} momentum
                    {streak >= 3 && (
                        <span className="text-orange-500">(🔥×{getStreakMultiplier(streak)})</span>
                    )}
                </motion.div>
            )}
        </motion.div>
    )
}
