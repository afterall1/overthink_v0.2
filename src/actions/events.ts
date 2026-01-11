'use server'

import { getAuthenticatedClient, ensureDemoUserExists } from '@/lib/auth'
import { EventInsert, EventUpdate } from '@/types/database.types'
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

export async function getEventsByDateRange(startDate: string, endDate: string) {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('events')
        .select(`
            *,
            categories (
                id,
                name,
                slug,
                color_code,
                icon_slug
            )
        `)
        .eq('user_id', user.id)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    return data
}

export async function createEvent(event: Omit<EventInsert, 'user_id'>) {
    await initDemoUser()
    const { client, user } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('events')
        .insert({
            ...event,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error("Supabase Create Error:", error)
        throw error
    }

    revalidatePath('/')
    return data
}

export async function updateEventStatus(id: string, status: EventUpdate['status']) {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { error } = await client
        .from('events')
        .update({ status })
        .eq('id', id)

    if (error) throw error

    revalidatePath('/')
}

export async function updateEvent(id: string, eventData: EventUpdate) {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { data, error } = await client
        .from('events')
        .update({
            ...eventData,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error("Supabase Update Error:", error)
        throw error
    }

    revalidatePath('/')
    return data
}

export async function deleteEvent(id: string) {
    await initDemoUser()
    const { client } = await getAuthenticatedClient()

    const { error } = await client
        .from('events')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Supabase Delete Error:", error)
        throw error
    }

    revalidatePath('/')
}
