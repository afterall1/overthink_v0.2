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
import {
    calculateProfileDelta,
    type ProfileDelta
} from './profileDelta'
import {
    regenerateRemainingQuestDays,
    type RegenerationResult
} from './questRegeneration'

// =====================================================
// Types
// =====================================================

export interface HealthProfileInput {
    // === BASIC (Required) ===
    weight_kg: number
    height_cm: number
    birth_date: string
    biological_sex: 'male' | 'female'
    activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extreme'

    // === ACTIVITY (Extended) ===
    current_steps_avg?: number
    work_environment?: 'desk' | 'mixed' | 'active' | 'standing'
    has_fitness_tracker?: boolean
    best_activity_time?: 'morning' | 'afternoon' | 'evening' | 'flexible'

    // === TRAINING ===
    training_experience?: 'none' | 'beginner' | 'intermediate' | 'advanced'
    training_types?: string[]
    gym_access?: 'full_gym' | 'home_gym' | 'outdoor' | 'none'
    available_training_times?: string[]

    // === NUTRITION ===
    meals_per_day?: '2' | '3' | '4' | '5+'
    cooks_at_home?: 'always' | 'often' | 'sometimes' | 'rarely'
    daily_vegetables?: '0' | '1-2' | '3-4' | '5+'
    fast_food_frequency?: 'never' | 'weekly' | 'few_times_week' | 'daily'
    has_breakfast?: 'always' | 'sometimes' | 'rarely' | 'never'
    alcohol_frequency?: 'never' | 'occasional' | 'weekly' | 'daily'

    // === HYDRATION & SUGAR ===
    current_water_intake_liters?: number
    coffee_tea_cups?: '0' | '1-2' | '3-4' | '5+'
    has_water_bottle?: boolean
    hydration_barriers?: string[]
    sugar_drinks_per_day?: number
    sugar_sources?: string[]
    sugar_craving_trigger?: 'morning_coffee' | 'after_lunch' | 'after_dinner' | 'late_night' | 'stress'
    accepts_artificial_sweeteners?: boolean

    // === SLEEP & STRESS ===
    sleep_hours_avg?: number
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent'
    stress_level?: 'low' | 'medium' | 'high'

    // === HEALTH ===
    health_conditions?: string[]
    dietary_restrictions?: string[]
    allergies?: string[]
    uses_supplements?: boolean

    // === GOALS ===
    primary_goal?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance'
    target_weight_kg?: number
    goal_pace?: 'slow' | 'moderate' | 'aggressive'
    previous_diet_attempts?: 'never' | 'failed' | 'partial' | 'success'
    main_struggles?: string[]

