'use server'

// =====================================================
// Goal Synergy Engine
// Analyzes relationships between user's active goals
// and generates coordinated quest recommendations
// =====================================================

import { createAdminClient } from '@/utils/supabase/server'
import {
    GOAL_METADATA,
    getSynergyRelationship,
    getSynergisticGoals,
    getConflictingGoals,
    areGoalsConflicting,
    type SynergyType,
    type SynergyRelationship
} from './synergyMatrix'

// =====================================================
// Constants
// =====================================================

const MAX_DAILY_QUESTS = 8

// =====================================================
// Types
// =====================================================

export interface ActiveGoalInfo {
    id: string
    slug: string
    title: string
    category_slug: string
    current_value: number
    target_value: number | null
    progress_percentage: number
    quest_count: number
}

export interface SynergyAnalysisResult {
    newGoalSlug: string
    newGoalTitle: string
    existingGoals: Array<{
        id: string
        slug: string
        title: string
        synergy: SynergyType
        relationship: SynergyRelationship
        sharedQuestOpportunities: number
    }>
    warnings: Array<{
        type: 'CONFLICT' | 'OVERLOAD' | 'DUPLICATE_FOCUS' | 'SYNERGY_OPPORTUNITY'
        severity: 'error' | 'warning' | 'info'
        message: string
        conflictingGoalId?: string
        conflictingGoalSlug?: string
    }>
    recommendations: {
        shouldMergeWith: string | null
        suggestCoordination: boolean
        sharedQuestIdsFromExisting: string[]
        dailyQuestBudgetRemaining: number
        optimalNewQuestCount: number
    }
    summary: {
        totalActiveGoals: number
        synergisticCount: number
        complementaryCount: number
        conflictingCount: number
        overallSynergyScore: number
    }
}

export interface QuestContributionInfo {
    quest_id: string
    goal_id: string
    contribution_weight: number
    contribution_type: 'direct' | 'momentum' | 'synergy'
    synergy_type: SynergyType | null
    is_primary: boolean
}

// =====================================================
// Helper Type Utilities (for Supabase schema mismatch)
// =====================================================

interface GoalRow {
    id: string
    title: string
    category_id: string | null
    current_value: number | null
    target_value: number | null
    goal_template_id: string | null
}

interface GoalTemplateRow {
    id: string
    slug: string
}

interface CategoryRow {
    id: string
    slug: string
}

interface QuestGoalContributionRow {
    quest_id: string
    goal_id: string
    contribution_weight: number
    contribution_type: string
    synergy_type: string | null
    is_primary: boolean
}

// Cast helper to safely convert Supabase response
function asGoalRows(data: unknown): GoalRow[] {
    return (data as GoalRow[]) || []
}

function asGoalTemplateRows(data: unknown): GoalTemplateRow[] {
    return (data as GoalTemplateRow[]) || []
}

function asCategoryRows(data: unknown): CategoryRow[] {
    return (data as CategoryRow[]) || []
}

function asContributionRows(data: unknown): QuestGoalContributionRow[] {
    return (data as QuestGoalContributionRow[]) || []
}

// =====================================================
// Main Functions
// =====================================================

/**
 * Analyze synergy between a new goal and user's existing active goals
 */
