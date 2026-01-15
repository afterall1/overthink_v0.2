'use server'

// =====================================================
// Weekly Quest Batches Server Actions
// Haftalık çeşitlendirilmiş quest üretimi ve yönetimi
// =====================================================

import { createAdminClient } from '@/utils/supabase/server'
import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateWeeklyHealthQuests, type DayOfWeek as HealthCouncilDayOfWeek } from '@/lib/ai/healthCouncil'
import type { UserHealthContext, AIGeneratedQuest } from '@/lib/ai/healthCouncil'
import { calculateAge, calculateHealthMetrics, type HealthProfile } from '@/lib/healthCalculator'

// =====================================================
// Types
// =====================================================

interface ActionResult<T> {
    data: T | null
    error: string | null
}

export interface WeeklyQuestBatch {
    id: string
    user_id: string
    goal_id: string
    week_start: string
    week_end: string
    quests_data: WeeklyQuestsData
    status: 'active' | 'expired' | 'regenerating'
    generated_at: string
    days_delivered: number
}

export interface DayQuests {
    theme: string
    quests: AIGeneratedQuest[]
    total_calorie_impact: number
}

export interface WeeklyQuestsData {
    monday: DayQuests
    tuesday: DayQuests
    wednesday: DayQuests
    thursday: DayQuests
    friday: DayQuests
    saturday: DayQuests
    sunday: DayQuests
}

type DayOfWeek = keyof WeeklyQuestsData

// =====================================================
// Regeneration Types
// =====================================================

export interface RegenerationResult {
    success: boolean
    goalsAffected: number
    batchesUpdated: number
    daysRegenerated: number
    error?: string
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get the Monday of the week for a given date (ISO week start)
 */
function getWeekStart(date: Date = new Date()): Date {
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday is 1
    const monday = new Date(date)
    monday.setDate(diff)
    monday.setHours(0, 0, 0, 0)
    return monday
}

/**
 * Get the Sunday of the week for a given date
 */
function getWeekEnd(date: Date = new Date()): Date {
    const monday = getWeekStart(date)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return sunday
}

/**
 * Format date to YYYY-MM-DD string
 */
function formatDateString(date: Date): string {
    return date.toISOString().split('T')[0]
}

/**
 * Get day of week key from date
 */
function getDayKey(date: Date): DayOfWeek {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return days[date.getDay()]
}

/**
 * Calculate remaining days in the week from a given date
 */
function getRemainingDays(fromDate: Date): DayOfWeek[] {
    const allDays: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const currentDayIndex = allDays.indexOf(getDayKey(fromDate))
    return allDays.slice(currentDayIndex)
}

// =====================================================
// Main Actions
// =====================================================

/**
 * Generate a weekly quest batch for a goal
 * Creates 7 days of varied quests based on user's health profile
 */
export async function generateWeeklyBatch(
    goalId: string,
    startFromDate?: Date
): Promise<ActionResult<WeeklyQuestBatch>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        // 1. Get goal details
        const { data: goal, error: goalError } = await supabase
            .from('goals')
            .select('*, categories(*)')
            .eq('id', goalId)
            .eq('user_id', user.id)
            .single()

        if (goalError || !goal) {
            return { data: null, error: 'Goal bulunamadı' }
        }

