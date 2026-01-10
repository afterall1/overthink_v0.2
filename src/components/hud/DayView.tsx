'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CalendarX, Plus } from 'lucide-react'
import EventCard from './EventCard'
import type { EventWithCategory } from '@/types/database.types'

interface DayViewProps {
    date: Date
    events: EventWithCategory[]
    onStatusChange: (id: string, status: EventWithCategory['status']) => void
    onCreateClick: () => void
    className?: string
}

export default function DayView({ date, events, onStatusChange, onCreateClick, className = "" }: DayViewProps) {
    const isToday = new Date().toDateString() === date.toDateString()

    const sortedEvents = useMemo(() => {
        return [...events].sort((a, b) => {
            if (a.status === 'completed' && b.status !== 'completed') return 1
            if (a.status !== 'completed' && b.status === 'completed') return -1
            return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        })
    }, [events])

    const nextEvent = isToday ? sortedEvents.find(e => e.status === 'pending') : null

    return (
        <div className={`w-full max-w-2xl mx-auto pb-24 px-4 ${className}`}>
            <div className="mb-6 text-center">
                <h2 className="text-3xl font-light text-slate-800 tracking-tight">
                    {date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h2>
                <p className="text-slate-500 font-medium mt-1">
                    {events.length === 0
                        ? 'Planlanmış etkinlik yok'
                        : `${events.length} etkinlik planlandı`}
                </p>
            </div>

            <AnimatePresence mode="popLayout">
                {events.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-4 border border-slate-200 shadow-inner">
                            <CalendarX className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-600 mb-6 max-w-xs mx-auto">
                            Bu gün için henüz bir planın yok. Günü verimli geçirmek için ilk adımı at.
                        </p>
                        <button
                            onClick={onCreateClick}
                            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30"
                        >
                            <Plus className="w-5 h-5" />
                            Plan Oluştur
                        </button>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {nextEvent && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mb-8"
                            >
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-wider px-1">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                                    Sıradaki Odak
                                </div>
                                <div className="transform transition-all hover:scale-[1.02]">
                                    <EventCard
                                        event={nextEvent}
                                        onStatusChange={onStatusChange}
                                    />
                                </div>
                            </motion.div>
                        )}

                        <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 py-2">
                            {sortedEvents.map((event, index) => {
                                const isHero = nextEvent?.id === event.id

                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`relative ${isHero && isToday ? 'opacity-50 hover:opacity-100 transition-opacity' : ''}`}
                                    >
                                        <div className={`absolute -left-[41px] top-4 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-colors ${event.status === 'completed' ? 'bg-emerald-400' : 'bg-slate-300'
                                            }`} />

                                        <div className="absolute -left-[100px] top-4 w-12 text-right text-xs font-bold text-slate-400">
                                            {new Date(event.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        <EventCard
                                            event={event}
                                            onStatusChange={onStatusChange}
                                            compact={!isHero}
                                        />
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
