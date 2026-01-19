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

## ADR-021: Health Safety & Smart Date Adjustment System

**Tarih:** 2026-01-14  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Kullanıcılar kilo verme hedefi belirlerken sağlık açısından riskli parametreler seçebiliyor:
- **Aşırı Kalori Açığı:** Günlük 1,000+ kcal açık kas kaybına yol açar
- **Çok Düşük Kalori Hedefi:** BMR altı beslenme metabolizmayı yavaşlatır
- **Yaş Faktörü:** 50+ yaş için minimum kalori gereksinimleri farklıdır

Mevcut sistem bu riskleri tespit etmiyor ve kullanıcıya uyarı vermiyordu.

### Karar

**Çok Katmanlı Sağlık Güvenlik Sistemi:**

1. **Güvenlik Kontrolleri (`performSafetyCheck`):**
   - Yaşa göre minimum kalori ayarlaması
   - Cinsiyete göre güvenli limitler (erkek: 1500+, kadın: 1200+)
   - Günlük maksimum açık: 1,000 kcal

2. **Akıllı Tarih Otomatik Ayarlama (`SafeDateModal`):**
   - Açık > 1,000 olunca modal açılır
   - 3 güvenli plan sunulur: Rahat (500), Dengeli (750), Hızlı (1000)
   - Kullanıcı seçer, tarih otomatik güncellenir

3. **AI Prompt Entegrasyonu:**
   - `UserHealthContext`'e güvenlik alanları eklendi
   - AI, güvenlik ayarlaması durumunda sağlık koruyucu görevler ekler

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Sadece Uyarı** | Basit | Kullanıcı yoksayabilir |
| **Zorunlu Sınır** | Güvenli | UX kısıtlayıcı |
| **Modal + 3 Plan ✓** | Seçim özgürlüğü + güvenlik | Modal complexity |

### Sonuçlar

**Pozitif:**
- Kullanıcı sağlık risklerinden korunur
- AI güvenlik durumuna göre optimize görevler üretir
- Kullanıcı hala kendi planını seçebilir (3 opsiyon)

**Negatif:**
- Extra modal UX adımı
- Hesaplama karmaşıklığı artışı

**Dosyalar:**
- `src/lib/healthCalculator.ts` - `performSafetyCheck()`, `AGE_SAFETY_FACTORS`
- `src/lib/goalCalculator.ts` - `calculateSafeEndDate()`, `getSafeDateSuggestions()`
- `src/components/hud/Goals/SafeDateModal.tsx` (238 satır)
- `src/components/hud/Health/SafetyWarningBanner.tsx` (285 satır)
- `src/lib/ai/healthCouncil.ts` - `UserHealthContext` güvenlik alanları

---

## ADR-022: Calorie Budget 95% Enforcement System

**Tarih:** 2026-01-14  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Kullanıcı SafeDateModal'dan 1000 kcal günlük açık seçtiğinde:
1. **İlk Sorun (Phase 8.38):** Kalori açığı bilgisi AI'a ulaşmıyordu → healthCalculator'dan gelen pace-based 500 kcal kullanılıyordu
2. **İkinci Sorun (Phase 8.39):** AI prompt %70-100 aralığına izin veriyordu → AI ~800 kcal (%80) üretip duruyordu

Sonuç: Kullanıcı 1000 kcal beklerken görevler ~550-800 kcal çıkıyordu.

### Karar

**Çift Fazlı Düzeltme:**

#### Faz 1: Veri Akışı Düzeltmesi (Phase 8.38)
- `GoalWizardData` → `calculated_daily_deficit` alanı
- `SafeDateModal` → Full `SafeDateSuggestion` objesi döndürme
- `WizardContext` → `daily_calorie_deficit` alanı
- `buildAIContext` → Wizard değerini öncelikli kullanma

#### Faz 2: Budget Enforcement (Phase 8.39)
- **Prompt Güçlendirme:** %70 → %95 minimum, agresif dil
- **User Message:** %70-110 → %95-105 aralık
- **Post-Processing:** `scaleQuestsToMeetBudget()` fonksiyonu
- **Validation:** %60-120 → %90-110 threshold

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Sadece Prompt Güçlendirme** | Basit | AI hala yetersiz üretebilir |
| **Retry Loop** | Kesin sonuç | Yavaş, maliyet yüksek |
| **Post-Processing Scaling ✓** | Hızlı, güvenilir | Kalori değerleri modifiye |

