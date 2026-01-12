'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConfettiPiece {
    id: number
    x: number
    delay: number
    duration: number
    color: string
    size: number
    rotation: number
}

interface ConfettiCelebrationProps {
    trigger: boolean
    onComplete?: () => void
    variant?: 'milestone' | 'streak' | 'completion' | 'progress'
    intensity?: 'light' | 'medium' | 'heavy'
}

const COLORS = {
    milestone: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#7C3AED', '#6D28D9'],
    streak: ['#F97316', '#FB923C', '#FDBA74', '#EA580C', '#C2410C'],
    completion: ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857', '#FCD34D', '#FBBF24'],
    progress: ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8']
}

const PIECE_COUNTS = {
    light: 20,
    medium: 40,
    heavy: 60
}

/**
 * ConfettiCelebration - CSS-only confetti animation
 * Triggers dopamine release on goal milestones/completions
 * No external dependencies - pure CSS animations
 */
export default function ConfettiCelebration({
    trigger,
    onComplete,
    variant = 'milestone',
    intensity = 'medium'
}: ConfettiCelebrationProps) {
    const [pieces, setPieces] = useState<ConfettiPiece[]>([])
    const [isActive, setIsActive] = useState(false)

    const generatePieces = useCallback(() => {
        const colors = COLORS[variant]
        const count = PIECE_COUNTS[intensity]

        const newPieces: ConfettiPiece[] = []
        for (let i = 0; i < count; i++) {
            newPieces.push({
                id: i,
                x: Math.random() * 100, // Percentage across screen
                delay: Math.random() * 0.3,
                duration: 1.5 + Math.random() * 1.5,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 8,
                rotation: Math.random() * 360
            })
        }
        return newPieces
    }, [variant, intensity])

    useEffect(() => {
        if (trigger && !isActive) {
            setIsActive(true)
            setPieces(generatePieces())

            // Cleanup after animation
            const timer = setTimeout(() => {
                setIsActive(false)
                setPieces([])
                onComplete?.()
            }, 3000)

            return () => clearTimeout(timer)
        }
    }, [trigger, isActive, generatePieces, onComplete])

    if (!isActive || pieces.length === 0) return null

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
            <AnimatePresence>
                {pieces.map((piece) => (
                    <motion.div
                        key={piece.id}
                        initial={{
                            x: `${piece.x}vw`,
                            y: '-10vh',
                            rotate: 0,
                            scale: 0
                        }}
                        animate={{
                            y: '110vh',
                            rotate: piece.rotation + 720,
                            scale: [0, 1, 1, 0.8, 0]
                        }}
                        transition={{
                            duration: piece.duration,
                            delay: piece.delay,
                            ease: [0.25, 0.46, 0.45, 0.94]
                        }}
                        style={{
                            position: 'absolute',
                            width: piece.size,
                            height: piece.size,
                            backgroundColor: piece.color,
                            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                            boxShadow: `0 0 ${piece.size / 2}px ${piece.color}40`
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Center burst flash for extra dopamine */}
            {variant === 'completion' && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.5, 2] }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 blur-3xl" />
                </motion.div>
            )}
        </div>
    )
}

/**
 * Hook for easy confetti triggering
 */
export function useConfetti() {
    const [shouldTrigger, setShouldTrigger] = useState(false)

    const fire = useCallback((variant?: ConfettiCelebrationProps['variant']) => {
        setShouldTrigger(true)
        // Reset after a frame to allow re-triggering
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setShouldTrigger(false)
            })
        })
    }, [])

    return { shouldTrigger, fire }
}
