'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle,
    Sparkles,
    Link2,
    X,
    ArrowRight,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { analyzeGoalSynergy, type SynergyAnalysisResult } from '@/lib/ai'

// =====================================================
// Types
// =====================================================

interface SynergyWarningModalProps {
    isOpen: boolean
    onClose: () => void
    onContinue: () => void
    goalSlug: string
    goalTitle: string
    userId: string
}

// =====================================================
// Synergy Type Styling
// =====================================================

const synergyStyles = {
    SYNERGISTIC: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        icon: Sparkles,
        iconColor: 'text-emerald-500',
        label: 'Güçlü Sinerji',
        description: 'Bu hedefler birbirini destekliyor!'
    },
    COMPLEMENTARY: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        icon: Link2,
        iconColor: 'text-blue-500',
        label: 'Tamamlayıcı',
        description: 'Bazı görevleri paylaşabilirsiniz'
    },
    PARALLEL: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        icon: ArrowRight,
        iconColor: 'text-gray-400',
        label: 'Bağımsız',
        description: 'Ayrı görevler gerektirecek'
    },
    CONFLICTING: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        label: 'Çatışıyor!',
        description: 'Bu hedefler birbiriyle çelişiyor'
    }
}

// =====================================================
// Component
// =====================================================

export default function SynergyWarningModal({
    isOpen,
    onClose,
    onContinue,
    goalSlug,
    goalTitle,
    userId
}: SynergyWarningModalProps) {
    const [analysis, setAnalysis] = useState<SynergyAnalysisResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch synergy analysis when modal opens
    useEffect(() => {
        if (!isOpen || !goalSlug || !userId) return

        const fetchAnalysis = async () => {
            setLoading(true)
            setError(null)
            try {
                const result = await analyzeGoalSynergy(goalSlug, goalTitle, userId)
                setAnalysis(result)
            } catch (err) {
                console.error('[SynergyModal] Analysis error:', err)
                setError('Sinerji analizi yapılamadı')
            } finally {
                setLoading(false)
            }
        }

        fetchAnalysis()
    }, [isOpen, goalSlug, goalTitle, userId])

    // Don't show if no existing goals or no synergy data
    const hasRelevantInfo = analysis && analysis.existingGoals.length > 0
    const hasConflicts = analysis?.summary?.conflictingCount && analysis.summary.conflictingCount > 0
    const hasSynergies = analysis?.summary?.synergisticCount && analysis.summary.synergisticCount > 0

    // Skip modal if loading takes too long or analysis fails
    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                    className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`px-6 py-4 ${hasConflicts ? 'bg-red-500' : hasSynergies ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {hasConflicts ? (
                                    <AlertTriangle className="w-6 h-6 text-white" />
                                ) : hasSynergies ? (
                                    <Sparkles className="w-6 h-6 text-white" />
                                ) : (
                                    <Link2 className="w-6 h-6 text-white" />
                                )}
                                <h3 className="text-lg font-semibold text-white">
                                    {hasConflicts ? 'Dikkat: Çatışan Hedefler' : hasSynergies ? 'Sinerji Fırsatı!' : 'Hedef Analizi'}
                                </h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-full hover:bg-white/20 transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-8 space-y-3">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-10 h-10 border-3 border-blue-200 border-t-blue-500 rounded-full"
                                />
                                <p className="text-gray-500 text-sm">Mevcut hedeflerinizle karşılaştırılıyor...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-6">
                                <p className="text-gray-500">{error}</p>
                                <button
                                    onClick={onContinue}
                                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
                                >
                                    Devam Et
                                </button>
                            </div>
                        ) : hasRelevantInfo ? (
                            <>
                                {/* New Goal */}
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-500 mb-1">Yeni Hedef</p>
                                    <p className="font-medium text-gray-900">{goalTitle}</p>
                                </div>

                                {/* Score Summary */}
                                {analysis?.summary && (
                                    <div className="flex items-center gap-4 py-2">
                                        <div className="flex-1 text-center">
                                            <div className="text-2xl font-bold text-emerald-600">
                                                {analysis.summary.synergisticCount}
                                            </div>
                                            <div className="text-xs text-gray-500">Sinerjik</div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {analysis.summary.complementaryCount}
                                            </div>
                                            <div className="text-xs text-gray-500">Tamamlayıcı</div>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="text-2xl font-bold text-red-600">
                                                {analysis.summary.conflictingCount}
                                            </div>
                                            <div className="text-xs text-gray-500">Çatışan</div>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Goals List */}
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-gray-700">
                                        Mevcut Hedefleriniz ({analysis?.existingGoals.length})
                                    </p>
                                    {analysis?.existingGoals.map((goal) => {
                                        const style = synergyStyles[goal.synergy]
                                        const IconComponent = style.icon
                                        return (
                                            <div
                                                key={goal.id}
                                                className={`flex items-center gap-3 p-3 rounded-xl ${style.bg} ${style.border} border`}
                                            >
                                                <IconComponent className={`w-5 h-5 ${style.iconColor}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium truncate ${style.text}`}>
                                                        {goal.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {goal.relationship?.description}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
                                                    {style.label}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Conflict Warning */}
                                {hasConflicts && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-red-700">Dikkat!</p>
                                                <p className="text-sm text-red-600 mt-1">
                                                    Bu hedef mevcut hedeflerinizle çatışıyor olabilir.
                                                    Aynı anda her ikisini de takip etmek zor olabilir.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Synergy Benefit */}
                                {hasSynergies && !hasConflicts && (
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <div className="flex items-start gap-3">
                                            <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-emerald-700">Harika Haber!</p>
                                                <p className="text-sm text-emerald-600 mt-1">
                                                    Bu hedef mevcut hedeflerinizle sinerji oluşturuyor.
                                                    Bazı görevler otomatik olarak birden fazla hedefe katkı sağlayacak!
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <p className="text-gray-700 font-medium">İlk Hedefiniz!</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Henüz aktif hedefiniz yok. Harika bir başlangıç!
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 text-gray-700 bg-white border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                        >
                            İptal
                        </button>
                        <button
                            onClick={onContinue}
                            className={`flex-1 py-2.5 px-4 text-white rounded-xl font-medium transition-colors ${hasConflicts
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                        >
                            {hasConflicts ? 'Yine de Devam Et' : 'Devam Et'}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
