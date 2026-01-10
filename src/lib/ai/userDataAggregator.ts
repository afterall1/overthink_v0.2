// =====================================================
// User Data Aggregator for AI Context
// =====================================================

import { createClient } from '@/utils/supabase/server'
import type { Log, Event, Category } from '@/types/database.types'

/**
 * Daily summary structure
 */
export interface DailySummary {
    date: string
    logs: LogWithCategory[]
    events: EventWithCategory[]
    totalActivities: number
    categoryBreakdown: CategoryBreakdown[]
    averageSentiment: number | null
}

/**
 * Weekly summary structure
 */
export interface WeeklySummary {
    startDate: string
    endDate: string
    dailySummaries: DailySummary[]
    totalLogs: number
    totalEvents: number
    completedEvents: number
    categoryTotals: CategoryBreakdown[]
    sentimentTrend: number[]
    topCategories: string[]
}

/**
 * Task context for specific event
 */
export interface TaskContext {
    event: EventWithCategory
    relatedLogs: LogWithCategory[]
    categoryHistory: LogWithCategory[]
    completionRate: number
}

/**
 * Category breakdown stats
 */
export interface CategoryBreakdown {
    categoryId: string
    categoryName: string
    categorySlug: string
    count: number
    percentage: number
}

// Extended types with category info
type LogWithCategory = Log & { categories: Pick<Category, 'name' | 'slug' | 'color_code'> | null }
type EventWithCategory = Event & { categories: Pick<Category, 'name' | 'slug' | 'color_code'> | null }

/**
 * Get daily summary for a specific date
 */
export async function getDailySummary(
    userId: string,
    date: string
): Promise<DailySummary> {
    const supabase = await createClient()

    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    // Fetch logs for the day
    const { data: logs } = await supabase
        .from('logs')
        .select('*, categories(name, slug, color_code)')
        .eq('user_id', userId)
        .gte('logged_at', startOfDay)
        .lte('logged_at', endOfDay)
        .order('logged_at', { ascending: false })

    // Fetch events for the day
    const { data: events } = await supabase
        .from('events')
        .select('*, categories(name, slug, color_code)')
        .eq('user_id', userId)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true })

    const typedLogs = (logs ?? []) as LogWithCategory[]
    const typedEvents = (events ?? []) as EventWithCategory[]

    // Calculate category breakdown
    const categoryBreakdown = calculateCategoryBreakdown(typedLogs)

    // Calculate average sentiment
    const sentiments = typedLogs
        .map(l => l.sentiment)
        .filter((s): s is number => s !== null)
    const averageSentiment = sentiments.length > 0
        ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length
        : null

    return {
        date,
        logs: typedLogs,
        events: typedEvents,
        totalActivities: typedLogs.length + typedEvents.length,
        categoryBreakdown,
        averageSentiment
    }
}

/**
 * Get weekly summary (last 7 days)
 */
export async function getWeeklySummary(userId: string): Promise<WeeklySummary> {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)

    const dailySummaries: DailySummary[] = []
    const sentimentTrend: number[] = []

    // Get each day's summary
    for (let i = 0; i < 7; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        const summary = await getDailySummary(userId, dateStr)
        dailySummaries.push(summary)

        if (summary.averageSentiment !== null) {
            sentimentTrend.push(summary.averageSentiment)
        }
    }

    // Aggregate totals
    const totalLogs = dailySummaries.reduce((sum, d) => sum + d.logs.length, 0)
    const totalEvents = dailySummaries.reduce((sum, d) => sum + d.events.length, 0)
    const completedEvents = dailySummaries.reduce(
        (sum, d) => sum + d.events.filter(e => e.status === 'completed').length,
        0
    )

    // Aggregate category totals
    const categoryMap = new Map<string, CategoryBreakdown>()
    for (const summary of dailySummaries) {
        for (const cat of summary.categoryBreakdown) {
            const existing = categoryMap.get(cat.categoryId)
            if (existing) {
                existing.count += cat.count
            } else {
                categoryMap.set(cat.categoryId, { ...cat })
            }
        }
    }
    const categoryTotals = Array.from(categoryMap.values())
    categoryTotals.forEach(cat => {
        cat.percentage = totalLogs > 0 ? (cat.count / totalLogs) * 100 : 0
    })

    // Top categories
    const topCategories = categoryTotals
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(c => c.categoryName)

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        dailySummaries,
        totalLogs,
        totalEvents,
        completedEvents,
        categoryTotals,
        sentimentTrend,
        topCategories
    }
}

/**
 * Get context for a specific task/event
 */
