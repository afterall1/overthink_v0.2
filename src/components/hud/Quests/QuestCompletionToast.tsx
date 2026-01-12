'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check, Star, Flame, Undo2, X } from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import { useState, useEffect, useCallback } from 'react'

// =====================================================
// Types
// =====================================================

export interface QuestCompletionToastProps {
    isVisible: boolean
    questTitle: string
    xpEarned: number
    streakCount?: number
    streakBonus?: number
    onUndo?: () => Promise<void>
    onDismiss: () => void
    autoHideDelay?: number
}

// =====================================================
// Component
// =====================================================

export default function QuestCompletionToast({
    isVisible,
    questTitle,
    xpEarned,
    streakCount = 0,
    streakBonus = 0,
    onUndo,
    onDismiss,
    autoHideDelay = 4000
}: QuestCompletionToastProps) {
    const [isUndoing, setIsUndoing] = useState(false)
    const [progress, setProgress] = useState(100)

    // Auto-dismiss timer with progress bar
    useEffect(() => {
        if (!isVisible) {
            setProgress(100)
            return
        }

        const startTime = Date.now()
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            const remaining = Math.max(0, 100 - (elapsed / autoHideDelay) * 100)
            setProgress(remaining)

            if (remaining <= 0) {
                clearInterval(interval)
                onDismiss()
            }
        }, 50)

        return () => clearInterval(interval)
    }, [isVisible, autoHideDelay, onDismiss])

    const handleUndo = useCallback(async () => {
        if (!onUndo || isUndoing) return
        setIsUndoing(true)
        try {
            await onUndo()
            onDismiss()
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                throw error
            }
        } finally {
            setIsUndoing(false)
        }
    }, [onUndo, onDismiss, isUndoing])

    const totalXp = xpEarned + streakBonus

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] 
                               w-[90%] max-w-md"
                >
                    <div className={twMerge(
                        "relative overflow-hidden rounded-2xl",
                        "bg-gradient-to-r from-emerald-500 to-green-500",
                        "shadow-2xl shadow-emerald-500/30",
                        "border border-emerald-400/50"
                    )}>
                        {/* Auto-dismiss Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                            <motion.div
                                initial={{ scaleX: 1 }}
                                animate={{ scaleX: progress / 100 }}
                                style={{ transformOrigin: 'left' }}
                                className="h-full bg-white/60"
                            />
                        </div>

                        {/* Content */}
                        <div className="p-4 pt-5">
                            <div className="flex items-start gap-3">
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
                                    className="flex-none w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm
                                               flex items-center justify-center"
                                >
                                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                                </motion.div>

                                {/* Text Content */}
                                <div className="flex-1 min-w-0">
                                    <motion.h3
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15 }}
                                        className="font-bold text-white text-lg"
                                    >
                                        Quest Tamamlandı! ✨
                                    </motion.h3>
                                    <motion.p
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-white/80 text-sm truncate"
                                    >
                                        {questTitle}
                                    </motion.p>
                                </div>

                                {/* Close Button */}
                                <motion.button
                                    onClick={onDismiss}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex-none p-1.5 rounded-lg bg-white/10 hover:bg-white/20 
                                               transition-colors"
                                >
                                    <X className="w-4 h-4 text-white/80" />
                                </motion.button>
                            </div>

                            {/* XP Breakdown */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="mt-4 flex items-center gap-3"
                            >
                                {/* Base XP */}
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm">
                                    <Star className="w-4 h-4 text-yellow-300 fill-current" />
                                    <span className="font-bold text-white">+{xpEarned} XP</span>
                                </div>

                                {/* Streak Bonus */}
                                {streakCount > 0 && streakBonus > 0 && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.35 }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/30 backdrop-blur-sm"
                                    >
                                        <Flame className="w-4 h-4 text-orange-300 fill-current animate-pulse" />
                                        <span className="font-bold text-white">+{streakBonus} Streak</span>
                                    </motion.div>
                                )}

                                {/* Streak Fire Icon */}
                                {streakCount >= 3 && (
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            rotate: [0, 5, -5, 0]
                                        }}
                                        transition={{ duration: 0.5, repeat: 2 }}
                                        className="flex items-center gap-1 text-orange-300"
                                    >
                                        <Flame className="w-5 h-5 fill-current" />
                                        <span className="font-bold text-sm">{streakCount}</span>
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Action Buttons */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-4 flex items-center justify-between"
                            >
                                {/* Undo Button */}
                                {onUndo && (
                                    <motion.button
                                        onClick={handleUndo}
                                        disabled={isUndoing}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl 
                                                   bg-white/10 hover:bg-white/20 transition-colors
                                                   text-white/80 text-sm font-medium
                                                   disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Undo2 className={twMerge(
                                            "w-4 h-4",
                                            isUndoing && "animate-spin"
                                        )} />
                                        {isUndoing ? 'Geri alınıyor...' : 'Geri Al'}
                                    </motion.button>
                                )}

                                {/* Total XP Badge */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.5 }}
                                    className="px-4 py-2 rounded-xl bg-white text-emerald-600 
                                               font-bold shadow-lg"
                                >
                                    Toplam: +{totalXp} XP
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Celebration Particles */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: '50%',
                                        y: '50%',
                                        scale: 0,
                                        opacity: 1
                                    }}
                                    animate={{
                                        x: `${Math.random() * 100}%`,
                                        y: `${Math.random() * 100}%`,
                                        scale: [0, 1, 0],
                                        opacity: [1, 1, 0]
                                    }}
                                    transition={{
                                        duration: 1 + Math.random() * 0.5,
                                        delay: 0.2 + i * 0.05,
                                        ease: 'easeOut'
                                    }}
                                    className="absolute w-2 h-2 rounded-full bg-yellow-300"
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
