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
│   ├── api_contracts.md      # 🆕 Server Actions kontratları
│   ├── auth_architecture.md  # 🔐 Authentication dokümantasyonu
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
│   ├── schema.sql            # Ana veritabanı şeması
│   └── 📁 migrations/
│       ├── 20260112_quest_system.sql        # Quest System tabloları
│       ├── 20260112_quest_templates.sql     # Quest Templates (124 şablon)
│       ├── 20260112_goal_templates.sql      # Goal Templates (44 şablon)
│       ├── 20260113_momentum_score_system.sql # Momentum Score System
│       ├── 20260113_fix_quest_progress_contribution.sql # Progress fix
│       ├── 20260113_cleanup_orphan_quests.sql # Orphan quest temizliği
│       └── 20260116_weekly_quest_batches.sql  # 🆕 Haftalık quest batch tablosu
│
├── 📁 src/                   # Kaynak kod
│   │
│   ├── 📁 app/               # Next.js App Router
│   │   ├── layout.tsx        # Root layout (PWA meta)
│   │   ├── page.tsx          # Home page (Protected)
│   │   ├── globals.css       # Global stiller
│   │   │
│   │   ├── 📁 (auth)/        # 🔐 Auth Route Group (shared layout)
│   │   │   ├── layout.tsx        # Glassmorphism centered layout
│   │   │   ├── 📁 login/
│   │   │   │   └── page.tsx      # Password + Magic Link toggle
│   │   │   ├── 📁 register/
│   │   │   │   └── page.tsx      # Password strength indicators
│   │   │   └── 📁 forgot-password/
│   │   │       └── page.tsx      # Password reset request
│   │   │
│   │   ├── 📁 auth/          # 🔐 Auth API Routes
│   │   │   └── 📁 callback/
│   │   │       └── route.ts      # OAuth/Magic Link code exchange
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
│   │   │   └── index.ts
│   │   │
│   │   ├── 📁 hud/           # [MOLECULES] HUD overlay
│   │   │   │
│   │   │   ├── 📁 AICouncil/      # 🆕 AI Assistant UI
│   │   │   │   ├── index.ts
│   │   │   │   ├── CouncilPanel.tsx
│   │   │   │   ├── CouncilFAB.tsx
│   │   │   │   ├── CouncilChat.tsx
│   │   │   │   ├── CouncilInput.tsx
│   │   │   │   ├── CouncilHeader.tsx
│   │   │   │   └── CouncilMemberAvatar.tsx
│   │   │   │
│   │   │   ├── 📁 Goals/          # Goals & Progress UI
│   │   │   │   ├── index.ts
│   │   │   │   ├── GoalsFAB.tsx
│   │   │   │   ├── GoalsPanel.tsx
│   │   │   │   ├── GoalsStrip.tsx        # Ana ekran hedef şeridi
│   │   │   │   ├── GoalCard.tsx          # Dikey kart tasarımı
│   │   │   │   ├── GoalDetailModal.tsx   # Legacy (deprecated)
│   │   │   │   ├── GoalModal.tsx
│   │   │   │   ├── GoalCreationWizard.tsx
│   │   │   │   ├── GoalCelebration.tsx
│   │   │   │   ├── ConfettiCelebration.tsx
│   │   │   │   ├── GoalHealthIndicator.tsx
│   │   │   │   ├── StreakBadge.tsx
│   │   │   │   ├── VelocityMeter.tsx
│   │   │   │   ├── MomentumGauge.tsx     # Dual progress gauge
│   │   │   │   ├── MilestoneList.tsx
│   │   │   │   ├── ProgressRing.tsx
│   │   │   │   ├── SynergyWarningModal.tsx # Goal sinerji uyarı modal
│   │   │   │   ├── SafeDateModal.tsx       # 🆕 Güvenli tarih seçim modalı
│   │   │   │   ├── GoalInsightCard.tsx     # Hesaplama ve uyarı kartı
│   │   │   │   │
│   │   │   │   └── 📁 GoalDetail/   # 🆕 Modular GoalDetail
│   │   │   │       ├── index.tsx        # Main orchestrator (iOS Bottom Sheet)
│   │   │   │       ├── types.ts         # Shared types, constants
│   │   │   │       │
│   │   │   │       ├── 📁 layout/       # 🆕 iOS Layout Components
│   │   │   │       │   ├── index.ts         # Barrel export
│   │   │   │       │   ├── BottomSheet.tsx  # iOS-native detent sheet
│   │   │   │       │   ├── SheetHeader.tsx  # 44pt touch target header
│   │   │   │       │   └── SafeAreaContainer.tsx  # Safe area wrapper
│   │   │   │       │
│   │   │   │       ├── HeroSection.tsx      # Apple dual-ring hero
│   │   │   │       ├── StatsGrid.tsx        # 🆕 XP, completion rate, velocity
│   │   │   │       ├── StreakWarning.tsx    # 🆕 Streak risk alerts
│   │   │   │       ├── ContributionHeatmap.tsx # 🆕 30-day activity grid
│   │   │   │       ├── LinkedQuestsPanel.tsx   # Quest actions
│   │   │   │       ├── JourneyPath.tsx      # SVG milestone path
│   │   │   │       ├── ProgressTimeline.tsx # Activity feed
│   │   │   │       ├── AIInsightCard.tsx    # Dynamic AI insight
│   │   │   │       └── ProgressLogger.tsx   # Progress input
│   │   │   │
│   │   │   ├── 📁 Quests/         # 🆕 Quest System UI
│   │   │   │   ├── index.ts
│   │   │   │   ├── QuestCard.tsx          # Swipe-to-complete
│   │   │   │   ├── DailyQuestsPanel.tsx   # Goal-grouped list
│   │   │   │   ├── XPProgressBar.tsx      # Level progress
│   │   │   │   ├── QuestCompletionToast.tsx # Celebration toast
│   │   │   │   ├── QuestCreationModal.tsx  # 🆕 Template selection modal
│   │   │   │   ├── RitualCard.tsx         # Habit stacking
│   │   │   │   └── PerfectDayBadge.tsx    # Perfect day indicator
│   │   │   │
│   │   │   ├── 📁 Health/         # 🆕 Health Quest System UI
│   │   │   │   ├── index.ts               # Barrel export
│   │   │   │   ├── HealthProfileWizard.tsx  # Legacy 5-step wizard
│   │   │   │   ├── UnifiedHealthProfileWizard.tsx # 🆕 7-step unified wizard (AKTİF)
│   │   │   │   ├── HealthProfileBanner.tsx  # Context-aware banner (food/sport)
│   │   │   │   ├── ProfileEditButton.tsx    # 🆕 Reusable profile edit button
│   │   │   │   ├── SafetyWarningBanner.tsx  # 🆕 Safety limit uyarı banner'ı
│   │   │   │   ├── AIQuestGeneratorModal.tsx # AI quest generation modal
│   │   │   │   └── HealthFAB.tsx            # FAB (artık kullanılmıyor)
│   │   │   │
│   │   │   ├── 📁 Questions/      # 🆕 Goal-Specific Questions
│   │   │   │   ├── index.ts               # Barrel export
│   │   │   │   ├── QuestionCard.tsx       # Reusable question renderer
│   │   │   │   ├── SugarQuestions.tsx     # 6 sugar reduction questions
│   │   │   │   ├── MuscleGainQuestions.tsx # 8 muscle gain questions
│   │   │   │   ├── HydrationQuestions.tsx  # 6 hydration questions
│   │   │   │   ├── FastingQuestions.tsx    # 7 fasting questions
│   │   │   │   ├── ActivityQuestions.tsx   # 6 activity questions
│   │   │   │   └── HealthyEatingQuestions.tsx # 6 healthy eating questions
│   │   │   │
│   │   │   ├── StatusBar.tsx       # Üst progress bar
│   │   │   ├── LoggerModal.tsx     # FAB + log form modal
│   │   │   ├── LogDrawer.tsx       # Sol log paneli
│   │   │   ├── CalendarPicker.tsx  # Global takvim picker
│   │   │   ├── EventModal.tsx      # Yeni plan formu
│   │   │   ├── EventDetailModal.tsx # 🆕 Event detay modal
│   │   │   ├── EventTimeline.tsx   # Timeline panel
│   │   │   ├── EventCard.tsx       # Event kartı
│   │   │   ├── DayView.tsx         # 🆕 Günlük görünüm
│   │   │   ├── AgendaView.tsx      # 🆕 Ajanda görünümü
│   │   │   ├── TodayFocus.tsx      # 🆕 Bugünün odak paneli
│   │   │   ├── UpcomingStream.tsx  # 🆕 Yaklaşan eventler
│   │   │   ├── ControlDock.tsx     # 🆕 Alt kontrol paneli
│   │   │   ├── form-schemas.ts     # Zod şemaları
│   │   │   └── index.ts            # Barrel export
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
│   │   ├── database.types.ts     # Supabase tablo tipleri + Quest types + Health Profile
│   │   └── goalQuestions.types.ts # 🆕 Goal-specific question types (7 goal types)
│   │
│   ├── 📁 utils/             # Yardımcı fonksiyonlar
│   │   └── 📁 supabase/      # Supabase clients
│   │       ├── client.ts     # Browser client
│   │       ├── server.ts     # Server client + Admin client
│   │       └── middleware.ts # 🔐 Protected route kontrolü
│   │
│   ├── 📁 actions/           # Server Actions
│   │   ├── events.ts         # CRUD operations for events
│   │   ├── goals.ts          # CRUD operations for goals
│   │   ├── logs.ts           # CRUD operations for logs
│   │   ├── categories.ts     # Fetch categories from Supabase
│   │   ├── quests.ts         # Quest CRUD + XP management
│   │   ├── ai.ts             # AI Council server actions
│   │   ├── aiHealthQuests.ts # Health profile + AI quest generation + delta detection
│   │   ├── profileDelta.ts   # 🆕 Profile değişiklik algılama (thresholds)
│   │   ├── questRegeneration.ts # 🆕 Kalan günler için quest regeneration
│   │   ├── wizardAI.ts       # Goal Wizard AI quest generation
│   │   └── weeklyQuests.ts   # Haftalık quest batch üretimi ve yönetimi
│   │
│   ├── 📁 hooks/             # Custom React hooks
│   │   ├── useIsMobile.ts    # (Scene.tsx içinde şu an)
│   │   ├── useHaptics.ts     # iOS haptic feedback hook
│   │   └── useHealthProfile.ts # 🆕 Health profile check hook
│   │
│   ├── 📁 lib/               # Business logic
│   │   ├── auth.ts           # 🔐 Centralized auth utilities
│   │   ├── mockEvents.ts     # Demo event data
│   │   ├── notifications.ts  # Web Push API utilities
│   │   ├── utils.ts          # Shadcn utility functions
│   │   ├── questEngine.ts    # XP/Level/Streak calculations
│   │   ├── streakEngine.ts   # Advanced streak & health logic
│   │   ├── healthCalculator.ts # 🆕 BMR/TDEE Mifflin-St Jeor formula
│   │   │
│   │   └── 📁 ai/            # AI Integration
│   │       ├── index.ts
│   │       ├── aiConfig.ts           # Gemini configuration
│   │       ├── aiService.ts          # AI service layer
│   │       ├── userDataAggregator.ts # User context builder
│   │       ├── healthCouncil.ts      # AI Expert Council for health quests
│   │       ├── goalSpecificContexts.ts # Typed goal context interfaces
│   │       │
│   │       ├── 📁 synergy/           # 🆕 Goal Synergy Intelligence (Phase 8.36)
│   │       │   ├── synergyMatrix.ts      # 44+ hedef arası sinerji ilişkileri
│   │       │   ├── goalSynergyEngine.ts  # Sinerji analizi, multi-goal güncelleme
│   │       │   └── synergyContextBuilder.ts # AI prompt context injection
│   │       │
│   │       └── 📁 prompts/           # Modular Goal-Specific Prompts
│   │           ├── index.ts              # Barrel export
│   │           ├── baseSystemPrompt.ts   # Universal safety rules
│   │           ├── healthPromptComposer.ts # Prompt composition + synergy
│   │           ├── sugarReductionPrompt.ts # Sugar reduction strategies
│   │           ├── weightLossPrompt.ts     # Weight loss strategies
│   │           ├── hydrationPrompt.ts      # Hydration strategies
│   │           ├── muscleGainPrompt.ts     # Muscle gain strategies
│   │           ├── fastingPrompt.ts        # Fasting strategies
│   │           ├── activityPrompt.ts       # Activity strategies
│   │           ├── healthyEatingPrompt.ts  # Healthy eating strategies
│   │           ├── council.ts              # Legacy council prompt
│   │           ├── lifeCoach.ts            # Life coach prompt
│   │           └── taskAdvisor.ts          # Task advisor prompt
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

