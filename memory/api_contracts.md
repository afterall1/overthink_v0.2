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

## 🆕 Actions: Goal Templates (`src/actions/goals.ts`)

### `getGoalTemplates(categorySlug?)`
Kategoriye göre goal şablonlarını getirir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `categorySlug` | string | ❌ |

**Return:** `Promise<ActionResult<GoalTemplate[]>>`

---

### `getGoalTemplateBySlug(slug)`
Slug ile tek bir goal şablonu getirir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `slug` | string | ✅ |

**Return:** `Promise<ActionResult<GoalTemplateWithQuests>>`

```typescript
interface GoalTemplateWithQuests extends GoalTemplate {
    quest_templates: QuestTemplate[]
}
```

---

### `getGoalTemplateCategories()`
Unique goal template kategorilerini getirir.

**Return:** `Promise<ActionResult<string[]>>`

---

### `createGoalFromTemplate(templateId, customizations?)`
Şablondan goal oluşturur ve otomatik olarak bağlı questleri de oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `templateId` | string | ✅ |
| `customizations.title` | string | ❌ |
| `customizations.description` | string | ❌ |
| `customizations.target_value` | number | ❌ |
| `customizations.start_date` | string | ❌ |
| `customizations.end_date` | string | ❌ |

**Return:** `Promise<ActionResult<{ goal: Goal; questsCreated: number }>>`

> **Önemli:** Bu action otomatik olarak:
> 1. Goal template'den goal oluşturur
> 2. `goal_template_id` ile bağlı quest template'leri bulur
> 3. Bulunan quest template'lerden günlük questler oluşturur
> 4. Eğer bağlı quest yoksa, category_slug ile fallback arama yapar

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

### `getQuestsForToday(targetDate?)`
Bugünkü questleri getirir (recurring + scheduled).

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `targetDate` | string | ❌ | YYYY-MM-DD formatında tarih (Time Travel için) |

**Return:** `Promise<ActionResult<DailyQuest[]>>`

> **Önemli:** `targetDate` parametresi Time Travel test özelliği için eklenmiştir.
> - Verilmezse: Gerçek bugünün tarihi kullanılır
> - Verilirse: O tarih için quest'ler getirilir ve recurring quest'ler completion durumuna göre override edilir

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

### `deleteQuest(questId)`
Quest ve ilişkili tüm verileri siler (CASCADE DELETE).

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `questId` | string | ✅ |

**Return:** `Promise<ActionResult<void>>`

**Cascade Akışı:**
1. Quest'e ait tüm `quest_completions` kayıtları silinir
2. Kazanılan XP `user_xp_stats`'tan düşülür
3. Eğer goal'a bağlıysa, goal `current_value` geri alınır
4. Quest silinir

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

## 🆕 Actions: Quest Templates (`src/actions/quests.ts`)

### `getQuestTemplates(categorySlug?)`
Kategoriye göre quest şablonlarını getirir.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `categorySlug` | CategorySlug | ❌ |

**Return:** `Promise<ActionResult<QuestTemplate[]>>`

---

### `getTemplateCategories()`
Unique kategorileri getirir.

**Return:** `Promise<ActionResult<CategorySlug[]>>`

---

### `createQuestFromTemplate(templateId, goalId, customizations?)`
Şablondan quest oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `templateId` | string | ✅ |
| `goalId` | string \| null | ✅ |
| `customizations` | Partial<DailyQuestInsert> | ❌ |

**Return:** `Promise<ActionResult<DailyQuest>>`

---

### `createQuestsFromTemplates(templateIds, goalId)`
Birden fazla şablondan toplu quest oluşturur.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `templateIds` | string[] | ✅ |
| `goalId` | string \| null | ✅ |

**Return:** `Promise<ActionResult<DailyQuest[]>>`

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

> ⚠️ **Demo user modu kaldırıldı.** Tüm actions `getAuthenticatedClient()` kullanır.

