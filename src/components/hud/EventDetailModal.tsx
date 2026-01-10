'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Clock, Bell, RefreshCw, Trash2, Save, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { EventWithCategory, EventUpdate, Category } from '@/types/database.types'
import { format } from 'date-fns'
import { getCategories } from '@/actions/categories'

// Kategori slug'a göre emoji haritası
const CATEGORY_EMOJIS: Record<string, string> = {
    'trade': '📈',
    'food': '🍽️',
    'sport': '🏃',
    'dev': '💻',
    'etsy': '🛍️',
    'gaming': '🎮',
}



const RECURRENCE_OPTIONS = [
    { value: '', label: 'Tekrarlama yok' },
    { value: 'daily', label: 'Her gün' },
    { value: 'weekly', label: 'Her hafta' },
    { value: 'monthly', label: 'Her ay' },
]

const STATUS_LABELS: Record<EventWithCategory['status'], { label: string; className: string }> = {
    pending: { label: 'Bekliyor', className: 'bg-amber-100 text-amber-700' },
    notified: { label: 'Bildirildi', className: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Tamamlandı', className: 'bg-emerald-100 text-emerald-700' },
    skipped: { label: 'Atlandı', className: 'bg-slate-100 text-slate-500' },
}

// Form validation schema
const eventUpdateSchema = z.object({
    title: z.string().min(1, 'Başlık gerekli').max(100, 'Başlık çok uzun'),
    description: z.string().max(500, 'Açıklama çok uzun').optional(),
    category_id: z.string().optional(),
    scheduled_date: z.string().min(1, 'Tarih seçin'),
    scheduled_time: z.string().min(1, 'Saat seçin'),
    duration_min: z.number().min(5, 'En az 5 dk').max(480, 'En fazla 8 saat'),
    reminder_min: z.number(),
    recurrence_rule: z.string().optional(),
})

type EventUpdateFormData = z.infer<typeof eventUpdateSchema>

interface EventDetailModalProps {
    isOpen: boolean
    event: EventWithCategory | null
    onClose: () => void
    onUpdate: (id: string, data: EventUpdate) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export default function EventDetailModal({
    isOpen,
    event,
    onClose,
    onUpdate,
    onDelete
}: EventDetailModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isDirty }
    } = useForm<EventUpdateFormData>({
        resolver: zodResolver(eventUpdateSchema),
    })

    // Kategorileri Supabase'den yükle
    useEffect(() => {
        async function fetchCategories() {
            const cats = await getCategories()
            setCategories(cats)
        }
        fetchCategories()
    }, [])

    // Seçilen kategori bilgisi
    const selectedCategory = categories.find(c => c.id === selectedCategoryId)
    const categoryColor = selectedCategory?.color_code || event?.categories?.color_code || '#94a3b8'
    const categoryEmoji = selectedCategory ? CATEGORY_EMOJIS[selectedCategory.slug] || '📌' :
        (event?.categories ? CATEGORY_EMOJIS[event.categories.slug] || '📌' : '📌')

    // Reset form when event changes
    useEffect(() => {
        if (event && isOpen) {
            const scheduledDate = new Date(event.scheduled_at)
            reset({
                title: event.title,
                description: event.description || '',
                category_id: event.category_id || '',
                scheduled_date: format(scheduledDate, 'yyyy-MM-dd'),
                scheduled_time: format(scheduledDate, 'HH:mm'),
                duration_min: event.duration_min,
                reminder_min: event.reminder_min,
                recurrence_rule: event.recurrence_rule || '',
            })
            setSelectedCategoryId(event.category_id)
            setShowDeleteConfirm(false)
        }
    }, [event, isOpen, reset])

    const onSubmit = async (data: EventUpdateFormData) => {
        if (!event) return
        setIsSubmitting(true)

        try {
            const scheduled_at = new Date(`${data.scheduled_date}T${data.scheduled_time}:00`).toISOString()

            const updateData: EventUpdate = {
                title: data.title,
                description: data.description || null,
                category_id: selectedCategoryId, // Seçilen kategori UUID'si
                scheduled_at,
                duration_min: data.duration_min,
                reminder_min: data.reminder_min,
                is_recurring: Boolean(data.recurrence_rule),
                recurrence_rule: data.recurrence_rule || null,
            }

            await onUpdate(event.id, updateData)
        } catch (error) {
            console.error('Update failed:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!event) return
        setIsDeleting(true)

        try {
            await onDelete(event.id)
        } catch (error) {
            console.error('Delete failed:', error)
        } finally {
            setIsDeleting(false)
        }
    }

    if (!event) return null

    const statusInfo = STATUS_LABELS[event.status]

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50 max-h-[80vh] overflow-y-auto"
                    >
                        <Card className="ethereal-glass border-white/60 shadow-2xl shadow-indigo-500/10">
                            {/* Header */}
                            <CardHeader className="pb-4 border-b border-slate-100/50">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg border border-white/60"
                                            style={{
                                                backgroundColor: (selectedCategory || event?.categories) ? `${categoryColor}15` : '#f1f5f9',
                                                boxShadow: (selectedCategory || event?.categories) ? `0 4px 12px ${categoryColor}20` : undefined
                                            }}
                                        >
                                            {categoryEmoji}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-xl font-bold text-slate-800 truncate">
                                                {watch('title') || event.title}
                                            </h2>
                                            <Badge className={cn('mt-1 text-[10px]', statusInfo.className)}>
                                                {statusInfo.label}
                                            </Badge>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                                        aria-label="Kapat"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </CardHeader>

                            {/* Form */}
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                                    {/* Title */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            Başlık
                                        </label>
                                        <input
                                            {...register('title')}
                                            className="ethereal-input"
                                            placeholder="Plan başlığı..."
                                        />
                                        {errors.title && (
                                            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                                        )}
                                    </div>

                                    {/* Category Selection */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            📌 Kategori
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    onClick={() => setSelectedCategoryId(cat.id)}
                                                    className={cn(
                                                        'p-2.5 rounded-xl border-2 transition-all min-h-[48px] flex flex-col items-center justify-center gap-1',
                                                        selectedCategoryId === cat.id
                                                            ? 'border-indigo-400 bg-indigo-50 shadow-lg scale-105'
                                                            : 'border-slate-100 hover:border-slate-200 bg-white/50'
                                                    )}
                                                >
                                                    <span className="text-lg">{CATEGORY_EMOJIS[cat.slug] || '📌'}</span>
                                                    <span className="text-[10px] font-medium text-slate-600">{cat.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date & Time Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                <Calendar className="w-3 h-3 inline mr-1" />
                                                Tarih
                                            </label>
                                            <input
                                                type="date"
                                                {...register('scheduled_date')}
                                                className="ethereal-input"
                                            />
                                            {errors.scheduled_date && (
                                                <p className="text-red-500 text-xs mt-1">{errors.scheduled_date.message}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                <Clock className="w-3 h-3 inline mr-1" />
                                                Saat
                                            </label>
                                            <input
                                                type="time"
                                                {...register('scheduled_time')}
                                                className="ethereal-input"
                                            />
                                            {errors.scheduled_time && (
                                                <p className="text-red-500 text-xs mt-1">{errors.scheduled_time.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Duration & Reminder Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                ⏱️ Süre (dk)
                                            </label>
                                            <input
                                                type="number"
                                                {...register('duration_min', { valueAsNumber: true })}
                                                min={5}
                                                max={480}
                                                className="ethereal-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                                <Bell className="w-3 h-3 inline mr-1" />
                                                Hatırlatma (dk önce)
                                            </label>
                                            <select
                                                {...register('reminder_min', { valueAsNumber: true })}
                                                className="ethereal-input"
                                            >
                                                <option value={0}>Yok</option>
                                                <option value={5}>5 dk önce</option>
                                                <option value={10}>10 dk önce</option>
                                                <option value={15}>15 dk önce</option>
                                                <option value={30}>30 dk önce</option>
                                                <option value={60}>1 saat önce</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Recurrence */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            <RefreshCw className="w-3 h-3 inline mr-1" />
                                            Tekrarlama
                                        </label>
                                        <select
                                            {...register('recurrence_rule')}
                                            className="ethereal-input"
                                        >
                                            {RECURRENCE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            📝 Açıklama
                                        </label>
                                        <textarea
                                            {...register('description')}
                                            rows={3}
                                            className="ethereal-input resize-none"
                                            placeholder="Ek notlar..."
                                        />
                                    </div>

                                    {/* Delete Confirmation */}
                                    <AnimatePresence>
                                        {showDeleteConfirm && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                                                    <div className="flex items-center gap-2 text-red-700 mb-3">
                                                        <AlertTriangle className="w-5 h-5" />
                                                        <span className="font-semibold">Silmek istediğinize emin misiniz?</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            onClick={handleDelete}
                                                            disabled={isDeleting}
                                                            className="flex-1 min-h-[44px]"
                                                        >
                                                            {isDeleting ? 'Siliniyor...' : 'Evet, Sil'}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            onClick={() => setShowDeleteConfirm(false)}
                                                            className="flex-1 min-h-[44px]"
                                                        >
                                                            İptal
                                                        </Button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            disabled={showDeleteConfirm || isSubmitting}
                                            className="min-h-[48px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Sil
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting || !isDirty}
                                            className="flex-1 min-h-[48px] bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                    Kaydediliyor...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Kaydet
                                                </>
                                            )}
                                        </Button>
                                    </div>

                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
