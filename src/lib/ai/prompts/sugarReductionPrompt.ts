'use strict'

// =====================================================
// Sugar Reduction Goal - Specialized Prompt
// =====================================================

export const SUGAR_REDUCTION_PROMPT = `
## 🚫 ŞEKER AZALTMA HEDEF STRATEJİSİ

Bu kullanıcının **ANA HEDEFİ ŞEKER TÜKETİMİNİ AZALTMAK**.

> ⚠️ **KRİTİK:** Kalori açığı veya kilo verme için optimizasyon YAPMA. 
> Tüm görevler ŞEKER AZALTMA odaklı olmalı.

### 📊 ŞEKER BİLGİSİ:
- WHO önerisi: Günde maks 25g eklenmiş şeker (kadınlar) / 36g (erkekler)
- Bir kutu kola: ~39g şeker (günlük limitin üzerinde!)
- Gizli şeker kaynakları: Ketçap, ekmek, yoğurt, meyve suyu, soslar

### 🎯 ODAK ALANLARI:

1. **Şekerli İçecekleri Kes**
   - Gazlı içecekler → Soda/maden suyu
   - Hazır meyve suyu → Taze meyve
   - Şekerli kahve → Tarçınlı/baharatlı kahve
   - Enerji içecekleri → Yeşil çay

2. **Gizli Şekerleri Tespit Et**
   - Besin etiketlerini okuma alışkanlığı
   - "Düşük yağlı" ürünlerdeki gizli şeker
   - Soslar ve çeşnilerdeki şeker
   - İşlenmiş gıdalardan kaçınma

3. **Tatlı Alternatiflerine Yönlendir**
   - Taze meyve (elma, çilek, portakal)
   - %70+ bitter çikolata (küçük porsiyon)
   - Hurma, kuru meyve (ölçülü)
   - Tarçın, vanilya (doğal tatlılık)

4. **Tetikleyicileri Yönet**
   - Stres yeme farkındalığı
   - Gece atıştırması önleme
   - Sosyal baskı yönetimi
   - Alternatif ödül sistemleri

### ✅ ÖNERİLECEK GÖREV TİPLERİ:

| Emoji | Görev | XP | Zorluk |
|-------|-------|-----|--------|
| 🚫 | Bugün gazlı içecek içme | 30 | Orta |
| ☕ | Kahveni şekersiz iç | 25 | Orta |
| 📖 | 3 ürünün etiketini oku, şeker içeriğini kontrol et | 20 | Kolay |
| 🍎 | Tatlı yerine meyve ye | 20 | Kolay |
| 🍫 | Tatlı isteği: %70+ bitter çikolata (2 kare) | 15 | Kolay |
| 🥣 | Şekerli gevrek yerine yulaf/yumurta kahvaltı | 25 | Orta |
| 💪 | Şeker krizi geldiğinde 10 dakika bekle | 30 | Zor |
| 🌙 | Akşam 8'den sonra tatlı yeme | 35 | Zor |
| 📝 | Bugün tükettiğin şekeri not et | 15 | Kolay |
| 🚶 | Tatlı isteği gelince 5 dk yürüyüş yap | 20 | Orta |

### ❌ BU HEDEF İÇİN YASAK GÖREVLER:
- Kalori sayma veya kalori açığı hesaplama
- BMR/TDEE tabanlı görevler
- Genel porsiyon kontrolü (şeker dışında)
- Kilo verme odaklı egzersiz önerileri
- Protein/makro hedefleri
- "Yemek günlüğü tut" (sadece şeker takibi öner)

### 📈 XP DAĞILIMI PRENSİBİ:
- Kolay görevler: 15-20 XP
- Orta görevler: 25-30 XP  
- Zor görevler (şeker krizi yönetimi, gece atıştırması): 35+ XP

### 💡 MOTİVASYON MESAJLARI ÖRNEKLERİ:
- "Her şekersiz gün, vücudunun şükran duyduğu bir gün!"
- "21 gün şekersiz = yeni sağlıklı alışkanlık"
- "Şeker bağımlılığını yenmek, gerçek özgürlük"
- "Enerjin artacak, modin düzelecek, cildin parlayacak"
`

// =====================================================
// Sugar Context Builder
// =====================================================

import type { SugarReductionContext } from '../goalSpecificContexts'

export function buildSugarContextMessage(context: SugarReductionContext): string {
    const sugarSourceLabels: Record<string, string> = {
        'soft_drinks': 'Gazlı içecekler',
        'juices': 'Hazır meyve suları',
        'coffee_tea': 'Şekerli kahve/çay',
        'desserts': 'Tatlılar',
        'snacks': 'Atıştırmalıklar',
        'breakfast_cereal': 'Kahvaltılık gevrek',
        'hidden_sugar': 'İşlenmiş gıdalardaki gizli şeker'
    }

    const triggerLabels: Record<string, string> = {
        'morning_coffee': 'Sabah kahvesi molası',
        'after_meals': 'Yemek sonrası',
        'afternoon_slump': 'Öğleden sonra enerji düşüşü',
        'late_night': 'Gece geç saatler',
        'stress': 'Stresli anlar',
        'social': 'Sosyal ortamlar'
    }

    const goalLabels: Record<string, string> = {
        'eliminate': 'Tamamen bırakmak',
        'reduce_75': '%75 azaltmak',
        'reduce_50': '%50 azaltmak',
        'reduce_moderate': 'Kademeli olarak azaltmak'
    }

    const drinkLabels = ['Hiç', '1 adet', '2-3 adet', '4+ adet']

    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## ŞEKER AZALTMA DETAYLARI:

### Mevcut Şeker Tüketimi:
- Günlük şekerli içecek: ${drinkLabels[context.estimated_daily_sugar_drinks]}
- Ana şeker kaynakları: ${context.sugar_sources.map(s => sugarSourceLabels[s] || s).join(', ') || 'Belirtilmedi'}

### Zorluklar ve Hedef:
- En zor an: ${triggerLabels[context.biggest_trigger] || context.biggest_trigger}
- Hedef: ${goalLabels[context.sugar_reduction_goal] || context.sugar_reduction_goal}
- Yapay tatlandırıcı: ${context.accepts_artificial_sweeteners ? 'Kabul ediyor' : 'İstemiyor'}

## SAĞLIK DURUMU:
${context.health_conditions.length > 0 ? `- Sağlık Koşulları: ${context.health_conditions.join(', ')}` : '- Sağlık Koşulları: Bilinen yok'}
${context.dietary_restrictions.length > 0 ? `- Diyet Kısıtlamaları: ${context.dietary_restrictions.join(', ')}` : '- Diyet Kısıtlamaları: Yok'}
${context.allergies.length > 0 ? `- Alerjiler: ${context.allergies.join(', ')}` : '- Alerjiler: Yok'}

Lütfen bu kullanıcı için ŞEKER AZALTMA odaklı günlük görevler oluştur.
Kalori açığı veya genel kilo verme önerileri YAPMA - sadece şeker azaltma!
`
}
