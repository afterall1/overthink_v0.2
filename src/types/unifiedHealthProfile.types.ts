'use strict'

// =====================================================
// Unified Health Profile Types
// Comprehensive user health profile for all goal types
// =====================================================

// =====================================================
// Base Types
// =====================================================

export type BiologicalSex = 'male' | 'female'

export type ActivityLevel =
    | 'sedentary'    // Little/no exercise, desk job
    | 'light'        // Light exercise 1-3 days/week
    | 'moderate'     // Moderate exercise 3-5 days/week
    | 'very_active'  // Hard exercise 6-7 days/week
    | 'extreme'      // Very hard exercise, physical job

export type PrimaryGoal =
    | 'weight_loss'
    | 'weight_gain'
    | 'maintenance'
    | 'muscle_gain'
    | 'endurance'

export type GoalPace = 'slow' | 'moderate' | 'aggressive'

// =====================================================
// New Unified Profile Types
// =====================================================

export type WorkEnvironment = 'desk' | 'mixed' | 'active' | 'standing'

export type BestActivityTime = 'morning' | 'afternoon' | 'evening' | 'flexible'

export type TrainingExperience = 'none' | 'beginner' | 'intermediate' | 'advanced'

export type TrainingType =
    | 'cardio'
    | 'weights'
    | 'hiit'
    | 'yoga'
    | 'crossfit'
    | 'swimming'
    | 'running'
    | 'cycling'
    | 'martial_arts'
    | 'team_sports'

export type GymAccess = 'full_gym' | 'home_gym' | 'outdoor' | 'none'

export type AvailableTime = 'morning_early' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night'

export type MealsPerDay = '2' | '3' | '4' | '5+'

export type CooksAtHome = 'always' | 'often' | 'sometimes' | 'rarely'

export type DailyVegetables = '0' | '1-2' | '3-4' | '5+'

export type FastFoodFrequency = 'never' | 'weekly' | 'few_times_week' | 'daily'

export type HasBreakfast = 'always' | 'sometimes' | 'rarely' | 'never'

export type AlcoholFrequency = 'never' | 'occasional' | 'weekly' | 'daily'

export type CoffeeTeaCups = '0' | '1-2' | '3-4' | '5+'

export type HydrationBarrier = 'forget' | 'taste' | 'access' | 'habit' | 'busy'

export type SugarCravingTrigger = 'morning_coffee' | 'after_lunch' | 'after_dinner' | 'late_night' | 'stress'

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent'

export type StressLevel = 'low' | 'medium' | 'high'

export type PreviousDietAttempts = 'never' | 'failed' | 'partial' | 'success'

export type MainStruggle =
    | 'emotional_eating'
    | 'portion_control'
    | 'late_night'
    | 'social_eating'
    | 'cravings'
    | 'motivation'
    | 'time'
    | 'cooking'
    | 'tracking'

// =====================================================
// Profile Section Types
// =====================================================

export type ProfileSection =
    | 'basic'           // Weight, height, age, sex
    | 'activity'        // Activity level, steps, work environment
    | 'training'        // Training experience, gym access
    | 'nutrition'       // Meals, cooking, vegetables
    | 'hydration_sugar' // Water intake, sugar habits
    | 'sleep'           // Sleep, stress
    | 'health'          // Health conditions, allergies
    | 'goals'           // Primary goal, target weight

// =====================================================
// Unified Health Profile Input Interface
// =====================================================

export interface UnifiedHealthProfileInput {
    // === BASIC (Required - Step 1) ===
    weight_kg: number
    height_cm: number
    birth_date: string
    biological_sex: BiologicalSex

    // === ACTIVITY (Required - Step 2) ===
    activity_level: ActivityLevel
    current_steps_avg?: number
    work_environment?: WorkEnvironment
    has_fitness_tracker?: boolean
    best_activity_time?: BestActivityTime

    // === TRAINING (Optional - Step 3) ===
    training_experience?: TrainingExperience
    training_types?: TrainingType[]
    gym_access?: GymAccess
    available_training_times?: AvailableTime[]

    // === NUTRITION (Optional - Step 4) ===
    meals_per_day?: MealsPerDay
    cooks_at_home?: CooksAtHome
    daily_vegetables?: DailyVegetables
    fast_food_frequency?: FastFoodFrequency
    has_breakfast?: HasBreakfast
    alcohol_frequency?: AlcoholFrequency

    // === HYDRATION & SUGAR (Optional - Step 5) ===
    current_water_intake_liters?: number
    coffee_tea_cups?: CoffeeTeaCups
    has_water_bottle?: boolean
    hydration_barriers?: HydrationBarrier[]
    sugar_drinks_per_day?: number
    sugar_sources?: string[]
    sugar_craving_trigger?: SugarCravingTrigger
    accepts_artificial_sweeteners?: boolean

    // === SLEEP & STRESS (Optional - Step 6) ===
    sleep_hours_avg?: number
    sleep_quality?: SleepQuality
    stress_level?: StressLevel

    // === HEALTH (Optional - Step 6) ===
    health_conditions?: string[]
    dietary_restrictions?: string[]
    allergies?: string[]
    uses_supplements?: boolean

