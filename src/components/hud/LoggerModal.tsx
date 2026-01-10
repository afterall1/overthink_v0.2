'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    X, Plus, TrendingUp, Utensils, Dumbbell,
    Code2, ShoppingBag, Gamepad2, Smile
} from 'lucide-react'
import { CategorySlug } from '@/types/database.types'
import {
    categorySchemas,
    TradeFormData, FoodFormData, SportFormData,
    DevFormData, EtsyFormData, GamingFormData
} from './form-schemas'

interface LoggerModalProps {
    onSubmit: (category: CategorySlug, data: Record<string, unknown>, sentiment: number) => void
}

const CATEGORIES = [
    { slug: 'trade' as const, name: 'Trade', icon: TrendingUp, color: '#F59E0B' },
    { slug: 'food' as const, name: 'Food', icon: Utensils, color: '#10B981' },
    { slug: 'sport' as const, name: 'Sport', icon: Dumbbell, color: '#3B82F6' },
    { slug: 'dev' as const, name: 'Dev', icon: Code2, color: '#8B5CF6' },
    { slug: 'etsy' as const, name: 'Etsy', icon: ShoppingBag, color: '#EC4899' },
    { slug: 'gaming' as const, name: 'Gaming', icon: Gamepad2, color: '#EF4444' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TradeForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Pair</label>
                    <input {...register('pair')} placeholder="BTC/USDT" className="hud-input" />
                    {errors.pair && <span className="text-red-400 text-xs">{errors.pair.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Side</label>
                    <select {...register('side')} className="hud-input">
                        <option value="long">Long</option>
                        <option value="short">Short</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Entry</label>
                    <input {...register('entry', { valueAsNumber: true })} type="number" step="0.01" className="hud-input" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">PnL ($)</label>
                    <input {...register('pnl', { valueAsNumber: true })} type="number" step="0.01" className="hud-input" />
                    {errors.pnl && <span className="text-red-400 text-xs">{errors.pnl.message}</span>}
                </div>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FoodForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Öğün</label>
                <select {...register('meal_type')} className="hud-input">
                    <option value="breakfast">Kahvaltı</option>
                    <option value="lunch">Öğle</option>
                    <option value="dinner">Akşam</option>
                    <option value="snack">Atıştırmalık</option>
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Kalori</label>
                    <input {...register('calories', { valueAsNumber: true })} type="number" className="hud-input" />
                    {errors.calories && <span className="text-red-400 text-xs">{errors.calories.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Protein (g)</label>
                    <input {...register('protein', { valueAsNumber: true })} type="number" className="hud-input" />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Yemekler</label>
                <input {...register('foods')} placeholder="Tavuk, pilav..." className="hud-input" />
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SportForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Aktivite</label>
                <input {...register('activity')} placeholder="Koşu, Ağırlık..." className="hud-input" />
                {errors.activity && <span className="text-red-400 text-xs">{errors.activity.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className="hud-input" />
                    {errors.duration_min && <span className="text-red-400 text-xs">{errors.duration_min.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Yakılan Kalori</label>
                    <input {...register('calories_burned', { valueAsNumber: true })} type="number" className="hud-input" />
                </div>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DevForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Proje</label>
                    <input {...register('project')} placeholder="LifeNexus" className="hud-input" />
                    {errors.project && <span className="text-red-400 text-xs">{errors.project.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Dil</label>
                    <input {...register('language')} placeholder="TypeScript" className="hud-input" />
                </div>
            </div>
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Task</label>
                <input {...register('task')} placeholder="API geliştirme" className="hud-input" />
                {errors.task && <span className="text-red-400 text-xs">{errors.task.message}</span>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className="hud-input" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Commit Sayısı</label>
                    <input {...register('commits', { valueAsNumber: true })} type="number" className="hud-input" />
                </div>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EtsyForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs text-gray-400 mb-1 block">Ürün</label>
                <input {...register('product')} placeholder="El yapımı kolye" className="hud-input" />
                {errors.product && <span className="text-red-400 text-xs">{errors.product.message}</span>}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Gelir ($)</label>
                    <input {...register('revenue', { valueAsNumber: true })} type="number" step="0.01" className="hud-input" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Maliyet ($)</label>
                    <input {...register('cost', { valueAsNumber: true })} type="number" step="0.01" className="hud-input" />
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Kar ($)</label>
                    <input {...register('profit', { valueAsNumber: true })} type="number" step="0.01" className="hud-input" />
                </div>
            </div>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GamingForm({ register, errors }: { register: any, errors: any }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Oyun</label>
                    <input {...register('game')} placeholder="Elden Ring" className="hud-input" />
                    {errors.game && <span className="text-red-400 text-xs">{errors.game.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Platform</label>
                    <select {...register('platform')} className="hud-input">
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
                    <label className="text-xs text-gray-400 mb-1 block">Süre (dk)</label>
                    <input {...register('duration_min', { valueAsNumber: true })} type="number" className="hud-input" />
                    {errors.duration_min && <span className="text-red-400 text-xs">{errors.duration_min.message}</span>}
                </div>
                <div>
                    <label className="text-xs text-gray-400 mb-1 block">Başarı</label>
                    <input {...register('achievement')} placeholder="Boss yenildi" className="hud-input" />
                </div>
            </div>
        </div>
    )
}

export default function LoggerModal({ onSubmit }: LoggerModalProps) {
    const [isOpen, setIsOpen] = useState(false)
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
        setIsOpen(false)
        setSelectedCategory(null)
        reset()
        setSentiment(5)
    }

    const currentCategoryData = CATEGORIES.find(c => c.slug === selectedCategory)

    return (
        <>
            {/* FAB Button */}
            {/* FAB Button - Ethereal */}
            <button
                onClick={() => setIsOpen(true)}
                className="group fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 
                   flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300
                   border border-purple-400/30"
                style={{ boxShadow: '0 0 40px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}
            >
                <Plus className="w-8 h-8 text-white transition-transform duration-300 group-hover:rotate-90" />
                {/* Outer glow ring */}
                <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop - Ethereal */}
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={() => { setIsOpen(false); setSelectedCategory(null) }}
                    />

                    {/* Modal Content - Ethereal Glass */}
                    <div
                        className="relative w-full max-w-lg ethereal-glass overflow-hidden animate-in"
                        style={{
                            boxShadow: currentCategoryData
                                ? `0 8px 32px rgba(0,0,0,0.4), 0 0 60px ${currentCategoryData.color}25`
                                : '0 8px 32px rgba(0,0,0,0.4), 0 0 60px rgba(139, 92, 246, 0.15)'
                        }}
                    >
                        {/* Category Aura Glow */}
                        <div
                            className="absolute inset-0 opacity-40 pointer-events-none rounded-3xl transition-all duration-500"
                            style={{
                                background: currentCategoryData
                                    ? `radial-gradient(ellipse at 50% -20%, ${currentCategoryData.color}50, transparent 60%)`
                                    : 'radial-gradient(ellipse at 50% -20%, rgba(139, 92, 246, 0.3), transparent 60%)'
                            }}
                        />
                        {/* Inner top highlight */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* Header */}
                        <div className="relative flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-lg font-semibold text-white">
                                {selectedCategory ? `${currentCategoryData?.name} Log` : 'Yeni Log Ekle'}
                            </h2>
                            <button
                                onClick={() => { setIsOpen(false); setSelectedCategory(null) }}
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="relative p-4">
                            {!selectedCategory ? (
                                // Category Selection
                                <div className="grid grid-cols-3 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.slug}
                                            onClick={() => handleCategorySelect(cat.slug)}
                                            className="group relative p-4 rounded-2xl border border-white/5 
                                                       bg-white/[0.02] hover:bg-white/[0.06] transition-all duration-300
                                                       hover:border-white/10 hover:-translate-y-0.5"
                                        >
                                            {/* Hover glow */}
                                            <div
                                                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.1), 0 8px 24px ${cat.color}20` }}
                                            />
                                            <cat.icon
                                                className="w-8 h-8 mx-auto mb-2 transition-all duration-300 group-hover:scale-110"
                                                style={{ color: cat.color }}
                                            />
                                            <p className="relative text-sm text-gray-400 group-hover:text-white transition-colors">{cat.name}</p>
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
                                        className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        ← Geri
                                    </button>

                                    {/* Category-specific form */}
                                    {selectedCategory === 'trade' && <TradeForm register={register} errors={errors} />}
                                    {selectedCategory === 'food' && <FoodForm register={register} errors={errors} />}
                                    {selectedCategory === 'sport' && <SportForm register={register} errors={errors} />}
                                    {selectedCategory === 'dev' && <DevForm register={register} errors={errors} />}
                                    {selectedCategory === 'etsy' && <EtsyForm register={register} errors={errors} />}
                                    {selectedCategory === 'gaming' && <GamingForm register={register} errors={errors} />}

                                    {/* Sentiment */}
                                    <div>
                                        <label className="text-xs text-gray-400 mb-2 block flex items-center gap-2">
                                            <Smile className="w-4 h-4" />
                                            Nasıl hissediyorsun? ({sentiment}/10)
                                        </label>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={sentiment}
                                            onChange={(e) => setSentiment(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                        />
                                        <div className="flex justify-between text-xs text-gray-600 mt-1">
                                            <span>😔</span>
                                            <span>😐</span>
                                            <span>😊</span>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        className="w-full py-3 rounded-xl font-medium text-white transition-all duration-300
                               hover:scale-[1.02] active:scale-[0.98]"
                                        style={{
                                            background: `linear-gradient(135deg, ${currentCategoryData?.color}, ${currentCategoryData?.color}cc)`,
                                            boxShadow: `0 4px 20px ${currentCategoryData?.color}40`
                                        }}
                                    >
                                        Kaydet
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
