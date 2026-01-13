'use strict'

// =====================================================
// Goal Context Types
// Determines what metrics/context to display based on goal type
// =====================================================

/**
 * Context type determines what metrics and prompts to show in UI
 */
export type GoalContextType =
    | 'calorie_deficit'   // Weight loss: BMR, TDEE, target calories
    | 'calorie_surplus'   // Weight/muscle gain: BMR, TDEE, protein focus
    | 'sugar_reduction'   // Sugar control: daily sugar tips
    | 'hydration'         // Water goals: daily liters
    | 'fasting'           // IF: fasting windows
    | 'streak_based'      // Day counting: no special metrics, just streak
    | 'activity'          // Steps/exercise: activity level focus
    | 'generic'           // No special context needed

/**
 * Maps goal template slugs to their appropriate context type
 */
export const GOAL_CONTEXT_MAP: Record<string, GoalContextType> = {
    // =====================================================
    // Calorie Deficit Goals (Weight Loss)
    // =====================================================
    'lose_weight': 'calorie_deficit',
    'lose_fat': 'calorie_deficit',

    // =====================================================
    // Calorie Surplus Goals (Weight/Muscle Gain)
    // =====================================================
    'gain_muscle': 'calorie_surplus',

    // =====================================================
    // Sugar Reduction Goals
    // =====================================================
    'reduce_sugar': 'sugar_reduction',

    // =====================================================
    // Hydration Goals
    // =====================================================
    'drink_water': 'hydration',

    // =====================================================
    // Fasting Goals
    // =====================================================
    'intermittent_fasting': 'fasting',

    // =====================================================
    // Activity/Exercise Goals
    // =====================================================
    'daily_steps': 'activity',
    'weekly_workouts': 'activity',
    'run_5k': 'activity',
    'run_10k': 'activity',
    'run_marathon': 'activity',
    'build_strength': 'activity',
    'flexibility': 'activity',
    'swimming_distance': 'activity',
    'cycling_distance': 'activity',

    // =====================================================
    // Streak-Based Goals (Count consecutive days)
    // =====================================================
    'eat_healthy': 'streak_based',
    'meal_prep': 'streak_based',
    'protein_goal': 'streak_based',

    // Dev category
    'learn_language': 'streak_based',
    'build_project': 'streak_based',
    'daily_commits': 'streak_based',
    'open_source': 'streak_based',
    'certification': 'streak_based',
    'leetcode': 'streak_based',
    'reading_tech': 'streak_based',
    'side_project': 'streak_based',

    // Trade category
    'trading_discipline': 'streak_based',
    'risk_management': 'streak_based',
    'profit_target': 'generic',
    'win_rate': 'generic',
    'journal_habit': 'streak_based',
    'market_study': 'streak_based',

    // Etsy category
    'monthly_revenue': 'generic',
    'new_listings': 'streak_based',
    'conversion_rate': 'generic',
    'customer_response': 'streak_based',
    'social_marketing': 'streak_based',
    'review_rating': 'generic',

    // Gaming category
    'rank_up': 'generic',
    'stream_consistency': 'streak_based',
    'game_completion': 'generic',
    'skill_improvement': 'streak_based',
    'content_creation': 'streak_based',
    'community_growth': 'generic',
}

/**
 * Get the context type for a given goal template slug
 * @param slug - Goal template slug
 * @returns The appropriate context type for UI display
 */
export function getGoalContextType(slug: string | undefined | null): GoalContextType {
    if (!slug) return 'generic'
    return GOAL_CONTEXT_MAP[slug] ?? 'generic'
}

/**
 * Check if a goal type needs health profile data (BMR/TDEE)
 * @param contextType - The goal context type
 * @returns True if health profile metrics are needed
 */
export function requiresHealthProfile(contextType: GoalContextType): boolean {
    return contextType === 'calorie_deficit' || contextType === 'calorie_surplus'
}

/**
 * Get a human-readable label for the context type (Turkish)
 */
export function getContextTypeLabel(contextType: GoalContextType): string {
    switch (contextType) {
        case 'calorie_deficit':
            return 'Kalori Açığı Hedefi'
        case 'calorie_surplus':
            return 'Kalori Fazlası Hedefi'
        case 'sugar_reduction':
            return 'Şeker Azaltma Hedefi'
        case 'hydration':
            return 'Hidrasyon Hedefi'
        case 'fasting':
            return 'Oruç Hedefi'
        case 'activity':
            return 'Aktivite Hedefi'
        case 'streak_based':
            return 'Alışkanlık Hedefi'
        case 'generic':
        default:
            return 'Genel Hedef'
    }
}
