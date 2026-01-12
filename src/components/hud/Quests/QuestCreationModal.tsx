'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, ChevronLeft, Plus, Zap, Clock, Target, Repeat, Check } from 'lucide-react'
import type { QuestTemplate, CategorySlug, DailyQuest, Goal } from '@/types/database.types'
import { getQuestTemplates, createQuestFromTemplate } from '@/actions/quests'

// =====================================================
// Category Configuration
// =====================================================

interface CategoryConfig {
    slug: CategorySlug
    name: string
    emoji: string
    color: string
    bgGradient: string
}

const CATEGORIES: CategoryConfig[] = [
    { slug: 'trade', name: 'Trading', emoji: '📈', color: '#F59E0B', bgGradient: 'from-amber-500/20 to-orange-500/20' },
    { slug: 'food', name: 'Beslenme', emoji: '🥗', color: '#10B981', bgGradient: 'from-emerald-500/20 to-teal-500/20' },
    { slug: 'sport', name: 'Spor', emoji: '💪', color: '#3B82F6', bgGradient: 'from-blue-500/20 to-indigo-500/20' },
    { slug: 'dev', name: 'Yazılım', emoji: '💻', color: '#8B5CF6', bgGradient: 'from-violet-500/20 to-purple-500/20' },
    { slug: 'etsy', name: 'Etsy', emoji: '🛍️', color: '#EC4899', bgGradient: 'from-pink-500/20 to-rose-500/20' },
    { slug: 'gaming', name: 'Gaming', emoji: '🎮', color: '#EF4444', bgGradient: 'from-red-500/20 to-orange-500/20' }
]

// =====================================================
// Props Interface
// =====================================================

export interface QuestCreationModalProps {
    isOpen: boolean
    onClose: () => void
    goalId?: string | null
    preselectedCategory?: CategorySlug
    goals?: Goal[]
    onQuestCreated: (quest: DailyQuest) => void
}

// =====================================================
// Difficulty Badge Component
// =====================================================

function DifficultyBadge({ difficulty }: { difficulty: 'easy' | 'medium' | 'hard' }) {
    const config = {
        easy: { label: 'Kolay', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
        medium: { label: 'Orta', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
        hard: { label: 'Zor', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
    }[difficulty]

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${config.color}`}>
            {config.label}
        </span>
    )
}

// =====================================================
// Template Card Component
// =====================================================

interface TemplateCardProps {
    template: QuestTemplate
    isSelected: boolean
    onSelect: () => void
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
    return (
        <motion.button
            onClick={onSelect}
            className={`
                w-full text-left p-4 rounded-xl border transition-all duration-200
                ${isSelected
                    ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                }
            `}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
        >
            <div className="flex items-start gap-3">
                {/* Emoji */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">
                    {template.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-white font-medium truncate">{template.title}</h4>
                        {isSelected && (
                            <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        )}
                    </div>

                    {template.description && (
                        <p className="text-white/50 text-sm line-clamp-2 mb-2">
                            {template.description}
                        </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" />
                            {template.xp_reward} XP
                        </span>

                        <DifficultyBadge difficulty={template.difficulty} />

                        {template.estimated_minutes && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {template.estimated_minutes} dk
                            </span>
                        )}

                        {template.is_recurring_default && (
                            <span className="flex items-center gap-1">
                                <Repeat className="w-3 h-3 text-blue-400" />
                                Tekrarlı
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </motion.button>
    )
}

// =====================================================
// Category Card Component
// =====================================================

interface CategoryCardProps {
    category: CategoryConfig
    templateCount: number
    onSelect: () => void
}

function CategoryCard({ category, templateCount, onSelect }: CategoryCardProps) {
    return (
        <motion.button
            onClick={onSelect}
            className={`
                relative overflow-hidden p-6 rounded-2xl border border-white/10
                bg-gradient-to-br ${category.bgGradient}
                hover:border-white/20 transition-all duration-300
                group
            `}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex flex-col items-center text-center gap-2">
                <span className="text-4xl mb-1">{category.emoji}</span>
                <h3 className="text-white font-semibold">{category.name}</h3>
                <p className="text-white/50 text-sm">{templateCount} şablon</p>
            </div>

            {/* Glow effect */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(circle at center, ${category.color}20 0%, transparent 70%)`
                }}
            />
        </motion.button>
    )
}

// =====================================================
// Main Modal Component
// =====================================================

