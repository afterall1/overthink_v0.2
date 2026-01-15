'use strict'

// =====================================================
// Profile Delta Detection Module
// Detects significant health profile changes for quest recalibration
// =====================================================

// =====================================================
// Constants
// =====================================================

/**
 * Thresholds for determining if a profile change is significant enough
 * to warrant quest regeneration
 */
export const PROFILE_CHANGE_THRESHOLDS = {
    daily_adjustment_kcal: 100,  // ±100 kcal change in daily target
    weight_kg: 2,                 // ±2 kg change
    activity_level: true,         // Any change triggers regeneration
    target_weight_kg: true,       // Any change triggers regeneration
    goal_pace: true               // Any change triggers regeneration
} as const

// =====================================================
// Types
// =====================================================

export interface ProfileDelta {
    isSignificant: boolean
    changes: {
        daily_adjustment?: { old: number; new: number; delta: number }
        weight_kg?: { old: number; new: number; delta: number }
        activity_level?: { old: string; new: string }
        target_weight_kg?: { old: number | null; new: number | null }
        goal_pace?: { old: string | null; new: string | null }
    }
    summary: string
}

export interface ProfileMetricsSnapshot {
    daily_adjustment: number
    weight_kg: number
    activity_level: string
    target_weight_kg?: number | null
    goal_pace?: string | null
}

// =====================================================
// Main Function
// =====================================================

/**
 * Calculate the delta between old and new health profile metrics
 * Determines if changes are significant enough to warrant quest regeneration
 */
export function calculateProfileDelta(
    oldMetrics: ProfileMetricsSnapshot,
    newMetrics: ProfileMetricsSnapshot
): ProfileDelta {
    const changes: ProfileDelta['changes'] = {}
    const reasons: string[] = []
    let isSignificant = false

    // Check daily_adjustment change
    const adjustmentDelta = Math.abs(newMetrics.daily_adjustment - oldMetrics.daily_adjustment)
    if (adjustmentDelta >= PROFILE_CHANGE_THRESHOLDS.daily_adjustment_kcal) {
        changes.daily_adjustment = {
            old: oldMetrics.daily_adjustment,
            new: newMetrics.daily_adjustment,
            delta: newMetrics.daily_adjustment - oldMetrics.daily_adjustment
        }
        reasons.push(`Kalori hedefi ${adjustmentDelta} kcal değişti`)
        isSignificant = true
    }

    // Check weight change
    const weightDelta = Math.abs(newMetrics.weight_kg - oldMetrics.weight_kg)
    if (weightDelta >= PROFILE_CHANGE_THRESHOLDS.weight_kg) {
        changes.weight_kg = {
            old: oldMetrics.weight_kg,
            new: newMetrics.weight_kg,
            delta: newMetrics.weight_kg - oldMetrics.weight_kg
        }
        reasons.push(`Kilo ${weightDelta.toFixed(1)} kg değişti`)
        isSignificant = true
    }

    // Check activity level change
    if (oldMetrics.activity_level !== newMetrics.activity_level) {
        changes.activity_level = {
            old: oldMetrics.activity_level,
            new: newMetrics.activity_level
        }
        reasons.push('Aktivite seviyesi değişti')
        isSignificant = true
    }

    // Check target weight change
    if (oldMetrics.target_weight_kg !== newMetrics.target_weight_kg) {
        changes.target_weight_kg = {
            old: oldMetrics.target_weight_kg || null,
            new: newMetrics.target_weight_kg || null
        }
        reasons.push('Hedef kilo değişti')
        isSignificant = true
    }

    // Check goal pace change
    if (oldMetrics.goal_pace !== newMetrics.goal_pace) {
        changes.goal_pace = {
            old: oldMetrics.goal_pace || null,
            new: newMetrics.goal_pace || null
        }
        reasons.push('Hedef hızı değişti')
        isSignificant = true
    }

    return {
        isSignificant,
        changes,
        summary: reasons.length > 0 ? reasons.join(', ') : 'Önemli değişiklik yok'
    }
}
