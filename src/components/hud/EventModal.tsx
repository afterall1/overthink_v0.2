'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Clock, Bell, RefreshCw } from 'lucide-react'
import type { EventInsert } from '@/types/database.types'
import { addMockEvent } from '@/lib/mockEvents'

// Kategori listesi
const CATEGORIES = [
    { id: 'cat-trade-001', name: 'Trade', emoji: '📈', color: '#F59E0B' },
    { id: 'cat-food-002', name: 'Food', emoji: '🍽️', color: '#10B981' },
    { id: 'cat-sport-003', name: 'Sport', emoji: '🏃', color: '#3B82F6' },
    { id: 'cat-dev-004', name: 'Dev', emoji: '💻', color: '#8B5CF6' },
    { id: 'cat-etsy-005', name: 'Etsy', emoji: '🛍️', color: '#EC4899' },
    { id: 'cat-gaming-006', name: 'Gaming', emoji: '🎮', color: '#EF4444' },
]

// Hatırlatma seçenekleri
const REMINDER_OPTIONS = [
    { value: 5, label: '5 dk önce' },
    { value: 15, label: '15 dk önce' },
    { value: 30, label: '30 dk önce' },
    { value: 60, label: '1 saat önce' },
]

// Tekrarlama seçenekleri
const RECURRENCE_OPTIONS = [
    { value: '', label: 'Tekrarlama yok' },
    { value: 'daily', label: 'Her gün' },
    { value: 'weekly', label: 'Her hafta' },
    { value: 'monthly', label: 'Her ay' },
]

// Form validation schema
const eventSchema = z.object({
    title: z.string().min(1, 'Başlık gerekli').max(100, 'Başlık çok uzun'),
    description: z.string().max(500, 'Açıklama çok uzun').optional(),
    category_id: z.string().optional(),
    scheduled_date: z.string().min(1, 'Tarih seçin'),
    scheduled_time: z.string().min(1, 'Saat seçin'),
    duration_min: z.coerce.number().min(5, 'En az 5 dk').max(480, 'En fazla 8 saat'),
    reminder_min: z.coerce.number(),
    recurrence_rule: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventModalProps {
    isOpen: boolean
    onClose: () => void
    onEventCreated?: (event: EventInsert) => void
    initialDate?: Date // CalendarPicker'dan gelen tarih
}

export default function EventModal({ isOpen, onClose, onEventCreated, initialDate }: EventModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        formState: { errors },
    } = useForm<EventFormData>({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            title: '',
            description: '',
            duration_min: 30,
            reminder_min: 15,
            recurrence_rule: '',
        },
    })

    // initialDate değiştiğinde formu güncelle
    useEffect(() => {
        if (initialDate && isOpen) {
            const dateStr = initialDate.toISOString().split('T')[0]
            setValue('scheduled_date', dateStr)
        }
    }, [initialDate, isOpen, setValue])

    // Minimum tarih: bugün
    const today = new Date().toISOString().split('T')[0]


    const onSubmit = async (data: EventFormData) => {
        setIsSubmitting(true)
        try {
            // Tarih ve saati birleştir
            const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}`)

            const newEvent: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'> = {
                user_id: 'user-demo-001', // Mock user
                category_id: selectedCategory || null,
                title: data.title,
                description: data.description || null,
                data: {},
                scheduled_at: scheduledAt.toISOString(),
                duration_min: data.duration_min,
                reminder_min: data.reminder_min,
                is_recurring: Boolean(data.recurrence_rule),
                recurrence_rule: data.recurrence_rule || null,
                status: 'pending',
                completed_at: null,
                linked_log_id: null,
            }

            // Mock'a ekle
            const created = addMockEvent(newEvent as Parameters<typeof addMockEvent>[0])
            onEventCreated?.(created)

            // Reset form
            reset()
            setSelectedCategory(null)
            onClose()
        } catch (error) {
            console.error('Event creation failed:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/90 p-6 backdrop-blur-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        <h2 className="text-lg font-semibold text-white">Yeni Plan</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Category Selection */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-400">
                            Kategori (opsiyonel)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategory(
                                            selectedCategory === cat.id ? null : cat.id
                                        )
                                    }
                                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all ${selectedCategory === cat.id
                                        ? 'ring-2 ring-white/50'
                                        : 'opacity-60 hover:opacity-100'
                                        }`}
                                    style={{
                                        backgroundColor: `${cat.color}20`,
                                        color: cat.color,
                                    }}
                                >
                                    <span>{cat.emoji}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="mb-2 block text-sm font-medium text-gray-400">
                            Başlık *
                        </label>
                        <input
                            {...register('title')}
                            id="title"
                            type="text"
                            placeholder="Ne planlıyorsun?"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-400">
                            Açıklama
                        </label>
                        <textarea
                            {...register('description')}
                            id="description"
                            rows={2}
                            placeholder="Detaylar..."
                            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="scheduled_date" className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-400">
                                <Calendar className="h-4 w-4" />
                                Tarih *
                            </label>
                            <input
                                {...register('scheduled_date')}
                                id="scheduled_date"
                                type="date"
                                min={today}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none"
                            />
                            {errors.scheduled_date && (
                                <p className="mt-1 text-xs text-red-400">{errors.scheduled_date.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="scheduled_time" className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-400">
                                <Clock className="h-4 w-4" />
                                Saat *
                            </label>
                            <input
                                {...register('scheduled_time')}
                                id="scheduled_time"
                                type="time"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none"
                            />
                            {errors.scheduled_time && (
                                <p className="mt-1 text-xs text-red-400">{errors.scheduled_time.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Duration & Reminder */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="duration_min" className="mb-2 block text-sm font-medium text-gray-400">
                                Süre (dk)
                            </label>
                            <input
                                {...register('duration_min')}
                                id="duration_min"
                                type="number"
                                min={5}
                                max={480}
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label htmlFor="reminder_min" className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-400">
                                <Bell className="h-4 w-4" />
                                Hatırlatma
                            </label>
                            <select
                                {...register('reminder_min')}
                                id="reminder_min"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none"
                            >
                                {REMINDER_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value} className="bg-gray-900">
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label htmlFor="recurrence_rule" className="mb-2 flex items-center gap-1 text-sm font-medium text-gray-400">
                            <RefreshCw className="h-4 w-4" />
                            Tekrarlama
                        </label>
                        <select
                            {...register('recurrence_rule')}
                            id="recurrence_rule"
                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white transition-colors focus:border-blue-500 focus:outline-none"
                        >
                            {RECURRENCE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-gray-900">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 font-semibold text-white transition-all hover:from-blue-600 hover:to-purple-600 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Plan Oluştur'}
                    </button>
                </form>
            </div>
        </>
    )
}
