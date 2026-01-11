interface ProgressRingProps {
    progress: number // 0-100
    size?: number
    strokeWidth?: number
    className?: string
    color?: 'emerald' | 'blue' | 'violet' | 'amber'
}

const colorMap = {
    emerald: {
        track: 'stroke-emerald-100',
        fill: 'stroke-emerald-500',
        glow: 'drop-shadow-[0_0_6px_rgba(16,185,129,0.5)]'
    },
    blue: {
        track: 'stroke-blue-100',
        fill: 'stroke-blue-500',
        glow: 'drop-shadow-[0_0_6px_rgba(59,130,246,0.5)]'
    },
    violet: {
        track: 'stroke-violet-100',
        fill: 'stroke-violet-500',
        glow: 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]'
    },
    amber: {
        track: 'stroke-amber-100',
        fill: 'stroke-amber-500',
        glow: 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]'
    }
}

export default function ProgressRing({
    progress,
    size = 48,
    strokeWidth = 4,
    className = '',
    color = 'violet'
}: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const clampedProgress = Math.min(100, Math.max(0, progress))
    const offset = circumference - (clampedProgress / 100) * circumference

    const colors = colorMap[color]

    return (
        <div className={`relative ${className}`} style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className={`transform -rotate-90 ${clampedProgress > 0 ? colors.glow : ''}`}
            >
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    className={colors.track}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    className={`${colors.fill} transition-all duration-700 ease-out`}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset
                    }}
                />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-slate-700">
                    {Math.round(clampedProgress)}%
                </span>
            </div>
        </div>
    )
}