export async function getTaskContext(
    userId: string,
    eventId: string
): Promise<TaskContext | null> {
    const supabase = await createClient()

    // Fetch the event
    const { data: event } = await supabase
        .from('events')
        .select('*, categories(name, slug, color_code)')
        .eq('id', eventId)
        .eq('user_id', userId)
        .single()

    if (!event) return null

    const typedEvent = event as EventWithCategory

    // Fetch related logs (same day)
    const eventDate = new Date(typedEvent.scheduled_at)
    const startOfDay = new Date(eventDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(eventDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data: relatedLogs } = await supabase
        .from('logs')
        .select('*, categories(name, slug, color_code)')
        .eq('user_id', userId)
        .gte('logged_at', startOfDay.toISOString())
        .lte('logged_at', endOfDay.toISOString())
        .order('logged_at', { ascending: false })

    // Fetch category history (last 10 logs in same category)
    let categoryHistory: LogWithCategory[] = []
    if (typedEvent.category_id) {
        const { data: catLogs } = await supabase
            .from('logs')
            .select('*, categories(name, slug, color_code)')
            .eq('user_id', userId)
            .eq('category_id', typedEvent.category_id)
            .order('logged_at', { ascending: false })
            .limit(10)

        categoryHistory = (catLogs ?? []) as LogWithCategory[]
    }

    // Calculate completion rate for similar events
    let completionRate = 0
    if (typedEvent.category_id) {
        const { data: similarEvents } = await supabase
            .from('events')
            .select('status')
            .eq('user_id', userId)
            .eq('category_id', typedEvent.category_id)
            .lt('scheduled_at', typedEvent.scheduled_at)
            .limit(20)

        const completed = (similarEvents ?? []).filter(e => e.status === 'completed').length
        completionRate = similarEvents && similarEvents.length > 0
            ? (completed / similarEvents.length) * 100
            : 0
    }
    return {
        event: typedEvent,
        relatedLogs: (relatedLogs ?? []) as LogWithCategory[],
        categoryHistory,
        completionRate
    }
}

/**
 * Build prompt context string from aggregated data
 */
export function buildPromptContext(data: DailySummary | WeeklySummary | TaskContext): string {
    if ('dailySummaries' in data) {
        // Weekly summary
        return buildWeeklyContext(data)
    } else if ('event' in data) {
        // Task context
        return buildTaskContextString(data)
    } else {
        // Daily summary
        return buildDailyContext(data)
    }
}

function buildDailyContext(summary: DailySummary): string {
    const lines: string[] = [
        `📅 Tarih: ${summary.date}`,
        `📊 Toplam Aktivite: ${summary.totalActivities}`,
        ''
    ]

    if (summary.averageSentiment !== null) {
        lines.push(`😊 Ortalama Ruh Hali: ${summary.averageSentiment.toFixed(1)}/10`)
    }

    if (summary.categoryBreakdown.length > 0) {
        lines.push('\n📂 Kategori Dağılımı:')
        summary.categoryBreakdown.forEach(cat => {
            lines.push(`  - ${cat.categoryName}: ${cat.count} aktivite (${cat.percentage.toFixed(0)}%)`)
        })
    }

    if (summary.events.length > 0) {
        lines.push('\n📋 Günün Planları:')
        summary.events.forEach(event => {
            const status = event.status === 'completed' ? '✅' : event.status === 'skipped' ? '⏭️' : '⏳'
            lines.push(`  ${status} ${event.title}`)
        })
    }

    return lines.join('\n')
}

function buildWeeklyContext(summary: WeeklySummary): string {
    const lines: string[] = [
        `📅 Haftalık Özet: ${summary.startDate} - ${summary.endDate}`,
        `📊 Toplam Log: ${summary.totalLogs}`,
        `📋 Toplam Plan: ${summary.totalEvents}`,
        `✅ Tamamlanan: ${summary.completedEvents}`,
        ''
    ]

    if (summary.topCategories.length > 0) {
        lines.push(`🏆 En Aktif Kategoriler: ${summary.topCategories.join(', ')}`)
    }

    if (summary.sentimentTrend.length > 0) {
        const avg = summary.sentimentTrend.reduce((a, b) => a + b, 0) / summary.sentimentTrend.length
        lines.push(`😊 Haftalık Ruh Hali Ortalaması: ${avg.toFixed(1)}/10`)
    }

    return lines.join('\n')
}

function buildTaskContextString(context: TaskContext): string {
    const lines: string[] = [
        `🎯 Görev: ${context.event.title}`,
        `📂 Kategori: ${context.event.categories?.name ?? 'Genel'}`,
        `📅 Tarih: ${new Date(context.event.scheduled_at).toLocaleDateString('tr-TR')}`,
        `⏱️ Süre: ${context.event.duration_min} dakika`,
        `📈 Benzer Görev Tamamlama Oranı: ${context.completionRate.toFixed(0)}%`,
        ''
    ]

    if (context.event.description) {
        lines.push(`📝 Açıklama: ${context.event.description}`)
    }

    if (context.categoryHistory.length > 0) {
        lines.push(`\n📚 Bu kategorideki son ${context.categoryHistory.length} aktivite mevcut.`)
    }

    return lines.join('\n')
}

/**
 * Calculate category breakdown from logs
 */
function calculateCategoryBreakdown(logs: LogWithCategory[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, CategoryBreakdown>()

    for (const log of logs) {
        const catId = log.category_id
        const existing = categoryMap.get(catId)

        if (existing) {
            existing.count++
        } else {
            categoryMap.set(catId, {
                categoryId: catId,
                categoryName: log.categories?.name ?? 'Unknown',
                categorySlug: log.categories?.slug ?? 'unknown',
                count: 1,
                percentage: 0
            })
        }
    }

    const result = Array.from(categoryMap.values())
    const total = logs.length

    result.forEach(cat => {
        cat.percentage = total > 0 ? (cat.count / total) * 100 : 0
    })

    return result.sort((a, b) => b.count - a.count)
}
