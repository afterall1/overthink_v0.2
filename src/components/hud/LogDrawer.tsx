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
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-24 left-4 z-40 p-3 rounded-xl bg-black/60 backdrop-blur-xl 
                   border border-white/10 hover:border-white/20 transition-all duration-300
                   hover:scale-105"
                style={{ boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)' }}
            >
                <Menu className="w-5 h-5 text-gray-400" />
            </button>

            {/* Drawer Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={`fixed top-0 left-0 h-full w-80 z-50 transform transition-transform duration-300 ease-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="h-full bg-black/90 backdrop-blur-xl border-r border-white/10 flex flex-col">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent pointer-events-none" />

                    {/* Header */}
                    <div className="relative flex items-center justify-between p-4 border-b border-white/10">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Günün Logları</h2>
                            <p className="text-xs text-gray-500">{logs.length} kayıt</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-400" />
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

                                    {/* Log entries */}
                                    <div className="space-y-2">
                                        {categoryLogs.map(log => (
                                            <div
                                                key={log.id}
                                                className="p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 
                                   transition-all duration-200 group"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white truncate">
                                                            {getLogSummary(log.category, log.data)}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">
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
