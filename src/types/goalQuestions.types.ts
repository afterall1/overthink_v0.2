'use strict'

// =====================================================
// Goal-Specific Question Types
// Defines the structure for goal-specific questionnaires
// =====================================================

// =====================================================
// Question Types
// =====================================================

export type QuestionType =
    | 'single'      // Single choice (radio buttons)
    | 'multi'       // Multiple choice (checkboxes)
    | 'boolean'     // Yes/No toggle
    | 'slider'      // Numeric slider
    | 'time'        // Time picker

export interface QuestionOption {
    value: string
    label: string
    emoji?: string
    description?: string
}

export interface BaseQuestion {
    id: string
    type: QuestionType
    label: string
    emoji?: string
    required?: boolean
}

export interface SingleChoiceQuestion extends BaseQuestion {
    type: 'single'
    options: QuestionOption[]
}

export interface MultiChoiceQuestion extends BaseQuestion {
    type: 'multi'
    options: QuestionOption[]
    maxSelections?: number
}

export interface BooleanQuestion extends BaseQuestion {
    type: 'boolean'
    trueLabel?: string
    falseLabel?: string
}

export interface SliderQuestion extends BaseQuestion {
    type: 'slider'
    min: number
    max: number
    step: number
    unit: string
    defaultValue?: number
}

export interface TimeQuestion extends BaseQuestion {
    type: 'time'
    defaultValue?: string
}

export type Question =
    | SingleChoiceQuestion
    | MultiChoiceQuestion
    | BooleanQuestion
    | SliderQuestion
    | TimeQuestion

// =====================================================
// Goal-Specific Data Types
// =====================================================

export interface SugarQuestionData {
    sugar_drinks_per_day: 0 | 1 | 2 | 3 | 4
    sugar_sources: string[]
    biggest_trigger: string
    accepts_artificial_sweeteners: boolean
    previous_attempts: string
    has_sugar_at_home: boolean
}

export interface MuscleGainQuestionData {
    current_training: string
    training_types: string[]
    training_experience: string
    available_times: string[]
    gym_access: string
    meals_per_day: string
    uses_protein_powder: boolean
    sleep_quality: string
}

export interface HydrationQuestionData {
    current_intake_liters: number
    barriers: string[]
    forget_when: string
    has_water_bottle: boolean
    coffee_tea_cups: string
    sweat_level: string
}

export interface FastingQuestionData {
    preferred_protocol: string
    eating_window_start: string
    eating_window_end: string
    fasting_experience: string
    allows_zero_cal: boolean
    morning_hunger: string
    main_motivation: string
}

export interface WeightLossQuestionData {
    previous_diets: string
    struggles: string[]
    likes_cooking: string
    alcohol_frequency: string
    sleep_quality: string
}

export interface ActivityQuestionData {
    current_steps: number
    work_environment: string
    commute_method: string
    best_activity_time: string
    has_fitness_tracker: boolean
    more_active_weekends: string
}

export interface HealthyEatingQuestionData {
    meals_per_day: string
    cooks_at_home: string
    daily_vegetables: string
    biggest_challenge: string[]
    fast_food_frequency: string
    has_breakfast: string
}

// Union type for all question data
export type GoalQuestionData =
    | SugarQuestionData
    | MuscleGainQuestionData
    | HydrationQuestionData
    | FastingQuestionData
    | WeightLossQuestionData
    | ActivityQuestionData
    | HealthyEatingQuestionData

// =====================================================
// Goal Type to Question Data Mapping
// =====================================================

export type GoalSlugToQuestionData = {
    'reduce_sugar': Partial<SugarQuestionData>
    'gain_muscle': Partial<MuscleGainQuestionData>
    'drink_water': Partial<HydrationQuestionData>
    'intermittent_fasting': Partial<FastingQuestionData>
    'lose_weight': Partial<WeightLossQuestionData>
    'daily_steps': Partial<ActivityQuestionData>
    'eat_healthy': Partial<HealthyEatingQuestionData>
}

// =====================================================
// Helper to check if a goal has specific questions
// =====================================================

export const GOALS_WITH_QUESTIONS = [
    'reduce_sugar',
    'gain_muscle',
    'drink_water',
    'intermittent_fasting',
    'lose_weight',
    'daily_steps',
    'eat_healthy',
    'weekly_workouts',
    'meal_prep',
    'protein_goal'
] as const

export type GoalWithQuestions = typeof GOALS_WITH_QUESTIONS[number]

export function goalHasQuestions(slug: string): slug is GoalWithQuestions {
    return GOALS_WITH_QUESTIONS.includes(slug as GoalWithQuestions)
}