        // 2. Get user health profile for AI context
        const { data: healthProfile } = await supabase
            .from('user_health_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // 3. Calculate week boundaries
        const startDate = startFromDate || new Date()
        const weekStart = getWeekStart(startDate)
        const weekEnd = getWeekEnd(startDate)

        // 4. Check if batch already exists for this week
        // NOTE: Type cast needed until migration is applied and types regenerated
        const { data: existingBatch } = await (supabase as any)
            .from('weekly_quest_batches')
            .select('*')
            .eq('goal_id', goalId)
            .eq('user_id', user.id)
            .eq('week_start', formatDateString(weekStart))
            .single()

        if (existingBatch && existingBatch.status === 'active') {
            return {
                data: existingBatch as unknown as WeeklyQuestBatch,
                error: null
            }
        }

        // 5. Build AI context
        const aiContext = buildAIContextForWeekly(healthProfile, goal)

        // 6. Determine which days to generate
        const daysToGenerate = getRemainingDays(startDate)

        // 7. Generate weekly quests via AI
        console.log('[generateWeeklyBatch] Generating quests for days:', daysToGenerate)
        const aiResponse = await generateWeeklyHealthQuests(aiContext, daysToGenerate as HealthCouncilDayOfWeek[])

        if (!aiResponse.success || !aiResponse.weekly_quests) {
            console.error('[generateWeeklyBatch] AI failed:', aiResponse.error)
            // Use fallback quests
            const fallbackQuests = generateFallbackWeeklyQuests(daysToGenerate, goal.title)

            // NOTE: Type cast needed until migration is applied and types regenerated
            const { data: batch, error: insertError } = await (supabase as any)
                .from('weekly_quest_batches')
                .insert({
                    user_id: user.id,
                    goal_id: goalId,
                    week_start: formatDateString(weekStart),
                    week_end: formatDateString(weekEnd),
                    quests_data: fallbackQuests,
                    status: 'active',
                    expires_at: new Date(weekEnd.getTime() + 86400000).toISOString() // +1 day
                })
                .select()
                .single()

            if (insertError) {
                return { data: null, error: insertError.message }
            }

            revalidatePath('/')
            return { data: batch as unknown as WeeklyQuestBatch, error: null }
        }

        // 8. Save batch to database
        // NOTE: Type cast needed until migration is applied and types regenerated
        const { data: batch, error: insertError } = await (supabase as any)
            .from('weekly_quest_batches')
            .insert({
                user_id: user.id,
                goal_id: goalId,
                week_start: formatDateString(weekStart),
                week_end: formatDateString(weekEnd),
                quests_data: aiResponse.weekly_quests,
                status: 'active',
                expires_at: new Date(weekEnd.getTime() + 86400000).toISOString(),
                token_usage: aiResponse.token_usage
            })
            .select()
            .single()

        if (insertError) {
            return { data: null, error: insertError.message }
        }

        // 9. Save today's quests to daily_quests table for frontend compatibility
        // This makes weekly quests appear in the existing quest UI
        const todayKey = getDayKey(startDate)
        const todaysQuests = aiResponse.weekly_quests[todayKey]?.quests

        if (todaysQuests && todaysQuests.length > 0) {
            const today = formatDateString(startDate)
            const questInserts = todaysQuests.map((quest, index) => ({
                user_id: user.id,
                goal_id: goalId,
                title: quest.title,
                description: quest.description,
                category: quest.category || 'habit',
                difficulty: quest.difficulty || 'medium',
                estimated_minutes: quest.estimated_minutes || 15,
                calorie_impact: quest.calorie_impact || 0,
                xp_reward: quest.xp_reward || 20,
                emoji: quest.emoji || '🎯',
                scientific_rationale: quest.scientific_rationale || '',
                scheduled_date: today,
                is_recurring: false, // One-time per day from weekly batch
                status: 'pending' as const,
                is_ai_suggested: true,
                sort_order: index
            }))

            const { error: questError } = await supabase
                .from('daily_quests')
                .insert(questInserts)

            if (questError) {
                console.error('[generateWeeklyBatch] Failed to save daily quests:', questError)
                // Non-blocking: batch is saved, just log the error
            } else {
                console.log(`[generateWeeklyBatch] Saved ${questInserts.length} quests for ${todayKey}`)
            }
        }

        revalidatePath('/')
        return { data: batch as unknown as WeeklyQuestBatch, error: null }

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli' }
        }
        console.error('[generateWeeklyBatch] Exception:', error)
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata'
        }
    }
}

/**
 * Get the active weekly batch for a goal
 */
