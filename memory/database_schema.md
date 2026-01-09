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

---

## SQL Dosyası

Şema oluşturma SQL'i: `supabase/schema.sql`

Supabase Dashboard > SQL Editor'da çalıştırın.

---

**Son Güncelleme:** 2026-01-10
**Versiyon:** 1.0.0
