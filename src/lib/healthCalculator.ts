'use strict'

// =====================================================
// Health Calculator Engine
// Mifflin-St Jeor BMR/TDEE formulas for personalized
// calorie and nutrition calculations
// =====================================================

// =====================================================
// Types
// =====================================================

export type BiologicalSex = 'male' | 'female'

export type ActivityLevel =
    | 'sedentary'    // Little/no exercise, desk job
    | 'light'        // Light exercise 1-3 days/week
    | 'moderate'     // Moderate exercise 3-5 days/week
    | 'very_active'  // Hard exercise 6-7 days/week
    | 'extreme'      // Very hard exercise, physical job, 2x daily training

export type PrimaryGoal =
    | 'weight_loss'
    | 'weight_gain'
    | 'maintenance'
    | 'muscle_gain'
    | 'endurance'

export type GoalPace = 'slow' | 'moderate' | 'aggressive'

export interface HealthProfile {
    weight_kg: number
    height_cm: number
    birth_date: string | Date
    biological_sex: BiologicalSex
    activity_level: ActivityLevel
    primary_goal?: PrimaryGoal
    target_weight_kg?: number
    goal_pace?: GoalPace
    health_conditions?: string[]
    dietary_restrictions?: string[]
}

export interface HealthCalculations {
    // Core metrics
    age_years: number
    bmr_kcal: number              // Basal Metabolic Rate
    tdee_kcal: number             // Total Daily Energy Expenditure
    target_daily_kcal: number     // With deficit/surplus

    // Deficit/Surplus info
    daily_adjustment: number       // Positive = surplus, Negative = deficit
    weekly_weight_change_kg: number

    // Macronutrient targets (grams)
    macros: {
        protein_g: number
        carbs_g: number
        fat_g: number
    }

    // Water intake recommendation
    water_liters: number

    // Warnings and safety
    warnings: string[]
    is_safe: boolean
}

export interface MacroBreakdown {
    protein_percent: number
    carbs_percent: number
    fat_percent: number
}

// =====================================================
// Constants
// =====================================================

/**
 * Activity level multipliers for TDEE calculation
 * Based on scientific literature and Harris-Benedict activity factors
 */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string; description: string }> = {
    sedentary: {
        multiplier: 1.2,
        label: 'Hareketsiz',
        description: 'Masa başı iş, minimum hareket'
    },
    light: {
        multiplier: 1.375,
        label: 'Az Hareketli',
        description: 'Hafif egzersiz, haftada 1-3 gün'
    },
    moderate: {
        multiplier: 1.55,
        label: 'Orta Hareketli',
        description: 'Orta yoğunluk egzersiz, haftada 3-5 gün'
    },
    very_active: {
        multiplier: 1.725,
        label: 'Çok Hareketli',
        description: 'Yoğun egzersiz, haftada 6-7 gün'
    },
    extreme: {
        multiplier: 1.9,
        label: 'Profesyonel',
        description: 'Günde 2 antrenman veya fiziksel iş'
    }
}

/**
 * Calorie deficit/surplus per pace setting
 * Based on safe weight loss recommendations (0.5-1kg/week)
 */
const PACE_ADJUSTMENTS: Record<GoalPace, { adjustment: number; weeklyChange: number; label: string }> = {
    slow: {
        adjustment: 300,     // ~0.3 kg/week
        weeklyChange: 0.3,
        label: 'Yavaş (Sürdürülebilir)'
    },
    moderate: {
        adjustment: 500,     // ~0.5 kg/week
        weeklyChange: 0.5,
        label: 'Orta (Önerilen)'
    },
    aggressive: {
        adjustment: 750,     // ~0.75 kg/week
        weeklyChange: 0.75,
        label: 'Hızlı (Zorlu)'
    }
}

/**
 * Macro ratios based on goal type
 */
const MACRO_RATIOS: Record<PrimaryGoal, MacroBreakdown> = {
    weight_loss: { protein_percent: 30, carbs_percent: 40, fat_percent: 30 },
    weight_gain: { protein_percent: 25, carbs_percent: 50, fat_percent: 25 },
    maintenance: { protein_percent: 25, carbs_percent: 50, fat_percent: 25 },
    muscle_gain: { protein_percent: 35, carbs_percent: 40, fat_percent: 25 },
    endurance: { protein_percent: 20, carbs_percent: 55, fat_percent: 25 }
}

