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

    // KRITIK: SafeDateModal'dan gelen kullanicinin sectigi gunluk kalori acigi
    // Bu deger healthCalculator'dan gelen pace-based hesaplamadan ONCELIKLI
    daily_calorie_deficit?: number
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
 * Returns full unified profile for rich AI context
 */
async function fetchHealthProfile(userId: string): Promise<HealthProfile & {
    // Unified profile extended fields
    training_experience?: string
    training_types?: string[]
    gym_access?: string
    meals_per_day?: string
    cooks_at_home?: string
    fast_food_frequency?: string
    current_water_intake_liters?: number
    sugar_drinks_per_day?: number
    sugar_craving_trigger?: string
    sleep_quality?: string
    sleep_hours_avg?: number
    stress_level?: string
    sections_completed?: string[]
} | null> {
    try {
        const adminClient = createAdminClient()
        const { data, error } = await adminClient
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error || !data) return null

        // Cast to any for unified profile fields that may not exist in DB types yet
        // These fields are added by migration 20260115_unified_health_profile.sql
        const extendedData = data as Record<string, unknown>

        return {
            // Core HealthProfile fields
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            birth_date: data.birth_date,
            biological_sex: data.biological_sex as HealthProfile['biological_sex'],
            activity_level: data.activity_level as HealthProfile['activity_level'],
            primary_goal: data.primary_goal as HealthProfile['primary_goal'] ?? undefined,
            target_weight_kg: data.target_weight_kg ?? undefined,
            goal_pace: data.goal_pace as HealthProfile['goal_pace'] ?? undefined,
            health_conditions: data.health_conditions || [],
            dietary_restrictions: data.dietary_restrictions || [],
            // Unified profile extended fields (from migration)
            training_experience: (extendedData.training_experience as string) ?? undefined,
            training_types: (extendedData.training_types as string[]) ?? [],
            gym_access: (extendedData.gym_access as string) ?? undefined,
            meals_per_day: (extendedData.meals_per_day as string) ?? undefined,
            cooks_at_home: (extendedData.cooks_at_home as string) ?? undefined,
            fast_food_frequency: (extendedData.fast_food_frequency as string) ?? undefined,
            current_water_intake_liters: (extendedData.current_water_intake_liters as number) ?? undefined,
            sugar_drinks_per_day: (extendedData.sugar_drinks_per_day as number) ?? undefined,
            sugar_craving_trigger: (extendedData.sugar_craving_trigger as string) ?? undefined,
            sleep_quality: (extendedData.sleep_quality as string) ?? undefined,
            sleep_hours_avg: data.sleep_hours_avg ?? undefined,
            stress_level: data.stress_level ?? undefined,
            sections_completed: (extendedData.sections_completed as string[]) ?? []
        }
    } catch {
        return null
    }
}

/**
 * Build AI context from wizard data and health profile
 * IMPORTANT: Wizard goal type takes precedence over healthProfile.primary_goal
 * This ensures muscle_gain gets surplus, not deficit from a weight_loss profile
 */
