'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, ChevronRight, ChevronLeft, Check,
    Scale, Ruler, User, Activity, Heart,
    AlertTriangle, Sparkles, Calculator,
    Target, Zap, Utensils, Apple
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
    upsertHealthProfile,
    type HealthProfileInput
} from '@/actions/aiHealthQuests'

// =====================================================
// Types
// =====================================================

interface HealthProfileWizardProps {
    isOpen: boolean
    onClose: () => void
    onComplete?: (profile: HealthProfileInput) => void
    initialData?: Partial<HealthProfileInput>
}

interface FormData {
    // Step 1: Basic Metrics
    weight_kg: number | undefined
    height_cm: number | undefined
    birth_date: string
    biological_sex: BiologicalSex | ''

    // Step 2: Activity
    activity_level: ActivityLevel

    // Step 3: Health Conditions
    health_conditions: string[]

    // Step 4: Dietary
    dietary_restrictions: string[]
    allergies: string[]

    // Step 5: Goals
    primary_goal: PrimaryGoal
    target_weight_kg: number | undefined
    goal_pace: GoalPace
}

type FormErrors = Partial<Record<keyof FormData, string>>

// =====================================================
// Constants
// =====================================================

const STEPS = [
    { id: 1, title: 'Temel Bilgiler', icon: Scale, emoji: '⚖️' },
    { id: 2, title: 'Aktivite', icon: Activity, emoji: '🏃' },
    { id: 3, title: 'Sağlık', icon: Heart, emoji: '❤️' },
    { id: 4, title: 'Beslenme', icon: Utensils, emoji: '🍽️' },
    { id: 5, title: 'Hedef', icon: Target, emoji: '🎯' }
]

const ACTIVITY_OPTIONS: Array<{ value: ActivityLevel; label: string; emoji: string; desc: string }> = [
    { value: 'sedentary', label: 'Hareketsiz', emoji: '🪑', desc: 'Masa başı iş, minimum hareket' },
    { value: 'light', label: 'Az Hareketli', emoji: '🚶', desc: 'Hafif egzersiz, haftada 1-3 gün' },
    { value: 'moderate', label: 'Orta', emoji: '🏃', desc: 'Orta yoğunluk, haftada 3-5 gün' },
    { value: 'very_active', label: 'Çok Aktif', emoji: '🏋️', desc: 'Yoğun egzersiz, haftada 6-7 gün' },
    { value: 'extreme', label: 'Profesyonel', emoji: '🏆', desc: 'Günde 2 antrenman' }
]

const HEALTH_CONDITIONS = [
    { value: 'diabetes', label: 'Diyabet', emoji: '🩸' },
    { value: 'hypertension', label: 'Tansiyon', emoji: '❤️‍🩹' },
    { value: 'heart_disease', label: 'Kalp Hastalığı', emoji: '💔' },
    { value: 'thyroid', label: 'Tiroid', emoji: '🦋' },
    { value: 'pcos', label: 'PCOS', emoji: '♀️' },
    { value: 'none', label: 'Hiçbiri', emoji: '✅' }
]

const DIETARY_OPTIONS = [
    { value: 'vegetarian', label: 'Vejetaryen', emoji: '🥬' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'gluten_free', label: 'Glütensiz', emoji: '🌾' },
    { value: 'dairy_free', label: 'Sütsüz', emoji: '🥛' },
    { value: 'halal', label: 'Helal', emoji: '☪️' },
    { value: 'low_carb', label: 'Düşük Karbonhidrat', emoji: '🥩' },
    { value: 'keto', label: 'Keto', emoji: '🥑' }
]

const ALLERGY_OPTIONS = [
    { value: 'nuts', label: 'Kuruyemiş', emoji: '🥜' },
    { value: 'shellfish', label: 'Kabuklu Deniz', emoji: '🦐' },
    { value: 'eggs', label: 'Yumurta', emoji: '🥚' },
    { value: 'soy', label: 'Soya', emoji: '🫘' },
    { value: 'wheat', label: 'Buğday', emoji: '🌾' },
    { value: 'milk', label: 'Süt', emoji: '🥛' }
]

