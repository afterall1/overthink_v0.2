'use strict'

// =====================================================
// Activity Prompt
// Goal-specific strategies for daily steps/movement goals
// =====================================================

import type { ActivityContext } from '../goalSpecificContexts'

// =====================================================
// System Prompt Extension
// =====================================================

export const ACTIVITY_PROMPT = `
## 🚶 AKTİVİTE/ADIM HEDEFİ STRATEJİSİ

Bu kullanıcının ana hedefi GÜNLÜK HAREKET ve ADIM sayısını artırmak. Diyet veya beslenme için optimizasyon YAPMA.

### ODAK ALANLARI:
1. **Günlük Adım Hedefi:** Belirlenen adım sayısına ulaşma
2. **Hareket Molaları:** Oturma sürelerini kesme
3. **Yürüyüş Fırsatları:** Günlük rutinde yürüme artırma
4. **Aktif Ulaşım:** Araba yerine yürüme/bisiklet
5. **Fitness Takibi:** Adım sayacı kullanımı

### ÖNERİLECEK GÖREV TİPLERİ:
- 👟 Sabah 10 dakika yürüyüş yap
- 🚶 Öğle yemeğinde 15 dakika yürü
- ⏰ Her saat 5 dakika ayağa kalk
- 🪜 Asansör yerine merdiven kullan
- 🚌 Toplu taşımada bir durak erken in
- 📱 Adım hedefini kontrol et
- 🌳 Akşam yürüyüşü yap
- 🏃 Haftasonu uzun yürüyüş planla

### YASAKLAR (Bu hedefe özel):
❌ Beslenme önerileri
❌ Kalori hesaplaması
❌ Diyet planları
❌ Yoğun egzersiz programları (koşu, ağırlık)
❌ Spor salonu görevleri

### XP DAĞILIMI:
- Günlük adım hedefine ulaş: 30 XP
- Sabah yürüyüşü: 15 XP
- Hareket molası: 10 XP
- Merdiven kullan: 15 XP
- Adım streak (7 gün): 50 XP

### BİLİMSEL REFERANSLAR:
- 10,000 adım kardiyovasküler sağlık için idealdir
- Oturma sürelerini kesmek metabolik sendromu azaltır
- Sabah yürüyüşü enerji ve odaklanmayı artırır
- Düzenli yürüyüş ruh sağlığını iyileştirir
`

// =====================================================
// Context Builder
// =====================================================

export function buildActivityContextMessage(context: ActivityContext): string {
    const stepGap = context.target_daily_steps - context.current_daily_steps

    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## AKTİVİTE DURUMU:
- Mevcut Günlük Adım: ${context.current_daily_steps} adım
- Hedef Günlük Adım: ${context.target_daily_steps} adım
- Kapatılması Gereken Fark: ${stepGap} adım
- Çalışma Ortamı: ${context.work_type}
- Ulaşım Şekli: ${context.commute_method}
- Tercih Edilen Aktivite Zamanı: ${context.preferred_activity_time}
- Fitness Tracker Var mı: ${context.has_fitness_tracker ? 'Evet' : 'Hayır'}

## HEDEF:
Bu kullanıcının günlük adım hedefine ulaşmasını sağlayacak, SADECE hareket ve yürüyüş odaklı görevler oluştur.
Beslenme veya diyet ile ilgili görev ÜRETME.

Lütfen bu kullanıcı için kişiselleştirilmiş günlük aktivite görevleri oluştur.
`
}
