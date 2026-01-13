'use server'

// =====================================================
// AI Council Server Actions
// =====================================================

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    generateCompletion,
    getDailySummary,
    getWeeklySummary,
    getTaskContext,
    buildPromptContext,
    AI_CONFIG,
    type AIResponse
} from '@/lib/ai'
import { buildTaskAdvisorPrompt, TASK_ADVISOR_SYSTEM_PROMPT } from '@/lib/ai/prompts/taskAdvisor'
import { buildLifeCoachPrompt, LIFE_COACH_SYSTEM_PROMPT } from '@/lib/ai/prompts/lifeCoach'
import type { Json } from '@/types/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'

// =====================================================
// Type Bypass for tables not yet in generated types
// These will be resolved when migration is applied and types regenerated
// =====================================================

// Helper to bypass Supabase table type checking
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromTable(client: SupabaseClient<any>, table: string) {
    return client.from(table)
}

// =====================================================
// Types
// =====================================================

export type CouncilMember = 'task_advisor' | 'life_coach'
export type InsightType = 'daily' | 'weekly' | 'task_specific'

interface AIInsightResult {
    success: boolean
    content: string
    cached: boolean
    error?: string
}

interface ConversationMessage {
    role: 'user' | 'assistant'
    content: string
    timestamp: string
}

// =====================================================
// Task Advisor Actions
// =====================================================

/**
 * Get AI advice for a specific task/event
 */
export async function getTaskAdvice(
    eventId: string,
    userQuery: string
): Promise<AIInsightResult> {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, content: '', cached: false, error: 'Not authenticated' }
    }

    try {
        // Get task context
        const taskContext = await getTaskContext(user.id, eventId)
        if (!taskContext) {
            return { success: false, content: '', cached: false, error: 'Event not found' }
        }

        // Build context string
        const contextString = buildPromptContext(taskContext)

        // Build prompt
        const messages = buildTaskAdvisorPrompt(
            TASK_ADVISOR_SYSTEM_PROMPT,
            contextString,
            userQuery
        )

        // Generate AI response
        const response = await generateCompletion(messages)

        if (!response.success) {
            return { success: false, content: '', cached: false, error: response.error }
        }

        // Save to conversation history
        await saveConversation(user.id, 'task_advisor', [
            { role: 'user', content: userQuery, timestamp: new Date().toISOString() },
            { role: 'assistant', content: response.content, timestamp: new Date().toISOString() }
        ], { eventId, context: contextString })

        return {
            success: true,
            content: response.content,
            cached: false
        }
    } catch (error) {
        console.error('[getTaskAdvice Error]:', error)
        return {
            success: false,
            content: '',
            cached: false,
            error: 'Failed to get task advice'
        }
    }
}

// =====================================================
// Life Coach Actions
// =====================================================

/**
 * Get daily positive insights
 */
export async function getDailyInsights(
    date?: string
): Promise<AIInsightResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, content: '', cached: false, error: 'Not authenticated' }
    }

    const targetDate = date ?? new Date().toISOString().split('T')[0]

    try {
        // Check cache first
        const cached = await getCachedInsight(user.id, 'daily', targetDate)
        if (cached) {
            return { success: true, content: cached, cached: true }
        }

        // Get daily summary
        const summary = await getDailySummary(user.id, targetDate)

        // Skip if no activities
        if (summary.totalActivities === 0) {
            return {
                success: true,
                content: 'Bugün henüz kayıtlı aktivite yok. Bir şeyler ekleyince seni değerlendirebilirim! 🌟',
                cached: false
            }
        }

        // Build context
        const contextString = buildPromptContext(summary)

        // Build prompt
        const messages = buildLifeCoachPrompt(
            LIFE_COACH_SYSTEM_PROMPT,
            contextString,
            'daily'
        )

        // Generate AI response
        const response = await generateCompletion(messages)

        if (!response.success) {
            return { success: false, content: '', cached: false, error: response.error }
        }

        // Cache the insight
        await cacheInsight(user.id, 'daily', response.content, targetDate)

        return {
            success: true,
            content: response.content,
            cached: false
        }
    } catch (error) {
        console.error('[getDailyInsights Error]:', error)
        return {
            success: false,
            content: '',
            cached: false,
            error: 'Failed to get daily insights'
        }
    }
}

