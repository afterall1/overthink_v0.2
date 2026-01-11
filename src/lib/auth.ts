/**
 * LifeNexus Centralized Auth Utility
 * 
 * This module provides a unified authentication layer for all server actions.
 * It handles authenticated users via Supabase Auth with proper RLS enforcement.
 * 
 * @module lib/auth
 */

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// =====================================================
// TYPES
// =====================================================

export interface AuthUser {
    id: string
    email: string | null
    fullName: string | null
}

export interface AuthenticatedClient {
    client: SupabaseClient<Database>
    user: AuthUser
}

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    return mapUser(user)
}

/**
 * Require authentication - redirects to login if not authenticated
 * Use this at the top of protected pages/actions
 */
export async function requireAuth(): Promise<AuthUser> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return mapUser(user)
}

/**
 * Get the Supabase client and authenticated user for database operations.
 * Throws an error if not authenticated.
 * 
 * This is the PRIMARY function to use in all server actions.
 */
export async function getAuthenticatedClient(): Promise<AuthenticatedClient> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new AuthenticationError('User not authenticated')
    }

    return {
        client: supabase,
        user: mapUser(user)
    }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Map Supabase User to AuthUser
 */
function mapUser(user: User): AuthUser {
    return {
        id: user.id,
        email: user.email ?? null,
        fullName: user.user_metadata?.full_name ?? null
    }
}

// =====================================================
// ERROR CLASSES
// =====================================================

export class AuthenticationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'AuthenticationError'
    }
}
