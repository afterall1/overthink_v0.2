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
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Bekliyor' },
    notified: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Bildirildi' },
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Tamamlandı' },
    skipped: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Atlandı' },
}

interface EventCardProps {
    event: Event
    onStatusChange?: (eventId: string, status: EventStatus) => void
    compact?: boolean
}

export default function EventCard({ event, onStatusChange, compact = false }: EventCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    const categoryColor = event.category_id ? CATEGORY_COLORS[event.category_id] : '#94a3b8'
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
                className="group relative flex items-center gap-3 rounded-xl bg-white/60 p-3 backdrop-blur-md transition-all duration-300 hover:bg-white/80 hover:translate-x-1 border border-white/50 shadow-sm hover:shadow-md"
                style={{
                    borderLeft: `3px solid ${categoryColor}`,
                }}
            >
                {/* Status glow edge */}
                {event.status === 'completed' && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
                )}
                <span className="text-lg transition-transform group-hover:scale-110 filter drop-shadow-sm">{categoryEmoji}</span>
                <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${event.status === 'completed' ? 'text-slate-400 line-through decoration-slate-400' : 'text-slate-700'} transition-colors`}>{event.title}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{formattedTime}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                    {timeUntil}
                </span>
            </div>
        )
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 
                ${event.status === 'completed'
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : event.status === 'pending'
                        ? 'border-white/60 bg-white/60 hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/5'
                        : 'border-white/40 bg-white/40'
                }`}
        >
            {/* Energy cell edge glow - Left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-500"
                style={{
                    backgroundColor: event.status === 'completed' ? '#10b981' : categoryColor,
                    boxShadow: event.status === 'completed'
                        ? '0 0 15px #10b981'
                        : `0 0 10px ${categoryColor}40`
                }}
            />

            {/* Inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

            {/* Content wrapper */}
            <div className="relative p-4 pl-6">
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl filter drop-shadow-sm">{categoryEmoji}</span>
                        <div>
                            <h3 className={`font-bold ${event.status === 'completed' ? 'text-slate-400' : 'text-slate-800'}`}>{event.title}</h3>
                            {event.description && (
                                <p className="text-sm text-slate-500">{event.description}</p>
                            )}
                        </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${statusStyle.bg} ${statusStyle.text} shadow-sm`}>
                        {statusStyle.label}
                    </span>
                </div>

                {/* Time Info */}
                <div className="mb-3 flex items-center gap-4 text-sm text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formattedTime}</span>
                    </div>
                    {event.is_recurring && (
                        <div className="flex items-center gap-1 text-indigo-500">
                            <RefreshCw className="h-3 w-3" />
                            <span className="text-xs">{event.recurrence_rule}</span>
                        </div>
                    )}
                    {!isPast && event.status === 'pending' && (
                        <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{timeUntil} kaldı</span>
                    )}
                </div>

                {/* Duration */}
                <div className="mb-4 text-xs text-slate-400 font-medium">
                    Süre: {event.duration_min} dk • Hatırlatma: {event.reminder_min} dk önce
                </div>

                {/* Actions */}
                {event.status === 'pending' && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleStatusChange('completed')}
                            disabled={isUpdating}
                            className="group/btn flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 text-white py-2.5 text-sm font-semibold transition-all duration-300 hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 active:translate-y-0.5 disabled:opacity-50"
                            aria-label="Tamamla"
                        >
                            <Check className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                            Tamamla
                        </button>
                        <button
                            onClick={() => handleStatusChange('skipped')}
                            disabled={isUpdating}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-100 text-slate-600 py-2.5 text-sm font-medium transition-all duration-300 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
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
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 shadow-xl shadow-emerald-500/10 border border-emerald-200 animate-in fade-in zoom-in duration-300">
                        <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
            )}
        </div>
    )
}
