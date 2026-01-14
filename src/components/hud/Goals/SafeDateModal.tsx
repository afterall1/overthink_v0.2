'use client'

// =====================================================
// Safe Date Modal Component
// Allows users to select a safe plan when calorie deficit exceeds limits
// =====================================================

import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Calendar, Flame, TrendingDown, X, CheckCircle2, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import type { SafeDateSuggestion } from '@/lib/goalCalculator'

// =====================================================
// Types
// =====================================================

interface SafeDateModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectPlan: (planType: 'relaxed' | 'balanced' | 'fast', endDate: string) => void
    suggestions: SafeDateSuggestion[]
    originalEndDate: string
    originalDailyDeficit: number
    targetKg: number
}

// =====================================================
// Constants
// =====================================================

const PLAN_STYLES: Record<'relaxed' | 'balanced' | 'fast', {
    bgColor: string
    borderColor: string
    iconBg: string
    recommended?: boolean
}> = {
    relaxed: {
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        iconBg: 'bg-emerald-100'
    },
    balanced: {
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-300',
        iconBg: 'bg-violet-100',
        recommended: true
    },
    fast: {
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        iconBg: 'bg-amber-100'
    }
}

// =====================================================
// Component
// =====================================================

export default function SafeDateModal({
    isOpen,
    onClose,
    onSelectPlan,
    suggestions,
    originalEndDate,
    originalDailyDeficit,
    targetKg
}: SafeDateModalProps) {
    if (!isOpen || suggestions.length === 0) return null

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const handleSelectPlan = (suggestion: SafeDateSuggestion) => {
        onSelectPlan(suggestion.planType, suggestion.endDate)
        onClose()
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-5 bg-gradient-to-br from-red-50 to-amber-50 border-b border-red-100">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-red-100">
                                    <Shield className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Sağlığınız İçin Önemli
                                    </h2>
                                    <p className="text-sm text-slate-600 mt-0.5">
                                        Kalori açığı güvenli sınırı aşıyor
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Warning Info */}
                        <div className="mt-4 p-3 rounded-xl bg-white/80 border border-red-100">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-slate-700">
                                        Seçtiğiniz tarih <strong className="text-red-600">{originalDailyDeficit.toLocaleString('tr-TR')} kcal/gün</strong> açık gerektiriyor.
                                    </p>
                                    <p className="text-slate-500 mt-1">
                                        Maksimum güvenli açık: <strong>1,000 kcal/gün</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Plan Options */}
                    <div className="p-5 space-y-3">
                        <p className="text-sm text-slate-600 mb-4">
                            <strong>{targetKg} kg</strong> vermek için güvenli bir plan seçin:
                        </p>

                        {suggestions.map((suggestion) => {
                            const style = PLAN_STYLES[suggestion.planType]

                            return (
                                <motion.button
                                    key={suggestion.planType}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleSelectPlan(suggestion)}
                                    className={clsx(
                                        'w-full p-4 rounded-2xl border-2 text-left transition-all',
                                        'hover:shadow-md',
                                        style.bgColor,
                                        style.borderColor,
                                        style.recommended && 'ring-2 ring-violet-400 ring-offset-2'
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx('p-2 rounded-lg', style.iconBg)}>
                                                <span className="text-lg">{suggestion.emoji}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-slate-800">
                                                        {suggestion.label}
                                                    </span>
                                                    {style.recommended && (
                                                        <span className="px-2 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                                                            Önerilen
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {suggestion.description}
                                                </p>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="w-5 h-5 text-slate-300 group-hover:text-violet-500" />
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-3 gap-2">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                                <Calendar className="w-3 h-3" />
                                                <span className="text-xs">Bitiş</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {formatDate(suggestion.endDate)}
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                                <Flame className="w-3 h-3" />
                                                <span className="text-xs">Günlük</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {suggestion.dailyDeficit.toLocaleString('tr-TR')} kcal
                                            </span>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                                                <TrendingDown className="w-3 h-3" />
                                                <span className="text-xs">Haftalık</span>
                                            </div>
                                            <span className="text-sm font-semibold text-slate-700">
                                                {suggestion.weeklyLoss} kg
                                            </span>
                                        </div>
                                    </div>
                                </motion.button>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <p className="text-xs text-slate-500 text-center">
                            💡 Haftada 0.5-1 kg kayıp sürdürülebilir ve sağlıklıdır.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
