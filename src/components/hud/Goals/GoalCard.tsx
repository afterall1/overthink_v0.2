'use client'

import { motion } from 'framer-motion'
import { Crown, Flame, Calendar, Flag, TrendingUp } from 'lucide-react'
import ProgressRing from './ProgressRing'
import type { GoalWithDetails, GoalPeriod, GoalEntry } from '@/types/database.types'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { differenceInDays, isSameDay, subDays, parseISO } from 'date-fns'

interface GoalCardProps {
    goal: GoalWithDetails
    onClick: (goal: GoalWithDetails) => void
    index?: number
}

const periodConfig: Record<GoalPeriod, { label: string; color: 'emerald' | 'blue' | 'violet' | 'amber' }> = {
    daily: { label: 'Günlük', color: 'emerald' },
    weekly: { label: 'Haftalık', color: 'blue' },
    monthly: { label: 'Aylık', color: 'violet' },
    yearly: { label: 'Yıllık', color: 'amber' }
}

// --- HELPER FUNCTIONS ---

function calculateProgress(goal: GoalWithDetails): number {
    if (!goal.target_value || goal.target_value === 0) {
        return goal.is_completed ? 100 : 0
    }
    const current = goal.current_value || 0
    const percentage = (current / goal.target_value) * 100
    return Math.min(100, Math.max(0, percentage))
}

function calculateStreak(entries: GoalEntry[]): number {
    if (!entries || entries.length === 0) return 0

    // Sort desc
    const sorted = [...entries].sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())

    let streak = 0
    const today = new Date()

    // Check if there is an entry for today (or yesterday to keep streak alive)
    const hasEntryToday = sorted.some(e => isSameDay(parseISO(e.logged_at), today))
    const yesterday = subDays(today, 1)
    const hasEntryYesterday = sorted.some(e => isSameDay(parseISO(e.logged_at), yesterday))

    // If no entry today AND no entry yesterday, streak is broken (0)
    // Exception: If it's early in the day, maybe we accept yesterday as valid? 
    // Strict rule: logic checks purely sequential days backward

    // For specific calculation:
    // We check day by day backwards.
    // Start checking from Today. If no entry today, check Yesterday.
    // If we find an entry on Day X, we increment streak and check Day X-1.

    // Let's simplify: Start checking from "Latest Entry Date".
    // If latest entry is older than yesterday, streak is broken -> 0.

    const latestEntry = sorted[0]
    const latestDate = parseISO(latestEntry.logged_at)

    if (differenceInDays(today, latestDate) > 1) {
        return 0
    }

    // Now count backwards from latest entry
    let checkDate = latestDate
    streak = 1 // At least the latest one counts

    for (let i = 1; i < sorted.length; i++) {
        const entryDate = parseISO(sorted[i].logged_at)
        const diff = differenceInDays(checkDate, entryDate)

        if (diff === 0) continue // Multiple entries same day, ignore
        if (diff === 1) {
            streak++
            checkDate = entryDate
        } else {
            break // Gap found
        }
    }

    return streak
}

function getDaysLeft(endDate: string | null): string {
    if (!endDate) return '∞'
    const days = differenceInDays(parseISO(endDate), new Date())
    if (days < 0) return 'Bitti'
    return `${days}g`
}

function getNextMilestone(goal: GoalWithDetails): string {
    if (!goal.goal_milestones || goal.goal_milestones.length === 0) return 'Milestone Yok'
    // Find first incomplete milestone
    const next = goal.goal_milestones
        .sort((a, b) => a.sort_order - b.sort_order)
        .find(m => !m.is_completed)

    if (!next) return 'Hepsi Tamam!'
    return next.title
}

// --- COMPONENT ---

