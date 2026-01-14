'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronRight, ChevronLeft, Check,
    Scale, Ruler, User, Activity, Heart,
    AlertTriangle, Sparkles, Calculator,
    Target, Zap, Utensils, Dumbbell, Droplets, Moon, SkipForward
} from 'lucide-react'
import { clsx } from 'clsx'
import {
    calculateHealthMetrics,
    calculateAge,
    ACTIVITY_MULTIPLIERS,
    type ActivityLevel,
    type BiologicalSex,
    type PrimaryGoal,
    type GoalPace
} from '@/lib/healthCalculator'
import {
    type UnifiedHealthProfileInput,
    type ProfileSection,
    isSectionComplete,
    getProfileCompleteness,
    type WorkEnvironment,
    type TrainingExperience,
    type TrainingType,
    type GymAccess,
    type MealsPerDay,
    type CooksAtHome,
    type FastFoodFrequency,
    type CoffeeTeaCups,
    type SugarCravingTrigger,
    type SleepQuality
} from '@/types/unifiedHealthProfile.types'

// =====================================================
// Types
// =====================================================

interface UnifiedHealthProfileWizardProps {
    isOpen: boolean
    onClose: () => void
    onComplete?: (profile: UnifiedHealthProfileInput) => void
    initialData?: Partial<UnifiedHealthProfileInput>
    /** If provided, only show sections relevant to this goal */
    goalSlug?: string
}

type FormErrors = Partial<Record<string, string>>

// =====================================================
// Constants
// =====================================================

const STEPS = [
    { id: 1, title: 'Temel', icon: Scale, emoji: '⚖️', section: 'basic' as ProfileSection, required: true },
    { id: 2, title: 'Aktivite', icon: Activity, emoji: '🏃', section: 'activity' as ProfileSection, required: true },
    { id: 3, title: 'Antrenman', icon: Dumbbell, emoji: '🏋️', section: 'training' as ProfileSection, required: false },
    { id: 4, title: 'Beslenme', icon: Utensils, emoji: '🍽️', section: 'nutrition' as ProfileSection, required: false },
    { id: 5, title: 'Su & Şeker', icon: Droplets, emoji: '💧', section: 'hydration_sugar' as ProfileSection, required: false },
    { id: 6, title: 'Uyku', icon: Moon, emoji: '😴', section: 'sleep' as ProfileSection, required: false },
    { id: 7, title: 'Hedef', icon: Target, emoji: '🎯', section: 'goals' as ProfileSection, required: true }
]

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string; emoji: string; desc: string }> = [
    { value: 'sedentary', label: 'Hareketsiz', emoji: '🪑', desc: 'Masa başı iş' },
    { value: 'light', label: 'Az Hareketli', emoji: '🚶', desc: 'Haftada 1-3 gün' },
    { value: 'moderate', label: 'Orta', emoji: '🏃', desc: 'Haftada 3-5 gün' },
    { value: 'very_active', label: 'Çok Aktif', emoji: '🏋️', desc: 'Haftada 6-7 gün' },
    { value: 'extreme', label: 'Profesyonel', emoji: '🏆', desc: 'Günde 2x' }
]

const WORK_ENVIRONMENT_OPTIONS: Array<{ value: WorkEnvironment; label: string; emoji: string }> = [
    { value: 'desk', label: 'Masa Başı', emoji: '💻' },
    { value: 'mixed', label: 'Karışık', emoji: '🔀' },
    { value: 'standing', label: 'Ayakta', emoji: '🧍' },
    { value: 'active', label: 'Fiziksel', emoji: '🏗️' }
]

const TRAINING_EXP_OPTIONS: Array<{ value: TrainingExperience; label: string; emoji: string }> = [
    { value: 'none', label: 'Yok', emoji: '🆕' },
    { value: 'beginner', label: 'Başlangıç', emoji: '🌱' },
    { value: 'intermediate', label: 'Orta', emoji: '💪' },
    { value: 'advanced', label: 'İleri', emoji: '🏆' }
]

