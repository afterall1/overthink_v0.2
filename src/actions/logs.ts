'use server'

import { getAuthenticatedClient, ensureDemoUserExists } from '@/lib/auth'
import { LogInsert, Log, CategorySlug, Json } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

// Flag to track if demo user check has been done this session
let demoUserChecked = false

/**
 * Initialize demo user if needed (called once per session)
 */
async function initDemoUser(): Promise<void> {
    if (demoUserChecked) return

    await ensureDemoUserExists()
    demoUserChecked = true
}

/**
 * Fetch logs by date range
 */
export async function getLogsByDateRange(startDate: string, endDate: string): Promise<Log[]> {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('logs')
        .select(`
            *,
            categories (
                slug
            )
        `)
        .eq('user_id', user.id)
        .gte('logged_at', startDate)
        .lte('logged_at', endDate)
        .order('logged_at', { ascending: false })

    if (error) {
        console.error('Error fetching logs:', error)
        return []
    }

    return data || []
}

/**
 * Create a new log entry
 */
export async function createLog(
    categorySlug: CategorySlug,
    data: Record<string, unknown>,
    sentiment: number
): Promise<Log | null> {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    // First, get the category ID from slug
    const { data: category, error: categoryError } = await client
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

    if (categoryError || !category) {
        console.error('Error finding category:', categoryError)
        throw new Error(`Unknown category: ${categorySlug}`)
    }

    // Create the log entry
    const logInsert: LogInsert = {
        user_id: user.id,
        category_id: category.id,
        data: data as Json,
        sentiment: sentiment,
        logged_at: new Date().toISOString(),
    }

    const { data: newLog, error } = await client
        .from('logs')
        .insert(logInsert)
        .select()
        .single()

    if (error) {
        console.error('Error creating log:', error)
        throw error
    }

    revalidatePath('/')
    return newLog
}

/**
 * Delete a log entry
 */
export async function deleteLog(id: string): Promise<void> {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { error } = await client
        .from('logs')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting log:', error)
        throw error
    }

    revalidatePath('/')
}

/**
 * Get category slug from category_id (helper for UI)
 */
export async function getCategorySlugById(categoryId: string): Promise<CategorySlug | null> {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('categories')
        .select('slug')
        .eq('id', categoryId)
        .single()

    if (error || !data) {
        console.error('Error fetching category:', error)
        return null
    }

    return data.slug as CategorySlug
}
