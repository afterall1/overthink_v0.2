'use client'

import { useState } from 'react'
import { useForm, UseFormRegister, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    X, TrendingUp, Utensils, Dumbbell,
    Code2, ShoppingBag, Gamepad2, Smile
} from 'lucide-react'
import { CategorySlug } from '@/types/database.types'
import {
    categorySchemas,
    TradeFormData, FoodFormData, SportFormData,
    DevFormData, EtsyFormData, GamingFormData
} from './form-schemas'

const CATEGORIES = [
    { slug: 'trade' as const, name: 'Trade', icon: TrendingUp, color: '#F59E0B' },
    { slug: 'food' as const, name: 'Food', icon: Utensils, color: '#10B981' },
    { slug: 'sport' as const, name: 'Sport', icon: Dumbbell, color: '#3B82F6' },
    { slug: 'dev' as const, name: 'Dev', icon: Code2, color: '#8B5CF6' },
    { slug: 'etsy' as const, name: 'Etsy', icon: ShoppingBag, color: '#EC4899' },
    { slug: 'gaming' as const, name: 'Gaming', icon: Gamepad2, color: '#EF4444' },
]

const inputClasses = "w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
const labelClasses = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block"

// Type-safe form props interfaces
interface FormFieldsProps<T extends Record<string, unknown>> {
    register: UseFormRegister<T>
    errors: FieldErrors<T>
}

function TradeForm({ register, errors }: FormFieldsProps<TradeFormData>) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Pair</label>
                    <input {...register('pair')} placeholder="BTC/USDT" className={inputClasses} />
                    {errors.pair && <span className="text-red-500 text-xs font-medium mt-1">{errors.pair.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Side</label>
                    <select {...register('side')} className={inputClasses}>
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Entry</label>
                    <input {...register('entry', { valueAsNumber: true })} type="number" step="0.01" className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>PnL ($)</label>
                    <input {...register('pnl', { valueAsNumber: true })} type="number" step="0.01" className={inputClasses} />
                    {errors.pnl && <span className="text-red-500 text-xs font-medium mt-1">{errors.pnl.message}</span>}
                </div>
            </div>
        </div>
    )
}