### Sonuçlar

**Pozitif:**
- Kullanıcının seçtiği kalori açığı her zaman karşılanır (%95+)
- AI yetersiz üretse bile sistem telafi eder
- Tek API çağrısı yeterli (retry yok)

**Negatif:**
- Kalori değerleri ölçekleme ile modifiye ediliyor
- Post-processing karmaşıklığı

**Dosyalar:**
- `src/components/hud/Goals/GoalCreationWizard.tsx` - `calculated_daily_deficit`
- `src/components/hud/Goals/SafeDateModal.tsx` - Interface update
- `src/actions/wizardAI.ts` - `daily_calorie_deficit`, `buildAIContext`
- `src/lib/ai/healthCouncil.ts` - Prompt + `scaleQuestsToMeetBudget()`

---

## ADR-023: Unified Health Profile (Tek Kapsamlı Sağlık Profili)

**Tarih:** 2026-01-14  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** AI Expert Council (5 uzman), Proje Sahibi

### Bağlam

Mevcut sistemde her goal türü için ayrı sorular soruluyordu (reduce_sugar, gain_muscle, drink_water, eat_healthy). Bu durum "form fatigue" yaratıyor, veri fragmentasyonuna yol açıyor ve AI'ın holistic bakış açısını engelliyordu.

### Karar

**"Unified Health Profile"** sistemi uygulandı:

1. **7-Step Wizard:** Tek kapsamlı profil, opsiyonel "Atla" butonlarıyla
2. **Sections Tracking:** `sections_completed[]` ile tamamlanan bölümler
3. **Goal-Profile Mapping:** Her goal için gerekli section'lar belirlendi
4. **AI Context Enrichment:** Tüm unified fields AI'a aktarılıyor

**Yeni AI Context Bölümleri:**
- 🏋️ ANTRENMAN PROFİLİ (deneyim, ekipman, tercih)
- 🍽️ BESLENME ALIŞKANLIKLARI (öğün, evde yemek, fast food)
- 💧 HİDRASYON & ŞEKER (su, şekerli içecek, craving)
- 😴 UYKU & STRES (saat, kalite, stres seviyesi)

### Alternatifler

| Seçenek | Eksileri |
|---------|----------|
| Goal-Specific Questions (Mevcut) | Form fatigue, fragmented data |
| Onboarding Only | 20+ soru, engagement drop |
| Progressive Profiling | Karmaşık logic |
| **Unified Profile ✓** | En dengeli çözüm |

### Sonuçlar

**Pozitif:**
- Form fatigue çözüldü
- AI holistic bakış açısına sahip
- Skip seçeneği ile kullanıcı kontrolü
- Tek kaynak prensibi

**Dosyalar:**
- `supabase/migrations/20260115_unified_health_profile.sql`
- `src/types/unifiedHealthProfile.types.ts`
- `src/components/hud/Health/UnifiedHealthProfileWizard.tsx`
- `src/actions/aiHealthQuests.ts`
- `src/actions/wizardAI.ts`
- `src/components/hud/Goals/GoalQuestionsStep.tsx`
- `src/lib/ai/healthCouncil.ts`

---

## ADR-025: Haftalık Quest Generation System (Weekly Batch)

**Tarih:** 2026-01-14  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** AI Expert Council, Proje Sahibi

### Bağlam

Mevcut sistemde AI-generated quest'ler **daily recurring** olarak üretiliyordu. Kullanıcı her gün aynı quest'leri görüyordu. Bu durum:
- **Monotonluk:** Kullanıcı engagement düşüşü
- **İlerleme hissi eksikliği:** "Hep aynı şeyi yapıyorum" algısı
- **AI potansiyelinin israfı:** Her gün yeni üretim yerine cache kullanılabilir

### Karar

**Haftalık Batch Generation** sistemi uygulandı:

1. **`weekly_quest_batches` Tablosu:** 7 günlük quest seti JSONB olarak
2. **AI Prompt:** Günlük temalarla çeşitlendirilmiş üretim:
   - Pazartesi: fresh_start
   - Salı-Perşembe: momentum/consistency
   - Cuma: weekend_prep
   - Cumartesi: active_rest
   - Pazar: recovery

