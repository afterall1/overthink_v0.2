'use client'

import { useState } from 'react'
import { Settings, User, Pencil } from 'lucide-react'
import { useHealthProfile } from '@/hooks/useHealthProfile'
import HealthProfileWizard from './HealthProfileWizard'
import { clsx } from 'clsx'

interface ProfileEditButtonProps {
    /** Button display variant */
    variant?: 'icon' | 'full' | 'compact'
    /** Additional CSS classes */
    className?: string
    /** Callback after profile is updated */
    onProfileUpdated?: () => void
}

/**
 * Reusable button to edit the user's health profile
 * Opens HealthProfileWizard in edit mode with pre-filled data
 */
export default function ProfileEditButton({
    variant = 'full',
    className,
    onProfileUpdated
}: ProfileEditButtonProps) {
    const { hasProfile, profile, isLoading, refresh } = useHealthProfile()
    const [isOpen, setIsOpen] = useState(false)

    const handleComplete = async () => {
        setIsOpen(false)
        await refresh()
        onProfileUpdated?.()
    }

    // Don't render while loading
    if (isLoading) {
        return (
            <div className={clsx(
                'animate-pulse bg-slate-100 rounded-xl',
                variant === 'icon' ? 'w-10 h-10' : 'h-11 w-32',
                className
            )} />
        )
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={clsx(
                    'transition-all',
                    variant === 'icon' && 'p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600',
                    variant === 'full' && 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium flex items-center gap-2 hover:shadow-lg',
                    variant === 'compact' && 'px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium flex items-center gap-1.5 hover:bg-emerald-100 border border-emerald-200',
                    className
                )}
            >
                {variant === 'icon' ? (
                    <Settings className="w-5 h-5" />
                ) : (
                    <>
                        {hasProfile ? (
                            <>
                                <Pencil className="w-4 h-4" />
                                {variant === 'full' && 'Profili Düzenle'}
                                {variant === 'compact' && 'Düzenle'}
                            </>
                        ) : (
                            <>
                                <User className="w-4 h-4" />
                                {variant === 'full' && 'Profil Oluştur'}
                                {variant === 'compact' && 'Oluştur'}
                            </>
                        )}
                    </>
                )}
            </button>

            <HealthProfileWizard
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                isEditMode={!!hasProfile}
                initialData={profile ? {
                    weight_kg: profile.weight_kg,
                    height_cm: profile.height_cm,
                    birth_date: profile.birth_date ?? '',
                    biological_sex: profile.biological_sex as 'male' | 'female',
                    activity_level: profile.activity_level,
                    primary_goal: profile.primary_goal,
                    target_weight_kg: profile.target_weight_kg,
                    goal_pace: profile.goal_pace,
                    health_conditions: profile.health_conditions ?? [],
                    dietary_restrictions: profile.dietary_restrictions ?? [],
                    allergies: profile.allergies ?? []
                } : undefined}
                onComplete={handleComplete}
            />
        </>
    )
}
