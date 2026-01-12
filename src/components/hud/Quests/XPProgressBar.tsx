'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp, Star } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { calculateLevel, type LevelInfo } from '@/lib/questEngine'

// =====================================================
// Types
// =====================================================

export interface XPProgressBarProps {
    totalXp: number
    xpToday?: number
    variant?: 'compact' | 'full'
    showLevel?: boolean
    showGain?: number // Recent XP gain to animate
    className?: string
}

// =====================================================
// Level Badge Colors
// =====================================================

const levelColors: Record<number, { from: string; to: string; glow: string }> = {
    1: { from: 'from-slate-400', to: 'to-slate-500', glow: 'shadow-slate-500/30' },
    2: { from: 'from-emerald-400', to: 'to-emerald-600', glow: 'shadow-emerald-500/30' },
    3: { from: 'from-cyan-400', to: 'to-cyan-600', glow: 'shadow-cyan-500/30' },
    4: { from: 'from-blue-400', to: 'to-blue-600', glow: 'shadow-blue-500/30' },
    5: { from: 'from-indigo-400', to: 'to-indigo-600', glow: 'shadow-indigo-500/30' },
    6: { from: 'from-violet-400', to: 'to-violet-600', glow: 'shadow-violet-500/30' },
    7: { from: 'from-purple-400', to: 'to-purple-600', glow: 'shadow-purple-500/30' },
    8: { from: 'from-fuchsia-400', to: 'to-fuchsia-600', glow: 'shadow-fuchsia-500/30' },
    9: { from: 'from-pink-400', to: 'to-pink-600', glow: 'shadow-pink-500/30' },
    10: { from: 'from-rose-400', to: 'to-rose-600', glow: 'shadow-rose-500/30' },
    // 11+ gets gold
    11: { from: 'from-amber-400', to: 'to-yellow-500', glow: 'shadow-yellow-500/40' },
}

function getLevelColors(level: number): { from: string; to: string; glow: string } {
    if (level >= 11) return levelColors[11]
    return levelColors[level] || levelColors[1]
}

// =====================================================
// Compact Variant
// =====================================================

function CompactXPBar({
    levelInfo,
    xpToday,
    showGain,
    className
}: {
    levelInfo: LevelInfo
    xpToday?: number
    showGain?: number
    className?: string
}) {
    const colors = getLevelColors(levelInfo.currentLevel)

    return (
        <div className={twMerge(
            "flex items-center gap-2 px-3 py-1.5 rounded-full",
            "bg-white/60 backdrop-blur-xl border border-white/40",
            "shadow-sm",
            className
        )}>
            {/* Level Badge */}
            <div className={twMerge(
                "flex-none w-6 h-6 rounded-full flex items-center justify-center",
                "bg-gradient-to-br text-white text-xs font-bold shadow-md",
                colors.from, colors.to, colors.glow
            )}>
                {levelInfo.currentLevel}
            </div>

            {/* Progress Bar */}
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: levelInfo.xpProgress / 100 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    style={{ transformOrigin: 'left' }}
                    className={twMerge(
                        "h-full bg-gradient-to-r rounded-full",
                        colors.from, colors.to
                    )}
                />
            </div>

            {/* XP Today */}
            {xpToday !== undefined && xpToday > 0 && (
                <div className="flex items-center gap-1 text-xs font-medium text-violet-600">
                    <Zap className="w-3 h-3" />
                    +{xpToday}
                </div>
            )}

            {/* Animated XP Gain */}
            {showGain && showGain > 0 && (
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -20 }}
                    transition={{ duration: 1.5 }}
                    className="absolute -top-2 right-0 text-xs font-bold text-emerald-500"
                >
                    +{showGain} XP
                </motion.div>
            )}
        </div>
    )
}

// =====================================================
// Full Variant
// =====================================================