export async function analyzeGoalSynergy(
    newGoalSlug: string,
    newGoalTitle: string,
    userId: string
): Promise<SynergyAnalysisResult> {
    try {
        const adminClient = createAdminClient()

        // 1. Get user's active goals
        // Using type assertion to bypass Supabase type checking for goal_template_id
        const goalsQuery = adminClient
            .from('goals')
            .select('id, title, category_id, current_value, target_value')
            .eq('user_id', userId)
            .eq('is_completed', false)

        const { data: rawGoals, error: goalsError } = await goalsQuery

        if (goalsError) {
            console.error('[analyzeGoalSynergy] Error fetching goals:', goalsError)
            return createEmptySynergyResult(newGoalSlug, newGoalTitle)
        }

        const goals = rawGoals || []

        // Get category slugs
        const categoryIds = goals
            .map(g => g.category_id)
            .filter((id): id is string => id !== null)

        let categoryMap: Record<string, string> = {}
        if (categoryIds.length > 0) {
            const { data: categories } = await adminClient
                .from('categories')
                .select('id, slug')
                .in('id', categoryIds)

            const catRows = asCategoryRows(categories)
            categoryMap = catRows.reduce((acc, c) => {
                acc[c.id] = c.slug
                return acc
            }, {} as Record<string, string>)
        }

        // 2. Get quest counts per goal
        const goalIds = goals.map(g => g.id)
        let questCounts: Record<string, number> = {}

        if (goalIds.length > 0) {
            const { data: quests } = await adminClient
                .from('daily_quests')
                .select('goal_id')
                .in('goal_id', goalIds)
                .eq('user_id', userId)

            questCounts = (quests || []).reduce((acc, q) => {
                const goalId = q.goal_id as string | null
                if (goalId) {
                    acc[goalId] = (acc[goalId] || 0) + 1
                }
                return acc
            }, {} as Record<string, number>)
        }

        // 3. Build active goals info (using category slug as fallback for goal slug)
        const activeGoalInfos: ActiveGoalInfo[] = goals.map(goal => {
            const categorySlug = goal.category_id ? categoryMap[goal.category_id] || 'other' : 'other'

            return {
                id: goal.id,
                slug: categorySlug, // Use category as fallback
                title: goal.title,
                category_slug: categorySlug,
                current_value: Number(goal.current_value) || 0,
                target_value: goal.target_value ? Number(goal.target_value) : null,
                progress_percentage: goal.target_value
                    ? Math.min(100, Math.round((Number(goal.current_value) / Number(goal.target_value)) * 100))
                    : 0,
                quest_count: questCounts[goal.id] || 0
            }
        })

        // 4. Analyze synergy with each existing goal
        const existingGoalsAnalysis = activeGoalInfos.map(existingGoal => {
            const relationship = getSynergyRelationship(newGoalSlug, existingGoal.slug)

            return {
                id: existingGoal.id,
                slug: existingGoal.slug,
                title: existingGoal.title,
                synergy: relationship.type,
                relationship,
                sharedQuestOpportunities: Math.round(existingGoal.quest_count * relationship.questShareRatio)
            }
        })

        // 5. Generate warnings
        const warnings: SynergyAnalysisResult['warnings'] = []

        const conflictingGoals = existingGoalsAnalysis.filter(g => g.synergy === 'CONFLICTING')
        for (const conflict of conflictingGoals) {
            warnings.push({
                type: 'CONFLICT',
                severity: 'error',
                message: `⚠️ "${newGoalTitle}" hedefiniz "${conflict.title}" ile çatışıyor! ${conflict.relationship.description}`,
                conflictingGoalId: conflict.id,
                conflictingGoalSlug: conflict.slug
            })
        }

        const synergisticGoals = existingGoalsAnalysis.filter(g => g.synergy === 'SYNERGISTIC')
        for (const synergy of synergisticGoals) {
            warnings.push({
                type: 'SYNERGY_OPPORTUNITY',
                severity: 'info',
                message: `🔗 "${newGoalTitle}" hedefiniz "${synergy.title}" ile yakından ilişkili. ${synergy.sharedQuestOpportunities} görev paylaşılabilir.`,
                conflictingGoalId: synergy.id,
                conflictingGoalSlug: synergy.slug
            })
        }

        const totalCurrentQuests = Object.values(questCounts).reduce((sum, c) => sum + c, 0)
        if (totalCurrentQuests >= MAX_DAILY_QUESTS - 2) {
            warnings.push({
                type: 'OVERLOAD',
                severity: 'warning',
                message: `📊 Şu anda ${totalCurrentQuests} aktif göreviniz var.`
            })
        }

        // 6. Build recommendations
        const dailyQuestBudgetRemaining = Math.max(0, MAX_DAILY_QUESTS - totalCurrentQuests)
        const totalSharedOpportunities = existingGoalsAnalysis.reduce(
            (sum, g) => sum + g.sharedQuestOpportunities, 0
        )

        let sharedQuestIds: string[] = []
        const relatedGoalIds = existingGoalsAnalysis
            .filter(g => g.synergy === 'SYNERGISTIC' || g.synergy === 'COMPLEMENTARY')
            .map(g => g.id)

        if (relatedGoalIds.length > 0) {
            const { data: relatedQuests } = await adminClient
                .from('daily_quests')
                .select('id')
                .in('goal_id', relatedGoalIds)
                .eq('user_id', userId)
                .limit(10)

            sharedQuestIds = (relatedQuests || []).map(q => q.id)
        }

        const baseQuestCount = Math.min(5, dailyQuestBudgetRemaining)
        const sharedQuestReduction = Math.min(totalSharedOpportunities, 3)
        const optimalNewQuestCount = Math.max(2, baseQuestCount - sharedQuestReduction)

        // 7. Calculate summary
        const synergisticCount = synergisticGoals.length
        const complementaryCount = existingGoalsAnalysis.filter(g => g.synergy === 'COMPLEMENTARY').length
        const conflictingCount = conflictingGoals.length

        const synergyPoints = (synergisticCount * 20) + (complementaryCount * 10) - (conflictingCount * 30)
        const maxPoints = activeGoalInfos.length * 20
        const overallSynergyScore = maxPoints > 0
            ? Math.max(0, Math.min(100, Math.round((synergyPoints / maxPoints) * 100 + 50)))
            : 100

        return {
            newGoalSlug,
            newGoalTitle,
            existingGoals: existingGoalsAnalysis,
            warnings,
            recommendations: {
                shouldMergeWith: synergisticGoals.length > 0 ? synergisticGoals[0].slug : null,
                suggestCoordination: synergisticGoals.length > 0 || complementaryCount > 0,
                sharedQuestIdsFromExisting: sharedQuestIds,
                dailyQuestBudgetRemaining,
                optimalNewQuestCount
            },
            summary: {
                totalActiveGoals: activeGoalInfos.length,
                synergisticCount,
                complementaryCount,
                conflictingCount,
                overallSynergyScore
            }
        }
    } catch (error) {
        console.error('[analyzeGoalSynergy] Unexpected error:', error)
        return createEmptySynergyResult(newGoalSlug, newGoalTitle)
    }
}

