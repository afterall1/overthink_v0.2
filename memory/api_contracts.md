# LifeNexus - API Contracts

> Bu dosya Server Actions ve API endpoint'lerinin kontratlarını tanımlar.
> AI Asistanı yeni endpoint eklemeden önce bu dosyayı kontrol etmelidir.

---

## Server Actions Overview

LifeNexus, Next.js Server Actions kullanır. Tüm veritabanı operasyonları 
`src/actions/` klasöründe tanımlanmıştır.

---

## Actions: Goals (`src/actions/goals.ts`)

### `getActiveGoals()`
Kullanıcının aktif hedeflerini getirir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| - | - | - | Parametre yok |

**Return:** `Promise<GoalWithDetails[]>`

```typescript
interface GoalWithDetails {
    id: string
    title: string
    description: string | null
    target_value: number | null
    current_value: number
    unit: string | null
    period: GoalPeriod
    is_completed: boolean
    start_date: string
    end_date: string | null
    goal_entries: GoalEntry[]
    goal_milestones: GoalMilestone[]
}
```

---

### `createGoal(data)`
Yeni hedef oluşturur.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `title` | string | ✅ | Hedef başlığı |
| `description` | string | ❌ | Açıklama |
| `target_value` | number | ❌ | Hedef değer |
| `unit` | string | ❌ | Birim |
| `period` | GoalPeriod | ✅ | daily/weekly/monthly/yearly |
| `start_date` | string | ✅ | YYYY-MM-DD |
| `end_date` | string | ❌ | YYYY-MM-DD |

**Return:** `Promise<Goal>`

---

### `updateGoal(goalId, updates)`
Hedef günceller.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `goalId` | string | ✅ |
| `updates` | Partial<Goal> | ✅ |

**Return:** `Promise<Goal>`

---

### `deleteGoal(goalId)`
Hedef siler.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `goalId` | string | ✅ |

**Return:** `Promise<void>`

---

### `logProgress(goalId, value, notes?)`
İlerleme kaydeder.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `goalId` | string | ✅ |
| `value` | number | ✅ |
| `notes` | string | ❌ |

**Return:** `Promise<GoalEntry>`

---

## Actions: Quests (`src/actions/quests.ts`)

### `createQuest(data)`
Yeni quest oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `title` | string | ✅ |
| `goal_id` | string | ❌ |
| `difficulty` | 'easy' \| 'medium' \| 'hard' | ✅ |
| `xp_reward` | number | ❌ (default: 10) |
| `is_recurring` | boolean | ❌ |
| `recurrence_pattern` | RecurrencePattern | ❌ |
| `scheduled_time` | string | ❌ |
| `scheduled_date` | string | ❌ |

**Return:** `Promise<ActionResult<DailyQuest>>`

---

### `getQuestsForToday()`
Bugünkü questleri getirir (recurring + scheduled).

**Return:** `Promise<ActionResult<DailyQuest[]>>`

---

### `completeQuest(questId, notes?)`
Quest tamamlar ve XP verir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `questId` | string | ✅ |
| `notes` | string | ❌ |

**Return:** `Promise<ActionResult<QuestCompletionResult>>`

```typescript
interface QuestCompletionResult {
    completion: QuestCompletion
    xpBreakdown: {
        baseXp: number
        difficultyBonus: number
        timeBonus: number
        streakBonus: number
        totalXp: number
    }
    newStreak: number
    isPerfectDay: boolean
    levelUp: boolean
}
```

---

### `skipQuest(questId)`
Quest atlar.

**Return:** `Promise<ActionResult<DailyQuest>>`

---

### `undoQuestCompletion(questId, completionDate?)`
Quest tamamlamasını geri alır.

**Return:** `Promise<ActionResult<void>>`

---

### `getUserXpStats()`
Kullanıcı XP istatistiklerini getirir.

**Return:** `Promise<ActionResult<UserXpStats>>`

---

### `getDailySummary(date?)`
Günlük özet getirir.

**Return:** `Promise<ActionResult<DailySummary>>`

---

## Actions: AI (`src/actions/ai.ts`)

### `getCouncilAdvice(query)`
AI Council'dan tavsiye alır.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `query` | string | ✅ |

**Return:** `Promise<string>` (AI yanıtı)

---

### `getGoalInsight(goalId)`
Hedefe özel AI insight üretir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `goalId` | string | ✅ |

**Return:** `Promise<string>`

---

## Actions: Events (`src/actions/events.ts`)

### `createEvent(data)`
Yeni etkinlik oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `title` | string | ✅ |
| `start_time` | string | ✅ |
| `duration_min` | number | ✅ |
| `category_id` | string | ❌ |
| `reminder_min` | number | ❌ |

**Return:** `Promise<Event>`

---

### `getEventsForDate(date)`
Belirli tarihteki etkinlikleri getirir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `date` | string | ✅ (YYYY-MM-DD) |

**Return:** `Promise<Event[]>`

---

## Actions: Categories (`src/actions/categories.ts`)

### `getCategories()`
Tüm kategorileri getirir.

**Return:** `Promise<Category[]>`

---

### `getCategoryBySlug(slug)`
Slug ile kategori getirir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `slug` | string | ✅ |

**Return:** `Promise<Category | null>`

---

## Actions: Logs (`src/actions/logs.ts`)

### `createLog(data)`
Yeni log kaydı oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `category_id` | string | ✅ |
| `data` | JSONB | ✅ |
| `sentiment` | number (1-10) | ❌ |
| `notes` | string | ❌ |

**Return:** `Promise<Log>`

---

### `getLogsByCategory(categoryId, limit?)`
Kategori bazlı logları getirir.

**Return:** `Promise<Log[]>`

---

## Common Types

```typescript
// ActionResult wrapper
interface ActionResult<T> {
    data: T | null
    error: string | null
}

// Goal periods
type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly'

// Quest difficulty
type QuestDifficulty = 'easy' | 'medium' | 'hard'

// Recurrence patterns
type RecurrencePattern = 'daily' | 'weekdays' | 'weekends' | 'mwf' | 'tts' | 'custom'
```

---

## Error Handling

Tüm Server Actions şu pattern'i kullanır:

```typescript
try {
    // Operation
    return { data: result, error: null }
} catch (error) {
    const message = error instanceof Error ? error.message : 'Beklenmeyen hata'
    return { data: null, error: message }
}
```

---

## Authentication

Tüm actions `getCurrentUserId()` ile kullanıcı doğrulama yapar:

```typescript
async function getCurrentUserId(): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user?.id ?? DEMO_USER_ID
}

const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111'
```

---

**Son Güncelleme:** 2026-01-12
**Versiyon:** 1.0.0
