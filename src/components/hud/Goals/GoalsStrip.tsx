'use client'

import { motion } from 'framer-motion'
import { Plus, Target, ChevronRight } from 'lucide-react'
import ProgressRing from './ProgressRing'
import type { GoalWithDetails, GoalPeriod } from '@/types/database.types'

interface GoalsStripProps {
    goals: GoalWithDetails[]
    onGoalClick: (goal: GoalWithDetails) => void
    onCreateClick: () => void
    onViewAllClick: () => void
    isLoading?: boolean
}

const periodConfig: Record<GoalPeriod, { label: string; color: 'emerald' | 'blue' | 'violet' | 'amber' }> = {
    daily: { label: 'Günlük', color: 'emerald' },
    weekly: { label: 'Haftalık', color: 'blue' },
    monthly: { label: 'Aylık', color: 'violet' },
    yearly: { label: 'Yıllık', color: 'amber' }
}

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value || 0
    const percentage = (current / goal.target_value) * 100
    return Math.min(100, Math.max(0, percentage))
}

export default function GoalsStrip({
    goals,
    onGoalClick,
    onCreateClick,
    onViewAllClick,
    isLoading = false
}: GoalsStripProps) {
    // Filter only active goals and limit to 5
    const activeGoals = goals.filter(g => !g.is_completed).slice(0, 5)

    if (isLoading) {
        return (
            <div className="w-full px-4">
                <div className="bg-white/30 backdrop-blur-lg border border-white/50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="flex-none">
                        <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse" />
                    </div>
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-none w-32 h-14 rounded-xl bg-slate-200/50 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (activeGoals.length === 0) {
        return (
            <div className="w-full px-4">
                <motion.button
                    onClick={onCreateClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-violet-500/10 to-indigo-500/10 backdrop-blur-lg 
                             border border-violet-200/50 rounded-2xl p-4 
                             flex items-center justify-center gap-3
                             hover:from-violet-500/20 hover:to-indigo-500/20 
                             transition-all duration-300 group"
                >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 
                                  flex items-center justify-center shadow-lg shadow-violet-500/30
                                  group-hover:scale-110 transition-transform">
                        <Target className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-semibold text-slate-700">Hedef Belirle</p>
                        <p className="text-xs text-slate-500">Günlük motivasyonunu artır</p>
                    </div>
                    <Plus className="w-5 h-5 text-violet-500 ml-auto group-hover:rotate-90 transition-transform duration-300" />
                </motion.button>
            </div>
        )
    }

    return (
        <div className="w-full px-4">
            <div className="bg-white/30 backdrop-blur-lg border border-white/50 rounded-2xl p-3 flex items-center gap-3">
                {/* Header Icon */}
                <button
                    onClick={onViewAllClick}
                    className="flex-none w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                             flex items-center justify-center shadow-lg shadow-violet-500/20
                             hover:scale-105 transition-transform"
                    aria-label="Tüm hedefleri gör"
                >
                    <Target className="w-5 h-5 text-white" />
                </button>

                {/* Scrollable Goals Container */}
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-min">
                        {activeGoals.map((goal, index) => {
                            const progress = calculateProgress(goal)
                            const period = periodConfig[goal.period]

                            return (
                                <motion.button
                                    key={goal.id}
                                    onClick={() => onGoalClick(goal)}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.03, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex-none flex items-center gap-2.5 px-3 py-2 rounded-xl
                                             bg-white/50 border border-white/60
                                             hover:bg-white/80 hover:shadow-md hover:shadow-indigo-500/5
                                             transition-all duration-200 group min-w-[140px] max-w-[180px]"
                                >
                                    <ProgressRing
                                        progress={progress}
                                        size={40}
                                        strokeWidth={3}
                                        color={period.color}
                                    />
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs font-semibold text-slate-700 truncate">
                                            {goal.title}
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            {goal.current_value || 0}/{goal.target_value || '∞'} {goal.unit || ''}
                                        </p>
                                    </div>
                                </motion.button>
                            )
                        })}

                        {/* Add Goal Button */}
                        <motion.button
                            onClick={onCreateClick}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex-none w-14 h-14 rounded-xl border-2 border-dashed border-violet-300/50
                                     flex items-center justify-center
                                     hover:border-violet-400 hover:bg-violet-50/50
                                     transition-all duration-200 group"
                            aria-label="Yeni hedef ekle"
                        >
                            <Plus className="w-5 h-5 text-violet-400 group-hover:text-violet-600 group-hover:rotate-90 transition-all duration-300" />
                        </motion.button>
                    </div>
                </div>

                {/* View All Arrow */}
                <button
                    onClick={onViewAllClick}
                    className="flex-none p-2 rounded-lg hover:bg-white/50 transition-colors"
                    aria-label="Tüm hedefleri gör"
                >
                    <ChevronRight className="w-5 h-5 text-slate-400 hover:text-violet-500 transition-colors" />
                </button>
            </div>
        </div>
    )
}
