'use client'

import { motion } from 'framer-motion'
import { Flame, Snowflake } from 'lucide-react'
import { clsx } from 'clsx'
import type { StreakStatus } from '@/lib/streakEngine'

interface StreakBadgeProps {
    currentStreak: number
    longestStreak: number
    status: StreakStatus
    size?: 'sm' | 'md' | 'lg'
    showLongest?: boolean
    className?: string
}

export default function StreakBadge({
    currentStreak,
    longestStreak,
    status,
    size = 'md',
    showLongest = false,
    className
}: StreakBadgeProps) {
    const isActive = status === 'thriving' || status === 'building' || status === 'starting'
    const isAtRisk = status === 'at_risk'
    const isBroken = status === 'broken' || status === 'inactive'

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 gap-1',
            icon: 'w-3.5 h-3.5',
            text: 'text-xs',
            subtext: 'text-[10px]'
        },
        md: {
            container: 'px-3 py-1.5 gap-1.5',
            icon: 'w-4 h-4',
            text: 'text-sm',
            subtext: 'text-xs'
        },
        lg: {
            container: 'px-4 py-2 gap-2',
            icon: 'w-5 h-5',
            text: 'text-base',
            subtext: 'text-sm'
        }
    }

    const classes = sizeClasses[size]

    // Flame animation variants
    const flameVariants = {
        idle: {
            scale: [1, 1.1, 1],
            rotate: [-3, 3, -3],
            transition: {
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        },
        atRisk: {
            scale: [1, 0.9, 1],
            opacity: [1, 0.5, 1],
            transition: {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        }
    }

    return (
        <div
            className={clsx(
                'inline-flex items-center rounded-full font-bold transition-all duration-300',
                classes.container,
                {
                    // Thriving - Hot gradient with glow
                    'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30':
                        status === 'thriving',
                    // Building - Warm colors
                    'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20':
                        status === 'building',
                    // Starting - Soft warm
                    'bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 shadow-sm':
                        status === 'starting',
                    // At Risk - Pulsing warning
                    'bg-gradient-to-r from-amber-500/80 to-orange-500/80 text-white animate-pulse':
                        status === 'at_risk',
                    // Broken/Inactive - Cold
                    'bg-slate-200 text-slate-500':
                        isBroken
                },
                className
            )}
        >
            {/* Icon */}
            {isActive || isAtRisk ? (
                <motion.div
                    variants={flameVariants}
                    animate={isAtRisk ? 'atRisk' : 'idle'}
                >
                    <Flame className={clsx(classes.icon, 'text-current')} />
                </motion.div>
            ) : (
                <Snowflake className={clsx(classes.icon, 'text-current')} />
            )}

            {/* Streak Count */}
            <span className={classes.text}>
                {currentStreak}
            </span>

            {/* Longest Streak (optional) */}
            {showLongest && longestStreak > 0 && (
                <span className={clsx(classes.subtext, 'opacity-70 ml-1')}>
                    / {longestStreak}
                </span>
            )}
        </div>
    )
}