3. **Frontend Entegrasyonu:** Quest'ler `daily_quests`'e kaydediliyor
4. **Trigger:** Goal oluşturulduğunda otomatik batch generation

### Data Flow

```
GoalCreationWizard
    ↓ onSubmit
page.tsx → generateWeeklyBatch(goalId)
    ↓
weeklyQuests.ts → AI 7 günlük üretim
    ↓ 
JSONB → weekly_quest_batches
    ↓
Günün quest'leri → daily_quests tablosu
    ↓
Frontend (mevcut UI değişmedi)
```

### Alternatifler

| Seçenek | Eksileri |
|---------|----------|
| Daily Recurring (Mevcut) | Monoton, engagement düşük |
| Daily AI Generation | Maliyet yüksek (~$0.0005/gün) |
| **Weekly Batch ✓** | En dengeli: maliyet + çeşitlilik |

### Sonuçlar

**Pozitif:**
- Haftalık AI maliyeti: ~$0.0008 (7x yerine 1x çağrı)
- Her gün farklı quest'ler
- Mevcut frontend değişmeden çalışıyor
- Subscription model potansiyeli

**Dosyalar:**
- `supabase/migrations/20260116_weekly_quest_batches.sql`
- `src/actions/weeklyQuests.ts`
- `src/lib/ai/healthCouncil.ts` (generateWeeklyHealthQuests)
- `src/app/page.tsx` (trigger eklendi)

---

## ADR-026: Smart Hybrid Quest Recalibration

**Tarih:** 2026-01-15  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Weekly Quest Batch sistemi (ADR-025) 7 günlük quest'leri önceden üretir. Ancak kullanıcı sağlık profilini güncellediğinde (kilo değişikliği, aktivite seviyesi değişikliği, hedef pace değişikliği) mevcut batch'lerdeki quest'ler eski kalori hedeflerine göre ayarlanmış durumda kalıyordu.

**Problem:**
- Kullanıcı profil güncelledi → Quest'ler değişmedi → Tutarsızlık
- Bilimsel doğruluk kaybı (eskiyen kalori hesaplamaları)
- Kullanıcı güveni erozyonu

### Karar

**Smart Hybrid Yaklaşımı** seçildi:
1. Profil güncellendiğinde eski vs yeni metrikler karşılaştırılır
2. Eşik değerlerini aşan değişiklikler "anlamlı" kabul edilir
3. Anlamlı değişikliklerde sadece **kalan günler** yeniden üretilir
4. Tamamlanmış günler ve geçmiş quest'ler **korunur**

```
                    ┌─────────────────────────────────┐
                    │     upsertHealthProfile()       │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │     calculateProfileDelta()     │
                    │   (eski vs yeni metrikleri)     │
                    └───────────────┬─────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        ▼                       ▼
                isSignificant?              isSignificant?
                   FALSE                       TRUE
                        │                       │
                        ▼                       ▼
              [Sadece profil kaydet]  ┌─────────────────────┐
                                      │regenerateRemainingQuestDays│
                                      └─────────────────────┘
                                                │
                                      ┌─────────▼─────────┐
                                      │ Kalan günler için │
                                      │ AI quest üret     │
                                      │ Batch'i güncelle  │
                                      │ Daily quests      │
                                      │ tablosunu güncelle│
                                      └───────────────────┘
```

### Significance Thresholds (Eşik Değerleri)

| Parametre | Eşik | Gerekçe |
|-----------|------|---------|
| `daily_adjustment` | ±100 kcal | Günlük kalori hedefinde anlamlı fark |
| `weight_kg` | ±2 kg | BMR hesabı anlamlı değişir |
| `activity_level` | Herhangi değişiklik | TDEE çarpanı değişir |
| `target_weight_kg` | Herhangi değişiklik | Hedef tempo değişir |
| `goal_pace` | Herhangi değişiklik | Açık/fazla miktarı değişir |

### Alternatifler

