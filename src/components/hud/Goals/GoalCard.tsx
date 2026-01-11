'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Calendar, Target as TargetIcon } from 'lucide-react'
import ProgressRing from './ProgressRing'
import type { GoalWithDetails } from '@/types/database.types'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

interface GoalCardProps {
    goal: GoalWithDetails
    onClick: (goal: GoalWithDetails) => void
    compact?: boolean
}

const periodConfig = {
    daily: { label: 'Günlük', color: 'emerald' as const, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    weekly: { label: 'Haftalık', color: 'blue' as const, bg: 'bg-blue-50', text: 'text-blue-600' },
    monthly: { label: 'Aylık', color: 'violet' as const, bg: 'bg-violet-50', text: 'text-violet-600' },
    yearly: { label: 'Yıllık', color: 'amber' as const, bg: 'bg-amber-50', text: 'text-amber-600' }
}

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value || 0
    const percentage = (current / goal.target_value) * 100
    return Math.min(100, Math.max(0, percentage))
}

export default function GoalCard({ goal, onClick, compact = false }: GoalCardProps) {
    const progress = calculateProgress(goal)
    const period = periodConfig[goal.period]
    const completedMilestones = goal.goal_milestones?.filter(m => m.is_completed).length || 0
    const totalMilestones = goal.goal_milestones?.length || 0

    if (compact) {
        return (
            <motion.button
                onClick={() => onClick(goal)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`
                    w-full flex items-center gap-3 p-3 rounded-xl
                    bg-white/40 border border-white/60 hover:bg-white/60
                    transition-all duration-200 text-left
                    ${goal.is_completed ? 'opacity-60' : ''}
                `}
            >
                <ProgressRing progress={progress} size={36} strokeWidth={3} color={period.color} />
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${goal.is_completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {goal.title}
                    </p>
                    <p className="text-xs text-slate-400">
                        {goal.current_value || 0} / {goal.target_value || '-'} {goal.unit || ''}
                    </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
            </motion.button>
        )
    }

    return (
        <motion.button
            onClick={() => onClick(goal)}
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.99 }}
            className={`
                w-full p-5 rounded-2xl text-left
                bg-white/50 backdrop-blur-md border border-white/60
                hover:bg-white/70 hover:shadow-lg hover:shadow-indigo-500/5
                transition-all duration-300 group
                ${goal.is_completed ? 'opacity-70' : ''}
            `}
        >
            <div className="flex items-start gap-4">
                {/* Progress Ring */}
                <ProgressRing progress={progress} size={56} strokeWidth={4} color={period.color} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${period.bg} ${period.text}`}>
                            {period.label}
                        </span>
                        {goal.categories && (
                            <span
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                                style={{
                                    backgroundColor: `${goal.categories.color_code}20`,
                                    color: goal.categories.color_code
                                }}
                            >
                                {goal.categories.name}
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h3 className={`text-base font-semibold mb-1 ${goal.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {goal.title}
                    </h3>

                    {/* Description */}
                    {goal.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                            {goal.description}
                        </p>
                    )}

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                        {/* Progress value */}
                        <div className="flex items-center gap-1">
                            <TargetIcon className="w-3.5 h-3.5" />
                            <span>
                                <strong className="text-slate-600">{goal.current_value || 0}</strong>
                                {goal.target_value && <> / {goal.target_value}</>}
                                {goal.unit && <> {goal.unit}</>}
                            </span>
                        </div>

                        {/* Milestones */}
                        {totalMilestones > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                <span>
                                    {completedMilestones}/{totalMilestones} adım
                                </span>
                            </div>
                        )}

                        {/* Date */}
                        {goal.end_date && (
                            <div className="flex items-center gap-1 ml-auto">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{format(new Date(goal.end_date), 'd MMM', { locale: tr })}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>
        </motion.button>
    )
}
