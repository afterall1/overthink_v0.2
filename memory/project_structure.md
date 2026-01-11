# LifeNexus - Project Structure

> Bu dosya proje klasör yapısını ve dosya konvansiyonlarını tanımlar.
> AI Asistanı yeni dosya oluşturmadan önce bu yapıya uymalıdır.

---

## Klasör Ağacı

```
overthink_v0.2/
│
├── 📁 .cursorrules           # AI governance kuralları
│
├── 📁 memory/                # Teknik dokümantasyon (AI hafızası)
│   ├── active_context.md     # Mevcut sprint durumu
│   ├── tech_stack.md         # Teknoloji yığını
│   ├── database_schema.md    # Veritabanı şeması
│   ├── project_structure.md  # Bu dosya
│   └── ADR.md                # Mimari kararlar
│
├── 📁 public/                # Static assets
│   ├── manifest.json         # PWA manifest
│   ├── favicon.ico           # Favicon
│   └── 📁 icons/             # PWA ikonları
│       ├── icon-192.png
│       └── icon-512.png
│
├── 📁 supabase/              # Supabase konfigürasyonu
│   └── schema.sql            # Veritabanı şeması SQL (events dahil)
│
├── 📁 src/                   # Kaynak kod
│   │
│   ├── 📁 app/               # Next.js App Router
│   │   ├── layout.tsx        # Root layout (PWA meta)
│   │   ├── page.tsx          # Home page (3D + Calendar flow)
│   │   ├── globals.css       # Global stiller
│   │   │
│   │   └── 📁 analytics/     # Analytics route
│   │       └── page.tsx      # Charts page
│   │
│   ├── 📁 components/        # React bileşenleri
│   │   │
│   │   ├── 📁 ui/            # [ATOMS] Shadcn & Temel UI
│   │   │   ├── button.tsx    # Shadcn Button
│   │   │   ├── card.tsx      # Shadcn Card
│   │   │   ├── badge.tsx     # Shadcn Badge
│   │   │   ├── separator.tsx # Shadcn Separator
│   │   │   └── index.ts      # (Opsiyonel)
│   │   │
│   │   ├── 📁 hud/           # [MOLECULES] HUD overlay
│   │   │   ├── 📁 AICouncil/      # [YENİ] AI Assistant UI
│   │   │   │   ├── index.ts
│   │   │   │   ├── CouncilPanel.tsx
│   │   │   │   └── CouncilFAB.tsx
│   │   │   ├── StatusBar.tsx      # Üst progress bar
│   │   │   ├── LoggerModal.tsx    # FAB + log form modal
│   │   │   ├── LogDrawer.tsx      # Sol log paneli
│   │   │   ├── CalendarPicker.tsx # 📅 Global takvim picker (YENİ)
│   │   │   ├── EventModal.tsx     # 📅 Yeni plan formu (YENİ)
│   │   │   ├── EventTimeline.tsx  # 📅 Timeline panel (YENİ)
│   │   │   ├── EventCard.tsx      # 📅 Event kartı (YENİ)
│   │   │   ├── form-schemas.ts    # Zod şemaları
│   │   │   └── index.ts           # Barrel export
│   │   │
│   │   ├── 📁 3d/            # [ORGANISMS] WebGL bileşenleri
│   │   │   ├── Scene.tsx         # Canvas + lighting
│   │   │   ├── Habitat.tsx       # Hexagon sectors
│   │   │   ├── types.ts          # 3D type definitions
│   │   │   └── index.ts
│   │   │
│   │   └── 📁 analytics/     # [ORGANISMS] Chart bileşenleri
│   │       ├── PnLChart.tsx          # Kümülatif PnL
│   │       ├── ConsistencyCalendar.tsx # Zinciri kırma
│   │       ├── CategoryBreakdown.tsx   # Kategori dağılımı
│   │       └── index.ts
│   │
│   ├── 📁 types/             # TypeScript definitions
│   │   └── database.types.ts # Supabase tablo tipleri (Event dahil)
│   │
│   ├── 📁 utils/             # Yardımcı fonksiyonlar
│   │   └── 📁 supabase/      # Supabase clients
│   │       ├── client.ts     # Browser client
│   │       ├── server.ts     # Server client
│   │       └── middleware.ts # Auth helper (demo mode destekli)
│   │
│   ├── 📁 actions/           # Server Actions (YENİ)
│   │   ├── events.ts         # CRUD operations for events
│   │   ├── logs.ts           # CRUD operations for logs
│   │   └── categories.ts     # Fetch categories from Supabase
│   │
│   ├── 📁 hooks/             # Custom React hooks
│   │   └── useIsMobile.ts    # (Scene.tsx içinde şu an)
│   │
│   ├── 📁 lib/               # Business logic
│   │   ├── mockEvents.ts     # 📅 Demo event data (EventWithCategory)
│   │   ├── notifications.ts  # 📅 Web Push API utilities
│   │   └── utils.ts          # Shadcn utility functions
│   │
│   └── middleware.ts         # Next.js middleware (auth)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── .env.local                # Environment variables
```

