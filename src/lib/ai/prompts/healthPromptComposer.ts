'use strict'

// =====================================================
// Health Prompt Composer
// Combines base and goal-specific prompts
// =====================================================

import { BASE_SYSTEM_PROMPT } from './baseSystemPrompt'
import { SUGAR_REDUCTION_PROMPT, buildSugarContextMessage } from './sugarReductionPrompt'
import { WEIGHT_LOSS_PROMPT, buildWeightLossContextMessage } from './weightLossPrompt'
import { HYDRATION_PROMPT, buildHydrationContextMessage } from './hydrationPrompt'
import { MUSCLE_GAIN_PROMPT, buildMuscleGainContextMessage } from './muscleGainPrompt'
import { FASTING_PROMPT, buildFastingContextMessage } from './fastingPrompt'
import { ACTIVITY_PROMPT, buildActivityContextMessage } from './activityPrompt'
import { HEALTHY_EATING_PROMPT, buildHealthyEatingContextMessage } from './healthyEatingPrompt'

import type {
    GoalSpecificContext,
    GoalType,
    SugarReductionContext,
    WeightLossContext,
    HydrationContext,
    MuscleGainContext,
    FastingContext,
    ActivityContext,
    HealthyEatingContext
} from '../goalSpecificContexts'

// =====================================================
// Goal-Specific Prompt Registry
// =====================================================

const GOAL_PROMPTS: Partial<Record<GoalType, string>> = {
    'reduce_sugar': SUGAR_REDUCTION_PROMPT,
    'weight_loss': WEIGHT_LOSS_PROMPT,
    'drink_water': HYDRATION_PROMPT,
    'muscle_gain': MUSCLE_GAIN_PROMPT,
    'intermittent_fasting': FASTING_PROMPT,
    'activity': ACTIVITY_PROMPT,
    'eat_healthy': HEALTHY_EATING_PROMPT,
}

// =====================================================
// Prompt Composition Functions
// =====================================================

/**
 * Get the goal-specific prompt for a given goal type
 */
export function getGoalSpecificPrompt(goalType: GoalType): string {
    return GOAL_PROMPTS[goalType] ?? getDefaultGoalPrompt(goalType)
}

/**
 * Compose the full system prompt (base + goal-specific)
 */
export function composeSystemPrompt(goalType: GoalType): string {
    const goalPrompt = getGoalSpecificPrompt(goalType)
    return `${BASE_SYSTEM_PROMPT}\n\n${goalPrompt}`
}

/**
 * Build goal-specific user context message
 */
export function buildGoalContextMessage(context: GoalSpecificContext): string {
    switch (context.goal_type) {
        case 'reduce_sugar':
            return buildSugarContextMessage(context as SugarReductionContext)

        case 'weight_loss':
            return buildWeightLossContextMessage(context as WeightLossContext)

        case 'drink_water':
            return buildHydrationContextMessage(context as HydrationContext)

        case 'muscle_gain':
            return buildMuscleGainContextMessage(context as MuscleGainContext)

        case 'intermittent_fasting':
            return buildFastingContextMessage(context as FastingContext)

        case 'activity':
            return buildActivityContextMessage(context as ActivityContext)

        case 'eat_healthy':
            return buildHealthyEatingContextMessage(context as HealthyEatingContext)

        default:
            return buildGenericContextMessage(context)
    }
}

// =====================================================
// Fallback Prompts
// =====================================================

/**
 * Default prompt for goal types without specialized prompts
 */
function getDefaultGoalPrompt(goalType: GoalType): string {
    return `
## 🎯 GENEL HEDEF STRATEJİSİ

Bu kullanıcının hedef tipi: ${goalType}

Kullanıcının profil bilgilerine ve sağlık durumuna göre kişiselleştirilmiş günlük görevler üret.
Görevler SMART formatında olmalı ve kullanıcının hedefine uygun olmalı.

### GÖREV TİPLERİ:
- 2-3 beslenme görevi
- 1-2 egzersiz görevi
- 1-2 alışkanlık görevi
- 1 takip görevi

XP ödülleri zorluğa göre ayarla: Kolay (15-20), Orta (25-30), Zor (35+)
`
}

/**
 * Generic context message for unspecialized goal types
 */
function buildGenericContextMessage(context: GoalSpecificContext): string {
    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## HEDEF:
- Hedef Tipi: ${context.goal_type}

## SAĞLIK DURUMU:
${context.health_conditions.length > 0 ? `- Sağlık Koşulları: ${context.health_conditions.join(', ')}` : '- Sağlık Koşulları: Bilinen yok'}
${context.dietary_restrictions.length > 0 ? `- Diyet Kısıtlamaları: ${context.dietary_restrictions.join(', ')}` : '- Diyet Kısıtlamaları: Yok'}
${context.allergies.length > 0 ? `- Alerjiler: ${context.allergies.join(', ')}` : '- Alerjiler: Yok'}

Lütfen bu kullanıcı için kişiselleştirilmiş günlük görevler oluştur.
`
}
