'use strict'

// =====================================================
// Muscle Gain Prompt
// Goal-specific strategies for muscle building goals
// =====================================================

import type { MuscleGainContext } from '../goalSpecificContexts'

// =====================================================
// System Prompt Extension
// =====================================================

export const MUSCLE_GAIN_PROMPT = `
## 💪 KAS GELİŞTİRME HEDEFİ STRATEJİSİ

Bu kullanıcının ana hedefi KAS KÜTLE kazanmak. Kalori açığı veya kilo verme için optimizasyon YAPMA.

### ODAK ALANLARI:
1. **Protein Alımı:** Vücut ağırlığı × 1.6-2.2g protein/gün
2. **Antrenmam Takibi:** Split programlar, progresif yüklenme
3. **Kalori Fazlası:** TDEE + 300-500 kcal hedefi
4. **Toparlanma:** Uyku ve dinlenme
5. **Kreatin/Supplement:** Bilimsel destekli takviyeler

### ÖNERİLECEK GÖREV TİPLERİ:
- 🥩 Her öğünde 30-40g protein al
- 🥚 Sabah yüksek proteinli kahvaltı
- 🏋️ Bugün planlı antrenman yap
- 💤 8 saat uyku hedefle
- 💧 Antrenman öncesi ve sonrası su iç
- 📊 Antrenman günlüğü tut (ağırlık/tekrar)
- 🍗 Protein hedefini takip et
- ⏰ Antrenman sonrası 30dk içinde protein al

### YASAKLAR (Bu hedefe özel):
❌ Kalori açığı önerileri
❌ Kilo verme odaklı görevler
❌ Aşırı kardio önerileri
❌ Düşük kalorili diyet planları
❌ Oruç veya öğün atlama önerileri

### XP DAĞILIMI:
- Protein hedefini tamamla: 25 XP
- Antrenman yap: 35 XP
- 8 saat uyku: 20 XP
- Antrenman günlüğü güncelle: 15 XP
- Post-workout protein: 20 XP

### BİLİMSEL REFERANSLAR:
- Kas sentezi için günde 1.6-2.2g/kg protein optimaldir
- 48 saat kas dinlenmesi önerilir
- Uyku kas onarımı için kritiktir (büyüme hormonu)
- Progresif yüklenme kas hipertrofisi için gereklidir
`

// =====================================================
// Context Builder
// =====================================================

export function buildMuscleGainContextMessage(context: MuscleGainContext): string {
    const proteinTarget = Math.round(context.weight_kg * 2)

    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## KAS GELİŞTİRME DURUMU:
- BMR: ${context.bmr_kcal} kcal
- TDEE: ${context.tdee_kcal} kcal
- Hedef Günlük Kalori: ${context.target_daily_kcal} kcal
- Günlük Fazla: +${context.daily_surplus} kcal
- Hedef Protein: ${proteinTarget}g/gün
- Hedef Karbonhidrat: ${context.carbs_g}g
- Hedef Yağ: ${context.fat_g}g
- Antrenman Deneyimi: ${context.training_experience}
- Haftalık Antrenman Günü: ${context.training_days_per_week}
${context.target_weight_kg ? `- Hedef Kilo: ${context.target_weight_kg} kg` : ''}

## HEDEF:
Bu kullanıcının kas kütlesi kazanmasını sağlayacak, KALORI FAZLASI ve PROTEIN odaklı görevler oluştur.
Kilo verme veya kalori açığı ile ilgili görev ÜRETME.

Lütfen bu kullanıcı için kişiselleştirilmiş günlük kas geliştirme görevleri oluştur.
`
}
