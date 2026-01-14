'use strict'

// =====================================================
// Weight Loss Goal - Specialized Prompt
// =====================================================

export const WEIGHT_LOSS_PROMPT = `
## 📉 KİLO VERME HEDEF STRATEJİSİ

Bu kullanıcının **ANA HEDEFİ KİLO VERMEK**.

### 🔬 BİLİMSEL TEMEL:
- 1 kg yağ ≈ 7,700 kcal
- Güvenli haftalık kayıp: 0.5-0.75 kg
- Günlük açık limiti: 500-750 kcal (daha fazlası kas kaybına yol açar)
- Protein koruması: Kas kaybını önlemek için yüksek protein

### 🎯 ODAK ALANLARI:

1. **Kalori Açığı Yönetimi**
   - Porsiyon kontrolü teknikleri
   - Düşük yoğunluklu besinler (sebzeler)
   - Protein ağırlıklı öğünler
   - Kalori takibi alışkanlığı

2. **Açlık Yönetimi**
   - Yüksek lif alımı
   - Protein her öğünde
   - Su tüketimi (tokluk için)
   - Öğün zamanlaması

3. **Termojenik Aktiviteler**
   - Günlük yürüyüş (10,000 adım hedefi)
   - Merdiven kullanımı
   - Standing desk / ayakta çalışma
   - NEAT (Non-Exercise Activity Thermogenesis)

4. **Davranış Değişikliği**
   - Gece atıştırmasını önleme
   - Duygusal yeme farkındalığı
   - Mindful eating
   - Trigger yönetimi

### ✅ ÖNERİLECEK GÖREV TİPLERİ:

| Emoji | Görev | Kalori Etkisi | XP |
|-------|-------|---------------|-----|
| 🥗 | Öğle yemeğinde yarım tabak sebze | -50 | 20 |
| 🚶 | 30 dakika tempolu yürüyüş | -150 | 30 |
| 📊 | Yediğini takip et (kalori sayımı) | 0 | 25 |
| 🥩 | Her öğünde protein kaynağı | 0 | 20 |
| 💧 | 2.5L su iç | 0 | 15 |
| 🌙 | Akşam 8'den sonra atıştırma | -100 | 30 |
| 🏋️ | 20dk direnç/ağırlık antrenmanı | -100 | 35 |
| 🥣 | Proteinli kahvaltı yap | 0 | 20 |
| 🍽️ | Küçük tabak kullan | -75 | 15 |

### 📈 KALORİ ETKİSİ PRENSİBİ (KRİTİK):

⚠️ **ZORUNLU:** Görevlerin toplam günlük kalori etkisi, kullanıcının hedef açığına (daily_adjustment) 
%70-100 oranında yakın olmalıdır.

Örnek Dağılım (Hedef: -815 kcal/gün):
| Görev | Kalori Etkisi |
|-------|---------------|
| 45dk Tempolu Yürüyüş | -250 kcal |
| 30dk Ağırlık Antrenmanı | -200 kcal |
| Porsiyon %20 Azaltma (2 öğün) | -150 kcal |
| Gece Atıştırmasına Hayır | -100 kcal |
| Merdiven Kullanımı (günlük) | -75 kcal |
| Yüksek Lifli Kahvaltı | -50 kcal |
| **TOPLAM** | **-825 kcal** ✅ |

📊 Minimum kabul: Hedefin %70'i (örn: -570 kcal)
📊 Maksimum kabul: Hedefin %110'u (örn: -900 kcal)

### ⚠️ GÜVENLİK KURALLARI:
- Günlük açık asla 1000 kcal'yi geçmemeli
- Protein hedefi: Vücut ağırlığı × 1.6-2.0 g
- Haftada en az 2 gün tam dinlenme
- Kardiyo + ağırlık dengesi
`

// =====================================================
// Weight Loss Context Builder
// =====================================================

import type { WeightLossContext } from '../goalSpecificContexts'

export function buildWeightLossContextMessage(context: WeightLossContext): string {
   const paceLabels: Record<string, string> = {
      'slow': 'Yavaş (~0.3 kg/hafta)',
      'moderate': 'Orta (~0.5 kg/hafta)',
      'aggressive': 'Hızlı (~0.75 kg/hafta)'
   }

   const weightDiff = context.weight_kg - context.target_weight_kg
   const estimatedWeeks = Math.ceil(weightDiff / 0.5)

   return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Mevcut Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## HESAPLANAN DEĞERLER:
- BMR (Bazal Metabolizma): ${context.bmr_kcal} kcal
- TDEE (Günlük Harcama): ${context.tdee_kcal} kcal
- Hedef Günlük Kalori: ${context.target_daily_kcal} kcal
- Günlük Açık: ${Math.abs(context.daily_adjustment)} kcal

## MAKRO HEDEFLERİ:
- Protein: ${context.protein_g} g
- Karbonhidrat: ${context.carbs_g} g
- Yağ: ${context.fat_g} g
- Su: ${context.water_liters} L

## HEDEF:
- Hedef Kilo: ${context.target_weight_kg} kg
- Verilecek Kilo: ${weightDiff.toFixed(1)} kg
- Hız: ${paceLabels[context.goal_pace] || context.goal_pace}
- Tahmini Süre: ~${estimatedWeeks} hafta

${context.days_since_start ? `## İLERLEME:
- Başlangıçtan bu yana: ${context.days_since_start} gün
- Kilo değişimi: ${context.weight_change_kg || 0} kg` : ''}

## SAĞLIK DURUMU:
${context.health_conditions.length > 0 ? `- Sağlık Koşulları: ${context.health_conditions.join(', ')}` : '- Sağlık Koşulları: Bilinen yok'}
${context.dietary_restrictions.length > 0 ? `- Diyet Kısıtlamaları: ${context.dietary_restrictions.join(', ')}` : '- Diyet Kısıtlamaları: Yok'}
${context.allergies.length > 0 ? `- Alerjiler: ${context.allergies.join(', ')}` : '- Alerjiler: Yok'}

Lütfen bu kullanıcı için KALORİ AÇIĞI odaklı günlük görevler oluştur.
Görevlerin toplam kalori etkisi ~${Math.abs(context.daily_adjustment)} kcal açık hedefine yakın olmalı.
`
}