    // === METADATA ===
    sections_completed?: string[]
    profile_version?: number
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
 * If significant changes are detected, regenerates remaining quest days
 */
export async function upsertHealthProfile(
    input: HealthProfileInput
): Promise<HealthProfileResult & { regeneration?: RegenerationResult; delta?: ProfileDelta }> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { success: false, error: 'Oturum açmanız gerekiyor.' }
        }

        // Fetch existing profile for delta comparison
        const { data: existingProfile } = await supabase
            .from('user_health_profiles')
            .select('weight_kg, activity_level, target_weight_kg, goal_pace, tdee_kcal, target_daily_kcal')
            .eq('user_id', user.id)
            .single()

        // Calculate health metrics for new input
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

        // Calculate delta if existing profile exists
        let delta: ProfileDelta | undefined
        if (existingProfile) {
            const oldDailyAdjustment = (existingProfile.target_daily_kcal ?? 0) - (existingProfile.tdee_kcal ?? 0)
            delta = calculateProfileDelta(
                {
                    daily_adjustment: oldDailyAdjustment,
                    weight_kg: existingProfile.weight_kg ?? 0,
                    activity_level: existingProfile.activity_level ?? 'moderate',
                    target_weight_kg: existingProfile.target_weight_kg,
                    goal_pace: existingProfile.goal_pace
                },
                {
                    daily_adjustment: metrics.daily_adjustment,
                    weight_kg: input.weight_kg,
                    activity_level: input.activity_level,
                    target_weight_kg: input.target_weight_kg,
                    goal_pace: input.goal_pace
                }
            )
            console.log('[upsertHealthProfile] Profile delta:', delta)
        }

        // Prepare data for upsert - include all unified profile fields
        const profileData = {
            user_id: user.id,
            // Basic
            weight_kg: input.weight_kg,
            height_cm: input.height_cm,
            birth_date: input.birth_date,
            biological_sex: input.biological_sex,
            activity_level: input.activity_level,
            // Activity Extended
            current_steps_avg: input.current_steps_avg ?? null,
            work_environment: input.work_environment ?? null,
            has_fitness_tracker: input.has_fitness_tracker ?? false,
            best_activity_time: input.best_activity_time ?? null,
            // Training
            training_experience: input.training_experience ?? null,
            training_types: input.training_types ?? [],
            gym_access: input.gym_access ?? null,
            available_training_times: input.available_training_times ?? [],
            // Nutrition
            meals_per_day: input.meals_per_day ?? null,
            cooks_at_home: input.cooks_at_home ?? null,
            daily_vegetables: input.daily_vegetables ?? null,
            fast_food_frequency: input.fast_food_frequency ?? null,
            has_breakfast: input.has_breakfast ?? null,
            alcohol_frequency: input.alcohol_frequency ?? null,
            // Hydration & Sugar
            current_water_intake_liters: input.current_water_intake_liters ?? 1.5,
            coffee_tea_cups: input.coffee_tea_cups ?? null,
            has_water_bottle: input.has_water_bottle ?? false,
            hydration_barriers: input.hydration_barriers ?? [],
            sugar_drinks_per_day: input.sugar_drinks_per_day ?? 0,
            sugar_sources: input.sugar_sources ?? [],
            sugar_craving_trigger: input.sugar_craving_trigger ?? null,
            accepts_artificial_sweeteners: input.accepts_artificial_sweeteners ?? true,
            // Sleep & Stress
            sleep_hours_avg: input.sleep_hours_avg ?? null,
            sleep_quality: input.sleep_quality ?? null,
            stress_level: input.stress_level ?? 'medium',
            // Health
            health_conditions: input.health_conditions ?? [],
            dietary_restrictions: input.dietary_restrictions ?? [],
            allergies: input.allergies ?? [],
            uses_supplements: input.uses_supplements ?? false,
            // Goals
            primary_goal: input.primary_goal ?? 'maintenance',
            target_weight_kg: input.target_weight_kg ?? null,
            goal_pace: input.goal_pace ?? 'moderate',
            previous_diet_attempts: input.previous_diet_attempts ?? null,
            main_struggles: input.main_struggles ?? [],
            // Metadata
            sections_completed: input.sections_completed ?? [],
            profile_version: input.profile_version ?? 2,
            // Calculated
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

        // If significant changes detected, regenerate remaining quest days
        let regeneration: RegenerationResult | undefined
        if (delta?.isSignificant) {
            console.log('[upsertHealthProfile] Significant changes detected, regenerating quests...')
            console.log('[upsertHealthProfile] Changes:', delta.summary)

            // Build AI context for regeneration
            const age = calculateAge(input.birth_date)
            const aiContext: UserHealthContext = {
                age_years: age,
                biological_sex: input.biological_sex,
                weight_kg: input.weight_kg,
                height_cm: input.height_cm,
                activity_level: input.activity_level,
                bmr_kcal: metrics.bmr_kcal,
                tdee_kcal: metrics.tdee_kcal,
                target_daily_kcal: metrics.target_daily_kcal,
                daily_adjustment: metrics.daily_adjustment,
                protein_g: metrics.macros.protein_g,
                carbs_g: metrics.macros.carbs_g,
                fat_g: metrics.macros.fat_g,
                water_liters: metrics.water_liters,
                primary_goal: input.primary_goal,
                target_weight_kg: input.target_weight_kg,
                goal_pace: input.goal_pace,
                health_conditions: input.health_conditions || [],
                dietary_restrictions: input.dietary_restrictions || [],
                allergies: input.allergies || [],
                training_experience: input.training_experience,
                training_types: input.training_types,
                gym_access: input.gym_access,
                meals_per_day: input.meals_per_day,
                cooks_at_home: input.cooks_at_home,
                fast_food_frequency: input.fast_food_frequency,
                current_water_intake_liters: input.current_water_intake_liters,
                sugar_drinks_per_day: input.sugar_drinks_per_day,
                sleep_quality: input.sleep_quality,
                stress_level: input.stress_level
            }

            regeneration = await regenerateRemainingQuestDays(user.id, aiContext)
            console.log('[upsertHealthProfile] Regeneration result:', regeneration)
        }

        return {
            success: true,
            profile: {
                ...input,
                id: data.id,
                bmr_kcal: metrics.bmr_kcal,
                tdee_kcal: metrics.tdee_kcal,
                target_daily_kcal: metrics.target_daily_kcal
            },
            delta,
            regeneration
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

        // Cast to any for unified profile fields not yet in DB types
        const extendedData = data as Record<string, unknown>

        return {
            success: true,
            profile: {
                id: data.id,
                weight_kg: data.weight_kg,
                height_cm: data.height_cm,
                birth_date: data.birth_date,
                biological_sex: data.biological_sex as 'male' | 'female',
                activity_level: data.activity_level as 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extreme',
                sleep_hours_avg: data.sleep_hours_avg ?? undefined,
                stress_level: (data.stress_level ?? undefined) as 'low' | 'medium' | 'high' | undefined,
                health_conditions: data.health_conditions ?? undefined,
                dietary_restrictions: data.dietary_restrictions ?? undefined,
                allergies: data.allergies ?? undefined,
                primary_goal: (data.primary_goal ?? undefined) as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance' | undefined,
                target_weight_kg: data.target_weight_kg ?? undefined,
                goal_pace: (data.goal_pace ?? undefined) as 'slow' | 'moderate' | 'aggressive' | undefined,
                bmr_kcal: data.bmr_kcal ?? 0,
                tdee_kcal: data.tdee_kcal ?? 0,
                target_daily_kcal: data.target_daily_kcal ?? 0,
                // Unified profile extended fields - type assertions for literal types
                training_experience: (extendedData.training_experience as HealthProfileInput['training_experience']) ?? undefined,
                training_types: (extendedData.training_types as string[]) ?? undefined,
                gym_access: (extendedData.gym_access as HealthProfileInput['gym_access']) ?? undefined,
                meals_per_day: (extendedData.meals_per_day as HealthProfileInput['meals_per_day']) ?? undefined,
                cooks_at_home: (extendedData.cooks_at_home as HealthProfileInput['cooks_at_home']) ?? undefined,
                fast_food_frequency: (extendedData.fast_food_frequency as HealthProfileInput['fast_food_frequency']) ?? undefined,
                current_water_intake_liters: (extendedData.current_water_intake_liters as number) ?? undefined,
                sugar_drinks_per_day: (extendedData.sugar_drinks_per_day as number) ?? undefined,
                sugar_craving_trigger: (extendedData.sugar_craving_trigger as HealthProfileInput['sugar_craving_trigger']) ?? undefined,
                sleep_quality: (extendedData.sleep_quality as HealthProfileInput['sleep_quality']) ?? undefined,
                sections_completed: (extendedData.sections_completed as string[]) ?? undefined,
                profile_version: (extendedData.profile_version as number) ?? 1
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

        // Extract values with null safety
        const bmrKcal = profile.bmr_kcal ?? 0
        const tdeeKcal = profile.tdee_kcal ?? 0
        const targetDailyKcal = profile.target_daily_kcal ?? 0

        const context: UserHealthContext = {
            age_years: age,
            biological_sex: profile.biological_sex as 'male' | 'female',
            weight_kg: profile.weight_kg,
            height_cm: profile.height_cm,
            activity_level: profile.activity_level as 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extreme',
            bmr_kcal: bmrKcal,
            tdee_kcal: tdeeKcal,
            target_daily_kcal: targetDailyKcal,
            daily_adjustment: targetDailyKcal - tdeeKcal,
            protein_g: Math.round((targetDailyKcal * 0.30) / 4),
            carbs_g: Math.round((targetDailyKcal * 0.40) / 4),
            fat_g: Math.round((targetDailyKcal * 0.30) / 9),
            water_liters: Math.round(profile.weight_kg * 0.033 * 10) / 10,
            primary_goal: (profile.primary_goal ?? undefined) as 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance' | undefined,
            target_weight_kg: profile.target_weight_kg ?? undefined,
            goal_pace: (profile.goal_pace ?? undefined) as 'slow' | 'moderate' | 'aggressive' | undefined,
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
        // CRITICAL FIX: AI-generated quests should be RECURRING to show every day until goal ends
        // This enables the daily quest auto-generation feature without DB bloat
        const questData = quests.map(quest => ({
            user_id: user.id,
            goal_id: goalId || null,
            title: quest.title,
            description: quest.description,
            emoji: quest.emoji,
            difficulty: quest.difficulty,
            xp_reward: quest.xp_reward,
            is_recurring: true,  // FIX: Changed from false to true
            recurrence_pattern: 'daily' as const,  // FIX: Added daily pattern
            scheduled_date: today,  // First appearance date
            status: 'pending' as const,
            is_ai_suggested: true,
            progress_contribution: 1  // Each completion contributes to goal progress
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
