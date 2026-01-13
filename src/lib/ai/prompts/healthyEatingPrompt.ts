'use strict'

// =====================================================
// Healthy Eating Prompt
// Goal-specific strategies for balanced nutrition goals
// =====================================================

import type { HealthyEatingContext } from '../goalSpecificContexts'

// =====================================================
// System Prompt Extension
// =====================================================

export const HEALTHY_EATING_PROMPT = `
## 🥗 SAĞLIKLI BESLENME HEDEFİ STRATEJİSİ

Bu kullanıcının ana hedefi SAĞLIKLI ve DENGELİ BESLENME alışkanlıkları kazanmak. Kalori saymak veya kilo vermek için optimizasyon YAPMA.

### ODAK ALANLARI:
1. **Sebze/Meyve Tüketimi:** Günde 5 porsiyon hedefi
2. **Tam Gıdalar:** İşlenmiş gıdalardan uzak durma
3. **Ev Yemekleri:** Dışarıda yemek yerine evde pişirme
4. **Dengeli Öğünler:** Her öğünde protein + karbonhidrat + sebze
5. **Porsiyon Farkındalığı:** Aşırı yemeden doyma

### ÖNERİLECEK GÖREV TİPLERİ:
- 🥬 Bugün 3 farklı sebze ye
- 🍎 Atıştırmalık olarak meyve seç
- 🍳 Ev yemeği pişir
- 🥤 Şekerli içecek yerine su iç
- 🍞 Beyaz ekmek yerine tam tahıl tercih et
- 📋 Haftalık yemek planı yap
- 🛒 Sağlıklı market listesi hazırla
- 🥗 Öğle yemeğinde salata ekle

### YASAKLAR (Bu hedefe özel):
❌ Kalori hesaplaması
❌ Makro takibi
❌ Kilo verme odaklı görevler
❌ Diyet tipi önerileri (keto, vegan)
❌ Yoğun egzersiz programları
❌ Kısıtlayıcı öğün planları

### XP DAĞILIMI:
- 5 porsiyon sebze/meyve: 25 XP
- Ev yemeği pişir: 20 XP
- Sağlıklı atıştırmalık: 15 XP
- Haftalık plan yap: 30 XP
- 7 gün streak: 50 XP

### BİLİMSEL REFERANSLAR:
- Günde 5 porsiyon sebze/meyve hastalık riskini azaltır
- Ev yemekleri daha az kalori ve daha fazla besin içerir
- Tam tahıllar kan şekeri dengesini destekler
- Renkli tabak = çeşitli besin maddeleri
`

// =====================================================
// Context Builder
// =====================================================

export function buildHealthyEatingContextMessage(context: HealthyEatingContext): string {
    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## SAĞLIKLI BESLENME DURUMU:
- Günlük Öğün Sayısı: ${context.meals_per_day}
- Evde Yemek Pişirme: ${context.cooks_at_home}
- Günlük Sebze Tüketiyor mu: ${context.eats_vegetables_daily ? 'Evet' : 'Hayır'}
- Odak Alanları: ${context.focus_areas.join(', ')}
- En Büyük Zorluk: ${context.biggest_challenge}

## HEDEF:
Bu kullanıcının sağlıklı beslenme alışkanlıkları kazanmasını sağlayacak, TAM GIDA ve SEBZE odaklı görevler oluştur.
Kalori sayma veya kilo verme ile ilgili görev ÜRETME.

Lütfen bu kullanıcı için kişiselleştirilmiş günlük sağlıklı beslenme görevleri oluştur.
`
}