export async function getWeeklyBatch(
    goalId: string,
    date?: Date
): Promise<ActionResult<WeeklyQuestBatch>> {
    try {
        const { user } = await getAuthenticatedClient()
        const supabase = createAdminClient()

        const targetDate = date || new Date()
        const weekStart = getWeekStart(targetDate)

        // NOTE: Type cast needed until migration is applied and types regenerated
        const { data, error } = await (supabase as any)
            .from('weekly_quest_batches')
            .select('*')
            .eq('goal_id', goalId)
            .eq('user_id', user.id)
            .eq('week_start', formatDateString(weekStart))
            .eq('status', 'active')
            .single()

        if (error) {
            if (error.code === 'PGRST116') {
                // No batch found - need to generate
                return { data: null, error: null }
            }
            return { data: null, error: error.message }
        }

        return { data: data as unknown as WeeklyQuestBatch, error: null }

    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli' }
        }
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata'
        }
    }
}

/**
 * Get quests for a specific date from weekly batch
 */
export async function getWeeklyQuestsForDate(
    goalId: string,
    date?: Date
): Promise<ActionResult<AIGeneratedQuest[]>> {
    try {
        const targetDate = date || new Date()
        const dayKey = getDayKey(targetDate)

        // Get or generate batch
        let batchResult = await getWeeklyBatch(goalId, targetDate)

        if (!batchResult.data) {
            // No batch exists - generate one
            batchResult = await generateWeeklyBatch(goalId, targetDate)
        }

        if (!batchResult.data) {
            return { data: null, error: batchResult.error || 'Batch oluşturulamadı' }
        }

        const dayQuests = batchResult.data.quests_data[dayKey]

        if (!dayQuests || !dayQuests.quests) {
            return { data: [], error: null }
        }

        return { data: dayQuests.quests, error: null }

    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata'
        }
    }
}

/**
 * Expire old batches (for cron job)
 */
export async function expireOldBatches(): Promise<ActionResult<number>> {
    try {
        const supabase = createAdminClient()
        const today = formatDateString(new Date())

        // NOTE: Type cast needed until migration is applied and types regenerated
        const { data, error } = await (supabase as any)
            .from('weekly_quest_batches')
            .update({ status: 'expired' })
            .lt('week_end', today)
            .eq('status', 'active')
            .select('id')

        if (error) {
            return { data: null, error: error.message }
        }

        return { data: data?.length || 0, error: null }

    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Beklenmeyen hata'
        }
    }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Build AI context for weekly quest generation
 */
function buildAIContextForWeekly(
    healthProfile: Record<string, unknown> | null,
    goal: Record<string, unknown>
): UserHealthContext {
    if (!healthProfile) {
        // Return minimal context
        return {
            age_years: 30,
            biological_sex: 'male',
            weight_kg: 75,
            height_cm: 175,
            activity_level: 'moderate',
            bmr_kcal: 1800,
            tdee_kcal: 2400,
            target_daily_kcal: 2000,
            daily_adjustment: -400,
            protein_g: 150,
            carbs_g: 200,
            fat_g: 67,
            water_liters: 2.5,
            primary_goal: 'weight_loss',
            goal_pace: 'moderate',
            health_conditions: [],
            dietary_restrictions: [],
            allergies: []
        }
    }

    const profile: HealthProfile = {
        weight_kg: healthProfile.weight_kg as number,
        height_cm: healthProfile.height_cm as number,
        birth_date: healthProfile.birth_date as string,
        biological_sex: healthProfile.biological_sex as 'male' | 'female',
        activity_level: healthProfile.activity_level as HealthProfile['activity_level'],
        primary_goal: healthProfile.primary_goal as HealthProfile['primary_goal'] ?? undefined,
        target_weight_kg: healthProfile.target_weight_kg as number ?? undefined,
        goal_pace: healthProfile.goal_pace as HealthProfile['goal_pace'] ?? undefined,
        health_conditions: (healthProfile.health_conditions as string[]) || [],
        dietary_restrictions: (healthProfile.dietary_restrictions as string[]) || []
    }

    const age = calculateAge(profile.birth_date)
    const metrics = calculateHealthMetrics(profile)

    return {
        age_years: age,
        biological_sex: profile.biological_sex,
        weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        activity_level: profile.activity_level,
        bmr_kcal: metrics.bmr_kcal,
        tdee_kcal: metrics.tdee_kcal,
        target_daily_kcal: metrics.target_daily_kcal,
        daily_adjustment: metrics.daily_adjustment,
        protein_g: metrics.macros.protein_g,
        carbs_g: metrics.macros.carbs_g,
        fat_g: metrics.macros.fat_g,
        water_liters: Math.round(profile.weight_kg * 0.033 * 10) / 10,
        primary_goal: profile.primary_goal,
        target_weight_kg: profile.target_weight_kg,
        goal_pace: profile.goal_pace,
        health_conditions: profile.health_conditions || [],
        dietary_restrictions: profile.dietary_restrictions || [],
        allergies: [],
        // Extended fields
        training_experience: healthProfile.training_experience as UserHealthContext['training_experience'],
        training_types: healthProfile.training_types as string[] | undefined,
        gym_access: healthProfile.gym_access as UserHealthContext['gym_access'],
        meals_per_day: healthProfile.meals_per_day as UserHealthContext['meals_per_day'],
        cooks_at_home: healthProfile.cooks_at_home as UserHealthContext['cooks_at_home'],
        fast_food_frequency: healthProfile.fast_food_frequency as UserHealthContext['fast_food_frequency'],
        current_water_intake_liters: healthProfile.current_water_intake_liters as number | undefined,
        sugar_drinks_per_day: healthProfile.sugar_drinks_per_day as number | undefined,
        sleep_quality: healthProfile.sleep_quality as UserHealthContext['sleep_quality'],
        stress_level: healthProfile.stress_level as UserHealthContext['stress_level']
    }
}

