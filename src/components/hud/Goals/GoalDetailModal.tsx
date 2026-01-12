'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Plus, Target, Calendar, TrendingUp, CheckCircle2, Flame, Zap,
    Clock, Sparkles, Trophy, Edit3, Trash2, AlertTriangle, ChevronRight
} from 'lucide-react'
import { format, parseISO, differenceInDays, startOfDay, isSameDay, subDays, isToday } from 'date-fns'
import { tr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import ProgressRing from './ProgressRing'
import MomentumGauge, { MomentumBadge } from './MomentumGauge'
import ConfettiCelebration from './ConfettiCelebration'
import {
    calculateStreak,
    calculateGoalHealth,
    calculateVelocity,
    type StreakInfo,
    type VelocityInfo
} from '@/lib/streakEngine'
import type { GoalWithDetails, GoalEntry, DailyQuest } from '@/types/database.types'

// =====================================================
// Types
// =====================================================

interface GoalDetailModalProps {
    isOpen: boolean
    onClose: () => void
    goal: GoalWithDetails | null
    onUpdateProgress: (value: number, notes?: string) => Promise<void>
    onToggleMilestone: (milestoneId: string) => void
    onEdit?: (goal: GoalWithDetails) => void
    onDelete?: (goalId: string) => Promise<void>
    linkedQuests?: DailyQuest[]
    isLoading?: boolean
}

interface QuestContributionItem {
    id: string
    title: string
    status: 'completed' | 'pending' | 'skipped'
    contributionType: 'direct' | 'momentum'
    contributionValue: number
    contributionDisplay: string
    unit: string
}

// =====================================================
// Constants
// =====================================================

const PERIOD_COLORS = {
    daily: { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', light: 'bg-emerald-50' },
    weekly: { bg: 'from-blue-500 to-indigo-600', text: 'text-blue-600', light: 'bg-blue-50' },
    monthly: { bg: 'from-violet-500 to-purple-600', text: 'text-violet-600', light: 'bg-violet-50' },
    yearly: { bg: 'from-amber-500 to-orange-600', text: 'text-amber-600', light: 'bg-amber-50' }
} as const

const STREAK_MULTIPLIERS = [
    { min: 21, multiplier: 2.0, label: 'LEGEND' },
    { min: 14, multiplier: 1.6, label: 'MASTER' },
    { min: 7, multiplier: 1.4, label: 'STREAK' },
    { min: 3, multiplier: 1.2, label: 'RISING' }
] as const

const MATURITY_STAGES = [
    { min: 21, emoji: '🌲', label: 'Olgun Alışkanlık' },
    { min: 14, emoji: '🌳', label: 'Büyüme Aşaması' },
    { min: 7, emoji: '🌿', label: 'Filiz Aşaması' },
    { min: 0, emoji: '🌱', label: 'Tohum Aşaması' }
] as const

// =====================================================
// Main Component
// =====================================================

export default function GoalDetailModal({
    isOpen,
    onClose,
    goal,
    onUpdateProgress,
    onToggleMilestone,
    onEdit,
    onDelete,
    linkedQuests = [],
    isLoading = false
}: GoalDetailModalProps) {
    const [progressValue, setProgressValue] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)

    // Memoized calculations
    const metrics = useMemo(() => {
        if (!goal) return null

        const entries = goal.goal_entries || []
        const progress = calculateProgress(goal)
        const streakInfo = calculateStreak(entries)
        const healthInfo = calculateGoalHealth(goal, entries)
        const velocityInfo = calculateVelocity(goal, entries)
        const streakDays = prepareStreakCalendar(entries)
        const questContributions = prepareQuestContributions(linkedQuests, goal)

        // Momentum from goal or calculate
        const momentum = (goal as GoalWithDetails & { momentum_score?: number }).momentum_score ??
            calculateMomentumFallback(streakInfo, entries.length)

        const maturityDays = (goal as GoalWithDetails & { habit_maturity_days?: number }).habit_maturity_days ??
            entries.length

        return {
            progress,
            streakInfo,
            healthInfo,
            velocityInfo,
            streakDays,
            questContributions,
            momentum,
            maturityDays
        }
    }, [goal, linkedQuests])

    const handleSubmit = useCallback(async () => {
        if (!progressValue || isSubmitting || !goal) return
        const val = parseFloat(progressValue)
        if (isNaN(val) || val <= 0) return

        setIsSubmitting(true)
        try {
            await onUpdateProgress(val)
            setProgressValue('')
            setShowConfetti(true)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Progress update failed:', error)
            }
        } finally {
            setIsSubmitting(false)
        }
    }, [progressValue, isSubmitting, goal, onUpdateProgress])

    const handleDelete = useCallback(async () => {
        if (!onDelete || !goal || isDeleting) return
        setIsDeleting(true)
        try {
            await onDelete(goal.id)
            setShowDeleteConfirm(false)
            onClose()
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Delete failed:', error)
            }
        } finally {
            setIsDeleting(false)
        }
    }, [onDelete, goal, isDeleting, onClose])

    if (!goal || !metrics) return null

    const { progress, streakInfo, velocityInfo, streakDays, questContributions, momentum, maturityDays } = metrics
    const isCompleted = goal.is_completed || progress >= 100
    const periodStyle = PERIOD_COLORS[goal.period] || PERIOD_COLORS.monthly
    const daysLeft = getDaysLeft(goal.end_date)
    const streakMultiplier = getStreakMultiplier(streakInfo.currentStreak)
    const maturityStage = getMaturityStage(maturityDays)

    return (
        <>
            <ConfettiCelebration
                trigger={showConfetti}
                onComplete={() => setShowConfetti(false)}
                variant="progress"
                intensity="medium"
            />

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 30, scale: 0.98 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="fixed left-[5%] right-[5%] top-[5%] bottom-[5%] z-50 
                                       md:left-[10%] md:right-[10%] md:top-[8%] md:bottom-[8%]
                                       bg-gradient-to-br from-slate-50 via-white to-slate-50
                                       rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <button
                                    onClick={onClose}
                                    className="p-2 -ml-2 rounded-xl hover:bg-slate-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-500" />
                                </button>
                                <div className="flex items-center gap-2">
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(goal)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                                       text-sm font-medium text-slate-600
                                                       hover:bg-slate-100 transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Düzenle
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                                       text-sm font-medium text-red-500
                                                       hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* HERO CARD */}
                                {/* ═══════════════════════════════════════════════════ */}
                                <section className="bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
                                    {/* Hero Gradient Header */}
                                    <div className={twMerge(
                                        "bg-gradient-to-r p-6",
                                        periodStyle.bg
                                    )}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h1 className="text-2xl font-black text-white mb-2 leading-tight">
                                                    {goal.title}
                                                </h1>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 
                                                                     bg-white/20 backdrop-blur-sm rounded-full
                                                                     text-xs font-bold text-white/90">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {daysLeft}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 
                                                                     bg-white/20 backdrop-blur-sm rounded-full
                                                                     text-xs font-bold text-white/90 uppercase">
                                                        {goal.period === 'daily' ? 'Günlük' :
                                                            goal.period === 'weekly' ? 'Haftalık' :
                                                                goal.period === 'monthly' ? 'Aylık' : 'Yıllık'}
                                                    </span>
                                                </div>
                                            </div>
                                            {isCompleted && (
                                                <motion.div
                                                    initial={{ scale: 0, rotate: -45 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl
                                                               flex items-center justify-center"
                                                >
                                                    <Trophy className="w-8 h-8 text-white" />
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Dual Progress Section */}
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-6">
                                            {/* Direct Progress */}
                                            <div className="flex flex-col items-center">
                                                <div className="relative mb-3">
                                                    <ProgressRing
                                                        progress={progress}
                                                        size={120}
                                                        strokeWidth={10}
                                                        color={goal.period === 'daily' ? 'emerald' :
                                                            goal.period === 'weekly' ? 'blue' : 'violet'}
                                                        glow
                                                    />
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-2xl font-black text-slate-800">
                                                            {progress.toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                    Progress
                                                </p>
                                                <p className="text-sm font-semibold text-slate-600 mt-1">
                                                    {goal.current_value || 0} / {goal.target_value || '∞'} {goal.unit || ''}
                                                </p>
                                            </div>

                                            {/* Momentum Gauge */}
                                            <div className="flex flex-col items-center">
                                                <MomentumGauge
                                                    momentum={momentum}
                                                    streak={streakInfo.currentStreak}
                                                    maturityDays={maturityDays}
                                                    size="md"
                                                    showStreak
                                                    showMaturity={false}
                                                />
                                            </div>
                                        </div>

                                        {/* Maturity & Streak Info */}
                                        <div className="mt-6 flex items-center justify-center gap-4">
                                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50">
                                                <span className="text-lg">{maturityStage.emoji}</span>
                                                <div>
                                                    <p className="text-xs font-bold text-orange-600">{maturityStage.label}</p>
                                                    <p className="text-[10px] text-orange-500">{maturityDays} gün</p>
                                                </div>
                                            </div>
                                            {streakMultiplier && (
                                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50">
                                                    <Flame className="w-5 h-5 text-amber-500" />
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-600">
                                                            ×{streakMultiplier.multiplier} Bonus
                                                        </p>
                                                        <p className="text-[10px] text-amber-500">{streakMultiplier.label}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* QUEST CONTRIBUTIONS */}
                                {/* ═══════════════════════════════════════════════════ */}
                                {questContributions.length > 0 && (
                                    <section className="bg-white rounded-3xl border border-slate-100 p-5">
                                        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <Target className="w-4 h-4 text-violet-500" />
                                            Bugünkü Görevler
                                        </h2>
                                        <div className="space-y-2">
                                            {questContributions.map((quest) => (
                                                <QuestContributionRow key={quest.id} quest={quest} />
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* STREAK CALENDAR */}
                                {/* ═══════════════════════════════════════════════════ */}
                                <section className="bg-white rounded-3xl border border-slate-100 p-5">
                                    <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                        Streak Takvimi
                                        {streakInfo.currentStreak > 0 && (
                                            <span className="ml-auto text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                                                🔥 {streakInfo.currentStreak} gün
                                            </span>
                                        )}
                                    </h2>
                                    <div className="flex gap-2 justify-center">
                                        {streakDays.map((day, i) => (
                                            <StreakDayBox key={i} day={day} />
                                        ))}
                                    </div>
                                    {streakMultiplier && (
                                        <p className="text-center text-xs text-amber-600 mt-3 font-medium">
                                            ⚡ {streakMultiplier.label} bonus aktif! (×{streakMultiplier.multiplier})
                                        </p>
                                    )}
                                </section>

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* WEEKLY PROGRESS */}
                                {/* ═══════════════════════════════════════════════════ */}
                                <section className="bg-white rounded-3xl border border-slate-100 p-5">
                                    <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                                        Haftalık İlerleme
                                    </h2>
                                    <WeeklyProgressBar
                                        entries={goal.goal_entries || []}
                                        targetValue={goal.target_value || 100}
                                        unit={goal.unit || ''}
                                    />
                                    <div className="flex items-center justify-between mt-3 text-xs">
                                        <span className="text-slate-500">
                                            {velocityInfo.velocityMessage}
                                        </span>
                                        <span className={twMerge(
                                            "font-bold",
                                            velocityInfo.velocityDelta >= 0 ? "text-emerald-600" : "text-red-500"
                                        )}>
                                            {velocityInfo.velocityDelta >= 0 ? '+' : ''}{velocityInfo.velocityDelta.toFixed(0)}%
                                        </span>
                                    </div>
                                </section>

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* MILESTONES */}
                                {/* ═══════════════════════════════════════════════════ */}
                                {(goal.goal_milestones?.length ?? 0) > 0 && (
                                    <section className="bg-white rounded-3xl border border-slate-100 p-5">
                                        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-violet-500" />
                                            Kilometre Taşları
                                        </h2>
                                        <div className="space-y-3">
                                            {[...(goal.goal_milestones || [])]
                                                .sort((a, b) => a.sort_order - b.sort_order)
                                                .map((milestone) => {
                                                    const milestoneProgress = goal.target_value && milestone.target_value
                                                        ? Math.min(100, ((goal.current_value || 0) / milestone.target_value) * 100)
                                                        : milestone.is_completed ? 100 : 0

                                                    return (
                                                        <MilestoneProgressRow
                                                            key={milestone.id}
                                                            title={milestone.title}
                                                            targetValue={milestone.target_value ?? 0}
                                                            unit={goal.unit || ''}
                                                            progress={milestoneProgress}
                                                            isCompleted={milestone.is_completed}
                                                            onToggle={() => onToggleMilestone(milestone.id)}
                                                        />
                                                    )
                                                })}
                                        </div>
                                    </section>
                                )}

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* AI INSIGHT */}
                                {/* ═══════════════════════════════════════════════════ */}
                                <section className="bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 
                                                   rounded-3xl border border-violet-100 p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl" />
                                    <h2 className="text-sm font-bold text-violet-800 mb-2 flex items-center gap-2 relative">
                                        <Sparkles className="w-4 h-4 text-violet-600" />
                                        AI Insight
                                    </h2>
                                    <p className="text-sm text-violet-700/80 leading-relaxed relative">
                                        {generateInsight(goal, streakInfo, velocityInfo, momentum)}
                                    </p>
                                </section>

                                {/* ═══════════════════════════════════════════════════ */}
                                {/* ADD PROGRESS */}
                                {/* ═══════════════════════════════════════════════════ */}
                                {!isCompleted && (
                                    <section className="bg-white rounded-3xl border border-slate-100 p-5">
                                        <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <Plus className="w-4 h-4 text-emerald-500" />
                                            İlerleme Ekle
                                        </h2>
                                        <div className="flex gap-3">
                                            <input
                                                type="number"
                                                value={progressValue}
                                                onChange={(e) => setProgressValue(e.target.value)}
                                                placeholder={`+ ${goal.unit || 'Değer'}`}
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200
                                                           text-center font-bold text-lg text-slate-700
                                                           placeholder:text-slate-400 focus:outline-none
                                                           focus:ring-2 focus:ring-violet-500/30 focus:border-violet-300
                                                           transition-all"
                                            />
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!progressValue || isSubmitting}
                                                className={twMerge(
                                                    "px-6 py-3 rounded-xl font-bold text-white transition-all",
                                                    !progressValue
                                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95"
                                                )}
                                            >
                                                {isSubmitting ? (
                                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <Plus className="w-5 h-5" />
                                                )}
                                            </button>
                                        </div>
                                    </section>
                                )}

                            </div>
                        </motion.div>

                        {/* Delete Confirmation */}
                        <AnimatePresence>
                            {showDeleteConfirm && (
                                <DeleteConfirmDialog
                                    goalTitle={goal.title}
                                    isDeleting={isDeleting}
                                    onConfirm={handleDelete}
                                    onCancel={() => setShowDeleteConfirm(false)}
                                />
                            )}
                        </AnimatePresence>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// =====================================================
// Sub-Components
// =====================================================

function QuestContributionRow({ quest }: { quest: QuestContributionItem }) {
    const isCompleted = quest.status === 'completed'

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={twMerge(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                isCompleted ? "bg-emerald-50" : "bg-slate-50"
            )}
        >
            <div className={twMerge(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                isCompleted
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-400"
            )}>
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
                <p className={twMerge(
                    "text-sm font-medium truncate",
                    isCompleted ? "text-slate-700" : "text-slate-500"
                )}>
                    {quest.title}
                </p>
            </div>
            <div className={twMerge(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
                quest.contributionType === 'direct'
                    ? "bg-teal-100 text-teal-700"
                    : "bg-amber-100 text-amber-700"
            )}>
                {quest.contributionType === 'momentum' && <Zap className="w-3 h-3" />}
                {quest.contributionDisplay}
            </div>
        </motion.div>
    )
}

function StreakDayBox({ day }: { day: { date: Date; hasActivity: boolean; label: string } }) {
    const isTodayBox = isToday(day.date)

    return (
        <div className="flex flex-col items-center gap-1">
            <motion.div
                whileHover={{ scale: 1.1 }}
                className={twMerge(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                    day.hasActivity
                        ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/30"
                        : isTodayBox
                            ? "bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-dashed border-amber-400"
                            : "bg-slate-100"
                )}
            >
                {day.hasActivity ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                ) : isTodayBox ? (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                        <Plus className="w-4 h-4 text-amber-500" />
                    </motion.div>
                ) : null}
            </motion.div>
            <span className={twMerge(
                "text-[10px] font-medium",
                isTodayBox ? "text-amber-600 font-bold" : "text-slate-400"
            )}>
                {isTodayBox ? "Bugün" : day.label}
            </span>
        </div>
    )
}

function WeeklyProgressBar({ entries, targetValue, unit }: { entries: GoalEntry[]; targetValue: number; unit: string }) {
    const today = startOfDay(new Date())
    const weekAgo = subDays(today, 7)

    const weeklyTotal = entries
        .filter(e => {
            const date = parseISO(e.logged_at)
            return date >= weekAgo && date <= today
        })
        .reduce((sum, e) => sum + e.value, 0)

    const weeklyPercent = Math.min(100, (weeklyTotal / (targetValue / 4)) * 100) // Assume monthly target / 4 for weekly

    return (
        <div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-700">
                Bu hafta: <span className="text-indigo-600">+{weeklyTotal.toFixed(1)} {unit}</span>
            </p>
        </div>
    )
}

function MilestoneProgressRow({
    title, targetValue, unit, progress, isCompleted, onToggle
}: {
    title: string
    targetValue: number
    unit: string
    progress: number
    isCompleted: boolean
    onToggle: () => void
}) {
    return (
        <div
            onClick={onToggle}
            className={twMerge(
                "p-3 rounded-xl border transition-all cursor-pointer hover:scale-[1.01]",
                isCompleted
                    ? "bg-emerald-50 border-emerald-200"
                    : "bg-slate-50 border-slate-100 hover:border-violet-200"
            )}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={twMerge(
                        "w-5 h-5 rounded-full flex items-center justify-center",
                        isCompleted ? "bg-emerald-500" : "bg-slate-200"
                    )}>
                        {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={twMerge(
                        "text-sm font-medium",
                        isCompleted ? "text-slate-500 line-through" : "text-slate-700"
                    )}>
                        {title}
                    </span>
                </div>
                <span className="text-xs text-slate-500">
                    {targetValue} {unit}
                </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, progress)}%` }}
                    className={twMerge(
                        "h-full rounded-full",
                        isCompleted
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-violet-500 to-indigo-500"
                    )}
                />
            </div>
        </div>
    )
}

function DeleteConfirmDialog({
    goalTitle, isDeleting, onConfirm, onCancel
}: {
    goalTitle: string
    isDeleting: boolean
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] 
                           w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Hedefi Sil</h3>
                        <p className="text-sm text-slate-500">Bu işlem geri alınamaz</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                    <p className="text-sm text-slate-600">
                        <span className="font-bold text-slate-800">&quot;{goalTitle}&quot;</span> hedefini
                        ve tüm ilerleme kayıtlarını silmek istediğinden emin misin?
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 
                                   font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white 
                                   font-semibold hover:bg-red-700 transition-colors 
                                   disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Siliniyor...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Evet, Sil
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </>
    )
}

// =====================================================
// Helper Functions
// =====================================================

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) return goal.is_completed ? 100 : 0
    const current = goal.current_value || 0
    return Math.min(100, Math.max(0, (current / goal.target_value) * 100))
}

function getDaysLeft(endDate: string | null): string {
    if (!endDate) return '∞ Gün'
    const days = differenceInDays(parseISO(endDate), new Date())
    if (days < 0) return 'Süre Doldu'
    return `${days} Gün Kaldı`
}

function getStreakMultiplier(streak: number) {
    return STREAK_MULTIPLIERS.find(s => streak >= s.min) || null
}

function getMaturityStage(days: number) {
    return MATURITY_STAGES.find(s => days >= s.min) || MATURITY_STAGES[MATURITY_STAGES.length - 1]
}

function prepareStreakCalendar(entries: GoalEntry[]) {
    const today = startOfDay(new Date())
    const days = []

    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i)
        const hasActivity = entries.some(e => isSameDay(parseISO(e.logged_at), date))
        days.push({
            date,
            hasActivity,
            label: format(date, 'EEE', { locale: tr }).charAt(0).toUpperCase()
        })
    }

    return days
}

function prepareQuestContributions(quests: DailyQuest[], goal: GoalWithDetails): QuestContributionItem[] {
    return quests
        .filter(q => q.goal_id === goal.id)
        .map(q => {
            const contributionType = ((q as DailyQuest & { contribution_type?: string }).contribution_type || 'direct') as 'direct' | 'momentum'
            const contribution = q.progress_contribution || 0

            return {
                id: q.id,
                title: q.title,
                status: q.status as 'completed' | 'pending' | 'skipped',
                contributionType,
                contributionValue: contribution,
                contributionDisplay: contributionType === 'momentum'
                    ? `+${Math.round(contribution * 10)} mom`
                    : `+${contribution} ${goal.unit || ''}`,
                unit: goal.unit || ''
            }
        })
}

function calculateMomentumFallback(streakInfo: StreakInfo, entryCount: number): number {
    const streakBonus = streakInfo.currentStreak >= 21 ? 60 :
        streakInfo.currentStreak >= 14 ? 48 :
            streakInfo.currentStreak >= 7 ? 42 :
                streakInfo.currentStreak >= 3 ? 36 : 30

    const maturityBonus = entryCount >= 21 ? 20 :
        entryCount >= 14 ? 15 :
            entryCount >= 7 ? 10 : 5

    return Math.min(100, streakBonus + maturityBonus)
}

function generateInsight(
    goal: GoalWithDetails,
    streakInfo: StreakInfo,
    velocityInfo: VelocityInfo,
    momentum: number
): string {
    const progress = calculateProgress(goal)

    if (progress >= 100) {
        return "🎉 Harika! Bu hedefi başarıyla tamamladın. Yeni hedeflere yelken açma zamanı!"
    }

    if (momentum >= 80) {
        return `🚀 Muhteşem momentum! ${momentum} puanla zirvedesin. Bu tutarlılığı korursan hedefine çok önce ulaşacaksın!`
    }

    if (streakInfo.currentStreak >= 7) {
        const mult = getStreakMultiplier(streakInfo.currentStreak)
        return `🔥 ${streakInfo.currentStreak} günlük streak! ×${mult?.multiplier || 1} bonus aktif. Bu momentum seni zirveye taşıyacak!`
    }

    if (velocityInfo.velocityDelta >= 20) {
        return `📈 ${velocityInfo.velocityMessage} Harika gidiyorsun, hedefin çok önündesin!`
    }

    if (velocityInfo.velocityDelta < -20) {
        return `⚡ Biraz hızlanman gerekebilir. Ama endişelenme, bugün yeni bir fırsat! Bir görev tamamla ve momentum'unu artır.`
    }

    if (streakInfo.streakStatus === 'at_risk') {
        return `⚠️ Dikkat! ${streakInfo.currentStreak} günlük zincirin risk altında. Bugün bir adım at!`
    }

    if (progress < 10) {
        return "🌱 Henüz yolun başındasın. Her büyük yolculuk tek adımla başlar. Bugün bir görev tamamla!"
    }

    return `💪 İlerleme kaydediyorsun! Momentum'un ${momentum}, devam ettikçe artacak!`
}