export default function QuestCreationModal({
    isOpen,
    onClose,
    goalId,
    preselectedCategory,
    goals = [],
    onQuestCreated
}: QuestCreationModalProps) {
    // State
    const [step, setStep] = useState<'category' | 'template' | 'customize'>('category')
    const [selectedCategory, setSelectedCategory] = useState<CategorySlug | null>(preselectedCategory ?? null)
    const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null)
    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(goalId ?? null)
    const [templates, setTemplates] = useState<QuestTemplate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [error, setError] = useState<string | null>(null)

    // Template count by category (memoized)
    const templateCountByCategory = useMemo(() => {
        const counts: Record<string, number> = {}
        templates.forEach(t => {
            counts[t.category_slug] = (counts[t.category_slug] || 0) + 1
        })
        return counts
    }, [templates])

    // Filtered templates
    const filteredTemplates = useMemo(() => {
        let filtered = templates

        if (selectedCategory) {
            filtered = filtered.filter(t => t.category_slug === selectedCategory)
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query)
            )
        }

        return filtered
    }, [templates, selectedCategory, searchQuery])

    // Load templates
    const loadTemplates = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        const result = await getQuestTemplates()

        if (result.error) {
            setError(result.error)
        } else {
            setTemplates(result.data ?? [])
        }

        setIsLoading(false)
    }, [])

    // Load templates on mount
    useEffect(() => {
        if (isOpen) {
            loadTemplates()
        }
    }, [isOpen, loadTemplates])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setStep('category')
            setSelectedCategory(preselectedCategory ?? null)
            setSelectedTemplate(null)
            setSearchQuery('')
            setError(null)
        }
    }, [isOpen, preselectedCategory])

    // Handle category selection
    const handleCategorySelect = (category: CategorySlug) => {
        setSelectedCategory(category)
        setStep('template')
    }

    // Handle template selection
    const handleTemplateSelect = (template: QuestTemplate) => {
        setSelectedTemplate(template)
    }

    // Handle quest creation
    const handleCreateQuest = async () => {
        if (!selectedTemplate) return

        setIsCreating(true)
        setError(null)

        const result = await createQuestFromTemplate(
            selectedTemplate.id,
            selectedGoalId,
            {}
        )

        if (result.error) {
            setError(result.error)
            setIsCreating(false)
            return
        }

        if (result.data) {
            onQuestCreated(result.data)
            onClose()
        }

        setIsCreating(false)
    }

    // Handle back navigation
    const handleBack = () => {
        if (step === 'template') {
            setStep('category')
            setSelectedCategory(null)
            setSelectedTemplate(null)
        } else if (step === 'customize') {
            setStep('template')
        }
    }

    // Get current step title
    const getStepTitle = () => {
        switch (step) {
            case 'category': return 'Kategori Seç'
            case 'template': return CATEGORIES.find(c => c.slug === selectedCategory)?.name ?? 'Şablon Seç'
            case 'customize': return 'Özelleştir'
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
                            md:w-full md:max-w-2xl md:max-h-[85vh] z-50
                            bg-slate-900/95 border border-white/10 rounded-2xl
                            flex flex-col overflow-hidden shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                            <div className="flex items-center gap-3">
                                {step !== 'category' && (
                                    <motion.button
                                        onClick={handleBack}
                                        className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <ChevronLeft className="w-5 h-5 text-white/60" />
                                    </motion.button>
                                )}
                                <h2 className="text-xl font-semibold text-white">{getStepTitle()}</h2>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Error */}
                            {error && (
                                <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Loading */}
                            {isLoading && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
                                </div>
                            )}

                            {/* Category Selection */}
                            {!isLoading && step === 'category' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {CATEGORIES.map(category => (
                                        <CategoryCard
                                            key={category.slug}
                                            category={category}
                                            templateCount={templateCountByCategory[category.slug] || 0}
                                            onSelect={() => handleCategorySelect(category.slug)}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Template Selection */}
                            {!isLoading && step === 'template' && (
                                <div className="space-y-4">
                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Şablon ara..."
                                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10
                                                text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                        />
                                    </div>

                                    {/* Goal Selection */}
                                    {goals.length > 0 && (
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                            <label className="flex items-center gap-2 text-sm text-white/60 mb-2">
                                                <Target className="w-4 h-4" />
                                                Hedefe Bağla
                                            </label>
                                            <select
                                                value={selectedGoalId ?? ''}
                                                onChange={(e) => setSelectedGoalId(e.target.value || null)}
                                                className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10
                                                    text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                            >
                                                <option value="">Hedef seçilmedi</option>
                                                {goals.map(goal => (
                                                    <option key={goal.id} value={goal.id}>
                                                        {goal.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Templates */}
                                    <div className="space-y-3">
                                        {filteredTemplates.length === 0 ? (
                                            <div className="text-center py-12 text-white/50">
                                                {searchQuery ? 'Aranan şablon bulunamadı' : 'Bu kategoride şablon yok'}
                                            </div>
                                        ) : (
                                            filteredTemplates.map(template => (
                                                <TemplateCard
                                                    key={template.id}
                                                    template={template}
                                                    isSelected={selectedTemplate?.id === template.id}
                                                    onSelect={() => handleTemplateSelect(template)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {step === 'template' && selectedTemplate && (
                            <div className="px-6 py-4 border-t border-white/10 bg-slate-900/50">
                                <motion.button
                                    onClick={handleCreateQuest}
                                    disabled={isCreating}
                                    className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600
                                        text-white font-medium flex items-center justify-center gap-2
                                        hover:from-violet-500 hover:to-purple-500 transition-all
                                        disabled:opacity-50 disabled:cursor-not-allowed"
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Oluşturuluyor...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            Quest Oluştur
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
