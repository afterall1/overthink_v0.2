'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronRight, ChevronLeft, Check,
    Target, Heart, Calendar, Flag,
    Lightbulb, Zap, Star, Timer, ClipboardList
} from 'lucide-react'
import { clsx } from 'clsx'
import type { GoalPeriod, Category, QuestTemplate, CategorySlug, GoalTemplate } from '@/types/database.types'
import { getGoalTemplates, getGoalTemplateCategories } from '@/actions/goals'
import GoalInsightCard from './GoalInsightCard'
import SafeDateModal from './SafeDateModal'
import {
    calculateGoal,
    getCalculationTypeFromTemplateSlug,
    getSafeDateSuggestions,
    type GoalCalculation,
    type SafeDateSuggestion
} from '@/lib/goalCalculator'
import { HealthProfileBanner, HealthProfileWizard } from '@/components/hud/Health'
import useHealthProfile from '@/hooks/useHealthProfile'
import { getGoalContextType, requiresHealthProfile } from '@/lib/goalContextTypes'
import GoalQuestionsStep from './GoalQuestionsStep'
import { goalHasQuestions } from '@/types/goalQuestions.types'


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

    // Goal Template (optional - if selected, auto-populates other fields)
    goal_template_id: string | null

    // Step 2.5: Goal-Specific Questions Data
    goal_specific_data: Record<string, unknown>

    // Step 4: How (Milestones) - Auto-generated
    milestones: Array<{
        title: string
        target_value: number
    }>

    // Step 4: Quests (AI-Generated or Selected)
    selected_quest_template_ids: string[]
    ai_generated_quests?: Array<{
        title: string
        description: string
        category: 'nutrition' | 'exercise' | 'habit' | 'tracking' | 'recovery'
        difficulty: 'easy' | 'medium' | 'hard'
        estimated_minutes: number
        calorie_impact: number
        xp_reward: number
        emoji: string
        scientific_rationale: string
        is_morning?: boolean
        is_evening?: boolean
    }>
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
    { id: 4, title: 'Görevler', icon: Zap, description: 'Günlük rutinler' }
] as const

// Step 4 (Milestones/Ara Hedefler) removed from wizard UI
// Milestones are auto-generated via useEffect when target_value is set

const PERIOD_OPTIONS: { value: GoalPeriod; label: string; emoji: string; color: string }[] = [
    { value: 'daily', label: 'Günlük', emoji: '🌅', color: '#10B981' },
    { value: 'weekly', label: 'Haftalık', emoji: '📅', color: '#3B82F6' },
    { value: 'monthly', label: 'Aylık', emoji: '🌙', color: '#8B5CF6' },
    { value: 'yearly', label: 'Yıllık', emoji: '🎯', color: '#F59E0B' }
]

