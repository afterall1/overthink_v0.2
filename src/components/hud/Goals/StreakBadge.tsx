'use client'

import { motion } from 'framer-motion'
import { Flame, Snowflake, Crown } from 'lucide-react'
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

    // Milestone checks for enhanced animations
    const isLegend = currentStreak >= 30
    const isOnFire = currentStreak >= 7

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1 gap-1',
            icon: 'w-3.5 h-3.5',
            text: 'text-xs',
            subtext: 'text-[10px]',
            crown: 'w-3 h-3'
        },
        md: {
            container: 'px-3 py-1.5 gap-1.5',
            icon: 'w-4 h-4',
            text: 'text-sm',
            subtext: 'text-xs',
            crown: 'w-3.5 h-3.5'
        },
        lg: {
            container: 'px-4 py-2 gap-2',
            icon: 'w-5 h-5',
            text: 'text-base',
            subtext: 'text-sm',
            crown: 'w-4 h-4'
        }
    }

    const classes = sizeClasses[size]

    // Flame animation variants - enhanced for different streak levels
    const flameVariants = {
        idle: {
            scale: [1, 1.05, 1],
            rotate: [-2, 2, -2],
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        },
        // Intense fire for 7+ day streaks - dopamine boost!
        onFire: {
            scale: [1, 1.15, 0.95, 1.1, 1],
            rotate: [-5, 5, -3, 4, -5],
            filter: [
                'drop-shadow(0 0 2px #f97316)',
                'drop-shadow(0 0 8px #f97316)',
                'drop-shadow(0 0 4px #f97316)',
                'drop-shadow(0 0 6px #f97316)',
                'drop-shadow(0 0 2px #f97316)'
            ],
            transition: {
                duration: 0.6,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        },
        // Legend status (30+ days) - majestic fire
        legend: {
            scale: [1, 1.2, 1.05, 1.15, 1],
            rotate: [-8, 8, -5, 6, -8],
            filter: [
                'drop-shadow(0 0 4px #fbbf24) drop-shadow(0 0 8px #f59e0b)',
                'drop-shadow(0 0 12px #fbbf24) drop-shadow(0 0 16px #f59e0b)',
                'drop-shadow(0 0 6px #fbbf24) drop-shadow(0 0 10px #f59e0b)',
                'drop-shadow(0 0 10px #fbbf24) drop-shadow(0 0 14px #f59e0b)',
                'drop-shadow(0 0 4px #fbbf24) drop-shadow(0 0 8px #f59e0b)'
            ],
            transition: {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        },
        // At risk - urgent pulsing to trigger loss aversion
        atRisk: {
            scale: [1, 0.85, 1.1, 0.9, 1],
            opacity: [1, 0.4, 1, 0.6, 1],
            transition: {
                duration: 0.4,
                repeat: Infinity,
                ease: 'easeInOut' as const
            }
        }
    }

    // Determine which animation to use
    const getFlameAnimation = () => {
        if (isAtRisk) return 'atRisk'
        if (isLegend) return 'legend'
        if (isOnFire) return 'onFire'
        return 'idle'
    }

    return (
        <div
            className={clsx(
                'inline-flex items-center rounded-full font-bold transition-all duration-300 relative',
                classes.container,
                {
                    // Legend (30+ days) - Golden legendary glow
                    'bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 text-white shadow-xl shadow-amber-500/50 ring-2 ring-yellow-300/50':
                        isLegend && isActive,
                    // Thriving (7+ days) - Hot gradient with intense glow
                    'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/40':
                        !isLegend && status === 'thriving',
                    // Building - Warm colors
                    'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/20':
                        status === 'building',
                    // Starting - Soft warm
                    'bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-900 shadow-sm':
                        status === 'starting',
                    // At Risk - Urgent pulsing warning (loss aversion trigger)
                    'bg-gradient-to-r from-amber-500/90 to-orange-600/90 text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400/50':
                        status === 'at_risk',
                    // Broken/Inactive - Cold
                    'bg-slate-200 text-slate-500':
                        isBroken
                },
                className
            )}
        >
            {/* Crown for 30+ day legends */}
            {isLegend && isActive && (
                <motion.div
                    initial={{ scale: 0, y: -10 }}
                    animate={{ scale: 1, y: 0 }}
                    className="absolute -top-2 -right-1"
                >
                    <Crown className={clsx(classes.crown, 'text-yellow-300 fill-yellow-300 drop-shadow-lg')} />
                </motion.div>
            )}

            {/* Icon */}
            {isActive || isAtRisk ? (
                <motion.div
                    variants={flameVariants}
                    animate={getFlameAnimation()}
                    className="relative"
                >
                    <Flame className={clsx(classes.icon, 'text-current')} />
                    {/* Extra glow layer for legend status */}
                    {isLegend && (
                        <Flame className={clsx(classes.icon, 'text-yellow-200 absolute inset-0 blur-sm opacity-60')} />
                    )}
                </motion.div>
            ) : (
                <Snowflake className={clsx(classes.icon, 'text-current')} />
            )}

            {/* Streak Count */}
            <span className={clsx(classes.text, isLegend && 'font-black')}>
                {currentStreak}
            </span>

            {/* Longest Streak (optional) */}
            {showLongest && longestStreak > 0 && (
                <span className={clsx(classes.subtext, 'opacity-70 ml-1')}>
                    / {longestStreak}
                </span>
            )}

            {/* At-risk warning indicator */}
            {isAtRisk && (
                <motion.span
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-[10px] ml-0.5"
                >
                    ⚠️
                </motion.span>
            )}
        </div>
    )
}
