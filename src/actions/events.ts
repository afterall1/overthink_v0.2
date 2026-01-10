'use server'

import { createClient } from '@/utils/supabase/server'
import { EventInsert, EventUpdate } from '@/types/database.types'
import { revalidatePath } from 'next/cache'

export async function getEventsByDateRange(startDate: string, endDate: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
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
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .order('scheduled_at', { ascending: true })

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    return data
}

export async function createEvent(event: EventInsert) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('events')
        .insert(event)
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
    const supabase = await createClient()

    const { error } = await supabase
        .from('events')
        .update({ status })
        .eq('id', id)

    if (error) throw error

    revalidatePath('/')
}

export async function updateEvent(id: string, eventData: EventUpdate) {
    const supabase = await createClient()

    const { data, error } = await supabase
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
    const supabase = await createClient()

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

    if (error) {
        console.error("Supabase Delete Error:", error)
        throw error
    }

    revalidatePath('/')
}