const GOAL_OPTIONS: Array<{ value: PrimaryGoal; label: string; emoji: string }> = [
    { value: 'weight_loss', label: 'Kilo Vermek', emoji: '📉' },
    { value: 'weight_gain', label: 'Kilo Almak', emoji: '📈' },
    { value: 'maintenance', label: 'Korumak', emoji: '⚖️' },
    { value: 'muscle_gain', label: 'Kas Yapmak', emoji: '💪' },
    { value: 'endurance', label: 'Dayanıklılık', emoji: '🏃' }
]

const PACE_OPTIONS: Array<{ value: GoalPace; label: string; emoji: string; desc: string }> = [
    { value: 'slow', label: 'Yavaş', emoji: '🐢', desc: '~0.3 kg/hafta' },
    { value: 'moderate', label: 'Orta', emoji: '🐇', desc: '~0.5 kg/hafta (Önerilen)' },
    { value: 'aggressive', label: 'Hızlı', emoji: '🚀', desc: '~0.75 kg/hafta' }
]

const INITIAL_FORM_DATA: FormData = {
    weight_kg: undefined,
    height_cm: undefined,
    birth_date: '',
    biological_sex: '',
    activity_level: 'moderate',
    health_conditions: [],
    dietary_restrictions: [],
    allergies: [],
    primary_goal: 'maintenance',
    target_weight_kg: undefined,
    goal_pace: 'moderate'
}

// =====================================================
// Component
// =====================================================

