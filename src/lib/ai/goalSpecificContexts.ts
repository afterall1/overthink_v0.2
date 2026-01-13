'use strict'

// =====================================================
// Goal-Specific Context Types
// Each goal type has its own context interface
// =====================================================

// =====================================================
// Base Context (Shared by all goals)
// =====================================================

export interface BaseHealthContext {
    // User basics
    age_years: number
    biological_sex: 'male' | 'female'
    weight_kg: number
    height_cm: number
    activity_level: string

    // Health considerations
    health_conditions: string[]
    dietary_restrictions: string[]
    allergies: string[]
}

// =====================================================
// Sugar Reduction Context
// =====================================================

export type SugarSource =
    | 'soft_drinks'      // Gazlı içecekler
    | 'juices'           // Meyve suları
    | 'coffee_tea'       // Şekerli kahve/çay
    | 'desserts'         // Tatlılar
    | 'snacks'           // Atıştırmalıklar
    | 'breakfast_cereal' // Kahvaltılık gevrek
    | 'hidden_sugar'     // İşlenmiş gıdalardaki gizli şeker

export type SugarTrigger =
    | 'morning_coffee'   // Sabah kahvesi
    | 'after_meals'      // Yemek sonrası
    | 'afternoon_slump'  // Öğleden sonra enerji düşüşü
    | 'late_night'       // Gece atıştırması
    | 'stress'           // Stres
    | 'social'           // Sosyal ortamlar

export type SugarReductionGoal =
    | 'eliminate'        // Tamamen bırak
    | 'reduce_75'        // %75 azalt
    | 'reduce_50'        // %50 azalt
    | 'reduce_moderate'  // Yavaş yavaş azalt

export interface SugarReductionContext extends BaseHealthContext {
    goal_type: 'reduce_sugar'

    // Sugar-specific data
    estimated_daily_sugar_drinks: 0 | 1 | 2 | 3 | 4  // 0=none, 4=4+
    sugar_sources: SugarSource[]
    biggest_trigger: SugarTrigger
    sugar_reduction_goal: SugarReductionGoal
    accepts_artificial_sweeteners: boolean

    // Optional extras
    previous_attempts?: number
    knows_hidden_sugars?: boolean
}

// =====================================================
// Weight Loss Context
// =====================================================

export interface WeightLossContext extends BaseHealthContext {
    goal_type: 'weight_loss'

    // Calculated values
    bmr_kcal: number
    tdee_kcal: number
    target_daily_kcal: number
    daily_adjustment: number

    // Targets
    target_weight_kg: number
    goal_pace: 'slow' | 'moderate' | 'aggressive'

    // Macros
    protein_g: number
    carbs_g: number
    fat_g: number
    water_liters: number

    // Progress (optional)
    days_since_start?: number
    weight_change_kg?: number
}

// =====================================================
// Muscle Gain Context
// =====================================================

export interface MuscleGainContext extends BaseHealthContext {
    goal_type: 'muscle_gain'

    // Calculated values
    bmr_kcal: number
    tdee_kcal: number
    target_daily_kcal: number
    daily_surplus: number

    // Targets
    target_weight_kg?: number
    goal_pace: 'slow' | 'moderate' | 'aggressive'

    // Macros (protein-focused)
    protein_g: number
    carbs_g: number
    fat_g: number
    water_liters: number

    // Training
    training_days_per_week: number
    training_experience: 'beginner' | 'intermediate' | 'advanced'
}

// =====================================================
// Fasting Context
// =====================================================

export type FastingProtocol = '16:8' | '18:6' | '20:4' | '5:2' | 'custom'

export interface FastingContext extends BaseHealthContext {
    goal_type: 'intermittent_fasting'

    // Fasting-specific
    preferred_protocol: FastingProtocol
    eating_window_start: string  // "12:00"
    eating_window_end: string    // "20:00"
    fasting_experience: 'beginner' | 'intermediate' | 'advanced'

    // Preferences
    allows_zero_cal_drinks: boolean  // Black coffee, tea during fast
    primary_reason: 'weight_loss' | 'health' | 'simplicity' | 'mental_clarity'
}

