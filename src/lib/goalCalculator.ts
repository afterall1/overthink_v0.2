'use strict'

// =====================================================
// Goal Calculator Engine
// Scientific formulas for intelligent goal calculations
// =====================================================

// =====================================================
// Types
// =====================================================

export interface GoalCalculationInput {
    goalType: GoalCalculationType
    targetValue: number
    unit: string
    startDate: string
    endDate: string
    categorySlug?: string
}

export type GoalCalculationType =
    | 'weight_loss'
    | 'weight_gain'
    | 'running_distance'
    | 'strength_training'
    | 'habit_building'
    | 'project_completion'
    | 'financial_target'
    | 'generic'

export interface BreakdownItem {
    label: string
    value: number | string
    unit: string
    emoji: string
}

export type FeasibilityLevel = 'easy' | 'moderate' | 'challenging' | 'extreme' | 'unrealistic'

export interface GoalCalculation {
    // Core metrics
    totalDays: number
    dailyTarget: number
    weeklyTarget: number
    monthlyTarget: number
    targetUnit: string

    // Category-specific breakdown
    breakdown: BreakdownItem[]

    // Feasibility assessment (0-100)
    feasibility: FeasibilityLevel
    feasibilityScore: number
    feasibilityColor: string

    // Warnings and tips
    warnings: string[]
    tips: string[]

    // Recommended quest template slugs
    recommendedQuestSlugs: string[]
}

// =====================================================
// Constants
// =====================================================

/**
 * Scientific constants for calculations
 */
const KCAL_PER_KG = 7700 // Approximate calories to lose/gain 1 kg of body weight

/**
 * Feasibility thresholds for weight loss (kcal/day)
 */
const WEIGHT_LOSS_THRESHOLDS = {
    easy: 500,        // < 500 kcal/day
    moderate: 750,    // 500-750 kcal/day
    challenging: 1000, // 750-1000 kcal/day
    extreme: 1500,    // 1000-1500 kcal/day
    // > 1500 = unrealistic
}

/**
 * Activity calorie burn estimates (approximate per hour or km)
 */
const CALORIE_ESTIMATES = {
    running_per_km: 100,      // ~100 kcal per km (varies by weight)
    walking_per_km: 50,       // ~50 kcal per km
    strength_per_hour: 300,   // ~300 kcal per hour
    cycling_per_hour: 400,    // ~400 kcal per hour
    swimming_per_hour: 500,   // ~500 kcal per hour
    hiit_per_hour: 600,       // ~600 kcal per hour
}

/**
 * Color mapping for feasibility levels
 */
const FEASIBILITY_COLORS: Record<FeasibilityLevel, string> = {
    easy: '#10B981',      // Emerald
    moderate: '#3B82F6',  // Blue
    challenging: '#F59E0B', // Amber
    extreme: '#EF4444',   // Red
    unrealistic: '#991B1B', // Dark Red
}

// =====================================================
// Main Calculator Function
// =====================================================

/**
 * Calculate goal metrics based on input parameters
 */
export function calculateGoal(input: GoalCalculationInput): GoalCalculation {
    const { goalType, targetValue, unit, startDate, endDate } = input

    // Calculate duration
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7))
    const totalMonths = Math.max(1, Math.ceil(totalDays / 30))

    // Route to specific calculator based on goal type
    switch (goalType) {
        case 'weight_loss':
            return calculateWeightLoss(targetValue, totalDays, totalWeeks, totalMonths, unit)
        case 'weight_gain':
            return calculateWeightGain(targetValue, totalDays, totalWeeks, totalMonths, unit)
        case 'running_distance':
            return calculateRunningDistance(targetValue, totalDays, totalWeeks, totalMonths, unit)
        case 'strength_training':
            return calculateStrengthTraining(targetValue, totalDays, totalWeeks, totalMonths, unit)
        case 'habit_building':
            return calculateHabitBuilding(targetValue, totalDays, totalWeeks, totalMonths, unit)
        case 'financial_target':
            return calculateFinancialTarget(targetValue, totalDays, totalWeeks, totalMonths, unit)
        default:
            return calculateGeneric(targetValue, totalDays, totalWeeks, totalMonths, unit)
    }
}

// =====================================================
// Category-Specific Calculators
// =====================================================

/**
 * Weight Loss Calculator
 * Formula: target_kg × 7700 kcal / days = daily_deficit
 */
