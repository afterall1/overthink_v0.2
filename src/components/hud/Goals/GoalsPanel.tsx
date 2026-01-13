'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Target, CheckCircle2, ListTodo, TrendingUp, Calendar } from 'lucide-react'
import GoalCard from './GoalCard'
import GoalDetail from './GoalDetail' // [NEW] World-class redesign
import type { GoalWithDetails, Category, GoalPeriod } from '@/types/database.types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import type { DailyQuest } from '@/types/database.types'

interface GoalsPanelProps {
    isOpen: boolean
    onClose: () => void
    goals: GoalWithDetails[]
    quests: DailyQuest[] // [NEW] All quests for filtering
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]
    onCreateClick: () => void
    selectedGoalId: string | null // [NEW] Controlled state
    onGoalSelect: (id: string | null) => void // [NEW] Handler
    onDeleteGoal: (goalId: string) => Promise<void>
    onEditGoal?: (goal: GoalWithDetails) => void // [NEW] Edit handler
    onToggleMilestone: (milestoneId: string) => void
    onLogProgress: (goalId: string, value: number, notes?: string) => Promise<void>
    // Quest management callbacks
    onCompleteQuest: (questId: string) => Promise<void>
    onSkipQuest: (questId: string) => Promise<void>
    onDeleteQuest?: (questId: string) => Promise<void>
    isLoading?: boolean
}

const periodConfig = {
    daily: { label: 'Günlük', color: 'emerald' as const },
    weekly: { label: 'Haftalık', color: 'blue' as const },
    monthly: { label: 'Aylık', color: 'violet' as const },
    yearly: { label: 'Yıllık', color: 'amber' as const }
}

export default function GoalsPanel({
    isOpen,
    onClose,
    goals,
    quests,
    categories,
    onCreateClick,
    selectedGoalId,
    onGoalSelect,
    onDeleteGoal,
    onEditGoal,
    onToggleMilestone,
    onLogProgress,
    onCompleteQuest,
    onSkipQuest,
    onDeleteQuest,
    isLoading = false
}: GoalsPanelProps) {
    // Filter State
    const [filterPeriod, setFilterPeriod] = useState<GoalPeriod | 'all'>('all')

    // Find the full goal object from ID
    const selectedGoal = goals.find(g => g.id === selectedGoalId) || null

    // Filter quests linked to the selected goal
    const linkedQuests = selectedGoalId
        ? quests.filter(q => q.goal_id === selectedGoalId)
        : []

    const activeGoals = goals.filter(g => !g.is_completed)
    const completedGoals = goals.filter(g => g.is_completed)
    const filteredGoals = filterPeriod === 'all'
        ? activeGoals
        : activeGoals.filter(g => g.period === filterPeriod)

    // Handlers
    const handleGoalSelect = (goal: GoalWithDetails) => {
        onGoalSelect(goal.id)
    }

    const handleUpdateProgress = async (value: number, notes?: string) => {
        if (!selectedGoalId) return
        await onLogProgress(selectedGoalId, value, notes)
    }

    return (
        <>
            {/* Main Side Panel (Listing) */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/10 backdrop-blur-sm z-40"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed left-0 bottom-0 top-0 w-full max-w-md bg-white/95 backdrop-blur-xl 
                                     shadow-2xl shadow-indigo-500/10 z-[45] flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                                  flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">Hedeflerim</h2>
                                        <p className="text-xs text-slate-400">{activeGoals.length} aktif hedef</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-5">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <span className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Period Filter */}
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            <button
                                                onClick={() => setFilterPeriod('all')}
                                                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                                                    ${filterPeriod === 'all'
                                                        ? 'bg-slate-800 text-white shadow-lg'
                                                        : 'bg-white/50 text-slate-600 hover:bg-white/80'
                                                    }`}
                                            >
                                                Tümü
                                            </button>
                                            {Object.entries(periodConfig).map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setFilterPeriod(key as GoalPeriod)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all
                                                        ${filterPeriod === key
                                                            ? `${config.color === 'emerald' ? 'bg-emerald-500' : ''}
                                                               ${config.color === 'blue' ? 'bg-blue-500' : ''}
                                                               ${config.color === 'violet' ? 'bg-violet-500' : ''}
                                                               ${config.color === 'amber' ? 'bg-amber-500' : ''}
                                                               text-white shadow-lg`
                                                            : 'bg-white/50 text-slate-600 hover:bg-white/80'
                                                        }`}
                                                >
                                                    {config.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Active Goals Grid */}
                                        {filteredGoals.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 
                                                              flex items-center justify-center">
                                                    <Target className="w-8 h-8 text-violet-400" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz hedef yok</h3>
                                                <button
                                                    onClick={onCreateClick}
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 
                                                             text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/30
                                                             hover:shadow-xl transition-all"
                                                >
                                                    <Plus className="w-5 h-5" />
                                                    Hedef Oluştur
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Use Monolith Cards here too? Or maybe compact version? 
                                                    Let's use Grid of Monoliths for consistency since we updated GoalCard 
                                                    to be Monolith style (vertical).
                                                    Wait, GoalCard is fixed width/height. We might need a flexible wrapper.
                                                    GoalCard has fixed w-[180px] h-[300px]. 
                                                    In a 2-col grid on mobile, 180px might be wide.
                                                    Let's let GoalCard handle its own dimensions or allow override via className?
                                                    GoalCard has `className` prop? No.
                                                    Let's check GoalCard definition...
                                                    It has `twMerge` merging classes. We can wrap it. 
                                                    Ideally we let GoalCard be the card.
                                                    In a narrow panel (max-w-md = 448px), 2 cols of 180px = 360px + gap. Fits.
                                                */}
                                                {filteredGoals.map(goal => (
                                                    <div key={goal.id} className="flex justify-center">
                                                        <GoalCard
                                                            goal={goal}
                                                            onClick={handleGoalSelect}
                                                        // We don't render index animation here to keep it simple or pass index
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Completed Section... (Simplified for now to focus on detail) */}
                                    </div>
                                )}
                            </div>

                            {/* Footer - Create Button */}
                            <div className="p-5 border-t border-slate-100/50">
                                <button
                                    onClick={onCreateClick}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 
                                             text-white font-bold shadow-lg shadow-violet-500/30
                                             hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
                                             transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Yeni Hedef Ekle
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* THE COMMAND CENTER MODAL */}
            {/* Rendered outside the panel AnimatePresence, so it can overlay everything */}
            <GoalDetail
                isOpen={!!selectedGoal}
                onClose={() => onGoalSelect(null)}
                goal={selectedGoal}
                linkedQuests={linkedQuests}
                onUpdateProgress={handleUpdateProgress}
                onToggleMilestone={onToggleMilestone}
                onEdit={onEditGoal}
                onDelete={onDeleteGoal}
                onCompleteQuest={onCompleteQuest}
                onSkipQuest={onSkipQuest}
                onDeleteQuest={onDeleteQuest}
                isLoading={isLoading}
            />
        </>
    )
}
