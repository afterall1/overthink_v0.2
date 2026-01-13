'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Sparkles, Zap, RefreshCw,
    CheckCircle2, AlertCircle, Heart,
    Salad, Dumbbell
} from 'lucide-react'
import { clsx } from 'clsx'
import type { AIGeneratedQuest } from '@/lib/ai/healthCouncil'

// =====================================================
// Types
// =====================================================

interface AIQuestGeneratorModalProps {
    isOpen: boolean
    onClose: () => void
    goalId: string
    goalTitle: string
    categorySlug: string | null
    onQuestsSaved: () => void
}

interface GeneratedQuestDisplay extends AIGeneratedQuest {
    selected: boolean
}

// =====================================================
// Constants
// =====================================================

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    nutrition: <Salad className="w-4 h-4" />,
    exercise: <Dumbbell className="w-4 h-4" />,
    habit: <Sparkles className="w-4 h-4" />,
    tracking: <CheckCircle2 className="w-4 h-4" />,
    recovery: <Heart className="w-4 h-4" />
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
    nutrition: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    exercise: { bg: 'bg-blue-50', text: 'text-blue-600' },
    habit: { bg: 'bg-violet-50', text: 'text-violet-600' },
    tracking: { bg: 'bg-amber-50', text: 'text-amber-600' },
    recovery: { bg: 'bg-rose-50', text: 'text-rose-600' }
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
    easy: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Kolay' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Orta' },
    hard: { bg: 'bg-red-50', text: 'text-red-600', label: 'Zor' }
}

// =====================================================
// Component
// =====================================================

