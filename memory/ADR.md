# LifeNexus - Architecture Decision Records (ADR)

> Bu dosya önemli mimari kararları ve gerekçelerini kayıt altında tutar.
> "Neden X değil de Y seçildi?" sorusunun cevabı burada bulunur.

---

## ADR Format

```
## ADR-XXX: [Başlık]

**Tarih:** YYYY-MM-DD
**Durum:** Kabul Edildi | Reddedildi | Değiştirildi
**Karar Vericiler:** [İsimler]

### Bağlam
Problemi veya ihtiyacı açıkla.

### Karar
Ne kararı alındı?

### Alternatifler
Değerlendirilen diğer seçenekler.

### Sonuçlar
Kararın etkileri ve trade-off'lar.
```

---

## ADR-001: WebGL/React Three Fiber Kullanımı

**Tarih:** 2026-01-10  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

LifeNexus, kullanıcının günlük aktivitelerini takip eden bir uygulamadır. Sadece formlar ve listelerle yapılabilecek bir uygulama olmasına rağmen, **görsel motivasyon** ve **benzersiz kullanıcı deneyimi** hedeflenmektedir.

Kullanıcının "Habitat"ını görmesi ve tamamladığı kategorilerin fiziksel olarak değişmesi, motivasyonu artırır.

### Karar

**React Three Fiber (R3F)** ve **Drei** kütüphaneleri kullanılarak 3D bir sahne oluşturulacaktır.

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Vanilla HTML/CSS** | Basit, hızlı | Sıkıcı, motivasyon düşük |
| **Framer Motion 2D** | Güzel animasyonlar | Benzersiz değil |
| **Three.js (saf)** | Tam kontrol | React entegrasyonu zor |
| **R3F ✓** | React-native, deklaratif | Öğrenme eğrisi |

### Sonuçlar

**Pozitif:**
- Benzersiz, "WOW efekti" yaratan UI
- Gamification potansiyeli yüksek
- Portfolio projesi olarak dikkat çekici

**Negatif:**
- Bundle size artışı (~300KB)
- Mobile performance dikkat gerektirir
- Öğrenme eğrisi yüksek

**Mitigation:**
- Dynamic DPR ile mobile optimize
- Shadow/antialias mobile'da kapalı
- Lazy loading ile initial load hızlı

---

## ADR-002: JSONB Veri Yapısı (logs.data)

**Tarih:** 2026-01-10  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

6 farklı kategori var ve her birinin farklı veri yapısı var:

- **Trade:** pair, side, entry, pnl
- **Food:** meal_type, calories, protein
- **Sport:** activity, duration_min
- **Dev:** project, task, duration_min, commits
- **Etsy:** product, revenue, profit
- **Gaming:** game, duration_min, platform

Her kategori için ayrı tablo oluşturmak:
- 6+ tablo
- JOIN complexity
- Schema migration zorluğu

### Karar

Tek bir `logs` tablosu ile **JSONB `data` sütunu** kullanılacaktır.

```sql
CREATE TABLE logs (
  id UUID PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  data JSONB NOT NULL DEFAULT '{}',
  ...
);
```

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Ayrı tablolar** | Type safety, indexing | 6+ tablo, complex queries |
| **EAV Pattern** | Flexible | Query nightmare |
| **JSONB ✓** | Flexible, single table | Runtime validation |
| **MongoDB** | Native JSON | Ayrı DB, complexity |

### Sonuçlar

**Pozitif:**
- Tek tablo, basit schema
- Yeni kategori ekleme kolay
- GIN index ile JSONB query hızlı
- Supabase JSONB desteği mükemmel

**Negatif:**
- Compile-time type safety yok
- Runtime validation gerekli

**Mitigation:**
- Zod ile frontend validation
- TypeScript interface'ler (LogData union type)
- Database constraints (CHECK)

---

## ADR-003: PWA (Progressive Web App) Yaklaşımı

**Tarih:** 2026-01-10  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi

### Bağlam

Uygulama mobil cihazlarda da kullanılacak. Seçenekler:

1. Sadece responsive web
2. PWA
3. React Native
4. Native iOS/Android

### Karar

**PWA** olarak başlanacak. İleride **Native iOS** geçişi değerlendirilebilir.

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Web only** | Basit | Mobile UX zayıf |
| **PWA ✓** | Install, offline, push | Store yok |
| **React Native** | Native feel | Ayrı codebase |
| **Native iOS** | Best UX | Swift gerekli, zaman |

### Sonuçlar

**Pozitif:**
- Ana ekrana eklenebilir
- Offline capability (future)
- Push notification (future)
- Single codebase
- App Store approval gereksiz

**Negatif:**
- iOS'ta bazı kısıtlamalar
- Native kadar smooth değil
- Background sync sınırlı

**Future Path:**
- MVP: PWA
- v2: Capacitor ile native shell
- v3: SwiftUI ile native iOS (opsiyonel)

---

## ADR-004: Supabase Backend Seçimi

**Tarih:** 2026-01-10  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi

### Bağlam

Backend ihtiyaçları:
- Authentication
- PostgreSQL database
- Real-time updates
- File storage (future)

### Karar

**Supabase** BaaS platformu kullanılacaktır.

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Firebase** | Mature, Google | NoSQL, vendor lock |
| **Supabase ✓** | PostgreSQL, OSS | Daha yeni |
| **Custom API** | Tam kontrol | Development time |
| **Planetscale** | MySQL, scaling | Auth yok |

### Sonuçlar

**Pozitif:**
- PostgreSQL (gerçek RDBMS)
- Row Level Security (RLS)
- Real-time subscriptions
- Generous free tier
- Open source (self-host option)
- Next.js SDK mükemmel

**Negatif:**
- Firebase kadar mature değil
- Bazı edge case'lerde limit

---

## ADR-005: Tailwind CSS Styling

**Tarih:** 2026-01-10  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** AI Architect

### Bağlam

Styling yaklaşımı seçilmeli.

### Karar

**Tailwind CSS v4** utility-first framework.

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **CSS Modules** | Isolation | Verbose |
| **styled-components** | Dynamic | Runtime cost |
| **Tailwind ✓** | Fast dev, small bundle | Class clutter |
| **Panda CSS** | Type-safe | Yeni, less docs |

### Sonuçlar

**Pozitif:**
- Hızlı development
- Production'da küçük bundle (purge)
- Dark mode kolay
- Responsive prefix'ler

**Negatif:**
- HTML'de uzun class listeleri
- Design system discipline gerekli

---

## Template: Yeni ADR

```markdown
## ADR-XXX: [Başlık]

**Tarih:** YYYY-MM-DD  
**Durum:** 🟡 Tartışılıyor | ✅ Kabul Edildi | ❌ Reddedildi  
**Karar Vericiler:** [İsimler]

### Bağlam
[Problem veya ihtiyaç]

### Karar
[Alınan karar]

### Alternatifler
| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| A | ... | ... |
| B ✓ | ... | ... |

### Sonuçlar
**Pozitif:** ...
**Negatif:** ...
**Mitigation:** ...
```

---

**Son Güncelleme:** 2026-01-10
**Toplam ADR:** 5
