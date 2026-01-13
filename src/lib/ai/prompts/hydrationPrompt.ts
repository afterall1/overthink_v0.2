'use strict'

// =====================================================
// Hydration Prompt
// Goal-specific strategies for water intake goals
// =====================================================

import type { HydrationContext } from '../goalSpecificContexts'

// =====================================================
// System Prompt Extension
// =====================================================

export const HYDRATION_PROMPT = `
## 💧 HİDRASYON HEDEFİ STRATEJİSİ

Bu kullanıcının ana hedefi SU İÇME ALIŞKANLIĞI KAZANMAK. Diyet, kalori veya kilo verme için optimizasyon YAPMA.

### ODAK ALANLARI:
1. **Günlük Su Hedefi:** Vücut ağırlığına göre günlük su miktarı (kg × 0.033L)
2. **Hatırlatıcı Sistemleri:** Saatlik su içme alışkanlıkları
3. **Hidrasyon Takibi:** Bardak/şişe sayacı
4. **Tetikleyiciler:** Kahve, çay sonrası su içme
5. **Sabah Rutini:** Güne su ile başlama

### ÖNERİLECEK GÖREV TİPLERİ:
- 💧 Sabah kalkar kalkmaz 1 bardak su iç
- 💧 Her 2 saatte bir bardak su iç
- 🥤 Matara/su şişeni yanında taşı
- ☕ Kafeinli içecek sonrası 1 bardak su iç
- 🌙 Yatmadan önce 1 bardak su iç
- 📊 Günlük su tüketimini takip et
- 🍋 Suya limon/nane ekle (tat çeşitliliği)
- ⏰ Telefona su içme hatırlatıcısı kur

### YASAKLAR (Bu hedefe özel):
❌ Kalori hesaplaması
❌ BMR/TDEE tabanlı görevler
❌ Diyet önerileri (keto, paleo, vegan)
❌ Kilo verme odaklı öğün planları
❌ Porsiyon kontrolü
❌ Egzersiz rutinleri (su içme dışında)

### XP DAĞILIMI:
- Sabah 1 bardak su: 15 XP (kolay, günlük)
- 8 bardak su tamamla: 30 XP (orta, günlük)
- Su içme streak: 25 XP
- Matara taşı: 10 XP
- Kafein sonrası su: 15 XP

### BİLİMSEL REFERANSLAR:
- Vücut ağırlığının kg × 33ml = günlük ideal su miktarı
- Dehidrasyon konsantrasyon ve enerjiyi %20 düşürür
- Sabah su içmek metabolizmayı %24 hızlandırır
- Yeterli hidrasyon cilt sağlığını iyileştirir
`

// =====================================================
// Context Builder
// =====================================================

export function buildHydrationContextMessage(context: HydrationContext): string {
    const targetWater = Math.round(context.weight_kg * 0.033 * 10) / 10

    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## HİDRASYON DURUMU:
- Hedef Günlük Su: ${context.target_intake_liters ?? targetWater} L
- Mevcut Günlük Tüketim: ${context.estimated_current_intake_liters ?? 'Bilinmiyor'} L
- Ana Engel: ${context.main_barrier ?? 'Bilinmiyor'}
- Matara/Şişe Var mı: ${context.owns_water_bottle ? 'Evet' : 'Hayır'}
${context.drinks_other_fluids && context.drinks_other_fluids.length > 0 ? `- Diğer İçecekler: ${context.drinks_other_fluids.join(', ')}` : ''}
- Hatırlatıcı İstiyor mu: ${context.prefers_reminders ? 'Evet' : 'Hayır'}

## HEDEF:
Bu kullanıcının günlük su hedefine ulaşmasını sağlayacak, SADECE hidrasyon odaklı görevler oluştur.
Diyet veya kalori ile ilgili görev ÜRETME.

Lütfen bu kullanıcı için kişiselleştirilmiş günlük su içme görevleri oluştur.
`
}
