'use server'

// =====================================================
// AI Health Quests Server Action
// Generates personalized quests based on user health profile
// =====================================================

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import {
    calculateHealthMetrics,
    calculateAge,
    type HealthProfile
} from '@/lib/healthCalculator'
import {
    generateHealthQuests,
    type UserHealthContext,
    type AIGeneratedQuest
} from '@/lib/ai/healthCouncil'

// =====================================================
// Types
// =====================================================

export interface HealthProfileInput {
    weight_kg: number
    height_cm: number
    birth_date: string
    biological_sex: 'male' | 'female'
    activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extreme'
    sleep_hours_avg?: number
    stress_level?: 'low' | 'medium' | 'high'
    health_conditions?: string[]
    dietary_restrictions?: string[]
    allergies?: string[]
    primary_goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance'
    target_weight_kg?: number
    goal_pace?: 'slow' | 'moderate' | 'aggressive'
}

export interface HealthProfileResult {
    success: boolean
    profile?: HealthProfileInput & {
        id: string
        bmr_kcal: number
        tdee_kcal: number
        target_daily_kcal: number
    }
    error?: string
}

export interface AIQuestsResult {
    success: boolean
    quests?: AIGeneratedQuest[]
    nutrition_plan?: {
        daily_calorie_target: number
        protein_grams: number
        carbs_grams: number
        fat_grams: number
        meal_suggestions: string[]
    }
    warnings?: string[]
    motivational_tip?: string
    error?: string
}

// =====================================================
// Health Profile Actions
// =====================================================

/**
 * Create or update user health profile
 */
export async function upsertHealthProfile(
    input: HealthProfileInput
): Promise<HealthProfileResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        // Calculate health metrics
        const healthProfile: HealthProfile = {
            weight_kg: input.weight_kg,
            height_cm: input.height_cm,
            birth_date: input.birth_date,
            biological_sex: input.biological_sex,
            activity_level: input.activity_level,
            primary_goal: input.primary_goal,
            target_weight_kg: input.target_weight_kg,
            goal_pace: input.goal_pace,
            health_conditions: input.health_conditions,
            dietary_restrictions: input.dietary_restrictions
        }

        const metrics = calculateHealthMetrics(healthProfile)

        // Prepare data for upsert
        const profileData = {
            user_id: user.id,
            weight_kg: input.weight_kg,
            height_cm: input.height_cm,
            birth_date: input.birth_date,
            biological_sex: input.biological_sex,
            activity_level: input.activity_level,
            sleep_hours_avg: input.sleep_hours_avg || null,
            stress_level: input.stress_level || 'medium',
            health_conditions: input.health_conditions || [],
            dietary_restrictions: input.dietary_restrictions || [],
            allergies: input.allergies || [],
            primary_goal: input.primary_goal || 'maintenance',
            target_weight_kg: input.target_weight_kg || null,
            goal_pace: input.goal_pace || 'moderate',
            bmr_kcal: metrics.bmr_kcal,
            tdee_kcal: metrics.tdee_kcal,
            target_daily_kcal: metrics.target_daily_kcal,
            updated_at: new Date().toISOString()
        }

        // Use admin client for upsert to bypass RLS issues
        const adminClient = createAdminClient()

        const { data, error } = await adminClient
            .from('user_health_profiles')
            .upsert(profileData, {
                onConflict: 'user_id',
                ignoreDuplicates: false
            })
            .select()
            .single()

        if (error) {
            console.error('[upsertHealthProfile] Error:', error)
            return { success: false, error: `Profil kaydedilemedi: ${error.message}` }
        }

        return {
            success: true,
            profile: {
                ...input,
                id: data.id,
                bmr_kcal: metrics.bmr_kcal,
                tdee_kcal: metrics.tdee_kcal,
                target_daily_kcal: metrics.target_daily_kcal
            }
        }

    } catch (error) {
        console.error('[upsertHealthProfile] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'
        }
    }
}

/**
 * Get user health profile
 */
export async function getHealthProfile(): Promise<HealthProfileResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        const { data, error } = await supabase
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No profile found
                return { success: false, error: 'Henüz sağlık profili oluşturulmamış.' }
            }
            return { success: false, error: `Profil yüklenemedi: ${error.message}` }
        }

        return {
            success: true,
            profile: {
                id: data.id,
                weight_kg: data.weight_kg,
                height_cm: data.height_cm,
                birth_date: data.birth_date,
                biological_sex: data.biological_sex,
                activity_level: data.activity_level,
                sleep_hours_avg: data.sleep_hours_avg ?? undefined,
                stress_level: data.stress_level,
                health_conditions: data.health_conditions,
                dietary_restrictions: data.dietary_restrictions,
                allergies: data.allergies,
                primary_goal: data.primary_goal,
                target_weight_kg: data.target_weight_kg ?? undefined,
                goal_pace: data.goal_pace,
                bmr_kcal: data.bmr_kcal,
                tdee_kcal: data.tdee_kcal,
                target_daily_kcal: data.target_daily_kcal
            }
        }

    } catch (error) {
        console.error('[getHealthProfile] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'
        }
    }
}

