# LifeNexus - Authentication Architecture

> Bu dosya authentication sisteminin teknik dokümantasyonudur.
> AI Asistanı auth ile ilgili değişiklik yapmadan önce bu dosyayı okumalıdır.

---

## Overview

LifeNexus, **Supabase Auth** tabanlı bir kimlik doğrulama sistemi kullanır.

```
┌─────────────────────────────────────────────────────┐
│                   LifeNexus Auth                     │
├─────────────────────────────────────────────────────┤
│  Primary: Email/Password Authentication              │
│  Secondary: Magic Link (passwordless email)          │
│  Future: OAuth Providers (Google, Apple)             │
├─────────────────────────────────────────────────────┤
│  Session: HTTP-only cookies (web)                    │
│  Token Refresh: Automatic via middleware             │
│  RLS: auth.uid() in all policies                     │
└─────────────────────────────────────────────────────┘
```

---

## Auth Flow

### 1. Registration Flow
```
[User] → /register → [Supabase Auth] → [Email Verification] → [Login]
         │
         ├── fullName
         ├── email
         ├── password (8+ chars, uppercase, lowercase, number)
         └── confirmPassword
```

### 2. Login Flow
```
[User] → /login → [Mode Selection]
                    │
                    ├── Password Mode → [signInWithPassword] → [Session Cookie] → /
                    │
                    └── Magic Link Mode → [signInWithOtp] → [Email] → /auth/callback → /
```

### 3. Password Reset Flow
```
[User] → /forgot-password → [resetPasswordForEmail] → [Email] → /auth/callback?type=recovery
```

---

## File Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth Route Group (shared layout)
│   │   ├── layout.tsx             # Centered glassmorphism card layout
│   │   ├── login/
│   │   │   └── page.tsx           # Login with Password/Magic Link toggle
│   │   ├── register/
│   │   │   └── page.tsx           # Registration with password strength
│   │   └── forgot-password/
│   │       └── page.tsx           # Password reset request
│   │
│   └── auth/
│       └── callback/
│           └── route.ts           # OAuth/Magic Link callback handler
│
├── lib/
│   └── auth.ts                    # Centralized auth utilities
│
├── utils/
│   └── supabase/
│       ├── client.ts              # Browser client
│       ├── server.ts              # Server client + Admin client
│       └── middleware.ts          # Protected route logic
│
└── middleware.ts                  # Next.js middleware entry point
```

---

## Key Functions

### `src/lib/auth.ts`

| Function | Description |
|----------|-------------|
| `getCurrentUser()` | Returns AuthUser or null if not authenticated |
| `requireAuth()` | Redirects to /login if not authenticated |
| `getAuthenticatedClient()` | Returns Supabase client + user for server actions |
| `signOut()` | Signs out and redirects to /login |

### Usage in Server Actions

```typescript
// ✅ CORRECT - Use getAuthenticatedClient for all DB operations
export async function createSomething(data: SomeData) {
    const { client, user } = await getAuthenticatedClient()
    
    const { data: result, error } = await client
        .from('some_table')
        .insert({ ...data, user_id: user.id })
        .select()
        .single()
    
    if (error) throw error
    return result
}
```

---

## Protected Routes

### Middleware Logic (`src/utils/supabase/middleware.ts`)

| Route Pattern | Behavior |
|---------------|----------|
| `/login`, `/register`, `/forgot-password` | Public (guest only) |
| `/auth/callback` | Public (OAuth/Magic Link) |
| Everything else (`/`, `/analytics`, etc.) | Protected (redirects to /login) |

### Redirect Rules

```
Unauthenticated + Protected Route → /login?next=[original_path]
Authenticated + Auth Page → /
```

---

## Session Management

### Cookie Configuration

| Property | Value |
|----------|-------|
| Type | HTTP-only (XSS protection) |
| SameSite | Lax (CSRF protection) |
| Secure | true (HTTPS only in production) |
| Lifetime | Controlled by Supabase (default 1 week) |

### Token Refresh

Middleware automatically refreshes the session on every request via `supabase.auth.getUser()`.

---

## Security Measures

| Threat | Mitigation |
|--------|------------|
| XSS Token Theft | HTTP-only cookies, no localStorage |
| CSRF | SameSite cookies, origin verification |
| Brute Force | Supabase built-in rate limiting |
| Session Hijacking | Short-lived access tokens, refresh rotation |
| Weak Passwords | Client-side validation (8+ chars, mixed case, number) |

---

## Supabase Dashboard Configuration

> ⚠️ These settings must be configured in Supabase Dashboard

| Setting | Location | Recommended Value |
|---------|----------|-------------------|
| Email Confirm | Auth → Settings | Dev: OFF, Prod: ON |
| Site URL | Auth → URL Config | `http://localhost:3000` (dev) |
| Redirect URLs | Auth → URL Config | `http://localhost:3000/auth/callback` |
| Password Min Length | Auth → Settings | 8 |

---

## Future Enhancements

| Feature | Status | Notes |
|---------|--------|-------|
| Google OAuth | ⏳ Pending | Requires Google Cloud Console |
| Apple Sign-In | ⏳ Pending | Requires Apple Developer Account |
| MFA/2FA | ⏳ Pending | Supabase supports TOTP |
| Password Reset Page | ⏳ Pending | `/reset-password` with new password form |

---

**Son Güncelleme:** 2026-01-12
**Versiyon:** 1.0.0
