'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronRight, ChevronLeft, Check,
    Target, Heart, Calendar, Flag,
    Lightbulb, Clock, Zap, Star
} from 'lucide-react'
import { clsx } from 'clsx'
import type { GoalPeriod, Category, QuestTemplate, CategorySlug, GoalTemplate } from '@/types/database.types'
import { getGoalTemplates, getGoalTemplateCategories } from '@/actions/goals'
import GoalInsightCard from './GoalInsightCard'
import {
    calculateGoal,
    getCalculationTypeFromTemplateSlug,
    type GoalCalculation
} from '@/lib/goalCalculator'
import { HealthProfileBanner, HealthProfileWizard } from '@/components/hud/Health'
import useHealthProfile from '@/hooks/useHealthProfile'

// =====================================================
// Types
// =====================================================

export interface GoalWizardData {
    // Step 1: Why
    motivation: string
    identity_statement: string

    // Step 2: What
    title: string
    description: string
    target_value: number | undefined
    unit: string
    period: GoalPeriod
    category_id: string

    // Step 3: When
    start_date: string
    end_date: string
    best_time_of_day: 'morning' | 'afternoon' | 'evening' | 'anytime'
    difficulty_level: 'easy' | 'medium' | 'hard' | 'extreme'

    // Goal Template (optional - if selected, auto-populates other fields)
    goal_template_id: string | null

    // Step 4: How (Milestones)
    milestones: Array<{
        title: string
        target_value: number
    }>

    // Step 5: Quests (Daily Tasks)
    selected_quest_template_ids: string[]
}

interface GoalCreationWizardProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: GoalWizardData) => Promise<void>
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]
}

// =====================================================
// Constants
// =====================================================

const STEPS = [
    { id: 1, title: 'Neden?', icon: Heart, description: 'Motivasyonun' },
    { id: 2, title: 'Ne?', icon: Target, description: 'Hedefin' },
    { id: 3, title: 'Ne Zaman?', icon: Calendar, description: 'Zamanlaman' },
    { id: 4, title: 'Nasıl?', icon: Flag, description: 'Ara hedefler' },
    { id: 5, title: 'Görevler', icon: Zap, description: 'Günlük rutinler' }
] as const

const PERIOD_OPTIONS: { value: GoalPeriod; label: string; emoji: string; color: string }[] = [
    { value: 'daily', label: 'Günlük', emoji: '🌅', color: '#10B981' },
    { value: 'weekly', label: 'Haftalık', emoji: '📅', color: '#3B82F6' },
    { value: 'monthly', label: 'Aylık', emoji: '🌙', color: '#8B5CF6' },
    { value: 'yearly', label: 'Yıllık', emoji: '🎯', color: '#F59E0B' }
]

const TIME_OF_DAY_OPTIONS = [
    { value: 'morning', label: 'Sabah', emoji: '🌅', time: '06:00-12:00' },
    { value: 'afternoon', label: 'Öğleden Sonra', emoji: '☀️', time: '12:00-18:00' },
    { value: 'evening', label: 'Akşam', emoji: '🌙', time: '18:00-24:00' },
    { value: 'anytime', label: 'Esnek', emoji: '⏰', time: 'Her zaman' }
] as const

const DIFFICULTY_OPTIONS = [
    { value: 'easy', label: 'Kolay', emoji: '🌱', description: 'Küçük adımlarla başla' },
    { value: 'medium', label: 'Orta', emoji: '💪', description: 'Dengeli zorluk' },
    { value: 'hard', label: 'Zor', emoji: '🔥', description: 'Kendini zorla' },
    { value: 'extreme', label: 'Ekstrem', emoji: '⚡', description: 'Sınırları aş' }
] as const

const IDENTITY_TEMPLATES = [
    'Sağlıklı yaşayan biri',
    'Disiplinli çalışan biri',
    'Sürekli gelişen biri',
    'Hedeflerine ulaşan biri'
]

// =====================================================
// Component
// =====================================================