| Seçenek | UX | Maliyet | Sonuç |
|---------|-----|---------|-------|
| A: Eager (Anında Full Regen) | ⭐⭐⭐⭐⭐ | 🔴 Yüksek | ❌ Gereksiz token kullanımı |
| B: Lazy (Gelecek Hafta) | ⭐⭐ | 🟢 Sıfır | ❌ Tutarsızlık 7 güne kadar |
| **C: Smart Hybrid ✓** | ⭐⭐⭐⭐ | 🟡 Optimize | ✅ Seçildi |
| D: Parameter Scaling | ⭐⭐⭐ | 🟢 Sıfır | ❌ AI kişiselleştirmesi kaybolur |

### Sonuçlar

**Pozitif:**
- Sadece kalan günler regenerate → %50-70 maliyet tasarrufu
- Tamamlanan quest'ler ve XP korunur
- Kullanıcı güveni korunur (profil değiştirince görevler değişir)
- Bilimsel doğruluk sağlanır

**Negatif:**
- İki yeni modül eklendi (profileDelta.ts, questRegeneration.ts)
- Circular dependency riski (module separation ile çözüldü)
- Regeneration süresi kullanıcıyı bekletebilir (arka plan işlem önerilir)

**Dosyalar:**
- `src/actions/profileDelta.ts` (🆕 NEW)
- `src/actions/questRegeneration.ts` (🆕 NEW)
- `src/actions/aiHealthQuests.ts` (MODIFIED - delta integration)
- `src/actions/weeklyQuests.ts` (MODIFIED - cleanup)

---

**Son Güncelleme:** 2026-01-20 00:55 UTC+3
**Toplam ADR:** 28

## ADR-028: Quest Architecture Unification

**Tarih:** 2026-01-20  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** AI Expert Council, Proje Sahibi

### Bağlam

ADR-025 (Weekly Batch) ile ADR-026 (Smart Recalibration) tasarlandı ancak tam olarak tamamlanmadı:

1. `generateWeeklyBatch()` sadece bugünün quest'lerini `daily_quests`'e yazıyordu
2. Ertesi günler için dağıtım mekanizması **eksikti**
3. Geçici çözüm olarak `saveAIGeneratedQuests`'te `is_recurring: true` yapıldı
4. Sonuç: "Her gün" badge'i ve aynı quest'lerin tekrarı

### Karar

**Tek Kaynak + Günlük Dağıtım** mimarisi uygulandı:

1. **`distributeWeeklyBatchQuestsForToday()`** fonksiyonu eklendi
   - `getQuestsForToday()` çağrıldığında otomatik çalışır
   - `weekly_quest_batches`'tan bugünün günü için quest'leri alır
   - `daily_quests`'e `is_recurring: false` olarak yazar
   - Zaten varsa atlar (idempotent)

2. **`saveAIGeneratedQuests`** düzeltildi
   - `is_recurring: true` → `is_recurring: false`
   - Deprecation notu eklendi

### Data Flow (Yeni)

```
Goal Oluştur
     ↓
generateWeeklyBatch() → 7 gün JSONB'ye kaydet
     ↓
[Her gün app açıldığında]
     ↓
getQuestsForToday() 
     ↓
distributeWeeklyBatchQuestsForToday()
     ↓
Bugünün günü (monday, tuesday...) için quest'ler daily_quests'e yaz
     ↓
is_recurring: false → "Her gün" badge'i YOK ✅
```

### Sonuçlar

**Pozitif:**
- Her gün FARKLI quest'ler ✅
- "Her gün" badge'i kaldırıldı ✅
- Time Travel ile test edilebilir ✅
- Tek kaynak prensibi (weekly_quest_batches)

**Dosyalar:**
- `src/actions/quests.ts` (MODIFIED - distributeWeeklyBatchQuestsForToday eklendi)
- `src/actions/aiHealthQuests.ts` (MODIFIED - is_recurring: false)


## ADR-027: Time Travel Test Architecture

**Tarih:** 2026-01-20  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Council

### Bağlam

Quest sistemi günlük bazlı çalışıyor (streak hesabı, scheduled_date, milestone kontrolü). Test için gerçek günlerin geçmesini beklemek verimsiz. Tarih manipülasyonu ile hızlı test yapabilecek bir altyapı gerekli.

### Karar

**Centralized Time Service + DevTools Panel** mimarisi uygulandı:

