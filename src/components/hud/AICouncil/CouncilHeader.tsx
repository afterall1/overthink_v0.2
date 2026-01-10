'use client'

import CouncilMemberAvatar from './CouncilMemberAvatar'
import { CalendarDays, BarChart3, Target } from 'lucide-react'

// Council member definitions
const COUNCIL_MEMBERS = [
    { id: 'mind', emoji: '🧠', name: 'Psikolog', color: '#a855f7' },
    { id: 'trader', emoji: '📈', name: 'Trader', color: '#f59e0b' },
    { id: 'fuel', emoji: '🍎', name: 'Diyetisyen', color: '#10b981' },
    { id: 'visionary', emoji: '🔮', name: 'Koç', color: '#8b5cf6' },
    { id: 'system', emoji: '⚙️', name: 'Backend', color: '#6366f1' },
    { id: 'interface', emoji: '🎨', name: 'Frontend', color: '#ec4899' },
    { id: 'growth', emoji: '🚀', name: 'Growth', color: '#f97316' },
    { id: 'logistics', emoji: '📦', name: 'Operasyon', color: '#14b8a6' },
    { id: 'player', emoji: '🎮', name: 'Gamer', color: '#ef4444' },
    { id: 'body', emoji: '💪', name: 'Fitness', color: '#3b82f6' },
] as const

interface CouncilHeaderProps {
    activeMember: string | null
    onQuickAction: (action: 'daily' | 'weekly' | 'task') => void
    hasActiveEvent: boolean
}

/**
 * Council panel header with member avatars and quick actions
 */
export default function CouncilHeader({ activeMember, onQuickAction, hasActiveEvent }: CouncilHeaderProps) {
    return (
        <div className="px-4 pb-4 border-b border-slate-200/30">
            {/* Title */}
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <span className="text-xl">🏛️</span>
                KONSEY OTURUMU
            </h2>

            {/* Member avatars carousel */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                {COUNCIL_MEMBERS.map((member) => (
                    <CouncilMemberAvatar
                        key={member.id}
                        emoji={member.emoji}
                        name={member.name}
                        color={member.color}
                        isActive={activeMember === 'all' || activeMember === member.id}
                    />
                ))}
            </div>

            {/* Quick action buttons */}
            <div className="flex gap-2 mt-4">
                <button
                    onClick={() => onQuickAction('daily')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 text-slate-700 text-sm font-medium hover:from-purple-500/20 hover:to-blue-500/20 transition-all active:scale-95"
                >
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span className="hidden sm:inline">Günlük</span> Özet
                </button>

                <button
                    onClick={() => onQuickAction('weekly')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-200/50 text-slate-700 text-sm font-medium hover:from-blue-500/20 hover:to-cyan-500/20 transition-all active:scale-95"
                >
                    <CalendarDays className="w-4 h-4 text-blue-500" />
                    <span className="hidden sm:inline">Haftalık</span> Rapor
                </button>

                {hasActiveEvent && (
                    <button
                        onClick={() => onQuickAction('task')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200/50 text-slate-700 text-sm font-medium hover:from-amber-500/20 hover:to-orange-500/20 transition-all active:scale-95"
                    >
                        <Target className="w-4 h-4 text-amber-500" />
                        Tavsiye
                    </button>
                )}
            </div>
        </div>
    )
}
