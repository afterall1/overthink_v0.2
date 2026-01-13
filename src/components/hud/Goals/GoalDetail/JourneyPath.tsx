'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { twMerge } from 'tailwind-merge'
import { CheckCircle2, Circle, Trophy, Flag } from 'lucide-react'
import type { GoalMilestone } from '@/types/database.types'

// =====================================================
// Types
// =====================================================

interface JourneyPathProps {
    milestones: GoalMilestone[]
    currentValue: number
    targetValue: number
    unit?: string
    className?: string
    onMilestoneClick?: (milestoneId: string) => void
}

interface PathNode {
    id: string
    title: string
    targetValue: number
    position: number // 0-100 percentage
    isCompleted: boolean
    isCurrent: boolean
}

// =====================================================
// Component
// =====================================================

export default function JourneyPath({
    milestones,
    currentValue,
    targetValue,
    unit = '',
    className,
    onMilestoneClick
}: JourneyPathProps) {
    // Prepare nodes along the path
    const nodes = useMemo((): PathNode[] => {
        if (milestones.length === 0 || targetValue === 0) return []

        return milestones
            .sort((a, b) => (a.target_value ?? 0) - (b.target_value ?? 0))
            .map((m, index, arr) => {
                const msTarget = m.target_value ?? 0
                const position = (msTarget / targetValue) * 100
                const isCompleted = m.is_completed || currentValue >= msTarget

                // Current is the first uncompleted milestone
                const isCurrent = !isCompleted &&
                    (index === 0 || arr.slice(0, index).every(prev =>
                        prev.is_completed || currentValue >= (prev.target_value ?? 0)
                    ))

                return {
                    id: m.id,
                    title: m.title,
                    targetValue: msTarget,
                    position: Math.min(position, 100),
                    isCompleted,
                    isCurrent
                }
            })
    }, [milestones, currentValue, targetValue])

    // Current progress position on path
    const progressPosition = targetValue > 0
        ? Math.min((currentValue / targetValue) * 100, 100)
        : 0

    if (nodes.length === 0) return null

    return (
        <section className={twMerge("bg-white rounded-3xl border border-slate-100 p-5", className)}>
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-6">
                <Flag className="w-4 h-4 text-violet-500" />
                Yolculuk Haritası
            </h2>

            {/* SVG Path Visualization */}
            <div className="relative h-24">
                {/* Base Path Line */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    {/* Background Path */}
                    <line
                        x1="5%"
                        y1="50%"
                        x2="95%"
                        y2="50%"
                        strokeWidth={4}
                        strokeLinecap="round"
                        className="stroke-slate-100"
                    />

                    {/* Progress Path */}
                    <motion.line
                        x1="5%"
                        y1="50%"
                        x2={`${5 + progressPosition * 0.9}%`}
                        y2="50%"
                        strokeWidth={4}
                        strokeLinecap="round"
                        className="stroke-violet-500"
                        initial={{ x2: "5%" }}
                        animate={{ x2: `${5 + progressPosition * 0.9}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))'
                        }}
                    />
                </svg>

                {/* Start Node */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: '5%', transform: 'translateX(-50%) translateY(-50%)' }}
                >
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center
                                    shadow-md shadow-emerald-500/30">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 whitespace-nowrap">Başlangıç</span>
                </div>

                {/* Milestone Nodes */}
                {nodes.map((node, index) => (
                    <motion.div
                        key={node.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.15 }}
                        className="absolute top-1/2 flex flex-col items-center cursor-pointer group"
                        style={{
                            left: `${5 + node.position * 0.9}%`,
                            transform: 'translateX(-50%) translateY(-50%)'
                        }}
                        onClick={() => onMilestoneClick?.(node.id)}
                    >
                        {/* Node Circle */}
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            className={twMerge(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                node.isCompleted
                                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30"
                                    : node.isCurrent
                                        ? "bg-gradient-to-br from-violet-400 to-purple-500 shadow-lg shadow-violet-500/30 ring-4 ring-violet-200"
                                        : "bg-slate-200 border-2 border-slate-300"
                            )}
                        >
                            {node.isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-white" />
                            ) : node.isCurrent ? (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <Circle className="w-3 h-3 text-white fill-white" />
                                </motion.div>
                            ) : (
                                <Circle className="w-3 h-3 text-slate-400" />
                            )}
                        </motion.div>

                        {/* Label */}
                        <div className="absolute top-full mt-2 flex flex-col items-center">
                            <span className={twMerge(
                                "text-[10px] font-medium whitespace-nowrap max-w-[60px] truncate",
                                node.isCompleted ? "text-emerald-600" :
                                    node.isCurrent ? "text-violet-600" : "text-slate-400"
                            )}>
                                {node.title}
                            </span>
                            <span className="text-[9px] text-slate-400">
                                {node.targetValue} {unit}
                            </span>
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                            <div className="bg-slate-800 text-white text-[10px] px-2 py-1 
                                            rounded-lg whitespace-nowrap shadow-lg">
                                <p className="font-semibold">{node.title}</p>
                                <p className="text-slate-300">
                                    {node.isCompleted ? '✅ Tamamlandı' : `${node.targetValue} ${unit}`}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Current Position Indicator (if not at a milestone) */}
                {!nodes.some(n => n.isCurrent) && progressPosition > 0 && progressPosition < 100 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1/2 flex flex-col items-center pointer-events-none"
                        style={{
                            left: `${5 + progressPosition * 0.9}%`,
                            transform: 'translateX(-50%) translateY(-50%)'
                        }}
                    >
                        <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white shadow-lg"
                        />
                    </motion.div>
                )}

                {/* Final Goal (Trophy) */}
                <div
                    className="absolute top-1/2 flex flex-col items-center"
                    style={{ left: '95%', transform: 'translateX(-50%) translateY(-50%)' }}
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: [0, -10, 10, -5, 0] }}
                        className={twMerge(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            progressPosition >= 100
                                ? "bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/40"
                                : "bg-slate-100 border-2 border-dashed border-slate-300"
                        )}
                    >
                        <Trophy className={twMerge(
                            "w-5 h-5",
                            progressPosition >= 100 ? "text-white" : "text-slate-400"
                        )} />
                    </motion.div>
                    <span className="text-[9px] text-slate-500 mt-1 whitespace-nowrap font-medium">
                        {targetValue} {unit}
                    </span>
                </div>
            </div>
        </section>
    )
}
