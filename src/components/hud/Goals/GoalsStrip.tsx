'use client'

import { motion } from 'framer-motion'
import { Plus, Target, ChevronRight } from 'lucide-react'
import type { GoalWithDetails } from '@/types/database.types'
import GoalCard from './GoalCard'

interface GoalsStripProps {
    goals: GoalWithDetails[]
    onGoalClick: (goal: GoalWithDetails) => void
    onCreateClick: () => void
    onViewAllClick: () => void
    isLoading?: boolean
}

export default function GoalsStrip({
    goals,
    onGoalClick,
    onCreateClick,
    onViewAllClick,
    isLoading = false
}: GoalsStripProps) {
    // Filter only active goals and limit (can increase limit since we scroll now)
    const activeGoals = goals.filter(g => !g.is_completed).slice(0, 10)

    if (isLoading) {
        return (
            <div className="w-full px-4 mb-4">
                <div className="bg-white/30 backdrop-blur-lg border border-white/50 rounded-3xl p-4 flex items-center gap-4">
                    <div className="flex-none">
                        <div className="w-12 h-12 rounded-2xl bg-slate-200/60 animate-pulse" />
                    </div>
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-none w-40 h-16 rounded-2xl bg-slate-200/40 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (activeGoals.length === 0) {
        return (
            <div className="w-full px-4 mb-4">
                <motion.button
                    onClick={onCreateClick}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full bg-gradient-to-r from-violet-500/5 to-indigo-500/5 backdrop-blur-xl 
                             border border-violet-200/50 rounded-3xl p-5 
                             flex items-center justify-center gap-4
                             hover:from-violet-500/10 hover:to-indigo-500/10 hover:border-violet-300/50
                             transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                  flex items-center justify-center shadow-lg shadow-violet-500/30
                                  group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="text-base font-bold text-slate-700">İlk Hedefini Belirle</p>
                        <p className="text-xs text-slate-500 mt-0.5">Büyük yolculuklar küçük adımlarla başlar.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-violet-300 ml-auto 
                                  flex items-center justify-center group-hover:border-violet-500 transition-colors">
                        <Plus className="w-5 h-5 text-violet-400 group-hover:text-violet-600 transition-colors" />
                    </div>
                </motion.button>
            </div>
        )
    }

    return (
        <div className="w-full px-4 mb-8">
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-4 flex flex-col items-start gap-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                {/* Header Section */}
                <div className="flex items-center justify-between w-full px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Target className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Hedeflerin</h2>
                            <p className="text-xs text-slate-500 font-medium">Büyük resme odaklan</p>
                        </div>
                    </div>

                    <button
                        onClick={onViewAllClick}
                        className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full transition-colors"
                    >
                        Tümünü Gör
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Scrollable Goals Container - INCREASED HEIGHT FOR MONOLITH */}
                <div className="w-full overflow-x-auto scrollbar-hide py-2 pb-4 snap-x snap-mandatory">
                    <div className="flex gap-4 min-w-min px-2">
                        {activeGoals.map((goal, index) => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onClick={onGoalClick}
                                index={index}
                            />
                        ))}

                        {/* Add Goal Button - Tall Version */}
                        <motion.button
                            onClick={onCreateClick}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.02, rotate: 0 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-none w-[100px] h-[300px] rounded-[2rem] border-2 border-dashed border-violet-300/50
                                     flex flex-col items-center justify-center gap-2 snap-center
                                     hover:border-violet-400 hover:bg-violet-50/50
                                     transition-all duration-200 group"
                            aria-label="Yeni hedef ekle"
                        >
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-violet-500" />
                            </div>
                            <span className="text-xs font-bold text-violet-400 group-hover:text-violet-600">Yeni Ekle</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    )
}
