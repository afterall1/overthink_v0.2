'use client'

import { ReactNode } from 'react'
import { X, MoreHorizontal } from 'lucide-react'

// =====================================================
// Types
// =====================================================

interface SheetHeaderProps {
    title?: string
    subtitle?: string
    emoji?: string
    /** Left action button - typically close */
    onClose?: () => void
    /** Right actions - edit, delete, etc. */
    rightActions?: ReactNode
    /** Show more options menu button */
    showMoreOptions?: boolean
    onMoreOptions?: () => void
}

// =====================================================
// Constants - iOS HIG Touch Targets
// =====================================================

const TOUCH_TARGET_SIZE = 44 // iOS minimum 44pt

// =====================================================
// Main Component
// =====================================================

export default function SheetHeader({
    title,
    subtitle,
    emoji,
    onClose,
    rightActions,
    showMoreOptions,
    onMoreOptions
}: SheetHeaderProps) {
    return (
        <div className="px-6 py-4 flex items-center justify-between gap-4">
            {/* Left: Close Button */}
            <div className="flex items-center gap-3">
                {onClose && (
                    <button
                        onClick={onClose}
                        aria-label="Kapat"
                        className="flex items-center justify-center rounded-full
                                   bg-slate-100 hover:bg-slate-200 
                                   active:scale-95 transition-all duration-150
                                   touch-manipulation"
                        style={{
                            minWidth: `${TOUCH_TARGET_SIZE}px`,
                            minHeight: `${TOUCH_TARGET_SIZE}px`,
                            width: `${TOUCH_TARGET_SIZE}px`,
                            height: `${TOUCH_TARGET_SIZE}px`
                        }}
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                )}

                {/* Emoji + Title */}
                {(emoji || title) && (
                    <div className="flex items-center gap-2 min-w-0">
                        {emoji && (
                            <span className="text-2xl flex-shrink-0" role="img">
                                {emoji}
                            </span>
                        )}
                        <div className="min-w-0">
                            {title && (
                                <h2 className="text-lg font-bold text-slate-800 truncate">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="text-xs text-slate-500 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {rightActions}

                {showMoreOptions && onMoreOptions && (
                    <button
                        onClick={onMoreOptions}
                        aria-label="Daha fazla seçenek"
                        className="flex items-center justify-center rounded-full
                                   bg-slate-100 hover:bg-slate-200 
                                   active:scale-95 transition-all duration-150
                                   touch-manipulation"
                        style={{
                            minWidth: `${TOUCH_TARGET_SIZE}px`,
                            minHeight: `${TOUCH_TARGET_SIZE}px`,
                            width: `${TOUCH_TARGET_SIZE}px`,
                            height: `${TOUCH_TARGET_SIZE}px`
                        }}
                    >
                        <MoreHorizontal className="w-5 h-5 text-slate-600" />
                    </button>
                )}
            </div>
        </div>
    )
}

// =====================================================
// Export Types
// =====================================================

export type { SheetHeaderProps }
