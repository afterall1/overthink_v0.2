'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Zap,
    Plus,
    Target,
    ChevronDown,
    ChevronUp,
    Trophy,
    Flame,
    Sparkles,
    RefreshCw
} from 'lucide-react'
import { twMerge } from 'tailwind-merge'
import QuestCard from './QuestCard'
import XPProgressBar from './XPProgressBar'
import type {
    DailyQuest,
    Goal,
    UserXpStats,
    TodayQuestsGroup
} from '@/types/database.types'

// =====================================================
// Types
// =====================================================

export interface DailyQuestsPanelProps {
    quests: DailyQuest[]
    goals: Pick<Goal, 'id' | 'title' | 'period'>[]
    xpStats?: UserXpStats | null
    onCompleteQuest: (questId: string) => Promise<void>
    onSkipQuest?: (questId: string) => Promise<void>
    onQuestClick?: (quest: DailyQuest) => void
    onCreateQuest?: () => void
    onRefresh?: () => Promise<void>
    isLoading?: boolean
    className?: string
}

// =====================================================
// Helpers
// =====================================================

function groupQuestsByGoal(
    quests: DailyQuest[],
    goals: Pick<Goal, 'id' | 'title' | 'period'>[]
): TodayQuestsGroup[] {
    const goalMap = new Map(goals.map(g => [g.id, g]))
    const groups = new Map<string | null, DailyQuest[]>()

    // Group quests by goal_id
    for (const quest of quests) {
        const key = quest.goal_id
        if (!groups.has(key)) {
            groups.set(key, [])
        }
        groups.get(key)?.push(quest)
    }

    // Convert to TodayQuestsGroup array
    const result: TodayQuestsGroup[] = []

    for (const [goalId, questList] of groups) {
        const goal = goalId ? goalMap.get(goalId) || null : null
        const completedCount = questList.filter(q => q.status === 'completed').length
        const totalXp = questList.reduce((sum, q) => sum + (q.xp_reward || 0), 0)

        result.push({
            goal,
            quests: questList.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
            completedCount,
            totalXp
        })
    }

    // Sort: goals with incomplete quests first, then by goal title
    return result.sort((a, b) => {
        const aComplete = a.completedCount === a.quests.length
        const bComplete = b.completedCount === b.quests.length
        if (aComplete !== bComplete) return aComplete ? 1 : -1
        return (a.goal?.title || '').localeCompare(b.goal?.title || '')
    })
}

function calculatePerfectDayProgress(quests: DailyQuest[]): {
    completed: number
    total: number
    isPerfect: boolean
    percentage: number
} {
    const total = quests.length
    const completed = quests.filter(q => q.status === 'completed').length
    return {
        completed,
        total,
        isPerfect: total > 0 && completed === total,
        percentage: total > 0 ? (completed / total) * 100 : 0
    }
}

// =====================================================
// Sub-Components
// =====================================================

interface QuestGroupProps {
    group: TodayQuestsGroup
    onCompleteQuest: (questId: string) => Promise<void>
    onSkipQuest?: (questId: string) => Promise<void>
    onQuestClick?: (quest: DailyQuest) => void
    defaultExpanded?: boolean
}