```typescript
import { getAuthenticatedClient, AuthenticationError } from '@/lib/auth'

async function someAction() {
    try {
        const { supabase, user } = await getAuthenticatedClient()
        // user.id artık gerçek kullanıcı ID'si
    } catch (error) {
        if (error instanceof AuthenticationError) {
            return { data: null, error: 'Kimlik doğrulama gerekli' }
        }
        throw error
    }
}
```

Giriş yapmayan kullanıcılar otomatik olarak `/login` sayfasına yönlendirilir.

---

## 🆕 Actions: AI Health Quests (`src/actions/aiHealthQuests.ts`)

### `upsertHealthProfile(input)`
Kullanıcının sağlık profilini oluşturur veya günceller. BMR/TDEE otomatik hesaplanır.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `weight_kg` | number | ✅ | Kilo (kg) |
| `height_cm` | number | ✅ | Boy (cm) |
| `birth_date` | string | ✅ | YYYY-MM-DD |
| `biological_sex` | 'male' \| 'female' | ✅ | Biyolojik cinsiyet |
| `activity_level` | string | ✅ | sedentary/light/moderate/very_active/extreme |
| `sleep_hours_avg` | number | ❌ | Ortalama uyku saati |
| `stress_level` | string | ❌ | low/medium/high |
| `health_conditions` | string[] | ❌ | Sağlık durumları |
| `dietary_restrictions` | string[] | ❌ | Diyet kısıtlamaları |
| `primary_goal` | string | ❌ | weight_loss/weight_gain/maintenance/muscle_gain/endurance |
| `target_weight_kg` | number | ❌ | Hedef kilo |
| `goal_pace` | string | ❌ | slow/moderate/aggressive |

**Return:** `Promise<{ success: boolean, profile?: HealthProfile, error?: string }>`

---

### `getHealthProfile()`
Mevcut kullanıcının sağlık profilini getirir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| - | - | - | Parametre yok |

**Return:** `Promise<{ success: boolean, profile?: HealthProfile, error?: string }>`

---

### `generatePersonalizedQuests()`
AI Expert Council kullanarak kişiselleştirilmiş günlük görevler üretir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| - | - | - | Kullanıcı profilinden otomatik alır |

**Return:** `Promise<{ success: boolean, quests?: AIGeneratedQuest[], nutrition_plan?: NutritionPlan, error?: string }>`

---

### `saveAIGeneratedQuests(quests, goalId?)`
Üretilen AI görevlerini veritabanına kaydeder.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `quests` | AIGeneratedQuest[] | ✅ | Kaydedilecek görevler |
| `goalId` | string | ❌ | Bağlanacak hedef ID |

**Return:** `Promise<{ success: boolean, savedCount?: number, error?: string }>`

---

## 🆕 Actions: Wizard AI (`src/actions/wizardAI.ts`)

Goal Creation Wizard için AI-driven quest generation.

### `generateWizardQuests(context)`
Wizard verilerinden AI ile kişiselleştirilmiş görevler üretir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `context.motivation` | string | ✅ | Step 1 motivasyon |
| `context.identity_statement` | string | ✅ | Kimlik ifadesi |
| `context.goal_title` | string | ✅ | Hedef başlığı |
| `context.goal_description` | string | ✅ | Açıklama |
| `context.target_value` | number | ❌ | Hedef değer |
| `context.unit` | string | ✅ | Birim |
| `context.period` | string | ✅ | Periyod |
| `context.category_slug` | string | ❌ | Kategori |
| `context.goal_template_id` | string | ❌ | Şablon ID |
| `context.start_date` | string | ✅ | Başlangıç |
| `context.end_date` | string | ❌ | Bitiş |

**Return:** `Promise<WizardQuestsResult>`

```typescript
interface WizardQuestsResult {
    success: boolean
    quests?: AIGeneratedQuest[]
    nutrition_plan?: NutritionPlan
    warnings?: string[]
    motivational_tip?: string
    error?: string
    fallback_used?: boolean
}
```

