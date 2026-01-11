/**
 * LifeNexus Centralized Auth Utility
 * 
 * This module provides a unified authentication layer for all server actions.
 * It handles both authenticated users (via Supabase Auth) and demo mode (pre-auth development).
 * 
 * @module lib/auth
 */

import { createClient, createAdminClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// =====================================================
// CONSTANTS
// =====================================================

/**
 * Demo user email for identification
 */
export const DEMO_USER_EMAIL = 'demo@lifenexus.local'

// =====================================================
// TYPES
// =====================================================

export interface AuthUser {
    id: string
    email: string | null
    isDemo: boolean
}

export interface AuthenticatedClient {
    client: SupabaseClient<Database>
    user: AuthUser
}

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Check if the application is running in demo mode (no authenticated user)
 */
export async function isDemoMode(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return !user
}

/**
 * Get or create the demo user and return its ID
 * This checks public.users first (faster), then auth.users if needed
 */
async function getDemoUserId(): Promise<string> {
    const adminClient = createAdminClient()

    // First check public.users table (faster than auth.admin.listUsers)
    const { data: publicUser } = await adminClient
        .from('users')
        .select('id')
        .eq('email', DEMO_USER_EMAIL)
        .single()

    if (publicUser) {
        return publicUser.id
    }

    // User doesn't exist in public.users, need to create via Auth Admin API
    // First check if exists in auth.users (might be there without public.users entry)
    const { data: existingUsers } = await adminClient.auth.admin.listUsers()
    const existingDemoUser = existingUsers?.users?.find(u => u.email === DEMO_USER_EMAIL)

    if (existingDemoUser) {
        // Auth user exists but public.users entry missing - create it
        const { error: insertError } = await adminClient
            .from('users')
            .insert({
                id: existingDemoUser.id,
                email: DEMO_USER_EMAIL,
                full_name: 'Demo User',
                avatar_url: null
            })

        if (insertError && !insertError.message.includes('duplicate')) {
            console.error('Failed to create public.users entry:', insertError)
        }

        return existingDemoUser.id
    }

    // Create new demo user via Auth Admin API
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: DEMO_USER_EMAIL,
        password: 'demo-password-not-for-login-1234!',
        email_confirm: true,
        user_metadata: {
            full_name: 'Demo User',
            is_demo: true
        }
    })

    if (authError) {
        console.error('Failed to create demo user in auth.users:', authError)
        throw new Error(`Failed to create demo user: ${authError.message}`)
    }

    if (!authUser?.user?.id) {
        throw new Error('Demo user created but no ID returned')
    }

    console.log('✅ Demo user created successfully with ID:', authUser.user.id)
    return authUser.user.id
}

/**
 * Get the current authenticated user or demo user
 * 
 * @returns AuthUser object with id, email, and isDemo flag
 */
export async function getCurrentUser(): Promise<AuthUser> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        return {
            id: user.id,
            email: user.email ?? null,
            isDemo: false
        }
    }

    // Demo mode - get or create demo user
    const demoUserId = await getDemoUserId()
    return {
        id: demoUserId,
        email: DEMO_USER_EMAIL,
        isDemo: true
    }
}

/**
 * Get the appropriate Supabase client and user for database operations.
 * 
 * - If user is authenticated: Returns regular client (RLS applies)
 * - If demo mode: Returns admin client (RLS bypassed) with demo user
 * 
 * This is the PRIMARY function to use in all server actions.
 * 
 * @returns Object containing Supabase client and current user
 */
export async function getAuthenticatedClient(): Promise<AuthenticatedClient> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Authenticated user - use regular client (RLS applies)
    if (user) {
        return {
            client: supabase,
            user: {
                id: user.id,
                email: user.email ?? null,
                isDemo: false
            }
        }
    }

    // Demo mode - get or create demo user and use admin client
    const demoUserId = await getDemoUserId()

    return {
        client: createAdminClient(),
        user: {
            id: demoUserId,
            email: DEMO_USER_EMAIL,
            isDemo: true
        }
    }
}

/**
 * Ensure demo user exists in the database.
 * This is now handled automatically by getDemoUserId().
 * Kept for backwards compatibility.
 */
export async function ensureDemoUserExists(): Promise<boolean> {
    try {
        await getDemoUserId()
        return true
    } catch (error) {
        console.error('Error ensuring demo user exists:', error)
        return false
    }
}

// =====================================================
// LEGACY COMPATIBILITY (for gradual migration)
// =====================================================

/**
 * @deprecated Use getAuthenticatedClient() instead
 * Legacy function for backwards compatibility with goals.ts
 */
export async function getSupabaseClientWithUser() {
    const { client, user } = await getAuthenticatedClient()
    return { client, userId: user.id }
}
