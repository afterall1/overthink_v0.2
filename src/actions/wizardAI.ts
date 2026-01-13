'use server'

// =====================================================
// Wizard AI Server Action
// Generates personalized quests based on goal wizard data
// =====================================================

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
    generateHealthQuests,
    type UserHealthContext,
    type AIGeneratedQuest
} from '@/lib/ai/healthCouncil'
import { calculateAge, calculateHealthMetrics, type HealthProfile } from '@/lib/healthCalculator'

// =====================================================
// Types
// =====================================================

export interface WizardContext {
    // From Step 1 (Why)
    motivation: string
    identity_statement: string

    // From Step 2 (What)
    goal_title: string
    goal_description: string
    target_value: number | null
    unit: string
    period: string
    category_slug: string | null
    goal_template_id: string | null

    // From Step 3 (When)
    start_date: string
    end_date: string | null
}

export interface WizardQuestsResult {
    success: boolean
    quests?: AIGeneratedQuest[]
    nutrition_plan?: {
        daily_calorie_target: number
        protein_grams: number
        carbs_grams: number
        fat_grams: number
    }
    warnings?: string[]
    motivational_tip?: string
    error?: string
    fallback_used?: boolean
}

// =====================================================
// Main Function
// =====================================================

/**
 * Generate personalized quests based on wizard context
 * Falls back to template-based quests if AI fails
 */
export async function generateWizardQuests(
    context: WizardContext
): Promise<WizardQuestsResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        // Try to get health profile for richer context
        const healthProfile = await fetchHealthProfile(user.id)

        // Build AI context from wizard data + health profile
        const aiContext = buildAIContext(context, healthProfile)

        // Generate quests using AI
        const aiResponse = await generateHealthQuests(aiContext)

        if (!aiResponse.success || aiResponse.daily_quests.length === 0) {
            // Fallback to template-based quests
            console.log('[generateWizardQuests] AI failed, using fallback templates')
            const fallbackQuests = await getFallbackQuests(context, user.id)
            return {
                success: true,
                quests: fallbackQuests,
                warnings: ['AI servisi yanıt veremedi, önerilen görevler gösteriliyor.'],
                fallback_used: true
            }
        }

        // Enrich quests with goal context
        const enrichedQuests = enrichQuestsWithGoalContext(aiResponse.daily_quests, context)

        return {
            success: true,
            quests: enrichedQuests,
            nutrition_plan: aiResponse.nutrition_plan ? {
                daily_calorie_target: aiResponse.nutrition_plan.daily_calorie_target,
                protein_grams: aiResponse.nutrition_plan.protein_grams,
                carbs_grams: aiResponse.nutrition_plan.carbs_grams,
                fat_grams: aiResponse.nutrition_plan.fat_grams
            } : undefined,
            warnings: aiResponse.warnings,
            motivational_tip: aiResponse.motivational_tip,
            fallback_used: false
        }

    } catch (error) {
        console.error('[generateWizardQuests] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'
        }
    }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Fetch user health profile if available
 */
async function fetchHealthProfile(userId: string): Promise<HealthProfile | null> {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error || !data) return null

        return {
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            birth_date: data.birth_date,
            biological_sex: data.biological_sex,
            activity_level: data.activity_level,
            primary_goal: data.primary_goal,
            target_weight_kg: data.target_weight_kg ?? undefined,
            goal_pace: data.goal_pace,
            health_conditions: data.health_conditions || [],
            dietary_restrictions: data.dietary_restrictions || []
        }
    } catch {
        return null
    }
}

/**
 * Build AI context from wizard data and health profile
 */
