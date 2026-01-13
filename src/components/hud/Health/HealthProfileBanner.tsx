'use client'

import { motion } from 'framer-motion'
import { HeartPulse, Sparkles, AlertCircle, Droplets, Timer, Flame, Activity, Cookie } from 'lucide-react'
import { type GoalContextType } from '@/lib/goalContextTypes'

interface HealthProfileBannerProps {
    /** Goal context type - determines what to display */
    displayMode?: GoalContextType
    /** Whether user has a health profile */
    hasProfile: boolean | null
    /** Loading state */
    isLoading: boolean
    /** User's calculated metrics if profile exists */
    metrics?: {
        bmr_kcal: number
        tdee_kcal: number
        target_daily_kcal: number
    }
    /** Callback when user wants to set up profile */
    onSetupProfile: () => void
}

/**
 * Context-aware banner shown in GoalCreationWizard Step 2
 * Displays different content based on the goal type selected
 */
export default function HealthProfileBanner({
    displayMode = 'generic',
    hasProfile,
    isLoading,
    metrics,
    onSetupProfile
}: HealthProfileBannerProps) {
    if (isLoading) {
        return (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                </div>
            </div>
        )
    }

    // Render based on display mode
    switch (displayMode) {
        case 'calorie_deficit':
        case 'calorie_surplus':
            return renderCalorieContext(hasProfile, metrics, onSetupProfile, displayMode)

        case 'sugar_reduction':
            return renderSugarContext()

        case 'hydration':
            return renderHydrationContext()

        case 'fasting':
            return renderFastingContext()

        case 'activity':
            return renderActivityContext()

        case 'streak_based':
            return renderStreakContext()

        case 'generic':
        default:
            return renderGenericContext()
    }
}

// =====================================================
// Calorie Context (Weight Loss / Muscle Gain)
// =====================================================

