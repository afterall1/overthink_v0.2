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
                className="group relative flex items-center gap-3 rounded-xl bg-white/[0.02] p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/[0.05] hover:translate-x-1"
                style={{
                    borderLeft: `2px solid ${categoryColor}`,
                    boxShadow: event.status === 'completed'
                        ? `inset 0 0 20px rgba(34, 197, 94, 0.1)`
                        : 'none'
                }}
            >
                {/* Status glow edge */}
                {event.status === 'completed' && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-green-500 shadow-lg shadow-green-500/50" />
                )}
                <span className="text-lg transition-transform group-hover:scale-110">{categoryEmoji}</span>
                <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${event.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-200 group-hover:text-white'} transition-colors`}>{event.title}</p>
                    <p className="text-[11px] text-gray-600">{formattedTime}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                    {timeUntil}
                </span>
            </div>
        )
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 
                ${event.status === 'completed'
                    ? 'border-green-500/20 bg-black/30'
                    : event.status === 'pending'
                        ? 'border-white/[0.05] bg-black/40 hover:border-white/10'
                        : 'border-white/[0.05] bg-black/40'
                }`}
            style={{
                boxShadow: event.status === 'completed'
                    ? `inset 0 0 30px rgba(34, 197, 94, 0.08), 0 0 20px rgba(34, 197, 94, 0.1)`
                    : event.status === 'pending'
                        ? `inset 0 0 30px ${categoryColor}08`
                        : 'none'
            }}
        >
            {/* Energy cell edge glow - Left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-500"
                style={{
                    backgroundColor: event.status === 'completed' ? '#22c55e' : categoryColor,
                    boxShadow: event.status === 'completed'
                        ? '0 0 15px #22c55e, 0 0 30px rgba(34, 197, 94, 0.3)'
                        : `0 0 15px ${categoryColor}80, 0 0 30px ${categoryColor}40`
                }}
            />

            {/* Inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Content wrapper */}
            <div className="relative p-4 pl-5">
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl">{categoryEmoji}</span>
                        <div>
                            <h3 className={`font-semibold ${event.status === 'completed' ? 'text-gray-400' : 'text-white'}`}>{event.title}</h3>
                            {event.description && (
                                <p className="text-sm text-gray-500">{event.description}</p>
                            )}
                        </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
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
                            className="group/btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500/10 py-2.5 text-sm font-medium text-green-400 transition-all duration-300 hover:bg-green-500/20 hover:shadow-lg hover:shadow-green-500/20 disabled:opacity-50"
                            aria-label="Tamamla"
                        >
                            <Check className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            Tamamla
                        </button>
                        <button
                            onClick={() => handleStatusChange('skipped')}
                            disabled={isUpdating}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/[0.03] py-2.5 text-sm font-medium text-gray-500 transition-all duration-300 hover:bg-white/[0.06] hover:text-gray-300 disabled:opacity-50"
                            aria-label="Atla"
                        >
                            <X className="h-4 w-4" />
                            Atla
                        </button>
                    </div>
                )}
            </div>

            {/* Completed overlay - Subtle checkmark */}
            {event.status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 shadow-lg shadow-green-500/20">
                        <Check className="h-6 w-6 text-green-400" />
                    </div>
                </div>
            )}
        </div>
    )
}