export default function HealthProfileWizard({
    isOpen,
    onClose,
    onComplete,
    initialData
}: HealthProfileWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM_DATA, ...initialData })
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

    // Calculated metrics preview
    const metrics = useMemo(() => {
        if (
            formData.weight_kg &&
            formData.height_cm &&
            formData.birth_date &&
            formData.biological_sex
        ) {
            return calculateHealthMetrics({
                weight_kg: formData.weight_kg,
                height_cm: formData.height_cm,
                birth_date: formData.birth_date,
                biological_sex: formData.biological_sex as BiologicalSex,
                activity_level: formData.activity_level,
                primary_goal: formData.primary_goal,
                goal_pace: formData.goal_pace,
                target_weight_kg: formData.target_weight_kg,
                health_conditions: formData.health_conditions,
                dietary_restrictions: formData.dietary_restrictions
            })
        }
        return null
    }, [formData])

    // Update field
    const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    // Toggle array field
    const toggleArrayField = (field: 'health_conditions' | 'dietary_restrictions' | 'allergies', value: string) => {
        setFormData(prev => {
            const current = prev[field]
            if (value === 'none') {
                return { ...prev, [field]: [] }
            }
            if (current.includes(value)) {
                return { ...prev, [field]: current.filter(v => v !== value) }
            }
            return { ...prev, [field]: [...current.filter(v => v !== 'none'), value] }
        })
    }

    // Validate current step
    const validateStep = (): boolean => {
        const newErrors: FormErrors = {}

        if (currentStep === 1) {
            if (!formData.weight_kg || formData.weight_kg < 30 || formData.weight_kg > 300) {
                newErrors.weight_kg = 'Geçerli bir kilo girin (30-300 kg)'
            }
            if (!formData.height_cm || formData.height_cm < 100 || formData.height_cm > 250) {
                newErrors.height_cm = 'Geçerli bir boy girin (100-250 cm)'
            }
            if (!formData.birth_date) {
                newErrors.birth_date = 'Doğum tarihi gerekli'
            } else {
                const age = calculateAge(formData.birth_date)
                if (age < 13 || age > 120) {
                    newErrors.birth_date = 'Yaş 13-120 arasında olmalı'
                }
            }
            if (!formData.biological_sex) {
                newErrors.biological_sex = 'Cinsiyet seçimi gerekli'
            }
        }

        if (currentStep === 5) {
            if (
                (formData.primary_goal === 'weight_loss' || formData.primary_goal === 'weight_gain') &&
                formData.target_weight_kg
            ) {
                if (formData.target_weight_kg < 30 || formData.target_weight_kg > 300) {
                    newErrors.target_weight_kg = 'Geçerli bir hedef kilo girin'
                }
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Navigate
    const goNext = () => {
        if (validateStep() && currentStep < 5) {
            setCurrentStep(prev => prev + 1)
        }
    }

    const goPrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1)
        }
    }

    // Submit
    const handleSubmit = async () => {
        if (!validateStep()) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const input: HealthProfileInput = {
                weight_kg: formData.weight_kg!,
                height_cm: formData.height_cm!,
                birth_date: formData.birth_date,
                biological_sex: formData.biological_sex as BiologicalSex,
                activity_level: formData.activity_level,
                health_conditions: formData.health_conditions.filter(c => c !== 'none'),
                dietary_restrictions: formData.dietary_restrictions,
                allergies: formData.allergies,
                primary_goal: formData.primary_goal,
                target_weight_kg: formData.target_weight_kg,
                goal_pace: formData.goal_pace
            }

            const result = await upsertHealthProfile(input)

            if (result.success) {
                onComplete?.(input)
                onClose()
            } else {
                setSubmitError(result.error || 'Bir hata oluştu')
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Beklenmeyen hata')
        } finally {
            setIsSubmitting(false)
        }
    }

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
                    {/* Header - flex-shrink-0 to prevent compression */}
                    <div className="relative p-6 bg-gradient-to-r from-emerald-500 to-teal-600 flex-shrink-0">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Sağlık Profili</h2>
                                <p className="text-sm text-white/80">Kişiselleştirilmiş görevler için</p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-between mt-6">
                            {STEPS.map((step) => (
                                <div key={step.id} className="flex flex-col items-center">
                                    <div
                                        className={clsx(
                                            'w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all',
                                            currentStep === step.id
                                                ? 'bg-white text-emerald-600 shadow-lg'
                                                : currentStep > step.id
                                                    ? 'bg-white/30 text-white'
                                                    : 'bg-white/10 text-white/50'
                                        )}
                                    >
                                        {currentStep > step.id ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            step.emoji
                                        )}
                                    </div>
                                    <span className={clsx(
                                        'text-xs mt-1',
                                        currentStep === step.id ? 'text-white font-medium' : 'text-white/60'
                                    )}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content - flex-1 with min-h-0 for proper scroll */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                            >
                                {currentStep === 1 && (
                                    <Step1BasicMetrics
                                        formData={formData}
                                        updateField={updateField}
                                        errors={errors}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <Step2Activity
                                        formData={formData}
                                        updateField={updateField}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <Step3Health
                                        formData={formData}
                                        updateField={updateField}
                                        toggleArrayField={toggleArrayField}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <Step4Dietary
                                        formData={formData}
                                        updateField={updateField}
                                        toggleArrayField={toggleArrayField}
                                    />
                                )}
                                {currentStep === 5 && (
                                    <Step5Goals
                                        formData={formData}
                                        updateField={updateField}
                                        metrics={metrics}
                                        errors={errors}
                                    />
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

                    {/* Footer Actions - flex-shrink-0 to always show */}
                    <div className="p-4 border-t border-slate-100 flex justify-between flex-shrink-0">
                        <button
                            onClick={goPrev}
                            disabled={currentStep === 1}
                            className={clsx(
                                'px-4 py-2 rounded-xl flex items-center gap-2 transition-all',
                                currentStep === 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-slate-100'
                            )}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Geri
                        </button>

                        {currentStep < 5 ? (
                            <button
                                onClick={goNext}
                                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all"
                            >
                                İleri
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'Kaydediliyor...' : 'Tamamla'}
                                <Check className="w-5 h-5" />
                            </button>
                        )}
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
    formData: FormData
    updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
    toggleArrayField?: (field: 'health_conditions' | 'dietary_restrictions' | 'allergies', value: string) => void
    errors?: FormErrors
    metrics?: ReturnType<typeof calculateHealthMetrics> | null
}

function Step1BasicMetrics({ formData, updateField, errors }: StepProps) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Temel Bilgilerin</h3>
                <p className="text-sm text-slate-500">BMR hesaplaması için gerekli</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                        <Scale className="w-4 h-4" /> Kilo *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.weight_kg || ''}
                            onChange={(e) => updateField('weight_kg', parseFloat(e.target.value) || undefined)}
                            placeholder="70"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                    </div>
                    {errors?.weight_kg && <p className="text-xs text-red-500 mt-1">{errors.weight_kg}</p>}
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                        <Ruler className="w-4 h-4" /> Boy *
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.height_cm || ''}
                            onChange={(e) => updateField('height_cm', parseFloat(e.target.value) || undefined)}
                            placeholder="175"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">cm</span>
                    </div>
                    {errors?.height_cm && <p className="text-xs text-red-500 mt-1">{errors.height_cm}</p>}
                </div>
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    Doğum Tarihi *
                </label>
                <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => updateField('birth_date', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {errors?.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                    <User className="w-4 h-4" /> Cinsiyet *
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
                                'p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2',
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
                {errors?.biological_sex && <p className="text-xs text-red-500 mt-1">{errors.biological_sex}</p>}
            </div>
        </div>
    )
}

