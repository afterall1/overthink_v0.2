'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { Plus, Minus, Check, Loader2 } from 'lucide-react'

// =====================================================
// Types
// =====================================================

interface ProgressLoggerProps {
    unit?: string
    onSubmit: (value: number, notes?: string) => Promise<void>
    className?: string
    disabled?: boolean
}

// =====================================================
// Component
// =====================================================

export default function ProgressLogger({
    unit = '',
    onSubmit,
    className,
    disabled = false
}: ProgressLoggerProps) {
    const [value, setValue] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const numericValue = parseFloat(value) || 0

    const handleIncrement = useCallback(() => {
        setValue(prev => {
            const current = parseFloat(prev) || 0
            return String(current + 1)
        })
    }, [])

    const handleDecrement = useCallback(() => {
        setValue(prev => {
            const current = parseFloat(prev) || 0
            return String(Math.max(0, current - 1))
        })
    }, [])

    const handleSubmit = useCallback(async () => {
        if (numericValue <= 0 || isSubmitting || disabled) return

        setIsSubmitting(true)
        try {
            await onSubmit(numericValue)
            setShowSuccess(true)
            setValue('')

            // Reset success state after animation
            setTimeout(() => setShowSuccess(false), 2000)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Progress submit failed:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }, [numericValue, isSubmitting, disabled, onSubmit])

    return (
        <section className={twMerge("bg-white rounded-3xl border border-slate-100 p-5", className)}>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-emerald-500" />
                İlerleme Kaydet
            </h2>

            {/* Input Row */}
            <div className="flex items-center gap-3">
                {/* Decrement Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleDecrement}
                    disabled={numericValue <= 0 || disabled}
                    className={twMerge(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        numericValue > 0
                            ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                    )}
                >
                    <Minus className="w-5 h-5" />
                </motion.button>

                {/* Value Input */}
                <div className="flex-1 relative">
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="0"
                        disabled={disabled}
                        className={twMerge(
                            "w-full px-4 py-4 rounded-2xl text-center text-2xl font-black",
                            "border-2 transition-all",
                            "placeholder:text-slate-200",
                            "focus:outline-none focus:ring-0",
                            disabled
                                ? "bg-slate-50 border-slate-100 text-slate-400"
                                : numericValue > 0
                                    ? "border-violet-300 bg-violet-50/50 text-violet-700 focus:border-violet-400"
                                    : "border-slate-200 text-slate-700 focus:border-slate-300"
                        )}
                    />
                    {/* Unit Label */}
                    {unit && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 
                                         text-sm font-medium text-slate-400">
                            {unit}
                        </span>
                    )}
                </div>

                {/* Increment Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleIncrement}
                    disabled={disabled}
                    className={twMerge(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        "bg-slate-100 hover:bg-slate-200 text-slate-600",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    <Plus className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Submit Button */}
            <motion.button
                whileHover={numericValue > 0 ? { scale: 1.02 } : {}}
                whileTap={numericValue > 0 ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={numericValue <= 0 || isSubmitting || disabled}
                className={twMerge(
                    "w-full mt-4 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2",
                    "transition-all",
                    numericValue > 0 && !isSubmitting
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
            >
                <AnimatePresence mode="wait">
                    {isSubmitting ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                        >
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </motion.div>
                    ) : showSuccess ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex items-center gap-2"
                        >
                            <Check className="w-5 h-5" />
                            Kaydedildi!
                        </motion.div>
                    ) : (
                        <motion.span
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {numericValue > 0 ? `+${numericValue} ${unit} Ekle` : 'Değer Gir'}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Quick Add Buttons */}
            {!disabled && (
                <div className="flex items-center justify-center gap-2 mt-3">
                    {[1, 5, 10].map((quickVal) => (
                        <motion.button
                            key={quickVal}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setValue(String(quickVal))}
                            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 
                                       text-xs font-semibold text-slate-600 transition-colors"
                        >
                            +{quickVal}
                        </motion.button>
                    ))}
                </div>
            )}
        </section>
    )
}