function calculateWeightLoss(
    targetKg: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const totalKcal = targetKg * KCAL_PER_KG
    const dailyDeficit = Math.round(totalKcal / totalDays)
    const weeklyDeficit = Math.round(totalKcal / totalWeeks)
    const monthlyKgLoss = (targetKg / totalMonths)

    // Feasibility assessment
    const { feasibility, feasibilityScore } = assessWeightLossFeasibility(dailyDeficit)

    // Build breakdown
    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Kalori Açığı',
            value: totalKcal.toLocaleString('tr-TR'),
            unit: 'kcal',
            emoji: '🔥'
        },
        {
            label: 'Günlük Açık',
            value: dailyDeficit.toLocaleString('tr-TR'),
            unit: 'kcal/gün',
            emoji: '📊'
        },
        {
            label: 'Haftalık Kayıp',
            value: (targetKg / totalWeeks).toFixed(1),
            unit: 'kg/hafta',
            emoji: '📅'
        },
        {
            label: 'Süre',
            value: totalDays,
            unit: 'gün',
            emoji: '⏱️'
        }
    ]

    // Generate warnings based on feasibility
    const warnings: string[] = []
    const tips: string[] = []

    if (dailyDeficit > 1500) {
        warnings.push('Bu hedef sağlık açısından riskli olabilir. Daha uzun bir süre planlamayı düşün.')
    } else if (dailyDeficit > 1000) {
        warnings.push('Günlük 1000+ kcal açık agresif bir hedeftir. Tıbbi danışmanlık önerilir.')
    } else if (dailyDeficit > 750) {
        warnings.push('Zorlu bir hedef. Protein alımına ve uyku kalitesine dikkat et.')
    }

    // Calculate better duration suggestion if unrealistic
    if (dailyDeficit > 1000) {
        const betterDays = Math.ceil(totalKcal / 750)
        const betterDeficit = Math.round(totalKcal / betterDays)
        tips.push(`Süreyi ${betterDays} güne uzatarak günlük ${betterDeficit.toLocaleString('tr-TR')} kcal açık hedefle.`)
    }

    tips.push(`Haftada ${Math.round(weeklyDeficit / 7000 * 100) / 100} kg kayıp için haftada 3-4 antrenman planla.`)
    tips.push('Protein alımını yüksek tut (1.6-2g/kg vücut ağırlığı) kas kaybını önlemek için.')

    // Recommended quests for weight loss
    const recommendedQuestSlugs = [
        'cardio-30-min',
        'strength-training',
        'healthy-meal-prep',
        'water-intake-3l',
        'step-count-10k',
        'intermittent-fasting'
    ]

    return {
        totalDays,
        dailyTarget: dailyDeficit,
        weeklyTarget: weeklyDeficit,
        monthlyTarget: Math.round(monthlyKgLoss * KCAL_PER_KG),
        targetUnit: 'kcal açık',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings,
        tips,
        recommendedQuestSlugs
    }
}

/**
 * Weight Gain Calculator
 * Formula: target_kg × 7700 kcal / days = daily_surplus
 */
function calculateWeightGain(
    targetKg: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const totalKcal = targetKg * KCAL_PER_KG
    const dailySurplus = Math.round(totalKcal / totalDays)
    const weeklyGain = targetKg / totalWeeks

    // For weight gain, more moderate is better to minimize fat gain
    let feasibility: FeasibilityLevel
    let feasibilityScore: number

    if (dailySurplus <= 300) {
        feasibility = 'easy'
        feasibilityScore = 90
    } else if (dailySurplus <= 500) {
        feasibility = 'moderate'
        feasibilityScore = 75
    } else if (dailySurplus <= 750) {
        feasibility = 'challenging'
        feasibilityScore = 55
    } else if (dailySurplus <= 1000) {
        feasibility = 'extreme'
        feasibilityScore = 35
    } else {
        feasibility = 'unrealistic'
        feasibilityScore = 15
    }

    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Kalori Fazlası',
            value: totalKcal.toLocaleString('tr-TR'),
            unit: 'kcal',
            emoji: '💪'
        },
        {
            label: 'Günlük Fazla',
            value: dailySurplus.toLocaleString('tr-TR'),
            unit: 'kcal/gün',
            emoji: '📊'
        },
        {
            label: 'Haftalık Kazanç',
            value: weeklyGain.toFixed(2),
            unit: 'kg/hafta',
            emoji: '📅'
        }
    ]

    const warnings: string[] = []
    const tips: string[] = []

    if (dailySurplus > 500) {
        warnings.push('Yüksek kalori fazlası yağ depolanmasına neden olabilir.')
        tips.push('Süreyi uzatarak günlük 300-500 kcal fazla hedefle.')
    }

    tips.push('Protein alımını 1.8-2.2g/kg vücut ağırlığına çıkar.')
    tips.push('Haftada 4-5 güç antrenmanı kas gelişimi için idealdir.')

    return {
        totalDays,
        dailyTarget: dailySurplus,
        weeklyTarget: Math.round(dailySurplus * 7),
        monthlyTarget: Math.round(dailySurplus * 30),
        targetUnit: 'kcal fazla',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings,
        tips,
        recommendedQuestSlugs: [
            'strength-training',
            'protein-intake',
            'meal-prep-bulk',
            'progressive-overload'
        ]
    }
}

