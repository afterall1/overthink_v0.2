'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, ArrowLeft, Trash2, Target, CheckCircle2, ListTodo, TrendingUp, Calendar } from 'lucide-react'
import GoalCard from './GoalCard'
import MilestoneList from './MilestoneList'
import ProgressRing from './ProgressRing'
import type { GoalWithDetails, Category, GoalPeriod } from '@/types/database.types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface GoalsPanelProps {
    isOpen: boolean
    onClose: () => void
    goals: GoalWithDetails[]
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]
    onCreateClick: () => void
    onGoalClick: (goal: GoalWithDetails) => void
    onDeleteGoal: (goalId: string) => void
    onToggleMilestone: (milestoneId: string) => void
    onLogProgress: (goalId: string, value: number, notes?: string) => Promise<void>
    isLoading?: boolean
}

const periodConfig = {
    daily: { label: 'Günlük', color: 'emerald' as const },
    weekly: { label: 'Haftalık', color: 'blue' as const },
    monthly: { label: 'Aylık', color: 'violet' as const },
    yearly: { label: 'Yıllık', color: 'amber' as const }
}

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value || 0
    const percentage = (current / goal.target_value) * 100
    return Math.min(100, Math.max(0, percentage))
}

export default function GoalsPanel({
    isOpen,
    onClose,
    goals,
    categories,
    onCreateClick,
    onGoalClick,
    onDeleteGoal,
    onToggleMilestone,
    onLogProgress,
    isLoading = false
}: GoalsPanelProps) {
    const [selectedGoal, setSelectedGoal] = useState<GoalWithDetails | null>(null)
    const [progressValue, setProgressValue] = useState<string>('')
    const [progressNote, setProgressNote] = useState<string>('')
    const [filterPeriod, setFilterPeriod] = useState<GoalPeriod | 'all'>('all')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Sync selectedGoal with updated goals from parent
    // This ensures UI updates immediately after logProgress
    useEffect(() => {
        if (selectedGoal) {
            const updatedGoal = goals.find(g => g.id === selectedGoal.id)
            if (updatedGoal) {
                // Only update if values actually changed to avoid unnecessary re-renders
                if (
                    updatedGoal.current_value !== selectedGoal.current_value ||
                    updatedGoal.is_completed !== selectedGoal.is_completed
                ) {
                    setSelectedGoal(updatedGoal)
                }
            } else {
                // Goal was deleted, go back to list
                setSelectedGoal(null)
            }
        }
    }, [goals, selectedGoal])

    const activeGoals = goals.filter(g => !g.is_completed)
    const completedGoals = goals.filter(g => g.is_completed)
    const filteredGoals = filterPeriod === 'all'
        ? activeGoals
        : activeGoals.filter(g => g.period === filterPeriod)

    const handleGoalSelect = (goal: GoalWithDetails) => {
        setSelectedGoal(goal)
    }

    const handleBack = () => {
        setSelectedGoal(null)
        setProgressValue('')
        setProgressNote('')
    }

    const handleProgressSubmit = async () => {
        if (!selectedGoal || !progressValue || isSubmitting) return
        const value = parseFloat(progressValue)
        if (isNaN(value) || value <= 0) return

        setIsSubmitting(true)
        try {
            await onLogProgress(selectedGoal.id, value, progressNote || undefined)
            setProgressValue('')
            setProgressNote('')
        } catch (error) {
            console.error('Failed to log progress:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const progress = selectedGoal ? calculateProgress(selectedGoal) : 0
    const period = selectedGoal ? periodConfig[selectedGoal.period] : null

    return (
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
                                 shadow-2xl shadow-indigo-500/10 z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-100/50">
                            {selectedGoal ? (
                                <button
                                    onClick={handleBack}
                                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    <span className="font-medium">Geri</span>
                                </button>
                            ) : (
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
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                aria-label="Kapat"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <span className="w-8 h-8 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
                                </div>
                            ) : selectedGoal ? (
                                /* Goal Detail View */
                                <div className="space-y-6">
                                    {/* Goal Header */}
                                    <div className="flex items-start gap-4">
                                        <ProgressRing
                                            progress={progress}
                                            size={72}
                                            strokeWidth={5}
                                            color={period?.color || 'violet'}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
                                                    ${period?.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : ''}
                                                    ${period?.color === 'blue' ? 'bg-blue-50 text-blue-600' : ''}
                                                    ${period?.color === 'violet' ? 'bg-violet-50 text-violet-600' : ''}
                                                    ${period?.color === 'amber' ? 'bg-amber-50 text-amber-600' : ''}
                                                `}>
                                                    {period?.label}
                                                </span>
                                                {selectedGoal.is_completed && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600">
                                                        ✓ Tamamlandı
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">
                                                {selectedGoal.title}
                                            </h3>
                                            {selectedGoal.description && (
                                                <p className="text-sm text-slate-500">{selectedGoal.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white/50 rounded-2xl p-4 border border-white/60 text-center">
                                            <TrendingUp className="w-5 h-5 text-violet-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-slate-800">
                                                {selectedGoal.current_value || 0}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Mevcut</p>
                                        </div>
                                        <div className="bg-white/50 rounded-2xl p-4 border border-white/60 text-center">
                                            <Target className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-slate-800">
                                                {selectedGoal.target_value || '-'}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Hedef</p>
                                        </div>
                                        <div className="bg-white/50 rounded-2xl p-4 border border-white/60 text-center">
                                            <ListTodo className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                                            <p className="text-xl font-bold text-slate-800">
                                                {selectedGoal.goal_milestones?.filter(m => m.is_completed).length || 0}
                                                <span className="text-slate-400 text-sm">/{selectedGoal.goal_milestones?.length || 0}</span>
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">Adımlar</p>
                                        </div>
                                    </div>

                                    {/* Quick Progress Logger */}
                                    {!selectedGoal.is_completed && selectedGoal.target_value && (
                                        <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-4 border border-violet-100">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                Hızlı İlerleme Kaydet
                                            </h4>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={progressValue}
                                                    onChange={(e) => setProgressValue(e.target.value)}
                                                    placeholder={`Değer (${selectedGoal.unit || 'birim'})`}
                                                    className="ethereal-input flex-1"
                                                    min="0"
                                                    step="any"
                                                />
                                                <button
                                                    onClick={handleProgressSubmit}
                                                    disabled={!progressValue || isSubmitting}
                                                    className="px-4 py-2 bg-violet-600 text-white rounded-xl font-semibold
                                                             hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed
                                                             transition-colors min-w-[60px] flex items-center justify-center"
                                                >
                                                    {isSubmitting ? (
                                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        'Ekle'
                                                    )}
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={progressNote}
                                                onChange={(e) => setProgressNote(e.target.value)}
                                                placeholder="Not (opsiyonel)"
                                                className="ethereal-input mt-2"
                                            />
                                        </div>
                                    )}

                                    {/* Milestones */}
                                    {selectedGoal.goal_milestones && selectedGoal.goal_milestones.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Alt Hedefler
                                            </h4>
                                            <MilestoneList
                                                milestones={selectedGoal.goal_milestones}
                                                onToggle={onToggleMilestone}
                                            />
                                        </div>
                                    )}

                                    {/* Date Info */}
                                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-white/40 rounded-xl p-3">
                                        <Calendar className="w-4 h-4" />
                                        <span>
                                            {format(new Date(selectedGoal.start_date), 'd MMMM yyyy', { locale: tr })}
                                            {selectedGoal.end_date && (
                                                <> - {format(new Date(selectedGoal.end_date), 'd MMMM yyyy', { locale: tr })}</>
                                            )}
                                        </span>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => {
                                            onDeleteGoal(selectedGoal.id)
                                            handleBack()
                                        }}
                                        className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 font-semibold
                                                 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Hedefi Sil
                                    </button>
                                </div>
                            ) : (
                                /* Goals List View */
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

                                    {/* Active Goals */}
                                    {filteredGoals.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 
                                                          flex items-center justify-center">
                                                <Target className="w-8 h-8 text-violet-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Henüz hedef yok</h3>
                                            <p className="text-sm text-slate-400 mb-6">İlk hedefini oluşturarak başla</p>
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
                                        <div className="space-y-3">
                                            {filteredGoals.map(goal => (
                                                <GoalCard
                                                    key={goal.id}
                                                    goal={goal}
                                                    onClick={handleGoalSelect}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Completed Goals */}
                                    {completedGoals.length > 0 && filterPeriod === 'all' && (
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                Tamamlanan ({completedGoals.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {completedGoals.slice(0, 3).map(goal => (
                                                    <GoalCard
                                                        key={goal.id}
                                                        goal={goal}
                                                        onClick={handleGoalSelect}
                                                        compact
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer - Create Button */}
                        {!selectedGoal && (
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
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
