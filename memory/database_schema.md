# LifeNexus - Database Schema

> PostgreSQL veritabanı, Supabase tarafından yönetilmektedir.
> Tüm tablolarda Row Level Security (RLS) aktiftir.

---

## Tablo Diyagramı

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   users     │     │  categories  │     │    goals    │
├─────────────┤     ├──────────────┤     ├─────────────┤
│ id (PK)     │◄────│ id (PK)      │     │ id (PK)     │
│ email       │     │ name         │     │ user_id(FK) │
│ full_name   │     │ slug         │     │ category_id │
│ avatar_url  │     │ color_code   │     │ title       │
│ created_at  │     │ icon_slug    │     │ target      │
│ updated_at  │     │ description  │     │ period      │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
┌──────────────────────────────────────┐
│                logs                   │
├──────────────────────────────────────┤
│ id (PK)                              │
│ user_id (FK → users)                 │
│ category_id (FK → categories)        │
│ data (JSONB) ◄── Kategori bazlı şema │
│ sentiment (1-10)                     │
│ notes                                │
│ logged_at                            │
│ created_at                           │
│ updated_at                           │
└──────────────────────────────────────┘
```

---

## Tablo Detayları

### 1. users

Supabase Auth ile entegre kullanıcı profilleri.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK, FK → auth.users | Auth user ID |
| `email` | TEXT | UNIQUE, NOT NULL | E-posta |
| `full_name` | TEXT | NULLABLE | Tam ad |
| `avatar_url` | TEXT | NULLABLE | Profil fotoğrafı |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Güncelleme |

**Trigger:** `on_auth_user_created` → Auth kaydı olunca otomatik profil oluşturur.

---

### 2. categories

6 sabit kategori. Kullanıcı tarafından değiştirilemez.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Kategori ID |
| `name` | TEXT | UNIQUE, NOT NULL | Görünen ad |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe isim |
| `color_code` | TEXT | NOT NULL | HEX renk kodu |
| `icon_slug` | TEXT | NOT NULL | Lucide icon adı |
| `description` | TEXT | NULLABLE | Açıklama |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |

**Seed Data:**

| slug | name | color_code | icon_slug |
|------|------|------------|-----------|
| trade | Trade | #F59E0B | trending-up |
| food | Food | #10B981 | utensils |
| sport | Sport | #3B82F6 | dumbbell |
| dev | Dev | #8B5CF6 | code-2 |
| etsy | Etsy | #EC4899 | shopping-bag |
| gaming | Gaming | #EF4444 | gamepad-2 |

---

### 3. logs

Kullanıcı aktivite kayıtları. JSONB `data` sütunu kategori bazlı şema içerir.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Log ID |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `category_id` | UUID | FK → categories, NOT NULL | Kategori |
| `data` | JSONB | NOT NULL, DEFAULT '{}' | Dinamik veri |
| `sentiment` | INTEGER | CHECK (1-10) | Ruh hali |
| `notes` | TEXT | NULLABLE | Notlar |
| `logged_at` | TIMESTAMPTZ | DEFAULT NOW() | Log tarihi |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Güncelleme |

**Indexes:**
- `logs_user_id_idx` (B-tree)
- `logs_category_id_idx` (B-tree)
- `logs_logged_at_idx` (B-tree)
- `logs_data_gin_idx` (GIN for JSONB)

---

## JSONB Data Şemaları

Her kategori için `data` sütununda beklenen yapı:

### Trade
```typescript
interface TradeLogData {
  pair: string          // Zorunlu: "BTC/USDT"
  side: 'long' | 'short'// Zorunlu
  entry: number         // Zorunlu: Giriş fiyatı
  exit?: number         // Opsiyonel: Çıkış fiyatı
  pnl: number           // Zorunlu: Kar/Zarar ($)
  pnl_percent?: number  // Opsiyonel: Kar/Zarar (%)
}
```
```jsonc
// Örnek
{"pair": "BTC/USDT", "side": "long", "entry": 42000, "pnl": 150, "pnl_percent": 3.5}
```

### Food
```typescript
interface FoodLogData {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' // Zorunlu
  calories: number      // Zorunlu
  protein?: number      // Opsiyonel (gram)
  carbs?: number        // Opsiyonel (gram)
  fat?: number          // Opsiyonel (gram)
  foods?: string        // Opsiyonel: Yenilen yemekler
}
```
```jsonc
// Örnek
{"meal_type": "lunch", "calories": 650, "protein": 35, "foods": "Tavuk, pilav, salata"}
```

### Sport
```typescript
interface SportLogData {
  activity: string      // Zorunlu: "running", "weight training"
  duration_min: number  // Zorunlu: Dakika
  calories_burned?: number // Opsiyonel
}
```
```jsonc
// Örnek
{"activity": "running", "duration_min": 45, "calories_burned": 400}
```

### Dev
```typescript
interface DevLogData {
  project: string       // Zorunlu: Proje adı
  task: string          // Zorunlu: Görev açıklaması
  duration_min: number  // Zorunlu: Dakika
  commits?: number      // Opsiyonel: Commit sayısı
  language?: string     // Opsiyonel: Programlama dili
}
```
```jsonc
// Örnek
{"project": "LifeNexus", "task": "API integration", "duration_min": 120, "commits": 5, "language": "TypeScript"}
```

### Etsy
```typescript
interface EtsyLogData {
  product: string       // Zorunlu: Ürün adı
  revenue: number       // Zorunlu: Gelir ($)
  cost?: number         // Opsiyonel: Maliyet ($)
  profit?: number       // Opsiyonel: Kar ($)
}
```
```jsonc
// Örnek
{"product": "El yapımı kolye", "revenue": 45.99, "cost": 15, "profit": 30.99}
```

### Gaming
```typescript
interface GamingLogData {
  game: string          // Zorunlu: Oyun adı
  duration_min: number  // Zorunlu: Dakika
  achievement?: string  // Opsiyonel: Başarı
  platform?: 'PC' | 'PS5' | 'Xbox' | 'Switch' | 'Mobile'
}
```
```jsonc
// Örnek
{"game": "Elden Ring", "duration_min": 90, "platform": "PC", "achievement": "Margit defeated"}
```

---

### 4. goals

Kullanıcı hedefleri.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Goal ID |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `category_id` | UUID | FK → categories, NULLABLE | Kategori |
| `title` | TEXT | NOT NULL | Hedef başlığı |
| `description` | TEXT | NULLABLE | Açıklama |
| `target_value` | NUMERIC | NULLABLE | Hedef değer |
| `current_value` | NUMERIC | DEFAULT 0 | Mevcut değer |
| `unit` | TEXT | NULLABLE | Birim |
| `period` | TEXT | CHECK | daily/weekly/monthly/yearly |
| `is_completed` | BOOLEAN | DEFAULT FALSE | Tamamlandı mı |
| `start_date` | DATE | NOT NULL | Başlangıç |
| `end_date` | DATE | NULLABLE | Bitiş |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Güncelleme |

---

## Quest System Tabloları (2026-01-12)

> ⚠️ Migration: `supabase/migrations/20260112_quest_system.sql`

### 5. goal_key_results

OKR-style ölçülebilir sonuçlar. Goal başarısını ölçen alt metrikler.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Key Result ID |
| `goal_id` | UUID | FK → goals, NOT NULL | Ana hedef |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `title` | TEXT | NOT NULL | KR başlığı |
| `target_value` | NUMERIC | NOT NULL | Hedef değer |
| `current_value` | NUMERIC | DEFAULT 0 | Mevcut |
| `unit` | TEXT | NULLABLE | Birim |
| `weight` | INTEGER | DEFAULT 1 | Ağırlık (1-10) |
| `sort_order` | INTEGER | DEFAULT 0 | Sıralama |

### 6. daily_quests

Günlük görevler. Recurring veya tek seferlik olabilir.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Quest ID |
| `goal_id` | UUID | FK → goals, NULLABLE | Bağlı hedef |
| `key_result_id` | UUID | FK → key_results, NULLABLE | Bağlı KR |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `title` | TEXT | NOT NULL | Görev başlığı |
| `description` | TEXT | NULLABLE | Açıklama |
| `emoji` | TEXT | DEFAULT '✨' | Emoji icon |
| `difficulty` | TEXT | easy/medium/hard | Zorluk |
| `xp_reward` | INTEGER | DEFAULT 10 | XP ödülü |
| `is_recurring` | BOOLEAN | DEFAULT FALSE | Tekrarlayan mı |
| `recurrence_pattern` | TEXT | NULLABLE | daily/weekdays/weekends/mwf/tts/custom |
| `recurrence_days` | INTEGER[] | NULLABLE | Custom günler [0-6] |
| `scheduled_time` | TIME | NULLABLE | Planlanan saat |
| `scheduled_date` | DATE | NULLABLE | Tek sefer için tarih |
| `status` | TEXT | DEFAULT 'pending' | pending/completed/skipped |
| `is_ai_suggested` | BOOLEAN | DEFAULT FALSE | AI önerisi mi |

**Recurrence Patterns:**
- `daily`: Her gün
- `weekdays`: Hafta içi (Pzt-Cum)
- `weekends`: Hafta sonu (Cmt-Paz)
- `mwf`: Pazartesi, Çarşamba, Cuma
- `tts`: Salı, Perşembe, Cumartesi
- `custom`: Özel günler (recurrence_days ile)

### 7. quest_completions

Quest tamamlama kayıtları ve XP geçmişi.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Completion ID |
| `quest_id` | UUID | FK → daily_quests, NOT NULL | Quest |
| `goal_id` | UUID | FK → goals, NULLABLE | Hedef |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `completed_date` | DATE | NOT NULL | Tamamlama tarihi |
| `xp_earned` | INTEGER | NOT NULL | Toplam XP |
| `base_xp` | INTEGER | NOT NULL | Temel XP |
| `streak_bonus_xp` | INTEGER | DEFAULT 0 | Streak bonus |
| `time_bonus_xp` | INTEGER | DEFAULT 0 | Zaman bonus |
| `streak_count` | INTEGER | DEFAULT 1 | O anki streak |
| `notes` | TEXT | NULLABLE | Notlar |

### 8. rituals

Habit stacking zinciri. "X'den sonra Y yap" formatı.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Ritual ID |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `goal_id` | UUID | FK → goals, NULLABLE | Bağlı hedef |
| `trigger_habit` | TEXT | NOT NULL | Tetikleyici alışkanlık |
| `action` | TEXT | NOT NULL | Yapılacak aksiyon |
| `emoji` | TEXT | DEFAULT '⛓️' | Emoji |
| `xp_reward` | INTEGER | DEFAULT 5 | XP ödülü |
| `current_streak` | INTEGER | DEFAULT 0 | Mevcut streak |
| `longest_streak` | INTEGER | DEFAULT 0 | En uzun streak |
| `is_active` | BOOLEAN | DEFAULT TRUE | Aktif mi |

**Örnek:**
```
trigger_habit: "Kahve içtikten sonra"
action: "10 merdiven çık"
```

### 9. ritual_completions

Ritual tamamlama kayıtları.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Completion ID |
| `ritual_id` | UUID | FK → rituals, NOT NULL | Ritual |
| `user_id` | UUID | FK → users, NOT NULL | Kullanıcı |
| `completed_date` | DATE | NOT NULL | Tarih |
| `xp_earned` | INTEGER | NOT NULL | XP |
| `streak_count` | INTEGER | NOT NULL | Streak |

### 10. user_xp_stats

Kullanıcı XP istatistikleri ve seviye bilgisi.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Stats ID |
| `user_id` | UUID | FK → users, UNIQUE | Kullanıcı |
| `total_xp` | INTEGER | DEFAULT 0 | Toplam XP |
| `current_level` | INTEGER | DEFAULT 1 | Mevcut seviye |
| `xp_to_next_level` | INTEGER | DEFAULT 100 | Sonraki seviyeye |
| `xp_today` | INTEGER | DEFAULT 0 | Bugünkü XP |
| `xp_this_week` | INTEGER | DEFAULT 0 | Bu hafta |
| `xp_this_month` | INTEGER | DEFAULT 0 | Bu ay |
| `current_daily_streak` | INTEGER | DEFAULT 0 | Günlük streak |
| `longest_daily_streak` | INTEGER | DEFAULT 0 | En uzun streak |
| `quests_completed_count` | INTEGER | DEFAULT 0 | Toplam quest |
| `perfect_days_count` | INTEGER | DEFAULT 0 | Perfect day sayısı |
| `last_activity_date` | DATE | NULLABLE | Son aktivite |
| `last_perfect_day` | DATE | NULLABLE | Son perfect day |

---

## RLS Politikaları

### Tüm Tablolar (users, logs, goals)
```sql
-- SELECT
CREATE POLICY "Users can view own data"
ON [table] FOR SELECT
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert own data"
ON [table] FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update own data"
ON [table] FOR UPDATE
USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete own data"
ON [table] FOR DELETE
USING (auth.uid() = user_id);
```

### categories (İstisna)
```sql
-- SELECT only, public
CREATE POLICY "Categories are viewable by everyone"
ON categories FOR SELECT
USING (true);
```

### quest_templates & goal_templates (Global Read)
```sql
-- SELECT only, public (templates are shared)
CREATE POLICY "Quest templates are publicly readable"
ON quest_templates FOR SELECT
USING (true);