function buildAIContext(
    wizard: WizardContext,
    healthProfile: HealthProfile | null
): UserHealthContext {
    // If health profile exists, use it for rich context
    if (healthProfile) {
        const metrics = calculateHealthMetrics(healthProfile)
        const age = calculateAge(healthProfile.birth_date)

        // Calculate duration in days
        let durationDays = 30
        if (wizard.start_date && wizard.end_date) {
            const start = new Date(wizard.start_date)
            const end = new Date(wizard.end_date)
            durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        }

        return {
            age_years: age,
            biological_sex: healthProfile.biological_sex,
            weight_kg: healthProfile.weight_kg,
            height_cm: healthProfile.height_cm,
            activity_level: healthProfile.activity_level,
            bmr_kcal: metrics.bmr_kcal,
            tdee_kcal: metrics.tdee_kcal,
            target_daily_kcal: metrics.target_daily_kcal,
            daily_adjustment: metrics.target_daily_kcal - metrics.tdee_kcal,
            protein_g: Math.round((metrics.target_daily_kcal * 0.30) / 4),
            carbs_g: Math.round((metrics.target_daily_kcal * 0.40) / 4),
            fat_g: Math.round((metrics.target_daily_kcal * 0.30) / 9),
            water_liters: Math.round(healthProfile.weight_kg * 0.033 * 10) / 10,
            primary_goal: healthProfile.primary_goal || inferGoalFromWizard(wizard),
            target_weight_kg: healthProfile.target_weight_kg,
            goal_pace: healthProfile.goal_pace || 'moderate',
            health_conditions: healthProfile.health_conditions || [],
            dietary_restrictions: healthProfile.dietary_restrictions || [],
            allergies: [],
            days_since_start: 0
        }
    }

    // Fallback: Create minimal context from wizard data only
    return {
        age_years: 30, // Default
        biological_sex: 'male',
        weight_kg: 75,
        height_cm: 175,
        activity_level: 'moderate',
        bmr_kcal: 1800,
        tdee_kcal: 2400,
        target_daily_kcal: 2000,
        daily_adjustment: -400,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 67,
        water_liters: 2.5,
        primary_goal: inferGoalFromWizard(wizard),
        goal_pace: 'moderate',
        health_conditions: [],
        dietary_restrictions: [],
        allergies: [],
        days_since_start: 0
    }
}

/**
 * Infer goal type from wizard data
 */
function inferGoalFromWizard(wizard: WizardContext): string {
    const title = wizard.goal_title.toLowerCase()
    const category = wizard.category_slug?.toLowerCase() || ''

    if (title.includes('kilo') && title.includes('ver')) return 'weight_loss'
    if (title.includes('kilo') && title.includes('al')) return 'weight_gain'
    if (title.includes('kas') || title.includes('muscle')) return 'muscle_gain'
    if (title.includes('koş') || title.includes('maraton')) return 'endurance'
    if (category === 'food' || category === 'sport') return 'weight_loss'

    return 'maintenance'
}

/**
 * Enrich AI quests with goal-specific context
 */
function enrichQuestsWithGoalContext(
    quests: AIGeneratedQuest[],
    wizard: WizardContext
): AIGeneratedQuest[] {
    return quests.map((quest, index) => ({
        ...quest,
        // Ensure XP is properly scaled based on difficulty
        xp_reward: quest.xp_reward || calculateXPReward(quest.difficulty, index),
        // Add goal-specific emoji if missing
        emoji: quest.emoji || getDefaultEmoji(quest.category),
        // Ensure scientific rationale exists
        scientific_rationale: quest.scientific_rationale ||
            `Bu görev "${wizard.goal_title}" hedefinize ulaşmanıza yardımcı olacak.`
    }))
}

/**
 * Calculate XP reward based on difficulty
 */
function calculateXPReward(difficulty: string, index: number): number {
    const baseXP = {
        easy: 10,
        medium: 20,
        hard: 35
    }
    const xp = baseXP[difficulty as keyof typeof baseXP] || 15
    // First 3 quests get bonus XP
    return index < 3 ? xp + 5 : xp
}

/**
 * Get default emoji for category
 */
