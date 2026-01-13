'use client'

import { ReactNode } from 'react'

// =====================================================
// Types
// =====================================================

interface SafeAreaContainerProps {
    children: ReactNode
    /** Apply top safe area padding (Dynamic Island / Notch) */
    top?: boolean
    /** Apply bottom safe area padding (Home Indicator) */
    bottom?: boolean
    /** Apply left/right safe area padding (Landscape) */
    horizontal?: boolean
    /** Additional className */
    className?: string
}

// =====================================================
// CSS Custom Properties Fallback
// These values match iPhone 15 Pro dimensions
// env() will override with actual device values
// =====================================================

const FALLBACK_VALUES = {
    TOP: 59,      // Dynamic Island height
    BOTTOM: 34,   // Home Indicator height
    LEFT: 0,
    RIGHT: 0
}

// =====================================================
// Main Component
// =====================================================

/**
 * SafeAreaContainer
 * 
 * Wrapper component that applies iOS safe area insets to prevent
 * content from being obscured by Dynamic Island, notch, or home indicator.
 * 
 * Uses CSS env() function with fallback values for web preview.
 * 
 * @example
 * <SafeAreaContainer top bottom>
 *   <Content />
 * </SafeAreaContainer>
 */
export default function SafeAreaContainer({
    children,
    top = false,
    bottom = false,
    horizontal = false,
    className = ''
}: SafeAreaContainerProps) {
    // Build dynamic styles using CSS env() with fallbacks
    const style: React.CSSProperties = {}

    if (top) {
        style.paddingTop = `max(env(safe-area-inset-top, ${FALLBACK_VALUES.TOP}px), 1rem)`
    }

    if (bottom) {
        style.paddingBottom = `max(env(safe-area-inset-bottom, ${FALLBACK_VALUES.BOTTOM}px), 1rem)`
    }

    if (horizontal) {
        style.paddingLeft = `env(safe-area-inset-left, ${FALLBACK_VALUES.LEFT}px)`
        style.paddingRight = `env(safe-area-inset-right, ${FALLBACK_VALUES.RIGHT}px)`
    }

    return (
        <div className={className} style={style}>
            {children}
        </div>
    )
}

// =====================================================
// Utility Hook for programmatic access
// =====================================================

/**
 * Get safe area inset values for use in calculations
 * Returns fallback values in SSR/non-iOS environments
 */
export function useSafeAreaInsets() {
    // In a real implementation, this would read from CSS env() or native bridge
    // For now, return fallback values that work well on web
    return {
        top: FALLBACK_VALUES.TOP,
        bottom: FALLBACK_VALUES.BOTTOM,
        left: FALLBACK_VALUES.LEFT,
        right: FALLBACK_VALUES.RIGHT
    }
}

// =====================================================
// Export Types
// =====================================================

export type { SafeAreaContainerProps }