/**
 * Running Distance Calculator
 */
function calculateRunningDistance(
    targetKm: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const activeDaysPerWeek = 4 // Assume 4 running days per week
    const totalActiveDays = Math.ceil((totalDays / 7) * activeDaysPerWeek)
    const dailyKm = targetKm / totalActiveDays
    const weeklyKm = targetKm / totalWeeks
    const estimatedCaloriesBurn = targetKm * CALORIE_ESTIMATES.running_per_km

    let feasibility: FeasibilityLevel
    let feasibilityScore: number

    // Based on weekly km increase recommendations
    if (weeklyKm <= 20) {
        feasibility = 'easy'
        feasibilityScore = 85
    } else if (weeklyKm <= 40) {
        feasibility = 'moderate'
        feasibilityScore = 70
    } else if (weeklyKm <= 60) {
        feasibility = 'challenging'
        feasibilityScore = 50
    } else if (weeklyKm <= 80) {
        feasibility = 'extreme'
        feasibilityScore = 30
    } else {
        feasibility = 'unrealistic'
        feasibilityScore = 10
    }

    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Mesafe',
            value: targetKm,
            unit: 'km',
            emoji: '🏃'
        },
        {
            label: 'Antrenman Günü',
            value: dailyKm.toFixed(1),
            unit: 'km/gün',
            emoji: '📊'
        },
        {
            label: 'Haftalık',
            value: weeklyKm.toFixed(1),
            unit: 'km/hafta',
            emoji: '📅'
        },
        {
            label: 'Tahmini Yakım',
            value: estimatedCaloriesBurn.toLocaleString('tr-TR'),
            unit: 'kcal toplam',
            emoji: '🔥'
        }
    ]

    const warnings: string[] = []
    const tips: string[] = []

    if (weeklyKm > 40) {
        warnings.push('Haftalık 40+ km sakatlanma riskini artırır. 10% kuralına uy.')
    }

    tips.push('Haftalık artışı %10 ile sınırla (10% kuralı).')
    tips.push('Haftada 1-2 gün dinlenme günü planla.')
    tips.push('Uzun koşuları hafta sonuna, kısa tempoları hafta içine yerleştir.')

    return {
        totalDays,
        dailyTarget: Math.round(dailyKm * 10) / 10,
        weeklyTarget: Math.round(weeklyKm * 10) / 10,
        monthlyTarget: Math.round((targetKm / totalMonths) * 10) / 10,
        targetUnit: 'km',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings,
        tips,
        recommendedQuestSlugs: [
            'morning-run',
            'interval-training',
            'long-run-weekend',
            'stretching-routine',
            'hydration-check'
        ]
    }
}

/**
 * Strength Training Calculator
 */
