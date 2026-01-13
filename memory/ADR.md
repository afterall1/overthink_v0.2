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

## ADR-006: Quest System Architecture (Goal-Action Integration)

**Tarih:** 2026-01-12  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Kullanıcıların hedeflerine ulaşmasını kolaylaştırmak için günlük aksiyon takibi gerekiyordu. Mevcut Goals sistemi sadece progress tracking yapıyordu, günlük alışkanlık oluşturma mekanizması eksikti.

### Karar

**Goal-Action Hierarchy** mimarisi kabul edildi:

```
Goal → Key Results (OKR) → Daily Quests → Rituals (Habit Stacking)
```

**Yeni tablolar:**
- `goal_key_results` - OKR-style ölçülebilir sonuçlar
- `daily_quests` - Recurring/tek seferlik görevler
- `quest_completions` - Tamamlama kayıtları + XP
- `rituals` - Habit stacking zinciri
- `ritual_completions` - Ritual kayıtları
- `user_xp_stats` - Kullanıcı XP istatistikleri

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Simple Tasks** | Basit | Gamification yok |
| **Third-party (Habitica)** | Hazır | Entegrasyon zor |
| **Custom Quest System ✓** | Tam kontrol, gamification | Development time |

### Sonuçlar

**Pozitif:**
- Duolingo-inspired XP sistemi motivasyonu artırır
- Streak mekanizması alışkanlık oluşturur
- Habit stacking bilimsel olarak etkili
- Perfect Day bonusu günlük tutarlılığı ödüllendirir

**Negatif:**
- 6 yeni tablo, schema complexity
- XP hesaplama mantığı karmaşık
- Migration gerekli

**Mitigation:**
- `questEngine.ts` tüm hesaplamaları merkezi yönetir
- Comprehensive TypeScript types ile type safety

---

## ADR-007: AI Council Integration (Gemini 2.0)

**Tarih:** 2026-01-12  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi

### Bağlam

Kullanıcıların hedef belirleme ve progress tracking'de AI desteğine ihtiyaçları vardı. Motivasyonel mesajlar, goal insights ve smart öneriler için AI entegrasyonu gerekiyordu.

### Karar

**Google Gemini 2.0 Flash** modeli ile AI Council entegrasyonu.

```
src/lib/ai/
├── aiConfig.ts           # Model: gemini-2.0-flash-exp
├── aiService.ts          # Core service
├── userDataAggregator.ts # Context builder
└── prompts/              # System prompts
```

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **OpenAI GPT-4** | Mature, powerful | Pahalı, rate limits |
| **Claude** | Nuanced, safe | API erişimi sınırlı |
| **Gemini ✓** | Hızlı, generous quota | Daha yeni |
| **Local LLM** | Privacy | Resource intensive |

### Sonuçlar

**Pozitif:**
- Gemini 2.0 Flash çok hızlı response
- Google Cloud pricing uygun
- @google/genai SDK kolay kullanım
- Turkish language support iyi

**Negatif:**
- Google dependency
- API key management
- Rate limit dikkat

**Mitigation:**
- Error handling with fallback
- Response caching (planned)
- User context aggregation for quality

---

## ADR-008: Gamification XP & Level System

**Tarih:** 2026-01-12  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** AI Architect (Expert Council)

### Bağlam

Quest System için motivasyon mekanizması gerekiyordu. Duolingo'nun başarılı gamification stratejileri referans alındı.

### Karar

**20+ Level XP System** with exponential curve:

```typescript
// XP per level: 100 * 1.5^(level-1)
Level 1:  0-100 XP      (100 XP)
Level 2:  100-250 XP    (150 XP)
Level 3:  250-475 XP    (225 XP)
...
Level 20: 100K+ XP
```

**XP Sources:**
- Quest completion: 10-25 XP (difficulty based)
- Streak bonus: +2 XP per streak day (max +20 XP)
- Time bonus: +5 XP (sabah tamamlama)
- Perfect Day: +100 XP (tüm questler)
- Ritual: 5-15 XP

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Linear XP** | Basit | Monoton |
| **Points only** | Hesaplanabilir | Less engaging |
| **Exponential ✓** | Duolingo-proven | Complex math |
| **Badge system** | Visual | No progression feel |