export default function GoalCard({ goal, onClick, index = 0 }: GoalCardProps) {
    const progress = calculateProgress(goal)
    const period = periodConfig[goal.period]
    const streak = calculateStreak(goal.goal_entries || [])
    const daysLeft = getDaysLeft(goal.end_date)
    const nextMilestone = getNextMilestone(goal)

    const isCompleted = goal.is_completed || progress >= 100
    const isHighProgress = progress > 75 && !isCompleted

    return (
        <motion.button
            onClick={() => onClick(goal)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className={twMerge(
                "group relative flex-none flex flex-col items-center p-0 rounded-[2rem]",
                "bg-white/40 backdrop-blur-xl border border-white/60",
                "shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10",
                "transition-all duration-300 w-[180px] h-[300px] snap-center",
                "overflow-hidden text-center"
            )}
        >
            {/* PRISM EFFECT */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent 
                          translate-x-[-200%] group-hover:animate-shimmer z-0 pointer-events-none" />

            {/* --- TOP SECTION: HERO PROGRESS (45%) --- */}
            <div className="relative w-full h-[45%] flex items-center justify-center pt-4 z-10">
                {/* Progress Ring - Scaled Up */}
                <div className="relative">
                    <ProgressRing
                        progress={progress}
                        size={88}
                        strokeWidth={6}
                        color={period.color}
                        glow={isHighProgress || isCompleted}
                    />

                    {/* Floating Status Badge */}
                    {isCompleted && (
                        <div className="absolute top-0 right-0 translate-x-1 -translate-y-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-md animate-in zoom-in border-2 border-white">
                            <Crown className="w-4 h-4 text-yellow-900" strokeWidth={3} />
                        </div>
                    )}
                </div>
            </div>

            {/* --- MIDDLE SECTION: TITLE & MAIN STATUS (20%) --- */}
            <div className="w-full px-4 z-10 flex flex-col items-center justify-center h-[20%]">
                <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight">
                    {goal.title}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs font-medium text-slate-500">
                    <span className={clsx(
                        "px-2 py-0.5 rounded-full bg-slate-100/80 border border-slate-200/50",
                        isHighProgress && "text-orange-600 bg-orange-50 border-orange-100",
                        isCompleted && "text-emerald-600 bg-emerald-50 border-emerald-100"
                    )}>
                        {isCompleted ? 'Tamamlandı' :
                            `${Math.round(goal.current_value || 0)} / ${goal.target_value || '∞'} ${goal.unit || ''}`}
                    </span>
                </div>
            </div>

            {/* --- BOTTOM SECTION: STATS GRID (35%) --- */}
            <div className="w-full h-[35%] z-10 mt-auto bg-gradient-to-b from-white/20 to-white/60 border-t border-white/50 backdrop-blur-md p-3">
                <div className="grid grid-cols-2 gap-2 h-full">

                    {/* Stat 1: Streak */}
                    <div className="col-span-1 bg-white/40 rounded-xl flex flex-col items-center justify-center p-1 border border-white/50">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Flame className={clsx("w-3.5 h-3.5", streak > 2 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-slate-400")} />
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Seri</span>
                        </div>
                        <span className={clsx("text-sm font-bold", streak > 2 ? "text-slate-700" : "text-slate-500")}>
                            {streak} Gün
                        </span>
                    </div>

                    {/* Stat 2: Days Left */}
                    <div className="col-span-1 bg-white/40 rounded-xl flex flex-col items-center justify-center p-1 border border-white/50">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kalan</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">
                            {daysLeft}
                        </span>
                    </div>

                    {/* Stat 3: Next Milestone (Full Width) */}
                    <div className="col-span-2 bg-white/40 rounded-xl flex items-center px-3 py-1.5 border border-white/50 gap-2 overflow-hidden">
                        <Flag className="w-3.5 h-3.5 text-violet-500 flex-none" />
                        <div className="flex flex-col text-left min-w-0">
                            <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">Sıradaki</span>
                            <span className="text-xs font-semibold text-slate-700 truncate leading-tight mt-0.5">
                                {nextMilestone}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Active Border Glow */}
            {isHighProgress && (
                <div className="absolute inset-0 rounded-[2rem] border-2 border-orange-400/20 pointer-events-none" />
            )}
        </motion.button>
    )
}
