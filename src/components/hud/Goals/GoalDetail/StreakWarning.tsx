'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Flame, Shield, CheckCircle2 } from 'lucide-react'

// =====================================================
// Types
// =====================================================

type StreakStatus = 'safe' | 'at_risk' | 'broken' | 'frozen'

interface StreakWarningProps {
    streak: number
    status: StreakStatus
    lastActivityDate: string | null
    hasActivityToday: boolean
    onActionClick?: () => void
    /** User's identity statement for personalized messaging */
    identityStatement?: string | null
    /** User's motivation for additional context */
    motivation?: string | null
}

// =====================================================
// Status Configurations
// =====================================================

const STATUS_CONFIG = {
    safe: {
        show: false,
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-teal-500',
        iconColor: 'text-white',
        title: 'Streak Güvende',
        message: ''
    },
    at_risk: {
        show: true,
        icon: AlertTriangle,
        gradient: 'from-amber-500 to-orange-500',
        iconColor: 'text-white',
        title: 'Streak Risk Altında!',
        message: (streak: number, identity?: string | null) => {
            if (identity) {
                return `Sen "${identity}" olan birisin! ${streak} günlük streak'ini korumak için bugün bir görev tamamla.`
            }
            return `Bugün en az 1 görev tamamlamazsan ${streak} günlük streak'in sıfırlanacak!`
        }
    },
    broken: {
        show: true,
        icon: Flame,
        gradient: 'from-red-500 to-rose-600',
        iconColor: 'text-white',
        title: 'Streak Kırıldı',
        message: (_streak: number, _identity?: string | null) => 'Streak\'ini kaybettin ama yeniden başlayabilirsin!'
    },
    frozen: {
        show: true,
        icon: Shield,
        gradient: 'from-blue-500 to-indigo-500',
        iconColor: 'text-white',
        title: 'Streak Donduruldu',
        message: (_streak: number, _identity?: string | null) => 'Streak freeze aktif. Bugün dinlenebilirsin.'
    }
} as const

// =====================================================
// Main Component
// =====================================================

export default function StreakWarning({
    streak,
    status,
    lastActivityDate,
    hasActivityToday,
    onActionClick,
    identityStatement,
    motivation
}: StreakWarningProps) {
    const config = STATUS_CONFIG[status]

    // Don't show if status is safe or has activity today
    if (!config.show || hasActivityToday) {
        return null
    }

    const getMessage = (): string => {
        const msgConfig = config.message
        if (typeof msgConfig === 'function') {
            // Pass identity statement for at_risk personalization
            return msgConfig(streak, identityStatement)
        }
        return msgConfig
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} p-4`}
            >
                {/* Animated background pulse for at_risk */}
                {status === 'at_risk' && (
                    <motion.div
                        className="absolute inset-0 bg-white/10"
                        animate={{ opacity: [0, 0.2, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    />
                )}

                {/* Content */}
                <div className="relative flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                        animate={status === 'at_risk' ? {
                            scale: [1, 1.1, 1],
                            rotate: [0, -5, 5, 0]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm 
                                   flex items-center justify-center flex-shrink-0"
                    >
                        <config.icon className={`w-6 h-6 ${config.iconColor}`} />
                    </motion.div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-white mb-1">
                            {config.title}
                        </h4>
                        <p className="text-sm text-white/90 leading-relaxed">
                            {getMessage()}
                        </p>

                        {/* Streak Count Badge */}
                        {streak > 0 && status !== 'broken' && (
                            <div className="flex items-center gap-2 mt-2">
                                <Flame className="w-4 h-4 text-white/80" />
                                <span className="text-sm font-bold text-white/90">
                                    {streak} gün streak
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                {onActionClick && status === 'at_risk' && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        onClick={onActionClick}
                        className="mt-4 w-full py-3 rounded-xl bg-white/20 backdrop-blur-sm
                                   text-white font-bold text-sm
                                   hover:bg-white/30 active:scale-[0.98]
                                   transition-all duration-200
                                   flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Şimdi Görev Tamamla
                    </motion.button>
                )}
            </motion.div>
        </AnimatePresence>
    )
}