// TIME_OF_DAY_OPTIONS and DIFFICULTY_OPTIONS removed
// System calculates feasibility via goalCalculator.ts automatically

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
    const [selectedTemplateSlug, setSelectedTemplateSlug] = useState<string | null>(null)
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
        goal_template_id: null,
        goal_specific_data: {},
        milestones: [],
        selected_quest_template_ids: []
    })

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1)
            setSelectedTemplateSlug(null)
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
                goal_template_id: null,
                goal_specific_data: {},
                milestones: [],
                selected_quest_template_ids: []
            })
            setErrors({})
        }
    }, [isOpen, today])

    // Dynamic step calculation - 5 steps when template has questions, 4 otherwise
    const hasQuestionsStep = useMemo(() => {
        return selectedTemplateSlug ? goalHasQuestions(selectedTemplateSlug) : false
    }, [selectedTemplateSlug])

    const totalSteps = hasQuestionsStep ? 5 : 4

    // Dynamic STEPS array based on whether we have a questions step
    const dynamicSteps = useMemo(() => {
        const baseSteps = [
            { id: 1, title: 'Neden?', icon: Heart, description: 'Motivasyonun' },
            { id: 2, title: 'Ne?', icon: Target, description: 'Hedefin' }
        ]

        if (hasQuestionsStep) {
            return [
                ...baseSteps,
                { id: 3, title: 'Sorular', icon: ClipboardList, description: 'Detaylar' },
                { id: 4, title: 'Ne Zaman?', icon: Calendar, description: 'Zamanlaman' },
                { id: 5, title: 'Görevler', icon: Zap, description: 'Günlük rutinler' }
            ]
        }

        return [
            ...baseSteps,
            { id: 3, title: 'Ne Zaman?', icon: Calendar, description: 'Zamanlaman' },
            { id: 4, title: 'Görevler', icon: Zap, description: 'Günlük rutinler' }
        ]
    }, [hasQuestionsStep])

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

        // Templates that require user input for target value
        const REQUIRES_INPUT_SLUGS = [
            'lose_weight', 'gain_muscle', 'lose_fat', 'profit_target',
            'monthly_revenue', 'run_marathon', 'build_strength'
        ]

        switch (step) {
            case 1:
                // Motivation is optional but encouraged
                break
            case 2:
                if (!formData.title.trim()) {
                    newErrors.title = 'Hedef başlığı gerekli'
                }
                // Check if template requires target_value input
                if (formData.goal_template_id) {
                    const titleLower = formData.title.toLowerCase()
                    const requiresInput = REQUIRES_INPUT_SLUGS.some(s => titleLower.includes(s) || s.includes(titleLower))
                    if (requiresInput && !formData.target_value) {
                        newErrors.target_value = 'Bu hedef için değer belirtmelisiniz'
                    }
                }
                break
            case 3:
                // Dynamic: If hasQuestionsStep, this is Questions step, otherwise When step
                if (!hasQuestionsStep) {
                    if (!formData.start_date) {
                        newErrors.start_date = 'Başlangıç tarihi gerekli'
                    }
                }
                // Questions step is optional
                break
            case 4:
                // Dynamic: If hasQuestionsStep, this is When step, otherwise Quests step
                if (hasQuestionsStep) {
                    if (!formData.start_date) {
                        newErrors.start_date = 'Başlangıç tarihi gerekli'
                    }
                }
                // Quests step is optional
                break
            case 5:
                // Only exists when hasQuestionsStep - Quests step, optional
                break
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }


    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, totalSteps))
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

    // Progress percentage (4 steps total now)
    const progress = (currentStep / 4) * 100

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
                                    {dynamicSteps.map((step, index) => (
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
                                            {index < dynamicSteps.length - 1 && (
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
                                                onTemplateSelect={(slug) => setSelectedTemplateSlug(slug)}
                                            />
                                        )}
                                        {/* Dynamic Step 3: Questions (if hasQuestionsStep) or When (if not) */}
                                        {currentStep === 3 && (
                                            hasQuestionsStep ? (
                                                <GoalQuestionsStep
                                                    templateSlug={selectedTemplateSlug ?? undefined}
                                                    data={formData.goal_specific_data}
                                                    onChange={(field, value) => {
                                                        updateField('goal_specific_data', {
                                                            ...formData.goal_specific_data,
                                                            [field]: value
                                                        })
                                                    }}
                                                />
                                            ) : (
                                                <Step3When
                                                    formData={formData}
                                                    updateField={updateField}
                                                    errors={errors}
                                                />
                                            )
                                        )}
                                        {/* Dynamic Step 4: When (if hasQuestionsStep) or Quests (if not) */}
                                        {currentStep === 4 && (
                                            hasQuestionsStep ? (
                                                <Step3When
                                                    formData={formData}
                                                    updateField={updateField}
                                                    errors={errors}
                                                />
                                            ) : (
                                                <Step4AIQuests
                                                    formData={formData}
                                                    updateField={updateField}
                                                    errors={errors}
                                                />
                                            )
                                        )}
                                        {/* Step 5: Only exists when hasQuestionsStep - Quests */}
                                        {currentStep === 5 && hasQuestionsStep && (
                                            <Step4AIQuests
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

                                {currentStep < totalSteps ? (
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
    onTemplateSelect?: (slug: string | null) => void
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

function Step2What({ formData, updateField, errors, categories, onTemplateSelect }: StepProps) {
    const [goalTemplates, setGoalTemplates] = useState<GoalTemplate[]>([])
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [useCustom, setUseCustom] = useState(false)
    const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)
    const [autoPopulated, setAutoPopulated] = useState(false)


    // Health Profile state for food/sport categories
    const { hasProfile, profile, isLoading: isProfileLoading, refresh: refreshProfile } = useHealthProfile()
    const [isHealthWizardOpen, setIsHealthWizardOpen] = useState(false)

    // Health-related categories
    const HEALTH_CATEGORIES = ['food', 'sport']
    const isHealthCategory = selectedCategory !== null && HEALTH_CATEGORIES.includes(selectedCategory)

    // Templates that require user input (target value is personal)
    const REQUIRES_USER_INPUT_SLUGS = [
        'lose_weight', 'gain_muscle', 'lose_fat', 'profit_target',
        'monthly_revenue', 'run_marathon', 'build_strength'
    ]

    // Quick duration options
    const DURATION_OPTIONS = [
        { days: 30, label: '30 gün', emoji: '⚡' },
        { days: 60, label: '60 gün', emoji: '💪' },
        { days: 90, label: '90 gün', emoji: '🔥' },
        { days: 0, label: 'Özel', emoji: '📅' }
    ]


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
            } catch (error) {
                console.error('[Step2] Failed to fetch goal templates:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchTemplates()
    }, [selectedCategory])

    // Handle template selection - now also expands the card
    const handleTemplateSelect = (template: GoalTemplate) => {
        const isAlreadySelected = formData.goal_template_id === template.id

        if (isAlreadySelected) {
            // Toggle expand/collapse if already selected
            setExpandedTemplateId(prev => prev === template.id ? null : template.id)
        } else {
            // Select and expand
            updateField('goal_template_id', template.id)
            updateField('title', template.title)
            updateField('description', template.description ?? '')
            updateField('unit', template.metric_unit)
            updateField('period', (template.default_period ?? 'monthly') as GoalPeriod)
            setExpandedTemplateId(template.id)
            setUseCustom(false)
            setAutoPopulated(false) // Reset auto-populated flag

            // Notify parent of selected template slug for questions step
            if (onTemplateSelect) {
                onTemplateSelect(template.slug ?? null)
            }

            // AUTO-POPULATE from Health Profile for weight-based goals
            const isWeightLossTemplate = template.slug?.includes('lose_weight') || template.slug?.includes('kilo_ver')
            const isWeightGainTemplate = template.slug?.includes('gain_muscle') || template.slug?.includes('kilo_al')

            if (hasProfile && profile && (isWeightLossTemplate || isWeightGainTemplate)) {
                const currentWeight = profile.weight_kg
                const targetWeight = profile.target_weight_kg

                if (currentWeight && targetWeight) {
                    // Calculate weight difference
                    const weightDiff = isWeightLossTemplate
                        ? currentWeight - targetWeight  // Weight to lose
                        : targetWeight - currentWeight  // Weight to gain

                    if (weightDiff > 0) {
                        // Set target value from profile
                        updateField('target_value', weightDiff)

                        // Calculate duration based on goal_pace
                        const weeklyRate = profile.goal_pace === 'slow' ? 0.3
                            : profile.goal_pace === 'aggressive' ? 0.75
                                : 0.5 // default: moderate
                        const estimatedWeeks = Math.ceil(weightDiff / weeklyRate)
                        const estimatedDays = estimatedWeeks * 7

                        // Set end date
                        const startDate = new Date(formData.start_date || new Date())
                        const endDate = new Date(startDate)
                        endDate.setDate(endDate.getDate() + estimatedDays)
                        updateField('end_date', endDate.toISOString().split('T')[0])

                        setAutoPopulated(true)
                    }
                }
            }

            // Fallback: If not auto-populated, use template defaults
            if (!hasProfile || !profile?.target_weight_kg) {
                updateField('target_value', template.default_target_value ?? undefined)

                // Auto-set end date based on template default_duration_days
                if (template.default_duration_days) {
                    const startDate = new Date(formData.start_date || new Date())
                    const endDate = new Date(startDate)
                    endDate.setDate(endDate.getDate() + template.default_duration_days)
                    updateField('end_date', endDate.toISOString().split('T')[0])
                }
            }
        }
    }


    // Set duration from quick chips
    const setDuration = (days: number) => {
        if (days === 0) return // Custom - user picks in Step 3
        const startDate = new Date(formData.start_date || new Date())
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + days)
        updateField('end_date', endDate.toISOString().split('T')[0])
    }

    // Calculate days between dates
    const getDurationDays = (): number => {
        if (!formData.start_date || !formData.end_date) return 0
        const start = new Date(formData.start_date)
        const end = new Date(formData.end_date)
        return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Check if template requires user input
    const templateRequiresInput = (slug: string): boolean => {
        return REQUIRES_USER_INPUT_SLUGS.some(s => slug.includes(s) || s.includes(slug))
    }

    // Switch to custom mode
    const handleSwitchToCustom = () => {
        setUseCustom(true)
        updateField('goal_template_id', null)
        setExpandedTemplateId(null)
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
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {goalTemplates.map((template) => {
                        const isSelected = formData.goal_template_id === template.id
                        const isExpanded = expandedTemplateId === template.id && isSelected
                        const catInfo = GOAL_TEMPLATE_CATEGORIES.find(c => c.slug === template.category_slug)
                        const categoryColor = catInfo?.color ?? '#6B7280'
                        const needsInput = templateRequiresInput(template.slug)
                        const durationDays = getDurationDays()

                        return (
                            <motion.div
                                key={template.id}
                                layout
                                className={clsx(
                                    'rounded-xl transition-all border-2 overflow-hidden',
                                    isSelected
                                        ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                                        : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                                )}
                            >
                                {/* Template Header - Clickable */}
                                <button
                                    type="button"
                                    onClick={() => handleTemplateSelect(template)}
                                    className="w-full p-4 text-left"
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
                                                {needsInput && (
                                                    <span className="text-xs text-amber-600 font-medium">
                                                        ✏️ Kişiselleştir
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {isSelected && (
                                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                            <ChevronRight
                                                className={clsx(
                                                    'w-5 h-5 text-slate-400 transition-transform',
                                                    isExpanded && 'rotate-90'
                                                )}
                                            />
                                        </div>
                                    </div>
                                </button>

                                {/* Expandable Customization Panel */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-blue-100">
                                                {/* CASE 1: Auto-populated from Health Profile - READ-ONLY SUMMARY */}
                                                {autoPopulated && hasProfile && profile && (
                                                    <div className="pt-4 space-y-3">
                                                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                                                                    <Check className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-emerald-800">
                                                                        Sağlık Profilinden Otomatik Ayarlandı
                                                                    </p>
                                                                    <p className="text-xs text-emerald-600">
                                                                        Hedefin zaten tanımlı, ekstra giriş gerekmez.
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Read-only metrics */}
                                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                                <div className="p-3 rounded-lg bg-white/70">
                                                                    <p className="text-xs text-slate-500">Mevcut Kilo</p>
                                                                    <p className="text-lg font-bold text-slate-800">{profile.weight_kg} kg</p>
                                                                </div>
                                                                <div className="p-3 rounded-lg bg-white/70">
                                                                    <p className="text-xs text-slate-500">Hedef Kilo</p>
                                                                    <p className="text-lg font-bold text-emerald-700">{profile.target_weight_kg} kg</p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 p-3 rounded-lg bg-white/70">
                                                                <p className="text-xs text-slate-500">Hedef</p>
                                                                <p className="text-xl font-bold text-teal-700">
                                                                    {formData.target_value} kg {template.slug?.includes('lose') ? 'kayıp' : 'artış'}
                                                                </p>
                                                            </div>

                                                            <div className="mt-3 flex items-center justify-between p-3 rounded-lg bg-white/70">
                                                                <div>
                                                                    <p className="text-xs text-slate-500">Tahmini Süre</p>
                                                                    <p className="text-lg font-bold text-slate-800">{durationDays} gün</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-xs text-slate-500">Hız</p>
                                                                    <p className="text-sm font-medium text-slate-600">
                                                                        {profile.goal_pace === 'slow' ? '🐢 Yavaş (~0.3 kg/hafta)' :
                                                                            profile.goal_pace === 'aggressive' ? '🚀 Hızlı (~0.75 kg/hafta)' :
                                                                                '🐇 Orta (~0.5 kg/hafta)'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Instant Calculation Preview */}
                                                        {formData.target_value && durationDays > 0 && (
                                                            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                                                                <p className="text-xs text-slate-600 mb-1">
                                                                    📊 <strong>Günlük Hesaplama:</strong>
                                                                </p>
                                                                <div className="text-sm text-blue-700 font-medium space-y-1">
                                                                    <p>
                                                                        {formData.target_value} kg × 7,700 kcal = <strong>{(formData.target_value * 7700).toLocaleString()}</strong> kcal toplam açık
                                                                    </p>
                                                                    <p>
                                                                        Günlük: <strong>~{Math.round((formData.target_value * 7700) / durationDays).toLocaleString()}</strong> kcal açık
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 mt-1">
                                                                        {Math.round((formData.target_value * 7700) / durationDays) <= 500 && '✅ Güvenli ve sürdürülebilir'}
                                                                        {Math.round((formData.target_value * 7700) / durationDays) > 500 && Math.round((formData.target_value * 7700) / durationDays) <= 750 && '⚠️ Orta zorluk'}
                                                                        {Math.round((formData.target_value * 7700) / durationDays) > 750 && Math.round((formData.target_value * 7700) / durationDays) <= 1000 && '🔥 Agresif hedef'}
                                                                        {Math.round((formData.target_value * 7700) / durationDays) > 1000 && '❌ Çok agresif - süreyi uzat'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* CASE 2: No profile OR non-weight goal - Show editable inputs */}
                                                {!autoPopulated && (
                                                    <>
                                                        {/* Target Value Input */}
                                                        <div className="pt-4">
                                                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                                                                <Target className="w-4 h-4 text-blue-600" />
                                                                Hedef Değeri {needsInput && <span className="text-red-500">*</span>}
                                                            </label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={formData.target_value ?? ''}
                                                                    onChange={(e) => {
                                                                        updateField('target_value', e.target.value ? Number(e.target.value) : undefined)
                                                                    }}
                                                                    placeholder={needsInput ? 'Bu alan zorunlu' : 'Hedef değer'}
                                                                    className={clsx(
                                                                        'flex-1 px-4 py-2.5 rounded-xl bg-white border text-slate-800 text-lg font-semibold',
                                                                        'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300',
                                                                        needsInput && !formData.target_value ? 'border-amber-300' : 'border-slate-200'
                                                                    )}
                                                                />
                                                                <span className="px-3 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium min-w-[60px] text-center">
                                                                    {formData.unit}
                                                                </span>
                                                            </div>
                                                            {errors.target_value && (
                                                                <p className="text-xs text-red-500 mt-1">{errors.target_value}</p>
                                                            )}
                                                        </div>

                                                        {/* Quick Duration Chips */}
                                                        <div>
                                                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2 mb-2">
                                                                <Timer className="w-4 h-4 text-blue-600" />
                                                                Süre
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                {DURATION_OPTIONS.map((option) => {
                                                                    const isActive = option.days > 0 && durationDays === option.days
                                                                    return (
                                                                        <button
                                                                            key={option.days}
                                                                            type="button"
                                                                            onClick={() => setDuration(option.days)}
                                                                            className={clsx(
                                                                                'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                                                                                isActive
                                                                                    ? 'bg-blue-500 text-white shadow-md'
                                                                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
                                                                            )}
                                                                        >
                                                                            {option.emoji} {option.label}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                            {durationDays > 0 && (
                                                                <p className="text-xs text-slate-500 mt-2">
                                                                    📅 {formData.start_date} → {formData.end_date} ({durationDays} gün)
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Instant Calculation Preview */}
                                                        {formData.target_value && durationDays > 0 && (formData.unit === 'kg' || formData.unit === '%') && (
                                                            <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                                                                <p className="text-xs text-slate-600 mb-1">
                                                                    📊 <strong>Hesaplama:</strong>
                                                                </p>
                                                                {formData.unit === 'kg' && (
                                                                    <div className="text-sm text-teal-700 font-medium space-y-1">
                                                                        <p>
                                                                            {formData.target_value} kg × 7,700 kcal = <strong>{(formData.target_value * 7700).toLocaleString()}</strong> kcal toplam açık
                                                                        </p>
                                                                        <p>
                                                                            Günlük: <strong>~{Math.round((formData.target_value * 7700) / durationDays).toLocaleString()}</strong> kcal açık
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 mt-1">
                                                                            {Math.round((formData.target_value * 7700) / durationDays) <= 500 && '✅ Güvenli ve sürdürülebilir'}
                                                                            {Math.round((formData.target_value * 7700) / durationDays) > 500 && Math.round((formData.target_value * 7700) / durationDays) <= 750 && '⚠️ Orta zorluk'}
                                                                            {Math.round((formData.target_value * 7700) / durationDays) > 750 && Math.round((formData.target_value * 7700) / durationDays) <= 1000 && '🔥 Agresif hedef'}
                                                                            {Math.round((formData.target_value * 7700) / durationDays) > 1000 && '❌ Çok agresif - süreyi uzat'}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                                {formData.unit === '%' && (
                                                                    <p className="text-sm text-teal-700 font-medium">
                                                                        %{formData.target_value} azaltma için ~{Math.round(formData.target_value * 0.7 * 7700).toLocaleString()} kcal yakım gerekli
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Health Profile Banner - Context-aware based on goal type */}
                                                        {HEALTH_CATEGORIES.includes(template.category_slug) && (() => {
                                                            const contextType = getGoalContextType(template.slug)
                                                            const needsCalorieMetrics = requiresHealthProfile(contextType)
                                                            return (
                                                                <HealthProfileBanner
                                                                    displayMode={contextType}
                                                                    hasProfile={hasProfile}
                                                                    isLoading={isProfileLoading}
                                                                    metrics={needsCalorieMetrics && profile ? {
                                                                        bmr_kcal: profile.bmr_kcal,
                                                                        tdee_kcal: profile.tdee_kcal,
                                                                        target_daily_kcal: profile.target_daily_kcal
                                                                    } : undefined}
                                                                    onSetupProfile={() => setIsHealthWizardOpen(true)}
                                                                />
                                                            )
                                                        })()}
                                                    </>
                                                )}
                                            </div>

                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )
                    })}
                </div>
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
        </div>
    )
}


function Step3When({ formData, updateField, errors }: StepProps) {
    const [calculation, setCalculation] = useState<GoalCalculation | null>(null)
    const [showSafeDateModal, setShowSafeDateModal] = useState(false)
    const [safeDateSuggestions, setSafeDateSuggestions] = useState<SafeDateSuggestion[]>([])
    const [pendingEndDate, setPendingEndDate] = useState<string | null>(null)
    const [originalDailyDeficit, setOriginalDailyDeficit] = useState(0)

    // Check if this is a weight loss goal
    const isWeightLossGoal = useMemo(() => {
        const lowerTitle = formData.title.toLowerCase()
        const lowerUnit = formData.unit.toLowerCase()
        return (lowerTitle.includes('kilo') && !lowerTitle.includes('al')) ||
            (lowerUnit === 'kg' && !lowerTitle.includes('al')) ||
            lowerTitle.includes('ver') ||
            lowerTitle.includes('yağ')
    }, [formData.title, formData.unit])

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

                // Check if safety adjustment is needed for weight loss goals
                if (isWeightLossGoal && calc.requiresSafetyAdjustment && calc.dailyTarget > 1000) {
                    // Generate safe date suggestions
                    const suggestions = getSafeDateSuggestions(
                        formData.start_date,
                        formData.target_value
                    )
                    setSafeDateSuggestions(suggestions)
                    setOriginalDailyDeficit(calc.dailyTarget)
                    setPendingEndDate(formData.end_date)
                    setShowSafeDateModal(true)
                }
            } catch (error) {
                console.error('Calculation error:', error)
                setCalculation(null)
            }
        } else {
            setCalculation(null)
        }
    }, [formData.target_value, formData.unit, formData.title, formData.start_date, formData.end_date, formData.category_id, isWeightLossGoal])

    // Handle safe plan selection
    const handleSelectSafePlan = (planType: 'relaxed' | 'balanced' | 'fast', endDate: string) => {
        updateField('end_date', endDate)
        setShowSafeDateModal(false)
        setPendingEndDate(null)
        console.log(`[SafeDate] User selected ${planType} plan → ${endDate}`)
    }

    // Handle modal close without selection (user insists on original date)
    const handleModalClose = () => {
        setShowSafeDateModal(false)
        // Keep the original date but log it
        console.log('[SafeDate] User closed modal without selecting safe plan')
    }

    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Zamanlamanı Ayarla</h3>
                <p className="text-sm text-slate-500 mt-1">Hedefinin başlangıç ve bitiş tarihlerini belirle.</p>
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

            {/* Intelligent Calculation Card - Shows system-calculated feasibility */}
            {calculation && (
                <GoalInsightCard calculation={calculation} />
            )}

            {/* Info hint when no calculation */}
            {!calculation && formData.target_value && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                        📅 Bitiş tarihi seçtiğinde akıllı hesaplama ve zorluk analizi göreceğsin
                    </p>
                </div>
            )}

            {/* System note about automatic calculation */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100">
                <p className="text-xs text-violet-700 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    <span>
                        <strong>Akıllı Sistem:</strong> Zorluk seviyesi ve zaman önerileri hedefine göre otomatik hesaplanır.
                    </span>
                </p>
            </div>

            {/* Safe Date Modal - Shows when deficit exceeds safe limit */}
            <SafeDateModal
                isOpen={showSafeDateModal}
                onClose={handleModalClose}
                onSelectPlan={handleSelectSafePlan}
                suggestions={safeDateSuggestions}
                originalEndDate={pendingEndDate || formData.end_date}
                originalDailyDeficit={originalDailyDeficit}
                targetKg={formData.target_value || 0}
            />
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
// Step 4: AI-Powered Quest Generation
// =====================================================

interface Step4AIQuestsProps extends StepProps {
    // Extended props for AI quest generation
}

// AI-Generated Quest type (matches wizardAI.ts)
interface AIQuest {
    title: string
    description: string
    category: 'nutrition' | 'exercise' | 'habit' | 'tracking' | 'recovery'
    difficulty: 'easy' | 'medium' | 'hard'
    estimated_minutes: number
    calorie_impact: number
    xp_reward: number
    emoji: string
    scientific_rationale: string
    is_morning?: boolean
    is_evening?: boolean
}

function Step4AIQuests({ formData, updateField }: Step4AIQuestsProps) {
    const [aiQuests, setAiQuests] = useState<AIQuest[]>([])
    const [isGenerating, setIsGenerating] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [fallbackUsed, setFallbackUsed] = useState(false)
    const [hasGenerated, setHasGenerated] = useState(false)

    // Get selected category from form data
    const getSelectedCategorySlug = (): string | null => {
        if (!formData.category_id) return null
        // Extract category slug from the selected category
        const titleLower = formData.title.toLowerCase()
        if (titleLower.includes('kilo') || titleLower.includes('beslenme')) return 'food'
        if (titleLower.includes('koş') || titleLower.includes('spor') || titleLower.includes('egzersiz')) return 'sport'
        return null
    }

    // Generate AI quests on mount
    useEffect(() => {
        if (hasGenerated) return

        const generateQuests = async () => {
            setIsGenerating(true)
            setError(null)

            try {
                const { generateWizardQuests } = await import('@/actions/wizardAI')

                const context = {
                    motivation: formData.motivation,
                    identity_statement: formData.identity_statement,
                    goal_title: formData.title,
                    goal_description: formData.description,
                    target_value: formData.target_value ?? null,
                    unit: formData.unit,
                    period: formData.period,
                    category_slug: getSelectedCategorySlug(),
                    goal_template_id: formData.goal_template_id,
                    start_date: formData.start_date,
                    end_date: formData.end_date || null
                }

                const result = await generateWizardQuests(context)

                if (result.success && result.quests && result.quests.length > 0) {
                    setAiQuests(result.quests)
                    updateField('ai_generated_quests', result.quests)
                    setFallbackUsed(result.fallback_used || false)
                } else {
                    setError(result.error || 'Görevler oluşturulamadı')
                    // Show empty state - user can still proceed
                }
            } catch (err) {
                console.error('[Step4AIQuests] Error:', err)
                setError('AI servisi geçici olarak kullanılamıyor')
            } finally {
                setIsGenerating(false)
                setHasGenerated(true)
            }
        }

        generateQuests()
    }, [formData.goal_template_id, formData.title, hasGenerated])

    // Regenerate quests
    const handleRegenerate = () => {
        setHasGenerated(false)
    }

    // Toggle quest selection
    const toggleQuest = (index: number) => {
        const current = [...aiQuests]
        current.splice(index, 1)
        setAiQuests(current)
        updateField('ai_generated_quests', current)
    }

    const totalXP = aiQuests.reduce((sum, q) => sum + q.xp_reward, 0)
    const totalCalorieImpact = aiQuests.reduce((sum, q) => sum + (q.calorie_impact || 0), 0)

    return (
        <div className="space-y-5">
            <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 
                              flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Akıllı Görev Önerileri</h3>
                <p className="text-sm text-slate-500 mt-1">
                    Hedefine özel AI tarafından oluşturuldu
                </p>
            </div>

            {/* Loading State */}
            {isGenerating && (
                <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200">
                        <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            <span className="text-sm text-violet-700 font-medium">
                                AI görevlerini oluşturuyor...
                            </span>
                        </div>
                    </div>
                    {/* Skeleton cards */}
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 animate-pulse">
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
            )}

            {/* Error State */}
            {!isGenerating && error && aiQuests.length === 0 && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={handleRegenerate}
                        className="mt-2 text-sm text-red-600 underline font-medium"
                    >
                        Tekrar dene
                    </button>
                </div>
            )}

            {/* AI Generated Badge */}
            {!isGenerating && aiQuests.length > 0 && (
                <>
                    <div className={clsx(
                        "p-3 rounded-xl border",
                        fallbackUsed
                            ? "bg-amber-50 border-amber-200"
                            : "bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200"
                    )}>
                        <p className={clsx(
                            "text-sm font-medium flex items-center gap-2",
                            fallbackUsed ? "text-amber-700" : "text-violet-700"
                        )}>
                            {fallbackUsed ? (
                                <>
                                    <Star className="w-4 h-4" />
                                    <strong>{formData.title}</strong> için önerilen görevler
                                </>
                            ) : (
                                <>
                                    <Lightbulb className="w-4 h-4" />
                                    <strong>AI</strong> tarafından senin için oluşturuldu
                                </>
                            )}
                        </p>
                    </div>

                    {/* Quest Cards */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                        {aiQuests.map((quest, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="p-3 rounded-xl bg-white border border-slate-200 shadow-sm"
                            >
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">{quest.emoji}</span>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-slate-800">
                                                {quest.title}
                                            </span>
                                            <span className={clsx(
                                                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                                                quest.difficulty === 'easy' && 'bg-emerald-100 text-emerald-700',
                                                quest.difficulty === 'medium' && 'bg-blue-100 text-blue-700',
                                                quest.difficulty === 'hard' && 'bg-red-100 text-red-700'
                                            )}>
                                                {quest.difficulty === 'easy' && '🌱 Kolay'}
                                                {quest.difficulty === 'medium' && '💪 Orta'}
                                                {quest.difficulty === 'hard' && '🔥 Zor'}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                            {quest.description}
                                        </p>

                                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                                            {quest.estimated_minutes > 0 && (
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Timer className="w-3 h-3" />
                                                    {quest.estimated_minutes} dk
                                                </span>
                                            )}
                                            <span className="text-xs font-bold text-amber-600">
                                                +{quest.xp_reward} XP
                                            </span>
                                            {quest.calorie_impact !== 0 && quest.calorie_impact !== undefined && (
                                                <span className={clsx(
                                                    'text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5',
                                                    quest.calorie_impact < 0
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                )}>
                                                    🔥 {quest.calorie_impact > 0 ? '+' : ''}{quest.calorie_impact} kcal
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => toggleQuest(index)}
                                        className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors"
                                        title="Görevi kaldır"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Scientific rationale on hover/tap */}
                                {quest.scientific_rationale && (
                                    <p className="text-[10px] text-violet-600 mt-2 px-2 py-1 bg-violet-50 rounded">
                                        💡 {quest.scientific_rationale}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200"
                    >
                        <div className="flex flex-col gap-3">
                            {/* Top row - Quest count and regenerate */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-violet-600" />
                                    <span className="font-semibold text-violet-800">
                                        {aiQuests.length} görev hazır
                                    </span>
                                </div>
                            </div>

                            {/* Stats row - XP and Calorie Impact */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1 text-amber-600 font-bold">
                                    <Zap className="w-4 h-4" />
                                    <span>+{totalXP} XP/gün</span>
                                </div>
                                {totalCalorieImpact !== 0 && (
                                    <div className={clsx(
                                        'flex items-center gap-1 font-bold px-2 py-1 rounded-lg',
                                        totalCalorieImpact < 0
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-blue-100 text-blue-700'
                                    )}>
                                        🔥
                                        <span>
                                            {totalCalorieImpact > 0 ? '+' : ''}{totalCalorieImpact} kcal/gün
                                        </span>
                                        {totalCalorieImpact < 0 && (
                                            <span className="text-[10px] opacity-75 ml-1">
                                                (açık)
                                            </span>
                                        )}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRegenerate}
                                    className="text-xs text-violet-600 underline ml-2"
                                >
                                    Yenile
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Empty state - can still proceed */}
            {!isGenerating && aiQuests.length === 0 && !error && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                    <p className="text-sm text-slate-600">
                        Hedef oluşturulduktan sonra görevler ekleyebilirsin.
                    </p>
                </div>
            )}
        </div>
    )
}