function getDefaultEmoji(category: string): string {
    const emojis: Record<string, string> = {
        nutrition: '🥗',
        exercise: '🏃',
        habit: '✨',
        tracking: '📊',
        recovery: '😴'
    }
    return emojis[category] || '⭐'
}

/**
 * Fallback: Get quests from templates when AI fails
 */
async function getFallbackQuests(
    wizard: WizardContext,
    _userId: string
): Promise<AIGeneratedQuest[]> {
    try {
        // Import quest templates action
        const { getQuestTemplates } = await import('@/actions/quests')

        // Try to get goal-specific templates first
        if (wizard.goal_template_id) {
            const result = await getQuestTemplates(undefined, wizard.goal_template_id)

            if (result.data && result.data.length > 0) {
                return result.data.slice(0, 5).map(t => ({
                    title: t.title,
                    description: t.description || '',
                    category: mapCategoryToAI(t.category_slug),
                    difficulty: t.difficulty as 'easy' | 'medium' | 'hard',
                    estimated_minutes: 15,
                    calorie_impact: 0,
                    xp_reward: t.xp_reward,
                    emoji: t.emoji || '⭐',
                    scientific_rationale: 'Hedefine uygun önerilen görev.'
                }))
            }
        }

        // Fallback: Get category-based templates
        if (wizard.category_slug) {
            const result = await getQuestTemplates(wizard.category_slug as 'food' | 'sport' | 'dev' | 'etsy' | 'gaming' | undefined)

            if (result.data && result.data.length > 0) {
                return result.data.slice(0, 5).map(t => ({
                    title: t.title,
                    description: t.description || '',
                    category: mapCategoryToAI(t.category_slug),
                    difficulty: t.difficulty as 'easy' | 'medium' | 'hard',
                    estimated_minutes: 15,
                    calorie_impact: 0,
                    xp_reward: t.xp_reward,
                    emoji: t.emoji || '⭐',
                    scientific_rationale: 'Kategorine uygun önerilen görev.'
                }))
            }
        }

        // Last resort: Generic quests
        return getGenericQuests(wizard)

    } catch (error) {
        console.error('[getFallbackQuests] Error:', error)
        return getGenericQuests(wizard)
    }
}

/**
 * Map category slug to AI category
 */
function mapCategoryToAI(slug: string | null): AIGeneratedQuest['category'] {
    const mapping: Record<string, AIGeneratedQuest['category']> = {
        food: 'nutrition',
        sport: 'exercise',
        health: 'habit',
        finance: 'tracking',
        dev: 'habit'
    }
    return mapping[slug || ''] || 'habit'
}

/**
 * Generic quests when all else fails
 */
function getGenericQuests(wizard: WizardContext): AIGeneratedQuest[] {
    return [
        {
            title: 'Sabah Rutini',
            description: `"${wizard.goal_title}" hedefin için güne erken başla.`,
            category: 'habit',
            difficulty: 'easy',
            estimated_minutes: 15,
            calorie_impact: 0,
            xp_reward: 15,
            emoji: '🌅',
            scientific_rationale: 'Sabah rutini gün boyunca tutarlılık sağlar.',
            is_morning: true
        },
        {
            title: 'İlerleme Notu',
            description: 'Bugün hedefinle ilgili ne yaptığını kaydet.',
            category: 'tracking',
            difficulty: 'easy',
            estimated_minutes: 5,
            calorie_impact: 0,
            xp_reward: 10,
            emoji: '📝',
            scientific_rationale: 'Takip motivasyonu artırır ve hesap verebilirlik sağlar.',
            is_evening: true
        },
        {
            title: 'Odaklanma Seansı',
            description: `45 dakika "${wizard.goal_title}" üzerine çalış.`,
            category: 'habit',
            difficulty: 'medium',
            estimated_minutes: 45,
            calorie_impact: 0,
            xp_reward: 25,
            emoji: '🎯',
            scientific_rationale: 'Pomodoro tekniği derin odaklanma sağlar.'
        }
    ]
}
