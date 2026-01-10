'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CalendarX, Plus, Calendar } from 'lucide-react'
import EventCard from './EventCard'
import type { EventWithCategory } from '@/types/database.types'
import { format, isSameDay, addDays, isToday, isTomorrow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface AgendaViewProps {
    date: Date // Anchor date (start)
    events: EventWithCategory[]
    onStatusChange: (id: string, status: EventWithCategory['status']) => void
    onCreateClick: () => void
    className?: string
}

export default function AgendaView({ date, events, onStatusChange, onCreateClick, className = "" }: AgendaViewProps) {
    const anchorDate = date

    // Group events by date string (YYYY-MM-DD)
    const groupedEvents = useMemo(() => {
        const groups: Record<string, EventWithCategory[]> = {}

        // Initialize groups for the next 7 days to ensure headers appear even if empty? 
        // Plan said: "Skip empty days... but ensure at least next few days are checked". 
        // Let's rely on the events passed. But to show "Upcoming", we might want to iterate days.
        // Let's iterate 7 days starting from anchorDate.

        for (let i = 0; i < 7; i++) {
            const currentDay = addDays(anchorDate, i)
            const dateKey = format(currentDay, 'yyyy-MM-dd')
            groups[dateKey] = []
        }

        events.forEach(event => {
            const dateKey = event.scheduled_at.split('T')[0]
            if (groups[dateKey]) {
                groups[dateKey].push(event)
            }
        })

        // Sort events within groups
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => {
                if (a.status === 'completed' && b.status !== 'completed') return 1
                if (a.status !== 'completed' && b.status === 'completed') return -1
                return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
            })
        })

        return groups
    }, [events, anchorDate])

    // Get the list of dates to render
    const datesToRender = Object.keys(groupedEvents).sort()

    return (
        <div className={`w-full max-w-2xl mx-auto pb-32 px-4 space-y-12 ${className}`}>
            {datesToRender.map((dateKey, dayIndex) => {
                const dayEvents = groupedEvents[dateKey]
                const currentDay = new Date(dateKey)
                const isAnchorDay = isSameDay(currentDay, anchorDate)
                const isDayEmpty = dayEvents.length === 0

                // Skip simple empty days if it's not the anchor day, unless it's tomorrow
                // Actually, let's show empty Anchor day, but maybe hide others if truly empty?
                // Plan: "Skip empty days to keep the stream dense".
                if (!isAnchorDay && isDayEmpty) return null

                return (
                    <motion.div
                        key={dateKey}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: dayIndex * 0.1 }}
                        className="relative"
                    >
                        {/* Day Header */}
                        <div className={`mb-6 flex items-baseline gap-3 ${isAnchorDay ? 'border-b pb-4 border-slate-200/50' : ''}`}>
                            <h2 className={`font-bold tracking-tight text-slate-800 ${isAnchorDay ? 'text-3xl' : 'text-xl text-slate-600'}`}>
                                {isToday(currentDay) ? 'Bugün' :
                                    isTomorrow(currentDay) ? 'Yarın' :
                                        format(currentDay, 'd MMMM', { locale: tr })}
                            </h2>
                            <span className={`text-sm font-medium ${isAnchorDay ? 'text-indigo-600' : 'text-slate-400'}`}>
                                {format(currentDay, 'EEEE', { locale: tr })}
                            </span>

                            {!isAnchorDay && (
                                <span className="text-xs text-slate-300 font-medium ml-auto">
                                    {format(currentDay, 'd.MM.yyyy')}
                                </span>
                            )}
                        </div>

                        {/* Events List */}
                        {isDayEmpty ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">Bu gün için plan yok.</p>
                                {isAnchorDay && (
                                    <button
                                        onClick={onCreateClick}
                                        className="mt-3 flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-bold shadow-sm border border-slate-200 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                        İlk Planı Oluştur
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-6 py-1">
                                    {dayEvents.map((event, index) => {
                                        const isCompleted = event.status === 'completed'
                                        return (
                                            <div key={event.id} className="relative group">
                                                {/* Timeline Node */}
                                                <div className={`absolute -left-[41px] top-5 w-4 h-4 rounded-full border-[3px] border-white shadow-sm transition-colors z-10 ${isCompleted ? 'bg-emerald-400 ring-4 ring-emerald-50' : 'bg-slate-300 group-hover:bg-indigo-400'
                                                    }`} />

                                                {/* Time Stamp */}
                                                <div className="absolute -left-[90px] top-5 w-10 text-right text-[11px] font-bold text-slate-400">
                                                    {format(new Date(event.scheduled_at), 'HH:mm')}
                                                </div>

                                                <EventCard
                                                    event={event}
                                                    onStatusChange={onStatusChange}
                                                    compact={!isAnchorDay} // Upcoming days use compact cards
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )
            })}

            {/* End of Stream Indicator */}
            <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-40">
                <div className="w-1 h-12 bg-gradient-to-b from-slate-300 to-transparent rounded-full mb-2" />
                <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Akış Sonu</span>
            </div>
        </div>
    )
}
