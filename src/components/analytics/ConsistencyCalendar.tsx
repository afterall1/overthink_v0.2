'use client'

import { useMemo } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths } from 'date-fns'
import { tr } from 'date-fns/locale'

interface LogEntry {
    date: string
    count: number
}

interface ConsistencyCalendarProps {
    data: LogEntry[]
    months?: number
}

export default function ConsistencyCalendar({ data, months = 3 }: ConsistencyCalendarProps) {
    const calendarData = useMemo(() => {
        const today = new Date()
        const monthsData = []

        for (let i = months - 1; i >= 0; i--) {
            const monthDate = subMonths(today, i)
            const start = startOfMonth(monthDate)
            const end = endOfMonth(monthDate)
            const days = eachDayOfInterval({ start, end })

            const daysWithData = days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const logEntry = data.find(d => d.date === dayStr)
                return {
                    date: day,
                    count: logEntry?.count || 0,
                }
            })

            monthsData.push({
                month: format(monthDate, 'MMMM', { locale: tr }),
                year: format(monthDate, 'yyyy'),
                days: daysWithData,
                startDayOfWeek: start.getDay(),
            })
        }

        return monthsData
    }, [data, months])

    const getIntensityClass = (count: number) => {
        if (count === 0) return 'bg-gray-800'
        if (count === 1) return 'bg-green-900'
        if (count === 2) return 'bg-green-700'
        if (count === 3) return 'bg-green-500'
        return 'bg-green-400'
    }

    const weekDays = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P']

    return (
        <div className="space-y-6">
            {calendarData.map((monthData, monthIndex) => (
                <div key={monthIndex}>
                    <h4 className="text-sm text-gray-400 mb-2 capitalize">
                        {monthData.month} {monthData.year}
                    </h4>

                    <div className="grid grid-cols-7 gap-1">
                        {/* Week day headers */}
                        {weekDays.map((day, i) => (
                            <div key={i} className="text-xs text-gray-600 text-center py-1">
                                {day}
                            </div>
                        ))}

                        {/* Empty cells for offset */}
                        {Array.from({ length: monthData.startDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-full aspect-square" />
                        ))}

                        {/* Day cells */}
                        {monthData.days.map((day, dayIndex) => (
                            <div
                                key={dayIndex}
                                className={`
                  w-full aspect-square rounded-sm transition-all duration-200
                  ${getIntensityClass(day.count)}
                  ${isSameDay(day.date, new Date()) ? 'ring-2 ring-purple-500' : ''}
                  hover:ring-1 hover:ring-white/30
                `}
                                title={`${format(day.date, 'dd/MM/yyyy')}: ${day.count} log`}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* Legend */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Az</span>
                <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-800" />
                    <div className="w-3 h-3 rounded-sm bg-green-900" />
                    <div className="w-3 h-3 rounded-sm bg-green-700" />
                    <div className="w-3 h-3 rounded-sm bg-green-500" />
                    <div className="w-3 h-3 rounded-sm bg-green-400" />
                </div>
                <span>Çok</span>
            </div>
        </div>
    )
}
