'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Clock, Zap, Sparkles, SkipForward, Trash2, MoreVertical, Brain, RefreshCw } from 'lucide-react'
import type { DailyQuest } from '@/types/database.types'
import AIQuestGeneratorModal from '../../Health/AIQuestGeneratorModal'

// =====================================================
// Props Interface
// =====================================================

interface LinkedQuestsPanelProps {
    quests: DailyQuest[]
    goalUnit?: string
    onCompleteQuest: (questId: string) => Promise<void>
    onSkipQuest: (questId: string) => Promise<void>
    onDeleteQuest?: (questId: string) => Promise<void>
    isLoading?: boolean
    // AI Regenerate props
    goalId?: string
    goalTitle?: string
    categorySlug?: string | null
    hasHealthProfile?: boolean
    onQuestsRefresh?: () => void
}

// =====================================================
// Helper Functions
// =====================================================

function getDifficultyStyle(difficulty: string): { color: string; bgColor: string; label: string } {
    switch (difficulty) {
        case 'hard':
            return { color: 'text-red-600', bgColor: 'bg-red-50', label: 'Zor' }
        case 'medium':
            return { color: 'text-amber-600', bgColor: 'bg-amber-50', label: 'Orta' }
        default:
            return { color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: 'Kolay' }
    }
}

// =====================================================
// Quest Card Component
// =====================================================