## Auth Route Yapısı

### Route Group: `(auth)`
Parantez içindeki klasör adı URL'de görünmez. Shared layout kullanır.

```
/login            → src/app/(auth)/login/page.tsx
/register         → src/app/(auth)/register/page.tsx
/forgot-password  → src/app/(auth)/forgot-password/page.tsx
```

### Callback Route: `auth/callback`
OAuth ve Magic Link için code exchange handler.

```
/auth/callback    → src/app/auth/callback/route.ts
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
| Feature Module | `components/hud/[Feature]/` | `Quests/QuestCard.tsx` |
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

### Yeni Server Action Ekleme
```
src/actions/[domain].ts
```
Örnek: `src/actions/quests.ts`

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
| Route Handler | route.ts | `route.ts` |
| Server Action | camelCase.ts | `quests.ts` |

---

## Import Alias

```typescript
// tsconfig.json paths
"@/*": ["src/*"]

// Kullanım
import { Button } from '@/components/ui'
import { EventModal, CalendarPicker } from '@/components/hud'
import { QuestCard, DailyQuestsPanel } from '@/components/hud/Quests'
import { createClient } from '@/utils/supabase/client'
import { getCurrentUser, requireAuth } from '@/lib/auth'
import { calculateLevel, QUEST_XP } from '@/lib/questEngine'
```

---

## Önemli Dosyalar

| Dosya | Amaç | Değiştirmeden Önce |
|-------|------|-------------------|
| `layout.tsx` | PWA meta, fonts | Dikkatli ol |
| `globals.css` | Tailwind config | @theme syntax |
| `middleware.ts` | Auth kontrolü | Protected routes listesi |
| `lib/auth.ts` | Auth utilities | Session yönetimi |
| `database.types.ts` | Supabase types | Şema değişince güncelle |
| `questEngine.ts` | XP/Level sistemi | Formüller hassas |
| `streakEngine.ts` | Streak/Health | Algoritma hassas |

---

## Feature Modules

### Quests Module
```
components/hud/Quests/
├── QuestCard.tsx         # Tek quest kartı (swipe gesture)
├── DailyQuestsPanel.tsx  # Ana dashboard widget
├── XPProgressBar.tsx     # Level progress bar
├── QuestCompletionToast.tsx # Success toast
├── RitualCard.tsx        # Habit stacking
├── PerfectDayBadge.tsx   # Perfect day indicator
└── index.ts              # Exports
```

### AI Module
```
lib/ai/
├── aiConfig.ts           # Model settings
├── aiService.ts          # Core AI service
├── userDataAggregator.ts # Context builder
└── prompts/              # System prompts
    ├── council.ts
    ├── goalInsight.ts
    └── questSuggestion.ts
```

---

**Son Güncelleme:** 2026-01-13 10:15 UTC+3
**Versiyon:** 2.1.0 (AI Health Quest System, Health module eklendi)
