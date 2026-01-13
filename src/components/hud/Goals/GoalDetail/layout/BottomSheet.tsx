'use client'

import { useRef, useEffect, useCallback, ReactNode } from 'react'
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion'

// =====================================================
// Types
// =====================================================

type SheetDetent = 'collapsed' | 'medium' | 'expanded'

interface BottomSheetProps {
    isOpen: boolean
    onClose: () => void
    children: ReactNode
    /** Initial detent when sheet opens */
    initialDetent?: SheetDetent
    /** Allow background interaction when at medium detent */
    allowBackgroundInteraction?: boolean
    /** Show drag indicator handle */
    showDragIndicator?: boolean
    /** Custom header content */
    header?: ReactNode
    /** Callback when detent changes */
    onDetentChange?: (detent: SheetDetent) => void
}

// =====================================================
// Constants - iOS HIG Compliant
// =====================================================

const DETENT_VALUES: Record<SheetDetent, number> = {
    collapsed: 0.30,  // 30% of screen height
    medium: 0.55,     // 55% of screen height (Apple Maps style)
    expanded: 0.92    // 92% - leaves room for status bar/Dynamic Island
}

// iPhone 15 Pro safe area values (in pixels)
const SAFE_AREA = {
    TOP: 59,      // Dynamic Island
    BOTTOM: 34,   // Home Indicator
    CORNER_RADIUS: 40
}

// Snap threshold for gesture release
const SNAP_THRESHOLD = 0.1 // 10% of detent distance

// =====================================================
// Helper Functions
// =====================================================

function getClosestDetent(currentPosition: number): SheetDetent {
    const detents = Object.entries(DETENT_VALUES) as [SheetDetent, number][]
    let closest: SheetDetent = 'medium'
    let minDistance = Infinity

    for (const [detent, value] of detents) {
        const distance = Math.abs(currentPosition - value)
        if (distance < minDistance) {
            minDistance = distance
            closest = detent
        }
    }

    return closest
}

function getNextDetent(current: SheetDetent, direction: 'up' | 'down'): SheetDetent {
    const order: SheetDetent[] = ['collapsed', 'medium', 'expanded']
    const currentIndex = order.indexOf(current)

    if (direction === 'up') {
        return order[Math.min(currentIndex + 1, order.length - 1)]
    } else {
        // If at collapsed and dragging down, return collapsed (will trigger close)
        return order[Math.max(currentIndex - 1, 0)]
    }
}

// =====================================================
// Main Component
// =====================================================

export default function BottomSheet({
    isOpen,
    onClose,
    children,
    initialDetent = 'medium',
    allowBackgroundInteraction = true,
    showDragIndicator = true,
    header,
    onDetentChange
}: BottomSheetProps) {
    const sheetRef = useRef<HTMLDivElement>(null)
    const currentDetent = useRef<SheetDetent>(initialDetent)

    // Motion values for gesture tracking
    const dragY = useMotionValue(0)
    const sheetHeight = useMotionValue(DETENT_VALUES[initialDetent])

    // Calculate backdrop opacity based on sheet height
    const backdropOpacity = useTransform(
        sheetHeight,
        [DETENT_VALUES.collapsed, DETENT_VALUES.expanded],
        [0.2, 0.5]
    )

    // Snap to detent
    const snapToDetent = useCallback((detent: SheetDetent) => {
        currentDetent.current = detent
        onDetentChange?.(detent)

        // Animate to new position
        sheetHeight.set(DETENT_VALUES[detent])
    }, [sheetHeight, onDetentChange])

    // Handle drag end
    const handleDragEnd = useCallback((
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const velocity = info.velocity.y
        const currentHeight = sheetHeight.get()

        // Determine direction based on velocity
        const direction = velocity > 0 ? 'down' : 'up'

        // If velocity is significant, move to next detent in that direction
        if (Math.abs(velocity) > 500) {
            const nextDetent = getNextDetent(currentDetent.current, direction)

            // Close if at collapsed and dragging down
            if (currentDetent.current === 'collapsed' && direction === 'down') {
                onClose()
                return
            }

            snapToDetent(nextDetent)
            return
        }

        // Otherwise snap to closest detent
        const closest = getClosestDetent(currentHeight)

        // Close if below collapse threshold
        if (currentHeight < DETENT_VALUES.collapsed - SNAP_THRESHOLD) {
            onClose()
            return
        }

        snapToDetent(closest)
    }, [sheetHeight, snapToDetent, onClose])

    // Handle drag
    const handleDrag = useCallback((
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const windowHeight = window.innerHeight
        const dragDelta = info.delta.y / windowHeight
        const currentHeight = sheetHeight.get()

        // Calculate new height (inverted because y increases downward)
        const newHeight = Math.max(0, Math.min(0.95, currentHeight - dragDelta))
        sheetHeight.set(newHeight)
    }, [sheetHeight])

    // Initialize on open
    useEffect(() => {
        if (isOpen) {
            currentDetent.current = initialDetent
            sheetHeight.set(DETENT_VALUES[initialDetent])
        }
    }, [isOpen, initialDetent, sheetHeight])

    // Handle backdrop click based on detent
    const handleBackdropClick = useCallback(() => {
        if (allowBackgroundInteraction && currentDetent.current === 'medium') {
            // At medium detent, backdrop is interactive - do nothing
            return
        }
        onClose()
    }, [allowBackgroundInteraction, onClose])

    // Trigger haptic feedback (if supported)
    const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy') => {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            const patterns = { light: [10], medium: [20], heavy: [30] }
            navigator.vibrate(patterns[type])
        }
    }, [])

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={handleBackdropClick}
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                        style={{ opacity: backdropOpacity }}
                    />

                    {/* Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 400,
                            mass: 0.8
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        onDrag={handleDrag}
                        onDragEnd={handleDragEnd}
                        onDragStart={() => triggerHaptic('light')}
                        style={{
                            height: useTransform(sheetHeight, v => `${v * 100}%`)
                        }}
                        className="fixed left-0 right-0 bottom-0 z-50 
                                   bg-gradient-to-b from-white via-slate-50 to-slate-100
                                   rounded-t-[40px] shadow-2xl
                                   flex flex-col overflow-hidden
                                   touch-none"
                    >
                        {/* Drag Indicator Handle */}
                        {showDragIndicator && (
                            <div
                                className="flex-none py-3 cursor-grab active:cursor-grabbing"
                                onPointerDown={() => triggerHaptic('light')}
                            >
                                <div className="w-10 h-1.5 mx-auto rounded-full bg-slate-300" />
                            </div>
                        )}

                        {/* Custom Header (optional) */}
                        {header && (
                            <div className="flex-none border-b border-slate-100">
                                {header}
                            </div>
                        )}

                        {/* Content Area - iOS Momentum Scrolling */}
                        <div
                            className="flex-1 overflow-y-auto overscroll-contain
                                       [-webkit-overflow-scrolling:touch]"
                            style={{
                                paddingBottom: `${SAFE_AREA.BOTTOM}px`
                            }}
                        >
                            {children}
                        </div>

                        {/* Home Indicator Safe Area Padding */}
                        <div
                            className="flex-none bg-gradient-to-t from-slate-100 to-transparent"
                            style={{ height: `${SAFE_AREA.BOTTOM}px` }}
                        />
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}

// =====================================================
// Export Types
// =====================================================

export type { BottomSheetProps, SheetDetent }