### Sonuçlar

**Pozitif:**
- Duolingo-proven engagement model
- Clear progression feeling
- Streak mechanics create habit
- Loss aversion (streak break) motivates

**Negatif:**
- "Gaming" hissi yaratabilir
- XP inflation riski
- Competitive olmayan kullanıcılar için

**Mitigation:**
- Focus on personal progress, not leaderboards
- Streak freezes (planned)
- XP audit system (planned)

---

## ADR-009: Goal-Quest Auto-Progress System

**Tarih:** 2026-01-12  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Mevcut sistemde kullanıcılar hedef oluştururken:
1. Tüm alanları manuel dolduruyor (title, description, target, unit, period...)
2. İlişkili görevleri ayrı ayrı seçiyor
3. Görev tamamlandığında hedef ilerlemesi otomatik güncellenmiyor

Bu süreç:
- Çok fazla manuel iş gerektiriyor
- Hata yapmaya açık
- Motivasyonu düşürüyor

### Karar

**Goal Templates + Auto-Progress** sistemi uygulandı:

1. **44 adet Goal Template** oluşturuldu (6 kategori)
2. **Quest Templates** → **Goal Templates** bağlantısı kuruldu (`goal_template_id`)
3. Goal oluşturulduğunda **otomatik olarak bağlı questler oluşturuluyor**
4. Quest tamamlandığında **hedef ilerlemesi otomatik artıyor** (`progress_contribution`)

```
User → Goal Template Seç → Auto-Create Goal + Auto-Create Quests
                          ↓
Quest Tamamla → Goal current_value += progress_contribution
                          ↓
Goal %100 → Auto Complete + XP Reward
```

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Manuel goal + quest** | Kullanıcı tam kontrol | Çok yavaş, hata riski |
| **AI-generated goals** | Akıllı, kişiselleştirilmiş | Karmaşık, maliyet |
| **Template System ✓** | Hızlı, tutarlı, genişletilebilir | Şablon güncellemesi gerekir |
| **Wizard-only** | Adım adım | Yine de manuel |

### Sonuçlar

**Pozitif:**
- Hedef oluşturma süresi: ~5 dakika → ~30 saniye
- Otomatik ilerleme takibi = daha az manuel iş
- Tutarlı metrikler ve birimler
- Fallback mekanizması (category_slug) ile robustness

