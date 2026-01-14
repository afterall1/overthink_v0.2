'use client'

// =====================================================
// GoalQuestionsStep - Dynamic Goal-Specific Questions Container
// Now checks unified health profile first before showing questions
// =====================================================

import { motion } from 'framer-motion'
import { CheckCircle, Sparkles, AlertCircle } from 'lucide-react'
import {
    SugarQuestions,
    MuscleGainQuestions,
    HydrationQuestions,
    FastingQuestions,
    ActivityQuestions,
    HealthyEatingQuestions
} from './Questions'
import { goalHasQuestions } from '@/types/goalQuestions.types'
import { getRelevantSections } from '@/types/unifiedHealthProfile.types'
import useHealthProfile from '@/hooks/useHealthProfile'
import { useMemo } from 'react'

// =====================================================
// Props
// =====================================================

interface GoalQuestionsStepProps {
    templateSlug: string | undefined
    data: Record<string, unknown>
    onChange: (field: string, value: string | string[] | boolean | number) => void
}

// =====================================================
// Helper: Check if profile has relevant sections for a goal
// =====================================================

function checkProfileSectionsForGoal(
    sectionsCompleted: string[] | undefined,
    templateSlug: string
): { hasAllSections: boolean; missingSections: string[] } {
    if (!sectionsCompleted || sectionsCompleted.length === 0) {
        return { hasAllSections: false, missingSections: ['basic'] }
    }

    const relevantSections = getRelevantSections(templateSlug)
    const missingSections = relevantSections.filter(s => !sectionsCompleted.includes(s))

    return {
        hasAllSections: missingSections.length === 0,
        missingSections
    }
}

// Section label translations
const SECTION_LABELS: Record<string, string> = {
    basic: 'Temel Bilgiler',
    activity: 'Aktivite',
    training: 'Antrenman',
    nutrition: 'Beslenme',
    hydration_sugar: 'Su & Şeker',
    sleep: 'Uyku',
    health: 'Sağlık',
    goals: 'Hedefler'
}

// =====================================================
// Component
// =====================================================

export default function GoalQuestionsStep({
    templateSlug,
    data,
    onChange
}: GoalQuestionsStepProps) {
    const { hasProfile, profile } = useHealthProfile()

    // Check if unified profile covers this goal's questions
    const profileStatus = useMemo(() => {
        if (!templateSlug) return { hasAllSections: false, missingSections: [] as string[] }

        // Get profile's sections_completed from extended data
        const extendedProfile = profile as unknown as Record<string, unknown> | undefined
        const sectionsCompleted = extendedProfile?.sections_completed as string[] | undefined

        return checkProfileSectionsForGoal(sectionsCompleted, templateSlug)
    }, [templateSlug, profile])

    // If no template or template doesn't have questions, show success
    if (!templateSlug || !goalHasQuestions(templateSlug)) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
            >
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                    Harika!
                </h3>
                <p className="text-sm text-slate-500">
                    Bu hedef için ek bilgiye gerek yok. Devam edebilirsin.
                </p>
            </motion.div>
        )
    }

    // If unified profile has all relevant sections, show success message
    if (hasProfile && profileStatus.hasAllSections) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
            >
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Profilin Hazır! 🎉
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    Sağlık profilinden gerekli bilgiler zaten mevcut.
                    AI bu verileri kullanarak sana özel görevler oluşturacak.
                </p>

                {/* Show what data we have */}
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 text-left">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Kullanılacak Profil Verileri</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1">
                        {templateSlug === 'reduce_sugar' && (
                            <>
                                <li>• Günlük şekerli içecek: {String((profile as unknown as Record<string, unknown>)?.sugar_drinks_per_day ?? 'Belirtilmemiş')} adet</li>
                                <li>• Şeker isteği zamanı: {String((profile as unknown as Record<string, unknown>)?.sugar_craving_trigger ?? 'Belirtilmemiş')}</li>
                            </>
                        )}
                        {(templateSlug === 'gain_muscle' || templateSlug === 'weekly_workouts') && (
                            <>
                                <li>• Antrenman deneyimi: {String((profile as unknown as Record<string, unknown>)?.training_experience ?? 'Belirtilmemiş')}</li>
                                <li>• Ekipman erişimi: {String((profile as unknown as Record<string, unknown>)?.gym_access ?? 'Belirtilmemiş')}</li>
                            </>
                        )}
                        {templateSlug === 'drink_water' && (
                            <>
                                <li>• Mevcut su tüketimi: {String((profile as unknown as Record<string, unknown>)?.current_water_intake_liters ?? 1.5)}L/gün</li>
                            </>
                        )}
                        {(templateSlug === 'eat_healthy' || templateSlug === 'meal_prep') && (
                            <>
                                <li>• Günlük öğün: {String((profile as unknown as Record<string, unknown>)?.meals_per_day ?? '3')}</li>
                                <li>• Evde yemek: {String((profile as unknown as Record<string, unknown>)?.cooks_at_home ?? 'Belirtilmemiş')}</li>
                            </>
                        )}
                    </ul>
                </div>
            </motion.div>
        )
    }

    // If profile exists but missing sections, show warning
    if (hasProfile && !profileStatus.hasAllSections && profileStatus.missingSections.length > 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
            >
                {/* Warning banner */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">
                                Profilinde bazı bölümler eksik
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Eksik bölümler: {profileStatus.missingSections.map(s => SECTION_LABELS[s] || s).join(', ')}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                                Aşağıdaki soruları cevaplayarak AI'ın daha iyi görevler oluşturmasını sağlayabilirsin.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Show relevant questions as fallback */}
                {renderQuestions(templateSlug, data, onChange)}
            </motion.div>
        )
    }

    // No profile - show questions normally
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {renderQuestions(templateSlug, data, onChange)}
        </motion.div>
    )
}

// =====================================================
// Helper: Render question components
// =====================================================

function renderQuestions(
    templateSlug: string,
    data: Record<string, unknown>,
    onChange: (field: string, value: string | string[] | boolean | number) => void
) {
    return (
        <>
            {/* Sugar Reduction */}
            {templateSlug === 'reduce_sugar' && (
                <SugarQuestions data={data} onChange={onChange} />
            )}

            {/* Muscle Gain */}
            {(templateSlug === 'gain_muscle' || templateSlug === 'weekly_workouts') && (
                <MuscleGainQuestions data={data} onChange={onChange} />
            )}

            {/* Hydration */}
            {templateSlug === 'drink_water' && (
                <HydrationQuestions data={data} onChange={onChange} />
            )}

            {/* Fasting */}
            {templateSlug === 'intermittent_fasting' && (
                <FastingQuestions data={data} onChange={onChange} />
            )}

            {/* Activity/Steps */}
            {templateSlug === 'daily_steps' && (
                <ActivityQuestions data={data} onChange={onChange} />
            )}

            {/* Healthy Eating */}
            {(templateSlug === 'eat_healthy' || templateSlug === 'meal_prep' || templateSlug === 'protein_goal') && (
                <HealthyEatingQuestions data={data} onChange={onChange} />
            )}
        </>
    )
}

// =====================================================
// Helper: Check if a step should show questions
// =====================================================

export function shouldShowQuestionsStep(templateSlug: string | undefined): boolean {
    if (!templateSlug) return false
    return goalHasQuestions(templateSlug)
}
