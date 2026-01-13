'use client'

import { motion } from 'framer-motion'
import { HeartPulse, Sparkles, AlertCircle } from 'lucide-react'

interface HealthProfileBannerProps {
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
 * Banner shown in GoalCreationWizard Step 2 when food/sport category is selected
 * Shows health metrics if profile exists, or prompts to create one
 */
export default function HealthProfileBanner({
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
                            Sağlık profilinize göre öneriler hazırlanacak.
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

    // No profile - prompt to create one
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
                        Sağlık Profili Gerekli
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                        Bu hedef için kişiselleştirilmiş öneriler sunabilmemiz için sağlık profilinize ihtiyacımız var.
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
