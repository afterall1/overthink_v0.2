'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Clock, Bell, RefreshCw } from 'lucide-react'
import type { EventInsert, Category } from '@/types/database.types'
import { getCategories } from '@/actions/categories'

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

// Kategori slug'a göre emoji haritası (fallback)
const CATEGORY_EMOJIS: Record<string, string> = {
    'trade': '📈',
    'food': '🍽️',
    'sport': '🏃',
    'dev': '💻',
    'etsy': '🛍️',
    'gaming': '🎮',
}

// Form validation schema
const eventSchema = z.object({
    title: z.string().min(1, 'Başlık gerekli').max(100, 'Başlık çok uzun'),
    description: z.string().max(500, 'Açıklama çok uzun').optional(),
    category_id: z.string().optional(),
    scheduled_date: z.string().min(1, 'Tarih seçin'),
    scheduled_time: z.string().min(1, 'Saat seçin'),
    duration_min: z.number().min(5, 'En az 5 dk').max(480, 'En fazla 8 saat'),
    reminder_min: z.number(),
    recurrence_rule: z.string().optional(),
})

type EventFormData = z.infer<typeof eventSchema>

interface EventModalProps {
    isOpen: boolean
    onClose: () => void
    onEventCreated?: (event: EventInsert) => void | Promise<void>
    selectedDate?: Date
}

