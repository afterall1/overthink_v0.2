'use client'

/**
 * Time Control Panel - Development-only floating panel for time manipulation
 * 
 * Provides UI controls to:
 * - View current simulated date
 * - Jump to a specific date
 * - Advance/rewind by day
 * - Reset to real time
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    Calendar,
    X,
    Bug,
    ChevronDown,
    ChevronUp
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
    getCurrentDate,
    setTestDate,
    advanceDays,
    rewindDays,
    resetToRealTime,
    isTimeSimulated,
    getTimeOffset,
    subscribeToTimeChanges,
    isDevMode
} from '@/lib/timeService'

// Don't render in production at all
export default function TimeControlPanel() {
    // Only render in development
    if (!isDevMode()) {
        return null
    }

    return <TimeControlPanelInner />
}

function TimeControlPanelInner() {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(false)
    const [currentDate, setCurrentDate] = useState(getCurrentDate())
    const [isSimulated, setIsSimulated] = useState(isTimeSimulated())
    const [offset, setOffset] = useState(getTimeOffset())
    const [dateInput, setDateInput] = useState('')

    // Refresh the entire app when time changes
    const refreshApp = useCallback(() => {
        // Small delay to ensure time state is updated
        setTimeout(() => {
            router.refresh()
        }, 50)
    }, [router])

    // Subscribe to time changes
    useEffect(() => {
        const unsubscribe = subscribeToTimeChanges((date) => {
            setCurrentDate(date)
            setIsSimulated(isTimeSimulated())
            setOffset(getTimeOffset())
        })

        return unsubscribe
    }, [])

    // Update state periodically for real-time mode
    useEffect(() => {
        if (isSimulated) return

        const interval = setInterval(() => {
            setCurrentDate(getCurrentDate())
        }, 60000) // Update every minute

        return () => clearInterval(interval)
    }, [isSimulated])

    const handleAdvance = useCallback(() => {
        advanceDays(1)
        refreshApp()
    }, [refreshApp])

    const handleRewind = useCallback(() => {
        rewindDays(1)
        refreshApp()
    }, [refreshApp])

    const handleReset = useCallback(() => {
        resetToRealTime()
        refreshApp()
    }, [refreshApp])

    const handleDateSubmit = useCallback(() => {
        if (!dateInput) return
        try {
            const date = parseISO(dateInput)
            setTestDate(date)
            setDateInput('')
            refreshApp()
        } catch (error) {
            console.error('Invalid date format:', error)
        }
    }, [dateInput, refreshApp])

    const handleQuickJump = useCallback((days: number) => {
        const target = new Date()
        target.setDate(target.getDate() + days)
        setTestDate(target)
        refreshApp()
    }, [refreshApp])

    return (
        <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 z-[9999]"
        >
            {/* Collapsed Button */}
            <AnimatePresence>
                {!isExpanded && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={() => setIsExpanded(true)}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
                            font-medium text-sm
                            ${isSimulated
                                ? 'bg-amber-500 text-white'
                                : 'bg-slate-800 text-white'
                            }
                            hover:scale-105 transition-transform
                        `}
                    >
                        <Bug className="w-4 h-4" />
                        <span>{format(currentDate, 'd MMM', { locale: tr })}</span>
                        {offset !== 0 && (
                            <span className="text-xs opacity-75">
                                ({offset > 0 ? '+' : ''}{offset}d)
                            </span>
                        )}
                        <ChevronUp className="w-3 h-3" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-slate-900 text-white rounded-2xl shadow-2xl overflow-hidden w-72"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-3 bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <Bug className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-sm">Time Travel</span>
                                {isSimulated && (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 rounded-full">
                                        SIMULATED
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Current Date Display */}
                        <div className="p-4 text-center border-b border-slate-700/50">
                            <div className="text-3xl font-bold">
                                {format(currentDate, 'd MMMM yyyy', { locale: tr })}
                            </div>
                            <div className="text-sm text-slate-400 mt-1">
                                {format(currentDate, 'EEEE', { locale: tr })}
                            </div>
                            {offset !== 0 && (
                                <div className={`text-xs mt-2 ${offset > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                                    Gerçek zamandan {Math.abs(offset)} gün {offset > 0 ? 'ileri' : 'geri'}
                                </div>
                            )}
                        </div>

                        {/* Day Navigation */}
                        <div className="flex items-center justify-between p-3 border-b border-slate-700/50">
                            <button
                                onClick={handleRewind}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 
                                         rounded-lg transition-colors text-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                -1 Gün
                            </button>
                            <Clock className="w-5 h-5 text-slate-500" />
                            <button
                                onClick={handleAdvance}
                                className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 
                                         rounded-lg transition-colors text-sm"
                            >
                                +1 Gün
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Quick Jump Buttons */}
                        <div className="p-3 border-b border-slate-700/50">
                            <div className="text-xs text-slate-400 mb-2">Hızlı Atla</div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => handleQuickJump(-7)}
                                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 
                                             rounded transition-colors"
                                >
                                    -1 Hafta
                                </button>
                                <button
                                    onClick={() => handleQuickJump(-1)}
                                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 
                                             rounded transition-colors"
                                >
                                    Dün
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 
                                             rounded transition-colors"
                                >
                                    Bugün
                                </button>
                                <button
                                    onClick={() => handleQuickJump(1)}
                                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 
                                             rounded transition-colors"
                                >
                                    Yarın
                                </button>
                                <button
                                    onClick={() => handleQuickJump(7)}
                                    className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 
                                             rounded transition-colors"
                                >
                                    +1 Hafta
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Input */}
                        <div className="p-3">
                            <div className="text-xs text-slate-400 mb-2">Özel Tarih</div>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={dateInput}
                                    onChange={(e) => setDateInput(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-sm
                                             border border-slate-600 focus:border-amber-500 
                                             focus:outline-none transition-colors"
                                />
                                <button
                                    onClick={handleDateSubmit}
                                    disabled={!dateInput}
                                    className="px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50
                                             disabled:hover:bg-amber-500 rounded-lg transition-colors"
                                >
                                    <Calendar className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Reset Button */}
                        {isSimulated && (
                            <div className="p-3 pt-0">
                                <button
                                    onClick={handleReset}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 
                                             bg-red-500/20 hover:bg-red-500/30 text-red-400
                                             rounded-lg transition-colors text-sm"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Gerçek Zamana Dön
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
