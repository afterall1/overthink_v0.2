'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarX, Plus } from 'lucide-react'
import EventCard from './EventCard'
import type { EventWithCategory } from '@/types/database.types'
import { format, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'

interface TodayFocusProps {
    date: Date
    events: EventWithCategory[]
    onStatusChange: (id: string, status: EventWithCategory['status']) => void
    onEventClick: (event: EventWithCategory) => void
    onCreateClick: () => void
    className?: string
}

export default function TodayFocus({ date, events, onStatusChange, onEventClick, onCreateClick, className = "" }: TodayFocusProps) {
    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1
            if (a.status !== 'completed' && b.status === 'completed') return -1
            return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        })
    }, [events])

    const nextEvent = sortedEvents.find(e => e.status === 'pending')

    return (
        <div className={`w-full ${className}`}>
            {/* Header */}
            <div className="mb-8 flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extralight text-slate-800 tracking-tight">
                        {isToday(date) ? 'Bugün' : format(date, 'd MMMM', { locale: tr })}
                    </h2>
                    <p className="text-indigo-500 font-bold uppercase tracking-widest text-sm mt-1">
                        {format(date, 'EEEE', { locale: tr })}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 bg-white/50 px-3 py-1.5 rounded-full shadow-sm ring-1 ring-white/60 backdrop-blur-sm">
                        {events.length} ETKİNLİK
                    </span>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-center bg-white/30 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-xl shadow-indigo-900/5 min-h-[400px]"
                    >
                        <div className="w-24 h-24 bg-gradient-to-tr from-white to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-indigo-100/50 ring-4 ring-white/60">
                            <CalendarX className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-700 mb-2">
                            Zihin Berrak
                        </h3>
                        <p className="text-slate-400 text-sm mb-8 max-w-[240px] leading-relaxed">
                            Bugün henüz bir planın yok. Akışa kapılmak için ilk adımı at.
                        </p>
                        <button
                            onClick={onCreateClick}
                            className="group relative flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-500/30 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <Plus className="w-5 h-5" />
                            Plan Oluştur
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {/* Next Focus Hero */}
                        {nextEvent && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative z-10"
                            >
                                <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-xs uppercase tracking-[0.15em] px-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse box-shadow-glow" />
                                    Sıradaki Odak
                                </div>

                                <div className="transform transition-all hover:scale-[1.01] duration-500">
                                    <EventCard
                                        event={nextEvent}
                                        onStatusChange={onStatusChange}
                                        onClick={onEventClick}
                                        className="shadow-2xl shadow-indigo-900/10 ring-1 ring-white/80 bg-white/90 backdrop-blur-xl border-indigo-50"
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Remaining Timeline */}
                        <div className="relative border-l-2 border-indigo-100/50 ml-20 pl-8 space-y-5 py-2">
                            {sortedEvents.filter(e => e.id !== nextEvent?.id).map((event, index) => (
                                <motion.div
                                    key={event.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="relative group"
                                >
                                    {/* Timeline Node */}
                                    <div className={`absolute -left-[42px] top-4 w-4 h-4 rounded-full border-[3px] border-white shadow-sm transition-all z-10 group-hover:scale-110 ${event.status === 'completed' ? 'bg-emerald-400 ring-4 ring-emerald-50' : 'bg-slate-200 group-hover:bg-indigo-300'
                                        }`} />

                                    {/* Time */}
                                    <div className="absolute -left-[100px] top-4 w-12 text-right text-xs font-bold text-slate-400 group-hover:text-indigo-500 transition-colors">
                                        {format(new Date(event.scheduled_at), 'HH:mm')}
                                    </div>

                                    <EventCard
                                        event={event}
                                        onStatusChange={onStatusChange}
                                        onClick={onEventClick}
                                        compact
                                        className="hover:bg-white/90 transition-colors border-transparent hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5"
                                    />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