function QuestCard({
    quest,
    index,
    onComplete,
    onSkip,
    onDelete,
    isLoading
}: {
    quest: DailyQuest
    index: number
    onComplete: (questId: string) => Promise<void>
    onSkip: (questId: string) => Promise<void>
    onDelete?: (questId: string) => Promise<void>
    isLoading?: boolean
}) {
    const [isActioning, setIsActioning] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const isCompleted = quest.status === 'completed'
    const isSkipped = quest.status === 'skipped'
    const isPending = quest.status === 'pending'
    const difficultyStyle = getDifficultyStyle(quest.difficulty ?? 'medium')

    const handleComplete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isActioning || isLoading) return
        setIsActioning(true)
        try {
            await onComplete(quest.id)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Complete quest failed:', error)
            }
        } finally {
            setIsActioning(false)
            setShowMenu(false)
        }
    }

    const handleSkip = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (isActioning || isLoading) return
        setIsActioning(true)
        try {
            await onSkip(quest.id)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Skip quest failed:', error)
            }
        } finally {
            setIsActioning(false)
            setShowMenu(false)
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!onDelete || isActioning || isLoading) return
        setIsActioning(true)
        try {
            await onDelete(quest.id)
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Delete quest failed:', error)
            }
        } finally {
            setIsActioning(false)
            setShowMenu(false)
            setShowDeleteConfirm(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={`
                relative p-4 rounded-2xl border transition-all duration-300
                ${isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200/50'
                    : isSkipped
                        ? 'bg-slate-50/50 border-slate-200/50 opacity-60'
                        : 'bg-white/60 border-slate-200/50 hover:border-violet-300 hover:shadow-md'
                }
            `}
        >
            {/* Completion shine effect */}
            {isCompleted && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/5 via-emerald-300/10 to-emerald-400/5"
                />
            )}

            <div className="relative flex items-start gap-3">
                {/* Status Indicator - LEFT SIDE */}
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                    ${isCompleted
                        ? 'bg-emerald-500'
                        : isSkipped
                            ? 'bg-slate-300'
                            : 'bg-gradient-to-br from-violet-100 to-indigo-100'
                    }
                `}>
                    {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : isSkipped ? (
                        <SkipForward className="w-5 h-5 text-white" />
                    ) : (
                        <span className="text-xl">{quest.emoji || '✨'}</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold truncate ${isCompleted ? 'text-emerald-700' : isSkipped ? 'text-slate-400' : 'text-slate-800'
                            }`}>
                            {quest.title}
                        </h4>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Difficulty Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyStyle.bgColor} ${difficultyStyle.color}`}>
                            {difficultyStyle.label}
                        </span>

                        {/* XP Badge */}
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                            <Zap className="w-3 h-3" />
                            {quest.xp_reward} XP
                        </span>

                        {/* Recurring Badge */}
                        {quest.is_recurring && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                                <Sparkles className="w-3 h-3" />
                                Tekrar
                            </span>
                        )}

                        {/* Completed status badge - shows contribution to goal */}
                        {isCompleted && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="w-3 h-3" />
                                Hedefe Katkı Sağladı
                            </span>
                        )}
                    </div>

                    {/* Action Buttons for Pending Quests */}
                    {isPending && (
                        <div className="flex items-center gap-2 mt-3">
                            {/* Complete Button */}
                            <button
                                onClick={handleComplete}
                                disabled={isActioning || isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                           bg-emerald-500 text-white text-xs font-semibold
                                           hover:bg-emerald-600 active:scale-95
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           transition-all duration-200"
                            >
                                {isActioning ? (
                                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                Tamamla
                            </button>

                            {/* Skip Button */}
                            <button
                                onClick={handleSkip}
                                disabled={isActioning || isLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                           bg-slate-100 text-slate-600 text-xs font-semibold
                                           hover:bg-slate-200 active:scale-95
                                           disabled:opacity-50 disabled:cursor-not-allowed
                                           transition-all duration-200"
                            >
                                <SkipForward className="w-3.5 h-3.5" />
                                Atla
                            </button>

                            {/* More Menu */}
                            {onDelete && (
                                <div className="relative ml-auto">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setShowMenu(!showMenu)
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4 text-slate-400" />
                                    </button>

                                    <AnimatePresence>
                                        {showMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 z-10 py-1"
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setShowDeleteConfirm(true)
                                                        setShowMenu(false)
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    Sil
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Overlay */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center p-4 z-20"
                    >
                        <div className="text-center">
                            <p className="text-sm font-medium text-slate-700 mb-3">Bu görevi silmek istediğinden emin misin?</p>
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setShowDeleteConfirm(false)
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isActioning}
                                    className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                                >
                                    {isActioning ? (
                                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                    Evet, Sil
                                </button>
                            </div>
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

export default function LinkedQuestsPanel({
    quests,
    onCompleteQuest,
    onSkipQuest,
    onDeleteQuest,
    isLoading,
    goalId,
    goalTitle,
    categorySlug,
    hasHealthProfile,
    onQuestsRefresh
}: LinkedQuestsPanelProps) {
    const [showAIModal, setShowAIModal] = useState(false)

    // Separate active and completed quests
    const activeQuests = quests.filter(q => q.status === 'pending')
    const completedQuests = quests.filter(q => q.status === 'completed')
    const skippedQuests = quests.filter(q => q.status === 'skipped')

    // Check if AI regenerate is available (health category + profile exists)
    const isHealthCategory = categorySlug === 'food' || categorySlug === 'sport'
    const canRegenerateAI = isHealthCategory && hasHealthProfile && goalId && goalTitle

    if (quests.length === 0 && !canRegenerateAI) {
        return null
    }

    return (
        <>
            <div className="bg-white/40 backdrop-blur-sm rounded-2xl border border-slate-100/50 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Bağlı Görevler</h3>
                    <div className="flex items-center gap-2">
                        {/* AI Regenerate Button */}
                        {canRegenerateAI && (
                            <button
                                onClick={() => setShowAIModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold 
                                     bg-gradient-to-r from-violet-500 to-purple-600 text-white 
                                     shadow-md shadow-violet-500/30 hover:shadow-lg hover:scale-[1.02] 
                                     active:scale-[0.98] transition-all"
                            >
                                <Brain className="w-3.5 h-3.5" />
                                AI ile Yenile
                            </button>
                        )}
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                            {quests.length} Görev
                        </span>
                        {completedQuests.length > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                                {completedQuests.length} Tamamlandı
                            </span>
                        )}
                    </div>
                </div>

                {/* Progress indicator */}
                {completedQuests.length > 0 && (
                    <div className="mb-4 p-3 bg-emerald-50/80 rounded-xl border border-emerald-100">
                        <p className="text-sm text-emerald-700">
                            <span className="font-bold">{completedQuests.length}</span> görev tamamlandı ve hedefe katkı sağladı.
                        </p>
                    </div>
                )}

                <div className="space-y-4">
                    {/* Active Quests Section */}
                    {activeQuests.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-amber-600 mb-2 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Bekleyen ({activeQuests.length})
                            </h4>
                            <div className="space-y-2">
                                {activeQuests.map((quest, index) => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        index={index}
                                        onComplete={onCompleteQuest}
                                        onSkip={onSkipQuest}
                                        onDelete={onDeleteQuest}
                                        isLoading={isLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Quests Section */}
                    {completedQuests.length > 0 && (
                        <div>
                            <h4 className="text-sm font-semibold text-emerald-600 mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Tamamlandı ({completedQuests.length})
                            </h4>
                            <div className="space-y-2">
                                {completedQuests.map((quest, index) => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        index={index}
                                        onComplete={onCompleteQuest}
                                        onSkip={onSkipQuest}
                                        onDelete={onDeleteQuest}
                                        isLoading={isLoading}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Skipped Quests (collapsed) */}
                    {skippedQuests.length > 0 && (
                        <div className="opacity-60">
                            <h4 className="text-sm font-medium text-slate-400 mb-2">
                                Atlanan ({skippedQuests.length})
                            </h4>
                            <div className="space-y-2">
                                {skippedQuests.slice(0, 2).map((quest, index) => (
                                    <QuestCard
                                        key={quest.id}
                                        quest={quest}
                                        index={index}
                                        onComplete={onCompleteQuest}
                                        onSkip={onSkipQuest}
                                        onDelete={onDeleteQuest}
                                        isLoading={isLoading}
                                    />
                                ))}
                                {skippedQuests.length > 2 && (
                                    <p className="text-xs text-slate-400 text-center py-2">
                                        +{skippedQuests.length - 2} daha
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Empty State with AI Suggestion */}
                {quests.length === 0 && canRegenerateAI && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 
                                  flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-violet-600" />
                        </div>
                        <p className="text-sm text-slate-500 mb-3">
                            Bu hedef için henüz görev yok.
                        </p>
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                                 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold
                                 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:scale-[1.02] 
                                 active:scale-[0.98] transition-all"
                        >
                            <Brain className="w-4 h-4" />
                            AI ile Görev Üret
                        </button>
                    </div>
                )}
            </div>

            {/* AI Quest Generator Modal */}
            {canRegenerateAI && (
                <AIQuestGeneratorModal
                    isOpen={showAIModal}
                    onClose={() => setShowAIModal(false)}
                    goalId={goalId}
                    goalTitle={goalTitle}
                    categorySlug={categorySlug}
                    onQuestsSaved={() => {
                        setShowAIModal(false)
                        onQuestsRefresh?.()
                    }}
                />
            )}
        </>
    )
}
