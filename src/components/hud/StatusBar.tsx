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
        <div className="fixed top-0 left-0 right-0 z-50 px-6 py-3">
            <div className="max-w-3xl mx-auto">
                {/* Floating control panel - Ultra thin */}
                <div className="relative bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/[0.05] px-5 py-3">
                    {/* Inner top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-t-2xl" />
                    {/* Subtle side gradients */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/[0.03] via-transparent to-cyan-500/[0.03] pointer-events-none" />

                    <div className="relative flex items-center justify-between gap-6">
                        {/* Logo & Title - Compact */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <span className="text-white text-[10px] font-bold">LN</span>
                                {/* Logo glow */}
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 blur-lg opacity-40" />
                            </div>
                            <div>
                                <h1 className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">LifeNexus</h1>
                                <p className="text-[10px] text-gray-600">Gunluk Ilerleme</p>
                            </div>
                        </div>

                        {/* Category indicators - Minimal dots */}
                        <div className="flex items-center gap-1.5">
                            {categories.map(cat => {
                                const isComplete = dailyStatus[cat.key as keyof DailyStatus]
                                return (
                                    <div
                                        key={cat.key}
                                        className={`
                                            relative w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold
                                            transition-all duration-500
                                            ${isComplete ? 'scale-105' : 'opacity-40'}
                                        `}
                                        style={{
                                            backgroundColor: isComplete ? cat.color + '20' : 'rgba(255,255,255,0.02)',
                                            color: isComplete ? cat.color : '#4b5563',
                                            boxShadow: isComplete ? `0 0 20px ${cat.color}30, inset 0 1px 0 rgba(255,255,255,0.1)` : undefined,
                                        }}
                                    >
                                        {cat.label}
                                        {/* Completion pulse */}
                                        {isComplete && (
                                            <span
                                                className="absolute inset-0 rounded-lg animate-pulse-ring"
                                                style={{ boxShadow: `0 0 0 0 ${cat.color}40` }}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* Progress section - Laser aesthetic */}
                        <div className="flex items-center gap-3">
                            {/* Laser progress bar */}
                            <div className="w-28 relative">
                                {/* Track */}
                                <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden">
                                    {/* Laser fill */}
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out relative"
                                        style={{
                                            width: `${progress}%`,
                                            background: progress === 100
                                                ? 'linear-gradient(90deg, #22c55e, #10b981, #22c55e)'
                                                : 'linear-gradient(90deg, #8b5cf6, #06b6d4, #8b5cf6)',
                                            backgroundSize: '200% 100%',
                                        }}
                                    >
                                        {/* Laser glow */}
                                        <div
                                            className="absolute inset-0 blur-sm"
                                            style={{
                                                background: progress === 100
                                                    ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                    : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                                            }}
                                        />
                                        {/* Leading edge glow */}
                                        {progress > 0 && (
                                            <div
                                                className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                                                style={{
                                                    background: progress === 100 ? '#22c55e' : '#06b6d4',
                                                    boxShadow: progress === 100
                                                        ? '0 0 10px #22c55e, 0 0 20px #22c55e50'
                                                        : '0 0 10px #06b6d4, 0 0 20px #06b6d450',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Percentage - Neon text */}
                            <div className="text-right min-w-[45px]">
                                <span
                                    className="text-lg font-bold tabular-nums"
                                    style={{
                                        background: progress === 100
                                            ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                            : 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        textShadow: progress === 100
                                            ? '0 0 30px rgba(34, 197, 94, 0.5)'
                                            : '0 0 30px rgba(139, 92, 246, 0.3)',
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