function calculateStrengthTraining(
    targetSessions: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const sessionsPerWeek = targetSessions / totalWeeks
    const estimatedCaloriesBurn = targetSessions * CALORIE_ESTIMATES.strength_per_hour

    let feasibility: FeasibilityLevel
    let feasibilityScore: number

    if (sessionsPerWeek <= 3) {
        feasibility = 'easy'
        feasibilityScore = 85
    } else if (sessionsPerWeek <= 5) {
        feasibility = 'moderate'
        feasibilityScore = 70
    } else if (sessionsPerWeek <= 6) {
        feasibility = 'challenging'
        feasibilityScore = 50
    } else {
        feasibility = 'extreme'
        feasibilityScore = 30
    }

    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Antrenman',
            value: targetSessions,
            unit: 'seans',
            emoji: '🏋️'
        },
        {
            label: 'Haftalık',
            value: sessionsPerWeek.toFixed(1),
            unit: 'seans/hafta',
            emoji: '📅'
        },
        {
            label: 'Tahmini Yakım',
            value: estimatedCaloriesBurn.toLocaleString('tr-TR'),
            unit: 'kcal toplam',
            emoji: '🔥'
        }
    ]

    return {
        totalDays,
        dailyTarget: Math.round((targetSessions / totalDays) * 100) / 100,
        weeklyTarget: Math.round(sessionsPerWeek * 10) / 10,
        monthlyTarget: Math.round(targetSessions / totalMonths),
        targetUnit: 'seans',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings: sessionsPerWeek > 5 ? ['Haftada 5+ antrenman overtraining riskini artırır.'] : [],
        tips: [
            'Kas gruplarını döngüsel çalış (Push/Pull/Legs).',
            'Protein alımını yüksek tut (1.6-2g/kg).',
            'Haftalık progressive overload uygula.'
        ],
        recommendedQuestSlugs: [
            'gym-session',
            'protein-shake',
            'warm-up-routine',
            'cool-down-stretch'
        ]
    }
}

/**
 * Habit Building Calculator (generic habits like reading, meditation)
 */
function calculateHabitBuilding(
    targetDays: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const completionRate = (targetDays / totalDays) * 100
    const daysPerWeek = targetDays / totalWeeks

    let feasibility: FeasibilityLevel
    let feasibilityScore: number

    if (completionRate <= 50) {
        feasibility = 'easy'
        feasibilityScore = 90
    } else if (completionRate <= 70) {
        feasibility = 'moderate'
        feasibilityScore = 75
    } else if (completionRate <= 85) {
        feasibility = 'challenging'
        feasibilityScore = 55
    } else if (completionRate <= 95) {
        feasibility = 'extreme'
        feasibilityScore = 35
    } else {
        feasibility = 'unrealistic'
        feasibilityScore = 15
    }

    const breakdown: BreakdownItem[] = [
        {
            label: 'Hedef Gün',
            value: targetDays,
            unit: 'gün',
            emoji: '📅'
        },
        {
            label: 'Tamamlama Oranı',
            value: completionRate.toFixed(0),
            unit: '%',
            emoji: '📊'
        },
        {
            label: 'Haftalık',
            value: daysPerWeek.toFixed(1),
            unit: 'gün/hafta',
            emoji: '🌟'
        }
    ]

    return {
        totalDays,
        dailyTarget: 1,
        weeklyTarget: Math.round(daysPerWeek),
        monthlyTarget: Math.round(targetDays / totalMonths),
        targetUnit: unit || 'gün',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings: completionRate > 90 ? ['%90+ tamamlama oranı çok yüksek bir hedef.'] : [],
        tips: [
            'Belirli bir saate bağla (habit stacking).',
            '21 gün üst üste yaparak alışkanlık oluştur.',
            'Küçük başla, zamanla artır.'
        ],
        recommendedQuestSlugs: [
            'daily-check-in',
            'habit-tracker',
            'morning-routine'
        ]
    }
}

/**
 * Financial Target Calculator
 */
function calculateFinancialTarget(
    targetAmount: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const dailyTarget = targetAmount / totalDays
    const weeklyTarget = targetAmount / totalWeeks
    const monthlyTarget = targetAmount / totalMonths

    // Feasibility depends on context, using generic assessment
    const feasibility: FeasibilityLevel = 'moderate'
    const feasibilityScore = 70

    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Hedef',
            value: targetAmount.toLocaleString('tr-TR'),
            unit: unit || '$',
            emoji: '💰'
        },
        {
            label: 'Günlük',
            value: dailyTarget.toFixed(2),
            unit: unit || '$/gün',
            emoji: '📊'
        },
        {
            label: 'Haftalık',
            value: weeklyTarget.toFixed(2),
            unit: unit || '$/hafta',
            emoji: '📅'
        },
        {
            label: 'Aylık',
            value: monthlyTarget.toFixed(2),
            unit: unit || '$/ay',
            emoji: '📆'
        }
    ]

    return {
        totalDays,
        dailyTarget: Math.round(dailyTarget * 100) / 100,
        weeklyTarget: Math.round(weeklyTarget * 100) / 100,
        monthlyTarget: Math.round(monthlyTarget * 100) / 100,
        targetUnit: unit || '$',
        breakdown,
        feasibility,
        feasibilityScore,
        feasibilityColor: FEASIBILITY_COLORS[feasibility],
        warnings: [],
        tips: [
            'Günlük hedefi küçük parçalara böl.',
            'İlerlemeyi haftalık takip et.',
            'Risk yönetimi stratejisi belirle.'
        ],
        recommendedQuestSlugs: [
            'daily-trading-review',
            'market-analysis',
            'journal-entry'
        ]
    }
}

