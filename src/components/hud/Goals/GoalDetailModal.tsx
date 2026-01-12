'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X, Plus, Target, Calendar, TrendingUp, History,
    Flag, CheckCircle2, MoreVertical, Flame, Zap,
    Clock, Award, Star, Sparkles, Trophy, Edit3, Trash2, AlertTriangle
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid
} from 'recharts'
import { format, parseISO, differenceInDays, startOfDay, isSameDay, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import ProgressRing from './ProgressRing'
import StreakBadge from './StreakBadge'
import GoalHealthIndicator from './GoalHealthIndicator'
import VelocityMeter from './VelocityMeter'
import {
    calculateStreak,
    calculateGoalHealth,
    calculateVelocity,
    type StreakInfo,
    type GoalHealthInfo,
    type VelocityInfo
} from '@/lib/streakEngine'
import type { GoalWithDetails, GoalEntry, Goal } from '@/types/database.types'

interface GoalDetailModalProps {
    isOpen: boolean
    onClose: () => void
    goal: GoalWithDetails | null
    onUpdateProgress: (value: number, notes?: string) => Promise<void>
    onToggleMilestone: (milestoneId: string) => void
    onEdit?: (goal: GoalWithDetails) => void
    onDelete?: (goalId: string) => Promise<void>
    isLoading?: boolean
}

type Tab = 'overview' | 'history' | 'milestones'

export default function GoalDetailModal({
    isOpen,
    onClose,
    goal,
    onUpdateProgress,
    onToggleMilestone,
    onEdit,
    onDelete,
    isLoading = false
}: GoalDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [progressValue, setProgressValue] = useState('')
    const [progressNote, setProgressNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Memoized calculations for performance
    const metrics = useMemo(() => {
        if (!goal) return null

        const entries = goal.goal_entries || []
        const progress = calculateProgress(goal)
        const streakInfo = calculateStreak(entries)
        const healthInfo = calculateGoalHealth(goal, entries)
        const velocityInfo = calculateVelocity(goal, entries)

        return { progress, streakInfo, healthInfo, velocityInfo }
    }, [goal])

    if (!goal || !metrics) return null

    const { progress, streakInfo, healthInfo, velocityInfo } = metrics
    const isCompleted = goal.is_completed || progress >= 100
    const themeColor = getColorForPeriod(goal.period)
    const daysLeft = getDaysLeft(goal.end_date)
    const chartData = prepareChartData(goal.goal_entries || [])
    const activityHeatmap = prepareHeatmapData(goal.goal_entries || [])

    // Milestone progress
    const completedMilestones = goal.goal_milestones?.filter(m => m.is_completed).length || 0
    const totalMilestones = goal.goal_milestones?.length || 0
    const milestoneProgress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

    const handleSubmit = async () => {
        if (!progressValue || isSubmitting) return
        const val = parseFloat(progressValue)
        if (isNaN(val) || val <= 0) return

        setIsSubmitting(true)
        try {
            await onUpdateProgress(val, progressNote)
            setProgressValue('')
            setProgressNote('')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEdit = () => {
        if (onEdit && goal) {
            onEdit(goal)
        }
    }

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true)
    }

    const handleDeleteConfirm = async () => {
        if (!onDelete || !goal || isDeleting) return
        setIsDeleting(true)
        try {
            await onDelete(goal.id)
            setShowDeleteConfirm(false)
            onClose()
        } catch (error) {
            console.error('Failed to delete goal:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Ambient Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className={twMerge(
                            "fixed inset-0 z-50 backdrop-blur-xl transition-colors duration-500",
                            themeColor === 'violet' ? "bg-violet-900/30" :
                                themeColor === 'emerald' ? "bg-emerald-900/30" :
                                    themeColor === 'blue' ? "bg-blue-900/30" :
                                        themeColor === 'amber' ? "bg-amber-900/30" : "bg-slate-900/30"
                        )}
                    />

                    {/* Command Center Modal */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className={twMerge(
                            "fixed left-[3%] top-[5%] right-[3%] bottom-[5%] z-50",
                            "bg-white/50 backdrop-blur-3xl border border-white/50",
                            "rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 overflow-hidden",
                            "flex flex-col md:flex-row"
                        )}
                    >
                        {/* --- LEFT WING (Hero Zone) --- */}
                        <div className="w-full md:w-[420px] flex-none border-b md:border-b-0 md:border-r border-white/20 p-8 flex flex-col relative overflow-hidden">

                            {/* Ambient Aurora with Particles */}
                            <div className={twMerge(
                                "absolute inset-0 opacity-40 blur-3xl pointer-events-none",
                                themeColor === 'violet' ? "bg-gradient-to-br from-violet-500/50 via-purple-400/30 to-pink-500/20" :
                                    themeColor === 'emerald' ? "bg-gradient-to-br from-emerald-500/50 via-teal-400/30 to-cyan-500/20" :
                                        themeColor === 'blue' ? "bg-gradient-to-br from-blue-500/50 via-indigo-400/30 to-purple-500/20" :
                                            "bg-gradient-to-br from-amber-500/50 via-orange-400/30 to-red-500/20"
                            )} />

                            {/* Floating Orbs */}
                            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white/20 blur-2xl animate-pulse" />
                            <div className="absolute bottom-20 left-5 w-24 h-24 rounded-full bg-white/10 blur-xl animate-pulse" style={{ animationDelay: '1s' }} />

                            {/* Header Actions */}
                            <div className="flex justify-between items-center mb-4 relative z-10">
                                <button onClick={onClose} className="p-2.5 -ml-2 rounded-xl bg-white/20 hover:bg-white/40 transition-colors backdrop-blur-sm">
                                    <X className="w-5 h-5 text-slate-600" />
                                </button>
                                <div className="flex items-center gap-2">
                                    {/* Streak Badge in Header */}
                                    <StreakBadge
                                        currentStreak={streakInfo.currentStreak}
                                        longestStreak={streakInfo.longestStreak}
                                        status={streakInfo.streakStatus}
                                        size="md"
                                    />
                                </div>
                            </div>

                            {/* Hero Content */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">

                                {/* Main Progress Ring */}
                                <div className="mb-6 relative">
                                    <ProgressRing
                                        progress={progress}
                                        size={200}
                                        strokeWidth={14}
                                        color={themeColor}
                                        glow
                                        className="drop-shadow-2xl"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            key={progress}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="text-5xl font-black text-slate-800 tracking-tighter"
                                        >
                                            {progress.toFixed(0)}%
                                        </motion.span>
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
                                            Tamamlandı
                                        </span>
                                    </div>

                                    {/* Completion Badge */}
                                    {isCompleted && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className="absolute -top-2 -right-2 w-14 h-14 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/40"
                                        >
                                            <Trophy className="w-7 h-7 text-white" />
                                        </motion.div>
                                    )}
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-black text-slate-800 leading-tight mb-3 line-clamp-2 px-4">
                                    {goal.title}
                                </h2>

                                {/* Period & Category Badge */}
                                <div className="flex items-center gap-2 mb-6">
                                    <span className={clsx(
                                        "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm",
                                        themeColor === 'violet' ? "bg-violet-100 text-violet-700 border-violet-200" :
                                            themeColor === 'emerald' ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                                themeColor === 'blue' ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                    "bg-amber-100 text-amber-700 border-amber-200"
                                    )}>
                                        {goal.period === 'daily' ? 'Günlük' :
                                            goal.period === 'weekly' ? 'Haftalık' :
                                                goal.period === 'monthly' ? 'Aylık' : 'Yıllık'}
                                    </span>
                                    <span className="flex items-center gap-1 text-sm font-medium text-slate-500 bg-white/50 px-3 py-1.5 rounded-full">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {daysLeft} Kaldı
                                    </span>
                                </div>

                                {/* Stats Grid */}
                                <div className="w-full grid grid-cols-3 gap-2 mb-6">
                                    <StatCard
                                        icon={Target}
                                        label="Mevcut"
                                        value={`${goal.current_value || 0}`}
                                        subValue={`/ ${goal.target_value || '∞'} ${goal.unit || ''}`}
                                        color="blue"
                                    />
                                    <StatCard
                                        icon={Flame}
                                        label="Zincir"
                                        value={`${streakInfo.currentStreak}`}
                                        subValue="gün"
                                        color={streakInfo.currentStreak >= 7 ? 'orange' : streakInfo.currentStreak >= 3 ? 'amber' : 'gray'}
                                    />
                                    <StatCard
                                        icon={Flag}
                                        label="Milestones"
                                        value={`${completedMilestones}`}
                                        subValue={`/ ${totalMilestones}`}
                                        color="violet"
                                    />
                                </div>

                                {/* Quick Update Input */}
                                {!isCompleted && (
                                    <div className="w-full bg-white/60 backdrop-blur-md rounded-2xl p-2 border border-white/70 shadow-lg flex gap-2">
                                        <input
                                            type="number"
                                            value={progressValue}
                                            onChange={(e) => setProgressValue(e.target.value)}
                                            placeholder={`+ ${goal.unit || 'Birim'}`}
                                            className="flex-1 bg-transparent border-none text-center font-bold text-lg text-slate-700 placeholder:text-slate-400 focus:ring-0 rounded-xl"
                                        />
                                        <button
                                            onClick={handleSubmit}
                                            disabled={!progressValue || isSubmitting}
                                            className={clsx(
                                                "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 font-bold",
                                                !progressValue ? "bg-slate-200 text-slate-400" :
                                                    "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/40 hover:scale-105 active:scale-95"
                                            )}
                                        >
                                            {isSubmitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-6 h-6" />}
                                        </button>
                                    </div>
                                )}

                                {/* Action Buttons - Edit & Delete */}
                                <div className="w-full flex gap-2 mt-4">
                                    {onEdit && (
                                        <button
                                            type="button"
                                            onClick={handleEdit}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/60 hover:bg-white/80 border border-white/70 text-slate-700 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Edit3 className="w-4 h-4 text-blue-500" />
                                            Düzenle
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            type="button"
                                            onClick={handleDeleteClick}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Sil
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- RIGHT WING (Context & Analytics) --- */}
                        <div className="flex-1 bg-white/20 backdrop-blur-lg flex flex-col min-h-0">

                            {/* Tabs Header */}
                            <div className="flex items-center gap-1 p-4 border-b border-white/20 bg-white/30">
                                <TabButton id="overview" label="Genel Bakış" icon={TrendingUp} active={activeTab === 'overview'} onClick={setActiveTab} />
                                <TabButton id="history" label="Geçmiş" icon={History} active={activeTab === 'history'} onClick={setActiveTab} />
                                <TabButton id="milestones" label="Adımlar" icon={Flag} active={activeTab === 'milestones'} onClick={setActiveTab} />
                            </div>

                            {/* Tab Content Area */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200/50 hover:scrollbar-thumb-slate-300/50">

                                {activeTab === 'overview' && (
                                    <div className="space-y-5">

                                        {/* Velocity Meter - Full Width Premium */}
                                        <div className="bg-white/50 rounded-3xl p-5 border border-white/60 shadow-sm">
                                            <VelocityMeter
                                                velocity={velocityInfo}
                                                progress={progress}
                                                unit={goal.unit || 'birim'}
                                                variant="full"
                                            />
                                        </div>

                                        {/* Health Indicator */}
                                        <div className="bg-white/50 rounded-3xl p-5 border border-white/60 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-violet-500" />
                                                Hedef Sağlığı
                                            </h3>
                                            <GoalHealthIndicator
                                                health={healthInfo}
                                                variant="hearts"
                                                showMessage
                                            />
                                        </div>

                                        {/* Activity Heatmap */}
                                        <div className="bg-white/50 rounded-3xl p-5 border border-white/60 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <Flame className="w-4 h-4 text-orange-500" />
                                                Son 7 Günlük Aktivite
                                            </h3>
                                            <div className="flex gap-1.5">
                                                {activityHeatmap.map((day, i) => (
                                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                        <div
                                                            className={clsx(
                                                                "w-full aspect-square rounded-lg transition-all",
                                                                day.hasActivity
                                                                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/30"
                                                                    : "bg-slate-100"
                                                            )}
                                                        />
                                                        <span className="text-[10px] font-medium text-slate-400">
                                                            {day.label}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Chart Card */}
                                        <div className="bg-white/50 rounded-3xl p-5 border border-white/60 shadow-sm">
                                            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                                <Target className="w-4 h-4 text-indigo-500" />
                                                İlerleme Grafiği
                                            </h3>
                                            <div className="h-[180px] w-full">
                                                {chartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={chartData}>
                                                            <defs>
                                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor={themeColor === 'emerald' ? '#10b981' : '#8b5cf6'} stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor={themeColor === 'emerald' ? '#10b981' : '#8b5cf6'} stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                            <XAxis
                                                                dataKey="date"
                                                                axisLine={false}
                                                                tickLine={false}
                                                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                                                minTickGap={30}
                                                            />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                                    backdropFilter: 'blur(8px)',
                                                                    border: '1px solid rgba(255,255,255,0.5)',
                                                                    borderRadius: '12px',
                                                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="value"
                                                                stroke={themeColor === 'emerald' ? '#10b981' : '#8b5cf6'}
                                                                strokeWidth={3}
                                                                fillOpacity={1}
                                                                fill="url(#colorValue)"
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                                                        Henüz veri yok. İlerleme ekle!
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* AI Insight Card */}
                                        <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-blue-50 border border-violet-100 rounded-3xl p-5 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <h4 className="text-violet-900 font-bold mb-2 flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-violet-600" />
                                                    Yapay Zeka Analizi
                                                </h4>
                                                <p className="text-violet-700/80 text-sm leading-relaxed">
                                                    {generateInsight(goal, streakInfo, velocityInfo)}
                                                </p>
                                            </div>
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        </div>

                                        {/* Motivation Quote (if exists) */}
                                        {typeof (goal as Record<string, unknown>).motivation === 'string' && (
                                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5">
                                                <p className="text-sm text-amber-800 italic">
                                                    "{String((goal as Record<string, unknown>).motivation)}"
                                                </p>
                                                <p className="text-xs text-amber-600 mt-2 font-medium">— Senin Motivasyonun</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'history' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="text-sm font-bold text-slate-700">Son Hareketler</h3>
                                            <span className="text-xs text-slate-400">{goal.goal_entries?.length || 0} kayıt</span>
                                        </div>
                                        <div className="space-y-3">
                                            {goal.goal_entries?.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Clock className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-sm">Henüz bir kayıt yok.</p>
                                                    <p className="text-slate-300 text-xs mt-1">İlerleme ekleyerek başla!</p>
                                                </div>
                                            ) : (
                                                [...(goal.goal_entries || [])]
                                                    .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
                                                    .map((entry, i) => (
                                                        <motion.div
                                                            key={entry.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.05 }}
                                                            className="group bg-white/50 hover:bg-white/70 transition-all p-4 rounded-2xl border border-white/60 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-500/30">
                                                                    +{entry.value}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-semibold text-slate-700">İlerleme Kaydı</p>
                                                                    <p className="text-xs text-slate-400">
                                                                        {format(parseISO(entry.logged_at), 'd MMMM yyyy, HH:mm', { locale: tr })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {entry.notes && (
                                                                <div className="hidden sm:block text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg max-w-[150px] truncate">
                                                                    {entry.notes}
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'milestones' && (
                                    <div className="space-y-4">
                                        {/* Milestone Progress Bar */}
                                        <div className="bg-white/50 rounded-2xl p-4 border border-white/60 mb-6">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-slate-700">Milestone İlerlemesi</span>
                                                <span className="text-xs font-bold text-violet-600">{completedMilestones}/{totalMilestones}</span>
                                            </div>
                                            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${milestoneProgress}%` }}
                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div className="relative pl-8 space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-violet-300 before:to-slate-200">
                                            {goal.goal_milestones?.length === 0 ? (
                                                <div className="text-center py-12 -ml-8">
                                                    <Flag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-sm">Milestone eklenmemiş.</p>
                                                </div>
                                            ) : (
                                                [...(goal.goal_milestones || [])]
                                                    .sort((a, b) => a.sort_order - b.sort_order)
                                                    .map((milestone, i) => (
                                                        <motion.div
                                                            key={milestone.id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: i * 0.1 }}
                                                            className="relative"
                                                        >
                                                            {/* Timeline Dot */}
                                                            <motion.div
                                                                animate={milestone.is_completed ? { scale: [1, 1.2, 1] } : {}}
                                                                transition={{ duration: 0.3 }}
                                                                className={twMerge(
                                                                    "absolute -left-[41px] top-0 w-7 h-7 rounded-full border-4 border-white shadow-md flex items-center justify-center transition-colors",
                                                                    milestone.is_completed ? "bg-emerald-500" : "bg-slate-200"
                                                                )}
                                                            >
                                                                {milestone.is_completed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                                            </motion.div>

                                                            {/* Card */}
                                                            <div
                                                                onClick={() => onToggleMilestone(milestone.id)}
                                                                className={twMerge(
                                                                    "bg-white/50 p-4 rounded-2xl border border-white/60 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-md",
                                                                    milestone.is_completed && "opacity-70"
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <p className={twMerge("text-sm font-bold text-slate-700", milestone.is_completed && "line-through text-slate-500")}>
                                                                            {milestone.title}
                                                                        </p>
                                                                        <p className="text-xs text-slate-500 mt-1">
                                                                            Hedef: {milestone.target_value} {goal.unit}
                                                                        </p>
                                                                    </div>
                                                                    {milestone.is_completed && (
                                                                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-full">
                                                                            ✓ Tamamlandı
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </motion.div>

                    {/* Delete Confirmation Dialog */}
                    <AnimatePresence>
                        {showDeleteConfirm && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                                    onClick={() => setShowDeleteConfirm(false)}
                                />
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.9, opacity: 0 }}
                                    className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-md bg-white rounded-3xl shadow-2xl p-6"
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
                                            <span className="font-bold text-slate-800">&quot;{goal.title}&quot;</span> hedefini ve tüm ilerleme kayıtlarını silmek istediğinden emin misin?
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={isDeleting}
                                            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={handleDeleteConfirm}
                                            disabled={isDeleting}
                                            className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    )
}

// --- Sub Components ---

function StatCard({ icon: Icon, label, value, subValue, color }: {
    icon: React.ElementType
    label: string
    value: string
    subValue?: string
    color: 'blue' | 'orange' | 'amber' | 'gray' | 'violet'
}) {
    const colorClasses = {
        blue: 'from-blue-500 to-cyan-500 shadow-blue-500/30',
        orange: 'from-orange-500 to-red-500 shadow-orange-500/30',
        amber: 'from-amber-500 to-yellow-500 shadow-amber-500/30',
        gray: 'from-slate-400 to-slate-500 shadow-slate-500/30',
        violet: 'from-violet-500 to-purple-500 shadow-violet-500/30'
    }

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/60 text-center">
            <div className={`w-8 h-8 mx-auto mb-2 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-md flex items-center justify-center`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="text-lg font-black text-slate-800">{value}</div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{subValue || label}</div>
        </div>
    )
}

function TabButton({ id, label, icon: Icon, active, onClick }: {
    id: Tab
    label: string
    icon: React.ElementType
    active: boolean
    onClick: (id: Tab) => void
}) {
    return (
        <button
            onClick={() => onClick(id)}
            className={twMerge(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                active ? "bg-white text-violet-700 shadow-md" : "text-slate-500 hover:bg-white/50"
            )}
        >
            <Icon className={twMerge("w-4 h-4", active && "text-violet-600")} />
            {label}
        </button>
    )
}

// --- Helpers ---

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) return goal.is_completed ? 100 : 0
    const current = goal.current_value || 0
    return Math.min(100, Math.max(0, (current / goal.target_value) * 100))
}

function getColorForPeriod(period: string) {
    if (period === 'daily') return 'emerald'
    if (period === 'weekly') return 'blue'
    if (period === 'monthly') return 'violet'
    return 'amber'
}

function getDaysLeft(endDate: string | null): string {
    if (!endDate) return '∞'
    const days = differenceInDays(parseISO(endDate), new Date())
    if (days < 0) return 'Süre Doldu'
    return `${days} Gün`
}

function prepareChartData(entries: GoalEntry[]) {
    if (!entries || entries.length === 0) return []

    const sorted = [...entries].sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())

    let cumulative = 0
    return sorted.map(entry => {
        cumulative += entry.value
        return {
            date: format(parseISO(entry.logged_at), 'd MMM'),
            value: cumulative
        }
    })
}

function prepareHeatmapData(entries: GoalEntry[]) {
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

function generateInsight(goal: GoalWithDetails, streakInfo: StreakInfo, velocityInfo: VelocityInfo): string {
    const progress = calculateProgress(goal)

    if (progress >= 100) {
        return "🎉 Harika! Bu hedefi başarıyla tamamladın. Yeni hedeflere yelken açma zamanı!"
    }

    if (streakInfo.currentStreak >= 7) {
        return `🔥 İnanılmaz! ${streakInfo.currentStreak} günlük zincirin var. Bu momentum seni zirveye taşıyacak!`
    }

    if (velocityInfo.velocityDelta >= 20) {
        return `🚀 ${velocityInfo.velocityMessage} Şu anki hızınla hedefin çok önündesin!`
    }

    if (velocityInfo.velocityDelta < -20) {
        return `⚡ Biraz hızlanman gerekebilir. Ama endişelenme, her gün yeni bir fırsat!`
    }

    if (streakInfo.streakStatus === 'at_risk') {
        return `⚠️ Dikkat! ${streakInfo.currentStreak} günlük zincirin risk altında. Bugün bir adım at!`
    }

    if (progress < 10) {
        return "🌱 Henüz yolun başındasın. Her büyük yolculuk tek adımla başlar. Bugün bir şeyler kaydet!"
    }

    return velocityInfo.velocityMessage || "💪 İlerleme kaydediyorsun. Devam et!"
}
