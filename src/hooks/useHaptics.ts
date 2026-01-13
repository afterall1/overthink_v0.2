'use client'

import { useCallback } from 'react'

// =====================================================
// Types
// =====================================================

/**
 * Haptic feedback types based on iOS UIFeedbackGenerator
 */
export type HapticType =
    // Impact feedback (physical collisions)
    | 'light'      // Subtle, for minor UI events
    | 'medium'     // Standard, for prominent actions
    | 'heavy'      // Strong, for critical interactions
    | 'soft'       // Delicate, refined feedback
    | 'rigid'      // Sharp, noticeable feedback
    // Notification feedback (outcome communication)
    | 'success'    // Positive outcome
    | 'warning'    // Attention needed
    | 'error'      // Failure or critical error
    // Selection feedback
    | 'selection'  // Selection change (picker, toggle)

// =====================================================
// Vibration Patterns (milliseconds)
// =====================================================

const VIBRATION_PATTERNS: Record<HapticType, number[]> = {
    // Impact patterns
    light: [10],
    medium: [20],
    heavy: [35],
    soft: [8],
    rigid: [25],
    // Notification patterns
    success: [10, 50, 15, 50, 10],   // Double tap celebration
    warning: [30, 50, 30],           // Double pulse attention
    error: [50, 30, 50, 30, 50],     // Triple sharp alert
    // Selection pattern
    selection: [5]                    // Ultra-light tick
}

// =====================================================
// Capability Detection
// =====================================================

function supportsVibration(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
}

function supportsHapticActuator(): boolean {
    // Check for Web Haptic API (experimental)
    return typeof navigator !== 'undefined' &&
        'getGamepads' in navigator // Rough proxy for advanced haptic support
}

// =====================================================
// Hook
// =====================================================

/**
 * useHaptics
 * 
 * Cross-platform haptic feedback hook that provides iOS-like tactile 
 * feedback using Web Vibration API with graceful fallback.
 * 
 * In native iOS (via Capacitor/Expo), this would integrate with 
 * UIImpactFeedbackGenerator, UINotificationFeedbackGenerator, etc.
 * 
 * @example
 * const { trigger, isSupported } = useHaptics()
 * 
 * function handleComplete() {
 *   trigger('success')
 *   completeQuest(id)
 * }
 */
export function useHaptics() {
    const isSupported = supportsVibration()

    /**
     * Trigger haptic feedback
     * @param type - Type of haptic feedback
     * @param options - Optional configuration
     */
    const trigger = useCallback((
        type: HapticType,
        options?: {
            /** Skip if user prefers reduced motion */
            respectReducedMotion?: boolean
        }
    ) => {
        // Check for reduced motion preference
        if (options?.respectReducedMotion) {
            const prefersReduced = typeof window !== 'undefined' &&
                window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            if (prefersReduced) return
        }

        // Skip if not supported
        if (!isSupported) return

        // Trigger vibration
        const pattern = VIBRATION_PATTERNS[type]
        if (pattern) {
            try {
                navigator.vibrate(pattern)
            } catch {
                // Silently fail - some browsers throw on vibrate
            }
        }
    }, [isSupported])

    /**
     * Trigger impact feedback with custom intensity
     * @param intensity - 0.0 to 1.0
     */
    const triggerImpact = useCallback((intensity: number) => {
        if (!isSupported) return

        // Map intensity to vibration duration
        const duration = Math.round(5 + (intensity * 40)) // 5-45ms
        try {
            navigator.vibrate([duration])
        } catch {
            // Silently fail
        }
    }, [isSupported])

    /**
     * Cancel any ongoing haptic feedback
     */
    const cancel = useCallback(() => {
        if (!isSupported) return
        try {
            navigator.vibrate(0)
        } catch {
            // Silently fail
        }
    }, [isSupported])

    return {
        trigger,
        triggerImpact,
        cancel,
        isSupported
    }
}

// =====================================================
// Standalone function (for non-hook contexts)
// =====================================================

/**
 * Trigger haptic feedback without hook context
 * @param type - Type of haptic feedback
 */
export function triggerHaptic(type: HapticType): void {
    if (!supportsVibration()) return

    const pattern = VIBRATION_PATTERNS[type]
    if (pattern) {
        try {
            navigator.vibrate(pattern)
        } catch {
            // Silently fail
        }
    }
}

// =====================================================
// Default Export
// =====================================================

export default useHaptics
