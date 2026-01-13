'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CheckCircle2, TrendingUp, Trophy, Zap, Calendar, Activity, Flame } from 'lucide-react'
import type { ProgressTimelineEvent, GoalProgressStats } from '@/actions/goals'

// =====================================================
// Props Interface
// =====================================================

interface ProgressTimelineProps {
    events: ProgressTimelineEvent[]
    stats: GoalProgressStats
    maxEvents?: number
}

// =====================================================
// Helper Functions
// =====================================================

function getEventIcon(type: ProgressTimelineEvent['type']) {
    switch (type) {
        case 'quest_completion':
            return CheckCircle2
        case 'progress_log':
            return TrendingUp
        case 'milestone_reached':
            return Trophy
    }
}

function getEventStyle(type: ProgressTimelineEvent['type']) {
    switch (type) {
        case 'quest_completion':
            return {
                bgColor: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
                borderColor: 'border-emerald-200'
            }
        case 'progress_log':
            return {
                bgColor: 'bg-blue-100',
                iconColor: 'text-blue-600',
                borderColor: 'border-blue-200'
            }
        case 'milestone_reached':
            return {
                bgColor: 'bg-amber-100',
                iconColor: 'text-amber-600',
                borderColor: 'border-amber-200'
            }
    }
}

function formatEventTime(date: Date): string {
    if (isToday(date)) {
        return `Bugün ${format(date, 'HH:mm', { locale: tr })}`
    }
    if (isYesterday(date)) {
        return `Dün ${format(date, 'HH:mm', { locale: tr })}`
    }
    return format(date, 'd MMM HH:mm', { locale: tr })
}

function groupEventsByDate(events: ProgressTimelineEvent[]): Map<string, ProgressTimelineEvent[]> {
    const groups = new Map<string, ProgressTimelineEvent[]>()

    for (const event of events) {
        const dateKey = format(event.timestamp, 'yyyy-MM-dd')
        const existing = groups.get(dateKey) || []
        existing.push(event)
        groups.set(dateKey, existing)
    }

    return groups
}

function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Bugün'
    if (isYesterday(date)) return 'Dün'
    return format(date, 'd MMMM yyyy', { locale: tr })
}

// =====================================================
// Stats Card Component
// =====================================================

function StatsCard({ stats }: { stats: GoalProgressStats }) {
    return (
        <div className="grid grid-cols-4 gap-3 mb-5">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100"
            >
                <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-medium text-amber-600">XP</span>
                </div>
                <p className="text-lg font-bold text-amber-700">{stats.totalXpEarned}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-100"
            >
                <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-600">Görev</span>
                </div>
                <p className="text-lg font-bold text-emerald-700">{stats.questsCompleted}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100"
            >
                <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">İlerleme</span>
                </div>
                <p className="text-lg font-bold text-blue-700">+{stats.totalProgressLogged}</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-100"
            >
                <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-medium text-violet-600">Gün</span>
                </div>
                <p className="text-lg font-bold text-violet-700">{stats.activeDays}</p>
            </motion.div>
        </div>
    )
}

// =====================================================
// Timeline Event Component
// =====================================================

function TimelineEvent({
    event,
    index,
    isLast
}: {
    event: ProgressTimelineEvent
    index: number
    isLast: boolean
}) {
    const style = getEventStyle(event.type)
    const Icon = getEventIcon(event.type)

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03, duration: 0.25 }}
            className="relative flex gap-3"
        >
            {/* Timeline Line */}
            {!isLast && (
                <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-transparent" />
            )}

            {/* Event Icon */}
            <div className={`
                relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${style.bgColor} border ${style.borderColor}
            `}>
                <span className="text-lg">{event.emoji}</span>
            </div>

            {/* Event Content */}
            <div className="flex-1 pb-4">
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-slate-100/50 hover:border-slate-200 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">
                                {event.title}
                            </p>
                            {event.metadata?.notes && (
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                    {event.metadata.notes}
                                </p>
                            )}
                        </div>

                        {/* XP Badge */}
                        {event.xpEarned && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 flex-shrink-0">
                                <Zap className="w-3 h-3" />
                                +{event.xpEarned}
                            </span>
                        )}

                        {/* Value Badge */}
                        {event.value && event.type === 'progress_log' && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 flex-shrink-0">
                                +{event.value}
                            </span>
                        )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-400">
                            {formatEventTime(event.timestamp)}
                        </span>

                        {/* Streak Count */}
                        {event.metadata?.streakCount && event.metadata.streakCount > 1 && (
                            <span className="flex items-center gap-1 text-xs text-orange-500">
                                <Flame className="w-3 h-3" />
                                {event.metadata.streakCount} streak
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function ProgressTimeline({
    events,
    stats,
    maxEvents = 20
}: ProgressTimelineProps) {
    // Group events by date
    const groupedEvents = useMemo(() => groupEventsByDate(events.slice(0, maxEvents)), [events, maxEvents])

    if (events.length === 0) {
        return (
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-6">
                {/* Show stats even if empty */}
                <StatsCard stats={stats} />

                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <Activity className="w-7 h-7 text-slate-400" />
                    </div>
                    <p className="text-slate-500">Henüz aktivite bulunmuyor</p>
                    <p className="text-xs text-slate-400 mt-1">Görev tamamladıkça veya ilerleme kaydettikçe burada görünecek</p>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Aktivite Geçmişi</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {events.length} kayıt
                </span>
            </div>

            {/* Stats Summary */}
            <StatsCard stats={stats} />

            {/* Timeline */}
            <div className="space-y-4">
                {Array.from(groupedEvents.entries()).map(([dateKey, dayEvents]) => (
                    <div key={dateKey}>
                        {/* Date Header */}
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-px flex-1 bg-slate-200" />
                            <span className="text-xs font-semibold text-slate-500 px-2">
                                {formatDateHeader(dateKey)}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        {/* Day Events */}
                        <div className="space-y-0">
                            {dayEvents.map((event, index) => (
                                <TimelineEvent
                                    key={event.id}
                                    event={event}
                                    index={index}
                                    isLast={index === dayEvents.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More Indicator */}
            {events.length > maxEvents && (
                <div className="text-center pt-4 border-t border-slate-100 mt-4">
                    <p className="text-xs text-slate-400">
                        +{events.length - maxEvents} daha eski kayıt
                    </p>
                </div>
            )}
        </div>
    )
}