export default function GoalCreationWizard({
    isOpen,
    onClose,
    onSubmit,
    categories
}: GoalCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

    const today = new Date().toISOString().split('T')[0]

    const [formData, setFormData] = useState<GoalWizardData>({
        motivation: '',
        identity_statement: '',
        title: '',
        description: '',
        target_value: undefined,
        unit: '',
        period: 'weekly',
        category_id: '',
        start_date: today,
        end_date: '',
        best_time_of_day: 'anytime',
        difficulty_level: 'medium',
        goal_template_id: null,
        milestones: [],
        selected_quest_template_ids: []
    })

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1)
            setFormData({
                motivation: '',
                identity_statement: '',
                title: '',
                description: '',
                target_value: undefined,
                unit: '',
                period: 'weekly',
                category_id: '',
                start_date: today,
                end_date: '',
                best_time_of_day: 'anytime',
                difficulty_level: 'medium',
                goal_template_id: null,
                milestones: [],
                selected_quest_template_ids: []
            })
            setErrors({})
        }
    }, [isOpen, today])

    // Auto-generate milestones when target_value changes
    useEffect(() => {
        if (formData.target_value && formData.target_value > 0 && formData.milestones.length === 0) {
            const target = formData.target_value
            const unit = formData.unit || 'birim'
            setFormData(prev => ({
                ...prev,
                milestones: [
                    { title: `%25 - ${Math.round(target * 0.25)} ${unit}`, target_value: Math.round(target * 0.25) },
                    { title: `%50 - ${Math.round(target * 0.50)} ${unit}`, target_value: Math.round(target * 0.50) },
                    { title: `%75 - ${Math.round(target * 0.75)} ${unit}`, target_value: Math.round(target * 0.75) }
                ]
            }))
        }
    }, [formData.target_value, formData.unit, formData.milestones.length])

    const updateField = <K extends keyof GoalWizardData>(
        field: K,
        value: GoalWizardData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const validateStep = (step: number): boolean => {
        const newErrors: Record<string, string> = {}

        switch (step) {
            case 1:
                // Motivation is optional but encouraged
                break
            case 2:
                if (!formData.title.trim()) {
                    newErrors.title = 'Hedef başlığı gerekli'
                }
                break
            case 3:
                if (!formData.start_date) {
                    newErrors.start_date = 'Başlangıç tarihi gerekli'
                }
                break
            case 4:
                // Milestones are optional
                break
            case 5:
                // Quest selection is optional but encouraged
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 5))
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
            onClose()
        } catch (error) {
            console.error('Failed to create goal:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        onClose()
    }

    // Progress percentage
    const progress = (currentStep / 5) * 100

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[5%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                                 md:w-full md:max-w-lg z-50 max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 
                                      border border-white/60 overflow-hidden flex flex-col max-h-full">

                            {/* Header */}
                            <div className="flex-none p-5 border-b border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                                      flex items-center justify-center shadow-lg shadow-violet-500/30">
                                            <Target className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800">Yeni Hedef</h2>
                                            <p className="text-xs text-slate-400">Adım {currentStep}/5</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                    >
                                        <X className="w-5 h-5 text-slate-400" />
                                    </button>
                                </div>

                                {/* Step Indicators */}
                                <div className="flex items-center gap-2">
                                    {STEPS.map((step, index) => (
                                        <div key={step.id} className="flex-1 flex items-center">
                                            <div
                                                className={clsx(
                                                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all',
                                                    currentStep === step.id
                                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                                                        : currentStep > step.id
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-slate-100 text-slate-400'
                                                )}
                                            >
                                                {currentStep > step.id ? (
                                                    <Check className="w-4 h-4" />
                                                ) : (
                                                    <step.icon className="w-4 h-4" />
                                                )}
                                            </div>
                                            {index < STEPS.length - 1 && (
                                                <div
                                                    className={clsx(
                                                        'flex-1 h-1 mx-1 rounded-full transition-colors',
                                                        currentStep > step.id ? 'bg-emerald-500' : 'bg-slate-100'
                                                    )}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Content - Scrollable */}
                            <div className="flex-1 overflow-y-auto p-5">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {currentStep === 1 && (
                                            <Step1Why
                                                formData={formData}
                                                updateField={updateField}
                                                errors={errors}
                                            />
                                        )}
                                        {currentStep === 2 && (
                                            <Step2What
                                                formData={formData}
                                                updateField={updateField}
                                                errors={errors}
                                                categories={categories}
                                            />
                                        )}
                                        {currentStep === 3 && (
                                            <Step3When
                                                formData={formData}
                                                updateField={updateField}
                                                errors={errors}
                                            />
                                        )}
                                        {currentStep === 4 && (
                                            <Step4How
                                                formData={formData}
                                                updateField={updateField}
                                                errors={errors}
                                            />
                                        )}
                                        {currentStep === 5 && (
                                            <Step5Quests
                                                formData={formData}
                                                updateField={updateField}
                                                errors={errors}
                                            />
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="flex-none p-5 border-t border-slate-100 flex gap-3">
                                {currentStep > 1 && (
                                    <button
                                        onClick={handleBack}
                                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 
                                                 text-slate-600 font-semibold hover:bg-slate-200 transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Geri
                                    </button>
                                )}

                                {currentStep < 5 ? (
                                    <button
                                        onClick={handleNext}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
                                                 bg-gradient-to-r from-violet-600 to-indigo-600 text-white 
                                                 font-bold shadow-lg shadow-violet-500/30 
                                                 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                                    >
                                        Devam Et
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
                                                 bg-gradient-to-r from-emerald-600 to-teal-600 text-white 
                                                 font-bold shadow-lg shadow-emerald-500/30 
                                                 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all
                                                 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <Zap className="w-5 h-5" />
                                                Hedefi ve Görevleri Oluştur
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// =====================================================
// Step Components
// =====================================================

interface StepProps {
    formData: GoalWizardData
    updateField: <K extends keyof GoalWizardData>(field: K, value: GoalWizardData[K]) => void
    errors: Partial<Record<string, string>>
    categories?: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]
}

function Step1Why({ formData, updateField }: StepProps) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 
                              flex items-center justify-center shadow-lg shadow-rose-500/30">
                    <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Bu hedef neden önemli?</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Motivasyonunu tanımla - zor zamanlarda seni ayakta tutacak.
                </p>
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Motivasyonun Nedir?
                </label>
                <textarea
                    value={formData.motivation}
                    onChange={(e) => updateField('motivation', e.target.value)}
                    rows={3}
                    placeholder="Örn: Daha sağlıklı olmak istiyorum çünkü çocuklarımla oynayabilmek istiyorum..."
                    className="ethereal-input resize-none"
                />
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <Star className="w-4 h-4 text-violet-500" />
                    Ben ... olan biriyim
                </label>
                <input
                    type="text"
                    value={formData.identity_statement}
                    onChange={(e) => updateField('identity_statement', e.target.value)}
                    placeholder="Örn: sağlıklı yaşayan"
                    className="ethereal-input"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                    {IDENTITY_TEMPLATES.map((template) => (
                        <button
                            key={template}
                            type="button"
                            onClick={() => updateField('identity_statement', template)}
                            className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 
                                     hover:bg-violet-100 hover:text-violet-700 transition-colors"
                        >
                            {template}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <p className="text-sm text-amber-800">
                    💡 <strong>İpucu:</strong> "Neden" sorusunu cevaplamak, hedefe bağlılığını %42 artırır.
                </p>
            </div>
        </div>
    )
}

function Step2What({ formData, updateField, errors, categories }: StepProps) {
    const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [useCustom, setUseCustom] = useState(false)

    // Health Profile state for food/sport categories
    const { hasProfile, profile, isLoading: isProfileLoading, refresh: refreshProfile } = useHealthProfile()
    const [isHealthWizardOpen, setIsHealthWizardOpen] = useState(false)

    // Health-related categories
    const HEALTH_CATEGORIES = ['food', 'sport']
    const isHealthCategory = selectedCategory !== null && HEALTH_CATEGORIES.includes(selectedCategory)

    // Goal Template kategorileri
    const GOAL_TEMPLATE_CATEGORIES = [
        { slug: 'food', name: 'Beslenme', emoji: '🍎', color: '#10B981' },
        { slug: 'sport', name: 'Spor', emoji: '🏋️', color: '#3B82F6' },
        { slug: 'dev', name: 'Geliştirici', emoji: '💻', color: '#8B5CF6' },
        { slug: 'trade', name: 'Trading', emoji: '📈', color: '#F59E0B' },
        { slug: 'etsy', name: 'Etsy', emoji: '🎨', color: '#EC4899' },
        { slug: 'gaming', name: 'Gaming', emoji: '🎮', color: '#06B6D4' }
    ]

    // Fetch goal templates
    useEffect(() => {
        async function fetchTemplates() {
            setIsLoading(true)
            try {
                const result = await getGoalTemplates(selectedCategory ?? undefined)
                if (result.data) {
                    setGoalTemplates(result.data)
                }
            } catch {
                console.error('Failed to fetch goal templates')
            } finally {
                setIsLoading(false)
            }
        }
        fetchTemplates()
    }, [selectedCategory])

    // Handle template selection
    const handleTemplateSelect = (template: GoalTemplate) => {
        updateField('goal_template_id', template.id)
        updateField('title', template.title)
        updateField('description', template.description ?? '')
        updateField('target_value', template.default_target_value ?? undefined)
        updateField('unit', template.metric_unit)
        updateField('period', template.default_period)
        setUseCustom(false)
    }

    // Switch to custom mode
    const handleSwitchToCustom = () => {
        setUseCustom(true)
        updateField('goal_template_id', null)
    }

    // If custom mode, show manual inputs
    if (useCustom) {
        return (
            <div className="space-y-5">
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800">Özel Hedef Oluştur</h3>
                    <p className="text-sm text-slate-500 mt-1">Net ve ölçülebilir bir hedef belirle.</p>
                    <button
                        type="button"
                        onClick={() => setUseCustom(false)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                        ← Şablonlara geri dön
                    </button>
                </div>

                {/* Title */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                        <Target className="w-4 h-4" />
                        Hedef Başlığı *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Örn: Haftada 3 gün spor yap"
                        className="ethereal-input"
                    />
                    {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                {/* Description */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Açıklama</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        rows={2}
                        placeholder="Detaylar..."
                        className="ethereal-input resize-none"
                    />
                </div>

                {/* Target Value & Unit */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Hedef Değer</label>
                        <input
                            type="number"
                            value={formData.target_value ?? ''}
                            onChange={(e) => updateField('target_value', e.target.value ? Number(e.target.value) : undefined)}
                            min="0"
                            placeholder="Örn: 3"
                            className="ethereal-input"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Birim</label>
                        <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => updateField('unit', e.target.value)}
                            placeholder="gün, saat, km..."
                            className="ethereal-input"
                        />
                    </div>
                </div>

                {/* Period */}
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Periyot</label>
                    <div className="grid grid-cols-4 gap-2">
                        {PERIOD_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateField('period', option.value)}
                                className={clsx(
                                    'p-3 rounded-xl text-center transition-all',
                                    formData.period === option.value
                                        ? 'ring-2 shadow-lg'
                                        : 'bg-slate-50 hover:bg-slate-100'
                                )}
                                style={{
                                    backgroundColor: formData.period === option.value ? `${option.color}15` : undefined,
                                    boxShadow: formData.period === option.value
                                        ? `0 0 0 2px ${option.color}, 0 10px 15px -3px rgba(0,0,0,0.1)`
                                        : undefined,
                                    color: formData.period === option.value ? option.color : undefined
                                }}
                            >
                                <div className="text-xl mb-1">{option.emoji}</div>
                                <div className="text-xs font-medium">{option.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Category */}
                {categories && categories.length > 0 && (
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Kategori</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => updateField('category_id', '')}
                                className={clsx(
                                    'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                    !formData.category_id
                                        ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-400'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                )}
                            >
                                Yok
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => updateField('category_id', cat.id)}
                                    className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                                    style={{
                                        backgroundColor: formData.category_id === cat.id ? cat.color_code : `${cat.color_code}20`,
                                        color: formData.category_id === cat.id ? '#fff' : cat.color_code,
                                        boxShadow: formData.category_id === cat.id ? `0 4px 12px ${cat.color_code}40` : 'none'
                                    }}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Template selection mode
    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Hedef Şablonu Seç</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Hazır şablonlar ile hızlıca başla veya{' '}
                    <button
                        type="button"
                        onClick={handleSwitchToCustom}
                        className="text-blue-600 hover:text-blue-700 underline"
                    >
                        özel hedef oluştur
                    </button>
                </p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
                <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className={clsx(
                        'px-3 py-2 rounded-xl text-sm font-medium transition-all',
                        selectedCategory === null
                            ? 'bg-slate-800 text-white shadow-lg'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                >
                    Tümü
                </button>
                {GOAL_TEMPLATE_CATEGORIES.map((cat) => (
                    <button
                        key={cat.slug}
                        type="button"
                        onClick={() => setSelectedCategory(cat.slug)}
                        className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                        style={{
                            backgroundColor: selectedCategory === cat.slug ? cat.color : `${cat.color}20`,
                            color: selectedCategory === cat.slug ? '#fff' : cat.color
                        }}
                    >
                        {cat.emoji} {cat.name}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : goalTemplates.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <p>Henüz şablon bulunmuyor.</p>
                    <button
                        type="button"
                        onClick={handleSwitchToCustom}
                        className="mt-2 text-blue-600 hover:text-blue-700 underline"
                    >
                        Özel hedef oluştur
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[340px] overflow-y-auto pr-2">
                    {goalTemplates.map((template) => {
                        const isSelected = formData.goal_template_id === template.id
                        const catInfo = GOAL_TEMPLATE_CATEGORIES.find(c => c.slug === template.category_slug)
                        const categoryColor = catInfo?.color ?? '#6B7280'

                        return (
                            <button
                                key={template.id}
                                type="button"
                                onClick={() => handleTemplateSelect(template)}
                                className={clsx(
                                    'p-4 rounded-xl text-left transition-all border-2',
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                                        : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                                )}
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                                        style={{ backgroundColor: `${categoryColor}20` }}
                                    >
                                        {template.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-slate-800 truncate">
                                            {template.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {template.description ?? `${template.default_target_value ?? '?'} ${template.metric_unit} hedefi`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                                            >
                                                {catInfo?.name ?? template.category_slug}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {template.difficulty === 'easy' ? '🌱' : template.difficulty === 'medium' ? '💪' : '🔥'}
                                            </span>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Health Profile Banner - Only for food/sport categories when template is selected */}
            {isHealthCategory && formData.goal_template_id && (
                <HealthProfileBanner
                    hasProfile={hasProfile}
                    isLoading={isProfileLoading}
                    metrics={profile ? {
                        bmr_kcal: profile.bmr_kcal,
                        tdee_kcal: profile.tdee_kcal,
                        target_daily_kcal: profile.target_daily_kcal
                    } : undefined}
                    onSetupProfile={() => setIsHealthWizardOpen(true)}
                />
            )}

            {/* Health Profile Wizard Modal */}
            <HealthProfileWizard
                isOpen={isHealthWizardOpen}
                onClose={() => setIsHealthWizardOpen(false)}
                onComplete={async () => {
                    setIsHealthWizardOpen(false)
                    await refreshProfile()
                }}
            />

            {/* Selected Template Info with Target Value Input */}
            {formData.goal_template_id && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <p className="text-sm text-blue-800 mb-3">
                        ✅ <strong>{formData.title}</strong> seçildi.
                    </p>

                    {/* Target Value Input */}
                    <div className="mt-3 space-y-2">
                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            Hedef Değerini Belirle
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                value={formData.target_value ?? ''}
                                onChange={(e) => updateField('target_value', e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Hedef değer"
                                className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200 
                                         text-slate-800 text-lg font-semibold
                                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300"
                            />
                            <span className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium">
                                {formData.unit}
                            </span>
                        </div>

                        {/* Calculation Preview for calorie-based goals */}
                        {formData.target_value && (formData.unit === '%' || formData.unit === 'kg') && (
                            <div className="mt-3 p-3 rounded-xl bg-white/80 border border-blue-100">
                                <p className="text-xs text-slate-600">
                                    📊 <strong>Hesaplama:</strong>
                                </p>
                                {formData.unit === '%' && (
                                    <p className="text-sm text-teal-700 font-medium mt-1">
                                        %{formData.target_value} yağ azaltma = ~{Math.round(formData.target_value * 0.7 * 7700).toLocaleString()} kcal yakım
                                        <span className="text-xs text-slate-500 block mt-0.5">
                                            (70kg referans, 1kg yağ = 7,700 kcal)
                                        </span>
                                    </p>
                                )}
                                {formData.unit === 'kg' && formData.title?.toLowerCase().includes('kilo') && (
                                    <p className="text-sm text-teal-700 font-medium mt-1">
                                        {formData.target_value} kg = ~{(formData.target_value * 7700).toLocaleString()} kcal açık gerekli
                                        <span className="text-xs text-slate-500 block mt-0.5">
                                            (1kg = 7,700 kcal)
                                        </span>
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

function Step3When({ formData, updateField, errors }: StepProps) {
    const [calculation, setCalculation] = useState<GoalCalculation | null>(null)

    // Recalculate when dates or target changes
    useEffect(() => {
        // Only calculate if we have target value and both dates
        if (formData.target_value && formData.start_date && formData.end_date) {
            try {
                // Determine calculation type from title or template
                let goalType = getCalculationTypeFromTemplateSlug(formData.title.toLowerCase())

                // If title doesn't match, try to infer from unit/category
                if (goalType === 'generic') {
                    const lowerTitle = formData.title.toLowerCase()
                    const lowerUnit = formData.unit.toLowerCase()

                    if (lowerTitle.includes('kilo') || lowerUnit === 'kg') {
                        goalType = lowerTitle.includes('al') ? 'weight_gain' : 'weight_loss'
                    } else if (lowerUnit === 'km' || lowerTitle.includes('koş')) {
                        goalType = 'running_distance'
                    } else if (lowerTitle.includes('antrenman') || lowerTitle.includes('gym')) {
                        goalType = 'strength_training'
                    }
                }

                const calc = calculateGoal({
                    goalType,
                    targetValue: formData.target_value,
                    unit: formData.unit,
                    startDate: formData.start_date,
                    endDate: formData.end_date,
                    categorySlug: formData.category_id
                })
                setCalculation(calc)
            } catch (error) {
                console.error('Calculation error:', error)
                setCalculation(null)
            }
        } else {
            setCalculation(null)
        }
    }, [formData.target_value, formData.unit, formData.title, formData.start_date, formData.end_date, formData.category_id])

    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Zamanlamanı Ayarla</h3>
                <p className="text-sm text-slate-500 mt-1">Ne zaman ve nasıl çalışacaksın?</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        Başlangıç *
                    </label>
                    <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => updateField('start_date', e.target.value)}
                        className="ethereal-input"
                    />
                    {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">Bitiş</label>
                    <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => updateField('end_date', e.target.value)}
                        className="ethereal-input"
                    />
                </div>
            </div>

            {/* Intelligent Calculation Card */}
            {calculation && (
                <GoalInsightCard calculation={calculation} />
            )}

            {/* Info hint when no calculation */}
            {!calculation && formData.target_value && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                        📅 Bitiş tarihi seçtiğinde akıllı hesaplama göreceğsin
                    </p>
                </div>
            )}

            {/* Time of Day */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <Clock className="w-4 h-4" />
                    En İyi Zaman Dilimi
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {TIME_OF_DAY_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('best_time_of_day', option.value)}
                            className={clsx(
                                'p-3 rounded-xl text-left transition-all',
                                formData.best_time_of_day === option.value
                                    ? 'bg-violet-100 ring-2 ring-violet-400 text-violet-700'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{option.emoji}</span>
                                <div>
                                    <div className="text-sm font-medium">{option.label}</div>
                                    <div className="text-xs opacity-70">{option.time}</div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty */}
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <Zap className="w-4 h-4" />
                    Zorluk Seviyesi
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('difficulty_level', option.value)}
                            className={clsx(
                                'p-3 rounded-xl text-center transition-all',
                                formData.difficulty_level === option.value
                                    ? 'bg-violet-100 ring-2 ring-violet-400 text-violet-700'
                                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                            )}
                        >
                            <div className="text-xl mb-1">{option.emoji}</div>
                            <div className="text-xs font-medium">{option.label}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function Step4How({ formData, updateField }: StepProps) {
    const addMilestone = () => {
        updateField('milestones', [
            ...formData.milestones,
            { title: '', target_value: 0 }
        ])
    }

    const updateMilestone = (index: number, field: 'title' | 'target_value', value: string | number) => {
        const updated = [...formData.milestones]
        updated[index] = { ...updated[index], [field]: value }
        updateField('milestones', updated)
    }

    const removeMilestone = (index: number) => {
        updateField('milestones', formData.milestones.filter((_, i) => i !== index))
    }

    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Ara Hedefler</h3>
                <p className="text-sm text-slate-500 mt-1">Büyük hedefi küçük adımlara böl.</p>
            </div>

            <div className="space-y-3">
                {formData.milestones.map((milestone, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 group"
                    >
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                        </div>
                        <input
                            type="text"
                            value={milestone.title}
                            onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                            placeholder="Ara hedef adı"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-700"
                        />
                        <input
                            type="number"
                            value={milestone.target_value || ''}
                            onChange={(e) => updateMilestone(index, 'target_value', Number(e.target.value))}
                            placeholder="Değer"
                            className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm text-center"
                        />
                        <button
                            type="button"
                            onClick={() => removeMilestone(index)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-red-500 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                ))}
            </div>

            <button
                type="button"
                onClick={addMilestone}
                className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 
                         hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all"
            >
                + Ara Hedef Ekle
            </button>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <p className="text-sm text-blue-800">
                    💡 <strong>İpucu:</strong> %25, %50, %75 gibi ara hedefler motivasyonunu artırır.
                </p>
            </div>
        </div>
    )
}

// =====================================================
// Step 5: Quest Selection
// =====================================================

interface Step5QuestsProps extends StepProps {
    // Extended props for quest templates
}

const QUEST_CATEGORIES = [
    { slug: 'trade' as CategorySlug, name: 'Trading', emoji: '📈', color: '#F59E0B' },
    { slug: 'food' as CategorySlug, name: 'Beslenme', emoji: '🍎', color: '#10B981' },
    { slug: 'sport' as CategorySlug, name: 'Spor', emoji: '💪', color: '#EF4444' },
    { slug: 'dev' as CategorySlug, name: 'Yazılım', emoji: '💻', color: '#8B5CF6' },
    { slug: 'etsy' as CategorySlug, name: 'Etsy', emoji: '🎨', color: '#EC4899' },
    { slug: 'gaming' as CategorySlug, name: 'Gaming', emoji: '🎮', color: '#06B6D4' }
]

function Step5Quests({ formData, updateField }: Step5QuestsProps) {
    const [templates, setTemplates] = useState<QuestTemplate[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedCategory, setSelectedCategory] = useState<CategorySlug | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [isGoalSpecific, setIsGoalSpecific] = useState(false)

    // Fetch goal-specific quests when goal_template_id is available
    useEffect(() => {
        const fetchTemplates = async () => {
            setIsLoading(true)
            setIsGoalSpecific(false)

            console.log('[Step5Quests] Starting fetch, goal_template_id:', formData.goal_template_id)

            try {
                const { getQuestTemplates } = await import('@/actions/quests')

                // Priority 1: Fetch quests linked to the selected goal template
                if (formData.goal_template_id) {
                    console.log('[Step5Quests] Fetching goal-specific quests for:', formData.goal_template_id)
                    const result = await getQuestTemplates(undefined, formData.goal_template_id)
                    console.log('[Step5Quests] Goal-specific result:', result.data?.length ?? 0, 'quests found')

                    if (result.data && result.data.length > 0) {
                        setTemplates(result.data)
                        setIsGoalSpecific(true)
                        setIsLoading(false)
                        console.log('[Step5Quests] Using goal-specific quests')
                        return
                    } else {
                        console.warn('[Step5Quests] No goal-specific quests found, falling back to all')
                    }
                }

                // Fallback: If no goal-specific quests, show all (migration not run yet)
                console.log('[Step5Quests] Fetching all quests as fallback')
                const result = await getQuestTemplates()
                console.log('[Step5Quests] Fallback result:', result.data?.length ?? 0, 'quests found')
                if (result.data) {
                    setTemplates(result.data)
                }
            } catch (error) {
                console.error('[Step5Quests] Failed to fetch templates:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTemplates()
    }, [formData.goal_template_id])

    // Filter only applies when showing all quests (not goal-specific)
    const filteredTemplates = templates.filter(t => {
        // When showing goal-specific quests, skip category filter
        const matchesCategory = isGoalSpecific || !selectedCategory || t.category_slug === selectedCategory
        const matchesSearch = !searchQuery ||
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const toggleTemplate = (templateId: string) => {
        const current = formData.selected_quest_template_ids
        if (current.includes(templateId)) {
            updateField('selected_quest_template_ids', current.filter(id => id !== templateId))
        } else {
            updateField('selected_quest_template_ids', [...current, templateId])
        }
    }

    const totalXP = templates
        .filter(t => formData.selected_quest_template_ids.includes(t.id))
        .reduce((sum, t) => sum + t.xp_reward, 0)

    const selectedCount = formData.selected_quest_template_ids.length

    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 
                              flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Günlük Görevlerini Seç</h3>
                <p className="text-sm text-slate-500 mt-1">Bu hedefe ulaşmak için günlük rutinler</p>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Görev ara..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 
                             text-sm text-slate-700 placeholder:text-slate-400
                             focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-300"
                />
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {/* Goal-Specific Indicator */}
            {isGoalSpecific && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                    <p className="text-sm text-emerald-700 font-medium flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        <strong>{formData.title}</strong> hedefine özel görevler gösteriliyor
                    </p>
                </div>
            )}

            {/* Category Filter - Only show when NOT in goal-specific mode */}
            {!isGoalSpecific && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={clsx(
                            'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                            !selectedCategory
                                ? 'bg-slate-800 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                    >
                        Tümü
                    </button>
                    {QUEST_CATEGORIES.map(cat => (
                        <button
                            key={cat.slug}
                            type="button"
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                                selectedCategory === cat.slug
                                    ? 'text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            )}
                            style={{
                                backgroundColor: selectedCategory === cat.slug ? cat.color : undefined
                            }}
                        >
                            {cat.emoji} {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Templates List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <p>Bu kategoride şablon bulunamadı</p>
                    </div>
                ) : (
                    filteredTemplates.map((template, index) => {
                        const isSelected = formData.selected_quest_template_ids.includes(template.id)
                        const isRecommended = index < 3

                        return (
                            <motion.button
                                key={template.id}
                                type="button"
                                onClick={() => toggleTemplate(template.id)}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={clsx(
                                    'w-full p-3 rounded-xl text-left transition-all flex items-center gap-3',
                                    isSelected
                                        ? 'bg-violet-100 ring-2 ring-violet-500'
                                        : 'bg-slate-50 hover:bg-slate-100'
                                )}
                            >
                                <div className={clsx(
                                    'w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0',
                                    isSelected
                                        ? 'bg-violet-600 text-white'
                                        : 'border-2 border-slate-300'
                                )}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                </div>

                                <span className="text-xl flex-shrink-0">{template.emoji}</span>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-700 truncate">
                                            {template.title}
                                        </span>
                                        {isRecommended && (
                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                                ⭐ ÖNERİLEN
                                            </span>
                                        )}
                                    </div>
                                    {template.description && (
                                        <p className="text-xs text-slate-500 truncate">{template.description}</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={clsx(
                                        'px-2 py-0.5 rounded text-xs font-bold',
                                        template.difficulty === 'easy' && 'bg-emerald-100 text-emerald-700',
                                        template.difficulty === 'medium' && 'bg-blue-100 text-blue-700',
                                        template.difficulty === 'hard' && 'bg-red-100 text-red-700'
                                    )}>
                                        {template.difficulty === 'easy' && '🌱'}
                                        {template.difficulty === 'medium' && '💪'}
                                        {template.difficulty === 'hard' && '🔥'}
                                    </span>
                                    {template.contribution_display && (
                                        <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">
                                            {template.contribution_display}
                                        </span>
                                    )}
                                    <span className="text-xs font-bold text-amber-600">
                                        +{template.xp_reward} XP
                                    </span>
                                </div>
                            </motion.button>
                        )
                    })
                )}
            </div>

            {/* Selection Summary */}
            {selectedCount > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-violet-600" />
                            <span className="font-semibold text-violet-800">
                                {selectedCount} görev seçildi
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 font-bold">
                            <Zap className="w-4 h-4" />
                            <span>+{totalXP} XP/gün</span>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Tip */}
            {selectedCount === 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                    <p className="text-sm text-amber-800">
                        💡 <strong>İpucu:</strong> Günlük görevler hedefine ulaşmak için motivasyonunu artırır.
                        En az 1-2 görev seçmeni öneririz.
                    </p>
                </div>
            )}
        </div>
    )
}