/**
 * Minimum safe calorie intake
 */
const MIN_SAFE_CALORIES = {
    male: 1500,
    female: 1200
}

/**
 * Maximum safe daily deficit
 */
const MAX_SAFE_DEFICIT = 1000

// =====================================================
// Core Functions
// =====================================================

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: string | Date): number {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
    }

    return age
}

/**
 * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
 * This is the most accurate BMR formula according to research
 * 
 * Formula:
 * Men:   BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) + 5
 * Women: BMR = (10 × weight_kg) + (6.25 × height_cm) − (5 × age) − 161
 */
export function calculateBMR(
    weight_kg: number,
    height_cm: number,
    age_years: number,
    biological_sex: BiologicalSex
): number {
    const base = (10 * weight_kg) + (6.25 * height_cm) - (5 * age_years)

    if (biological_sex === 'male') {
        return Math.round(base + 5)
    } else {
        return Math.round(base - 161)
    }
}

/**
 * Calculate Total Daily Energy Expenditure
 * TDEE = BMR × Activity Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel].multiplier
    return Math.round(bmr * multiplier)
}

/**
 * Calculate target daily calories based on goal
 */
export function calculateTargetCalories(
    tdee: number,
    goal: PrimaryGoal,
    pace: GoalPace,
    biologicalSex: BiologicalSex
): { targetCalories: number; adjustment: number; warnings: string[]; isSafe: boolean } {
    const warnings: string[] = []
    let adjustment = 0

    // Determine adjustment based on goal
    if (goal === 'weight_loss') {
        adjustment = -PACE_ADJUSTMENTS[pace].adjustment
    } else if (goal === 'weight_gain' || goal === 'muscle_gain') {
        adjustment = PACE_ADJUSTMENTS[pace].adjustment
    }
    // maintenance and endurance = 0 adjustment

    let targetCalories = tdee + adjustment
    let isSafe = true

    // Safety checks
    const minCalories = MIN_SAFE_CALORIES[biologicalSex]

    if (targetCalories < minCalories) {
        warnings.push(`⚠️ Hesaplanan kalori (${targetCalories}) minimum güvenli seviyenin (${minCalories}) altında. Otomatik olarak düzeltildi.`)
        targetCalories = minCalories
        isSafe = false
    }

    if (Math.abs(adjustment) > MAX_SAFE_DEFICIT) {
        warnings.push(`⚠️ Günlük ${Math.abs(adjustment)} kcal açık/fazla sağlık açısından riskli olabilir.`)
        isSafe = false
    }

    return { targetCalories, adjustment, warnings, isSafe }
}

/**
 * Calculate macronutrient targets in grams
 */
export function calculateMacros(
    targetCalories: number,
    goal: PrimaryGoal
): { protein_g: number; carbs_g: number; fat_g: number } {
    const ratios = MACRO_RATIOS[goal]

    // Calories per gram: Protein=4, Carbs=4, Fat=9
    const protein_g = Math.round((targetCalories * ratios.protein_percent / 100) / 4)
    const carbs_g = Math.round((targetCalories * ratios.carbs_percent / 100) / 4)
    const fat_g = Math.round((targetCalories * ratios.fat_percent / 100) / 9)

    return { protein_g, carbs_g, fat_g }
}

/**
 * Calculate recommended water intake
 * General formula: 30-35ml per kg of body weight
 */
export function calculateWaterIntake(weight_kg: number): number {
    const mlPerKg = 33 // Middle of 30-35 range
    const totalMl = weight_kg * mlPerKg
    return Math.round(totalMl / 1000 * 10) / 10 // Convert to liters, round to 1 decimal
}

// =====================================================
// Main Calculator Function
// =====================================================

/**
 * Complete health calculation from profile
 */