    // === GOALS (Required - Step 7) ===
    primary_goal?: PrimaryGoal
    target_weight_kg?: number
    goal_pace?: GoalPace
    previous_diet_attempts?: PreviousDietAttempts
    main_struggles?: MainStruggle[]

    // === METADATA ===
    sections_completed?: ProfileSection[]
    profile_version?: number
}

// =====================================================
// Profile Result with Calculated Values
// =====================================================

export interface UnifiedHealthProfileResult {
    success: boolean
    profile?: UnifiedHealthProfileInput & {
        id: string
        user_id: string
        bmr_kcal: number
        tdee_kcal: number
        target_daily_kcal: number
        created_at: string
        updated_at: string
    }
    error?: string
}

// =====================================================
// Section-specific Validation
// =====================================================

export interface SectionValidation {
    isComplete: boolean
    missingFields: string[]
    completeness: number // 0-100
}

export type ProfileValidation = Record<ProfileSection, SectionValidation>

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get required fields for each section
 */
export const SECTION_REQUIRED_FIELDS: Record<ProfileSection, (keyof UnifiedHealthProfileInput)[]> = {
    basic: ['weight_kg', 'height_cm', 'birth_date', 'biological_sex'],
    activity: ['activity_level'],
    training: [], // All optional
    nutrition: [], // All optional
    hydration_sugar: [], // All optional
    sleep: [], // All optional
    health: [], // All optional
    goals: ['primary_goal']
}

/**
 * Get all fields for each section (for UI grouping)
 */
export const SECTION_ALL_FIELDS: Record<ProfileSection, (keyof UnifiedHealthProfileInput)[]> = {
    basic: ['weight_kg', 'height_cm', 'birth_date', 'biological_sex'],
    activity: ['activity_level', 'current_steps_avg', 'work_environment', 'has_fitness_tracker', 'best_activity_time'],
    training: ['training_experience', 'training_types', 'gym_access', 'available_training_times'],
    nutrition: ['meals_per_day', 'cooks_at_home', 'daily_vegetables', 'fast_food_frequency', 'has_breakfast', 'alcohol_frequency'],
    hydration_sugar: ['current_water_intake_liters', 'coffee_tea_cups', 'has_water_bottle', 'hydration_barriers', 'sugar_drinks_per_day', 'sugar_sources', 'sugar_craving_trigger', 'accepts_artificial_sweeteners'],
    sleep: ['sleep_hours_avg', 'sleep_quality', 'stress_level'],
    health: ['health_conditions', 'dietary_restrictions', 'allergies', 'uses_supplements'],
    goals: ['primary_goal', 'target_weight_kg', 'goal_pace', 'previous_diet_attempts', 'main_struggles']
}

/**
 * Check if a section is complete
 */
export function isSectionComplete(
    profile: Partial<UnifiedHealthProfileInput>,
    section: ProfileSection
): boolean {
    const requiredFields = SECTION_REQUIRED_FIELDS[section]
    return requiredFields.every(field => {
        const value = profile[field]
        if (value === undefined || value === null) return false
        if (typeof value === 'string' && value === '') return false
        if (Array.isArray(value) && value.length === 0) return false
        return true
    })
}

/**
 * Get overall profile completeness
 */
export function getProfileCompleteness(profile: Partial<UnifiedHealthProfileInput>): {
    overall: number
    sections: Record<ProfileSection, number>
} {
    const sections = Object.keys(SECTION_ALL_FIELDS) as ProfileSection[]
    const sectionScores: Record<ProfileSection, number> = {} as Record<ProfileSection, number>

    let totalFields = 0
    let completedFields = 0

    for (const section of sections) {
        const fields = SECTION_ALL_FIELDS[section]
        const completed = fields.filter(field => {
            const value = profile[field]
            if (value === undefined || value === null) return false
            if (typeof value === 'string' && value === '') return false
            return true
        }).length

        sectionScores[section] = Math.round((completed / fields.length) * 100)
        totalFields += fields.length
        completedFields += completed
    }

    return {
        overall: Math.round((completedFields / totalFields) * 100),
        sections: sectionScores
    }
}

/**
 * Get sections relevant to a goal type
 */
export function getRelevantSections(goalSlug: string): ProfileSection[] {
    const baseRequired: ProfileSection[] = ['basic', 'activity', 'goals']

    const goalSectionMap: Record<string, ProfileSection[]> = {
        'lose_weight': ['nutrition', 'sleep'],
        'gain_muscle': ['training', 'nutrition'],
        'weekly_workouts': ['training'],
        'reduce_sugar': ['hydration_sugar', 'nutrition'],
        'drink_water': ['hydration_sugar'],
        'intermittent_fasting': ['nutrition', 'sleep'],
        'eat_healthy': ['nutrition'],
        'daily_steps': ['activity'],
        'meal_prep': ['nutrition'],
        'protein_goal': ['nutrition', 'training']
    }

    return [...new Set([...baseRequired, ...(goalSectionMap[goalSlug] || [])])]
}
