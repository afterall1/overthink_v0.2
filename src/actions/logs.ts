'use server'

import { createClient } from '@/utils/supabase/server'
import { LogInsert, Log, CategorySlug, Json } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

// Category ID mapping (these should match your Supabase categories table)
const CATEGORY_SLUGS_TO_IDS: Record<CategorySlug, string> = {
    trade: '11111111-1111-1111-1111-111111111111',
    food: '22222222-2222-2222-2222-222222222222',
    sport: '33333333-3333-3333-3333-333333333333',
    dev: '44444444-4444-4444-4444-444444444444',
    etsy: '55555555-5555-5555-5555-555555555555',
    gaming: '66666666-6666-6666-6666-666666666666',
}

/**
 * Fetch logs by date range
 */
export async function getLogsByDateRange(startDate: string, endDate: string): Promise<Log[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('logs')
        .select(`
            *,
            categories (
                slug
            )
        `)
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
    const supabase = await createClient()

    // First, get the category ID from slug
    const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', categorySlug)
        .single()

    if (categoryError || !category) {
        console.error('Error finding category:', categoryError)
        // Fallback to hardcoded ID if category lookup fails
        const fallbackId = CATEGORY_SLUGS_TO_IDS[categorySlug]
        if (!fallbackId) {
            throw new Error(`Unknown category: ${categorySlug}`)
        }
    }

    const categoryId = category?.id || CATEGORY_SLUGS_TO_IDS[categorySlug]

    // Create the log entry
    // Note: user_id is required by RLS, but we're using dev bypass for now
    const logInsert: LogInsert = {
        user_id: '00000000-0000-0000-0000-000000000000', // Dev placeholder (RLS bypass handles this)
        category_id: categoryId,
        data: data as Json,
        sentiment: sentiment,
        logged_at: new Date().toISOString(),
    }

    const { data: newLog, error } = await supabase
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
    const supabase = await createClient()

    const { error } = await supabase
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
    const supabase = await createClient()

    const { data, error } = await supabase
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
