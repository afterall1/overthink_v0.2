/**
 * Time Service - Centralized Time Management for Testing
 * 
 * This module provides a single source of truth for current date/time.
 * In development mode, allows overriding the current date for testing
 * time-dependent features like streaks, quests, and milestones.
 * 
 * PRODUCTION: Always returns real system time.
 * DEVELOPMENT: Can be overridden via setTestDate() or DevTools panel.
 */

import { format, parseISO, startOfDay, addDays, subDays } from 'date-fns'

// =====================================================
// State
// =====================================================

// The override date (null = use real time)
let overrideDate: Date | null = null

// Event listeners for time changes (for UI updates)
type TimeChangeListener = (date: Date) => void
const listeners: Set<TimeChangeListener> = new Set()

// =====================================================
// Core Functions
// =====================================================

/**
 * Check if we're in development mode
 */
export function isDevMode(): boolean {
    return process.env.NODE_ENV === 'development'
}

/**
 * Get the current date.
 * In development with override: returns the override date.
 * Otherwise: returns the real system date.
 */
export function getCurrentDate(): Date {
    if (isDevMode() && overrideDate !== null) {
        return new Date(overrideDate)
    }
    return new Date()
}

/**
 * Get the current date as ISO string (yyyy-MM-dd format)
 */
export function getCurrentDateString(): string {
    return format(getCurrentDate(), 'yyyy-MM-dd')
}

/**
 * Get start of current day
 */
export function getCurrentDayStart(): Date {
    return startOfDay(getCurrentDate())
}

/**
 * Get the time offset in days from real time
 * Returns 0 if using real time
 */
export function getTimeOffset(): number {
    if (!isDevMode() || overrideDate === null) {
        return 0
    }
    const realToday = startOfDay(new Date())
    const simulatedToday = startOfDay(overrideDate)
    return Math.round((simulatedToday.getTime() - realToday.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Check if time is currently being simulated
 */
export function isTimeSimulated(): boolean {
    return isDevMode() && overrideDate !== null
}

// =====================================================
// Time Manipulation (Development Only)
// =====================================================

/**
 * Set a test date override (development only)
 * @param date - Date object, ISO string, or null to reset
 */
export function setTestDate(date: Date | string | null): void {
    if (!isDevMode()) {
        console.warn('[TimeService] setTestDate is only available in development mode')
        return
    }

    if (date === null) {
        overrideDate = null
        console.log('[TimeService] Reset to real time')
    } else if (typeof date === 'string') {
        overrideDate = parseISO(date)
        console.log('[TimeService] Set test date to:', format(overrideDate, 'yyyy-MM-dd'))
    } else {
        overrideDate = new Date(date)
        console.log('[TimeService] Set test date to:', format(overrideDate, 'yyyy-MM-dd'))
    }

    // Notify listeners
    notifyListeners()
}

/**
 * Advance the simulated date by N days
 */
export function advanceDays(days: number = 1): void {
    if (!isDevMode()) return

    const current = getCurrentDate()
    setTestDate(addDays(current, days))
}

/**
 * Rewind the simulated date by N days
 */
export function rewindDays(days: number = 1): void {
    if (!isDevMode()) return

    const current = getCurrentDate()
    setTestDate(subDays(current, days))
}

/**
 * Reset to real system time
 */
export function resetToRealTime(): void {
    if (!isDevMode()) return
    setTestDate(null)
}

// =====================================================
// Event System (for UI updates)
// =====================================================

/**
 * Subscribe to time changes
 * Returns unsubscribe function
 */
export function subscribeToTimeChanges(listener: TimeChangeListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

/**
 * Notify all listeners of time change
 */
function notifyListeners(): void {
    const currentDate = getCurrentDate()
    listeners.forEach(listener => {
        try {
            listener(currentDate)
        } catch (err) {
            console.error('[TimeService] Listener error:', err)
        }
    })
}

// =====================================================
// Convenience Functions (date-fns wrappers)
// =====================================================

/**
 * Check if a date is today (using simulated time if active)
 */
export function isSimulatedToday(date: Date): boolean {
    const today = getCurrentDayStart()
    const checkDate = startOfDay(date)
    return today.getTime() === checkDate.getTime()
}

/**
 * Check if a date is yesterday (using simulated time if active)
 */
export function isSimulatedYesterday(date: Date): boolean {
    const yesterday = subDays(getCurrentDayStart(), 1)
    const checkDate = startOfDay(date)
    return yesterday.getTime() === checkDate.getTime()
}

// =====================================================
// Debug Info
// =====================================================

/**
 * Get debug info about current time state
 */
export function getTimeDebugInfo(): {
    isSimulated: boolean
    currentDate: string
    realDate: string
    offset: number
} {
    return {
        isSimulated: isTimeSimulated(),
        currentDate: format(getCurrentDate(), 'yyyy-MM-dd HH:mm:ss'),
        realDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        offset: getTimeOffset()
    }
}