function buildAIContext(
    wizard: WizardContext,
    healthProfile: HealthProfile | null
): UserHealthContext {
    // STEP 1: Always determine goal from wizard data first
    const wizardGoalType = inferGoalFromWizard(wizard)

    // STEP 2: Get wizard's explicit calorie deficit (from SafeDateModal selection)
    // This is the user's chosen value and takes PRIORITY over calculated values
    const wizardExplicitDeficit = wizard.daily_calorie_deficit

    console.log('[buildAIContext] Wizard explicit deficit:', wizardExplicitDeficit ?? 'not set')

    // If health profile exists, use it for rich context
    if (healthProfile) {
        const age = calculateAge(healthProfile.birth_date)

        // STEP 3: Create modified profile with WIZARD goal type, not profile's goal
        // This ensures calorie calculations match the wizard's goal, not the profile's legacy goal
        const modifiedProfile: HealthProfile = {
            ...healthProfile,
            primary_goal: mapGoalTypeToHealthGoal(wizardGoalType),
            // Keep pace from profile if available, otherwise moderate
            goal_pace: healthProfile.goal_pace || 'moderate'
        }

        // STEP 4: Calculate metrics using the WIZARD goal type
        const metrics = calculateHealthMetrics(modifiedProfile)

        // STEP 5: KRITIK - Wizard'dan gelen explicit deficit varsa, override yap!
        // Bu SafeDateModal'dan kullanicinin sectigi degerdir (ornegin 1000 kcal)
        // healthCalculator pace'e gore hesaplayabilir (500 kcal) ama kullanici 1000 secmis olabilir
        const finalDailyAdjustment = wizardExplicitDeficit
            ? -Math.abs(wizardExplicitDeficit)  // Deficit her zaman negatif olmali
            : metrics.daily_adjustment

        const finalTargetKcal = wizardExplicitDeficit
            ? metrics.tdee_kcal - Math.abs(wizardExplicitDeficit)
            : metrics.target_daily_kcal

        console.log('[buildAIContext] Final daily_adjustment:', finalDailyAdjustment,
            wizardExplicitDeficit ? '(from wizard)' : '(from healthCalculator)')

        // Calculate duration in days
        let durationDays = 30
        if (wizard.start_date && wizard.end_date) {
            const start = new Date(wizard.start_date)
            const end = new Date(wizard.end_date)
            durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        }

        // Get unified profile extended fields (cast for extended fields)
        const extendedProfile = healthProfile as unknown as Record<string, unknown>

        return {
            age_years: age,
            biological_sex: healthProfile.biological_sex,
            weight_kg: healthProfile.weight_kg,
            height_cm: healthProfile.height_cm,
            activity_level: healthProfile.activity_level,
            bmr_kcal: metrics.bmr_kcal,
            tdee_kcal: metrics.tdee_kcal,
            target_daily_kcal: finalTargetKcal,
            daily_adjustment: finalDailyAdjustment, // Now correctly uses wizard's explicit choice
            protein_g: metrics.macros.protein_g,
            carbs_g: metrics.macros.carbs_g,
            fat_g: metrics.macros.fat_g,
            water_liters: Math.round(healthProfile.weight_kg * 0.033 * 10) / 10,
            primary_goal: wizardGoalType, // Use wizard goal, not profile goal
            target_weight_kg: healthProfile.target_weight_kg,
            goal_pace: healthProfile.goal_pace || 'moderate',
            health_conditions: healthProfile.health_conditions || [],
            dietary_restrictions: healthProfile.dietary_restrictions || [],
            allergies: [],
            days_since_start: 0,
            // === UNIFIED PROFILE EXTENDED FIELDS ===
            training_experience: extendedProfile.training_experience as UserHealthContext['training_experience'],
            training_types: extendedProfile.training_types as string[] | undefined,
            gym_access: extendedProfile.gym_access as UserHealthContext['gym_access'],
            available_training_times: extendedProfile.available_training_times as string[] | undefined,
            meals_per_day: extendedProfile.meals_per_day as UserHealthContext['meals_per_day'],
            cooks_at_home: extendedProfile.cooks_at_home as UserHealthContext['cooks_at_home'],
            fast_food_frequency: extendedProfile.fast_food_frequency as UserHealthContext['fast_food_frequency'],
            has_breakfast: extendedProfile.has_breakfast as UserHealthContext['has_breakfast'],
            current_water_intake_liters: extendedProfile.current_water_intake_liters as number | undefined,
            sugar_drinks_per_day: extendedProfile.sugar_drinks_per_day as number | undefined,
            sugar_craving_trigger: extendedProfile.sugar_craving_trigger as UserHealthContext['sugar_craving_trigger'],
            accepts_artificial_sweeteners: extendedProfile.accepts_artificial_sweeteners as boolean | undefined,
            sleep_hours_avg: extendedProfile.sleep_hours_avg as number | undefined,
            sleep_quality: extendedProfile.sleep_quality as UserHealthContext['sleep_quality'],
            stress_level: extendedProfile.stress_level as UserHealthContext['stress_level'],
            sections_completed: extendedProfile.sections_completed as string[] | undefined
        }
    }

    // Fallback: Create minimal context from wizard data only
    // Use wizard goal to determine if surplus or deficit
    const isDeficitGoal = wizardGoalType === 'weight_loss'
    const isSurplusGoal = wizardGoalType === 'muscle_gain' || wizardGoalType === 'weight_gain'

    // KRITIK: Wizard'dan explicit deficit geldiyse onu kullan, yoksa varsayilan degerler
    const defaultAdjustment = wizardExplicitDeficit
        ? -Math.abs(wizardExplicitDeficit)
        : (isDeficitGoal ? -400 : (isSurplusGoal ? 300 : 0))

    console.log('[buildAIContext] Fallback mode, daily_adjustment:', defaultAdjustment)

    return {
        age_years: 30, // Default
        biological_sex: 'male',
        weight_kg: 75,
        height_cm: 175,
        activity_level: 'moderate',
        bmr_kcal: 1800,
        tdee_kcal: 2400,
        target_daily_kcal: 2400 + defaultAdjustment,
        daily_adjustment: defaultAdjustment,
        protein_g: 150,
        carbs_g: 200,
        fat_g: 67,
        water_liters: 2.5,
        primary_goal: wizardGoalType,
        goal_pace: 'moderate',
        health_conditions: [],
        dietary_restrictions: [],
        allergies: [],
        days_since_start: 0
    }
}