export function calculateHealthMetrics(profile: HealthProfile): HealthCalculations {
    // Calculate age
    const age_years = calculateAge(profile.birth_date)

    // Calculate BMR
    const bmr_kcal = calculateBMR(
        profile.weight_kg,
        profile.height_cm,
        age_years,
        profile.biological_sex
    )

    // Calculate TDEE
    const tdee_kcal = calculateTDEE(bmr_kcal, profile.activity_level)

    // Calculate target calories with safety checks
    const goal = profile.primary_goal || 'maintenance'
    const pace = profile.goal_pace || 'moderate'

    const { targetCalories, adjustment, warnings, isSafe } = calculateTargetCalories(
        tdee_kcal,
        goal,
        pace,
        profile.biological_sex
    )

    // Calculate macros
    const macros = calculateMacros(targetCalories, goal)

    // Calculate water intake
    const water_liters = calculateWaterIntake(profile.weight_kg)

    // Calculate weekly weight change
    const weeklyChange = PACE_ADJUSTMENTS[pace].weeklyChange
    const weekly_weight_change_kg = goal === 'weight_loss' ? -weeklyChange :
        goal === 'weight_gain' || goal === 'muscle_gain' ? weeklyChange : 0

    // Add health condition warnings
    const healthWarnings = generateHealthWarnings(profile)

    return {
        age_years,
        bmr_kcal,
        tdee_kcal,
        target_daily_kcal: targetCalories,
        daily_adjustment: adjustment,
        weekly_weight_change_kg,
        macros,
        water_liters,
        warnings: [...warnings, ...healthWarnings],
        is_safe: isSafe && healthWarnings.length === 0
    }
}

/**
 * Generate health condition specific warnings
 */
function generateHealthWarnings(profile: HealthProfile): string[] {
    const warnings: string[] = []
    const conditions = profile.health_conditions || []

    if (conditions.includes('diabetes')) {
        warnings.push('🩺 Diyabet: Karbonhidrat alımını takip et, düşük glisemik indeksli yiyecekler tercih et.')
    }

    if (conditions.includes('hypertension')) {
        warnings.push('🩺 Tansiyon: Tuz alımını günlük 2g altında tut, potasyum zengin gıdalar tüket.')
    }

    if (conditions.includes('heart_disease')) {
        warnings.push('🩺 Kalp: Yoğun egzersiz öncesi doktor onayı al, doymuş yağları sınırla.')
    }

    if (conditions.includes('thyroid')) {
        warnings.push('🩺 Tiroid: Metabolizma değişkenlik gösterebilir, düzenli kontrol önemli.')
    }

    return warnings
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get activity level label and description
 */
export function getActivityLevelInfo(level: ActivityLevel): { label: string; description: string } {
    return {
        label: ACTIVITY_MULTIPLIERS[level].label,
        description: ACTIVITY_MULTIPLIERS[level].description
    }
}

/**
 * Get pace info
 */
export function getPaceInfo(pace: GoalPace): { weeklyChange: number; label: string } {
    return {
        weeklyChange: PACE_ADJUSTMENTS[pace].weeklyChange,
        label: PACE_ADJUSTMENTS[pace].label
    }
}

/**
 * Estimate time to reach target weight
 */
export function estimateTimeToGoal(
    currentWeight: number,
    targetWeight: number,
    weeklyChange: number
): { weeks: number; months: number } {
    const weightDiff = Math.abs(targetWeight - currentWeight)
    const weeks = Math.ceil(weightDiff / Math.abs(weeklyChange))
    const months = Math.ceil(weeks / 4.33) // Average weeks per month

    return { weeks, months }
}

/**
 * Validate health profile data
 */
export function validateHealthProfile(profile: Partial<HealthProfile>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!profile.weight_kg || profile.weight_kg < 30 || profile.weight_kg > 300) {
        errors.push('Kilo 30-300 kg arasında olmalı')
    }

    if (!profile.height_cm || profile.height_cm < 100 || profile.height_cm > 250) {
        errors.push('Boy 100-250 cm arasında olmalı')
    }

    if (!profile.birth_date) {
        errors.push('Doğum tarihi gerekli')
    } else {
        const age = calculateAge(profile.birth_date)
        if (age < 13 || age > 120) {
            errors.push('Yaş 13-120 arasında olmalı')
        }
    }

    if (!profile.biological_sex || !['male', 'female'].includes(profile.biological_sex)) {
        errors.push('Cinsiyet seçimi gerekli')
    }

    if (!profile.activity_level || !Object.keys(ACTIVITY_MULTIPLIERS).includes(profile.activity_level)) {
        errors.push('Aktivite seviyesi seçimi gerekli')
    }

    return { valid: errors.length === 0, errors }
}
