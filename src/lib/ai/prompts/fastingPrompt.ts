'use strict'

// =====================================================
// Fasting Prompt
// Goal-specific strategies for intermittent fasting goals
// =====================================================

import type { FastingContext } from '../goalSpecificContexts'

// =====================================================
// System Prompt Extension
// =====================================================

export const FASTING_PROMPT = `
## ⏰ ARALIKLI ORUÇ HEDEFİ STRATEJİSİ

Bu kullanıcının ana hedefi ARALIKLI ORUÇ protokolünü uygulamak. Kalori sayma veya makro takibi için optimizasyon YAPMA.

### ODAK ALANLARI:
1. **Oruç Penceresi:** Belirlenen saatlerde yemek yememe
2. **Yeme Penceresi:** Belirlenen saatlerde beslenme
3. **Hidrasyon:** Oruç süresince su, siyah kahve, çay
4. **Açlık Yönetimi:** ilk saatlerdeki açlıkla başa çıkma
5. **Uyku Düzeni:** Oruç ile uyumlu uyku saatleri

### ÖNERİLECEK GÖREV TİPLERİ:
- ⏰ Oruç saatlerini takip et
- ☕ Sabah siyah kahve/çay iç (kalorisi olmayan)
- 💧 Oruç süresince su iç (min 2L)
- 🥗 Yeme penceresinde dengeli yemek ye
- 📊 Oruç durumunu logla
- 🧘 Açlık hissinde nefes egzersizi yap
- 🌙 Erken yemeği bitir (son yemek X saat)
- 📱 Oruç uygulamasına giriş yap

### YASAKLAR (Bu hedefe özel):
❌ Kalori hesaplaması
❌ Makro takibi
❌ Spesifik yemek tarifleri
❌ Diyet tipi önerileri (keto, vegan vb.)
❌ Oruç saatlerinde yeme önerileri
❌ Yemek odaklı görevler (sadece zamanlama)

### XP DAĞILIMI:
- Oruç penceresini tamamla: 30 XP
- Yeme penceresine sadık kal: 25 XP
- 2L su iç: 15 XP
- Oruç logla: 10 XP
- Streak (3+ gün): 35 XP

### BİLİMSEL REFERANSLAR:
- 16:8 protokolü en yaygın ve sürdürülebilir
- Oruç sırasında otofaji aktive olur
- Siyah kahve/çay orucu bozmaz
- İlk hafta adaptasyon süreci olabilir
`

// =====================================================
// Context Builder
// =====================================================

export function buildFastingContextMessage(context: FastingContext): string {
    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## ARALIKLI ORUÇ DURUMU:
- Tercih Edilen Protokol: ${context.preferred_protocol}
- Yeme Penceresi Başlangıcı: ${context.eating_window_start}
- Yeme Penceresi Bitişi: ${context.eating_window_end}
- Oruç Deneyimi: ${context.fasting_experience}
- Sıfır Kalorili İçecek İzni: ${context.allows_zero_cal_drinks ? 'Evet' : 'Hayır'}
- Ana Motivasyon: ${context.primary_reason}

## HEDEF:
Bu kullanıcının oruç protokolüne uymasını sağlayacak, SADECE zamanlama ve uyum odaklı görevler oluştur.
Kalori veya yemek içeriği ile ilgili görev ÜRETME.

Lütfen bu kullanıcı için kişiselleştirilmiş günlük oruç görevleri oluştur.
`
}
