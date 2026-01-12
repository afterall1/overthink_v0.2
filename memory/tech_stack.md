# LifeNexus - Tech Stack

> Bu dosya projenin teknoloji yığınını donduran referans belgesidir.
> AI Asistanı yeni kütüphane eklemeden önce bu listeye bakmalıdır.

---

## Frontend

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Next.js** | 16.1.1 | App Router, SSR, Server Actions |
| **React** | 19.2.3 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **Tailwind CSS** | 4.x | Utility-first Styling |
| **Framer Motion** | 12.25.0 | ✅ Animasyonlar, gestures |

### Next.js Konfigürasyonu
- App Router (src/app/)
- Server Components (varsayılan)
- Client Components ('use client' directive)
- Turbopack (dev mode)
- Server Actions (src/actions/)

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
| ├─ Auth | Email/Password, Magic Link, OAuth (planned) |
| ├─ PostgreSQL | Primary Database |
| ├─ RLS | Row Level Security |
| ├─ Realtime | WebSocket subscriptions |
| └─ Storage | File uploads (future) |

### Supabase Client Lokasyonları
```
src/utils/supabase/
├── client.ts      # Browser client
├── server.ts      # Server client + Admin client
└── middleware.ts  # Auth session refresh
```

### Supabase Paketler
| Paket | Versiyon |
|-------|----------|
| `@supabase/ssr` | 0.8.0 |
| `@supabase/supabase-js` | 2.90.1 |

---

## AI Integration

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **@google/genai** | 1.35.0 | ✅ Gemini AI API |

### AI Konfigürasyonu
```
src/lib/ai/
├── aiConfig.ts           # Model settings (gemini-2.0-flash)
├── aiService.ts          # Core service layer
├── userDataAggregator.ts # User context builder
└── prompts/              # System prompts
```

### Kullanım
```typescript
import { generateCouncilAdvice } from '@/lib/ai'
const advice = await generateCouncilAdvice(query, userContext)
```

---

## State Management

| Teknoloji | Durum | Kullanım Amacı |
|-----------|-------|----------------|
| **React State** | ✅ Aktif | Local component state |
| **Props** | ✅ Aktif | Parent-to-child data flow |
| **Zustand** | ⏳ Planlanıyor | Global UI state |
| **React Query** | ⏳ Planlanıyor | Server state cache |

### Mevcut State Yönetimi
- `useState` - Component-level state
- `useCallback` - Memoized callbacks
- `useRef` - DOM references, mutable values
- Props drilling - Parent-to-child
- Server Actions - No client cache, revalidate

---

## Form & Validation

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **react-hook-form** | 7.70.0 | Form management |
| **zod** | 4.3.5 | Schema validation |
| **@hookform/resolvers** | 5.2.2 | RHF + Zod integration |

### Kullanım Örneği
```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
    title: z.string().min(1),
    value: z.number().positive()
})

const form = useForm({
    resolver: zodResolver(schema)
})
```

---

## Charts & Visualization

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **Recharts** | 3.6.0 | Data visualization |
| **date-fns** | 4.1.0 | Date formatting & manipulation |

---

## UI Components

| Teknoloji | Versiyon | Kullanım Amacı |
|-----------|----------|----------------|
| **lucide-react** | 0.562.0 | Icon library |
| **shadcn/ui** | - | UI Components (Radix UI based) |
| **@radix-ui/react-slot** | 1.2.4 | Slot component |
| **@radix-ui/react-separator** | 1.1.8 | Separator component |
| **clsx** | 2.1.1 | Conditional classes |
| **tailwind-merge** | 3.4.0 | CSS merging utility |
| **class-variance-authority** | 0.7.1 | Varianted components (cva) |

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
- Service Worker (planlanıyor)

---

## Geliştirme Araçları

| Araç | Versiyon | Kullanım |
|------|----------|----------|
| **npm** | - | Package manager |
| **ESLint** | 9.x | Linting |
| **TypeScript** | 5.x | Type checking |
| **Turbopack** | Built-in | Fast dev builds |

---

## Environment Variables

| Variable | Ortam | Açıklama |
|----------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Admin operations |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Server | Gemini API key |

---

## Dependencies Summary

### Production (package.json)
```json
{
  "@google/genai": "^1.35.0",
  "@hookform/resolvers": "^5.2.2",
  "@radix-ui/react-separator": "^1.1.8",
  "@radix-ui/react-slot": "^1.2.4",
  "@supabase/ssr": "^0.8.0",
  "@supabase/supabase-js": "^2.90.1",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "date-fns": "^4.1.0",
  "framer-motion": "^12.25.0",
  "lucide-react": "^0.562.0",
  "next": "16.1.1",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "react-hook-form": "^7.70.0",
  "recharts": "^3.6.0",
  "tailwind-merge": "^3.4.0",
  "zod": "^4.3.5"
}
```

### Dev Dependencies
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/node": "^20",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "@types/three": "^0.182.0",
  "eslint": "^9",
  "eslint-config-next": "16.1.1",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

---

## Planlanan Eklemeler

| Teknoloji | Ne Zaman | Neden |
|-----------|----------|-------|
| Zustand | Sprint 3 | Global state için |
| React Query | Sprint 3 | Supabase cache için |
| Service Worker | Sprint 4 | Offline support |
| Web Push | Sprint 4 | Notifications |

---

**Son Güncelleme:** 2026-01-12
**Versiyon:** 2.0.0 (framer-motion, @google/genai, güncel versiyonlar)
