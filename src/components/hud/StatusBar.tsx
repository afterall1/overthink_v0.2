'use client'

import { DailyStatus } from '@/components/3d/types'

interface StatusBarProps {
    dailyStatus: DailyStatus
}

export default function StatusBar({ dailyStatus }: StatusBarProps) {
    const completedCount = Object.values(dailyStatus).filter(Boolean).length
    const progress = (completedCount / 6) * 100

    const categories = [
        { key: 'trade', label: 'T', color: '#F59E0B' },
        { key: 'food', label: 'F', color: '#10B981' },
        { key: 'sport', label: 'S', color: '#3B82F6' },
        { key: 'dev', label: 'D', color: '#8B5CF6' },
        { key: 'etsy', label: 'E', color: '#EC4899' },
        { key: 'gaming', label: 'G', color: '#EF4444' },
    ] as const

    return (
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
            <div className="max-w-4xl mx-auto">
                {/* Main status bar */}
                <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl">
                    {/* Neon glow effect */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />

                    <div className="relative flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">LN</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-semibold text-white">LifeNexus</h1>
                                <p className="text-xs text-gray-500">Günlük İlerleme</p>
                            </div>
                        </div>

                        {/* Category indicators */}
                        <div className="flex items-center gap-1">
                            {categories.map(cat => (
                                <div
                                    key={cat.key}
                                    className={`
                    w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                    transition-all duration-300 border
                    ${dailyStatus[cat.key as keyof DailyStatus]
                                            ? 'border-transparent shadow-lg'
                                            : 'border-white/10 bg-gray-900/50'
                                        }
                  `}
                                    style={{
                                        backgroundColor: dailyStatus[cat.key as keyof DailyStatus] ? cat.color + '30' : undefined,
                                        color: dailyStatus[cat.key as keyof DailyStatus] ? cat.color : '#4b5563',
                                        boxShadow: dailyStatus[cat.key as keyof DailyStatus] ? `0 0 20px ${cat.color}40` : undefined,
                                    }}
                                >
                                    {cat.label}
                                </div>
                            ))}
                        </div>

                        {/* Progress section */}
                        <div className="flex items-center gap-4">
                            {/* Progress bar */}
                            <div className="w-32">
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${progress}%`,
                                            background: progress === 100
                                                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                                            boxShadow: progress > 0 ? '0 0 10px rgba(139, 92, 246, 0.5)' : undefined,
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Percentage */}
                            <div className="text-right min-w-[60px]">
                                <span
                                    className="text-2xl font-bold tabular-nums"
                                    style={{
                                        background: progress === 100
                                            ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                            : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    {Math.round(progress)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