> **Özellikler:**
> 1. Health profile ile context zenginleştirir
> 2. AI başarısız olursa template-based fallback
> 3. Generic quests son çare

---

## 🆕 Library: Goal Synergy Engine (`src/lib/ai/goalSynergyEngine.ts`)

Multi-goal quest attribution ve sinerji analizi için kütüphane fonksiyonları.

### `analyzeGoalSynergy(newGoalSlug, newGoalTitle, userId)`
Yeni hedefin mevcut hedeflerle sinerji analizi.

| Parametre | Tip | Zorunlu |
|-----------|-----|---------|
| `newGoalSlug` | string | ✅ |
| `newGoalTitle` | string | ✅ |
| `userId` | string | ✅ |

**Return:** `Promise<SynergyAnalysisResult>`

---

### `createQuestGoalContributions(questId, primaryGoalId, userId, additionalGoalIds?)`
Quest'i birden fazla hedefe bağlar.

---

### `updateGoalsFromQuestCompletion(questId, userId, baseProgress)`
Tamamlanan quest'in tüm bağlı hedeflerini günceller.

---

## 🆕 Actions: Unified Health Profile (`src/actions/aiHealthQuests.ts`)

Kapsamlı sağlık profili yönetimi. Tüm goal tipleri için tek kaynak.

### `upsertHealthProfile(input)`
Sağlık profili oluşturur veya günceller.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `weight_kg` | number | ✅ | Kilo (kg) |
| `height_cm` | number | ✅ | Boy (cm) |
| `birth_date` | string | ✅ | YYYY-MM-DD |
| `biological_sex` | 'male' \| 'female' | ✅ | Biyolojik cinsiyet |
| `activity_level` | ActivityLevel | ✅ | sedentary/light/moderate/very_active/extreme |
| `training_experience` | TrainingExp | ❌ | none/beginner/intermediate/advanced |
| `training_types` | string[] | ❌ | ['cardio', 'weights', ...] |
| `gym_access` | GymAccess | ❌ | full_gym/home_gym/outdoor/none |
| `meals_per_day` | MealsPerDay | ❌ | 2/3/4/5+ |
| `cooks_at_home` | CooksFreq | ❌ | always/often/sometimes/rarely |
| `fast_food_frequency` | FastFoodFreq | ❌ | never/weekly/few_times_week/daily |
| `current_water_intake_liters` | number | ❌ | Mevcut su tüketimi (L) |
| `sugar_drinks_per_day` | number | ❌ | Günlük şekerli içecek |
| `sugar_craving_trigger` | CravingTrigger | ❌ | morning_coffee/after_lunch/... |
| `sleep_quality` | SleepQuality | ❌ | poor/fair/good/excellent |
| `sections_completed` | string[] | ❌ | ['basic', 'training', ...] |

**Return:** `Promise<HealthProfileResult>`

```typescript
interface HealthProfileResult {
    success: boolean
    profile?: HealthProfileInput & { id: string; bmr_kcal: number; tdee_kcal: number; target_daily_kcal: number }
    error?: string
}
```

---

### `getHealthProfile()`
Kullanıcının sağlık profilini getirir (unified fields dahil).

**Return:** `Promise<HealthProfileResult>`

---

## 🆕 AI Context Builder (`src/lib/ai/healthCouncil.ts`)

### `buildUnifiedProfileSection(context)`
Unified profile verilerinden AI prompt bölümü oluşturur.

**Üretilen Bölümler:**
- 🏋️ ANTRENMAN PROFİLİ
- 🍽️ BESLENME ALIŞKANLIKLARI
- 💧 HİDRASYON & ŞEKER
- 😴 UYKU & STRES

---

## 🆕 Actions: Weekly Quest Batches (`src/actions/weeklyQuests.ts`)

Haftalık çeşitlendirilmiş quest üretimi ve yönetimi. Her gün farklı quest'ler için AI 7 günlük batch oluşturur.