/**
 * Generic Calculator (fallback)
 */
function calculateGeneric(
    targetValue: number,
    totalDays: number,
    totalWeeks: number,
    totalMonths: number,
    unit: string
): GoalCalculation {
    const dailyTarget = targetValue / totalDays
    const weeklyTarget = targetValue / totalWeeks
    const monthlyTarget = targetValue / totalMonths

    const breakdown: BreakdownItem[] = [
        {
            label: 'Toplam Hedef',
            value: targetValue,
            unit: unit,
            emoji: '🎯'
        },
        {
            label: 'Günlük',
            value: dailyTarget.toFixed(2),
            unit: `${unit}/gün`,
            emoji: '📊'
        },
        {
            label: 'Haftalık',
            value: weeklyTarget.toFixed(2),
            unit: `${unit}/hafta`,
            emoji: '📅'
        }
    ]

    return {
        totalDays,
        dailyTarget: Math.round(dailyTarget * 100) / 100,
        weeklyTarget: Math.round(weeklyTarget * 100) / 100,
        monthlyTarget: Math.round(monthlyTarget * 100) / 100,
        targetUnit: unit,
        breakdown,
        feasibility: 'moderate',
        feasibilityScore: 70,
        feasibilityColor: FEASIBILITY_COLORS['moderate'],
        warnings: [],
        tips: ['Küçük adımlarla ilerle.', 'İlerlemeyi düzenli takip et.'],
        recommendedQuestSlugs: []
    }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Assess weight loss feasibility based on daily calorie deficit
 */
function assessWeightLossFeasibility(dailyDeficit: number): { feasibility: FeasibilityLevel; feasibilityScore: number } {
    if (dailyDeficit <= WEIGHT_LOSS_THRESHOLDS.easy) {
        return { feasibility: 'easy', feasibilityScore: 90 }
    } else if (dailyDeficit <= WEIGHT_LOSS_THRESHOLDS.moderate) {
        return { feasibility: 'moderate', feasibilityScore: 75 }
    } else if (dailyDeficit <= WEIGHT_LOSS_THRESHOLDS.challenging) {
        return { feasibility: 'challenging', feasibilityScore: 55 }
    } else if (dailyDeficit <= WEIGHT_LOSS_THRESHOLDS.extreme) {
        return { feasibility: 'extreme', feasibilityScore: 35 }
    } else {
        return { feasibility: 'unrealistic', feasibilityScore: 15 }
    }
}

/**
 * Map goal template slug to calculation type
 */
export function getCalculationTypeFromTemplateSlug(slug: string): GoalCalculationType {
    const slugMap: Record<string, GoalCalculationType> = {
        'kilo-vermek': 'weight_loss',
        'kilo-almak': 'weight_gain',
        'kas-kazanmak': 'weight_gain',
        'kosu-hedefi': 'running_distance',
        'kosu-mesafesi': 'running_distance',
        'guc-antrenman': 'strength_training',
        'gym-rutini': 'strength_training',
        'aliskanlik': 'habit_building',
        'su-icme': 'habit_building',
        'kitap-okuma': 'habit_building',
        'meditasyon': 'habit_building',
        'kar-hedefi': 'financial_target',
        'trading': 'financial_target',
    }

    // Try exact match first
    if (slugMap[slug]) {
        return slugMap[slug]
    }

    // Try partial match
    for (const [key, value] of Object.entries(slugMap)) {
        if (slug.toLowerCase().includes(key) || key.includes(slug.toLowerCase())) {
            return value
        }
    }

    return 'generic'
}

/**
 * Get calculation type from category slug
 */
export function getCalculationTypeFromCategory(categorySlug: string): GoalCalculationType {
    const categoryMap: Record<string, GoalCalculationType> = {
        'food': 'weight_loss',      // Default for food category
        'sport': 'strength_training', // Default for sport category
        'trade': 'financial_target',
        'dev': 'habit_building',     // Project/task completion
        'etsy': 'financial_target',
        'gaming': 'habit_building',
    }

    return categoryMap[categorySlug] || 'generic'
}
