'use server'

import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { startOfDay, endOfDay, format } from 'date-fns'

// =====================================================
// Types
// =====================================================

interface MealEntry {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
    calories: number
    time: string
    foods?: string
}

interface QuestContribution {
    id: string
    title: string
    calorie_impact: number
    completed_at: string
}

export interface DailyCalorieStatus {
    // Target from health profile
    targetCalories: number
    tdee: number
    bmr: number

    // Consumed today (from food logs)
    consumedCalories: number

    // Quest contributions (calorie_impact from completed quests)
    questCalorieImpact: number  // negative = burned/saved, positive = consumed

    // Net calculation
    // For weight loss: remaining = target - consumed + |burned|
    netCalories: number
    remainingCalories: number

    // Breakdown
    meals: MealEntry[]
    quests: QuestContribution[]

    // Status
    isOnTrack: boolean
    percentageUsed: number
    statusMessage: string
    statusType: 'success' | 'warning' | 'danger' | 'neutral'
}

interface DailyCalorieStatusResult {
    success: boolean
    data?: DailyCalorieStatus
    error?: string
}

// =====================================================
// Main Function
// =====================================================

/**
 * Get daily calorie status for a specific date
 * Aggregates data from health profile, food logs, and completed quests
 */
export async function getDailyCalorieStatus(
    date?: string,
    goalId?: string
): Promise<DailyCalorieStatusResult> {
    try {
        const { client, user } = await getAuthenticatedClient()

        // Use provided date or today
        const targetDate = date ? new Date(date) : new Date()
        const dayStart = startOfDay(targetDate).toISOString()
        const dayEnd = endOfDay(targetDate).toISOString()

        // 1. Get health profile for target calories
        const { data: healthProfile, error: profileError } = await client
            .from('user_health_profiles')
            .select('target_daily_kcal, tdee_kcal, bmr_kcal, primary_goal')
            .eq('user_id', user.id)
            .single()

        if (profileError || !healthProfile) {
            return {
                success: false,
                error: 'Sağlık profili bulunamadı. Lütfen önce profilinizi oluşturun.'
            }
        }

        const targetCalories = healthProfile.target_daily_kcal ?? 2000
        const tdee = healthProfile.tdee_kcal ?? 2200
        const bmr = healthProfile.bmr_kcal ?? 1600
        const primaryGoal = healthProfile.primary_goal ?? 'maintenance'

        // 2. Get food logs for the day
        const { data: foodCategory } = await client
            .from('categories')
            .select('id')
            .eq('slug', 'food')
            .single()

        let meals: MealEntry[] = []
        let consumedCalories = 0

        if (foodCategory) {
            const { data: foodLogs } = await client
                .from('logs')
                .select('data, logged_at')
                .eq('user_id', user.id)
                .eq('category_id', foodCategory.id)
                .gte('logged_at', dayStart)
                .lte('logged_at', dayEnd)
                .order('logged_at', { ascending: true })

            if (foodLogs && foodLogs.length > 0) {
                meals = foodLogs.map(log => {
                    const data = log.data as Record<string, unknown>
                    const calories = typeof data.calories === 'number' ? data.calories : 0
                    consumedCalories += calories

                    return {
                        type: (data.meal_type as MealEntry['type']) ?? 'snack',
                        calories,
                        time: format(new Date(log.logged_at), 'HH:mm'),
                        foods: typeof data.foods === 'string' ? data.foods : undefined
                    }
                })
            }
        }

        // 3. Get completed quests for today
        // Note: calorie_impact is not stored in DB, only computed at quest creation time
        let questQuery = client
            .from('daily_quests')
            .select('id, title, completed_at')
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .gte('completed_at', dayStart)
            .lte('completed_at', dayEnd)

        // Filter by goal if provided
        if (goalId) {
            questQuery = questQuery.eq('goal_id', goalId)
        }

        const { data: completedQuests } = await questQuery

        // calorie_impact is computed at runtime, not stored in DB
        // Actual calorie tracking comes from food logs
        const questCalorieImpact = 0
        const quests: QuestContribution[] = completedQuests?.map(quest => ({
            id: quest.id,
            title: quest.title,
            calorie_impact: 0,
            completed_at: quest.completed_at ?? ''
        })) ?? []

        // 4. Calculate net and remaining calories
        // For weight loss (deficit): quests have negative impact (burned calories)
        // Net = consumed - |questImpact| (if quest burns calories)
        // Remaining = target - net

        // questCalorieImpact: negative means burned, positive means gained
        const burnedFromQuests = questCalorieImpact < 0 ? Math.abs(questCalorieImpact) : 0
        const netCalories = consumedCalories - burnedFromQuests
        const remainingCalories = targetCalories - netCalories

        // 5. Determine status
        const percentageUsed = targetCalories > 0
            ? Math.round((netCalories / targetCalories) * 100)
            : 0

        let statusMessage: string
        let statusType: DailyCalorieStatus['statusType']
        let isOnTrack: boolean

        if (percentageUsed <= 80) {
            statusMessage = 'Harika gidiyorsun! Bütçende kalori kaldı.'
            statusType = 'success'
            isOnTrack = true
        } else if (percentageUsed <= 100) {
            statusMessage = 'Hedefe yaklaşıyorsun!'
            statusType = 'warning'
            isOnTrack = true
        } else if (percentageUsed <= 120) {
            statusMessage = 'Günlük hedefi biraz aştın.'
            statusType = 'warning'
            isOnTrack = false
        } else {
            statusMessage = 'Bugün hedefi aştın. Yarın yeni bir gün!'
            statusType = 'danger'
            isOnTrack = false
        }

        // Adjust message for weight gain goals
        if (primaryGoal === 'weight_gain' || primaryGoal === 'muscle_gain') {
            if (percentageUsed >= 90 && percentageUsed <= 110) {
                statusMessage = 'Mükemmel! Kalori hedefine ulaştın.'
                statusType = 'success'
                isOnTrack = true
            } else if (percentageUsed < 90) {
                statusMessage = 'Daha fazla yemen gerekiyor!'
                statusType = 'warning'
                isOnTrack = false
            }
        }

        return {
            success: true,
            data: {
                targetCalories,
                tdee,
                bmr,
                consumedCalories,
                questCalorieImpact,
                netCalories,
                remainingCalories: Math.max(0, remainingCalories),
                meals,
                quests,
                isOnTrack,
                percentageUsed,
                statusMessage,
                statusType
            }
        }

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return {
                success: false,
                error: 'Oturum bulunamadı'
            }
        }

        console.error('[getDailyCalorieStatus] Error:', error)
        return {
            success: false,
            error: 'Kalori durumu alınamadı'
        }
    }
}
