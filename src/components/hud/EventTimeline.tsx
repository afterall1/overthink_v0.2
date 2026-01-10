'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, ChevronLeft, ChevronRight, Bell, BellOff, Plus } from 'lucide-react'
import type { Event, EventStatus } from '@/types/database.types'
import { getMockEvents, updateMockEventStatus } from '@/lib/mockEvents'
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications'
import EventCard from './EventCard'

interface EventTimelineProps {
    isOpen: boolean
    onClose: () => void
    onOpenEventModal: () => void
}

type ViewMode = 'today' | 'week'

export default function EventTimeline({ isOpen, onClose, onOpenEventModal }: EventTimelineProps) {
    const [events, setEvents] = useState<Event[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('today')
    const [notificationEnabled, setNotificationEnabled] = useState(false)

    // ... (rest of logic same)


    const [selectedDate, setSelectedDate] = useState(new Date())

    // Load events
    useEffect(() => {
        if (isOpen) {
            const allEvents = getMockEvents()
            setEvents(allEvents)
            setNotificationEnabled(getNotificationPermission() === 'granted')
        }
    }, [isOpen])

    // Bildirim izni iste
    const handleEnableNotifications = async () => {
        const granted = await requestNotificationPermission()
        setNotificationEnabled(granted)
    }

    // Event durumunu güncelle
    const handleStatusChange = useCallback((eventId: string, status: EventStatus) => {
        const updated = updateMockEventStatus(eventId, status)
        if (updated) {
            setEvents((prev) =>
                prev.map((e) => (e.id === eventId ? updated : e))
            )
        }
    }, [])

    // Tarihe göre filtrele
    const filteredEvents = events.filter((event) => {
        const eventDate = new Date(event.scheduled_at)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (viewMode === 'today') {
            const eventDay = new Date(eventDate)
            eventDay.setHours(0, 0, 0, 0)
            return eventDay.getTime() === today.getTime()
        }

        // Week view: 7 gün
        const weekEnd = new Date(today)
        weekEnd.setDate(weekEnd.getDate() + 7)
        return eventDate >= today && eventDate <= weekEnd
    })

    // Tarihe göre grupla
    const groupedEvents = filteredEvents.reduce((acc, event) => {
        const dateKey = new Date(event.scheduled_at).toDateString()
        if (!acc[dateKey]) {
            acc[dateKey] = []
        }
        acc[dateKey].push(event)
        return acc
    }, {} as Record<string, Event[]>)

    // Tarihe göre sırala
    const sortedDates = Object.keys(groupedEvents).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    )

    // Tarih navigasyonu
    const navigateDate = (direction: 'prev' | 'next') => {
        const newDate = new Date(selectedDate)
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        setSelectedDate(newDate)
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - Ethereal */}
            <div
                className="fixed inset-0 z-40 bg-slate-900/10 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel - Frosted Glass Solarpunk */}
            <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-2xl shadow-blue-900/5 sm:w-96">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-blue-50/30 pointer-events-none" />

                {/* Header - Minimalist */}
                <div className="relative flex items-center justify-between border-b border-indigo-50 p-6 z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Planlananlar</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* New Event Button */}
                        <button
                            onClick={onOpenEventModal}
                            className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                            title="Yeni Etkinlik"
                        >
                            <Plus className="w-5 h-5" />
                        </button>

                        {/* Notification toggle */}
                        <button
                            onClick={handleEnableNotifications}
                            className={`rounded-xl p-2.5 transition-all duration-300 ${notificationEnabled
                                ? 'bg-emerald-50 text-emerald-600 shadow-sm'
                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                }`}
                            aria-label={notificationEnabled ? 'Bildirimler acik' : 'Bildirimleri ac'}
                        >
                            {notificationEnabled ? (
                                <Bell className="h-4 w-4" />
                            ) : (
                                <BellOff className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-full p-2.5 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-slate-600 hover:rotate-90"
                            aria-label="Kapat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle - Glass buttons */}
                <div className="relative flex gap-3 border-b border-indigo-50 p-4 z-10">
                    <button
                        onClick={() => setViewMode('today')}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${viewMode === 'today'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                            }`}
                    >
                        Bugün
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${viewMode === 'week'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                            : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
                            }`}
                    >
                        7 Gün
                    </button>
                </div>

                {/* Date Navigator (for week view) */}
                {viewMode === 'week' && (
                    <div className="relative flex items-center justify-between border-b border-indigo-50 px-4 py-3 z-10 bg-slate-50/50">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="group rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all duration-300"
                            aria-label="Onceki gun"
                        >
                            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        </button>
                        <span className="text-sm text-slate-700 font-semibold bg-white px-3 py-1 rounded-lg border border-indigo-50 shadow-sm">
                            {selectedDate.toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="group rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all duration-300"
                            aria-label="Sonraki gun"
                        >
                            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </div>
                )}

                {/* Events List */}
                <div className="flex-1 overflow-y-auto p-4 z-10 custom-scrollbar">
                    {sortedDates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                                <Calendar className="h-8 w-8" />
                            </div>
                            <p className="text-slate-500 font-medium">
                                {viewMode === 'today'
                                    ? 'Bugün için planlanmış etkinlik yok'
                                    : 'Bu hafta için planlanmış etkinlik yok'}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Harika bir gün geçirmek için plan yapmaya başla ✨
                            </p>
                        </div>
                    ) : (
                        sortedDates.map((dateKey) => (
                            <div key={dateKey} className="mb-6">
                                {/* Date Header */}
                                {viewMode === 'week' && (
                                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
                                        {new Date(dateKey).toLocaleDateString('tr-TR', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                        })}
                                    </h3>
                                )}

                                {/* Event Cards */}
                                <div className="space-y-3">
                                    {groupedEvents[dateKey]
                                        .sort(
                                            (a, b) =>
                                                new Date(a.scheduled_at).getTime() -
                                                new Date(b.scheduled_at).getTime()
                                        )
                                        .map((event) => (
                                            <EventCard
                                                key={event.id}
                                                event={event}
                                                onStatusChange={handleStatusChange}
                                                compact={viewMode === 'week'}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats Footer - Refined */}
                <div className="relative border-t border-indigo-50 p-4 z-10 bg-white/50 backdrop-blur-md">
                    <div className="flex justify-between text-sm font-medium">
                        <span className="text-slate-500">
                            Toplam: <span className="text-slate-800 font-semibold">{filteredEvents.length}</span> etkinlik
                        </span>
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            Tamamlanan: {filteredEvents.filter((e) => e.status === 'completed').length}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