// =====================================================
// Hydration Context
// =====================================================

export interface HydrationContext extends BaseHealthContext {
    goal_type: 'drink_water'

    // Current state
    estimated_current_intake_liters: number
    target_intake_liters: number

    // Challenges
    main_barrier: 'forget' | 'taste' | 'inconvenient' | 'no_habit'
    owns_water_bottle: boolean

    // Preferences
    prefers_reminders: boolean
    drinks_other_fluids: string[]  // coffee, tea, juice
}

// =====================================================
// Activity/Steps Context
// =====================================================

export interface ActivityContext extends BaseHealthContext {
    goal_type: 'activity'

    // Current state
    current_daily_steps: number
    target_daily_steps: number

    // Work environment
    work_type: 'desk' | 'standing' | 'active' | 'remote'
    commute_method: 'car' | 'public' | 'walk' | 'bike' | 'none'

    // Preferences
    preferred_activity_time: 'morning' | 'lunch' | 'evening' | 'any'
    has_fitness_tracker: boolean
}

// =====================================================
// Healthy Eating Context (Streak-based)
// =====================================================

export interface HealthyEatingContext extends BaseHealthContext {
    goal_type: 'eat_healthy'

    // Focus areas
    focus_areas: ('vegetables' | 'whole_grains' | 'less_processed' | 'home_cooking' | 'balanced_meals')[]

    // Current habits
    meals_per_day: 2 | 3 | 4 | 5
    cooks_at_home: 'rarely' | 'sometimes' | 'often' | 'always'
    eats_vegetables_daily: boolean

    // Challenges
    biggest_challenge: 'time' | 'knowledge' | 'cravings' | 'social' | 'budget'
}

// =====================================================
// Union Type
// =====================================================

export type GoalSpecificContext =
    | SugarReductionContext
    | WeightLossContext
    | MuscleGainContext
    | FastingContext
    | HydrationContext
    | ActivityContext
    | HealthyEatingContext

// =====================================================
// Type Guards
// =====================================================

export function isSugarReductionContext(ctx: GoalSpecificContext): ctx is SugarReductionContext {
    return ctx.goal_type === 'reduce_sugar'
}

export function isWeightLossContext(ctx: GoalSpecificContext): ctx is WeightLossContext {
    return ctx.goal_type === 'weight_loss'
}

export function isMuscleGainContext(ctx: GoalSpecificContext): ctx is MuscleGainContext {
    return ctx.goal_type === 'muscle_gain'
}

export function isFastingContext(ctx: GoalSpecificContext): ctx is FastingContext {
    return ctx.goal_type === 'intermittent_fasting'
}

export function isHydrationContext(ctx: GoalSpecificContext): ctx is HydrationContext {
    return ctx.goal_type === 'drink_water'
}

export function isActivityContext(ctx: GoalSpecificContext): ctx is ActivityContext {
    return ctx.goal_type === 'activity'
}

export function isHealthyEatingContext(ctx: GoalSpecificContext): ctx is HealthyEatingContext {
    return ctx.goal_type === 'eat_healthy'
}

// =====================================================
// Goal Type Mapping
// =====================================================

export type GoalType = GoalSpecificContext['goal_type']

export const GOAL_TYPE_FROM_SLUG: Record<string, GoalType> = {
    // Sugar
    'reduce_sugar': 'reduce_sugar',

    // Weight
    'lose_weight': 'weight_loss',
    'lose_fat': 'weight_loss',

    // Muscle
    'gain_muscle': 'muscle_gain',

    // Fasting
    'intermittent_fasting': 'intermittent_fasting',

    // Hydration
    'drink_water': 'drink_water',

    // Activity
    'daily_steps': 'activity',
    'weekly_workouts': 'activity',

    // Healthy eating
    'eat_healthy': 'eat_healthy',
    'meal_prep': 'eat_healthy',
    'protein_goal': 'eat_healthy',
}

export function getGoalTypeFromSlug(slug: string): GoalType | null {
    return GOAL_TYPE_FROM_SLUG[slug] ?? null
}
