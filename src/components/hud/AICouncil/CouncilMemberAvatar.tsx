'use client'

import { useState } from 'react'

interface CouncilMemberAvatarProps {
    emoji: string
    name: string
    color: string
    isActive: boolean
}

/**
 * Individual council member avatar with tooltip
 */
export default function CouncilMemberAvatar({
    emoji,
    name,
    color,
    isActive
}: CouncilMemberAvatarProps) {
    const [showTooltip, setShowTooltip] = useState(false)

    return (
        <div className="relative flex-shrink-0">
            <button
                className={`council-avatar ${isActive ? 'active' : ''}`}
                style={{
                    borderColor: isActive ? color : 'transparent',
                    boxShadow: isActive ? `0 0 16px ${color}50` : 'none'
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                aria-label={name}
            >
                <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
                    {emoji}
                </span>
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-10"
                    style={{ backgroundColor: color }}
                >
                    {name}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
                        style={{ backgroundColor: color }}
                    />
                </div>
            )}
        </div>
    )
}