CREATE POLICY "Goal templates are publicly readable"
ON goal_templates FOR SELECT
USING (true);
```

---

## SQL Dosyaları

| Dosya | Açıklama |
|-------|----------|
| `supabase/schema.sql` | Ana şema (users, categories, logs, goals) |
| `supabase/migrations/20260112_quest_system.sql` | Quest System tabloları |
| `supabase/migrations/20260112_quest_templates.sql` | Quest Templates (124 şablon) |
| `supabase/migrations/20260112_goal_templates.sql` | Goal Templates (44 şablon) |
| `supabase/migrations/20260113_momentum_score_system.sql` | 🆕 Momentum Score System |

Supabase Dashboard > SQL Editor'da çalıştırın.

---

## 🆕 quest_templates Tablosu

124 pre-defined quest şablonu içerir. 6 kategori: trade, food, sport, dev, etsy, gaming.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Template ID |
| `category_slug` | TEXT | NOT NULL | Kategori slug'ı |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe identifier |
| `title` | TEXT | NOT NULL | Görev başlığı |
| `description` | TEXT | NULLABLE | Açıklama |
| `emoji` | TEXT | DEFAULT '⚡' | Emoji ikonu |
| `xp_reward` | INTEGER | CHECK (5-50) | XP ödülü |
| `difficulty` | TEXT | CHECK | easy/medium/hard |
| `time_of_day` | TEXT | CHECK | morning/afternoon/evening/anytime |
| `estimated_minutes` | INTEGER | NULLABLE | Tahmini süre |
| `is_recurring_default` | BOOLEAN | DEFAULT false | Varsayılan tekrar |
| `recurrence_pattern` | TEXT | CHECK | daily/weekdays/weekends/mwf/tts/custom |
| `goal_template_id` | UUID | FK → goal_templates | 🆕 Bağlı goal template |
| `progress_contribution` | NUMERIC | DEFAULT 1 | 🆕 Goal'e katkı |
| `sort_order` | INTEGER | DEFAULT 0 | Sıralama |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |

---

## 🆕 goal_templates Tablosu (2026-01-12)

> ⚠️ Migration: `supabase/migrations/20260112_goal_templates.sql`

44 pre-defined goal şablonu içerir. 6 kategori: food, sport, dev, trade, etsy, gaming.

| Sütun | Tip | Kısıtlar | Açıklama |
|-------|-----|----------|----------|
| `id` | UUID | PK | Template ID |
| `category_slug` | TEXT | NOT NULL | Kategori slug'ı |
| `slug` | TEXT | UNIQUE, NOT NULL | URL-safe identifier |
| `title` | TEXT | NOT NULL | Hedef başlığı |
| `description` | TEXT | NULLABLE | Açıklama |
| `emoji` | TEXT | DEFAULT '🎯' | Emoji ikonu |
| `metric_unit` | TEXT | NOT NULL | Ölçü birimi (kg, gün, %, vb.) |
| `metric_name` | TEXT | NOT NULL | Metrik adı |
| `default_target_value` | NUMERIC | NULLABLE | Varsayılan hedef değer |
| `progress_direction` | TEXT | CHECK | increase/decrease |
| `default_period` | TEXT | CHECK | daily/weekly/monthly/yearly |
| `default_duration_days` | INTEGER | DEFAULT 30 | Varsayılan süre |
| `difficulty` | TEXT | CHECK | easy/medium/hard |
| `completion_xp` | INTEGER | DEFAULT 500 | Tamamlama XP'si |
| `quest_progress_value` | NUMERIC | DEFAULT 1 | Quest başına ilerleme |
| `sort_order` | INTEGER | DEFAULT 0 | Sıralama |
| `is_active` | BOOLEAN | DEFAULT TRUE | Aktif mi |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Oluşturma |

**Kategori Dağılımı:**

| Kategori | Şablon Sayısı | Örnek |
|----------|--------------|-------|
| food | 8 | Kilo Vermek, Sağlıklı Beslenme |
| sport | 10 | Yağ Yakma, Günlük 10.000 Adım |
| dev | 8 | Proje Tamamla, Günlük Commit |
| trade | 6 | Trading Disiplini, Risk Yönetimi |
| etsy | 6 | Aylık Gelir Hedefi, Yeni Ürün |
| gaming | 6 | Rank Yükseltme, Yayın Tutarlılığı |

---

## goals Tablosuna Eklenen Yeni Sütunlar

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `goal_template_id` | UUID FK | Bağlı goal template |
| `metric_unit` | TEXT | Ölçü birimi |
| `metric_name` | TEXT | Metrik adı |
| `momentum_score` | NUMERIC (0-100) | 🆕 Tutarlılık puanı |
| `habit_maturity_days` | INTEGER | 🆕 Alışkanlık olgunluk günleri |

---

## 🆕 Momentum Score System (2026-01-13)

> ⚠️ Migration: `supabase/migrations/20260113_momentum_score_system.sql`

### Dual Progress System
Hedefler artık iki tip ilerleme gösteriyor:
- **Direct Progress**: Kalori, adım gibi ölçülebilir metrikler
- **Momentum Score**: Tutarlılık bazlı dolaylı katkı (0-100)

### Momentum Hesaplama Formülü
```
Momentum = (
    Daily Completion Rate × 40  +
    Streak Multiplier × 30      +
    Habit Maturity × 20         +
    Early Bird Bonus × 10
) / max 100
```

### Streak Çarpanları
| Gün | Çarpan | Label |
|-----|--------|-------|
| 3-6 | ×1.2 | RISING |
| 7-13 | ×1.4 | STREAK |
| 14-20 | ×1.6 | MASTER |
| 21+ | ×2.0 | LEGEND |

### Alışkanlık Olgunluk Aşamaları
| Gün | Emoji | Aşama |
|-----|-------|-------|
| 0-6 | 🌱 | Tohum |
| 7-13 | 🌿 | Filiz |
| 14-20 | 🌳 | Büyüme |
| 21+ | 🌲 | Olgun |

### quest_templates ve daily_quests'e Eklenen Sütun
| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `contribution_type` | TEXT | 'direct' veya 'momentum' |

---

**Son Güncelleme:** 2026-01-13 01:10 UTC+3
**Versiyon:** 2.3.0 (Momentum Score System eklendi)

