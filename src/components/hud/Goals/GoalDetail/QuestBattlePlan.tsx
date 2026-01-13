'use client'

import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import {
    CheckCircle2, Clock, Zap, Target, ChevronRight,
    Sparkles, Trophy
} from 'lucide-react'
import type { DailyQuest } from '@/types/database.types'
import type { QuestContribution } from './types'

// =====================================================
// Types
// =====================================================

interface QuestBattlePlanProps {
    quests: QuestContribution[]
    goalUnit?: string
    className?: string
    onQuestClick?: (questId: string) => void
}

// =====================================================
// Sub-Components
// =====================================================

function QuestBattleCard({
    quest,
    index,
    onClick
}: {
    quest: QuestContribution
    index: number
    onClick?: () => void
}) {
    const isCompleted = quest.status === 'completed'
    const isPending = quest.status === 'pending'

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={twMerge(
                "relative overflow-hidden rounded-2xl p-4 cursor-pointer transition-all",
                "border-2",
                isCompleted
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                    : "bg-white border-slate-100 hover:border-violet-200",
                isPending && "hover:shadow-md"
            )}
        >
            {/* Completed Shine Effect */}
            {isCompleted && (
                <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent 
                               skew-x-12 pointer-events-none"
                />
            )}

            {/* Pending Pulse Border */}
            {isPending && (
                <div className="absolute inset-0 rounded-2xl border-2 border-violet-300 
                               animate-pulse pointer-events-none" />
            )}

            <div className="flex items-center gap-3 relative">
                {/* Status Icon */}
                <div className={twMerge(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    isCompleted
                        ? "bg-emerald-500 shadow-lg shadow-emerald-500/30"
                        : "bg-slate-100"
                )}>
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                        <span className="text-lg">{quest.emoji}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className={twMerge(
                        "text-sm font-semibold truncate",
                        isCompleted ? "text-slate-600" : "text-slate-800"
                    )}>
                        {quest.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                        {/* Contribution Type Badge */}
                        <span className={twMerge(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                            quest.contributionType === 'direct'
                                ? "bg-teal-100 text-teal-700"
                                : "bg-amber-100 text-amber-700"
                        )}>
                            {quest.contributionType === 'momentum' && <Zap className="w-2.5 h-2.5" />}
                            {quest.contributionType === 'direct' ? 'Direkt' : 'Momentum'}
                        </span>

                        {/* Contribution Value */}
                        <span className="text-[10px] text-slate-500">
                            +{quest.contributionValue}
                        </span>
                    </div>
                </div>

                {/* XP Reward */}
                <div className={twMerge(
                    "flex items-center gap-1 px-2 py-1 rounded-lg font-bold text-xs",
                    isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-violet-100 text-violet-700"
                )}>
                    <Sparkles className="w-3 h-3" />
                    {quest.xpReward} XP
                </div>
            </div>

            {/* Complete Now CTA for Pending */}
            {isPending && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-end gap-1 mt-3 text-xs font-medium text-violet-600"
                >
                    Şimdi Tamamla
                    <ChevronRight className="w-4 h-4" />
                </motion.div>
            )}
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function QuestBattlePlan({
    quests,
    goalUnit,
    className,
    onQuestClick
}: QuestBattlePlanProps) {
    if (quests.length === 0) return null

    const completedCount = quests.filter(q => q.status === 'completed').length
    const totalXP = quests.reduce((sum, q) => sum + q.xpReward, 0)
    const earnedXP = quests
        .filter(q => q.status === 'completed')
        .reduce((sum, q) => sum + q.xpReward, 0)
    const allCompleted = completedCount === quests.length

    return (
        <section className={twMerge("bg-white rounded-3xl border border-slate-100 p-5", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-violet-500" />
                    Savaş Planı
                </h2>
                <div className="flex items-center gap-3">
                    {/* Progress Counter */}
                    <span className="text-xs text-slate-500">
                        <span className={twMerge(
                            "font-bold",
                            allCompleted ? "text-emerald-600" : "text-violet-600"
                        )}>
                            {completedCount}/{quests.length}
                        </span>
                        {" "}görev
                    </span>

                    {/* XP Counter */}
                    <span className="flex items-center gap-1 px-2 py-1 rounded-full 
                                     bg-gradient-to-r from-violet-100 to-purple-100 
                                     text-xs font-bold text-violet-700">
                        <Sparkles className="w-3 h-3" />
                        {earnedXP}/{totalXP} XP
                    </span>
                </div>
            </div>

            {/* All Complete Trophy */}
            {allCompleted && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 mb-4 p-4 rounded-2xl 
                               bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 
                               border border-emerald-200"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 
                                    flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-emerald-800">Mükemmel! 🎉</p>
                        <p className="text-xs text-emerald-600">Tüm görevleri tamamladın</p>
                    </div>
                </motion.div>
            )}

            {/* Quest Cards */}
            <div className="space-y-2">
                {quests.map((quest, index) => (
                    <QuestBattleCard
                        key={quest.id}
                        quest={quest}
                        index={index}
                        onClick={() => onQuestClick?.(quest.id)}
                    />
                ))}
            </div>
        </section>
    )
}
