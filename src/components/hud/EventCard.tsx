'use client'

import { useState } from 'react'
import { Check, X, Clock, RefreshCw } from 'lucide-react'
import type { Event, EventStatus } from '@/types/database.types'
import { formatEventTime, getTimeUntilEvent } from '@/lib/notifications'

// Kategori renk haritası
const CATEGORY_COLORS: Record<string, string> = {
    'cat-trade-001': '#F59E0B',
    'cat-food-002': '#10B981',
    'cat-sport-003': '#3B82F6',
    'cat-dev-004': '#8B5CF6',
    'cat-etsy-005': '#EC4899',
    'cat-gaming-006': '#EF4444',
}

// Kategori emoji haritası
const CATEGORY_EMOJIS: Record<string, string> = {
    'cat-trade-001': '📈',
    'cat-food-002': '🍽️',
    'cat-sport-003': '🏃',
    'cat-dev-004': '💻',
    'cat-etsy-005': '🛍️',
    'cat-gaming-006': '🎮',
}

// Status badge renkleri
const STATUS_STYLES: Record<EventStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Bekliyor' },
    notified: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Bildirildi' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Tamamlandı' },
    skipped: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Atlandı' },
}

interface EventCardProps {
    event: Event
    onStatusChange?: (eventId: string, status: EventStatus) => void
    compact?: boolean
}

export default function EventCard({ event, onStatusChange, compact = false }: EventCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    const categoryColor = event.category_id ? CATEGORY_COLORS[event.category_id] : '#6B7280'
    const categoryEmoji = event.category_id ? CATEGORY_EMOJIS[event.category_id] : '📌'
    const statusStyle = STATUS_STYLES[event.status]
    const timeUntil = getTimeUntilEvent(event.scheduled_at)
    const formattedTime = formatEventTime(event.scheduled_at)
    const isPast = new Date(event.scheduled_at) < new Date()

    const handleStatusChange = async (newStatus: EventStatus) => {
        if (!onStatusChange || isUpdating) return
        setIsUpdating(true)
        try {
            onStatusChange(event.id, newStatus)
        } finally {
            setIsUpdating(false)
        }
    }

    if (compact) {
        return (
            <div
                className="flex items-center gap-3 rounded-lg bg-white/5 p-3 backdrop-blur-sm transition-all hover:bg-white/10"
                style={{ borderLeft: `3px solid ${categoryColor}` }}
            >
                <span className="text-lg">{categoryEmoji}</span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{event.title}</p>
                    <p className="text-xs text-gray-400">{formattedTime}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                    {timeUntil}
                </span>
            </div>
        )
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition-all hover:border-white/20 ${event.status === 'completed' ? 'opacity-60' : ''
                }`}
            style={{ borderLeftWidth: '4px', borderLeftColor: categoryColor }}
        >
            {/* Header */}
            <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{categoryEmoji}</span>
                    <div>
                        <h3 className="font-semibold text-white">{event.title}</h3>
                        {event.description && (
                            <p className="text-sm text-gray-400">{event.description}</p>
                        )}
                    </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                </span>
            </div>

            {/* Time Info */}
            <div className="mb-3 flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formattedTime}</span>
                </div>
                {event.is_recurring && (
                    <div className="flex items-center gap-1 text-blue-400">
                        <RefreshCw className="h-3 w-3" />
                        <span className="text-xs">{event.recurrence_rule}</span>
                    </div>
                )}
                {!isPast && event.status === 'pending' && (
                    <span className="ml-auto text-xs text-yellow-400">{timeUntil} kaldı</span>
                )}
            </div>

            {/* Duration */}
            <div className="mb-3 text-xs text-gray-500">
                Süre: {event.duration_min} dk • Hatırlatma: {event.reminder_min} dk önce
            </div>

            {/* Actions */}
            {event.status === 'pending' && (
                <div className="flex gap-2">
                    <button
                        onClick={() => handleStatusChange('completed')}
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-500/20 py-2 text-sm font-medium text-green-400 transition-all hover:bg-green-500/30 disabled:opacity-50"
                        aria-label="Tamamla"
                    >
                        <Check className="h-4 w-4" />
                        Tamamla
                    </button>
                    <button
                        onClick={() => handleStatusChange('skipped')}
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-500/20 py-2 text-sm font-medium text-gray-400 transition-all hover:bg-gray-500/30 disabled:opacity-50"
                        aria-label="Atla"
                    >
                        <X className="h-4 w-4" />
                        Atla
                    </button>
                </div>
            )}

            {/* Completed overlay */}
            {event.status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Check className="h-8 w-8 text-green-400" />
                </div>
            )}
        </div>
    )
}
