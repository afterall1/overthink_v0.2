'use client'

// =====================================================
// Safety Warning Banner Component
// Displays health safety warnings and adjustments to users
// =====================================================

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Shield, Info, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { useState } from 'react'
import type { SafetyWarning, SafetyWarningType } from '@/lib/healthCalculator'

// =====================================================
// Types
// =====================================================

interface SafetyWarningBannerProps {
    warnings: SafetyWarning[]
    adjustedCalories: number
    originalCalories: number
    adjustedDeficit: number
    originalDeficit: number
    weeklyWeightChange: number
    estimatedDuration?: number
    onAcknowledge?: () => void
    className?: string
}

// =====================================================
// Warning Type Styles
// =====================================================

const WARNING_STYLES: Record<SafetyWarningType, {
    bgColor: string
    borderColor: string
    iconColor: string
    icon: typeof AlertTriangle
}> = {
    critical: {
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        iconColor: 'text-red-400',
        icon: AlertTriangle
    },
    warning: {
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        iconColor: 'text-amber-400',
        icon: Shield
    },
    info: {
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
        iconColor: 'text-blue-400',
        icon: Info
    }
}

// =====================================================
// Component
// =====================================================

export function SafetyWarningBanner({
    warnings,
    adjustedCalories,
    originalCalories,
    adjustedDeficit,
    originalDeficit,
    weeklyWeightChange,
    estimatedDuration,
    onAcknowledge,
    className = ''
}: SafetyWarningBannerProps) {
    const [isExpanded, setIsExpanded] = useState(true)
    const [acknowledged, setAcknowledged] = useState(false)

    // Don't render if no warnings
    if (warnings.length === 0) return null

    // Get highest severity warning
    const highestSeverity = warnings.some(w => w.type === 'critical') ? 'critical' :
        warnings.some(w => w.type === 'warning') ? 'warning' : 'info'

    const wasAdjusted = originalCalories !== adjustedCalories
    const primaryStyle = WARNING_STYLES[highestSeverity]
    const PrimaryIcon = primaryStyle.icon

    const handleAcknowledge = () => {
        setAcknowledged(true)
        onAcknowledge?.()
    }

    return (
        <AnimatePresence>
            {!acknowledged && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`rounded-2xl border ${primaryStyle.borderColor} ${primaryStyle.bgColor} overflow-hidden ${className}`}
                >
                    {/* Header */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="w-full p-4 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${primaryStyle.bgColor}`}>
                                <PrimaryIcon className={`w-5 h-5 ${primaryStyle.iconColor}`} />
                            </div>
                            <div className="text-left">
                                <h3 className="font-semibold text-white">
                                    {highestSeverity === 'critical' ? 'Sağlığınız İçin Ayarlama Yapıldı' :
                                        highestSeverity === 'warning' ? 'Dikkat Edilmesi Gerekenler' :
                                            'Bilgilendirme'}
                                </h3>
                                <p className="text-xs text-white/60">
                                    {warnings.length} uyarı • {wasAdjusted ? 'Hedef ayarlandı' : 'İncelemeniz önerilir'}
                                </p>
                            </div>
                        </div>
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-white/40" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-white/40" />
                        )}
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                        {isExpanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-4">
                                    {/* Adjustment Summary */}
                                    {wasAdjusted && (
                                        <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                            <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                                                <Heart className="w-4 h-4 text-emerald-400" />
                                                <span>Yeni Güvenli Plan</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 text-sm">
                                                <div className="space-y-1">
                                                    <span className="text-white/50">Günlük Kalori</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="line-through text-white/30">{originalCalories}</span>
                                                        <span className="text-emerald-400 font-semibold">{adjustedCalories} kcal</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-white/50">Günlük Açık</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="line-through text-white/30">{Math.abs(originalDeficit)}</span>
                                                        <span className="text-emerald-400 font-semibold">{Math.abs(adjustedDeficit)} kcal</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <span className="text-white/50">Haftalık Kayıp</span>
                                                    <span className="text-white font-medium">{Math.abs(weeklyWeightChange).toFixed(2)} kg</span>
                                                </div>

                                                {estimatedDuration && (
                                                    <div className="space-y-1">
                                                        <span className="text-white/50">Tahmini Süre</span>
                                                        <span className="text-white font-medium">{estimatedDuration} gün</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Individual Warnings */}
                                    <div className="space-y-2">
                                        {warnings.map((warning, index) => {
                                            const style = WARNING_STYLES[warning.type]
                                            const Icon = style.icon

                                            return (
                                                <div
                                                    key={warning.code + index}
                                                    className={`p-3 rounded-xl border ${style.borderColor} ${style.bgColor}`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium text-white">{warning.title}</p>
                                                            <p className="text-xs text-white/70">{warning.message}</p>
                                                            <p className="text-xs text-white/50">{warning.explanation}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* Acknowledge Button */}
                                    <button
                                        onClick={handleAcknowledge}
                                        className="w-full py-3 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium text-white transition-colors"
                                    >
                                        Anladım, Devam Et
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

// =====================================================
// Compact Version for inline use
// =====================================================

interface SafetyBadgeProps {
    type: SafetyWarningType
    message: string
    className?: string
}

export function SafetyBadge({ type, message, className = '' }: SafetyBadgeProps) {
    const style = WARNING_STYLES[type]
    const Icon = style.icon

    return (
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${style.bgColor} ${style.borderColor} border ${className}`}>
            <Icon className={`w-3 h-3 ${style.iconColor}`} />
            <span className="text-white/80">{message}</span>
        </div>
    )
}

export default SafetyWarningBanner