**Negatif:**
- Şablonlar statik (DB'de)
- Migration çalıştırılması gerekiyor
- TypeScript tipleri yeniden oluşturulmalı

**Mitigation:**
- Fallback: Bağlı quest yoksa category_slug ile ara
- Debug logs: Sorun tespiti için detaylı console.log
- Özel hedef seçeneği: Template seçmek zorunlu değil

---

## ADR-010: Momentum Score System (Dual Progress)

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Expert Council (UX Psychologist, Data Visualization Expert, UI Designer)

### Bağlam

Bazı alışkanlıklar hedefe dolaylı katkı sağlar:
- "Sağlıklı kahvaltı yap" → Kilo Vermek hedefi (kalori yakmaz ama tutarlılık önemli)
- "Su iç 2L" → Sağlık hedefi (direkt metrik yok)

Bu tür görevler tamamlandığında kullanıcı ilerleme hissi yaşamıyor.

### Karar

**Dual Progress System** uygulandı:
1. **Direct Progress**: Kalori, adım, kg gibi ölçülebilir değerler
2. **Momentum Score**: Tutarlılık bazlı 0-100 puan

**Momentum Formülü:**
```
Momentum = Daily Completion×40 + Streak×30 + Maturity×20 + EarlyBird×10
```

Her görev `contribution_type` ile işaretlenir: `'direct'` veya `'momentum'`

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| Tek tip ilerleme | Basit | Dolaylı katkı görünmez |
| Bonus XP sistemi | Anlaşılır | Hedefe bağlı değil |
| **Dual Progress ✓** | Her katkı görünür | Ekstra UI gerekli |

### Sonuçlar

**Pozitif:**
- Her alışkanlık görünür etki yaratır
- Streak ve tutarlılık ödüllendirilir
- Duolingo-benzeri motivasyon döngüsü
- Olgunluk aşamaları (🌱→🌲) görsel ilerleme sağlar

**Negatif:**
- İki farklı ilerleme metriği karmaşık görünebilir
- Migration çalıştırılması gerekiyor
- GoalDetailModal tamamen yeniden yazıldı

**Mitigation:**
- MomentumGauge ile tek bakışta anlaşılır görselleştirme
- Quest Contribution List ile hangi görevin ne katkı sağladığı açık
- Streak multiplier badge ile bonus görünür

---

## ADR-011: Quest-to-Goal Progress Sync Simplification

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Quest tamamlandığında goal progress'i güncellenmiyor. 6 görev tamamlanmış olmasına rağmen goal progress 0% gösteriyor.

**Tespit Edilen 3 Bug:**
1. `createQuestFromTemplate` fonksiyonu `progress_contribution` değerini template'ten kopyalamıyordu
2. `completeQuest` fonksiyonu sadece `contribution_type === 'direct'` kontrolü yapıyordu (bu sütun hiç kullanılmıyordu)
3. Recurring quest'ler `scheduled_date === today` filtresinden geçemiyordu

### Karar

**Basitleştirme yaklaşımı:**

1. **Her quest completion = Her zaman progress eklenir**
   - `contribution_type` kontrolü kaldırıldı
   - Default `progress_contribution = 1` (template'te yoksa)

2. **Template'ten progress_contribution kopyalanır**
   - `createQuestFromTemplate` L888'de eklendi

3. **Recurring quest filter düzeltmesi**
   - `is_recurring || scheduled_date === today`

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| Contribution type ile devam | Granüler kontrol | Karmaşıklık, bug kaynağı |
| **Her completion = progress ✓** | Basit, tahmin edilebilir | Çok hassas kontrol yok |
| Sadece manual progress | Kullanıcı kontrolü | Quest-goal bağlantısı kopuk |

### Sonuçlar

**Pozitif:**
- Her quest tamamlandığında goal progress artıyor
- Kullanıcı net bir ilerleme görüyor
- Kod daha basit ve tahmin edilebilir

**Negatif:**
- `contribution_type = 'momentum'` artık anlamsız (kaldırılabilir)
- Mevcut quest'lerin `progress_contribution` değeri NULL ise default 1 kullanılıyor

**Mitigation:**
- `20260113_fix_quest_progress_contribution.sql` migration ile mevcut quest'ler düzeltildi
- Linked Quests panelinde "Hedefe Katkı Sağladı" rozeti ile şeffaflık

---

## ADR-012: iOS Mobile Foundation (Bottom Sheet Pattern)

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

LifeNexus iOS App Store'da yayınlanacak. Mevcut Goal Detail Panel web-oriented centered modal kullanıyordu. iOS kullanıcıları için native hissiyat kritik önem taşıyor.

**Tespit Edilen Sorunlar:**
- Safe area insets (Dynamic Island, Home Indicator) yoksayılıyordu
- Touch targets < 44pt (iOS HIG ihlali)
- Haptic feedback yoktu
- Gesture navigation (pull-to-dismiss) eksikti

### Karar

**iOS-native Bottom Sheet Pattern** implementasyonu:
1. 3 detent seviyesi: collapsed (30%), medium (55%), expanded (92%)
2. CSS `env(safe-area-inset-*)` ile Dynamic Island ve Home Indicator desteği
3. Tüm butonlar min 44pt touch target
4. Web Vibration API ile cross-platform haptic feedback

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Centered Modal** | Basit | iOS'ta doğal değil |
| **Full-screen Modal** | Basit | Context kaybı |
| **Native Capacitor Sheet** | Tam native | Ekstra dependency |
| **Custom Bottom Sheet ✓** | iOS feel + Web uyumlu | Custom geliştirme |

### Sonuçlar

**Pozitif:**
- iOS HIG %95+ uyumluluk
- Apple Maps, Find My, Stocks ile tutarlı UX
- Haptic feedback ile premium hissiyat
- PWA ve Native build'da çalışır

**Negatif:**
- Custom component maintenance
- Web'de haptic feedback sınırlı

**Dosyalar:**
```
src/components/hud/Goals/GoalDetail/layout/
├── BottomSheet.tsx       # Detent-based sheet
├── SheetHeader.tsx       # 44pt touch targets
└── SafeAreaContainer.tsx # Safe area wrapper

src/hooks/useHaptics.ts   # Cross-platform haptics
```

---

## ADR-013: Cascade Delete with XP Rollback

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Quest veya Goal silindiğinde veri tutarsızlığı oluşuyordu:
- Quest silinince `quest_completions` kayıtları yetim kalıyordu
- Kazanılan XP geri alınmıyordu
- Goal silinince bağlı quest'ler silinmiyordu
- Goal progress rollback yapılmıyordu

### Karar

**Full Cascade Delete + XP Rollback** sistemi uygulandı:

**deleteQuest():**
1. Tüm `quest_completions` kayıtlarını getir
2. Toplam XP hesapla ve `user_xp_stats`'tan düş
3. Eğer goal'a bağlıysa, `progress_contribution × completion_count` kadar goal progress'i geri al
4. `quest_completions` kayıtlarını sil
5. Quest'i sil

**deleteGoal():**
1. Bağlı tüm quest ID'lerini getir
2. Bu quest'lerin tüm `quest_completions` kayıtlarını getir
3. Toplam XP ve completion count hesapla
4. `user_xp_stats`'tan XP ve count düş
5. Tüm completions'ları sil
6. Tüm quest'leri sil
7. Goal'u sil

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Soft Delete** | Veri korunur | Karmaşık, storage maliyeti |
| **DB Triggers** | Otomatik | Debug zorluğu |
| **App-level Cascade ✓** | Tam kontrol, XP rollback | Daha fazla kod |

### Sonuçlar

**Pozitif:**
- Veri tutarlılığı garanti
- XP istatistikleri her zaman doğru
- Goal progress senkronize
- Orphan kayıt oluşmaz

**Negatif:**
- Silme işlemi daha yavaş (multiple queries)
- Transaction rollback yok (Supabase JS limitation)

**Mitigation:**
- Admin client kullanımı ile RLS bypass
- Detaylı debug logs

**Dosyalar:**
- `src/actions/quests.ts` → `deleteQuest()`
- `src/actions/goals.ts` → `deleteGoal()`

---

## ADR-014: Context-Aware Health Profile Integration

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Council

### Bağlam

AI Health Quest System oluşturuldu (BMR/TDEE hesaplama, AI quest üretimi). İlk yaklaşım: Global HealthFAB ekleyerek tüm kullanıcılara göstermekti. Ancak:

- Her kullanıcı sağlık takibi yapmak istemiyor
- Trade, Dev, Etsy, Gaming kategorilerinde sağlık profili gereksiz
- Sadece **food** ve **sport** kategorilerinde anlamlı

### Karar

**Context-aware integration:** Sağlık profili sadece food/sport kategorisi hedef oluştururken gösterilecek.

**Uygulama:**
1. Global HealthFAB kaldırıldı
2. `useHealthProfile` hook oluşturuldu
3. `HealthProfileBanner` component oluşturuldu
4. GoalCreationWizard Step 2'de food/sport template seçildiğinde banner gösteriliyor
5. Banner'dan HealthProfileWizard açılabiliyor

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Global FAB** | Kolay erişim | Alakasız kullanıcıları rahatsız eder |
| **Ayarlar sayfası** | Gizli | Keşfedilebilirlik düşük |
| **Context-aware ✓** | Alakalı zamanda göster | Biraz daha kod |

### Sonuçlar

**Pozitif:**
- UX iyileştirmesi - alakasız özellikler gizli
- Kullanıcı yolculuğuna entegre
- Profil var mı kontrolü ile akıllı banner

**Negatif:**
- GoalCreationWizard'a ek complexity

**Dosyalar:**
- `src/hooks/useHealthProfile.ts`
- `src/components/hud/Health/HealthProfileBanner.tsx`
- `src/components/hud/Goals/GoalCreationWizard.tsx`

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

## ADR-015: Goal Creation Auto-Population from Health Profile

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Council (Expert Panel)

### Bağlam

HealthProfileWizard'da kullanıcı şunları giriyor:
- `weight_kg`: Mevcut kilo (örn: 97 kg)
- `target_weight_kg`: Hedef kilo (örn: 76 kg)
- `goal_pace`: Hız (slow: 0.3, moderate: 0.5, aggressive: 0.75 kg/hafta)

GoalCreationWizard'da "Kilo Vermek" template'i seçildiğinde:
- `target_value`: Kaç kg vermek istiyorsun? (YENİDEN SORIUYOR)
- `duration`: Süre seç (YENİDEN SORIUYOR)

**Problem:** DRY (Don't Repeat Yourself) ihlali. Aynı veri iki kez toplanıyor.

### Karar

**Sağlık profilinden otomatik değer dolumu + READ-ONLY summary:**

1. Weight-based template seçildiğinde (`lose_weight`, `gain_muscle`):
   - Profil varsa → otomatik hesapla
   - `target_value = weight_kg - target_weight_kg`
   - `duration = (weightDiff / weeklyRate) * 7`
   
2. UI değişikliği:
   - `autoPopulated = true` → READ-ONLY summary göster (input YOK)
   - `autoPopulated = false` → editable inputs göster

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Inputları göster, override izni ver** | Esneklik | Hala DRY ihlali, kafa karıştırıcı |
| **Disabled input + pre-fill** | Görsel tutarlılık | "Neden değiştiremiyorum?" frustrasyonu |
| **READ-ONLY summary ✓** | Temiz UX, tek kaynak | Profil değişikliği gerekirse ayrı flow |
| **Profili yoksay, manuel sor** | Basit kod | Kullanıcı aynı şeyi iki kez girer |

### Sonuçlar

**Pozitif:**
- DRY prensibi korunuyor
- `user_health_profiles` tek kaynak (Single Source of Truth)
- Kullanıcı aynı bilgiyi tekrar girmek zorunda değil
- Goal creation süreci hızlanıyor

**Negatif:**
- Farklı bir hedef oluşturmak isterse profili güncellemeli
- Non-weight goals için logic farklı

**Dosyalar:**
- `src/components/hud/Goals/GoalCreationWizard.tsx`
  - `autoPopulated` state
  - `handleTemplateSelect` → auto-population logic
  - Conditional rendering: READ-ONLY summary vs editable inputs

---

## ADR-016: Step 3 UX Simplification - Removing Redundant Selectors

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Expert Council (4/4 Onay)

### Bağlam

GoalCreationWizard Step 3/5'te iki selector vardı:
1. **En İyi Zaman Dilimi** (`best_time_of_day`): morning, afternoon, evening, anytime
2. **Zorluk Seviyesi** (`difficulty_level`): easy, medium, hard, extreme

**Problemler:**
1. `goalCalculator.ts` zaten `feasibilityScore` hesaplıyordu - sistem ile kullanıcı seçimi çakışabilir
2. `best_time_of_day` değeri hiçbir yerde kullanılmıyordu (quest scheduling YOK)
3. `difficulty_level` quest/goal logic'inde kullanılmıyordu (template'ten geliyor)
4. Cognitive load: 8 ekstra karar noktası

### Karar

**Her iki selector da Step 3'ten kaldırıldı:**

1. `GoalWizardData` interface'den field'lar kaldırıldı
2. `TIME_OF_DAY_OPTIONS` ve `DIFFICULTY_OPTIONS` sabitleri kaldırıldı
3. `Step3When` bileşeni sadeleştirildi - sadece tarih seçimi + GoalInsightCard
4. "Akıllı Sistem" bilgi notu eklendi

**NOT:** `goals` veritabanı tablosunda bu sütunlar hala mevcut (legacy, optional). Wizard artık bunları sormasa da, veritabanı şeması değiştirilmedi.

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Koru, ama collapsed yap** | Gelişmiş kullanıcılar erişebilir | Hala UI karmaşıklığı |
| **Koru, read-only göster** | Şeffaflık | Gereksiz complexity |
| **Tamamen kaldır ✓** | Temiz UX, DRY | Gelecekte gerekirse tekrar ekle |
| **Sadece difficulty kaldır** | Kısmi iyileştirme | Tutarsız mantık |

### Sonuçlar

**Pozitif:**
- UX sadeleşti (8 karar → 0 karar)
- Sistem tutarlılığı arttı (feasibility tek kaynak)
- Step 3 scroll azaldı (~300px → ~100px)
- Cognitive load düştü

**Negatif:**
- Notification timing için `best_time_of_day` gerekirse Phase 9+'da tekrar eklenmeli
- Legacy veri: DB'de bu field'lar hala var (backward compatible)

**Dosyalar:**
- `src/components/hud/Goals/GoalCreationWizard.tsx`
  - Interface, constants (removed)
  - Step3When component (simplified)
- `src/app/page.tsx`
  - goalPayload field'ları kaldırıldı

---

## ADR-017: Step 4 UI Skip - Auto-Generated Milestones

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Expert Council (3/4 Onay)

### Bağlam

GoalCreationWizard Step 4/5'te (Ara Hedefler) kullanıcı manuel milestone girişi yapıyordu:
- "Ara hedef adı" text input
- Target value number input
- "+ Ara Hedef Ekle" butonu

**Sorun:** `useEffect` zaten `target_value` değiştiğinde %25, %50, %75 milestone'ları **otomatik oluşturuyordu**. Manuel input gereksiz ve kafa karıştırıcıydı.

### Karar

**Step 4 UI'ı wizard'dan atlandı, milestone backend sistemi korundu:**

1. STEPS array 5 → 4 adıma indirildi
2. `Step4How` artık render edilmiyor
3. `useEffect` ile otomatik milestone oluşturma korunuyor
4. `goal_milestones` DB tablosu korunuyor
5. `JourneyPath.tsx` görselleştirmesi korunuyor
6. XP sistemi korunuyor

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Tamamen kaldır** | Basit | ~400 satır kod, DB migration, XP bozulur |
| **Opsiyonel accordion** | Güç kullanıcılar için | Karmaşık UI |
| **UI atla, backend koru ✓** | Hızlı, sade | İleri düzey özelleştirme yok |

### Sonuçlar

**Pozitif:**
- Wizard adım sayısı: 5 → 4
- Cognitive load azaldı
- JourneyPath görselleştirmesi korunuyor
- XP sistemi çalışmaya devam ediyor
- DB migration gereksiz

**Negatif:**
- Kullanıcılar milestone'ları özelleştiremiyor (gelecekte "Düzenle" eklenebilir)

**Dosyalar:**
- `src/components/hud/Goals/GoalCreationWizard.tsx`
  - STEPS array (4 adım)
  - Navigation logic (max 4)
  - Progress calculation (/4)
  - Step rendering (skip Step4How)

---

## ADR-018: AI-Driven Quest Generation in Goal Wizard

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Expert Council Önerisi, Kullanıcı Onayı

### Bağlam

GoalCreationWizard Step 4'te (Görevler) kullanıcı manuel olarak quest template'lerden seçim yapıyordu. Bu yaklaşımın sorunları:
1. Kullanıcı hangi görevlerin hedefe uygun olduğunu bilmiyor
2. Template'ler genel, kişiselleştirilmiş değil
3. Önceki wizard adımlarındaki veriler (motivasyon, hedef, timeline) kullanılmıyor

### Karar

**Step 4'ü AI-driven otomatik quest generation sistemiyle değiştirdik:**

1. `src/actions/wizardAI.ts` oluşturuldu (330 satır)
2. `Step4AIQuests` component oluşturuldu (290 satır)
3. Wizard verileri AI context'e dönüştürülüyor
4. AI başarısız olursa template fallback

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Manual selection (mevcut)** | Basit | Kişiselleştirilmiş değil |
| **AI önerili + manual** | Hibrit | Karmaşık UI |
| **Tam AI-driven ✓** | Kişisel, akıllı | API latency (~3sn) |

### Sonuçlar

**Pozitif:**
- Wizard input'ları (motivation, goal, timeline) kullanılıyor
- Health profile ile zenginleştirilmiş context
- Bilimsel gerekçeli görevler
- "Yenile" ile farklı öneriler

**Negatif:**
- AI latency (2-5 saniye)
- API maliyeti

**Mitigation:**
- Loading skeleton UI
- Template-based fallback
- Generic quests son çare

**Dosyalar:**
- `src/actions/wizardAI.ts` (YENİ)
- `src/components/hud/Goals/GoalCreationWizard.tsx`
  - `Step4AIQuests` component
  - `GoalWizardData.ai_generated_quests` field

---

## ADR-019: Goal-Specific AI Prompt Architecture

**Tarih:** 2026-01-13  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

AI quest üretim sistemi, hedef tipinden bağımsız olarak aynı generic prompt'u kullanıyordu. Bu durum şu sorunlara yol açtı:
- Su içme hedefine diyet görevleri öneriliyordu
- Kas kazanma hedefine kalori açığı hesaplanıyordu
- Oruç hedefine yemek tarifleri öneriliyordu

### Karar

**Modüler Prompt Mimarisi** uygulandı:
1. Her hedef tipi için ayrı prompt dosyası (`hydrationPrompt.ts`, `muscleGainPrompt.ts` vb.)
2. Her prompt'ta **YASAKLAR** bölümü (o hedef için uygunsuz görevler)
3. `healthPromptComposer.ts` ile merkezi prompt kompozisyonu
4. `wizardAI.ts` artık wizard hedef tipini HealthProfile hedefinden öncelikli kullanıyor

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Tek Büyük Prompt** | Basit | Hedef karışıklığı |
| **Prompt Parametreleri** | Orta karmaşıklık | Sınırlı kişiselleştirme |
| **Modüler Prompt Dosyaları ✓** | Tam izolasyon, kolay genişleme | Daha fazla dosya |

### Sonuçlar

**Pozitif:**
- Her hedef tipi kendi bağlamında optimize edilmiş görevler alır
- YASAKLAR sistemi yanlış önerileri önler
- Yeni hedef tipleri eklenmesi kolay (yeni dosya + registry kaydı)
- Kalori hesaplaması wizard hedefine göre doğru çalışır

**Negatif:**
- 13 prompt dosyası (daha önce 3)
- Her hedef tipi için context builder gerekli

**Dosyalar:**
- `src/lib/ai/prompts/*.ts` (13 dosya)
- `src/lib/ai/goalSpecificContexts.ts`
- `src/actions/wizardAI.ts` (buildAIContext düzeltildi)

---

## ADR-020: Goal Synergy Intelligence System

**Tarih:** 2026-01-14  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Kullanıcılar birden fazla aktif hedefe sahip olabilir ve bu hedefler arasında ilişkiler vardır:
- **Sinerjik:** Kilo verme + Yağ yakma (aynı görevler her ikisine katkı sağlar)
- **Tamamlayıcı:** Kas kazanma + Protein hedefi
- **Çatışmalı:** Kilo verme + Kas kazanma (çelişen stratejiler)

Mevcut sistemde bir quest yalnızca tek bir hedefe bağlıydı.

### Karar

**Goal Synergy Intelligence System** implementasyonu:
1. Junction table (`quest_goal_contributions`) ile çoklu hedef bağlantısı
2. AI context injection ile mevcut görev tekrarlarını önleme
3. UI'da sinerji uyarıları ve multi-goal badgeleri

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Tek Hedef Bağlantısı** | Basit | Sinerji fırsatı kaçar |
| **Manuel Multi-Goal** | Kullanıcı kontrolü | UX karmaşık |
| **Akıllı Sinerji ✓** | Otomatik, verimli | Implementasyon complex |

### Sonuçlar

**Pozitif:**
- Kullanıcı tek görevle birden fazla hedefe katkı sağlar
- AI tekrar eden görevler üretmez
- Çatışan hedefler için uyarı verilir

**Negatif:**
- Database karmaşıklığı artışı
- UI badge'leri extra render

**Dosyalar:**
- `src/lib/ai/synergyMatrix.ts` (997 satır)
- `src/lib/ai/goalSynergyEngine.ts` (649 satır)
- `src/lib/ai/synergyContextBuilder.ts` (318 satır)
- `src/components/hud/Goals/SynergyWarningModal.tsx` (307 satır)

---

**Son Güncelleme:** 2026-01-14 00:30 UTC+3
**Toplam ADR:** 20