function QuestGroup({
    group,
    onCompleteQuest,
    onSkipQuest,
    onQuestClick,
    defaultExpanded = true
}: QuestGroupProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded)
    const isAllCompleted = group.completedCount === group.quests.length
    const progress = group.quests.length > 0
        ? (group.completedCount / group.quests.length) * 100
        : 0

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={twMerge(
                "rounded-2xl overflow-hidden",
                "bg-white/40 backdrop-blur-xl border border-white/50",
                "shadow-lg",
                isAllCompleted && "opacity-70"
            )}
        >
            {/* Group Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/20 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {/* Goal Icon */}
                    <div className={twMerge(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        group.goal
                            ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md shadow-violet-500/30"
                            : "bg-slate-100 text-slate-400"
                    )}>
                        {group.goal ? (
                            <Target className="w-4 h-4" />
                        ) : (
                            <Zap className="w-4 h-4" />
                        )}
                    </div>

                    {/* Title & Progress */}
                    <div className="text-left">
                        <h3 className="font-semibold text-slate-800">
                            {group.goal?.title || 'Genel Görevler'}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {group.completedCount}/{group.quests.length} tamamlandı · {group.totalXp} XP
                        </p>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    {/* Mini Progress Bar */}
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: progress / 100 }}
                            style={{ transformOrigin: 'left' }}
                            className={twMerge(
                                "h-full rounded-full",
                                isAllCompleted
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-r from-violet-500 to-indigo-500"
                            )}
                        />
                    </div>

                    {/* Expand/Collapse Icon */}
                    <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        className="text-slate-400"
                    >
                        <ChevronDown className="w-5 h-5" />
                    </motion.div>
                </div>
            </button>

            {/* Quest List */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-2">
                            {group.quests.map((quest, index) => (
                                <QuestCard
                                    key={quest.id}
                                    quest={quest}
                                    goal={group.goal}
                                    onComplete={onCompleteQuest}
                                    onSkip={onSkipQuest}
                                    onClick={onQuestClick}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function DailyQuestsPanel({
    quests,
    goals,
    xpStats,
    onCompleteQuest,
    onSkipQuest,
    onQuestClick,
    onCreateQuest,
    onRefresh,
    isLoading = false,
    className
}: DailyQuestsPanelProps) {
    const [isRefreshing, setIsRefreshing] = useState(false)

    // Group quests by goal
    const questGroups = useMemo(
        () => groupQuestsByGoal(quests, goals),
        [quests, goals]
    )

    // Perfect day progress
    const perfectDay = useMemo(
        () => calculatePerfectDayProgress(quests),
        [quests]
    )

    // Total XP today
    const xpToday = useMemo(() => {
        return quests
            .filter(q => q.status === 'completed')
            .reduce((sum, q) => sum + (q.xp_reward || 0), 0)
    }, [quests])

    // Total possible XP
    const xpTotal = useMemo(() => {
        return quests.reduce((sum, q) => sum + (q.xp_reward || 0), 0)
    }, [quests])

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        if (!onRefresh || isRefreshing) return
        setIsRefreshing(true)
        try {
            await onRefresh()
        } finally {
            setIsRefreshing(false)
        }
    }, [onRefresh, isRefreshing])

    return (
        <div className={twMerge(
            "rounded-3xl overflow-hidden",
            "bg-gradient-to-br from-white/50 to-white/30 backdrop-blur-2xl",
            "border border-white/50 shadow-2xl shadow-violet-500/5",
            className
        )}>
            {/* Header */}
            <div className="p-5 border-b border-white/30">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                       flex items-center justify-center shadow-lg shadow-violet-500/30"
                        >
                            <Zap className="w-5 h-5 text-white" />
                        </motion.div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Günlük Görevler</h2>
                            <p className="text-xs text-slate-500">
                                {perfectDay.completed}/{perfectDay.total} görev · {xpToday}/{xpTotal} XP
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Refresh Button */}
                        {onRefresh && (
                            <motion.button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-xl bg-white/50 border border-white/40 
                                           hover:bg-white/80 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw className={twMerge(
                                    "w-4 h-4 text-slate-500",
                                    isRefreshing && "animate-spin"
                                )} />
                            </motion.button>
                        )}

                        {/* Add Quest Button */}
                        {onCreateQuest && (
                            <motion.button
                                onClick={onCreateQuest}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 
                                           text-white shadow-lg shadow-violet-500/30"
                            >
                                <Plus className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* XP Progress Bar */}
                {xpStats && (
                    <XPProgressBar
                        totalXp={xpStats.total_xp}
                        xpToday={xpStats.xp_today}
                        variant="compact"
                        className="mb-4"
                    />
                )}

                {/* Perfect Day Progress */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/30">
                    <div className={twMerge(
                        "w-8 h-8 rounded-lg flex items-center justify-center",
                        perfectDay.isPerfect
                            ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/30"
                            : "bg-slate-100 text-slate-400"
                    )}>
                        <Trophy className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">
                                {perfectDay.isPerfect ? 'Mükemmel Gün! 🎉' : 'Perfect Day'}
                            </span>
                            <span className="text-xs font-bold text-slate-600">
                                {perfectDay.completed}/{perfectDay.total}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: perfectDay.percentage / 100 }}
                                style={{ transformOrigin: 'left' }}
                                className={twMerge(
                                    "h-full rounded-full",
                                    perfectDay.isPerfect
                                        ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                                        : "bg-gradient-to-r from-violet-500 to-indigo-500"
                                )}
                            />
                        </div>
                    </div>
                    {perfectDay.isPerfect && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full"
                        >
                            +100 XP
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Quest Groups */}
            <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <RefreshCw className="w-6 h-6 text-violet-500" />
                        </motion.div>
                    </div>
                ) : questGroups.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 
                                        flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            Bugün görev yok!
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            Hedeflerine quest ekleyerek başla
                        </p>
                        {onCreateQuest && (
                            <motion.button
                                onClick={onCreateQuest}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                           bg-gradient-to-r from-violet-500 to-indigo-600 
                                           text-white font-medium shadow-lg shadow-violet-500/30"
                            >
                                <Plus className="w-4 h-4" />
                                Quest Ekle
                            </motion.button>
                        )}
                    </div>
                ) : (
                    questGroups.map((group, index) => (
                        <QuestGroup
                            key={group.goal?.id || 'general'}
                            group={group}
                            onCompleteQuest={onCompleteQuest}
                            onSkipQuest={onSkipQuest}
                            onQuestClick={onQuestClick}
                            defaultExpanded={index === 0}
                        />
                    ))
                )}
            </div>

            {/* Footer Stats */}
            {quests.length > 0 && (
                <div className="p-4 border-t border-white/30 bg-white/20">
                    <div className="flex items-center justify-around text-center">
                        <div>
                            <div className="text-lg font-bold text-slate-800">{xpToday}</div>
                            <div className="text-xs text-slate-500">XP Bugün</div>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div>
                            <div className="flex items-center justify-center gap-1 text-lg font-bold text-slate-800">
                                <Flame className={twMerge(
                                    "w-5 h-5",
                                    (xpStats?.current_daily_streak || 0) > 0
                                        ? "text-orange-500 fill-current"
                                        : "text-slate-300"
                                )} />
                                {xpStats?.current_daily_streak || 0}
                            </div>
                            <div className="text-xs text-slate-500">Gün Serisi</div>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div>
                            <div className="text-lg font-bold text-slate-800">
                                {xpStats?.perfect_days_count || 0}
                            </div>
                            <div className="text-xs text-slate-500">Perfect Day</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
