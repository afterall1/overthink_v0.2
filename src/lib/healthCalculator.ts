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
    safety_warnings: SafetyWarning[]
    is_safe: boolean

    // Safety adjustment info
    safety_adjusted: boolean
    original_target_kcal?: number
}

export interface MacroBreakdown {
    protein_percent: number
    carbs_percent: number
    fat_percent: number
}

// =====================================================
// Safety Types
// =====================================================

export type SafetyWarningType = 'critical' | 'warning' | 'info'

export interface SafetyWarning {
    type: SafetyWarningType
    code: string
    title: string
    message: string
    explanation: string
}

export interface SafetyCheckResult {
    is_safe: boolean
    adjusted_target_kcal: number
    original_target_kcal: number
    adjusted_deficit: number
    original_deficit: number
    warnings: SafetyWarning[]
    recommendation: string | null
    adjustment_reason: string | null
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
 * Minimum safe calorie intake - ENHANCED with age factors
 */
const MIN_SAFE_CALORIES = {
    male: 1500,
    female: 1200
}

/**
 * Enhanced safe calorie limits with recommendations
 */
export const SAFE_CALORIE_LIMITS = {
    male: {
        absolute_minimum: 1500,      // Never go below (medical consensus)
        recommended_minimum: 1600,   // Warn if below this
        bmr_safety_factor: 1.0       // Target should be at least BMR × this
    },
    female: {
        absolute_minimum: 1200,
        recommended_minimum: 1400,
        bmr_safety_factor: 1.0
    }
}

/**
 * Age-based safety adjustment factors
 * Older individuals need slightly higher minimums due to:
 * - Slower metabolism recovery
 * - Higher nutrient needs
 * - Muscle preservation importance
 */
export const AGE_SAFETY_FACTORS: Record<string, { factor: number; label: string }> = {
    '18-25': { factor: 1.0, label: 'Genç yetişkin' },
    '26-35': { factor: 1.0, label: 'Yetişkin' },
    '36-45': { factor: 1.05, label: 'Orta yaş' },
    '46-55': { factor: 1.10, label: 'Orta yaş+' },
    '56-65': { factor: 1.15, label: 'Olgun yaş' },
    '65+': { factor: 1.20, label: 'Yaşlı yetişkin' }
}

/**
 * Maximum safe daily deficit
 */
const MAX_SAFE_DEFICIT = 1000

/**
 * Goal-specific maximum deficits
 */
export const GOAL_SPECIFIC_LIMITS: Record<PrimaryGoal, { max_deficit: number; max_surplus: number; notes: string }> = {
    weight_loss: { max_deficit: 1000, max_surplus: 0, notes: 'Protein koruması önemli' },
    weight_gain: { max_deficit: 0, max_surplus: 500, notes: 'Yağ birikimini önle' },
    maintenance: { max_deficit: 200, max_surplus: 200, notes: 'Denge koru' },
    muscle_gain: { max_deficit: 0, max_surplus: 500, notes: 'Kalori fazlası gerekli' },
    endurance: { max_deficit: 500, max_surplus: 300, notes: 'Karbonhidrat yeterliliği' }
}

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

/**
 * Get age bracket for safety factor lookup
 */
function getAgeBracket(age: number): string {
    if (age >= 65) return '65+'
    if (age >= 56) return '56-65'
    if (age >= 46) return '46-55'
    if (age >= 36) return '36-45'
    if (age >= 26) return '26-35'
    return '18-25'
}

/**
 * Comprehensive safety check for calorie targets
 * Returns adjusted target if necessary with detailed warnings
 */
export function performSafetyCheck(
    targetCalories: number,
    bmr: number,
    tdee: number,
    biologicalSex: BiologicalSex,
    ageYears: number,
    goalType: PrimaryGoal,
    originalDeficit: number
): SafetyCheckResult {
    const warnings: SafetyWarning[] = []
    let adjustedTarget = targetCalories
    let adjustedDeficit = originalDeficit
    let adjustmentReason: string | null = null
    let recommendation: string | null = null
    let isSafe = true

    // Get age-based safety factor
    const ageBracket = getAgeBracket(ageYears)
    const ageFactor = AGE_SAFETY_FACTORS[ageBracket]?.factor || 1.0

    // Get sex-based limits
    const limits = SAFE_CALORIE_LIMITS[biologicalSex]

    // Calculate age-adjusted minimum
    const ageAdjustedMinimum = Math.round(limits.absolute_minimum * ageFactor)
    const ageAdjustedRecommended = Math.round(limits.recommended_minimum * ageFactor)

    // Get goal-specific limits
    const goalLimits = GOAL_SPECIFIC_LIMITS[goalType]

    // Check 1: Below absolute minimum
    if (targetCalories < ageAdjustedMinimum) {
        isSafe = false
        const originalTarget = targetCalories
        adjustedTarget = ageAdjustedMinimum
        adjustedDeficit = tdee - adjustedTarget
        adjustmentReason = `Minimum güvenli kalori seviyesinin altında`

        warnings.push({
            type: 'critical',
            code: 'BELOW_MINIMUM',
            title: 'Kalori Hedefi Çok Düşük',
            message: `Hesaplanan günlük kalori hedefiniz (${originalTarget} kcal) güvenli sınırın altındaydı.`,
            explanation: `${biologicalSex === 'male' ? 'Erkekler' : 'Kadınlar'} için minimum güvenli günlük kalori alımı ${ageAdjustedMinimum} kcal'dir. ${ageYears >= 46 ? `Yaşınız (${ageYears}) nedeniyle bu sınır biraz yükseltilmiştir.` : ''} Bu seviyenin altına düşmek kas kaybına, metabolizma yavaşlamasına ve besin eksikliklerine yol açabilir.`
        })

        recommendation = `Hedefiniz ${adjustedTarget} kcal olarak ayarlandı. Bu, haftada ~${(adjustedDeficit * 7 / 7700).toFixed(2)} kg kaybetmenizi sağlar.`
    }

    // Check 2: Below recommended minimum (warning only)
    else if (targetCalories < ageAdjustedRecommended) {
        warnings.push({
            type: 'warning',
            code: 'BELOW_RECOMMENDED',
            title: 'Dikkatli Olun',
            message: `Günlük kalori hedefiniz (${targetCalories} kcal) önerilen sınırın altında.`,
            explanation: `Önerilen minimum ${ageAdjustedRecommended} kcal'dir. Bu seviyede devam edebilirsiniz ancak protein alımınızı artırmanız ve düzenli kontrol yapmanız önerilir.`
        })
    }

    // Check 3: Below BMR
    if (targetCalories < bmr) {
        warnings.push({
            type: 'warning',
            code: 'BELOW_BMR',
            title: 'BMR Altında',
            message: `Hedef kalori (${targetCalories} kcal) bazal metabolizma hızınızın (${bmr} kcal) altında.`,
            explanation: `BMR, vücudunuzun dinlenme halinde ihtiyaç duyduğu minimum kaloridir. Uzun süre bu seviyenin altında kalmak metabolizmanızı yavaşlatabilir.`
        })
    }

    // Check 4: Deficit too high for goal type
    const actualDeficit = Math.abs(originalDeficit)
    if (goalType === 'weight_loss' && actualDeficit > goalLimits.max_deficit) {
        if (adjustmentReason === null) {
            // Only adjust if not already adjusted
            adjustedDeficit = goalLimits.max_deficit
            adjustedTarget = tdee - goalLimits.max_deficit
            adjustmentReason = `Maksimum güvenli açık aşıldı`
            isSafe = false
        }

        warnings.push({
            type: 'warning',
            code: 'DEFICIT_TOO_HIGH',
            title: 'Açık Çok Yüksek',
            message: `Günlük ${actualDeficit} kcal açık, maksimum önerilen ${goalLimits.max_deficit} kcal'yi aşıyor.`,
            explanation: `Çok yüksek kalori açığı kas kaybına ve metabolizma adaptasyonuna yol açar. Haftada 1 kg'dan fazla kayıp sürdürülebilir değildir.`
        })
    }

    // Check 5: Age-specific warnings
    if (ageYears >= 65) {
        warnings.push({
            type: 'info',
            code: 'AGE_CONSIDERATION',
            title: 'Yaş Faktörü',
            message: 'Yaşınız göz önüne alındığında özel dikkat gerekiyor.',
            explanation: '65 yaş üstü bireyler için kas koruma çok önemlidir. Protein alımınızı vücut ağırlığınızın 1.2-1.5 katı gram olarak tutun ve düzenli direnç egzersizi yapın.'
        })
    }

    // Add goal-specific health protective notes
    if (goalType === 'weight_loss' && warnings.length > 0) {
        recommendation = recommendation || `Sağlığınız için günlük en az ${Math.round(bmr * 1.0)} kcal almanız ve haftada 0.5-0.75 kg kaybetmeniz önerilir.`
    }

    return {
        is_safe: isSafe,
        adjusted_target_kcal: adjustedTarget,
        original_target_kcal: targetCalories,
        adjusted_deficit: adjustedDeficit,
        original_deficit: originalDeficit,
        warnings,
        recommendation,
        adjustment_reason: adjustmentReason
    }
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

    // Calculate target calories with basic safety checks
    const goal = profile.primary_goal || 'maintenance'
    const pace = profile.goal_pace || 'moderate'

    const { targetCalories, adjustment, warnings: basicWarnings, isSafe: basicSafe } = calculateTargetCalories(
        tdee_kcal,
        goal,
        pace,
        profile.biological_sex
    )

    // Perform comprehensive safety check
    const safetyCheck = performSafetyCheck(
        targetCalories,
        bmr_kcal,
        tdee_kcal,
        profile.biological_sex,
        age_years,
        goal,
        adjustment
    )

    // Use adjusted target if safety check modified it
    const finalTargetCalories = safetyCheck.adjusted_target_kcal
    const finalAdjustment = safetyCheck.adjusted_deficit

    // Calculate macros based on final target
    const macros = calculateMacros(finalTargetCalories, goal)

    // Calculate water intake
    const water_liters = calculateWaterIntake(profile.weight_kg)

    // Calculate weekly weight change based on final adjustment
    const weeklyChange = Math.abs(finalAdjustment) * 7 / 7700 // 7700 kcal = 1 kg
    const weekly_weight_change_kg = goal === 'weight_loss' ? -weeklyChange :
        goal === 'weight_gain' || goal === 'muscle_gain' ? weeklyChange : 0

    // Add health condition warnings
    const healthWarnings = generateHealthWarnings(profile)

    // Combine all string warnings
    const allWarnings = [...basicWarnings, ...healthWarnings]
    if (safetyCheck.recommendation) {
        allWarnings.push(`💡 ${safetyCheck.recommendation}`)
    }

    return {
        age_years,
        bmr_kcal,
        tdee_kcal,
        target_daily_kcal: finalTargetCalories,
        daily_adjustment: finalAdjustment,
        weekly_weight_change_kg: Math.round(weekly_weight_change_kg * 100) / 100,
        macros,
        water_liters,
        warnings: allWarnings,
        safety_warnings: safetyCheck.warnings,
        is_safe: safetyCheck.is_safe && basicSafe && healthWarnings.length === 0,
        safety_adjusted: safetyCheck.original_target_kcal !== safetyCheck.adjusted_target_kcal,
        original_target_kcal: safetyCheck.original_target_kcal !== safetyCheck.adjusted_target_kcal
            ? safetyCheck.original_target_kcal
            : undefined
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
