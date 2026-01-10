'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Calendar, ChevronLeft, ChevronRight, Bell, BellOff } from 'lucide-react'
import type { Event, EventStatus } from '@/types/database.types'
import { getMockEvents, updateMockEventStatus } from '@/lib/mockEvents'
import { requestNotificationPermission, getNotificationPermission } from '@/lib/notifications'
import EventCard from './EventCard'

interface EventTimelineProps {
    isOpen: boolean
    onClose: () => void
}

type ViewMode = 'today' | 'week'

export default function EventTimeline({ isOpen, onClose }: EventTimelineProps) {
    const [events, setEvents] = useState<Event[]>([])
    const [viewMode, setViewMode] = useState<ViewMode>('today')
    const [notificationEnabled, setNotificationEnabled] = useState(false)
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
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel - Frosted Glass */}
            <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-black/60 backdrop-blur-3xl border-l border-white/5 sm:w-96">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent pointer-events-none" />
                {/* Blue accent glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                {/* Inner highlight */}
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/10 via-transparent to-white/5" />

                {/* Header - Minimalist */}
                <div className="relative flex items-center justify-between border-b border-white/5 p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Planlananlar</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Notification toggle */}
                        <button
                            onClick={handleEnableNotifications}
                            className={`rounded-xl p-2 transition-all duration-300 ${notificationEnabled
                                ? 'bg-green-500/15 text-green-400 shadow-lg shadow-green-500/10'
                                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
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
                            className="rounded-full p-2 text-gray-500 transition-all duration-300 hover:bg-white/10 hover:text-white hover:rotate-90"
                            aria-label="Kapat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle - Glass buttons */}
                <div className="relative flex gap-2 border-b border-white/5 p-4">
                    <button
                        onClick={() => setViewMode('today')}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${viewMode === 'today'
                            ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/10'
                            : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                            }`}
                    >
                        Bugun
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300 ${viewMode === 'week'
                            ? 'bg-blue-500/20 text-blue-300 shadow-lg shadow-blue-500/10'
                            : 'bg-white/[0.03] text-gray-500 hover:bg-white/[0.06] hover:text-gray-300'
                            }`}
                    >
                        7 Gun
                    </button>
                </div>

                {/* Date Navigator (for week view) */}
                {viewMode === 'week' && (
                    <div className="relative flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="group rounded-xl p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-all duration-300"
                            aria-label="Onceki gun"
                        >
                            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        </button>
                        <span className="text-sm text-gray-400 font-medium">
                            {selectedDate.toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="group rounded-xl p-2 text-gray-500 hover:bg-white/10 hover:text-white transition-all duration-300"
                            aria-label="Sonraki gun"
                        >
                            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                        </button>
                    </div>
                )}

                {/* Events List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {sortedDates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="mb-4 h-12 w-12 text-gray-600" />
                            <p className="text-gray-400">
                                {viewMode === 'today'
                                    ? 'Bugün için planlanmış etkinlik yok'
                                    : 'Bu hafta için planlanmış etkinlik yok'}
                            </p>
                            <p className="mt-2 text-sm text-gray-500">
                                + butonuna tıklayarak yeni plan ekle
                            </p>
                        </div>
                    ) : (
                        sortedDates.map((dateKey) => (
                            <div key={dateKey} className="mb-6">
                                {/* Date Header */}
                                {viewMode === 'week' && (
                                    <h3 className="mb-3 text-sm font-medium text-gray-400">
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
                <div className="relative border-t border-white/5 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                            Toplam: <span className="text-gray-300">{filteredEvents.length}</span> etkinlik
                        </span>
                        <span className="text-green-400/80">
                            Tamamlanan: {filteredEvents.filter((e) => e.status === 'completed').length}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
