'use client'

// =====================================================
// GoalQuestionsStep - Dynamic Goal-Specific Questions Container
// Renders the appropriate question set based on the selected goal template
// =====================================================

import { motion } from 'framer-motion'
import {
    SugarQuestions,
    MuscleGainQuestions,
    HydrationQuestions,
    FastingQuestions,
    ActivityQuestions,
    HealthyEatingQuestions
} from './Questions'
import { goalHasQuestions } from '@/types/goalQuestions.types'

// =====================================================
// Props
// =====================================================

interface GoalQuestionsStepProps {
    templateSlug: string | undefined
    data: Record<string, unknown>
    onChange: (field: string, value: string | string[] | boolean | number) => void
}

// =====================================================
// Component
// =====================================================

export default function GoalQuestionsStep({
    templateSlug,
    data,
    onChange
}: GoalQuestionsStepProps) {
    // If no template or template doesn't have questions, show message
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

    // Render appropriate question component based on template slug
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Sugar Reduction */}
            {templateSlug === 'reduce_sugar' && (
                <SugarQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}

            {/* Muscle Gain */}
            {(templateSlug === 'gain_muscle' || templateSlug === 'weekly_workouts') && (
                <MuscleGainQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}

            {/* Hydration */}
            {templateSlug === 'drink_water' && (
                <HydrationQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}

            {/* Fasting */}
            {templateSlug === 'intermittent_fasting' && (
                <FastingQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}

            {/* Activity/Steps */}
            {templateSlug === 'daily_steps' && (
                <ActivityQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}

            {/* Healthy Eating */}
            {(templateSlug === 'eat_healthy' || templateSlug === 'meal_prep' || templateSlug === 'protein_goal') && (
                <HealthyEatingQuestions
                    data={data as Record<string, unknown>}
                    onChange={onChange}
                />
            )}
        </motion.div>
    )
}

// =====================================================
// Helper: Check if a step should show questions
// =====================================================

export function shouldShowQuestionsStep(templateSlug: string | undefined): boolean {
    if (!templateSlug) return false
    return goalHasQuestions(templateSlug)
}