---

## Dosya Yerleşim Kuralları

### Yeni Route Ekleme
```
src/app/[route-name]/page.tsx
```
Örnek: `/settings` → `src/app/settings/page.tsx`

### Yeni Component Ekleme

| Tip | Konum | Örnek |
|-----|-------|-------|
| Temel UI (Button, Input) | `components/ui/` | `Button.tsx` |
| HUD/Overlay | `components/hud/` | `EventModal.tsx` |
| 3D/WebGL | `components/3d/` | `Particle.tsx` |
| Chart/Grafik | `components/analytics/` | `HeatMap.tsx` |
| Page-specific | `app/[route]/components/` | Local bileşen |

### Yeni Hook Ekleme
```
src/hooks/use[HookName].ts
```
Örnek: `src/hooks/useLocalStorage.ts`

### Yeni Utility Ekleme
```
src/lib/[utilName].ts
```
Örnek: `src/lib/notifications.ts`

### Yeni Type Ekleme
```
src/types/[domain].types.ts
```
Örnek: `src/types/api.types.ts`

---

## Dosya Adlandırma Konvansiyonları

| Tip | Format | Örnek |
|-----|--------|-------|
| React Component | PascalCase.tsx | `EventModal.tsx` |
| Custom Hook | camelCase.ts (use prefix) | `useIsMobile.ts` |
| Utility Function | camelCase.ts | `notifications.ts` |
| Type Definition | kebab.types.ts | `database.types.ts` |
| Schema/Validation | kebab-schemas.ts | `form-schemas.ts` |
| Index Export | index.ts | `index.ts` |
| Page Component | page.tsx | `page.tsx` |
| Layout | layout.tsx | `layout.tsx` |
| Route Config | route.ts | `route.ts` |

---

## Import Alias

```typescript
// tsconfig.json paths
"@/*": ["src/*"]

// Kullanım
import { Button } from '@/components/ui'
import { EventModal, CalendarPicker } from '@/components/hud'
import { createClient } from '@/utils/supabase/client'
import { getMockEvents } from '@/lib/mockEvents'
```

---

## Barrel Exports

Her klasör için `index.ts` oluştur:

```typescript
// components/hud/index.ts
export { default as StatusBar } from './StatusBar'
export { default as LoggerModal } from './LoggerModal'
export { default as LogDrawer } from './LogDrawer'
export { default as CalendarPicker } from './CalendarPicker'
export { default as EventModal } from './EventModal'
export { default as EventTimeline } from './EventTimeline'
export { default as EventCard } from './EventCard'
```

Import şekli:
```typescript
import { StatusBar, EventModal, CalendarPicker } from '@/components/hud'
```

---

## Önemli Dosyalar

| Dosya | Amaç | Değiştirmeden Önce |
|-------|------|-------------------|
| `layout.tsx` | PWA meta, fonts | Dikkatli ol |
| `globals.css` | Tailwind config | @theme syntax |
| `middleware.ts` | Auth kontrolü | Supabase docs kontrol |
| `database.types.ts` | Supabase types | Şema değişince güncelle |

---

**Son Güncelleme:** 2026-01-10
**Versiyon:** 1.1.0 (Event Scheduler eklendi)
