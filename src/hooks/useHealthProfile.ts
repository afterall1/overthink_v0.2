'use client'

import { useState, useEffect, useCallback } from 'react'
import { getHealthProfile, type HealthProfileResult } from '@/actions/aiHealthQuests'

// Extract the profile type from the result
type HealthProfileData = NonNullable<HealthProfileResult['profile']>

interface UseHealthProfileReturn {
    /** Whether profile exists - null while loading */
    hasProfile: boolean | null
    /** The health profile data if exists */
    profile: HealthProfileData | null
    /** Loading state */
    isLoading: boolean
    /** Error message if any */
    error: string | null
    /** Refresh profile data */
    refresh: () => Promise<void>
}

/**
 * Custom hook to check and manage user health profile status
 * Used by GoalCreationWizard to determine if health profile step is needed
 */
export function useHealthProfile(): UseHealthProfileReturn {
    const [hasProfile, setHasProfile] = useState<boolean | null>(null)
    const [profile, setProfile] = useState<HealthProfileData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchProfile = useCallback(async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await getHealthProfile()

            if (result.success && result.profile) {
                setHasProfile(true)
                setProfile(result.profile)
            } else {
                setHasProfile(false)
                setProfile(null)
            }
        } catch (err) {
            console.error('[useHealthProfile] Error:', err)
            setError(err instanceof Error ? err.message : 'Profil yüklenemedi')
            setHasProfile(false)
            setProfile(null)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProfile()
    }, [fetchProfile])

    return {
        hasProfile,
        profile,
        isLoading,
        error,
        refresh: fetchProfile
    }
}

export default useHealthProfile
