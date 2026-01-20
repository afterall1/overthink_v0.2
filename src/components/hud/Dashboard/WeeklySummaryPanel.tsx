'use client'

import { motion } from 'framer-motion'
import {
    Zap,
    Target,
    Flame,
    Trophy,
    TrendingUp,
    Calendar,
    Star,
    CheckCircle2
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import type { WeeklyStats, DailyBreakdown } from '@/actions/weeklyStats'

// =====================================================
// Types
// =====================================================

export interface WeeklySummaryPanelProps {
    stats: WeeklyStats | null
    isLoading?: boolean
    className?: string
}

// =====================================================
// Sub-Components
// =====================================================

interface StatCardProps {
    icon: React.ElementType
    iconColor: string
    iconBg: string
    label: string
    value: string | number
    suffix?: string
    subtext?: string
}

function StatCard({ icon: Icon, iconColor, iconBg, label, value, suffix, subtext }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 p-3 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/40
                       shadow-lg shadow-violet-500/5"
        >
            <div className="flex items-center gap-2 mb-2">
                <div className={twMerge(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    iconBg
                )}>
                    <Icon className={twMerge("w-4 h-4", iconColor)} />
                </div>
                <span className="text-xs text-slate-500 font-medium">{label}</span>
            </div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-800">{value}</span>
                {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
            </div>
            {subtext && (
                <p className="text-xs text-slate-400 mt-1">{subtext}</p>
            )}
        </motion.div>
    )
}

interface DayBarProps {
    day: DailyBreakdown
    maxXp: number
    index: number
}

function DayBar({ day, maxXp, index }: DayBarProps) {
    const heightPercent = maxXp > 0 ? (day.xp / maxXp) * 100 : 0
    const minHeight = day.xp > 0 ? 10 : 4

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex-1 flex flex-col items-center gap-1"
        >
            {/* XP Value */}
            <span className={twMerge(
                "text-xs font-semibold",
                day.xp > 0 ? "text-slate-700" : "text-slate-300"
            )}>
                {day.xp > 0 ? day.xp : '-'}
            </span>

            {/* Bar Container */}
            <div className="w-full h-20 flex items-end justify-center">
                <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPercent, minHeight)}%` }}
                    transition={{ delay: 0.2 + index * 0.05, type: 'spring', damping: 15 }}
                    className={twMerge(
                        "w-full max-w-[32px] rounded-t-lg transition-colors",
                        day.isToday
                            ? "bg-gradient-to-t from-violet-500 to-purple-400 shadow-lg shadow-violet-500/30"
                            : day.isPerfect
                                ? "bg-gradient-to-t from-amber-400 to-yellow-300"
                                : day.xp > 0
                                    ? "bg-gradient-to-t from-slate-300 to-slate-200"
                                    : "bg-slate-100"
                    )}
                />
            </div>

            {/* Day Label */}
            <span className={twMerge(
                "text-xs font-medium",
                day.isToday ? "text-violet-600" : "text-slate-500"
            )}>
                {day.dayShort}
            </span>

            {/* Perfect Day Indicator */}
            {day.isPerfect && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                </motion.div>
            )}
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function WeeklySummaryPanel({
    stats,
    isLoading = false,
    className
}: WeeklySummaryPanelProps) {
    if (isLoading) {
        return (
            <div className={twMerge(
                "rounded-3xl p-5 bg-white/40 backdrop-blur-xl border border-white/50",
                "shadow-lg animate-pulse",
                className
            )}>
                <div className="h-6 bg-slate-200 rounded w-1/3 mb-4" />
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
                    ))}
                </div>
                <div className="h-32 bg-slate-100 rounded-2xl" />
            </div>
        )
    }

    if (!stats) {
        return null
    }

    const maxXp = Math.max(...stats.dailyBreakdown.map(d => d.xp), 1)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge(
                "rounded-3xl overflow-hidden",
                "bg-gradient-to-br from-white/60 to-white/40 backdrop-blur-xl",
                "border border-white/50 shadow-xl shadow-violet-500/5",
                className
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-white/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                        flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Haftalık Özet</h2>
                            <p className="text-xs text-slate-500">
                                {stats.weekRange.start} - {stats.weekRange.end}
                            </p>
                        </div>
                    </div>

                    {/* Streak Badge */}
                    {stats.currentStreak > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full
                                       bg-gradient-to-r from-orange-500 to-amber-500
                                       text-white text-sm font-bold shadow-lg shadow-orange-500/30"
                        >
                            <Flame className="w-4 h-4" />
                            <span>{stats.currentStreak}</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-4 grid grid-cols-3 gap-3">
                <StatCard
                    icon={Zap}
                    iconColor="text-violet-600"
                    iconBg="bg-gradient-to-br from-violet-100 to-purple-100"
                    label="XP"
                    value={stats.xpThisWeek}
                    subtext="bu hafta"
                />
                <StatCard
                    icon={Target}
                    iconColor="text-emerald-600"
                    iconBg="bg-gradient-to-br from-emerald-100 to-green-100"
                    label="Tamamlama"
                    value={stats.completionRate}
                    suffix="%"
                    subtext={`${stats.questsCompletedThisWeek}/${stats.totalQuestsThisWeek}`}
                />
                <StatCard
                    icon={Trophy}
                    iconColor="text-amber-600"
                    iconBg="bg-gradient-to-br from-amber-100 to-yellow-100"
                    label="Perfect"
                    value={stats.perfectDaysThisWeek}
                    suffix="/7"
                    subtext="gün"
                />
            </div>

            {/* Daily Chart */}
            <div className="px-4 pb-4">
                <div className="p-4 rounded-2xl bg-white/40 border border-white/30">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-semibold text-slate-700">Günlük Aktivite</span>
                    </div>

                    <div className="flex items-end justify-between gap-1">
                        {stats.dailyBreakdown.map((day, index) => (
                            <DayBar
                                key={day.date}
                                day={day}
                                maxXp={maxXp}
                                index={index}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Best Day Highlight */}
            {stats.bestDay && (
                <div className="px-4 pb-4">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 p-3 rounded-2xl
                                   bg-gradient-to-r from-amber-50 to-yellow-50
                                   border border-amber-200/50"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-400
                                        flex items-center justify-center shadow-lg shadow-amber-500/30">
                            <Star className="w-5 h-5 text-white fill-white" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-amber-900">
                                En İyi Gün: {stats.bestDay.dayName}
                            </p>
                            <p className="text-xs text-amber-700">
                                +{stats.bestDay.xp} XP kazandın!
                            </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    </motion.div>
                </div>
            )}
        </motion.div>
    )
}
