'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar, Tag, Target, Hash, AlignLeft, ChevronDown } from 'lucide-react'
import type { GoalPeriod, GoalWithDetails, Category } from '@/types/database.types'

interface GoalFormData {
    title: string
    description: string
    target_value: number | undefined
    unit: string
    period: GoalPeriod
    category_id: string
    start_date: string
    end_date: string
}

interface GoalModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: GoalFormData) => Promise<void>
    categories: Pick<Category, 'id' | 'name' | 'slug' | 'color_code' | 'icon_slug'>[]
    editingGoal?: GoalWithDetails | null
}

const PERIOD_OPTIONS: { value: GoalPeriod; label: string; color: string }[] = [
    { value: 'daily', label: 'Günlük', color: 'bg-emerald-500' },
    { value: 'weekly', label: 'Haftalık', color: 'bg-blue-500' },
    { value: 'monthly', label: 'Aylık', color: 'bg-violet-500' },
    { value: 'yearly', label: 'Yıllık', color: 'bg-amber-500' }
]

export default function GoalModal({
    isOpen,
    onClose,
    onSubmit,
    categories,
    editingGoal
}: GoalModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPeriodOpen, setIsPeriodOpen] = useState(false)
    const [errors, setErrors] = useState<Partial<Record<keyof GoalFormData, string>>>({})

    const today = new Date().toISOString().split('T')[0]

    const [formData, setFormData] = useState<GoalFormData>({
        title: '',
        description: '',
        target_value: undefined,
        unit: '',
        period: 'weekly',
        category_id: '',
        start_date: today,
        end_date: ''
    })

    // Reset form when modal opens/closes or editingGoal changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: editingGoal?.title || '',
                description: editingGoal?.description || '',
                target_value: editingGoal?.target_value ?? undefined,
                unit: editingGoal?.unit || '',
                period: (editingGoal?.period ?? 'weekly') as GoalPeriod,
                category_id: editingGoal?.category_id || '',
                start_date: editingGoal?.start_date || today,
                end_date: editingGoal?.end_date || ''
            })
            setErrors({})
        }
    }, [isOpen, editingGoal, today])

    const validateForm = (): boolean => {
        const newErrors: Partial<Record<keyof GoalFormData, string>> = {}

        if (!formData.title.trim()) {
            newErrors.title = 'Başlık gerekli'
        } else if (formData.title.length > 100) {
            newErrors.title = 'Başlık çok uzun (max 100 karakter)'
        }

        if (!formData.start_date) {
            newErrors.start_date = 'Başlangıç tarihi gerekli'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: keyof GoalFormData, value: string | number | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }))
        }
    }

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setIsSubmitting(true)
        try {
            await onSubmit(formData)
            handleClose()
        } catch (error) {
            console.error('Failed to save goal:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        setFormData({
            title: '',
            description: '',
            target_value: undefined,
            unit: '',
            period: 'weekly',
            category_id: '',
            start_date: today,
            end_date: ''
        })
        setErrors({})
        onClose()
    }

    const selectedCategory = categories.find(c => c.id === formData.category_id)

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 
                                 md:w-full md:max-w-lg z-50 max-h-[80vh] overflow-y-auto"
                    >
                        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-indigo-500/10 
                                      border border-white/60 overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 
                                                  flex items-center justify-center shadow-lg shadow-violet-500/30">
                                        <Target className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">
                                            {editingGoal ? 'Hedefi Düzenle' : 'Yeni Hedef'}
                                        </h2>
                                        <p className="text-xs text-slate-400">Amaçlarını tanımla ve takip et</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                                    aria-label="Kapat"
                                >
                                    <X className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleFormSubmit} className="p-5 space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                        <Target className="w-4 h-4" />
                                        Hedef Başlığı
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange('title', e.target.value)}
                                        placeholder="Örn: Haftada 3 gün spor yap"
                                        className="ethereal-input"
                                    />
                                    {errors.title && (
                                        <p className="text-xs text-red-500 mt-1">{errors.title}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                        <AlignLeft className="w-4 h-4" />
                                        Açıklama (Opsiyonel)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        rows={2}
                                        placeholder="Hedefin hakkında detay..."
                                        className="ethereal-input resize-none"
                                    />
                                </div>

                                {/* Period Selector */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        Periyot
                                    </label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsPeriodOpen(!isPeriodOpen)}
                                            className="ethereal-input flex items-center justify-between w-full"
                                        >
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${PERIOD_OPTIONS.find(p => p.value === formData.period)?.color}`} />
                                                {PERIOD_OPTIONS.find(p => p.value === formData.period)?.label}
                                            </span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isPeriodOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <AnimatePresence>
                                            {isPeriodOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-10"
                                                >
                                                    {PERIOD_OPTIONS.map(option => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                handleInputChange('period', option.value)
                                                                setIsPeriodOpen(false)
                                                            }}
                                                            className={`w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors
                                                                ${formData.period === option.value ? 'bg-violet-50' : ''}`}
                                                        >
                                                            <span className={`w-2 h-2 rounded-full ${option.color}`} />
                                                            <span className="text-sm font-medium text-slate-700">{option.label}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Target Value & Unit */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                            <Hash className="w-4 h-4" />
                                            Hedef Değer
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.target_value ?? ''}
                                            onChange={(e) => handleInputChange('target_value', e.target.value ? Number(e.target.value) : undefined)}
                                            min="0"
                                            step="any"
                                            placeholder="Örn: 3"
                                            className="ethereal-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                            Birim
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.unit}
                                            onChange={(e) => handleInputChange('unit', e.target.value)}
                                            placeholder="Örn: gün, saat, km"
                                            className="ethereal-input"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                        <Tag className="w-4 h-4" />
                                        Kategori (Opsiyonel)
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleInputChange('category_id', '')}
                                            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all
                                                ${!formData.category_id
                                                    ? 'bg-slate-200 text-slate-700 ring-2 ring-slate-400'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                        >
                                            Yok
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => handleInputChange('category_id', cat.id)}
                                                className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                                                style={{
                                                    backgroundColor: formData.category_id === cat.id ? cat.color_code : `${cat.color_code}20`,
                                                    color: formData.category_id === cat.id ? '#fff' : cat.color_code,
                                                    boxShadow: formData.category_id === cat.id ? `0 4px 12px ${cat.color_code}40` : 'none'
                                                }}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                            <Calendar className="w-4 h-4" />
                                            Başlangıç
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.start_date}
                                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                                            className="ethereal-input"
                                        />
                                        {errors.start_date && (
                                            <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                                            Bitiş (Opsiyonel)
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.end_date}
                                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                                            className="ethereal-input"
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 
                                             text-white font-bold shadow-lg shadow-violet-500/30
                                             hover:shadow-xl hover:shadow-violet-500/40 hover:scale-[1.02]
                                             active:scale-[0.98] transition-all duration-200
                                             disabled:opacity-50 disabled:cursor-not-allowed
                                             flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            {editingGoal ? 'Güncelle' : 'Hedef Oluştur'}
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