/**
 * Generate fallback quests when AI fails
 */
function generateFallbackWeeklyQuests(
    days: DayOfWeek[],
    goalTitle: string
): Partial<WeeklyQuestsData> {
    const themes: Record<DayOfWeek, string> = {
        monday: 'fresh_start',
        tuesday: 'momentum',
        wednesday: 'midweek_push',
        thursday: 'consistency',
        friday: 'weekend_prep',
        saturday: 'active_rest',
        sunday: 'recovery'
    }

    const result: Partial<WeeklyQuestsData> = {}

    for (const day of days) {
        result[day] = {
            theme: themes[day],
            total_calorie_impact: -300,
            quests: [
                {
                    title: '30 Dakika Yürüyüş',
                    description: `${goalTitle} hedefin için tempolu yürüyüş yap.`,
                    category: 'exercise',
                    difficulty: 'easy',
                    estimated_minutes: 30,
                    calorie_impact: -150,
                    xp_reward: 25,
                    emoji: '🚶',
                    scientific_rationale: 'Düşük yoğunluklu kardiyo yağ yakımını destekler.'
                },
                {
                    title: 'Su Hedefi',
                    description: 'Gün boyunca 2.5L su iç.',
                    category: 'habit',
                    difficulty: 'easy',
                    estimated_minutes: 5,
                    calorie_impact: 0,
                    xp_reward: 15,
                    emoji: '💧',
                    scientific_rationale: 'Hidrasyon metabolizmayı destekler.'
                },
                {
                    title: 'Protein Hedefi',
                    description: 'Her öğünde protein kaynağı olduğundan emin ol.',
                    category: 'nutrition',
                    difficulty: 'medium',
                    estimated_minutes: 0,
                    calorie_impact: 0,
                    xp_reward: 20,
                    emoji: '🥩',
                    scientific_rationale: 'Protein kas korumayı sağlar.'
                },
                {
                    title: 'Porsiyon Kontrolü',
                    description: 'Ana öğünlerde porsiyonları %20 azalt.',
                    category: 'nutrition',
                    difficulty: 'medium',
                    estimated_minutes: 0,
                    calorie_impact: -150,
                    xp_reward: 20,
                    emoji: '🍽️',
                    scientific_rationale: 'Kalori açığı oluşturmada etkili yöntem.'
                }
            ]
        }
    }

    return result
}

// =====================================================
// Quest Regeneration Functions
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

