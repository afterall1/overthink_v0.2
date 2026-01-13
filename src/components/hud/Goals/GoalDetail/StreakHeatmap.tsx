'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import { format, subDays, isSameDay, isToday, startOfDay, startOfWeek, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Flame, AlertTriangle } from 'lucide-react'
import type { GoalEntry } from '@/types/database.types'

// =====================================================
// Types
// =====================================================

interface StreakHeatmapProps {
    entries: GoalEntry[]
    currentStreak: number
    isAtRisk?: boolean
    className?: string
}

interface DayCell {
    date: Date
    hasActivity: boolean
    intensity: 0 | 1 | 2 | 3 | 4
    value: number
    isToday: boolean
    weekday: string
}

// =====================================================
// Helpers
// =====================================================

function getIntensity(value: number, maxValue: number): 0 | 1 | 2 | 3 | 4 {
    if (value === 0) return 0
    const ratio = value / maxValue
    if (ratio >= 0.75) return 4
    if (ratio >= 0.5) return 3
    if (ratio >= 0.25) return 2
    return 1
}

const INTENSITY_COLORS = {
    0: 'bg-slate-100',
    1: 'bg-emerald-200',
    2: 'bg-emerald-400',
    3: 'bg-emerald-500',
    4: 'bg-emerald-600'
} as const

// =====================================================
// Component
// =====================================================

export default function StreakHeatmap({
    entries,
    currentStreak,
    isAtRisk = false,
    className
}: StreakHeatmapProps) {
    // Generate last 28 days (4 weeks)
    const heatmapData = useMemo(() => {
        const today = startOfDay(new Date())
        const days: DayCell[] = []

        // Get max value for intensity calculation
        const maxValue = entries.length > 0
            ? Math.max(...entries.map(e => e.value), 1)
            : 1

        for (let i = 27; i >= 0; i--) {
            const date = subDays(today, i)
            const dayEntries = entries.filter(e => isSameDay(parseISO(e.logged_at), date))
            const totalValue = dayEntries.reduce((sum, e) => sum + e.value, 0)

            days.push({
                date,
                hasActivity: dayEntries.length > 0,
                intensity: getIntensity(totalValue, maxValue),
                value: totalValue,
                isToday: isToday(date),
                weekday: format(date, 'EEE', { locale: tr })
            })
        }

        return days
    }, [entries])

    // Group by weeks (7 days per row)
    const weeks = useMemo(() => {
        const result: DayCell[][] = []
        for (let i = 0; i < heatmapData.length; i += 7) {
            result.push(heatmapData.slice(i, i + 7))
        }
        return result
    }, [heatmapData])

    // Stats
    const activeDays = heatmapData.filter(d => d.hasActivity).length
    const todayCompleted = heatmapData.find(d => d.isToday)?.hasActivity ?? false

    return (
        <section className={twMerge("bg-white rounded-3xl border border-slate-100 p-5", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Aktivite Haritası
                </h2>
                <div className="flex items-center gap-3">
                    {/* Active Days Counter */}
                    <span className="text-xs text-slate-500">
                        <span className="font-bold text-emerald-600">{activeDays}</span> aktif gün
                    </span>
                    {/* Streak Badge */}
                    {currentStreak > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-1 px-2 py-1 rounded-full 
                                       bg-gradient-to-r from-orange-400 to-amber-500 
                                       text-white text-[10px] font-bold shadow-sm"
                        >
                            🔥 {currentStreak}
                        </motion.span>
                    )}
                </div>
            </div>

            {/* At-Risk Warning */}
            {isAtRisk && !todayCompleted && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 mb-4 p-3 rounded-xl 
                               bg-gradient-to-r from-amber-50 to-orange-50 
                               border border-amber-200"
                >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-medium text-amber-700">
                        Streak tehlikede! Bugün bir aksiyon al.
                    </p>
                </motion.div>
            )}

            {/* Heatmap Grid */}
            <div className="space-y-1.5">
                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1.5 mb-2">
                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
                        <span key={day} className="text-[9px] text-slate-400 text-center font-medium">
                            {day}
                        </span>
                    ))}
                </div>

                {/* Week Rows */}
                {weeks.map((week, weekIndex) => (
                    <div key={weekIndex} className="grid grid-cols-7 gap-1.5">
                        {week.map((day, dayIndex) => (
                            <motion.div
                                key={dayIndex}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: (weekIndex * 7 + dayIndex) * 0.02 }}
                                whileHover={{ scale: 1.2 }}
                                className="relative group"
                            >
                                <div
                                    className={twMerge(
                                        "aspect-square rounded-md transition-all cursor-pointer",
                                        INTENSITY_COLORS[day.intensity],
                                        day.isToday && !day.hasActivity &&
                                        "ring-2 ring-offset-1 ring-amber-400 animate-pulse",
                                        day.isToday && day.hasActivity &&
                                        "ring-2 ring-offset-1 ring-emerald-400"
                                    )}
                                />

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 
                                                hidden group-hover:block z-10">
                                    <div className="bg-slate-800 text-white text-[10px] px-2 py-1 
                                                    rounded-lg whitespace-nowrap shadow-lg">
                                        <p className="font-semibold">
                                            {format(day.date, 'd MMM', { locale: tr })}
                                        </p>
                                        {day.hasActivity ? (
                                            <p className="text-emerald-300">+{day.value.toFixed(1)}</p>
                                        ) : (
                                            <p className="text-slate-400">Aktivite yok</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-3">
                <span className="text-[9px] text-slate-400 mr-1">Az</span>
                {[0, 1, 2, 3, 4].map(intensity => (
                    <div
                        key={intensity}
                        className={twMerge(
                            "w-3 h-3 rounded-sm",
                            INTENSITY_COLORS[intensity as 0 | 1 | 2 | 3 | 4]
                        )}
                    />
                ))}
                <span className="text-[9px] text-slate-400 ml-1">Çok</span>
            </div>
        </section>
    )
}