function Step2Activity({ formData, updateField }: StepProps) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Aktivite Seviyesi</h3>
                <p className="text-sm text-slate-500">Günlük kalori harcamanı etkiler</p>
            </div>

            <div className="space-y-3">
                {ACTIVITY_OPTIONS.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => updateField('activity_level', option.value)}
                        className={clsx(
                            'w-full p-4 rounded-xl border-2 transition-all text-left',
                            formData.activity_level === option.value
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-slate-300'
                        )}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{option.emoji}</span>
                            <div>
                                <div className={clsx(
                                    'font-medium',
                                    formData.activity_level === option.value ? 'text-emerald-700' : 'text-slate-700'
                                )}>
                                    {option.label}
                                </div>
                                <div className="text-xs text-slate-500">{option.desc}</div>
                            </div>
                            <div className="ml-auto text-sm text-slate-400">
                                ×{ACTIVITY_MULTIPLIERS[option.value].multiplier}
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}

function Step3Health({ formData, toggleArrayField }: StepProps) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Sağlık Durumu</h3>
                <p className="text-sm text-slate-500">Güvenli öneriler için (isteğe bağlı)</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {HEALTH_CONDITIONS.map((condition) => {
                    const isSelected = condition.value === 'none'
                        ? formData.health_conditions.length === 0
                        : formData.health_conditions.includes(condition.value)

                    return (
                        <button
                            key={condition.value}
                            type="button"
                            onClick={() => toggleArrayField?.('health_conditions', condition.value)}
                            className={clsx(
                                'p-4 rounded-xl border-2 transition-all',
                                isSelected
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <span className="text-2xl block mb-1">{condition.emoji}</span>
                            <span className={clsx(
                                'text-sm font-medium',
                                isSelected ? 'text-emerald-700' : 'text-slate-600'
                            )}>
                                {condition.label}
                            </span>
                        </button>
                    )
                })}
            </div>

            {formData.health_conditions.length > 0 && !formData.health_conditions.includes('none') && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                        Sağlık durumlarınıza göre AI daha güvenli öneriler üretecek.
                        Yoğun egzersiz öncesi doktorunuza danışın.
                    </p>
                </div>
            )}
        </div>
    )
}