function FullXPBar({
    levelInfo,
    xpToday,
    showGain,
    className
}: {
    levelInfo: LevelInfo
    xpToday?: number
    showGain?: number
    className?: string
}) {
    const colors = getLevelColors(levelInfo.currentLevel)
    const nextColors = getLevelColors(levelInfo.currentLevel + 1)

    return (
        <div className={twMerge(
            "relative p-4 rounded-2xl",
            "bg-white/60 backdrop-blur-xl border border-white/40",
            "shadow-lg",
            className
        )}>
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3">
                {/* Current Level */}
                <div className="flex items-center gap-2">
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={twMerge(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            "bg-gradient-to-br text-white font-bold shadow-lg",
                            colors.from, colors.to, colors.glow
                        )}
                    >
                        {levelInfo.currentLevel}
                    </motion.div>
                    <div>
                        <div className="text-xs text-slate-500 font-medium">Seviye</div>
                        <div className="text-sm font-bold text-slate-800">
                            {getLevelTitle(levelInfo.currentLevel)}
                        </div>
                    </div>
                </div>

                {/* XP Stats */}
                <div className="text-right">
                    <div className="flex items-center gap-1 text-sm font-bold text-slate-800">
                        <Zap className="w-4 h-4 text-violet-500" />
                        {levelInfo.currentXp.toLocaleString()} XP
                    </div>
                    {xpToday !== undefined && xpToday > 0 && (
                        <div className="text-xs text-emerald-600 font-medium">
                            Bugün +{xpToday} XP
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: levelInfo.xpProgress / 100 }}
                        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                        style={{ transformOrigin: 'left' }}
                        className={twMerge(
                            "h-full bg-gradient-to-r rounded-full relative",
                            colors.from, colors.to
                        )}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                                        animate-shimmer" />
                    </motion.div>
                </div>

                {/* Progress Labels */}
                <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                    <span>{levelInfo.currentXp - levelInfo.xpForCurrentLevel} / {levelInfo.xpForNextLevel - levelInfo.xpForCurrentLevel}</span>
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Sonraki: Lv.{levelInfo.currentLevel + 1}
                    </span>
                </div>
            </div>

            {/* Next Level Preview */}
            <div className="mt-3 p-2 bg-slate-50/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={twMerge(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold",
                        "bg-gradient-to-br text-white/70 opacity-50",
                        nextColors.from, nextColors.to
                    )}>
                        {levelInfo.currentLevel + 1}
                    </div>
                    <span className="text-xs text-slate-500">
                        {getLevelTitle(levelInfo.currentLevel + 1)}
                    </span>
                </div>
                <span className="text-xs font-medium text-slate-600">
                    {levelInfo.xpNeeded.toLocaleString()} XP kaldı
                </span>
            </div>

            {/* Animated XP Gain Overlay */}
            {showGain && showGain > 0 && (
                <motion.div
                    initial={{ opacity: 1, scale: 1, y: 0 }}
                    animate={{ opacity: 0, scale: 1.5, y: -30 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                               flex items-center gap-1 text-lg font-bold text-emerald-500 pointer-events-none"
                >
                    <Star className="w-5 h-5 fill-current" />
                    +{showGain} XP
                </motion.div>
            )}
        </div>
    )
}

// =====================================================
// Level Titles
// =====================================================

function getLevelTitle(level: number): string {
    const titles: Record<number, string> = {
        1: 'Başlangıç',
        2: 'Çırak',
        3: 'Yolcu',
        4: 'Gezgin',
        5: 'Kaşif',
        6: 'Savaşçı',
        7: 'Şampiyon',
        8: 'Kahraman',
        9: 'Efsane',
        10: 'Usta',
        11: 'Grandmaster',
        12: 'Mythic',
    }

    if (level >= 12) return 'Mythic'
    return titles[level] || `Seviye ${level}`
}

// =====================================================
// Main Component
// =====================================================

export default function XPProgressBar({
    totalXp,
    xpToday,
    variant = 'compact',
    showGain,
    className
}: XPProgressBarProps) {
    const levelInfo = calculateLevel(totalXp)

    if (variant === 'compact') {
        return (
            <CompactXPBar
                levelInfo={levelInfo}
                xpToday={xpToday}
                showGain={showGain}
                className={className}
            />
        )
    }

    return (
        <FullXPBar
            levelInfo={levelInfo}
            xpToday={xpToday}
            showGain={showGain}
            className={className}
        />
    )
}