function renderCalorieContext(
    hasProfile: boolean | null,
    metrics: HealthProfileBannerProps['metrics'],
    onSetupProfile: () => void,
    mode: 'calorie_deficit' | 'calorie_surplus'
) {
    // Profile exists - show personalized metrics
    if (hasProfile && metrics) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200"
            >
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 
                                  flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-emerald-800 mb-1">
                            Kişiselleştirilmiş Hedef 🎯
                        </h4>
                        <p className="text-sm text-emerald-700 mb-3">
                            {mode === 'calorie_deficit'
                                ? 'Kalori açığı hesaplaması sağlık profilinize göre yapıldı.'
                                : 'Kalori fazlası hedefi sağlık profilinize göre ayarlandı.'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-white/60 rounded-xl">
                                <p className="text-xs text-slate-500">BMR</p>
                                <p className="font-bold text-emerald-700">{metrics.bmr_kcal}</p>
                                <p className="text-[10px] text-slate-400">kcal</p>
                            </div>
                            <div className="text-center p-2 bg-white/60 rounded-xl">
                                <p className="text-xs text-slate-500">TDEE</p>
                                <p className="font-bold text-teal-700">{metrics.tdee_kcal}</p>
                                <p className="text-[10px] text-slate-400">kcal</p>
                            </div>
                            <div className="text-center p-2 bg-white/60 rounded-xl">
                                <p className="text-xs text-slate-500">Hedef</p>
                                <p className="font-bold text-indigo-700">{metrics.target_daily_kcal}</p>
                                <p className="text-[10px] text-slate-400">kcal</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    // No profile - prompt to create one (only for calorie-based goals)
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 
                              flex items-center justify-center flex-shrink-0">
                    <HeartPulse className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Sağlık Profili Önerilir
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                        {mode === 'calorie_deficit'
                            ? 'Kilo verme hedefin için kişiselleştirilmiş kalori hesaplaması yapabilmemiz için profilini oluştur.'
                            : 'Kas yapma hedefin için doğru kalori ve protein hedefi belirleyebilmemiz için profil gerekli.'}
                    </p>
                    <button
                        onClick={onSetupProfile}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 
                                 text-white font-semibold text-sm shadow-lg shadow-amber-500/30
                                 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                    >
                        Profil Oluştur (2 dk)
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Sugar Reduction Context
// =====================================================

function renderSugarContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 
                              flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-pink-800 mb-1">
                        Şeker Azaltma Hedefi 🚫🍬
                    </h4>
                    <p className="text-sm text-pink-700 mb-3">
                        Rafine şeker tüketimini azaltmak sağlığını önemli ölçüde iyileştirir.
                    </p>
                    <div className="space-y-2 text-xs text-pink-600">
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                            <span>🎯</span>
                            <span><strong>Önerilen:</strong> Günde 25g'ın altında eklenmiş şeker</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                            <span>💡</span>
                            <span><strong>İpucu:</strong> Etiketleri oku, gizli şekerlere dikkat et</span>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white/60 rounded-lg">
                            <span>🍎</span>
                            <span><strong>Alternatif:</strong> Tatlı ihtiyacı için meyve tercih et</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Hydration Context
// =====================================================

function renderHydrationContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 
                              flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-cyan-800 mb-1">
                        Hidrasyon Hedefi 💧
                    </h4>
                    <p className="text-sm text-cyan-700 mb-3">
                        Yeterli su içmek enerji seviyeni ve metabolizmanı yükseltir.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-3 bg-white/60 rounded-xl">
                            <p className="text-xs text-slate-500">Günlük Hedef</p>
                            <p className="text-2xl font-bold text-cyan-700">2-3L</p>
                            <p className="text-[10px] text-slate-400">8-12 bardak</p>
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-xl">
                            <p className="text-xs text-slate-500">Sabah Önerisi</p>
                            <p className="text-2xl font-bold text-blue-700">0.5L</p>
                            <p className="text-[10px] text-slate-400">uyanır uyanmaz</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Fasting Context
// =====================================================

function renderFastingContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 
                              flex items-center justify-center flex-shrink-0">
                    <Timer className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-violet-800 mb-1">
                        Aralıklı Oruç Hedefi ⏰
                    </h4>
                    <p className="text-sm text-violet-700 mb-3">
                        Yeme penceresini kısıtlayarak metabolizmayı optimize et.
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg text-sm">
                            <span className="font-medium text-violet-700">🌟 Başlangıç</span>
                            <span className="text-slate-600">16:8 (16 saat oruç, 8 saat yeme)</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg text-sm">
                            <span className="font-medium text-violet-700">💪 Orta</span>
                            <span className="text-slate-600">18:6 veya 20:4</span>
                        </div>
                        <p className="text-xs text-violet-500 mt-2">
                            💡 Oruç sırasında su, şekersiz çay/kahve içebilirsin
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Activity Context (Steps, Workouts)
// =====================================================

function renderActivityContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 
                              flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-green-800 mb-1">
                        Aktivite Hedefi 🏃
                    </h4>
                    <p className="text-sm text-green-700 mb-2">
                        Düzenli fiziksel aktivite sağlığın için kritik öneme sahip.
                    </p>
                    <div className="p-3 bg-white/60 rounded-xl">
                        <p className="text-xs text-slate-500 mb-1">💡 Tutarlılık &gt; Yoğunluk</p>
                        <p className="text-sm text-green-600">
                            Her gün küçük adımlar, büyük sonuçlar getirir. Başlamak bitirmekten önemli!
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Streak-Based Context (Day counting goals)
// =====================================================

function renderStreakContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 
                              flex items-center justify-center flex-shrink-0">
                    <Flame className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-amber-800 mb-1">
                        Alışkanlık Oluştur 🔥
                    </h4>
                    <p className="text-sm text-amber-700 mb-2">
                        21 gün yap, alışkanlık olsun. 66 gün yap, hayat tarzı olsun.
                    </p>
                    <div className="flex gap-2">
                        <div className="flex-1 text-center p-2 bg-white/60 rounded-lg">
                            <p className="text-lg font-bold text-amber-600">21</p>
                            <p className="text-[10px] text-slate-500">Alışkanlık başlangıcı</p>
                        </div>
                        <div className="flex-1 text-center p-2 bg-white/60 rounded-lg">
                            <p className="text-lg font-bold text-orange-600">66</p>
                            <p className="text-[10px] text-slate-500">Kalıcı değişim</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// =====================================================
// Generic Context (Fallback)
// =====================================================

function renderGenericContext() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200"
        >
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-500 to-gray-600 
                              flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 mb-1">
                        Hedefe Odaklan 🎯
                    </h4>
                    <p className="text-sm text-slate-600">
                        Net bir hedef belirledin. Şimdi küçük adımlarla ilerle!
                    </p>
                </div>
            </div>
        </motion.div>
    )
}