function Step4Dietary({ formData, toggleArrayField }: StepProps) {
    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Beslenme Tercihleri</h3>
                <p className="text-sm text-slate-500">Diyet ve alerji bilgileri (isteğe bağlı)</p>
            </div>

            {/* Dietary Restrictions */}
            <div>
                <label className="text-sm font-medium text-slate-600 mb-3 block">
                    🍽️ Diyet Kısıtlamaları
                </label>
                <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => {
                        const isSelected = formData.dietary_restrictions.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleArrayField?.('dietary_restrictions', option.value)}
                                className={clsx(
                                    'px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1.5',
                                    isSelected
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                <span>{option.emoji}</span>
                                <span>{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Allergies */}
            <div>
                <label className="text-sm font-medium text-slate-600 mb-3 block">
                    ⚠️ Alerjiler
                </label>
                <div className="flex flex-wrap gap-2">
                    {ALLERGY_OPTIONS.map((option) => {
                        const isSelected = formData.allergies.includes(option.value)
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => toggleArrayField?.('allergies', option.value)}
                                className={clsx(
                                    'px-3 py-2 rounded-full text-sm transition-all flex items-center gap-1.5',
                                    isSelected
                                        ? 'bg-red-500 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                )}
                            >
                                <span>{option.emoji}</span>
                                <span>{option.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function Step5Goals({ formData, updateField, metrics, errors }: StepProps) {
    const showTargetWeight = formData.primary_goal === 'weight_loss' || formData.primary_goal === 'weight_gain'

    return (
        <div className="space-y-5">
            <div className="text-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Hedefini Belirle</h3>
                <p className="text-sm text-slate-500">AI kişiselleştirilmiş plan oluşturacak</p>
            </div>

            {/* Primary Goal */}
            <div>
                <label className="text-sm font-medium text-slate-600 mb-3 block">
                    🎯 Ana Hedef
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {GOAL_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => updateField('primary_goal', option.value)}
                            className={clsx(
                                'p-3 rounded-xl border-2 transition-all',
                                formData.primary_goal === option.value
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-slate-300'
                            )}
                        >
                            <span className="text-xl block mb-1">{option.emoji}</span>
                            <span className={clsx(
                                'text-xs font-medium',
                                formData.primary_goal === option.value ? 'text-emerald-700' : 'text-slate-600'
                            )}>
                                {option.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Target Weight */}
            {showTargetWeight && (
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-2 block">
                        🎯 Hedef Kilo (isteğe bağlı)
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            value={formData.target_weight_kg || ''}
                            onChange={(e) => updateField('target_weight_kg', parseFloat(e.target.value) || undefined)}
                            placeholder={formData.primary_goal === 'weight_loss' ? '65' : '80'}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kg</span>
                    </div>
                    {errors?.target_weight_kg && <p className="text-xs text-red-500 mt-1">{errors.target_weight_kg}</p>}
                </div>
            )}

            {/* Pace */}
            {showTargetWeight && (
                <div>
                    <label className="text-sm font-medium text-slate-600 mb-3 block">
                        ⏱️ Hız
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {PACE_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => updateField('goal_pace', option.value)}
                                className={clsx(
                                    'p-3 rounded-xl border-2 transition-all',
                                    formData.goal_pace === option.value
                                        ? 'border-emerald-500 bg-emerald-50'
                                        : 'border-slate-200 hover:border-slate-300'
                                )}
                            >
                                <span className="text-xl block mb-1">{option.emoji}</span>
                                <span className={clsx(
                                    'text-xs font-medium block',
                                    formData.goal_pace === option.value ? 'text-emerald-700' : 'text-slate-600'
                                )}>
                                    {option.label}
                                </span>
                                <span className="text-xs text-slate-400">{option.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Metrics Preview */}
            {metrics && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                    <div className="flex items-center gap-2 mb-3">
                        <Calculator className="w-5 h-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Hesaplanan Değerler</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.bmr_kcal}</div>
                            <div className="text-xs text-slate-500">BMR (kcal)</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.tdee_kcal}</div>
                            <div className="text-xs text-slate-500">TDEE (kcal)</div>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-emerald-700">{metrics.target_daily_kcal}</div>
                            <div className="text-xs text-slate-500">Hedef (kcal)</div>
                        </div>
                    </div>
                    {metrics.daily_adjustment !== 0 && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 text-center">
                            <span className={clsx(
                                'text-sm font-medium',
                                metrics.daily_adjustment < 0 ? 'text-orange-600' : 'text-blue-600'
                            )}>
                                {metrics.daily_adjustment < 0 ? '🔥' : '⚡'} Günlük {Math.abs(metrics.daily_adjustment)} kcal {metrics.daily_adjustment < 0 ? 'açık' : 'fazla'}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