### `generateWeeklyBatch(goalId, startFromDate?)`
Goal için haftalık quest batch'i oluşturur.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `goalId` | string | ✅ | Hedef ID |
| `startFromDate` | Date | ❌ | Başlangıç tarihi (default: bugün) |

**Return:** `Promise<ActionResult<WeeklyQuestBatch>>`

```typescript
interface WeeklyQuestBatch {
    id: string
    user_id: string
    goal_id: string
    week_start: string
    week_end: string
    quests_data: WeeklyQuestsData
    status: 'active' | 'expired' | 'regenerating'
}
```

---

### `getWeeklyBatch(goalId, date?)`
Goal için aktif haftalık batch'i getirir.

**Return:** `Promise<ActionResult<WeeklyQuestBatch>>`

---

### `getWeeklyQuestsForDate(goalId, date?)`
Belirli bir gün için quest'leri getirir.

**Return:** `Promise<ActionResult<AIGeneratedQuest[]>>`

---

### `expireOldBatches()`
Süresi geçmiş batch'leri expire eder (cron job için).

**Return:** `Promise<ActionResult<number>>` (expire edilen batch sayısı)

---

## 🆕 Actions: Profile Delta (`src/actions/profileDelta.ts`)

### `calculateProfileDelta(oldMetrics, newMetrics)`
İki profil arasındaki anlamlı değişikliği hesaplar.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `oldMetrics` | ProfileMetricsSnapshot | ✅ | Eski profil metrikleri |
| `newMetrics` | ProfileMetricsSnapshot | ✅ | Yeni profil metrikleri |

**Return:** `ProfileDelta`

```typescript
interface ProfileMetricsSnapshot {
    daily_adjustment: number
    weight_kg: number
    activity_level: string
    target_weight_kg?: number | null
    goal_pace?: string | null
}

interface ProfileDelta {
    isSignificant: boolean      // Anlamlı değişiklik var mı?
    changes: {
        daily_adjustment?: { old: number; new: number; delta: number }
        weight_kg?: { old: number; new: number; delta: number }
        activity_level?: { old: string; new: string }
        target_weight_kg?: { old: number | null; new: number | null }
        goal_pace?: { old: string | null; new: string | null }
    }
    summary: string             // Türkçe değişiklik özeti
}
```

**Significance Thresholds:**
| Parametre | Eşik |
|-----------|------|
| `daily_adjustment` | ±100 kcal |
| `weight_kg` | ±2 kg |
| `activity_level` | Herhangi değişiklik |
| `target_weight_kg` | Herhangi değişiklik |
| `goal_pace` | Herhangi değişiklik |

---

## 🆕 Actions: Quest Regeneration (`src/actions/questRegeneration.ts`)

### `regenerateRemainingQuestDays(userId, newAIContext)`
Profil değişikliğinden sonra kalan günlerin quest'lerini yeniden üretir.

| Parametre | Tip | Zorunlu | Açıklama |
|-----------|-----|---------|----------|
| `userId` | string | ✅ | Kullanıcı ID |
| `newAIContext` | UserHealthContext | ✅ | Yeni profil AI context'i |

**Return:** `Promise<RegenerationResult>`

```typescript
interface RegenerationResult {
    success: boolean
    goalsAffected: number      // Etkilenen goal sayısı
    batchesUpdated: number     // Güncellenen batch sayısı
    daysRegenerated: number    // Yeniden üretilen gün sayısı
    error?: string
}
```

**Nasıl Çalışır:**
1. Kullanıcının aktif `weekly_quest_batches` bulunur
2. Bugünden itibaren kalan günler hesaplanır
3. Her batch için yeni AI quest'ler üretilir
4. Sadece kalan günler güncellenir (geçmiş günler korunur)
5. Bugünkü `daily_quests` tablosu da güncellenir

---

**Son Güncelleme:** 2026-01-20 01:50 UTC+3
**Versiyon:** 1.8.0 (getQuestsForToday Time Travel support eklendi)


