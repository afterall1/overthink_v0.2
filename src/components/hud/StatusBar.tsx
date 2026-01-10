'use client'

interface DailyStatus {
    trade: boolean
    food: boolean
    sport: boolean
    dev: boolean
    etsy: boolean
    gaming: boolean
}

interface StatusBarProps {
    dailyStatus: DailyStatus
    className?: string
}

export default function StatusBar({ dailyStatus, className = "" }: StatusBarProps) {
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
        <div className={`w-full z-50 py-2 ${className}`}>
            <div className="mx-auto">
                {/* Floating control panel - Ultra thin Daylight Prism */}
                <div className="relative bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/40 shadow-lg shadow-blue-900/5 px-5 py-3">
                    {/* Inner top highlight */}
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-t-2xl" />

                    <div className="relative flex items-center justify-between gap-6">
                        {/* Logo & Title - Compact */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                                <span className="text-white text-[10px] font-bold">LN</span>
                            </div>
                            <div>
                                <h1 className="text-xs font-bold text-slate-800 tracking-tight">LifeNexus</h1>
                                <p className="text-[10px] text-slate-500 font-medium">Günlük İlerleme</p>
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
                                            ${isComplete ? 'scale-105' : 'opacity-40 grayscale'}
                                        `}
                                        style={{
                                            backgroundColor: isComplete ? cat.color + '15' : 'rgba(0,0,0,0.03)',
                                            color: isComplete ? cat.color : '#64748b',
                                            boxShadow: isComplete ? `0 2px 8px ${cat.color}20` : undefined,
                                            border: isComplete ? `1px solid ${cat.color}30` : '1px solid rgba(0,0,0,0.05)'
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

                        {/* Progress section - Solarpunk aesthetic */}
                        <div className="flex items-center gap-3">
                            {/* Organic progress bar */}
                            <div className="w-28 relative">
                                {/* Track */}
                                <div className="h-1.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
                                    {/* Fill */}
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out relative"
                                        style={{
                                            width: `${progress}%`,
                                            background: progress === 100
                                                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                                : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                                        }}
                                    >
                                        {/* Leading edge glow */}
                                        {progress > 0 && (
                                            <div
                                                className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-md"
                                                style={{
                                                    boxShadow: progress === 100
                                                        ? '0 0 8px #22c55e'
                                                        : '0 0 8px #6366f1',
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Percentage */}
                            <div className="text-right min-w-[45px]">
                                <span
                                    className="text-lg font-bold tabular-nums"
                                    style={{
                                        color: progress === 100 ? '#10b981' : '#6366f1',
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
