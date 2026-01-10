'use client'

import { Plus, Menu, X, Clock, Trash2 } from 'lucide-react'
import { CategorySlug } from '@/types/database.types'
const CATEGORY_COLORS: Record<CategorySlug, string> = {
    trade: '#F59E0B',
    food: '#10B981',
    sport: '#3B82F6',
    dev: '#8B5CF6',
    etsy: '#EC4899',
    gaming: '#EF4444',
}

interface LogEntry {
    id: string
    category: CategorySlug
    data: Record<string, unknown>
    sentiment: number
    timestamp: Date
}

interface LogDrawerProps {
    logs: LogEntry[]
    onDeleteLog?: (id: string) => void
    isOpen: boolean
    onOpenLogger: () => void
}

const categoryIcons: Record<CategorySlug, string> = {
    trade: '📈',
    food: '🍽️',
    sport: '💪',
    dev: '💻',
    etsy: '🛍️',
    gaming: '🎮',
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function getLogSummary(category: CategorySlug, data: Record<string, unknown>): string {
    switch (category) {
        case 'trade':
            return `${data.pair} ${data.side} ${data.pnl ? `$${data.pnl}` : ''}`
        case 'food':
            return `${data.meal_type} - ${data.calories} kcal`
        case 'sport':
            return `${data.activity} - ${data.duration_min}dk`
        case 'dev':
            return `${data.project}: ${data.task}`
        case 'etsy':
            return `${data.product} - $${data.revenue}`
        case 'gaming':
            return `${data.game} - ${data.duration_min}dk`
        default:
            return ''
    }
}

export default function LogDrawer({ logs, onDeleteLog, isOpen, onOpenLogger }: LogDrawerProps) {
    // Group logs by category
    const groupedLogs = logs.reduce((acc, log) => {
        if (!acc[log.category]) acc[log.category] = []
        acc[log.category].push(log)
        return acc
    }, {} as Record<CategorySlug, LogEntry[]>)

    return (
        <div
            className={`fixed top-0 left-0 h-full w-80 z-40 transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
            <div className="h-full bg-white/90 backdrop-blur-3xl border-r border-slate-200 flex flex-col shadow-2xl shadow-indigo-900/10">
                {/* Gradient overlay for depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/30 pointer-events-none" />

                {/* Header - Minimalist */}
                <div className="relative flex items-center justify-between p-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Günün Logları</h2>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">{logs.length} kayıt</p>
                    </div>
                </div>

                {/* Content */}
                <div className="relative flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {logs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-slate-500 font-medium">Henüz log yok</p>
                            <p className="text-xs text-slate-400 mt-1">Eylemlerini kaydetmeye başla</p>
                        </div>
                    ) : (
                        Object.entries(groupedLogs).map(([category, categoryLogs]) => (
                            <div key={category}>
                                {/* Category header */}
                                <div className="flex items-center gap-2 mb-3 px-1">
                                    <span className="text-lg">{categoryIcons[category as CategorySlug]}</span>
                                    <span
                                        className="text-sm font-bold capitalize"
                                        style={{ color: CATEGORY_COLORS[category as CategorySlug] }}
                                    >
                                        {category}
                                    </span>
                                    <span className="text-xs font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                                        {categoryLogs.length}
                                    </span>
                                </div>

                                {/* Log entries - Micro-interaction cards */}
                                <div className="space-y-2.5">
                                    {categoryLogs.map(log => (
                                        <div
                                            key={log.id}
                                            className="group relative p-3 rounded-xl bg-white border border-slate-100 
                                                           hover:border-indigo-100 shadow-sm hover:shadow-md
                                                           transition-all duration-300 hover:translate-x-1"
                                        >
                                            {/* Category accent line */}
                                            <div
                                                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{ backgroundColor: CATEGORY_COLORS[log.category] }}
                                            />
                                            <div className="flex items-start justify-between pl-2">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate transition-colors">
                                                        {getLogSummary(log.category, log.data)}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500 transition-colors bg-slate-50 px-1.5 py-0.5 rounded">
                                                            {formatTime(log.timestamp)}
                                                        </span>
                                                        <span className="text-xs" title={`Mood: ${log.sentiment}/10`}>
                                                            {log.sentiment >= 7 ? '😊' : log.sentiment >= 4 ? '😐' : '😔'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {onDeleteLog && (
                                                    <button
                                                        onClick={() => onDeleteLog(log.id)}
                                                        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 
                                                                       transition-all duration-200"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer stats or Add Button */}
                <div className="relative p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
                    {/* Floating Add Button in Footer (replaces old FAB) */}
                    <button
                        onClick={onOpenLogger}
                        className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold
                                   flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all
                                   active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Log Ekle
                    </button>

                    {logs.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-lg font-bold text-slate-700">{logs.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Toplam</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-lg font-bold text-emerald-500">
                                    {Object.keys(groupedLogs).length}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <p className="text-lg font-bold text-purple-500">
                                    {Math.round(logs.reduce((sum, l) => sum + l.sentiment, 0) / logs.length * 10) / 10}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Mood</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
