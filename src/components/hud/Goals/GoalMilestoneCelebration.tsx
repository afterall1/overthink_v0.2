'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Sparkles, Target, ArrowUp, Zap } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

// =====================================================
// Types
// =====================================================

export interface GoalMilestoneCelebrationProps {
    isVisible: boolean
    milestoneTitle: string
    goalTitle: string
    goalProgress?: number // 0-100
    xpEarned?: number
    milestoneNumber?: number
    totalMilestones?: number
    onComplete: () => void
}

interface StarParticle {
    id: number
    x: number
    y: number
    size: number
    delay: number
    duration: number
}

// =====================================================
// Constants
// =====================================================

const CELEBRATION_DURATION = 3000 // ms
const STAR_COUNT = 12

// =====================================================
// Helper Functions
// =====================================================

function generateStars(): StarParticle[] {
    return Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60, // 20-80%
        y: 20 + Math.random() * 60, // 20-80%
        size: 16 + Math.random() * 24,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 0.5
    }))
}

// =====================================================
// Sub-Components
// =====================================================

function StarAnimation({ star }: { star: StarParticle }) {
    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: `${star.x}%`, top: `${star.y}%` }}
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{
                scale: [0, 1.5, 1, 0],
                opacity: [0, 1, 1, 0],
                rotate: [0, 180, 360]
            }}
            transition={{
                duration: star.duration,
                delay: star.delay,
                ease: 'easeOut'
            }}
        >
            <Star
                className="text-yellow-400 fill-yellow-300 drop-shadow-lg"
                style={{ width: star.size, height: star.size }}
            />
        </motion.div>
    )
}

function TrophyBadge({ milestoneNumber, totalMilestones }: { milestoneNumber?: number; totalMilestones?: number }) {
    return (
        <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 12, delay: 0.2 }}
            className="relative"
        >
            {/* Glow rings */}
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 blur-3xl opacity-40"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-300 to-yellow-300 blur-xl opacity-60"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />

            {/* Main trophy */}
            <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500
                           flex items-center justify-center shadow-2xl shadow-amber-500/50
                           border-4 border-yellow-300/50">
                <Trophy className="w-16 h-16 text-white drop-shadow-lg" />
            </div>

            {/* Milestone badge */}
            {milestoneNumber && totalMilestones && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full
                               bg-gradient-to-r from-violet-500 to-indigo-600
                               text-white text-sm font-bold shadow-lg"
                >
                    {milestoneNumber}/{totalMilestones}
                </motion.div>
            )}
        </motion.div>
    )
}

function ProgressRing({ progress }: { progress: number }) {
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (progress / 100) * circumference

    return (
        <motion.svg
            width="120"
            height="120"
            viewBox="0 0 100 100"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
            style={{ transform: 'rotate(-90deg)' }}
        >
            {/* Background ring */}
            <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="4"
            />
            {/* Progress ring */}
            <motion.circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#progressGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
                strokeDasharray={circumference}
            />
            <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
            </defs>
        </motion.svg>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function GoalMilestoneCelebration({
    isVisible,
    milestoneTitle,
    goalTitle,
    goalProgress = 0,
    xpEarned = 50,
    milestoneNumber,
    totalMilestones,
    onComplete
}: GoalMilestoneCelebrationProps) {
    const [stars, setStars] = useState<StarParticle[]>([])

    // Generate stars when celebration starts
    useEffect(() => {
        if (isVisible) {
            setStars(generateStars())
        }
    }, [isVisible])

    // Auto-complete after duration
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onComplete()
            }, CELEBRATION_DURATION)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onComplete])

    // Handle click to dismiss early
    const handleDismiss = useCallback(() => {
        onComplete()
    }, [onComplete])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto"
                    onClick={handleDismiss}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* Dark overlay with blur */}
                    <motion.div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Star particles */}
                    {stars.map((star) => (
                        <StarAnimation key={star.id} star={star} />
                    ))}

                    {/* Main content card */}
                    <motion.div
                        className="relative z-10 flex flex-col items-center gap-4 p-8 mx-4"
                        initial={{ scale: 0.8, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: -20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 15 }}
                    >
                        {/* Trophy with progress ring */}
                        <div className="relative">
                            <ProgressRing progress={goalProgress} />
                            <TrophyBadge
                                milestoneNumber={milestoneNumber}
                                totalMilestones={totalMilestones}
                            />
                        </div>

                        {/* Title section */}
                        <motion.div
                            className="text-center space-y-2 mt-4"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="flex items-center justify-center gap-2 text-amber-400">
                                <Sparkles className="w-5 h-5" />
                                <span className="text-sm font-semibold uppercase tracking-wider">
                                    Milestone Tamamlandı!
                                </span>
                                <Sparkles className="w-5 h-5" />
                            </div>

                            <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                                {milestoneTitle}
                            </h2>

                            <div className="flex items-center justify-center gap-2 text-white/70">
                                <Target className="w-4 h-4" />
                                <span className="text-sm">{goalTitle}</span>
                            </div>
                        </motion.div>

                        {/* XP Badge */}
                        {xpEarned > 0 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.5, type: 'spring' }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full
                                           bg-gradient-to-r from-violet-500 to-purple-600
                                           shadow-xl shadow-violet-500/40 border border-white/30"
                            >
                                <Zap className="w-5 h-5 text-yellow-300" />
                                <span className="text-white font-bold text-lg">+{xpEarned} XP</span>
                            </motion.div>
                        )}

                        {/* Progress indicator */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-center gap-2 text-white/60 text-sm"
                        >
                            <ArrowUp className="w-4 h-4 text-emerald-400" />
                            <span>Hedef İlerlemesi: {Math.round(goalProgress)}%</span>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
