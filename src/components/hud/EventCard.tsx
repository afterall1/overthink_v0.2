'use client'

import { useState } from 'react'
import { Check, X, Clock, RefreshCw } from 'lucide-react'
import type { EventWithCategory, EventStatus } from '@/types/database.types'
import { formatEventTime, getTimeUntilEvent } from '@/lib/notifications'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Kategori slug'a göre emoji haritası (fallback için)
const CATEGORY_EMOJIS: Record<string, string> = {
    'trade': '📈',
    'food': '🍽️',
    'sport': '🏃',
    'dev': '💻',
    'etsy': '🛍️',
    'gaming': '🎮',
}

// Status badge stilleri
const STATUS_STYLES: Record<EventStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className: string; label: string }> = {
    pending: { variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200", label: 'Bekliyor' },
    notified: { variant: "default", className: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", label: 'Bildirildi' },
    completed: { variant: "default", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200", label: 'Tamamlandı' },
    skipped: { variant: "outline", className: "bg-slate-100 text-slate-500 hover:bg-slate-200 border-slate-200", label: 'Atlandı' },
}

interface EventCardProps {
    event: EventWithCategory
    onStatusChange?: (eventId: string, status: EventStatus) => void
    onClick?: (event: EventWithCategory) => void
    compact?: boolean
    className?: string
}

export default function EventCard({ event, onStatusChange, onClick, compact = false, className = "" }: EventCardProps) {
    const [isUpdating, setIsUpdating] = useState(false)

    // Kategori bilgisini join edilen datadan al
    const category = event.categories
    const categoryColor = category?.color_code || '#94a3b8'
    const categoryEmoji = category ? CATEGORY_EMOJIS[category.slug] || '📌' : '📌'
    const categoryName = category?.name || null

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
            <Card
                className={cn(
                    "group relative overflow-hidden transition-all duration-300 hover:shadow-md border-l-[3px] cursor-pointer",
                    className
                )}
                style={{ borderLeftColor: categoryColor }}
                onClick={() => onClick?.(event)}
            >
                <CardContent className="p-3 flex items-center gap-3">
                    {/* Status glow edge handled by border-l above */}

                    {event.status === 'completed' && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 rounded-l-xl z-20" />
                    )}

                    <span className="text-lg transition-transform group-hover:scale-110 filter drop-shadow-sm select-none">
                        {categoryEmoji}
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className={cn(
                            "truncate text-sm font-semibold transition-colors",
                            event.status === 'completed' ? "text-muted-foreground line-through decoration-slate-400" : "text-foreground"
                        )}>
                            {event.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formattedTime}
                            </span>
                            {categoryName && (
                                <span
                                    className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
                                    style={{
                                        backgroundColor: `${categoryColor}15`,
                                        color: categoryColor
                                    }}
                                >
                                    {categoryName}
                                </span>
                            )}
                        </div>
                    </div>

                    <Badge
                        variant="secondary"
                        className={cn("px-2 py-0.5 text-[10px] font-semibold opacity-90", statusStyle.className)}
                    >
                        {timeUntil}
                    </Badge>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card
            className={cn(
                "group relative overflow-hidden transition-all duration-300 cursor-pointer",
                event.status === 'completed' ? "border-emerald-200 bg-emerald-50/30" : "hover:shadow-lg hover:shadow-primary/5",
                className
            )}
            onClick={() => onClick?.(event)}
        >
            {/* Energy cell edge glow - Left */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 z-10"
                style={{
                    backgroundColor: event.status === 'completed' ? '#10b981' : categoryColor,
                    boxShadow: event.status === 'completed'
                        ? '0 0 15px #10b981'
                        : `0 0 10px ${categoryColor}40`
                }}
            />

            {/* Inner top highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-50" />

            <CardContent className="p-4 pl-6 relative">
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl filter drop-shadow-sm select-none bg-background/50 p-1.5 rounded-lg border shadow-sm">
                            {categoryEmoji}
                        </span>
                        <div>
                            <h3 className={cn(
                                "font-bold text-lg leading-tight",
                                event.status === 'completed' ? "text-muted-foreground" : "text-card-foreground"
                            )}>
                                {event.title}
                            </h3>
                            {event.description && (
                                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                                    {event.description}
                                </p>
                            )}
                        </div>
                    </div>
                    <Badge variant={statusStyle.variant} className={cn("text-[10px] tracking-wide shadow-sm", statusStyle.className)}>
                        {statusStyle.label}
                    </Badge>
                </div>

                {/* Time & Meta Info */}
                <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground font-medium pl-1 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-secondary/50 px-2 py-1 rounded-md">
                        <Clock className="h-3.5 w-3.5 text-primary/70" />
                        <span>{formattedTime}</span>
                    </div>
                    {categoryName && (
                        <span
                            className="px-2 py-1 rounded-md text-xs font-bold"
                            style={{
                                backgroundColor: `${categoryColor}15`,
                                color: categoryColor
                            }}
                        >
                            {categoryName}
                        </span>
                    )}
                    {event.is_recurring && (
                        <div className="flex items-center gap-1 text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
                            <RefreshCw className="h-3 w-3" />
                            <span className="text-xs">{event.recurrence_rule}</span>
                        </div>
                    )}
                    {!isPast && event.status === 'pending' && (
                        <Badge variant="outline" className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 border-amber-100">
                            {timeUntil} kaldı
                        </Badge>
                    )}
                </div>

                {/* Actions */}
                {event.status === 'pending' && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                        <Button
                            onClick={() => handleStatusChange('completed')}
                            disabled={isUpdating}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Tamamla
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleStatusChange('skipped')}
                            disabled={isUpdating}
                            className="flex-1 hover:bg-slate-200"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Atla
                        </Button>
                    </div>
                )}
            </CardContent>

            {/* Completed overlay - Subtle checkmark */}
            {event.status === 'completed' && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl z-20 pointer-events-none">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 shadow-xl shadow-emerald-500/10 border border-emerald-200 animate-in fade-in zoom-in duration-300">
                        <Check className="h-6 w-6 text-emerald-600" />
                    </div>
                </div>
            )}
        </Card>
    )
}