export default function EventModal({ isOpen, onClose, onEventCreated, selectedDate }: EventModalProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])

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

    // Kategorileri Supabase'den yükle
    useEffect(() => {
        async function fetchCategories() {
            const cats = await getCategories()
            setCategories(cats)
        }
        fetchCategories()
    }, [])

    // selectedDate değiştiğinde formu güncelle
    useEffect(() => {
        if (selectedDate && isOpen) {
            const dateStr = selectedDate.toISOString().split('T')[0]
            setValue('scheduled_date', dateStr)
        }
    }, [selectedDate, isOpen, setValue])

    // Minimum tarih: bugün
    const today = new Date().toISOString().split('T')[0]


    const onSubmit = async (data: EventFormData) => {
        setIsSubmitting(true)
        try {
            // Tarih ve saati birleştir
            const scheduledAt = new Date(`${data.scheduled_date}T${data.scheduled_time}`)

            const newEvent: Omit<EventInsert, 'id' | 'created_at' | 'updated_at'> = {
                user_id: '00000000-0000-0000-0000-000000000000', // Dev placeholder (RLS bypass handles this)
                category_id: selectedCategoryId, // Gerçek UUID kullan
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

            // Mock'a ekle yerine parent fonksiyona iletiyoruz
            const eventPayload = newEvent as EventInsert
            await onEventCreated?.(eventPayload)

            // Reset form
            reset()
            setSelectedCategoryId(null)
            onClose()
        } catch (error) {
            console.error('Event creation failed:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    // Get selected category data for dynamic glow
    const selectedCategoryData = categories.find(c => c.id === selectedCategoryId)

    if (!isOpen) return null

    return (
        <>
            {/* Backdrop - Ethereal */}
            <div
                className="fixed inset-0 z-50 bg-slate-900/10 backdrop-blur-md"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal - Ethereal Glass */}
            <div
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-2xl p-6 animate-in rounded-3xl border border-white/60 shadow-xl shadow-blue-900/10"
                style={{
                    boxShadow: selectedCategoryData
                        ? `0 10px 40px -10px ${selectedCategoryData.color_code}30, 0 0 20px ${selectedCategoryData.color_code}10, inset 0 1px 0 rgba(255,255,255,0.8)`
                        : '0 10px 40px -10px rgba(59, 130, 246, 0.15), 0 0 20px rgba(59, 130, 246, 0.05), inset 0 1px 0 rgba(255,255,255,0.8)'
                }}
            >
                {/* Category Aura Glow */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none rounded-3xl transition-all duration-500"
                    style={{
                        background: selectedCategoryData
                            ? `radial-gradient(ellipse at 50% -20%, ${selectedCategoryData.color_code}80, transparent 70%)`
                            : 'radial-gradient(ellipse at 50% -20%, rgba(59, 130, 246, 0.4), transparent 70%)'
                    }}
                />

                {/* Header */}
                <div className="relative mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100/50 shadow-sm">
                            <Calendar className="h-5 w-5 text-indigo-500" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-slate-800">Yeni Plan</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-slate-400 transition-all duration-300 hover:bg-slate-100 hover:text-slate-600 hover:rotate-90"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Category Selection */}
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                            Kategori (opsiyonel)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                        setSelectedCategoryId(
                                            selectedCategoryId === cat.id ? null : cat.id
                                        )
                                    }
                                    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${selectedCategoryId === cat.id
                                        ? 'ring-2 ring-indigo-500/20 shadow-sm transform scale-105'
                                        : 'opacity-70 hover:opacity-100 hover:bg-slate-50'
                                        }`}
                                    style={{
                                        backgroundColor: selectedCategoryId === cat.id ? `${cat.color_code}15` : 'transparent',
                                        color: selectedCategoryId === cat.id ? cat.color_code : '#64748b',
                                        border: selectedCategoryId === cat.id ? `1px solid ${cat.color_code}30` : '1px solid rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <span>{CATEGORY_EMOJIS[cat.slug] || '📌'}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label htmlFor="title" className="mb-2 block text-sm font-semibold text-slate-700">
                            Başlık *
                        </label>
                        <input
                            {...register('title')}
                            id="title"
                            type="text"
                            placeholder="Ne planlıyorsun?"
                            className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        />
                        {errors.title && (
                            <p className="mt-1 text-sm text-red-500 font-medium">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-semibold text-slate-700">
                            Açıklama
                        </label>
                        <textarea
                            {...register('description')}
                            id="description"
                            rows={2}
                            placeholder="Detaylar..."
                            className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm resize-none"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="scheduled_date" className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                Tarih *
                            </label>
                            <input
                                {...register('scheduled_date')}
                                id="scheduled_date"
                                type="date"
                                min={today}
                                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            />
                            {errors.scheduled_date && (
                                <p className="mt-1 text-xs text-red-500 font-medium">{errors.scheduled_date.message}</p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="scheduled_time" className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Clock className="h-4 w-4 text-indigo-500" />
                                Saat *
                            </label>
                            <input
                                {...register('scheduled_time')}
                                id="scheduled_time"
                                type="time"
                                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            />
                            {errors.scheduled_time && (
                                <p className="mt-1 text-xs text-red-500 font-medium">{errors.scheduled_time.message}</p>
                            )}
                        </div>
                    </div>

                    {/* Duration & Reminder */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="duration_min" className="mb-2 block text-sm font-semibold text-slate-700">
                                Süre (dk)
                            </label>
                            <input
                                {...register('duration_min', { valueAsNumber: true })}
                                id="duration_min"
                                type="number"
                                min={5}
                                max={480}
                                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="reminder_min" className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                                <Bell className="h-4 w-4 text-indigo-500" />
                                Hatırlatma
                            </label>
                            <div className="relative">
                                <select
                                    {...register('reminder_min', { valueAsNumber: true })}
                                    id="reminder_min"
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                                >
                                    {REMINDER_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white">
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label htmlFor="recurrence_rule" className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-700">
                            <RefreshCw className="h-4 w-4 text-indigo-500" />
                            Tekrarlama
                        </label>
                        <select
                            {...register('recurrence_rule')}
                            id="recurrence_rule"
                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        >
                            {RECURRENCE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-white">
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit Button - Ethereal */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-6 w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                        style={{
                            background: selectedCategoryData
                                ? `linear-gradient(135deg, ${selectedCategoryData.color_code}, ${selectedCategoryData.color_code}dd)`
                                : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                            boxShadow: selectedCategoryData
                                ? `0 8px 25px -5px ${selectedCategoryData.color_code}50`
                                : '0 8px 25px -5px rgba(99, 102, 241, 0.4)'
                        }}
                    >
                        {isSubmitting ? 'Kaydediliyor...' : 'Plan Oluştur'}
                    </button>
                </form>
            </div>
        </>
    )
}