/**
 * Get weekly positive insights
 */
export async function getWeeklyInsights(): Promise<AIInsightResult> {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { success: false, content: '', cached: false, error: 'Not authenticated' }
    }

    try {
        // Check cache first
        const weekKey = getWeekKey()
        const cached = await getCachedInsight(user.id, 'weekly', weekKey)
        if (cached) {
            return { success: true, content: cached, cached: true }
        }

        // Get weekly summary
        const summary = await getWeeklySummary(user.id)

        // Skip if no activities
        if (summary.totalLogs === 0 && summary.totalEvents === 0) {
            return {
                success: true,
                content: 'Bu hafta henüz kayıtlı aktivite yok. Haydi biraz hareketlenelim! 💪',
                cached: false
            }
        }

        // Build context
        const contextString = buildPromptContext(summary)

        // Build prompt
        const messages = buildLifeCoachPrompt(
            LIFE_COACH_SYSTEM_PROMPT,
            contextString,
            'weekly'
        )

        // Generate AI response
        const response = await generateCompletion(messages)

        if (!response.success) {
            return { success: false, content: '', cached: false, error: response.error }
        }

        // Cache the insight
        await cacheInsight(user.id, 'weekly', response.content, weekKey)

        return {
            success: true,
            content: response.content,
            cached: false
        }
    } catch (error) {
        console.error('[getWeeklyInsights Error]:', error)
        return {
            success: false,
            content: '',
            cached: false,
            error: 'Failed to get weekly insights'
        }
    }
}

// =====================================================
// Conversation History Actions
// =====================================================

/**
 * Get conversation history with a council member
 */
export async function getConversationHistory(
    councilMember: CouncilMember,
    limit: number = 10
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return []
    }

    const { data } = await fromTable(supabase, 'ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('council_member', councilMember)
        .order('created_at', { ascending: false })
        .limit(limit)

    return (data as Array<{ messages: unknown }>) ?? []
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Save conversation to database
 */
async function saveConversation(
    userId: string,
    councilMember: CouncilMember,
    messages: ConversationMessage[],
    contextData?: Record<string, unknown>
): Promise<void> {
    const supabase = await createClient()

    await fromTable(supabase, 'ai_conversations')
        .insert({
            user_id: userId,
            council_member: councilMember,
            messages: messages as unknown as Json,
            context_data: (contextData ?? null) as unknown as Json
        })

    revalidatePath('/')
}

/**
 * Get cached insight if valid
 */
async function getCachedInsight(
    userId: string,
    insightType: InsightType,
    dateKey: string
): Promise<string | null> {
    const supabase = await createClient()

    const { data } = await fromTable(supabase, 'ai_insights')
        .select('content, valid_until')
        .eq('user_id', userId)
        .eq('insight_type', insightType)
        .contains('metadata', { dateKey })
        .single() as { data: { content: string; valid_until: string | null } | null }

    if (!data) return null

    // Check if still valid
    if (data.valid_until && new Date(data.valid_until) < new Date()) {
        return null
    }

    return data.content
}

/**
 * Cache insight for future use
 */
async function cacheInsight(
    userId: string,
    insightType: InsightType,
    content: string,
    dateKey: string
): Promise<void> {
    const supabase = await createClient()

    // Calculate expiration
    const cacheHours = AI_CONFIG.insightCacheHours[insightType]
    const validUntil = new Date()
    validUntil.setHours(validUntil.getHours() + cacheHours)

    await fromTable(supabase, 'ai_insights')
        .insert({
            user_id: userId,
            insight_type: insightType,
            content,
            metadata: { dateKey } as unknown as Json,
            valid_until: validUntil.toISOString()
        })
}

/**
 * Get current week key for caching
 */
function getWeekKey(): string {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const diff = now.getTime() - startOfYear.getTime()
    const oneWeek = 1000 * 60 * 60 * 24 * 7
    const weekNumber = Math.floor(diff / oneWeek)
    return `${now.getFullYear()}-W${weekNumber}`
}