const TRAINING_TYPE_OPTIONS: Array<{ value: TrainingType; label: string; emoji: string }> = [
    { value: 'cardio', label: 'Kardiyo', emoji: '❤️' },
    { value: 'weights', label: 'Ağırlık', emoji: '🏋️' },
    { value: 'hiit', label: 'HIIT', emoji: '⚡' },
    { value: 'yoga', label: 'Yoga', emoji: '🧘' },
    { value: 'running', label: 'Koşu', emoji: '🏃' },
    { value: 'swimming', label: 'Yüzme', emoji: '🏊' }
]

const GYM_ACCESS_OPTIONS: Array<{ value: GymAccess; label: string; emoji: string }> = [
    { value: 'full_gym', label: 'Spor Salonu', emoji: '🏢' },
    { value: 'home_gym', label: 'Ev Ekipmanları', emoji: '🏠' },
    { value: 'outdoor', label: 'Açık Hava', emoji: '🌳' },
    { value: 'none', label: 'Ekipman Yok', emoji: '🚫' }
]

const MEALS_OPTIONS: Array<{ value: MealsPerDay; label: string }> = [
    { value: '2', label: '2 öğün' },
    { value: '3', label: '3 öğün' },
    { value: '4', label: '4 öğün' },
    { value: '5+', label: '5+ öğün' }
]

const COOKS_OPTIONS: Array<{ value: CooksAtHome; label: string; emoji: string }> = [
    { value: 'always', label: 'Her zaman', emoji: '👨‍🍳' },
    { value: 'often', label: 'Sık sık', emoji: '🍳' },
    { value: 'sometimes', label: 'Bazen', emoji: '🥡' },
    { value: 'rarely', label: 'Nadiren', emoji: '🍔' }
]

const FAST_FOOD_OPTIONS: Array<{ value: FastFoodFrequency; label: string }> = [
    { value: 'never', label: 'Hiç' },
    { value: 'weekly', label: 'Haftada 1' },
    { value: 'few_times_week', label: 'Haftada 2-3' },
    { value: 'daily', label: 'Her gün' }
]

const COFFEE_OPTIONS: Array<{ value: CoffeeTeaCups; label: string }> = [
    { value: '0', label: '0' },
    { value: '1-2', label: '1-2' },
    { value: '3-4', label: '3-4' },
    { value: '5+', label: '5+' }
]

const SUGAR_TRIGGER_OPTIONS: Array<{ value: SugarCravingTrigger; label: string; emoji: string }> = [
    { value: 'morning_coffee', label: 'Sabah kahvesi', emoji: '☕' },
    { value: 'after_lunch', label: 'Öğle sonrası', emoji: '🌞' },
    { value: 'after_dinner', label: 'Akşam yemeği', emoji: '🍽️' },
    { value: 'late_night', label: 'Gece', emoji: '🌙' },
    { value: 'stress', label: 'Stres', emoji: '😰' }
]

const SLEEP_QUALITY_OPTIONS: Array<{ value: SleepQuality; label: string; emoji: string }> = [
    { value: 'poor', label: 'Kötü', emoji: '😴' },
    { value: 'fair', label: 'Orta', emoji: '😐' },
    { value: 'good', label: 'İyi', emoji: '😊' },
    { value: 'excellent', label: 'Mükemmel', emoji: '🌟' }
]

const HEALTH_CONDITIONS = [
    { value: 'diabetes', label: 'Diyabet', emoji: '🩸' },
    { value: 'hypertension', label: 'Tansiyon', emoji: '❤️‍🩹' },
    { value: 'heart_disease', label: 'Kalp', emoji: '💔' },
    { value: 'thyroid', label: 'Tiroid', emoji: '🦋' },
    { value: 'pcos', label: 'PCOS', emoji: '♀️' }
]

const DIETARY_OPTIONS = [
    { value: 'vegetarian', label: 'Vejetaryen', emoji: '🥬' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'gluten_free', label: 'Glütensiz', emoji: '🌾' },
    { value: 'dairy_free', label: 'Sütsüz', emoji: '🥛' },
    { value: 'halal', label: 'Helal', emoji: '☪️' },
    { value: 'keto', label: 'Keto', emoji: '🥑' }
]