/**
 * Map goal type string to PrimaryGoal enum for healthCalculator
 */
function mapGoalTypeToHealthGoal(goalType: string): 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'endurance' {
    switch (goalType) {
        case 'weight_loss':
            return 'weight_loss'
        case 'muscle_gain':
            return 'muscle_gain'
        case 'weight_gain':
            return 'weight_gain'
        case 'endurance':
            return 'endurance'
        // For non-weight goals, use maintenance (no calorie adjustment)
        case 'drink_water':
        case 'reduce_sugar':
        case 'intermittent_fasting':
        case 'activity':
        case 'eat_healthy':
        default:
            return 'maintenance'
    }
}

/**
 * Infer goal type from wizard data
 * Uses template slug mapping first, then title-based inference
 */
function inferGoalFromWizard(wizard: WizardContext): string {
    const title = wizard.goal_title.toLowerCase()
    const category = wizard.category_slug?.toLowerCase() || ''

    // Priority 1: Detect from template slug if available (use goal-specific context mapping)
    // Template slugs like 'drink_water', 'reduce_sugar' should be detected here

    // Priority 2: Title-based detection for specific goal types
    // Hydration goals
    if (title.includes('su') || title.includes('water') || title.includes('hidrasyon') || title.includes('litre')) {
        return 'drink_water'
    }

    // Sugar reduction goals
    if (title.includes('şeker') || title.includes('sugar') || title.includes('tatlı')) {
        return 'reduce_sugar'
    }

    // Weight goals
    if (title.includes('kilo') && title.includes('ver')) return 'weight_loss'
    if (title.includes('kilo') && title.includes('al')) return 'weight_gain'

    // Muscle goals
    if (title.includes('kas') || title.includes('muscle') || title.includes('spor')) return 'muscle_gain'

    // Fasting goals
    if (title.includes('oruç') || title.includes('fasting') || title.includes('aralıklı')) return 'intermittent_fasting'

    // Activity goals
    if (title.includes('adım') || title.includes('steps') || title.includes('yürü')) return 'activity'

    // Endurance goals
    if (title.includes('koş') || title.includes('maraton')) return 'endurance'

    // Priority 3: Category-based fallback (only for truly generic cases)
    // This is the LAST resort, not the first
    if (category === 'sport') return 'muscle_gain'
    if (category === 'food') return 'eat_healthy'  // Changed from weight_loss

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
                    xp_reward: t.xp_reward ?? 10,
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
                    xp_reward: t.xp_reward ?? 10,
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
