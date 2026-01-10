# LifeNexus - Tech Stack

> Bu dosya projenin teknoloji yığınını donduran referans belgesidir.
> AI Asistanı yeni kütüphane eklemeden önce bu listeye bakmalıdır.

---

## Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Next.js** | 16.x | App Router, SSR, API Routes |
| **React** | 19.x | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Utility-first Styling |
| **Framer Motion** | - | Animasyonlar (henüz eklenmedi) |

### Next.js Konfigürasyonu
- App Router (src/app/)
- Server Components (varsayılan)
- Client Components ('use client' directive)
- Turbopack (dev mode)

---

## 3D / WebGL

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Three.js** | ^0.177.x | 3D Engine |
| **React Three Fiber** | ^9.x | React wrapper for Three.js |
| **Drei** | ^10.x | R3F helpers (OrbitControls, Stars, etc.) |

### 3D Konfigürasyonu
```tsx
// Scene.tsx - Temel ayarlar
<Canvas
  dpr={isMobile ? [1, 1.5] : [1, 2]}
  shadows={!isMobile}
  gl={{
    antialias: !isMobile,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  }}
/>
```

---

## Backend / Database

| Teknoloji | Kullanım Amacı |
|-----------|----------------|
| **Supabase** | BaaS Platform |
| ├─ Auth | Email/Password, OAuth |
| ├─ PostgreSQL | Primary Database |
| ├─ RLS | Row Level Security |
| ├─ Realtime | WebSocket subscriptions |
| └─ Storage | File uploads (future) |

### Supabase Client Lokasyonları
```
src/utils/supabase/
├── client.ts      # Browser client
├── server.ts      # Server Components/Actions
└── middleware.ts  # Auth session refresh
```

---

## State Management

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Zustand** | - | Global UI state (henüz eklenmedi) |
| **React Query** | - | Server state cache (henüz eklenmedi) |
| **React State** | - | Local component state |

### Mevcut State Yönetimi
- `useState` - Component-level state
- `useCallback` - Memoized callbacks
- Props drilling - Parent-to-child

---

## Form & Validation

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **react-hook-form** | ^7.x | Form management |
| **zod** | ^3.x | Schema validation |
| **@hookform/resolvers** | ^5.x | RHF + Zod integration |

---

## Charts & Visualization

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Recharts** | ^2.x | Data visualization |
| **date-fns** | ^4.x | Date formatting |

---

## UI Components

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **lucide-react** | ^0.5.x | Icon library |
| **shadcn/ui** | - | UI Components (Radix UI based) |
| **clsx** | - | Conditional classes |
| **tailwind-merge** | - | CSS merging utility |
| **cva** | - | Varianted components |

---

## Deployment

| Platform | Kullanım |
|----------|----------|
| **Vercel** | Frontend hosting |
| **Supabase Cloud** | Database hosting |
| **PWA** | Progressive Web App |

### PWA Konfigürasyonu
- `public/manifest.json` - App manifest
- `src/app/layout.tsx` - Meta tags
- Service Worker (henüz eklenmedi)

---

## Geliştirme Araçları

| Araç | Kullanım |
|------|----------|
| **pnpm / npm** | Package manager |
| **ESLint** | Linting |
| **Prettier** | Formatting (henüz eklenmedi) |
| **TypeScript** | Type checking |

---

## Planlanan Eklemeler

| Teknoloji | Ne Zaman | Neden |
|-----------|----------|-------|
| Zustand | Sprint 2 | Global state için |
| React Query | Sprint 2 | Supabase cache için |
| Framer Motion | Sprint 3 | Page transitions |
| Service Worker | Sprint 3 | Offline support |

---

**Son Güncelleme:** 2026-01-10
**Versiyon:** 1.0.0