const GOAL_OPTIONS: Array<{ value: PrimaryGoal; label: string; emoji: string }> = [
    { value: 'weight_loss', label: 'Kilo Ver', emoji: '📉' },
    { value: 'weight_gain', label: 'Kilo Al', emoji: '📈' },
    { value: 'maintenance', label: 'Koru', emoji: '⚖️' },
    { value: 'muscle_gain', label: 'Kas Yap', emoji: '💪' },
    { value: 'endurance', label: 'Dayanıklılık', emoji: '🏃' }
]

const PACE_OPTIONS: Array<{ value: GoalPace; label: string; desc: string }> = [
    { value: 'slow', label: 'Yavaş', desc: '~0.3 kg/hafta' },
    { value: 'moderate', label: 'Orta', desc: '~0.5 kg/hafta' },
    { value: 'aggressive', label: 'Hızlı', desc: '~0.75 kg/hafta' }
]

const INITIAL_FORM_DATA: UnifiedHealthProfileInput = {
    weight_kg: 70,
    height_cm: 170,
    birth_date: '',
    biological_sex: 'male',
    activity_level: 'moderate',
    primary_goal: 'maintenance',
    goal_pace: 'moderate',
    sections_completed: [],
    profile_version: 2
}

// =====================================================
// Component
// =====================================================

