'use client'

import { motion } from 'framer-motion'
import { Trophy, Calendar, Flame, Zap } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { GoalWithDetails } from '@/types/database.types'
import {
    getPeriodStyle,
    getStreakTier,
    getMaturityStage,
    formatDaysLeft,
    PERIOD_LABELS
} from './types'

// =====================================================
// Types
// =====================================================

interface HeroSectionProps {
    goal: GoalWithDetails
    progress: number
    momentum: number
    streak: number
    maturityDays: number
    isCompleted: boolean
}

// =====================================================
// Animated Counter Hook
// =====================================================

function useAnimatedCounter(value: number, duration: number = 1000) {
    const [displayValue, setDisplayValue] = React.useState(0)

    React.useEffect(() => {
        let startTime: number | null = null
        let animationFrame: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)
            setDisplayValue(Math.round(value * eased))

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [value, duration])

    return displayValue
}

import React from 'react'

// =====================================================
// Dual Ring Component (Apple Fitness Inspired)
// =====================================================

interface DualRingProps {
    outerProgress: number // Direct progress 0-100
    innerProgress: number // Momentum 0-100
    size?: number
    outerColor?: string
    innerColor?: string
}

function DualRing({
    outerProgress,
    innerProgress,
    size = 160,
    outerColor = '#8b5cf6',
    innerColor = '#f59e0b'
}: DualRingProps) {
    const outerRadius = (size - 16) / 2
    const innerRadius = outerRadius - 20
    const outerCircumference = outerRadius * 2 * Math.PI
    const innerCircumference = innerRadius * 2 * Math.PI

    const outerOffset = outerCircumference - (Math.min(100, outerProgress) / 100) * outerCircumference
    const innerOffset = innerCircumference - (Math.min(100, innerProgress) / 100) * innerCircumference

    const animatedOuter = useAnimatedCounter(outerProgress, 1200)
    const animatedInner = useAnimatedCounter(innerProgress, 1400)

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Gradient Definitions */}
                <defs>
                    <linearGradient id="outer-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient id="inner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#fbbf24" />
                    </linearGradient>
                    {/* Glow filters */}
                    <filter id="outer-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="inner-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Outer Ring Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={outerRadius}
                    fill="none"
                    strokeWidth={12}
                    className="stroke-violet-100"
                    style={{ strokeOpacity: 0.4 }}
                />

                {/* Outer Ring Progress */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={outerRadius}
                    fill="none"
                    strokeWidth={12}
                    strokeLinecap="round"
                    stroke="url(#outer-gradient)"
                    filter={outerProgress >= 50 ? "url(#outer-glow)" : undefined}
                    initial={{ strokeDashoffset: outerCircumference }}
                    animate={{ strokeDashoffset: outerOffset }}
                    transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                    style={{ strokeDasharray: outerCircumference }}
                />

                {/* Inner Ring Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={innerRadius}
                    fill="none"
                    strokeWidth={10}
                    className="stroke-amber-100"
                    style={{ strokeOpacity: 0.4 }}
                />

                {/* Inner Ring Progress (Momentum) */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={innerRadius}
                    fill="none"
                    strokeWidth={10}
                    strokeLinecap="round"
                    stroke="url(#inner-gradient)"
                    filter={innerProgress >= 50 ? "url(#inner-glow)" : undefined}
                    initial={{ strokeDashoffset: innerCircumference }}
                    animate={{ strokeDashoffset: innerOffset }}
                    transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.2 }}
                    style={{ strokeDasharray: innerCircumference }}
                />
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                    className="text-3xl font-black text-slate-800"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                >
                    {animatedOuter}%
                </motion.span>
                <div className="flex items-center gap-1 mt-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                    <span className="text-sm font-bold text-amber-600">{animatedInner}</span>
                </div>
            </div>

            {/* Ring Complete Celebration Indicator */}
            {outerProgress >= 100 && (
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: 1.2 }}
                    className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 
                               rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/40"
                >
                    <Trophy className="w-5 h-5 text-white" />
                </motion.div>
            )}
        </div>
    )
}

// =====================================================
// Main Hero Section Component
// =====================================================

export default function HeroSection({
    goal,
    progress,
    momentum,
    streak,
    maturityDays,
    isCompleted
}: HeroSectionProps) {
    const periodStyle = getPeriodStyle(goal.period)
    const streakTier = getStreakTier(streak)
    const maturity = getMaturityStage(maturityDays)
    const daysInfo = formatDaysLeft(goal.end_date)

    return (
        <section className="relative overflow-hidden rounded-3xl">
            {/* Background Gradient */}
            <div className={twMerge(
                "absolute inset-0 bg-gradient-to-br opacity-90",
                periodStyle.gradient
            )} />

            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            {/* Content */}
            <div className="relative p-6 md:p-8">
                {/* Title & Badges Row */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <motion.h1
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl md:text-3xl font-black text-white leading-tight mb-3"
                        >
                            {goal.title}
                        </motion.h1>
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Period Badge */}
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 
                                           bg-white/20 backdrop-blur-sm rounded-full
                                           text-xs font-bold text-white/90 uppercase tracking-wide">
                                {PERIOD_LABELS[goal.period]}
                            </span>

                            {/* Days Remaining Badge */}
                            <span className={twMerge(
                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold",
                                daysInfo.urgent
                                    ? "bg-red-500/80 text-white animate-pulse"
                                    : "bg-white/20 backdrop-blur-sm text-white/90"
                            )}>
                                <Calendar className="w-3.5 h-3.5" />
                                {daysInfo.text}
                            </span>
                        </div>
                    </div>

                    {/* Completion Trophy */}
                    {isCompleted && (
                        <motion.div
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl
                                       flex items-center justify-center shadow-lg"
                        >
                            <Trophy className="w-9 h-9 text-white" />
                        </motion.div>
                    )}
                </div>

                {/* Dual Ring + Stats */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Dual Ring Visualization */}
                    <div className="flex-shrink-0">
                        <DualRing
                            outerProgress={progress}
                            innerProgress={momentum}
                            size={180}
                        />
                        <div className="flex justify-center gap-4 mt-3">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-violet-500" />
                                <span className="text-[10px] font-medium text-white/70">İlerleme</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                <span className="text-[10px] font-medium text-white/70">Momentum</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Column */}
                    <div className="flex-1 w-full space-y-3">
                        {/* Current Value Display */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
                        >
                            <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">
                                Mevcut İlerleme
                            </p>
                            <p className="text-2xl font-black text-white">
                                {goal.current_value || 0}
                                <span className="text-lg font-medium text-white/70 ml-1">
                                    / {goal.target_value || '∞'} {goal.unit || ''}
                                </span>
                            </p>
                        </motion.div>

                        {/* Streak & Maturity Row */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Streak Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <Flame className="w-5 h-5 text-orange-300" />
                                    <span className="text-xl font-black text-white">{streak}</span>
                                    <span className="text-xs text-white/60">gün</span>
                                </div>
                                {streakTier && (
                                    <span className={twMerge(
                                        "inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                                        streakTier.bg, streakTier.color
                                    )}>
                                        {streakTier.label} ×{streakTier.multiplier}
                                    </span>
                                )}
                            </motion.div>

                            {/* Maturity Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-3"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{maturity.emoji}</span>
                                    <span className="text-sm font-bold text-white">{maturity.label}</span>
                                </div>
                                <p className="text-[10px] text-white/60 mt-1">{maturityDays} gün</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