// =====================================================
// AI Quest Generation Actions
// =====================================================

/**
 * Generate personalized daily quests using AI
 */
export async function generatePersonalizedQuests(
    goalId?: string
): Promise<AIQuestsResult> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        // Get health profile
        const { data: profile, error: profileError } = await supabase
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (profileError || !profile) {
            return {
                success: false,
                error: 'Sağlık profili bulunamadı. Önce profilinizi tamamlayın.'
            }
        }

        // Get goal if provided
        let goal = null
        if (goalId) {
            const { data: goalData } = await supabase
                .from('goals')
                .select('*')
                .eq('id', goalId)
                .eq('user_id', user.id)
                .single()
            goal = goalData
        }

        // Build context for AI
        const age = calculateAge(profile.birth_date)

        const context: UserHealthContext = {
            age_years: age,
            biological_sex: profile.biological_sex,
            weight_kg: profile.weight_kg,
            height_cm: profile.height_cm,
            activity_level: profile.activity_level,
            bmr_kcal: profile.bmr_kcal,
            tdee_kcal: profile.tdee_kcal,
            target_daily_kcal: profile.target_daily_kcal,
            daily_adjustment: profile.target_daily_kcal - profile.tdee_kcal,
            protein_g: Math.round((profile.target_daily_kcal * 0.30) / 4),
            carbs_g: Math.round((profile.target_daily_kcal * 0.40) / 4),
            fat_g: Math.round((profile.target_daily_kcal * 0.30) / 9),
            water_liters: Math.round(profile.weight_kg * 0.033 * 10) / 10,
            primary_goal: profile.primary_goal,
            target_weight_kg: profile.target_weight_kg ?? undefined,
            goal_pace: profile.goal_pace,
            health_conditions: profile.health_conditions || [],
            dietary_restrictions: profile.dietary_restrictions || [],
            allergies: profile.allergies || []
        }

        // Add goal context if available
        if (goal) {
            const startDate = new Date(goal.start_date)
            const today = new Date()
            context.days_since_start = Math.floor(
                (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
            )
        }

        // Generate quests using AI
        const aiResponse = await generateHealthQuests(context)

        if (!aiResponse.success) {
            return {
                success: false,
                quests: aiResponse.daily_quests,
                warnings: aiResponse.warnings,
                error: aiResponse.error
            }
        }

        return {
            success: true,
            quests: aiResponse.daily_quests,
            nutrition_plan: {
                daily_calorie_target: aiResponse.nutrition_plan.daily_calorie_target,
                protein_grams: aiResponse.nutrition_plan.protein_grams,
                carbs_grams: aiResponse.nutrition_plan.carbs_grams,
                fat_grams: aiResponse.nutrition_plan.fat_grams,
                meal_suggestions: aiResponse.nutrition_plan.meal_suggestions
            },
            warnings: aiResponse.warnings,
            motivational_tip: aiResponse.motivational_tip
        }

    } catch (error) {
        console.error('[generatePersonalizedQuests] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'
        }
    }
}

/**
 * Save AI-generated quests to database
 */
export async function saveAIGeneratedQuests(
    quests: AIGeneratedQuest[],
    goalId?: string
): Promise<{ success: boolean; questIds?: string[]; error?: string }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        const adminClient = createAdminClient()

        // First, delete existing AI-suggested quests for today
        const today = new Date().toISOString().split('T')[0]

        await adminClient
            .from('daily_quests')
            .delete()
            .eq('user_id', user.id)
            .eq('is_ai_suggested', true)
            .eq('scheduled_date', today)

        // Prepare quest data
        const questData = quests.map(quest => ({
            user_id: user.id,
            goal_id: goalId || null,
            title: quest.title,
            description: quest.description,
            emoji: quest.emoji,
            difficulty: quest.difficulty,
            xp_reward: quest.xp_reward,
            is_recurring: false,
            scheduled_date: today,
            status: 'pending' as const,
            is_ai_suggested: true
        }))

        // Insert quests
        const { data, error } = await adminClient
            .from('daily_quests')
            .insert(questData)
            .select('id')

        if (error) {
            console.error('[saveAIGeneratedQuests] Error:', error)
            return { success: false, error: `Görevler kaydedilemedi: ${error.message}` }
        }

        return {
            success: true,
            questIds: data.map(q => q.id)
        }

    } catch (error) {
        console.error('[saveAIGeneratedQuests] Exception:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata oluştu.'
        }
    }
}
