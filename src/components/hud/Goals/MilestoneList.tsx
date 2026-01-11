'use client'

import { motion } from 'framer-motion'
import { Check, Circle, Trash2 } from 'lucide-react'
import type { GoalMilestone } from '@/types/database.types'

interface MilestoneListProps {
    milestones: GoalMilestone[]
    onToggle: (id: string) => void
    onDelete?: (id: string) => void
    isEditing?: boolean
}

export default function MilestoneList({
    milestones,
    onToggle,
    onDelete,
    isEditing = false
}: MilestoneListProps) {
    if (milestones.length === 0) {
        return (
            <div className="text-center py-4 text-slate-400 text-sm">
                Henüz alt hedef eklenmemiş
            </div>
        )
    }

    const sortedMilestones = [...milestones].sort((a, b) => a.sort_order - b.sort_order)

    return (
        <ul className="space-y-2">
            {sortedMilestones.map((milestone, index) => (
                <motion.li
                    key={milestone.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                        goals-milestone-item group flex items-center gap-3 p-3 rounded-xl
                        ${milestone.is_completed
                            ? 'bg-emerald-50/50 border border-emerald-100'
                            : 'bg-white/40 border border-white/60 hover:bg-white/60'
                        }
                        transition-all duration-200
                    `}
                >
                    {/* Checkbox */}
                    <button
                        onClick={() => onToggle(milestone.id)}
                        className={`
                            relative w-6 h-6 min-w-[24px] rounded-lg border-2 
                            flex items-center justify-center transition-all duration-200
                            ${milestone.is_completed
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'border-slate-300 hover:border-violet-400 bg-white/80'
                            }
                        `}
                        aria-label={milestone.is_completed ? 'Tamamlanmadı olarak işaretle' : 'Tamamlandı olarak işaretle'}
                    >
                        {milestone.is_completed ? (
                            <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                            <Circle className="w-3 h-3 text-slate-200 group-hover:text-violet-300" />
                        )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className={`
                            text-sm font-medium truncate
                            ${milestone.is_completed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-700'
                            }
                        `}>
                            {milestone.title}
                        </p>
                        {milestone.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                                {milestone.description}
                            </p>
                        )}
                    </div>

                    {/* Target value badge */}
                    {milestone.target_value && (
                        <span className="text-xs font-semibold text-violet-600 bg-violet-100/80 px-2 py-1 rounded-full">
                            {milestone.target_value}
                        </span>
                    )}

                    {/* Delete button (only in edit mode) */}
                    {isEditing && onDelete && (
                        <button
                            onClick={() => onDelete(milestone.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg 
                                     text-slate-400 hover:text-red-500 hover:bg-red-50 
                                     transition-all duration-200"
                            aria-label="Alt hedefi sil"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </motion.li>
            ))}
        </ul>
    )
}