function FoodForm({ register, errors }: FormFieldsProps<FoodFormData>) {
    return (
        <div className="space-y-4">
            <div>
                <label className={labelClasses}>Öğün</label>
                <select {...register('meal_type')} className={inputClasses}>
                    <option value="breakfast">Kahvaltı</option>
                    <option value="lunch">Öğle</option>
                    <option value="dinner">Akşam</option>
                    <option value="snack">Atıştırmalık</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Kalori</label>
                    <input {...register('calories', { valueAsNumber: true })} type="number" className={inputClasses} />
                    {errors.calories && <span className="text-red-500 text-xs font-medium mt-1">{errors.calories.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Protein (g)</label>
                    <input {...register('protein', { valueAsNumber: true })} type="number" className={inputClasses} />
                </div>
            </div>
            <div>
                <label className={labelClasses}>Yemekler</label>
                <input {...register('foods')} placeholder="Tavuk, pilav..." className={inputClasses} />
            </div>
        </div>
    )
}

function SportForm({ register, errors }: FormFieldsProps<SportFormData>) {
    return (
        <div className="space-y-4">
            <div>
                <label className={labelClasses}>Aktivite</label>
                <input {...register('activity')} placeholder="Koşu, Ağırlık..." className={inputClasses} />
                {errors.activity && <span className="text-red-500 text-xs font-medium mt-1">{errors.activity.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className={inputClasses} />
                    {errors.duration_min && <span className="text-red-500 text-xs font-medium mt-1">{errors.duration_min.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Yakılan Kalori</label>
                    <input {...register('calories_burned', { valueAsNumber: true })} type="number" className={inputClasses} />
                </div>
            </div>
        </div>
    )
}

function DevForm({ register, errors }: FormFieldsProps<DevFormData>) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Proje</label>
                    <input {...register('project')} placeholder="LifeNexus" className={inputClasses} />
                    {errors.project && <span className="text-red-500 text-xs font-medium mt-1">{errors.project.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Dil</label>
                    <input {...register('language')} placeholder="TypeScript" className={inputClasses} />
                </div>
            </div>
            <div>
                <label className={labelClasses}>Task</label>
                <input {...register('task')} placeholder="API geliştirme" className={inputClasses} />
                {errors.task && <span className="text-red-500 text-xs font-medium mt-1">{errors.task.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Commit Sayısı</label>
                    <input {...register('commits', { valueAsNumber: true })} type="number" className={inputClasses} />
                </div>
            </div>
        </div>
    )
}

function EtsyForm({ register, errors }: FormFieldsProps<EtsyFormData>) {
    return (
        <div className="space-y-4">
            <div>
                <label className={labelClasses}>Ürün</label>
                <input {...register('product')} placeholder="El yapımı kolye" className={inputClasses} />
                {errors.product && <span className="text-red-500 text-xs font-medium mt-1">{errors.product.message}</span>}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className={labelClasses}>Gelir ($)</label>
                    <input {...register('revenue', { valueAsNumber: true })} type="number" step="0.01" className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Maliyet ($)</label>
                    <input {...register('cost', { valueAsNumber: true })} type="number" step="0.01" className={inputClasses} />
                </div>
                <div>
                    <label className={labelClasses}>Kar ($)</label>
                    <input {...register('profit', { valueAsNumber: true })} type="number" step="0.01" className={inputClasses} />
                </div>
            </div>
        </div>
    )
}

function GamingForm({ register, errors }: FormFieldsProps<GamingFormData>) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Oyun</label>
                    <input {...register('game')} placeholder="Elden Ring" className={inputClasses} />
                    {errors.game && <span className="text-red-500 text-xs font-medium mt-1">{errors.game.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Platform</label>
                    <select {...register('platform')} className={inputClasses}>
                        <option value="">Seçiniz</option>
                        <option value="PC">PC</option>
                        <option value="PS5">PS5</option>
                        <option value="Xbox">Xbox</option>
                        <option value="Switch">Switch</option>
                        <option value="Mobile">Mobile</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClasses}>Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className={inputClasses} />
                    {errors.duration_min && <span className="text-red-500 text-xs font-medium mt-1">{errors.duration_min.message}</span>}
                </div>
                <div>
                    <label className={labelClasses}>Başarı</label>
                    <input {...register('achievement')} placeholder="Boss yenildi" className={inputClasses} />
                </div>
            </div>
        </div>
    )
}

interface LoggerModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (category: CategorySlug, data: Record<string, unknown>, sentiment: number) => void
}

export default function LoggerModal({ isOpen, onClose, onSubmit }: LoggerModalProps) {
    const [selectedCategory, setSelectedCategory] = useState<CategorySlug | null>(null)
    const [sentiment, setSentiment] = useState(5)

    const currentSchema = selectedCategory ? categorySchemas[selectedCategory] : null

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: currentSchema ? zodResolver(currentSchema) : undefined,
    })

    const handleCategorySelect = (slug: CategorySlug) => {
        setSelectedCategory(slug)
        reset()
    }

    const onFormSubmit = (data: Record<string, unknown>) => {
        if (!selectedCategory) return
        onSubmit(selectedCategory, data, sentiment)
        onClose()
        setSelectedCategory(null)
        reset()
        setSentiment(5)
    }

    const currentCategoryData = CATEGORIES.find(c => c.slug === selectedCategory)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop - Ethereal Light */}
            <div
                className="absolute inset-0 bg-slate-900/10 backdrop-blur-md"
                onClick={() => { onClose(); setSelectedCategory(null) }}
            />

            {/* Modal Content - Ethereal Glass */}
            <div
                className="relative w-full max-w-lg bg-white/90 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in duration-300 rounded-3xl border border-white/60"
                style={{
                    boxShadow: currentCategoryData
                        ? `0 20px 50px -10px ${currentCategoryData.color}30, 0 0 30px ${currentCategoryData.color}10`
                        : '0 20px 50px -10px rgba(99, 102, 241, 0.2), 0 0 30px rgba(99, 102, 241, 0.05)'
                }}
            >
                {/* Category Aura Glow */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-500"
                    style={{
                        background: currentCategoryData
                            ? `radial-gradient(circle at 50% 0%, ${currentCategoryData.color}80, transparent 70%)`
                            : 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.4), transparent 70%)'
                    }}
                />

                {/* Header */}
                <div className="relative flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        {selectedCategory ? `${currentCategoryData?.name} Log` : 'Yeni Log Ekle'}
                    </h2>
                    <button
                        onClick={() => { onClose(); setSelectedCategory(null) }}
                        className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="relative p-6">
                    {!selectedCategory ? (
                        // Category Selection
                        <div className="grid grid-cols-3 gap-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.slug}
                                    onClick={() => handleCategorySelect(cat.slug)}
                                    className="group relative p-4 rounded-2xl border border-slate-100 
                                               bg-white shadow-sm hover:shadow-md transition-all duration-300
                                               hover:border-indigo-100 hover:-translate-y-1"
                                >
                                    <div
                                        className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                                        style={{ backgroundColor: `${cat.color}15` }}
                                    >
                                        <cat.icon
                                            className="w-6 h-6"
                                            style={{ color: cat.color }}
                                        />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{cat.name}</p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        // Dynamic Form
                        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
                            {/* Back button */}
                            <button
                                type="button"
                                onClick={() => setSelectedCategory(null)}
                                className="text-sm font-medium text-indigo-500 hover:text-indigo-600 flex items-center gap-1 -mt-2"
                            >
                                ← Geri
                            </button>

                            {/* Category-specific form with type assertions for dynamic schema */}
                            <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                                {selectedCategory === 'trade' && <TradeForm register={register as unknown as UseFormRegister<TradeFormData>} errors={errors as unknown as FieldErrors<TradeFormData>} />}
                                {selectedCategory === 'food' && <FoodForm register={register as unknown as UseFormRegister<FoodFormData>} errors={errors as unknown as FieldErrors<FoodFormData>} />}
                                {selectedCategory === 'sport' && <SportForm register={register as unknown as UseFormRegister<SportFormData>} errors={errors as unknown as FieldErrors<SportFormData>} />}
                                {selectedCategory === 'dev' && <DevForm register={register as unknown as UseFormRegister<DevFormData>} errors={errors as unknown as FieldErrors<DevFormData>} />}
                                {selectedCategory === 'etsy' && <EtsyForm register={register as unknown as UseFormRegister<EtsyFormData>} errors={errors as unknown as FieldErrors<EtsyFormData>} />}
                                {selectedCategory === 'gaming' && <GamingForm register={register as unknown as UseFormRegister<GamingFormData>} errors={errors as unknown as FieldErrors<GamingFormData>} />}
                            </div>

                            {/* Sentiment */}
                            <div>
                                <label className={labelClasses + " flex items-center gap-2"}>
                                    <Smile className="w-4 h-4 text-amber-500" />
                                    Nasıl hissediyorsun? ({sentiment}/10)
                                </label>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={sentiment}
                                        onChange={(e) => setSentiment(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                    />
                                    <div className="flex justify-between text-xs font-medium text-slate-400 mt-2">
                                        <span>😔 Kötü</span>
                                        <span>😐 Nötr</span>
                                        <span>😊 Harika</span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300
                        hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                                style={{
                                    background: `linear-gradient(135deg, ${currentCategoryData?.color}, ${currentCategoryData?.color}dd)`,
                                    boxShadow: `0 8px 20px -4px ${currentCategoryData?.color}50`
                                }}
                            >
                                Log Kaydet
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
