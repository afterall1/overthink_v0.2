'use strict'

// =====================================================
// Synergy Context Builder
// Injects existing quests and synergistic goals into AI prompts
// Prevents duplicate quest generation and enables multi-goal quests
// =====================================================

import { createClient } from '@/utils/supabase/server'
import { getSynergyRelationship, type SynergyType } from './synergyMatrix'

// =====================================================
// Types
// =====================================================

export interface ExistingQuestInfo {
    id: string
    title: string
    description: string | null
    goal_id: string | null
    goal_title: string | null
    status: 'pending' | 'completed' | 'skipped'
    category_slug: string | null
}

export interface SynergisticGoalInfo {
    id: string
    slug: string
    title: string
    synergy_type: SynergyType
    quest_share_ratio: number
    contribution_weight: number
    current_progress: number
}

export interface SynergyContext {
    primary_goal_slug: string
    primary_goal_title: string
    existing_quests: ExistingQuestInfo[]
    synergistic_goals: SynergisticGoalInfo[]
    user_id: string
}

// =====================================================
// Fetch Existing Quests (Prevent Duplicates)
// =====================================================

/**
 * Fetch all pending and recent quests for a user to prevent AI from generating duplicates
 */
export async function fetchExistingQuests(userId: string): Promise<ExistingQuestInfo[]> {
    try {
        const supabase = await createClient()

        // Get today's quests and recent completed ones (last 3 days)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        const { data, error } = await supabase
            .from('daily_quests')
            .select(`
                id,
                title,
                description,
                goal_id,
                status,
                goals:goal_id (
                    title,
                    category_id
                )
            `)
            .eq('user_id', userId)
            .or(`status.eq.pending,and(status.eq.completed,completed_at.gte.${threeDaysAgo.toISOString()})`)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('[SynergyContext] Error fetching existing quests:', error)
            return []
        }

        if (!data) return []

        // Type-safe mapping
        return data.map((quest: unknown) => {
            const questData = quest as {
                id: string
                title: string
                description: string | null
                goal_id: string | null
                status: string
                goals?: { title: string; category_id: string | null } | null
            }

            return {
                id: questData.id,
                title: questData.title,
                description: questData.description,
                goal_id: questData.goal_id,
                goal_title: questData.goals?.title ?? null,
                status: questData.status as 'pending' | 'completed' | 'skipped',
                category_slug: null // Simplified - category info not needed for dedup
            }
        })
    } catch (error) {
        console.error('[SynergyContext] Unexpected error:', error)
        return []
    }
}

// =====================================================
// Fetch Synergistic Goals
// =====================================================

/**
 * Fetch all synergistic goals for a given goal slug
 * Returns goals that can share quests with the primary goal
 */
export async function fetchSynergisticGoals(
    userId: string,
    primaryGoalSlug: string
): Promise<SynergisticGoalInfo[]> {
    try {
        const supabase = await createClient()

        // Fetch user's active goals
        const { data: goals, error } = await supabase
            .from('goals')
            .select(`
                id,
                title,
                current_value,
                target_value,
                goal_templates!goal_template_id (
                    slug
                )
            `)
            .eq('user_id', userId)
            .eq('is_completed', false)

        if (error) {
            console.error('[SynergyContext] Error fetching goals:', error)
            return []
        }

        if (!goals) return []

        // Find synergistic relationships
        const synergisticGoals: SynergisticGoalInfo[] = []

        for (const goal of goals) {
            const goalData = goal as {
                id: string
                title: string
                current_value: number | null
                target_value: number | null
                goal_templates?: { slug: string } | null
            }

            const goalSlug = goalData.goal_templates?.slug
            if (!goalSlug || goalSlug === primaryGoalSlug) continue

            // Check synergy relationship
            const relationship = getSynergyRelationship(primaryGoalSlug, goalSlug)

            // Only include synergistic and complementary goals (not parallel or conflicting)
            if (relationship.type === 'SYNERGISTIC' || relationship.type === 'COMPLEMENTARY') {
                const progress = goalData.target_value && goalData.target_value > 0
                    ? Math.min(100, ((goalData.current_value ?? 0) / goalData.target_value) * 100)
                    : 0

                synergisticGoals.push({
                    id: goalData.id,
                    slug: goalSlug,
                    title: goalData.title,
                    synergy_type: relationship.type,
                    quest_share_ratio: relationship.questShareRatio,
                    contribution_weight: relationship.contributionWeight,
                    current_progress: Math.round(progress)
                })
            }
        }

        return synergisticGoals
    } catch (error) {
        console.error('[SynergyContext] Unexpected error:', error)
        return []
    }
}

// =====================================================
// Build Synergy Context
// =====================================================

/**
 * Build the complete synergy context for AI prompt injection
 */
