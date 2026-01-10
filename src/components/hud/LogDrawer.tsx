'use client'

import { useState } from 'react'
import { Menu, X, Clock, Trash2 } from 'lucide-react'
import { CategorySlug } from '@/types/database.types'
import { CATEGORY_COLORS } from '@/components/3d/types'

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

export default function LogDrawer({ logs, onDeleteLog }: LogDrawerProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Group logs by category
    const groupedLogs = logs.reduce((acc, log) => {
        if (!acc[log.category]) acc[log.category] = []
        acc[log.category].push(log)
        return acc
    }, {} as Record<CategorySlug, LogEntry[]>)

    return (
        <>
            {/* Toggle Button */}
            {/* Toggle Button - Ethereal */}
            <button
                onClick={() => setIsOpen(true)}
                className="group fixed top-24 left-4 z-40 p-3 rounded-xl bg-black/50 backdrop-blur-xl 
                   border border-white/5 hover:border-white/15 transition-all duration-300
                   hover:scale-105"
                style={{ boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)' }}
            >
                <Menu className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                {/* Hover glow */}
                <span className="absolute inset-0 rounded-xl bg-purple-500/0 group-hover:bg-purple-500/10 transition-colors duration-300" />
            </button>

            {/* Drawer Backdrop - Ethereal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Panel - Frosted Glass */}
            <div
                className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full bg-black/60 backdrop-blur-3xl border-r border-white/5 flex flex-col">
                    {/* Gradient overlay for 3D scene visibility */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent pointer-events-none" />
                    {/* Subtle purple accent glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-transparent pointer-events-none" />
                    {/* Inner top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />

                    {/* Header - Minimalist */}
                    <div className="relative flex items-center justify-between p-4 border-b border-white/5">
                        <div>
                            <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Gunun Loglari</h2>
                            <p className="text-[11px] text-gray-600 mt-0.5">{logs.length} kayit</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-full text-gray-500 hover:bg-white/10 hover:text-white transition-all duration-300 hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="relative flex-1 overflow-y-auto p-4 space-y-6">
                        {logs.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-gray-600" />
                                </div>
                                <p className="text-gray-500">Henüz log yok</p>
                                <p className="text-xs text-gray-600 mt-1">+ butonuyla eklemeye başla</p>
                            </div>
                        ) : (
                            Object.entries(groupedLogs).map(([category, categoryLogs]) => (
                                <div key={category}>
                                    {/* Category header */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-lg">{categoryIcons[category as CategorySlug]}</span>
                                        <span
                                            className="text-sm font-medium capitalize"
                                            style={{ color: CATEGORY_COLORS[category as CategorySlug] }}
                                        >
                                            {category}
                                        </span>
                                        <span className="text-xs text-gray-600">({categoryLogs.length})</span>
                                    </div>

                                    {/* Log entries - Micro-interaction cards */}
                                    <div className="space-y-2">
                                        {categoryLogs.map(log => (
                                            <div
                                                key={log.id}
                                                className="group relative p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] 
                                                           hover:bg-white/[0.05] hover:border-white/[0.08] 
                                                           transition-all duration-300 hover:translate-x-1"
                                            >
                                                {/* Category accent line */}
                                                <div
                                                    className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                    style={{ backgroundColor: CATEGORY_COLORS[log.category] }}
                                                />
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                                                            {getLogSummary(log.category, log.data)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[11px] text-gray-600 group-hover:text-gray-500 transition-colors">
                                                                {formatTime(log.timestamp)}
                                                            </span>
                                                            <span className="text-xs">
                                                                {log.sentiment >= 7 ? '😊' : log.sentiment >= 4 ? '😐' : '😔'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {onDeleteLog && (
                                                        <button
                                                            onClick={() => onDeleteLog(log.id)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 
                                                                       transition-all duration-200"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-400" />
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

                    {/* Footer stats */}
                    {logs.length > 0 && (
                        <div className="relative p-4 border-t border-white/10">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="p-2 rounded-lg bg-white/5">
                                    <p className="text-lg font-bold text-white">{logs.length}</p>
                                    <p className="text-xs text-gray-500">Toplam</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5">
                                    <p className="text-lg font-bold text-green-400">
                                        {Object.keys(groupedLogs).length}
                                    </p>
                                    <p className="text-xs text-gray-500">Kategori</p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5">
                                    <p className="text-lg font-bold text-purple-400">
                                        {Math.round(logs.reduce((sum, l) => sum + l.sentiment, 0) / logs.length * 10) / 10}
                                    </p>
                                    <p className="text-xs text-gray-500">Ortalama</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
