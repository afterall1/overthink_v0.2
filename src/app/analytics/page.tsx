'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, Calendar, PieChart } from 'lucide-react'
import { PnLChart, ConsistencyCalendar, CategoryBreakdown } from '@/components/analytics'

// Mock data - Replace with Supabase data
const MOCK_PNL_DATA = [
    { date: '2026-01-01', pnl: 150 },
    { date: '2026-01-02', pnl: -50 },
    { date: '2026-01-03', pnl: 200 },
    { date: '2026-01-04', pnl: -30 },
    { date: '2026-01-05', pnl: 180 },
    { date: '2026-01-06', pnl: 90 },
    { date: '2026-01-07', pnl: -120 },
    { date: '2026-01-08', pnl: 250 },
    { date: '2026-01-09', pnl: 100 },
    { date: '2026-01-10', pnl: 75 },
]

const MOCK_CONSISTENCY_DATA = [
    { date: '2026-01-01', count: 3 },
    { date: '2026-01-02', count: 2 },
    { date: '2026-01-03', count: 4 },
    { date: '2026-01-04', count: 1 },
    { date: '2026-01-05', count: 3 },
    { date: '2026-01-06', count: 2 },
    { date: '2026-01-07', count: 0 },
    { date: '2026-01-08', count: 5 },
    { date: '2026-01-09', count: 3 },
    { date: '2026-01-10', count: 2 },
]

const MOCK_CATEGORY_DATA = [
    { category: 'Trade', count: 15, color: '#F59E0B' },
    { category: 'Food', count: 28, color: '#10B981' },
    { category: 'Sport', count: 12, color: '#3B82F6' },
    { category: 'Dev', count: 22, color: '#8B5CF6' },
    { category: 'Etsy', count: 8, color: '#EC4899' },
    { category: 'Gaming', count: 18, color: '#EF4444' },
]

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color
}: {
    title: string
    value: string | number
    subtitle: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    icon: any
    color: string
}) {
    return (
        <div className="p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
            <div className="flex items-start justify-between mb-3">
                <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                >
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-sm text-gray-400 mt-1">{title}</p>
            <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>
        </div>
    )
}

export default function AnalyticsPage() {
    const totalPnL = MOCK_PNL_DATA.reduce((sum, item) => sum + item.pnl, 0)
    const totalLogs = MOCK_CONSISTENCY_DATA.reduce((sum, item) => sum + item.count, 0)
    const activeDays = MOCK_CONSISTENCY_DATA.filter(d => d.count > 0).length
    const streak = 5 // Mock streak

    return (
        <main className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold">Analytics</h1>
                        <p className="text-xs text-gray-500">Performans analizleri</p>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        title="Toplam PnL"
                        value={`$${totalPnL}`}
                        subtitle="Bu ay"
                        icon={TrendingUp}
                        color="#22c55e"
                    />
                    <StatCard
                        title="Toplam Log"
                        value={totalLogs}
                        subtitle="Bu ay"
                        icon={PieChart}
                        color="#8b5cf6"
                    />
                    <StatCard
                        title="Aktif Gün"
                        value={activeDays}
                        subtitle="Son 30 gün"
                        icon={Calendar}
                        color="#3b82f6"
                    />
                    <StatCard
                        title="Streak"
                        value={`${streak} gün`}
                        subtitle="Mevcut seri"
                        icon={Calendar}
                        color="#f59e0b"
                    />
                </div>

                {/* Trade PnL Chart */}
                <section className="p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        <h2 className="text-lg font-semibold">Trade PnL</h2>
                    </div>
                    <PnLChart data={MOCK_PNL_DATA} />
                </section>

                {/* Category Breakdown */}
                <section className="p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <PieChart className="w-5 h-5 text-purple-500" />
                        <h2 className="text-lg font-semibold">Kategori Dağılımı</h2>
                    </div>
                    <CategoryBreakdown data={MOCK_CATEGORY_DATA} />
                </section>

                {/* Consistency Calendar */}
                <section className="p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-semibold">Zinciri Kırma</h2>
                        <span className="text-xs text-gray-500">(Tutarlılık Takvimi)</span>
                    </div>
                    <ConsistencyCalendar data={MOCK_CONSISTENCY_DATA} months={3} />
                </section>
            </div>
        </main>
    )
}