export async function buildSynergyContext(
    userId: string,
    primaryGoalSlug: string,
    primaryGoalTitle: string
): Promise<SynergyContext> {
    const [existingQuests, synergisticGoals] = await Promise.all([
        fetchExistingQuests(userId),
        fetchSynergisticGoals(userId, primaryGoalSlug)
    ])

    return {
        primary_goal_slug: primaryGoalSlug,
        primary_goal_title: primaryGoalTitle,
        existing_quests: existingQuests,
        synergistic_goals: synergisticGoals,
        user_id: userId
    }
}

// =====================================================
// Format Synergy Context for AI Prompt
// =====================================================

/**
 * Format synergy context as a string for AI prompt injection
 * This is added to the user context message to give AI awareness
 */
export function formatSynergyContextForPrompt(context: SynergyContext): string {
    const sections: string[] = []

    // ===== Existing Quests Section =====
    if (context.existing_quests.length > 0) {
        const pendingQuests = context.existing_quests.filter(q => q.status === 'pending')
        const recentCompleted = context.existing_quests.filter(q => q.status === 'completed')

        sections.push(`
## ⚠️ MEVCUT GÖREVLER (TEKRAR ETME!):
Bu kullanıcının zaten şu görevleri var. Bu görevlerin aynısını veya çok benzerlerini ÜRETMEMELİSİN:

### Aktif Bekleyen Görevler (${pendingQuests.length}):
${pendingQuests.slice(0, 10).map(q => `- "${q.title}"`).join('\n')}

### Son 3 Günde Tamamlanan (${recentCompleted.length}):
${recentCompleted.slice(0, 5).map(q => `- "${q.title}"`).join('\n')}

> KURAL: Yukarıdaki görevlerin aynısı veya çok benzeri bir görev üretme. Farklı ve taze görevler öner!
`)
    }

    // ===== Synergistic Goals Section =====
    if (context.synergistic_goals.length > 0) {
        sections.push(`
## 🔗 SİNERJİK HEDEFLER (ÇOKLU KATKI):
Bu kullanıcının birbirine bağlı hedefleri var. Ürettiğin görevler bu hedeflerin HEPSİNE katkı sağlayabilir:

### Ana Hedef: ${context.primary_goal_title}

### Bağlı Hedefler:
${context.synergistic_goals.map(g => {
            const synergyLabel = g.synergy_type === 'SYNERGISTIC' ? '🔄 Güçlü Sinerji' : '🤝 Tamamlayıcı'
            return `- ${synergyLabel}: "${g.title}" (İlerleme: %${g.current_progress})
  → Paylaşım oranı: %${Math.round(g.quest_share_ratio * 100)}, Katkı ağırlığı: %${Math.round(g.contribution_weight * 100)}`
        }).join('\n')}

> ÖNERİ: Mümkünse birden fazla hedefe katkı sağlayan entegre görevler üret!
> Örnek: Kilo verme + Yağ yakma hedefleri için "30 dakika tempolu yürüyüş" her ikisine de katkı sağlar.
`)
    }

    return sections.join('\n')
}

// =====================================================
// Multi-Goal Quest Marker
// =====================================================

/**
 * Analyze if a quest title/description can contribute to multiple goals
 * Returns goal slugs that should receive contributions
 */
export function identifyMultiGoalContributions(
    questTitle: string,
    questDescription: string,
    synergisticGoals: SynergisticGoalInfo[]
): Array<{ goalId: string; contributionWeight: number; synergyType: SynergyType }> {
    const contributions: Array<{ goalId: string; contributionWeight: number; synergyType: SynergyType }> = []

    // Keywords for different goal types
    const goalKeywords: Record<string, string[]> = {
        'lose_weight': ['kilo', 'kalori', 'açık', 'diyet', 'porsiyon', 'yemek'],
        'lose_fat': ['yağ', 'kardio', 'koşu', 'yürüyüş', 'HIIT', 'egzersiz'],
        'gain_muscle': ['kas', 'protein', 'ağırlık', 'kaldırma', 'antrenman'],
        'eat_healthy': ['sağlıklı', 'sebze', 'meyve', 'beslenme', 'vitamin'],
        'drink_water': ['su', 'hidrasyon', 'sıvı', 'bardak', 'litre'],
        'reduce_sugar': ['şeker', 'tatlı', 'işlenmiş', 'doğal'],
        'daily_steps': ['adım', 'yürüyüş', 'hareket', 'aktif'],
        'weekly_workouts': ['antrenman', 'spor', 'egzersiz', 'gym'],
        'protein_goal': ['protein', 'et', 'yumurta', 'balık', 'tavuk'],
        'build_strength': ['güç', 'kuvvet', 'ağırlık', 'lift']
    }

    const combinedText = `${questTitle} ${questDescription}`.toLowerCase()

    for (const goal of synergisticGoals) {
        const keywords = goalKeywords[goal.slug] || []
        const matchCount = keywords.filter(kw => combinedText.includes(kw)).length

        // If at least 1 keyword matches, include this goal
        if (matchCount > 0) {
            contributions.push({
                goalId: goal.id,
                contributionWeight: goal.contribution_weight,
                synergyType: goal.synergy_type
            })
        }
    }

    return contributions
}