/**
 * Create quest-goal contributions for a quest
 */
export async function createQuestGoalContributions(
    questId: string,
    primaryGoalId: string,
    userId: string,
    additionalGoalIds: Array<{
        goalId: string
        contributionWeight: number
        synergyType: SynergyType
    }> = []
): Promise<{ success: boolean; created: number; error?: string }> {
    try {
        const adminClient = createAdminClient()

        const contributions = [
            {
                quest_id: questId,
                goal_id: primaryGoalId,
                user_id: userId,
                contribution_weight: 1.0,
                contribution_type: 'direct',
                synergy_type: null as string | null,
                is_primary: true
            },
            ...additionalGoalIds.map(additional => ({
                quest_id: questId,
                goal_id: additional.goalId,
                user_id: userId,
                contribution_weight: additional.contributionWeight,
                contribution_type: 'synergy',
                synergy_type: additional.synergyType as string,
                is_primary: false
            }))
        ]

        // Insert contributions directly to table
        const { error } = await adminClient
            .from('quest_goal_contributions')
            .upsert(contributions, {
                onConflict: 'quest_id,goal_id',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('[createQuestGoalContributions] Insert error:', error)
            return { success: false, created: 0, error: error.message }
        }

        return { success: true, created: contributions.length }
    } catch (error) {
        console.error('[createQuestGoalContributions] Error:', error)
        return { success: false, created: 0, error: String(error) }
    }
}

/**
 * Get all goals a quest contributes to
 */
export async function getQuestGoalContributions(
    questId: string,
    userId: string
): Promise<QuestContributionInfo[]> {
    try {
        const adminClient = createAdminClient()

        // Query contributions directly from table
        const { data, error } = await adminClient
            .from('quest_goal_contributions')
            .select('*')
            .eq('quest_id', questId)
            .eq('user_id', userId)
            .order('is_primary', { ascending: false })

        if (error || !data || data.length === 0) {
            // Fallback: return primary goal only from daily_quests table
            const { data: quest } = await adminClient
                .from('daily_quests')
                .select('id, goal_id')
                .eq('id', questId)
                .eq('user_id', userId)
                .single()

            if (quest && quest.goal_id) {
                return [{
                    quest_id: questId,
                    goal_id: quest.goal_id,
                    contribution_weight: 1.0,
                    contribution_type: 'direct',
                    synergy_type: null,
                    is_primary: true
                }]
            }
            return []
        }

        const contributions = asContributionRows(data)
        return contributions.map(row => ({
            quest_id: row.quest_id,
            goal_id: row.goal_id,
            contribution_weight: Number(row.contribution_weight),
            contribution_type: row.contribution_type as 'direct' | 'momentum' | 'synergy',
            synergy_type: row.synergy_type as SynergyType | null,
            is_primary: row.is_primary
        }))
    } catch (error) {
        console.error('[getQuestGoalContributions] Error:', error)
        return []
    }
}

/**
 * Update all linked goals when a quest is completed
 */
export async function updateGoalsFromQuestCompletion(
    questId: string,
    userId: string,
    baseProgressContribution: number
): Promise<Array<{ goalId: string; progressAdded: number; newValue: number }>> {
    try {
        const adminClient = createAdminClient()
        const contributions = await getQuestGoalContributions(questId, userId)

        if (contributions.length === 0) {
            return []
        }

        const results: Array<{ goalId: string; progressAdded: number; newValue: number }> = []

        for (const contribution of contributions) {
            const progressAdded = baseProgressContribution * contribution.contribution_weight

            const { data: goal, error: fetchError } = await adminClient
                .from('goals')
                .select('current_value')
                .eq('id', contribution.goal_id)
                .single()

            if (fetchError || !goal) continue

            const currentValue = Number(goal.current_value) || 0
            const newValue = currentValue + progressAdded

            const { error: updateError } = await adminClient
                .from('goals')
                .update({
                    current_value: newValue,
                    updated_at: new Date().toISOString()
                })
                .eq('id', contribution.goal_id)

            if (!updateError) {
                results.push({ goalId: contribution.goal_id, progressAdded, newValue })
            }
        }

        console.log(`[updateGoalsFromQuestCompletion] Updated ${results.length} goals from quest ${questId}`)
        return results
    } catch (error) {
        console.error('[updateGoalsFromQuestCompletion] Error:', error)
        return []
    }
}

/**
 * Auto-link existing quests to a new synergistic goal
 */
export async function autoLinkSynergisticQuests(
    newGoalId: string,
    newGoalSlug: string,
    userId: string
): Promise<{ linked: number; questIds: string[] }> {
    try {
        const synergisticGoals = getSynergisticGoals(newGoalSlug)

        if (synergisticGoals.length === 0) {
            return { linked: 0, questIds: [] }
        }

        const adminClient = createAdminClient()

        // Get user's goals
        const { data: goalsData } = await adminClient
            .from('goals')
            .select('id, category_id')
            .eq('user_id', userId)
            .eq('is_completed', false)

        const goals = goalsData || []

        if (goals.length === 0) {
            return { linked: 0, questIds: [] }
        }

        // Get category slugs
        const categoryIds = goals
            .map(g => g.category_id)
            .filter((id): id is string => id !== null)

        let categoryMap: Record<string, string> = {}
        if (categoryIds.length > 0) {
            const { data: categories } = await adminClient
                .from('categories')
                .select('id, slug')
                .in('id', categoryIds)

            const catRows = asCategoryRows(categories)
            categoryMap = catRows.reduce((acc, c) => {
                acc[c.id] = c.slug
                return acc
            }, {} as Record<string, string>)
        }

        // Find goals with synergistic categories
        const synergisticSlugs = synergisticGoals.map(s => s.slug)
        const matchingGoalIds = goals
            .filter(g => {
                const catSlug = g.category_id ? categoryMap[g.category_id] : null
                return catSlug && synergisticSlugs.includes(catSlug)
            })
            .map(g => g.id)

        if (matchingGoalIds.length === 0) {
            return { linked: 0, questIds: [] }
        }

        // Get quests from these goals
        const { data: quests } = await adminClient
            .from('daily_quests')
            .select('id, goal_id')
            .in('goal_id', matchingGoalIds)
            .eq('user_id', userId)

        if (!quests || quests.length === 0) {
            return { linked: 0, questIds: [] }
        }

        // Create contributions (using rpc for type bypass)
        const contributions = quests.map(q => {
            const matchingGoal = goals.find(g => g.id === q.goal_id)
            const catSlug = matchingGoal?.category_id ? categoryMap[matchingGoal.category_id] : ''
            const relationship = getSynergyRelationship(newGoalSlug, catSlug)

            return {
                quest_id: q.id,
                goal_id: newGoalId,
                user_id: userId,
                contribution_weight: relationship?.contributionWeight || 0.5,
                contribution_type: 'synergy',
                synergy_type: relationship?.type || 'PARALLEL',
                is_primary: false
            }
        })

        // Insert contributions directly
        const { error } = await adminClient
            .from('quest_goal_contributions')
            .upsert(contributions, {
                onConflict: 'quest_id,goal_id',
                ignoreDuplicates: true
            })

        if (error) {
            console.error('[autoLinkSynergisticQuests] Insert error:', error)
        }

        const questIds = contributions.map(c => c.quest_id)
        console.log(`[autoLinkSynergisticQuests] Linked ${questIds.length} quests to new goal ${newGoalId}`)

        return { linked: questIds.length, questIds }
    } catch (error) {
        console.error('[autoLinkSynergisticQuests] Error:', error)
        return { linked: 0, questIds: [] }
    }
}

// =====================================================
// Helper Functions
// =====================================================

function createEmptySynergyResult(
    newGoalSlug: string,
    newGoalTitle: string
): SynergyAnalysisResult {
    return {
        newGoalSlug,
        newGoalTitle,
        existingGoals: [],
        warnings: [],
        recommendations: {
            shouldMergeWith: null,
            suggestCoordination: false,
            sharedQuestIdsFromExisting: [],
            dailyQuestBudgetRemaining: MAX_DAILY_QUESTS,
            optimalNewQuestCount: 5
        },
        summary: {
            totalActiveGoals: 0,
            synergisticCount: 0,
            complementaryCount: 0,
            conflictingCount: 0,
            overallSynergyScore: 100
        }
    }
}

// Re-export for convenience
export {
    getSynergyRelationship,
    getSynergisticGoals,
    getConflictingGoals,
    areGoalsConflicting,
    type SynergyType,
    type SynergyRelationship
}
