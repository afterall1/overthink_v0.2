'use server'

// =====================================================
// Quest Regeneration Module
// Handles regeneration of remaining quest days when profile changes
// =====================================================

import { createAdminClient } from '@/utils/supabase/server'
import { generateWeeklyHealthQuests, type DayOfWeek as HealthCouncilDayOfWeek } from '@/lib/ai/healthCouncil'
import type { UserHealthContext, AIGeneratedQuest } from '@/lib/ai/healthCouncil'

// =====================================================
// Types
// =====================================================

export interface RegenerationResult {
    success: boolean
    goalsAffected: number
    batchesUpdated: number
    daysRegenerated: number
    error?: string
}

interface DayQuests {
    theme: string
    quests: AIGeneratedQuest[]
    total_calorie_impact: number
}

interface WeeklyQuestsData {
    monday?: DayQuests
    tuesday?: DayQuests
    wednesday?: DayQuests
    thursday?: DayQuests
    friday?: DayQuests
    saturday?: DayQuests
    sunday?: DayQuests
}

type DayOfWeek = keyof Required<WeeklyQuestsData>

// =====================================================
// Helper Functions
// =====================================================

function formatDateString(date: Date): string {
    return date.toISOString().split('T')[0]
}

function getDayKey(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
}

function getRemainingDays(fromDate: Date): DayOfWeek[] {
    const allDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const currentDayIndex = allDays.indexOf(getDayKey(fromDate))
    return allDays.slice(currentDayIndex)
}

// =====================================================
// Main Regeneration Function
// =====================================================

/**
 * Regenerate remaining quest days for all active goals when health profile changes significantly
 * Only regenerates days that haven't passed yet, preserving completed quest history
 */
export async function regenerateRemainingQuestDays(
    userId: string,
    newAIContext: UserHealthContext
): Promise<RegenerationResult> {
    try {
        const supabase = createAdminClient()
        const today = new Date()
        const todayStr = formatDateString(today)

        // 1. Find all active weekly batches for this user
        const { data: activeBatches, error: batchError } = await (supabase as ReturnType<typeof createAdminClient>)
            .from('weekly_quest_batches' as 'goals') // Type assertion for custom table
            .select('id, goal_id, week_start, week_end, quests_data, status')
            .eq('user_id', userId)
            .eq('status', 'active')

        if (batchError) {
            console.error('[regenerateRemainingQuestDays] Error fetching batches:', batchError)
            return { success: false, goalsAffected: 0, batchesUpdated: 0, daysRegenerated: 0, error: batchError.message }
        }

        if (!activeBatches || activeBatches.length === 0) {
            console.log('[regenerateRemainingQuestDays] No active batches to regenerate')
            return { success: true, goalsAffected: 0, batchesUpdated: 0, daysRegenerated: 0 }
        }

        console.log(`[regenerateRemainingQuestDays] Found ${activeBatches.length} active batches to process`)

        let totalDaysRegenerated = 0
        let batchesUpdated = 0
        const goalsAffected = new Set<string>()

        // 2. For each batch, regenerate remaining days
        for (const batch of activeBatches) {
            const batchData = batch as unknown as { id: string; goal_id: string; week_start: string; week_end: string; quests_data: WeeklyQuestsData }

            // Check if week has already ended
            if (batchData.week_end < todayStr) {
                continue // Skip expired batches
            }

            // Get remaining days from today onwards
            const remainingDays = getRemainingDays(today)

            if (remainingDays.length === 0) {
                continue // No days left to regenerate
            }

            console.log(`[regenerateRemainingQuestDays] Regenerating ${remainingDays.length} days for batch ${batchData.id}`)

            // 3. Generate new quests for remaining days
            const aiResponse = await generateWeeklyHealthQuests(
                newAIContext,
                remainingDays as HealthCouncilDayOfWeek[]
            )

            if (!aiResponse.success || !aiResponse.weekly_quests) {
                console.error(`[regenerateRemainingQuestDays] AI generation failed for batch ${batchData.id}`)
                continue
            }

            // 4. Merge new quests with existing (preserve past days)
            const existingQuestsData = batchData.quests_data || {}
            const mergedQuestsData: Partial<WeeklyQuestsData> = { ...existingQuestsData }

            for (const day of remainingDays) {
                if (aiResponse.weekly_quests[day]) {
                    mergedQuestsData[day] = aiResponse.weekly_quests[day]
                }
            }

            // 5. Update the batch in database
            const { error: updateError } = await (supabase as ReturnType<typeof createAdminClient>)
                .from('weekly_quest_batches' as 'goals')
                .update({
                    quests_data: mergedQuestsData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', batchData.id)

            if (updateError) {
                console.error(`[regenerateRemainingQuestDays] Error updating batch ${batchData.id}:`, updateError)
                continue
            }

            // 6. Update today's daily_quests if today is in remaining days
            const todayKey = getDayKey(today)
            if (remainingDays.includes(todayKey) && aiResponse.weekly_quests[todayKey]) {
                // Delete existing AI-generated quests for today
                await supabase
                    .from('daily_quests')
                    .delete()
                    .eq('user_id', userId)
                    .eq('goal_id', batchData.goal_id)
                    .eq('is_ai_suggested', true)
                    .eq('scheduled_date', todayStr)
                    .eq('status', 'pending') // Only delete pending quests

                // Insert new quests
                const todaysQuests = aiResponse.weekly_quests[todayKey].quests
                if (todaysQuests && todaysQuests.length > 0) {
                    const questInserts = todaysQuests.map((quest, index) => ({
                        user_id: userId,
                        goal_id: batchData.goal_id,
                        title: quest.title,
                        description: quest.description,
                        category: quest.category || 'habit',
                        difficulty: quest.difficulty || 'medium',
                        estimated_minutes: quest.estimated_minutes || 15,
                        calorie_impact: quest.calorie_impact || 0,
                        xp_reward: quest.xp_reward || 20,
                        emoji: quest.emoji || '🎯',
                        scientific_rationale: quest.scientific_rationale || '',
                        scheduled_date: todayStr,
                        is_recurring: false,
                        status: 'pending' as const,
                        is_ai_suggested: true,
                        sort_order: index
                    }))

                    await supabase
                        .from('daily_quests')
                        .insert(questInserts)
                }
            }

            batchesUpdated++
            totalDaysRegenerated += remainingDays.length
            goalsAffected.add(batchData.goal_id)
        }

        console.log(`[regenerateRemainingQuestDays] Completed: ${batchesUpdated} batches, ${totalDaysRegenerated} days, ${goalsAffected.size} goals`)

        return {
            success: true,
            goalsAffected: goalsAffected.size,
            batchesUpdated,
            daysRegenerated: totalDaysRegenerated,
        }

    } catch (error) {
        console.error('[regenerateRemainingQuestDays] Exception:', error)
        return {
            success: false,
            goalsAffected: 0,
            batchesUpdated: 0,
            daysRegenerated: 0,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata'
        }
    }
}
