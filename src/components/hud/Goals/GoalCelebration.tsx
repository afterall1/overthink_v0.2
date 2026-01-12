'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Star, Flame, CheckCircle2, X, Share2 } from 'lucide-react'
import { clsx } from 'clsx'

interface GoalCelebrationProps {
    isOpen: boolean
    onClose: () => void
    type: 'milestone' | 'completion' | 'streak'
    title: string
    message: string
    value?: number
    unit?: string
    milestone?: number
    motivation?: string
}

export default function GoalCelebration({
    isOpen,
    onClose,
    type,
    title,
    message,
    value,
    unit,
    milestone,
    motivation
}: GoalCelebrationProps) {
    const [showConfetti, setShowConfetti] = useState(false)

    // Trigger confetti effect
    useEffect(() => {
        if (isOpen) {
            setShowConfetti(true)
            const timer = setTimeout(() => setShowConfetti(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    const getIcon = () => {
        switch (type) {
            case 'completion':
                return Trophy
            case 'streak':
                return Flame
            case 'milestone':
            default:
                return Star
        }
    }

    const getColorScheme = () => {
        switch (type) {
            case 'completion':
                return {
                    primary: '#8B5CF6',
                    secondary: '#A78BFA',
                    glow: 'violet'
                }
            case 'streak':
                return {
                    primary: '#F59E0B',
                    secondary: '#FBBF24',
                    glow: 'amber'
                }
            case 'milestone':
            default:
                return {
                    primary: '#10B981',
                    secondary: '#34D399',
                    glow: 'emerald'
                }
        }
    }

    const Icon = getIcon()
    const colors = getColorScheme()

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md"
                        onClick={onClose}
                    />

                    {/* Confetti Layer */}
                    {showConfetti && (
                        <div className="fixed inset-0 z-[101] pointer-events-none overflow-hidden">
                            {[...Array(50)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: '50vw',
                                        y: '-10vh',
                                        rotate: 0,
                                        scale: Math.random() * 0.5 + 0.5
                                    }}
                                    animate={{
                                        x: `${Math.random() * 100}vw`,
                                        y: '110vh',
                                        rotate: Math.random() * 360,
                                    }}
                                    transition={{
                                        duration: Math.random() * 2 + 2,
                                        delay: Math.random() * 0.5,
                                        ease: 'linear'
                                    }}
                                    className="absolute"
                                    style={{
                                        width: Math.random() * 8 + 4,
                                        height: Math.random() * 8 + 4,
                                        backgroundColor: [
                                            colors.primary,
                                            colors.secondary,
                                            '#FFD700',
                                            '#FF6B6B',
                                            '#4ECDC4',
                                            '#45B7D1'
                                        ][Math.floor(Math.random() * 6)],
                                        borderRadius: Math.random() > 0.5 ? '50%' : '2px'
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[102] max-w-md mx-auto"
                    >
                        <div className="relative bg-white/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/60 overflow-hidden">
                            {/* Glow Effect */}
                            <div
                                className="absolute inset-0 opacity-20 blur-3xl"
                                style={{
                                    background: `radial-gradient(circle at 50% 30%, ${colors.primary}, transparent 70%)`
                                }}
                            />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>

                            {/* Content */}
                            <div className="relative p-8 text-center">
                                {/* Icon with Animation */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="relative mx-auto mb-6"
                                >
                                    {/* Glow rings */}
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 rounded-full"
                                        style={{
                                            background: `radial-gradient(circle, ${colors.primary}40, transparent 70%)`,
                                            width: '120px',
                                            height: '120px',
                                            marginLeft: 'auto',
                                            marginRight: 'auto',
                                            left: 0,
                                            right: 0,
                                            top: '-10px'
                                        }}
                                    />

                                    <div
                                        className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                            boxShadow: `0 10px 40px ${colors.primary}50`
                                        }}
                                    >
                                        <Icon className="w-12 h-12 text-white" />
                                    </div>
                                </motion.div>

                                {/* Title */}
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-2xl font-bold text-slate-800 mb-2"
                                >
                                    {title}
                                </motion.h2>

                                {/* Message */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-slate-600 mb-6"
                                >
                                    {message}
                                </motion.p>

                                {/* Value Display */}
                                {value !== undefined && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="inline-flex items-baseline gap-1 mb-6 px-6 py-3 rounded-2xl bg-slate-100"
                                    >
                                        <span
                                            className="text-4xl font-bold"
                                            style={{ color: colors.primary }}
                                        >
                                            {value}
                                        </span>
                                        {unit && (
                                            <span className="text-lg text-slate-500">{unit}</span>
                                        )}
                                    </motion.div>
                                )}

                                {/* Milestone Badge */}
                                {milestone && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full"
                                        style={{
                                            backgroundColor: `${colors.primary}15`,
                                            color: colors.primary
                                        }}
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        <span className="font-bold">%{milestone} Tamamlandı</span>
                                    </motion.div>
                                )}

                                {/* User's Motivation Quote */}
                                {motivation && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 }}
                                        className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200"
                                    >
                                        <p className="text-sm text-slate-500 italic">
                                            "{motivation}"
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            — Senin motivasyonun
                                        </p>
                                    </motion.div>
                                )}

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.7 }}
                                    className="flex gap-3"
                                >
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                            boxShadow: `0 4px 20px ${colors.primary}40`
                                        }}
                                    >
                                        Harika! 🎉
                                    </button>

                                    <button
                                        onClick={onClose}
                                        className="p-4 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                        title="Paylaş (Yakında)"
                                    >
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
