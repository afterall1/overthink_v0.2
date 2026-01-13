'use client'

import { motion } from 'framer-motion'
import { Trophy, Target, Calendar, Zap, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { tr } from 'date-fns/locale'

// =====================================================
// Types
// =====================================================

interface StatsGridProps {
    totalXpEarned: number
    xpThisWeek: number
    questsCompleted: number
    totalQuests: number
    bestDay: {
        date: string | null
        value: number
    } | null
    lastActivityDate: string | null
    velocityTrend: 'up' | 'down' | 'stable'
    velocityPercentage: number
}

// =====================================================
// Stat Card Component
// =====================================================

function StatCard({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    value,
    subtitle,
    delay
}: {
    icon: typeof Trophy
    iconColor: string
    iconBg: string
    title: string
    value: string | number
    subtitle?: string
    delay: number
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-4
                       hover:shadow-lg hover:border-violet-200/50 transition-all duration-300"
        >
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">
                        {title}
                    </p>
                    <p className="text-xl font-black text-slate-800 truncate">
                        {value}
                    </p>
                    {subtitle && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Velocity Card Component
// =====================================================

function VelocityCard({
    trend,
    percentage,
    delay
}: {
    trend: 'up' | 'down' | 'stable'
    percentage: number
    delay: number
}) {
    const config = {
        up: {
            icon: TrendingUp,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            label: 'İvmeleniyor',
            emoji: '🚀'
        },
        down: {
            icon: TrendingDown,
            color: 'text-red-500',
            bg: 'bg-red-50',
            label: 'Yavaşlıyor',
            emoji: '📉'
        },
        stable: {
            icon: Minus,
            color: 'text-blue-500',
            bg: 'bg-blue-50',
            label: 'Sabit',
            emoji: '📊'
        }
    }

    const { icon: Icon, color, bg, label, emoji } = config[trend]

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={`${bg} rounded-2xl border border-slate-100/50 p-4
                       hover:shadow-lg transition-all duration-300`}
        >
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">
                        Hız Trendi
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-slate-800">
                            {label}
                        </span>
                        <span className="text-xl">{emoji}</span>
                    </div>
                    {percentage !== 0 && (
                        <p className={`text-xs font-semibold ${color} mt-0.5`}>
                            {trend === 'up' ? '+' : ''}{percentage}% son haftaya göre
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Main Component
// =====================================================

export default function StatsGrid({
    totalXpEarned,
    xpThisWeek,
    questsCompleted,
    totalQuests,
    bestDay,
    lastActivityDate,
    velocityTrend,
    velocityPercentage
}: StatsGridProps) {
    // Calculate completion rate
    const completionRate = totalQuests > 0
        ? Math.round((questsCompleted / totalQuests) * 100)
        : 0

    // Format best day
    const bestDayLabel = bestDay?.date
        ? format(parseISO(bestDay.date), 'd MMM', { locale: tr })
        : '-'

    // Format last activity
    const lastActivityLabel = lastActivityDate
        ? (() => {
            const days = differenceInDays(new Date(), parseISO(lastActivityDate))
            if (days === 0) return 'Bugün'
            if (days === 1) return 'Dün'
            return `${days} gün önce`
        })()
        : 'Henüz yok'

    return (
        <div className="space-y-3">
            {/* Section Header */}
            <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                <h3 className="text-sm font-bold text-slate-700">Performans İstatistikleri</h3>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Total XP */}
                <StatCard
                    icon={Zap}
                    iconColor="text-amber-600"
                    iconBg="bg-amber-100"
                    title="Toplam XP"
                    value={`${totalXpEarned} XP`}
                    subtitle={xpThisWeek > 0 ? `+${xpThisWeek} bu hafta` : undefined}
                    delay={0}
                />

                {/* Completion Rate */}
                <StatCard
                    icon={Target}
                    iconColor="text-violet-600"
                    iconBg="bg-violet-100"
                    title="Tamamlama"
                    value={`%${completionRate}`}
                    subtitle={`${questsCompleted}/${totalQuests} görev`}
                    delay={0.05}
                />

                {/* Best Day */}
                <StatCard
                    icon={Trophy}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-100"
                    title="En İyi Gün"
                    value={bestDayLabel}
                    subtitle={bestDay?.value ? `+${bestDay.value} ilerleme` : undefined}
                    delay={0.1}
                />

                {/* Last Activity */}
                <StatCard
                    icon={Calendar}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-100"
                    title="Son Aktivite"
                    value={lastActivityLabel}
                    delay={0.15}
                />
            </div>

            {/* Velocity Card - Full Width */}
            <VelocityCard
                trend={velocityTrend}
                percentage={velocityPercentage}
                delay={0.2}
            />
        </div>
    )
}
