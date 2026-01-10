'use server'

import { createClient } from '@/utils/supabase/server'
import type { Category } from '@/types/database.types'

/**
 * Fetch all categories from Supabase
 */
export async function getCategories(): Promise<Category[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data || []
}

/**
 * Get category ID by slug
 */
export async function getCategoryIdBySlug(slug: string): Promise<string | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single()

    if (error || !data) {
        console.error('Error fetching category by slug:', error)
        return null
    }

    return data.id
}
