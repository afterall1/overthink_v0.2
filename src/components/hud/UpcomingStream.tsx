'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import EventCard from './EventCard'
import type { EventWithCategory } from '@/types/database.types'
import { format, addDays, isTomorrow, startOfDay } from 'date-fns'
import { tr } from 'date-fns/locale'

interface UpcomingStreamProps {
    anchorDate: Date
    events: EventWithCategory[]
    onStatusChange: (id: string, status: EventWithCategory['status']) => void
    onEventClick: (event: EventWithCategory) => void
    className?: string
}

export default function UpcomingStream({ anchorDate, events, onStatusChange, onEventClick, className = "" }: UpcomingStreamProps) {
    const groupedEvents = useMemo(() => {
        const groups: Record<string, EventWithCategory[]> = {}
        const startNextDay = addDays(startOfDay(anchorDate), 1)

        // Filter events strictly for after the anchor date (starting next day)
        // We assume 'events' passed here are already filtered or we filter now.
        // Let's filter just in case.
        const futureEvents = events.filter(e => new Date(e.scheduled_at) >= startNextDay)

        // Generate next 6 days keys
        for (let i = 1; i <= 6; i++) {
            const currentDay = addDays(anchorDate, i)
            const dateKey = format(currentDay, 'yyyy-MM-dd')
            groups[dateKey] = []
        }

        futureEvents.forEach(event => {
            const dateKey = event.scheduled_at.split('T')[0]
            if (groups[dateKey]) {
                groups[dateKey].push(event)
            }
        })

        // Sort events within groups
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        })

        return groups
    }, [events, anchorDate])

    const datesToRender = Object.keys(groupedEvents).sort()
    const hasAnyUpcoming = Object.values(groupedEvents).some(g => g.length > 0)

    return (
        <div className={`w-full ${className}`}>
            <div className="mb-8 flex items-end justify-between px-2 border-b border-indigo-50/50 pb-4">
                <div>
                    <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em] mb-1">
                        Timeline
                    </h3>
                    <h2 className="text-xl font-bold text-slate-700 tracking-tight leading-none">
                        Ufuk Çizgisi
                    </h2>
                </div>
                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded-lg shadow-sm">
                    +6 Gün
                </span>
            </div>

            {!hasAnyUpcoming ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl opacity-60">
                    <p className="text-slate-400 text-sm font-medium">Ufukta görünen bir şey yok.</p>
                </div>
            ) : (
                <div className="relative pl-4 space-y-10">
                    {/* Continuous Thread Line */}
                    <div className="absolute left-[19px] top-2 bottom-4 w-0.5 bg-gradient-to-b from-indigo-200 via-slate-200 to-transparent rounded-full opacity-50" />

                    {datesToRender.map((dateKey, index) => {
                        const dayEvents = groupedEvents[dateKey]
                        if (dayEvents.length === 0) return null

                        const currentDay = new Date(dateKey)
                        const isTmr = isTomorrow(currentDay)

                        return (
                            <motion.div
                                key={dateKey}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative"
                            >
                                {/* Date Node */}
                                <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white z-10 shadow-sm ring-4 ring-white ${isTmr ? 'bg-indigo-500 ring-indigo-50' : 'bg-slate-300'}`} />

                                {/* Date Header */}
                                <div className="ml-8 mb-4">
                                    <h4 className={`text-sm font-bold flex items-center gap-2 ${isTmr ? 'text-indigo-600' : 'text-slate-600'}`}>
                                        {isTmr ? 'Yarın' : format(currentDay, 'd MMM', { locale: tr })}
                                        {!isTmr && <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wide px-1.5 py-0.5 bg-slate-50 rounded-md">{format(currentDay, 'EEEE', { locale: tr })}</span>}
                                    </h4>
                                </div>

                                <div className="ml-8 space-y-3">
                                    {dayEvents.map((event, i) => (
                                        <div key={event.id} className="relative group">
                                            {/* Connector to thread - Curved style */}
                                            <div className="absolute -left-[27px] top-1/2 w-4 h-[1px] bg-slate-200 group-hover:bg-indigo-300 transition-colors" />
                                            <div className="absolute -left-[29px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-400 group-hover:scale-125 transition-all outline outline-2 outline-white" />

                                            <EventCard
                                                event={event}
                                                onStatusChange={onStatusChange}
                                                onClick={onEventClick}
                                                compact
                                                className="bg-white hover:bg-white border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 transform hover:-translate-y-0.5"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    })}

                    <div className="flex justify-center pt-8 opacity-30">
                        <div className="w-1 h-8 bg-gradient-to-b from-slate-200 to-transparent rounded-full" />
                    </div>
                </div>
            )}
        </div>
    )
}
