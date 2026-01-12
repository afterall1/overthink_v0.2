interface ProgressRingProps {
    progress: number // 0-100
    size?: number
    strokeWidth?: number
    className?: string
    color?: 'emerald' | 'blue' | 'violet' | 'amber'
    glow?: boolean
}

const colorMap = {
    emerald: {
        track: 'stroke-emerald-100',
        fill: 'stroke-emerald-500',
        glow: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]',
        id: 'emerald-gradient',
        stops: ['#10b981', '#34d399']
    },
    blue: {
        track: 'stroke-blue-100',
        fill: 'stroke-blue-500',
        glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]',
        id: 'blue-gradient',
        stops: ['#3b82f6', '#60a5fa']
    },
    violet: {
        track: 'stroke-violet-100',
        fill: 'stroke-violet-500',
        glow: 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]',
        id: 'violet-gradient',
        stops: ['#8b5cf6', '#a78bfa']
    },
    amber: {
        track: 'stroke-amber-100',
        fill: 'stroke-amber-500',
        glow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]',
        id: 'amber-gradient',
        stops: ['#f59e0b', '#fbbf24']
    }
}

export default function ProgressRing({
    progress,
    size = 48,
    strokeWidth = 4,
    className = '',
    color = 'violet',
    glow = false
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const clampedProgress = Math.min(100, Math.max(0, progress))
    const offset = circumference - (clampedProgress / 100) * circumference

    const colors = colorMap[color]

    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className={`transform -rotate-90 ${glow ? colors.glow : ''}`}
            >
                {/* Define Gradients */}
                <defs>
                    <linearGradient id={colors.id} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={colors.stops[0]} />
                        <stop offset="100%" stopColor={colors.stops[1]} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={colors.track}
                    style={{ strokeOpacity: 0.3 }}
                />

                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    stroke={`url(#${colors.id})`}
                    className="transition-all duration-700 ease-out"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset
                    }}
                />
            </svg>

            {/* Center text if size allows (optional context logic can go here) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* No text here, we render outside for more control in GoalCard */}
            </div>
        </div>
    )
}
