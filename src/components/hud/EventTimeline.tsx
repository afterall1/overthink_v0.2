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
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-black/80 backdrop-blur-xl sm:w-96">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Planlananlar</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Notification toggle */}
                        <button
                            onClick={handleEnableNotifications}
                            className={`rounded-lg p-2 transition-colors ${notificationEnabled
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                }`}
                            aria-label={notificationEnabled ? 'Bildirimler açık' : 'Bildirimleri aç'}
                        >
                            {notificationEnabled ? (
                                <Bell className="h-4 w-4" />
                            ) : (
                                <BellOff className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                            aria-label="Kapat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2 border-b border-white/10 p-4">
                    <button
                        onClick={() => setViewMode('today')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${viewMode === 'today'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                    >
                        Bugün
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${viewMode === 'week'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white/10 text-gray-400 hover:bg-white/20'
                            }`}
                    >
                        7 Gün
                    </button>
                </div>

                {/* Date Navigator (for week view) */}
                {viewMode === 'week' && (
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                        <button
                            onClick={() => navigateDate('prev')}
                            className="rounded-lg p-1 text-gray-400 hover:bg-white/10"
                            aria-label="Önceki gün"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-sm text-gray-300">
                            {selectedDate.toLocaleDateString('tr-TR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                            })}
                        </span>
                        <button
                            onClick={() => navigateDate('next')}
                            className="rounded-lg p-1 text-gray-400 hover:bg-white/10"
                            aria-label="Sonraki gün"
                        >
                            <ChevronRight className="h-5 w-5" />
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

                {/* Stats Footer */}
                <div className="border-t border-white/10 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">
                            Toplam: {filteredEvents.length} etkinlik
                        </span>
                        <span className="text-green-400">
                            Tamamlanan: {filteredEvents.filter((e) => e.status === 'completed').length}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
