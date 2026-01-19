'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star, Flame, Trophy, Zap } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'

// =====================================================
// Types
// =====================================================

export interface QuestCompletionCelebrationProps {
    isVisible: boolean
    xpEarned: number
    questTitle?: string
    streakCount?: number
    streakBonus?: number
    isPerfectDay?: boolean
    onComplete: () => void
}

interface Particle {
    id: number
    x: number
    y: number
    color: string
    size: number
    angle: number
    speed: number
    rotationSpeed: number
    shape: 'circle' | 'star' | 'square'
}

// =====================================================
// Constants
// =====================================================

const CELEBRATION_DURATION = 2500 // ms
const PARTICLE_COUNT = 24
const COLORS = [
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#F97316', // Orange
]

// =====================================================
// Helper Functions
// =====================================================

function generateParticles(): Particle[] {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20, // Start near center
        y: 50 + (Math.random() - 0.5) * 20,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5,
        speed: Math.random() * 150 + 100,
        rotationSpeed: (Math.random() - 0.5) * 720,
        shape: (['circle', 'star', 'square'] as const)[Math.floor(Math.random() * 3)]
    }))
}

// =====================================================
// Sub-Components
// =====================================================

function ConfettiParticle({ particle, index }: { particle: Particle; index: number }) {
    const endX = particle.x + Math.cos(particle.angle) * particle.speed * 0.5
    const endY = particle.y + Math.sin(particle.angle) * particle.speed * 0.5 + 30 // Add gravity

    return (
        <motion.div
            className="absolute pointer-events-none"
            initial={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                scale: 0,
                rotate: 0,
                opacity: 1
            }}
            animate={{
                left: `${endX}%`,
                top: `${endY}%`,
                scale: [0, 1.2, 1, 0.8, 0],
                rotate: particle.rotationSpeed,
                opacity: [1, 1, 1, 0.5, 0]
            }}
            transition={{
                duration: 1.5,
                delay: index * 0.02,
                ease: 'easeOut'
            }}
            style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.shape === 'circle' ? particle.color : 'transparent',
                borderRadius: particle.shape === 'circle' ? '50%' : particle.shape === 'star' ? '0' : '2px',
                ...(particle.shape === 'square' && { backgroundColor: particle.color }),
                ...(particle.shape === 'star' && {
                    width: 0,
                    height: 0,
                    borderLeft: `${particle.size / 2}px solid transparent`,
                    borderRight: `${particle.size / 2}px solid transparent`,
                    borderBottom: `${particle.size}px solid ${particle.color}`
                })
            }}
        />
    )
}

function XPPopup({ xp, delay = 0 }: { xp: number; delay?: number }) {
    return (
        <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1] }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            transition={{ duration: 0.5, delay }}
        >
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-500 
                                rounded-full blur-xl opacity-40 scale-150" />

                {/* Main XP badge */}
                <motion.div
                    className="relative px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 
                               rounded-full shadow-2xl shadow-violet-500/40 border border-white/30"
                    animate={{
                        boxShadow: [
                            '0 0 20px rgba(139, 92, 246, 0.4)',
                            '0 0 40px rgba(139, 92, 246, 0.6)',
                            '0 0 20px rgba(139, 92, 246, 0.4)'
                        ]
                    }}
                    transition={{ duration: 1, repeat: 2 }}
                >
                    <div className="flex items-center gap-2 text-white font-bold text-xl">
                        <Sparkles className="w-5 h-5" />
                        <span>+{xp} XP</span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}

function StreakBadge({ streak, bonus }: { streak: number; bonus: number }) {
    return (
        <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 z-10"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 12 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
        >
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 
                           rounded-full shadow-lg shadow-amber-500/40 border border-white/30">
                <Flame className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">
                    {streak} Günlük Seri! +{bonus} XP
                </span>
            </div>
        </motion.div>
    )
}

function PerfectDayBadge() {
    return (
        <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-24 z-10"
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5, type: 'spring' }}
        >
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 
                           rounded-full shadow-lg shadow-emerald-500/40 border border-white/30">
                <Trophy className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">Mükemmel Gün!</span>
                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            </div>
        </motion.div>
    )
}

function CenterBurst() {
    return (
        <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: [0, 2.5, 3], opacity: [0.8, 0.4, 0] }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        >
            <div className="w-32 h-32 rounded-full bg-gradient-radial from-violet-400/60 via-purple-400/30 to-transparent" />
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function QuestCompletionCelebration({
    isVisible,
    xpEarned,
    streakCount = 0,
    streakBonus = 0,
    isPerfectDay = false,
    onComplete
}: QuestCompletionCelebrationProps) {
    const [particles, setParticles] = useState<Particle[]>([])

    // Generate particles when celebration starts
    useEffect(() => {
        if (isVisible) {
            setParticles(generateParticles())
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
                    className="fixed inset-0 z-50 pointer-events-auto"
                    onClick={handleDismiss}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Semi-transparent overlay */}
                    <motion.div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Celebration container */}
                    <div className="absolute inset-0 overflow-hidden">
                        {/* Center burst effect */}
                        <CenterBurst />

                        {/* Confetti particles */}
                        {particles.map((particle, index) => (
                            <ConfettiParticle
                                key={particle.id}
                                particle={particle}
                                index={index}
                            />
                        ))}

                        {/* XP Popup */}
                        <XPPopup xp={xpEarned} />

                        {/* Streak badge (if applicable) */}
                        {streakCount > 1 && streakBonus > 0 && (
                            <StreakBadge streak={streakCount} bonus={streakBonus} />
                        )}

                        {/* Perfect Day badge */}
                        {isPerfectDay && <PerfectDayBadge />}

                        {/* Sparkle icons floating */}
                        {Array.from({ length: 6 }).map((_, i) => (
                            <motion.div
                                key={`sparkle-${i}`}
                                className="absolute text-yellow-400"
                                initial={{
                                    x: `${30 + Math.random() * 40}%`,
                                    y: `${30 + Math.random() * 40}%`,
                                    scale: 0,
                                    opacity: 0
                                }}
                                animate={{
                                    scale: [0, 1, 0.5, 0],
                                    opacity: [0, 1, 0.8, 0],
                                    rotate: [0, 180]
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.2 + i * 0.1,
                                    ease: 'easeOut'
                                }}
                            >
                                <Zap className="w-6 h-6 fill-yellow-300" />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