1. **timeService.ts**: Tüm tarih işlemleri tek modülden geçer
   - `getCurrentDate()`: Merkezi tarih sağlayıcı
   - `setTestDate()`: Development-only override
   - `advanceDays()` / `rewindDays()`: Gün navigasyonu
   - Event subscription sistemi

2. **TimeControlPanel.tsx**: Floating DevTools panel
   - Production'da görünmez (`NODE_ENV` kontrolü)
   - +1/-1 gün navigasyonu
   - Hızlı atla butonları
   - `router.refresh()` ile app-wide re-render

3. **Engine Refactoring**: 
   - `streakEngine.ts`: 8× `new Date()` → `getCurrentDate()`
   - `questEngine.ts`: 5× `new Date()` → `getCurrentDate()`
   - `page.tsx`: Time subscription eklendi

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **Date.now() Global Mock** | Sıfır kod değişikliği | 3rd party lib'leri bozar, SSR sorunları |
| **React Time Context** | React-native | Sadece client-side, büyük refactor |
| **URL Parameter** | Zero refactor | Güvenlik riski, her page'de kontrol |
| **Centralized Time Service ✓** | Production-safe, toggle edilebilir | Mevcut kodda değişiklik gerekti |

### Sonuçlar

**Pozitif:**
- Test süresi: Günler → Saniyeler
- Production güvenli (`NODE_ENV === 'development'` kontrolü)
- Streak, quest scheduling, milestone hesaplama tamamen test edilebilir
- DevTools panel ile görsel kontrol

**Negatif:**
- 7 dosyada değişiklik gerekti
- `new Date()` → `getCurrentDate()` migration
- Router.refresh() maliyeti

**Dosyalar:**
- `src/lib/timeService.ts` (🆕 NEW)
- `src/components/dev/TimeControlPanel.tsx` (🆕 NEW)
- `src/lib/streakEngine.ts` (MODIFIED)
- `src/lib/questEngine.ts` (MODIFIED)
- `src/app/page.tsx` (MODIFIED)
- `src/components/hud/EventTimeline.tsx` (MODIFIED)
- `src/app/layout.tsx` (MODIFIED)

---

## ADR-029: Quest System Polish - Celebration Animations & Auto-Regeneration

**Tarih:** 2026-01-20  
**Durum:** ✅ Kabul Edildi  
**Karar Vericiler:** Proje Sahibi, AI Architect

### Bağlam

Quest tamamlama deneyimi temel seviyedeydi - sadece arka plan rengi değişikliği. Premium bir gamification deneyimi için konfeti, XP popup ve streak badge animasyonları gerekiyordu. Ayrıca hafta geçişlerinde weekly batch'ler otomatik yenilenmiyor, kullanıcı ilk günü boş quest listesiyle karşılaşıyordu.

### Karar

**1. Quest Completion Celebration Component:**
- `QuestCompletionCelebration.tsx` - Full-screen overlay
- 24 konfeti parçacığı, 6 renk paleti
- Framer Motion ile tüm animasyonlar
- Yeni paket eklenmedi

**2. Weekly Batch Auto-Regeneration:**
- `checkAndRegenerateWeeklyBatches()` fonksiyonu
- `getQuestsForToday()` PHASE 0 olarak entegre
- Expired batch'leri tespit edip yeni batch üretir

### Alternatifler

| Seçenek | Artıları | Eksileri |
|---------|----------|----------|
| **react-confetti-explosion** | Hazır, test edilmiş | Yeni paket bağımlılığı |
| **Framer Motion + CSS ✓** | Mevcut stack, kontrol | Daha fazla kod |
| **Lottie animations** | Ultra smooth | Büyük bundle size, yeni paket |

### Sonuçlar

**Pozitif:**
- Premium gamification deneyimi
- Zero new dependencies
- iOS Safari 60fps
- Server-side auto-regeneration

**Negatif:**
- ~280 satır yeni component kodu
- Her completion'da full-screen overlay

**Dosyalar:**
- `src/components/hud/Quests/QuestCompletionCelebration.tsx` (🆕 NEW)
- `src/actions/quests.ts` (MODIFIED - checkAndRegenerateWeeklyBatches)
- `src/app/page.tsx` (MODIFIED - celebration state)