export default function UnifiedHealthProfileWizard({
    isOpen,
    onClose,
    onComplete,
    initialData
}: UnifiedHealthProfileWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<UnifiedHealthProfileInput>({ ...INITIAL_FORM_DATA, ...initialData })
    const [errors, setErrors] = useState<FormErrors>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState<string | null>(null)

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1)
            setErrors({})
            setSubmitError(null)
            if (initialData) {
                setFormData({ ...INITIAL_FORM_DATA, ...initialData })
            }
        }
    }, [isOpen, initialData])

    // Update field
    const updateField = <K extends keyof UnifiedHealthProfileInput>(field: K, value: UnifiedHealthProfileInput[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Toggle array field
    const toggleArrayField = (field: keyof UnifiedHealthProfileInput, value: string) => {
        setFormData(prev => {
            const current = (prev[field] as string[]) || []
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) }
            }
            return { ...prev, [field]: [...current, value] }
        })
    }

    // Calculated metrics
    const metrics = useMemo(() => {
        if (formData.weight_kg && formData.height_cm && formData.birth_date && formData.biological_sex) {
            return calculateHealthMetrics({
                weight_kg: formData.weight_kg,
                height_cm: formData.height_cm,
                birth_date: formData.birth_date,
                biological_sex: formData.biological_sex as BiologicalSex,
                activity_level: formData.activity_level,
                primary_goal: formData.primary_goal,
                goal_pace: formData.goal_pace,
                target_weight_kg: formData.target_weight_kg
            })
        }
        return null
    }, [formData])

    // Validate step
    const validateStep = (): boolean => {
        const newErrors: FormErrors = {}
        const step = STEPS[currentStep - 1]

        if (step.section === 'basic') {
            if (!formData.weight_kg || formData.weight_kg < 30 || formData.weight_kg > 300) {
                newErrors.weight_kg = 'Geçerli kilo girin (30-300 kg)'
            }
            if (!formData.height_cm || formData.height_cm < 100 || formData.height_cm > 250) {
                newErrors.height_cm = 'Geçerli boy girin (100-250 cm)'
            }
            if (!formData.birth_date) {
                newErrors.birth_date = 'Doğum tarihi gerekli'
            } else {
                const age = calculateAge(formData.birth_date)
                if (age < 13 || age > 120) {
                    newErrors.birth_date = 'Yaş 13-120 arasında olmalı'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Navigation
    const goNext = () => {
        if (validateStep() && currentStep < STEPS.length) {
            // Mark section as completed
            const step = STEPS[currentStep - 1]
            if (!formData.sections_completed?.includes(step.section)) {
                updateField('sections_completed', [...(formData.sections_completed || []), step.section])
            }
            setCurrentStep(prev => prev + 1)
        }
    }

    const goPrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const skipStep = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(prev => prev + 1)
        }
    }

    // Submit
    const handleSubmit = async () => {
        if (!validateStep()) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            // Mark final section as completed
            const step = STEPS[currentStep - 1]
            const finalData: UnifiedHealthProfileInput = {
                ...formData,
                sections_completed: [...(formData.sections_completed || []), step.section],
                profile_version: 2
            }

            onComplete?.(finalData)
            onClose()
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Beklenmeyen hata')
        } finally {
            setIsSubmitting(false)
        }
    }

    const currentStepData = STEPS[currentStep - 1]
    const isOptionalStep = !currentStepData.required
    const completeness = getProfileCompleteness(formData)

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-lg max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="relative p-5 bg-gradient-to-r from-emerald-500 to-teal-600 flex-shrink-0 rounded-t-3xl">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Kapsamlı Sağlık Profili</h2>
                                <p className="text-xs text-white/80">Tüm hedefler için tek profil</p>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="flex justify-between mt-4 gap-1">
                            {STEPS.map((step) => (
                                <div key={step.id} className="flex-1">
                                    <div
                                        className={clsx(
                                            'h-1.5 rounded-full transition-all',
                                            currentStep >= step.id ? 'bg-white' : 'bg-white/30'
                                        )}
                                    />
                                    <span className={clsx(
                                        'text-[10px] block text-center mt-1',
                                        currentStep === step.id ? 'text-white font-medium' : 'text-white/60'
                                    )}>
                                        {step.emoji}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="text-center mt-2 text-white/80 text-xs">
                            {currentStepData.title} {isOptionalStep && '(Opsiyonel)'}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-5">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 1 && (
                                    <StepBasic formData={formData} updateField={updateField} errors={errors} />
                                )}
                                {currentStep === 2 && (
                                    <StepActivity formData={formData} updateField={updateField} />
                                )}
                                {currentStep === 3 && (
                                    <StepTraining formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} />
                                )}
                                {currentStep === 4 && (
                                    <StepNutrition formData={formData} updateField={updateField} />
                                )}
                                {currentStep === 5 && (
                                    <StepHydrationSugar formData={formData} updateField={updateField} />
                                )}
                                {currentStep === 6 && (
                                    <StepSleepHealth formData={formData} updateField={updateField} toggleArrayField={toggleArrayField} />
                                )}
                                {currentStep === 7 && (
                                    <StepGoals formData={formData} updateField={updateField} metrics={metrics} errors={errors} />
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {submitError && (
                            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                <span className="text-sm text-red-700">{submitError}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 flex justify-between flex-shrink-0">
                        <button
                            onClick={goPrev}
                            disabled={currentStep === 1}
                            className={clsx(
                                'px-4 py-2 rounded-xl flex items-center gap-2',
                                currentStep === 1 ? 'text-slate-300' : 'text-slate-600 hover:bg-slate-100'
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>

                        <div className="flex gap-2">
                            {isOptionalStep && currentStep < STEPS.length && (
                                <button
                                    onClick={skipStep}
                                    className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 flex items-center gap-1"
                                >
                                    <SkipForward className="w-4 h-4" />
                                    Atla
                                </button>
                            )}

                            {currentStep < STEPS.length ? (
                                <button
                                    onClick={goNext}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg"
                                >
                                    İleri
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Kaydediliyor...' : 'Tamamla'}
                                    <Check className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

// =====================================================
// Step Components
// =====================================================

interface StepProps {
    formData: UnifiedHealthProfileInput
    updateField: <K extends keyof UnifiedHealthProfileInput>(field: K, value: UnifiedHealthProfileInput[K]) => void
    toggleArrayField?: (field: keyof UnifiedHealthProfileInput, value: string) => void
    errors?: FormErrors
    metrics?: ReturnType<typeof calculateHealthMetrics> | null
}

function StepBasic({ formData, updateField, errors }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">⚖️ Temel Bilgiler</h3>
                <p className="text-sm text-slate-500">BMR hesaplaması için gerekli</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                        <Scale className="w-4 h-4" /> Kilo
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.weight_kg || ''}
                            onChange={(e) => updateField('weight_kg', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                    </div>
                    {errors?.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg}</p>}
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">
                        <Ruler className="w-4 h-4" /> Boy
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.height_cm || ''}
                            onChange={(e) => updateField('height_cm', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                    </div>
                    {errors?.height_cm && <p className="text-xs text-red-500 mt-1">{errors.height_cm}</p>}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">Doğum Tarihi</label>
                <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateField('birth_date', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
                {errors?.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <User className="w-4 h-4" /> Cinsiyet
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { value: 'male', label: 'Erkek', emoji: '♂️' },
                        { value: 'female', label: 'Kadın', emoji: '♀️' }
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('biological_sex', option.value as BiologicalSex)}
                            className={clsx(
                                'p-3 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
                                formData.biological_sex === option.value
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                    : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <span className="text-xl">{option.emoji}</span>
                            <span className="font-medium">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StepActivity({ formData, updateField }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">🏃 Aktivite Seviyesi</h3>
                <p className="text-sm text-slate-500">Günlük kalori harcamanı etkiler</p>
            </div>

            <div className="space-y-2">
                {ACTIVITY_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('activity_level', option.value)}
                        className={clsx(
                            'w-full p-3 rounded-xl border-2 transition-all text-left flex items-center gap-3',
                            formData.activity_level === option.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <span className="text-2xl">{option.emoji}</span>
                        <div className="flex-1">
                            <div className="font-medium text-slate-700">{option.label}</div>
                            <div className="text-xs text-slate-500">{option.desc}</div>
                        </div>
                        <span className="text-xs text-slate-400">×{ACTIVITY_MULTIPLIERS[option.value].multiplier}</span>
                    </button>
                ))}
            </div>

            <div className="mt-4">
                <label className="text-sm font-medium text-slate-600 mb-2 block">Çalışma Ortamı</label>
                <div className="grid grid-cols-4 gap-2">
                    {WORK_ENVIRONMENT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('work_environment', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.work_environment === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <span className="text-lg block">{option.emoji}</span>
                            <span className="text-xs text-slate-600">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StepTraining({ formData, updateField, toggleArrayField }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">🏋️ Antrenman Geçmişi</h3>
                <p className="text-sm text-slate-500">Egzersiz deneyimin</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Deneyim Seviyesi</label>
                <div className="grid grid-cols-4 gap-2">
                    {TRAINING_EXP_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('training_experience', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.training_experience === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            <span className="text-lg block">{option.emoji}</span>
                            <span className="text-xs">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Antrenman Türleri</label>
                <div className="flex flex-wrap gap-2">
                    {TRAINING_TYPE_OPTIONS.map((option) => {
                        const isSelected = formData.training_types?.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleArrayField?.('training_types', option.value)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full text-sm flex items-center gap-1',
                                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                                )}
                            >
                                {option.emoji} {option.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Ekipman Erişimi</label>
                <div className="grid grid-cols-2 gap-2">
                    {GYM_ACCESS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('gym_access', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.gym_access === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            <span className="text-xl block">{option.emoji}</span>
                            <span className="text-xs">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StepNutrition({ formData, updateField }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">🍽️ Beslenme Alışkanlıkları</h3>
                <p className="text-sm text-slate-500">Yeme düzenin</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Günlük Öğün Sayısı</label>
                <div className="grid grid-cols-4 gap-2">
                    {MEALS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('meals_per_day', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center text-sm',
                                formData.meals_per_day === option.value
                                    ? 'border-emerald-500 bg-emerald-50 font-medium'
                                    : 'border-slate-200'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Evde Yemek Pişirme</label>
                <div className="grid grid-cols-4 gap-2">
                    {COOKS_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('cooks_at_home', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.cooks_at_home === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            <span className="text-lg block">{option.emoji}</span>
                            <span className="text-xs">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Fast Food Sıklığı</label>
                <div className="grid grid-cols-4 gap-2">
                    {FAST_FOOD_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('fast_food_frequency', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center text-sm',
                                formData.fast_food_frequency === option.value
                                    ? 'border-emerald-500 bg-emerald-50 font-medium'
                                    : 'border-slate-200'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StepHydrationSugar({ formData, updateField }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">💧 Su & Şeker</h3>
                <p className="text-sm text-slate-500">Hidrasyon ve şeker alışkanlıkları</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                    Günlük Su Tüketimi: {formData.current_water_intake_liters || 1.5}L
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={formData.current_water_intake_liters || 1.5}
                    onChange={(e) => updateField('current_water_intake_liters', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>0.5L</span>
                    <span>2.5L</span>
                    <span>5L</span>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Kahve/Çay (fincan/gün)</label>
                <div className="grid grid-cols-4 gap-2">
                    {COFFEE_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('coffee_tea_cups', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.coffee_tea_cups === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                    Şekerli İçecek (adet/gün): {formData.sugar_drinks_per_day || 0}
                </label>
                <input
                    type="range"
                    min="0"
                    max="5"
                    step="1"
                    value={formData.sugar_drinks_per_day || 0}
                    onChange={(e) => updateField('sugar_drinks_per_day', parseInt(e.target.value))}
                    className="w-full accent-emerald-500"
                />
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Şeker İsteği Ne Zaman?</label>
                <div className="flex flex-wrap gap-2">
                    {SUGAR_TRIGGER_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('sugar_craving_trigger', option.value)}
                            className={clsx(
                                'px-3 py-1.5 rounded-full text-sm flex items-center gap-1',
                                formData.sugar_craving_trigger === option.value
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                            )}
                        >
                            {option.emoji} {option.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function StepSleepHealth({ formData, updateField, toggleArrayField }: StepProps) {
    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">😴 Uyku & Sağlık</h3>
                <p className="text-sm text-slate-500">Dinlenme ve sağlık durumu</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">
                    Uyku Süresi: {formData.sleep_hours_avg || 7} saat
                </label>
                <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={formData.sleep_hours_avg || 7}
                    onChange={(e) => updateField('sleep_hours_avg', parseFloat(e.target.value))}
                    className="w-full accent-emerald-500"
                />
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Uyku Kalitesi</label>
                <div className="grid grid-cols-4 gap-2">
                    {SLEEP_QUALITY_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('sleep_quality', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2 text-center',
                                formData.sleep_quality === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            <span className="text-lg block">{option.emoji}</span>
                            <span className="text-xs">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Sağlık Durumları</label>
                <div className="flex flex-wrap gap-2">
                    {HEALTH_CONDITIONS.map((option) => {
                        const isSelected = formData.health_conditions?.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleArrayField?.('health_conditions', option.value)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full text-sm flex items-center gap-1',
                                    isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                                )}
                            >
                                {option.emoji} {option.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Diyet Kısıtlamaları</label>
                <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => {
                        const isSelected = formData.dietary_restrictions?.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleArrayField?.('dietary_restrictions', option.value)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-full text-sm flex items-center gap-1',
                                    isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                                )}
                            >
                                {option.emoji} {option.label}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function StepGoals({ formData, updateField, metrics, errors }: StepProps) {
    const showTargetWeight = formData.primary_goal === 'weight_loss' || formData.primary_goal === 'weight_gain'

    return (
        <div className="space-y-4">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">🎯 Hedefini Belirle</h3>
                <p className="text-sm text-slate-500">AI kişiselleştirilmiş plan oluşturacak</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Ana Hedef</label>
                <div className="grid grid-cols-3 gap-2">
                    {GOAL_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('primary_goal', option.value)}
                            className={clsx(
                                'p-2 rounded-lg border-2',
                                formData.primary_goal === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200'
                            )}
                        >
                            <span className="text-xl block">{option.emoji}</span>
                            <span className="text-xs">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {showTargetWeight && (
                <>
                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-1 block">Hedef Kilo</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={formData.target_weight_kg || ''}
                                onChange={(e) => updateField('target_weight_kg', parseFloat(e.target.value) || undefined)}
                                placeholder={formData.primary_goal === 'weight_loss' ? '65' : '80'}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-600 mb-2 block">Hız</label>
                        <div className="grid grid-cols-3 gap-2">
                            {PACE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => updateField('goal_pace', option.value)}
                                    className={clsx(
                                        'p-2 rounded-lg border-2',
                                        formData.goal_pace === option.value
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-slate-200'
                                    )}
                                >
                                    <span className="font-medium text-sm">{option.label}</span>
                                    <span className="text-xs text-slate-400 block">{option.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {metrics && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Hesaplanan Değerler</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.bmr_kcal}</div>
                            <div className="text-xs text-slate-500">BMR</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.tdee_kcal}</div>
                            <div className="text-xs text-slate-500">TDEE</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.target_daily_kcal}</div>
                            <div className="text-xs text-slate-500">Hedef</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