export default function AIQuestGeneratorModal({
    isOpen,
    onClose,
    goalId,
    goalTitle,
    onQuestsSaved
}: AIQuestGeneratorModalProps) {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [quests, setQuests] = useState<GeneratedQuestDisplay[]>([])
    const [nutritionPlan, setNutritionPlan] = useState<{
        daily_calorie_target: number
        protein_grams: number
        carbs_grams: number
        fat_grams: number
        meal_suggestions: string[]
    } | null>(null)
    const [motivationalTip, setMotivationalTip] = useState<string | null>(null)
    const [warnings, setWarnings] = useState<string[]>([])
    const [hasGenerated, setHasGenerated] = useState(false)

    // Generate quests using AI
    const handleGenerate = useCallback(async () => {
        setIsGenerating(true)
        setError(null)

        try {
            const { generatePersonalizedQuests } = await import('@/actions/aiHealthQuests')
            const result = await generatePersonalizedQuests(goalId)

            if (result.success && result.quests && result.quests.length > 0) {
                setQuests(result.quests.map(q => ({ ...q, selected: true })))
                setNutritionPlan(result.nutrition_plan || null)
                setMotivationalTip(result.motivational_tip || null)
                setWarnings(result.warnings || [])
                setHasGenerated(true)
            } else {
                setError(result.error || 'AI görevleri oluşturulamadı')
            }
        } catch (err) {
            console.error('[AIQuestGeneratorModal] Generate error:', err)
            setError('AI servisi geçici olarak kullanılamıyor')
        } finally {
            setIsGenerating(false)
        }
    }, [goalId])

    // Toggle quest selection
    const toggleQuest = useCallback((index: number) => {
        setQuests(prev => prev.map((q, i) =>
            i === index ? { ...q, selected: !q.selected } : q
        ))
    }, [])

    // Save selected quests
    const handleSave = useCallback(async () => {
        const selectedQuests = quests.filter(q => q.selected)
        if (selectedQuests.length === 0) {
            setError('En az bir görev seçmelisiniz')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const { saveAIGeneratedQuests } = await import('@/actions/aiHealthQuests')
            const result = await saveAIGeneratedQuests(
                selectedQuests.map(({ selected: _, ...q }) => q),
                goalId
            )

            if (result.success) {
                onQuestsSaved()
                onClose()
            } else {
                setError(result.error || 'Görevler kaydedilemedi')
            }
        } catch (err) {
            console.error('[AIQuestGeneratorModal] Save error:', err)
            setError('Görevler kaydedilirken hata oluştu')
        } finally {
            setIsSaving(false)
        }
    }, [quests, goalId, onQuestsSaved, onClose])

    // Calculate totals
    const selectedCount = quests.filter(q => q.selected).length
    const totalXP = quests.filter(q => q.selected).reduce((sum, q) => sum + q.xp_reward, 0)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                                 md:w-full md:max-w-lg z-50 max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-violet-500/10 
                                      border border-white/60 overflow-hidden flex flex-col max-h-full">

                            {/* Header */}
                            <div className="flex-none p-5 border-b border-slate-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 
                                                      flex items-center justify-center shadow-lg shadow-violet-500/30">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">AI Görev Üretici</h2>
                                            <p className="text-xs text-slate-400 truncate max-w-[200px]">
                                                {goalTitle}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {/* Initial State - Generate Button */}
                                {!hasGenerated && !isGenerating && (
                                    <div className="text-center py-8">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 
                                                      flex items-center justify-center">
                                            <Sparkles className="w-10 h-10 text-violet-600" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-2">
                                            Sağlık AI&apos;dan Görev Al
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
                                            Sağlık profilinize ve hedefinize özel kişiselleştirilmiş günlük görevler oluşturun.
                                        </p>
                                        <button
                                            onClick={handleGenerate}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl 
                                                     bg-gradient-to-r from-violet-600 to-purple-600 text-white 
                                                     font-bold shadow-lg shadow-violet-500/30 
                                                     hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            AI ile Görev Üret
                                        </button>
                                    </div>
                                )}

                                {/* Loading State */}
                                {isGenerating && (
                                    <div className="py-8">
                                        <div className="flex flex-col items-center justify-center gap-4">
                                            <div className="w-12 h-12 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                            <p className="text-sm text-violet-700 font-medium">
                                                AI konseyi görevleri hazırlıyor...
                                            </p>
                                        </div>
                                        {/* Skeleton Cards */}
                                        <div className="space-y-3 mt-6">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="p-4 rounded-xl bg-slate-50 animate-pulse">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200" />
                                                        <div className="flex-1 space-y-2">
                                                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                                                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {error && (
                                    <div className="p-4 rounded-2xl bg-red-50 border border-red-200 mb-4">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertCircle className="w-5 h-5" />
                                            <p className="text-sm font-medium">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Generated Quests */}
                                {hasGenerated && quests.length > 0 && (
                                    <div className="space-y-4">
                                        {/* Motivational Tip */}
                                        {motivationalTip && (
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                                                <p className="text-sm text-amber-800">
                                                    💡 <strong>İpucu:</strong> {motivationalTip}
                                                </p>
                                            </div>
                                        )}

                                        {/* Warnings */}
                                        {warnings.length > 0 && (
                                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                                                {warnings.map((warning, i) => (
                                                    <p key={i} className="text-sm text-rose-700">
                                                        ⚠️ {warning}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {/* Nutrition Plan Summary */}
                                        {nutritionPlan && (
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                                                <h4 className="text-sm font-bold text-emerald-800 mb-2">
                                                    📊 Günlük Beslenme Planı
                                                </h4>
                                                <div className="grid grid-cols-4 gap-2">
                                                    <div className="text-center p-2 bg-white/60 rounded-xl">
                                                        <p className="text-xs text-slate-500">Kalori</p>
                                                        <p className="font-bold text-emerald-700">{nutritionPlan.daily_calorie_target}</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-white/60 rounded-xl">
                                                        <p className="text-xs text-slate-500">Protein</p>
                                                        <p className="font-bold text-blue-700">{nutritionPlan.protein_grams}g</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-white/60 rounded-xl">
                                                        <p className="text-xs text-slate-500">Karb</p>
                                                        <p className="font-bold text-amber-700">{nutritionPlan.carbs_grams}g</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-white/60 rounded-xl">
                                                        <p className="text-xs text-slate-500">Yağ</p>
                                                        <p className="font-bold text-rose-700">{nutritionPlan.fat_grams}g</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quest Selection Header */}
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-700">
                                                Görevleri Seç ({selectedCount}/{quests.length})
                                            </h4>
                                            <button
                                                onClick={handleGenerate}
                                                disabled={isGenerating}
                                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
                                            >
                                                <RefreshCw className={clsx("w-3 h-3", isGenerating && "animate-spin")} />
                                                Yeniden Üret
                                            </button>
                                        </div>

                                        {/* Quest Cards */}
                                        <div className="space-y-2">
                                            {quests.map((quest, index) => {
                                                const catStyle = CATEGORY_COLORS[quest.category] || CATEGORY_COLORS.habit
                                                const diffStyle = DIFFICULTY_COLORS[quest.difficulty] || DIFFICULTY_COLORS.medium

                                                return (
                                                    <motion.button
                                                        key={index}
                                                        onClick={() => toggleQuest(index)}
                                                        whileTap={{ scale: 0.98 }}
                                                        className={clsx(
                                                            "w-full p-4 rounded-xl border text-left transition-all",
                                                            quest.selected
                                                                ? "bg-violet-50/50 border-violet-300 ring-2 ring-violet-400/30"
                                                                : "bg-slate-50/50 border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Checkbox */}
                                                            <div className={clsx(
                                                                "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                                                quest.selected
                                                                    ? "bg-violet-500"
                                                                    : "bg-slate-200"
                                                            )}>
                                                                {quest.selected && (
                                                                    <CheckCircle2 className="w-4 h-4 text-white" />
                                                                )}
                                                            </div>

                                                            {/* Content */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-xl">{quest.emoji}</span>
                                                                    <h5 className="font-semibold text-slate-800 truncate">
                                                                        {quest.title}
                                                                    </h5>
                                                                </div>
                                                                <p className="text-sm text-slate-500 mb-2 line-clamp-2">
                                                                    {quest.description}
                                                                </p>

                                                                {/* Badges */}
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <span className={clsx(
                                                                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                                                        catStyle.bg, catStyle.text
                                                                    )}>
                                                                        {CATEGORY_ICONS[quest.category]}
                                                                        {quest.category}
                                                                    </span>
                                                                    <span className={clsx(
                                                                        "px-2 py-0.5 rounded-full text-xs font-medium",
                                                                        diffStyle.bg, diffStyle.text
                                                                    )}>
                                                                        {diffStyle.label}
                                                                    </span>
                                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                                                                        <Zap className="w-3 h-3" />
                                                                        {quest.xp_reward} XP
                                                                    </span>
                                                                </div>

                                                                {/* Scientific Rationale */}
                                                                {quest.scientific_rationale && (
                                                                    <p className="text-xs text-slate-400 mt-2 italic">
                                                                        💡 {quest.scientific_rationale}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Show when quests are generated */}
                            {hasGenerated && quests.length > 0 && (
                                <div className="flex-none p-5 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm text-slate-500">
                                            <span className="font-bold text-violet-600">{selectedCount}</span> görev seçildi
                                        </p>
                                        <p className="text-sm font-bold text-amber-600">
                                            +{totalXP} XP
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving || selectedCount === 0}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl 
                                                 bg-gradient-to-r from-emerald-600 to-teal-600 text-white 
                                                 font-bold shadow-lg shadow-emerald-500/30 
                                                 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all
                                                 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Kaydediliyor...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-5 h-5" />
                                                Görevleri Kaydet
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
