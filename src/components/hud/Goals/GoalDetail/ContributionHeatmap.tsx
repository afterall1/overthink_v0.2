'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, subDays, isSameDay, parseISO, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'

// =====================================================
// Types
// =====================================================

interface ActivityDay {
    date: string
    count: number
}

interface ContributionHeatmapProps {
    activities: ActivityDay[]
    days?: number
}

// =====================================================
// Constants
// =====================================================

const INTENSITY_COLORS = [
    'bg-slate-100',     // 0 - No activity
    'bg-emerald-200',   // 1 - Low
    'bg-emerald-400',   // 2 - Medium
    'bg-emerald-500',   // 3 - High
    'bg-emerald-600'    // 4 - Very High
] as const

// =====================================================
// Helper Functions
// =====================================================

function getIntensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
    if (count === 0) return 0
    if (count === 1) return 1
    if (count <= 3) return 2
    if (count <= 5) return 3
    return 4
}

function generateDaysArray(days: number, activities: ActivityDay[]) {
    const today = startOfDay(new Date())
    const activityMap = new Map(
        activities.map(a => [format(parseISO(a.date), 'yyyy-MM-dd'), a.count])
    )

    return Array.from({ length: days }, (_, i) => {
        const date = subDays(today, days - 1 - i)
        const dateKey = format(date, 'yyyy-MM-dd')
        const count = activityMap.get(dateKey) || 0

        return {
            date,
            dateKey,
            count,
            intensity: getIntensityLevel(count),
            isToday: isSameDay(date, today)
        }
    })
}

// =====================================================
// Day Cell Component
// =====================================================

function DayCell({
    date,
    count,
    intensity,
    isToday,
    index
}: {
    date: Date
    count: number
    intensity: 0 | 1 | 2 | 3 | 4
    isToday: boolean
    index: number
}) {
    const formattedDate = format(date, 'd MMM', { locale: tr })
    const tooltipText = count > 0
        ? `${formattedDate}: ${count} aktivite`
        : `${formattedDate}: Aktivite yok`

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
                delay: index * 0.01,
                duration: 0.2,
                ease: [0.23, 1, 0.32, 1]
            }}
            className="group relative"
        >
            <div
                className={`
                    w-4 h-4 rounded-sm ${INTENSITY_COLORS[intensity]}
                    ${isToday ? 'ring-2 ring-violet-500 ring-offset-1' : ''}
                    transition-transform duration-200
                    group-hover:scale-125 group-hover:z-10
                    cursor-pointer
                `}
            />

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                            opacity-0 group-hover:opacity-100 pointer-events-none
                            transition-opacity duration-200 z-20">
                <div className="bg-slate-800 text-white text-xs font-medium 
                                px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
                    {tooltipText}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1
                                border-4 border-transparent border-t-slate-800" />
            </div>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function ContributionHeatmap({
    activities,
    days = 30
}: ContributionHeatmapProps) {
    const daysArray = useMemo(
        () => generateDaysArray(days, activities),
        [days, activities]
    )

    // Calculate streak stats
    const totalActiveDays = daysArray.filter(d => d.count > 0).length
    const totalActivities = daysArray.reduce((sum, d) => sum + d.count, 0)

    return (
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <h3 className="text-sm font-bold text-slate-700">
                        Son {days} Gün Aktivite
                    </h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{totalActiveDays} aktif gün</span>
                    <span>•</span>
                    <span>{totalActivities} toplam</span>
                </div>
            </div>

            {/* Heatmap Grid */}
            <div className="flex flex-wrap gap-1 justify-center">
                {daysArray.map((day, index) => (
                    <DayCell
                        key={day.dateKey}
                        date={day.date}
                        count={day.count}
                        intensity={day.intensity}
                        isToday={day.isToday}
                        index={index}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-slate-500">
                <span>Az</span>
                <div className="flex gap-0.5">
                    {INTENSITY_COLORS.map((color, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-sm ${color}`}
                        />
                    ))}
                </div>
                <span>Çok</span>
            </div>
        </div>
    )
}
