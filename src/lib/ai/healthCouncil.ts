'use strict'

// =====================================================
// AI Health Council - Expert Prompt System
// Generates personalized health quests using Gemini AI
// =====================================================

import { generateCompletion, type ChatMessage } from './aiService'
import { type HealthCalculations } from '../healthCalculator'
import { composeSystemPrompt, buildGoalContextMessage } from './prompts'
import type { GoalSpecificContext, GoalType } from './goalSpecificContexts'

// =====================================================
// Types
// =====================================================

export interface UserHealthContext {
    // Profile
    age_years: number
    biological_sex: 'male' | 'female'
    weight_kg: number
    height_cm: number
    activity_level: string

    // Calculated
    bmr_kcal: number
    tdee_kcal: number
    target_daily_kcal: number
    daily_adjustment: number

    // Macros
    protein_g: number
    carbs_g: number
    fat_g: number
    water_liters: number

    // Goal
    primary_goal?: string
    target_weight_kg?: number
    goal_pace?: string

    // Health
    health_conditions: string[]
    dietary_restrictions: string[]
    allergies: string[]

    // Current progress (optional)
    days_since_start?: number
    weight_change_kg?: number
}

export interface AIGeneratedQuest {
    title: string
    description: string
    category: 'nutrition' | 'exercise' | 'habit' | 'tracking' | 'recovery'
    difficulty: 'easy' | 'medium' | 'hard'
    estimated_minutes: number
    calorie_impact: number
    xp_reward: number
    emoji: string
    scientific_rationale: string
    is_morning?: boolean
    is_evening?: boolean
}

export interface AINutritionPlan {
    daily_calorie_target: number
    protein_grams: number
    carbs_grams: number
    fat_grams: number
    meal_suggestions: string[]
    hydration_goal_liters: number
}

export interface AIHealthResponse {
    success: boolean
    daily_quests: AIGeneratedQuest[]
    nutrition_plan: AINutritionPlan
    warnings: string[]
    motivational_tip: string
    council_notes: string
    error?: string
}

// =====================================================
// System Prompt - AI Expert Council
// =====================================================

const HEALTH_COUNCIL_SYSTEM_PROMPT = `Sen bir üst düzey sağlık ve beslenme uzmanları konseyi olarak hareket ediyorsun. Konseyde şu uzmanlar var:

🥗 **Dr. Beslenme Uzmanı (Diyetisyen)**
- Kalori hesaplamaları ve makro dağılımı
- Öğün planlaması ve porsiyon kontrolü
- Besin değeri optimizasyonu

🏋️ **Dr. Spor Fizyolojisti**
- Egzersiz reçeteleri ve antrenman planları
- Kalori yakım optimizasyonu
- Toparlanma ve dinlenme protokolleri

🧠 **Dr. Davranış Psikoloğu**
- Alışkanlık oluşturma stratejileri
- Motivasyon teknikleri
- Sürdürülebilir değişim yöntemleri

⚕️ **Dr. Endokrinolog**
- Metabolizma ve hormon dengesi
- Sağlık uyarıları ve kontraendikasyonlar
- Kronik hastalık yönetimi

## GÖREV:
Kullanıcının sağlık profilini ve hesaplanmış değerlerini analiz ederek kişiye özel günlük görevler üret.

## KESİN KURALLAR:

1. **GÜVENLİK ÖNCELİKLİ:**
   - Günlük kalori asla erkekler için 1500, kadınlar için 1200'ün altına düşmemeli
   - Günlük açık 1000 kcal'yi geçmemeli
   - Yoğun egzersiz önerirken sağlık durumlarını kontrol et
   - Diyabet, tansiyon, kalp hastalığı varsa özel dikkat göster

2. **BİLİMSEL TEMEL:**
   - Her önerinin arkasında bilimsel gerekçe olmalı
   - Spekülasyon yapma, kanıtlanmış yöntemler öner
   - Makro oranları hedefe göre optimize et

3. **KİŞİSELLEŞTİRME:**
   - Diyet kısıtlamalarına kesinlikle uy (vejetaryen, vegan, alerji vb.)
   - Aktivite seviyesine uygun zorlukta görevler öner
   - Yaşa ve cinsiyete uygun egzersizler seç

4. **SMART FORMAT:**
   - Specific: Net ve açık görevler
   - Measurable: Ölçülebilir hedefler (30 dk, 2L, 3 öğün)
   - Achievable: Gerçekçi ve ulaşılabilir
   - Relevant: Hedefe uygun
   - Time-bound: Gün içi zamanlama

5. **GÖREV ÇEŞİTLİLİĞİ (6-8 görev öner):**
   - 2-3 beslenme görevi
   - 1-2 egzersiz görevi
   - 1-2 alışkanlık görevi
   - 1 takip/ölçüm görevi

6. **HEDEFE ÖZGÜ GÖREV STRATEJİSİ:**

   📉 **weight_loss (Kilo Verme):**
   - Kalori açığını destekleyen görevler (porsiyon kontrolü, düşük kalorili alternatifler)
   - Termojenik aktiviteler (yürüyüş, merdiven, günlük hareket)
   - Açlık yönetimi (protein ağırlıklı öğünler, lif alımı)
   - Kalori/besin takibi görevleri
   - Gece atıştırmasını önleme stratejileri

   💪 **muscle_gain (Kas Yapma):**
   - Protein hedefine ulaşma görevleri (her öğünde protein)
   - Direnç/ağırlık antrenmanı görevleri
   - Post-workout beslenme (protein + karbonhidrat)
   - Yeterli kalori alımı kontrolü
   - Uyku ve toparlanma görevleri

   🏃 **endurance (Dayanıklılık):**
   - Kardiyovasküler antrenman görevleri (koşu, bisiklet, yüzme)
   - Karbonhidrat yakıt yönetimi
   - Hidrasyon takibi (elektrolit dengesi)
   - Aktif toparlanma ve esneme
   - Kalp atış hızı zone takibi

   ⚖️ **maintenance (Koruma):**
   - Dengeli öğün planlaması
   - Haftalık aktivite çeşitliliği
   - Mindful eating alışkanlıkları
   - Stres yönetimi ve uyku kalitesi
   - Düzenli tartı/ölçüm takibi

   📈 **weight_gain (Kilo Alma):**
   - Kalori fazlası sağlayan öğünler (nutrient-dense foods)
   - Ara öğün ve smoothie görevleri
   - Kas yapıcı egzersizler (compound movements)
   - Sağlıklı yağ kaynakları ekleme
   - İştah artırıcı stratejiler

## OUTPUT FORMAT (JSON):
Yanıtını SADECE aşağıdaki JSON formatında ver, başka hiçbir metin ekleme:

{
  "daily_quests": [
    {
      "title": "Kısa ve net görev başlığı",
      "description": "Detaylı açıklama ve nasıl yapılacağı",
      "category": "nutrition|exercise|habit|tracking|recovery",
      "difficulty": "easy|medium|hard",
      "estimated_minutes": 15,
      "calorie_impact": -200,
      "xp_reward": 25,
      "emoji": "🥗",
      "scientific_rationale": "Bu görev neden önemli",
      "is_morning": true,
      "is_evening": false
    }
  ],
  "nutrition_plan": {
    "daily_calorie_target": 2000,
    "protein_grams": 150,
    "carbs_grams": 200,
    "fat_grams": 67,
    "meal_suggestions": ["Kahvaltı önerisi", "Öğle önerisi", "Akşam önerisi"],
    "hydration_goal_liters": 2.5
  },
  "warnings": ["Varsa sağlık uyarıları"],
  "motivational_tip": "Günün motivasyon mesajı",
  "council_notes": "Konseyin genel değerlendirmesi ve tavsiyeleri"
}`

// =====================================================
// Main Function
// =====================================================

/**
 * Generate personalized daily quests using AI Health Council
 */
export async function generateHealthQuests(
    context: UserHealthContext
): Promise<AIHealthResponse> {
    try {
        // Build user context message
        const userMessage = buildUserContextMessage(context)

        // Prepare messages for AI
        const messages: ChatMessage[] = [
            { role: 'system', content: HEALTH_COUNCIL_SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
        ]

        // Call AI
        const response = await generateCompletion(messages, {
            temperature: 0.7,
            maxTokens: 3000
        })

        if (!response.success) {
            return {
                success: false,
                daily_quests: [],
                nutrition_plan: getDefaultNutritionPlan(context),
                warnings: ['AI servisi yanıt veremedi.'],
                motivational_tip: 'Bugün de hedefine bir adım daha yaklaş!',
                council_notes: '',
                error: response.error
            }
        }

        // Parse JSON response
        const parsed = parseAIResponse(response.content)

        if (!parsed) {
            return {
                success: false,
                daily_quests: getDefaultQuests(context),
                nutrition_plan: getDefaultNutritionPlan(context),
                warnings: ['AI yanıtı işlenemedi, varsayılan görevler oluşturuldu.'],
                motivational_tip: 'Her küçük adım büyük değişimlerin başlangıcıdır!',
                council_notes: '',
                error: 'Failed to parse AI response'
            }
        }

        // Validate and sanitize quests
        const validatedQuests = validateAndSanitizeQuests(parsed.daily_quests || [], context)

        return {
            success: true,
            daily_quests: validatedQuests,
            nutrition_plan: parsed.nutrition_plan || getDefaultNutritionPlan(context),
            warnings: parsed.warnings || [],
            motivational_tip: parsed.motivational_tip || 'Bugün de harika bir gün olacak!',
            council_notes: parsed.council_notes || ''
        }

    } catch (error) {
        console.error('[AI Health Council] Error:', error)
        return {
            success: false,
            daily_quests: getDefaultQuests(context),
            nutrition_plan: getDefaultNutritionPlan(context),
            warnings: ['AI servisi geçici olarak kullanılamıyor.'],
            motivational_tip: 'Yolculuk devam ediyor, pes etme!',
            council_notes: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Build user context message for AI
 */
function buildUserContextMessage(context: UserHealthContext): string {
    return `
## KULLANICI PROFİLİ:
- Yaş: ${context.age_years}
- Cinsiyet: ${context.biological_sex === 'male' ? 'Erkek' : 'Kadın'}
- Kilo: ${context.weight_kg} kg
- Boy: ${context.height_cm} cm
- Aktivite Seviyesi: ${context.activity_level}

## HESAPLANAN DEĞERLER:
- BMR (Bazal Metabolizma): ${context.bmr_kcal} kcal
- TDEE (Günlük Harcama): ${context.tdee_kcal} kcal
- Hedef Günlük Kalori: ${context.target_daily_kcal} kcal
- Günlük Açık/Fazla: ${context.daily_adjustment} kcal

## MAKRO HEDEFLERİ:
- Protein: ${context.protein_g} g
- Karbonhidrat: ${context.carbs_g} g  
- Yağ: ${context.fat_g} g
- Su: ${context.water_liters} L

## HEDEF:
- Ana Hedef: ${context.primary_goal}
${context.target_weight_kg ? `- Hedef Kilo: ${context.target_weight_kg} kg` : ''}
- Hız: ${context.goal_pace}

## SAĞLIK DURUMU:
${context.health_conditions.length > 0 ? `- Sağlık Koşulları: ${context.health_conditions.join(', ')}` : '- Sağlık Koşulları: Bilinen yok'}
${context.dietary_restrictions.length > 0 ? `- Diyet Kısıtlamaları: ${context.dietary_restrictions.join(', ')}` : '- Diyet Kısıtlamaları: Yok'}
${context.allergies.length > 0 ? `- Alerjiler: ${context.allergies.join(', ')}` : '- Alerjiler: Yok'}

${context.days_since_start ? `## İLERLEME:
- Başlangıçtan bu yana: ${context.days_since_start} gün
- Kilo değişimi: ${context.weight_change_kg || 0} kg` : ''}

Lütfen bu kullanıcı için kişiselleştirilmiş günlük görevler ve beslenme planı oluştur.
`
}

/**
 * Parse AI response JSON
 */
function parseAIResponse(content: string): Partial<AIHealthResponse> | null {
    try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
            return null
        }

        const parsed = JSON.parse(jsonMatch[0])
        return parsed as Partial<AIHealthResponse>
    } catch (error) {
        console.error('[AI Health Council] JSON parse error:', error)
        return null
    }
}

/**
 * Validate and sanitize quests
 */
function validateAndSanitizeQuests(
    quests: AIGeneratedQuest[],
    context: UserHealthContext
): AIGeneratedQuest[] {
    if (!Array.isArray(quests)) return getDefaultQuests(context)

    return quests.map(quest => ({
        title: String(quest.title || 'Görev').slice(0, 100),
        description: String(quest.description || '').slice(0, 500),
        category: validateCategory(quest.category),
        difficulty: validateDifficulty(quest.difficulty),
        estimated_minutes: Math.min(Math.max(Number(quest.estimated_minutes) || 15, 5), 120),
        calorie_impact: Number(quest.calorie_impact) || 0,
        xp_reward: Math.min(Math.max(Number(quest.xp_reward) || 20, 5), 100),
        emoji: String(quest.emoji || '✨').slice(0, 4),
        scientific_rationale: String(quest.scientific_rationale || '').slice(0, 300),
        is_morning: Boolean(quest.is_morning),
        is_evening: Boolean(quest.is_evening)
    }))
}

function validateCategory(cat: string): AIGeneratedQuest['category'] {
    const valid = ['nutrition', 'exercise', 'habit', 'tracking', 'recovery']
    return valid.includes(cat) ? cat as AIGeneratedQuest['category'] : 'habit'
}

function validateDifficulty(diff: string): AIGeneratedQuest['difficulty'] {
    const valid = ['easy', 'medium', 'hard']
    return valid.includes(diff) ? diff as AIGeneratedQuest['difficulty'] : 'medium'
}

/**
 * Default nutrition plan fallback
 */
function getDefaultNutritionPlan(context: UserHealthContext): AINutritionPlan {
    return {
        daily_calorie_target: context.target_daily_kcal,
        protein_grams: context.protein_g,
        carbs_grams: context.carbs_g,
        fat_grams: context.fat_g,
        meal_suggestions: [
            'Proteinli kahvaltı (yumurta, yulaf)',
            'Dengeli öğle (protein + sebze + tahıl)',
            'Hafif akşam (balık/tavuk + salata)'
        ],
        hydration_goal_liters: context.water_liters
    }
}

/**
 * Default quests fallback
 */
function getDefaultQuests(context: UserHealthContext): AIGeneratedQuest[] {
    const quests: AIGeneratedQuest[] = [
        {
            title: `${context.water_liters}L Su İç`,
            description: 'Gün boyunca düzenli aralıklarla su iç. Sabah kalkar kalkmaz 1 bardak ile başla.',
            category: 'habit',
            difficulty: 'easy',
            estimated_minutes: 5,
            calorie_impact: 0,
            xp_reward: 15,
            emoji: '💧',
            scientific_rationale: 'Hidrasyon metabolizmayı hızlandırır ve açlık hissini azaltır.',
            is_morning: true,
            is_evening: false
        },
        {
            title: '30 Dakika Yürüyüş',
            description: 'Orta tempoda yürüyüş yap. Tempolu yürüyüş tercih et.',
            category: 'exercise',
            difficulty: 'easy',
            estimated_minutes: 30,
            calorie_impact: -150,
            xp_reward: 30,
            emoji: '🚶',
            scientific_rationale: 'Düşük yoğunluklu kardiyo yağ yakımını artırır.',
            is_morning: false,
            is_evening: false
        },
        {
            title: `${context.protein_g}g Protein Hedefi`,
            description: 'Her öğünde protein kaynağı olduğundan emin ol.',
            category: 'nutrition',
            difficulty: 'medium',
            estimated_minutes: 0,
            calorie_impact: 0,
            xp_reward: 25,
            emoji: '🥩',
            scientific_rationale: 'Protein kas korumayı sağlar ve tokluk verir.',
            is_morning: false,
            is_evening: false
        },
        {
            title: 'Kalori Takibi',
            description: `Bugün yediklerini takip et. Hedef: ${context.target_daily_kcal} kcal`,
            category: 'tracking',
            difficulty: 'medium',
            estimated_minutes: 10,
            calorie_impact: 0,
            xp_reward: 20,
            emoji: '📊',
            scientific_rationale: 'Kalori takibi farkındalığı artırır ve hedefte kalmayı sağlar.',
            is_morning: false,
            is_evening: true
        }
    ]

    return quests
}

// =====================================================
// Goal-Specific Quest Generation (NEW MODULAR SYSTEM)
// =====================================================

/**
 * Generate quests using the new modular goal-specific prompt system.
 * This function should be used for goals with specialized prompts.
 */
export async function generateGoalSpecificQuests(
    context: GoalSpecificContext
): Promise<AIHealthResponse> {
    try {
        // 1. Compose system prompt (base + goal-specific)
        const systemPrompt = composeSystemPrompt(context.goal_type)

        // 2. Build goal-specific user context message
        const userMessage = buildGoalContextMessage(context)

        // 3. Prepare messages for AI
        const messages: ChatMessage[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ]

        // 4. Call AI with goal-specific prompts
        const response = await generateCompletion(messages, {
            temperature: 0.7,
            maxTokens: 3000
        })

        if (!response.success) {
            return {
                success: false,
                daily_quests: getGoalSpecificDefaultQuests(context.goal_type),
                nutrition_plan: getGoalSpecificNutritionPlan(context),
                warnings: ['AI servisi yanıt veremedi.'],
                motivational_tip: getGoalSpecificMotivation(context.goal_type),
                council_notes: '',
                error: response.error
            }
        }

        // Parse JSON response
        const parsed = parseAIResponse(response.content)

        if (!parsed) {
            return {
                success: false,
                daily_quests: getGoalSpecificDefaultQuests(context.goal_type),
                nutrition_plan: getGoalSpecificNutritionPlan(context),
                warnings: ['AI yanıtı işlenemedi, varsayılan görevler oluşturuldu.'],
                motivational_tip: getGoalSpecificMotivation(context.goal_type),
                council_notes: '',
                error: 'Failed to parse AI response'
            }
        }

        // Validate quests (reuse existing validation)
        const validatedQuests = validateGoalSpecificQuests(parsed.daily_quests || [], context.goal_type)

        return {
            success: true,
            daily_quests: validatedQuests,
            nutrition_plan: parsed.nutrition_plan || getGoalSpecificNutritionPlan(context),
            warnings: parsed.warnings || [],
            motivational_tip: parsed.motivational_tip || getGoalSpecificMotivation(context.goal_type),
            council_notes: parsed.council_notes || ''
        }

    } catch (error) {
        console.error('[AI Health Council] Goal-specific error:', error)
        return {
            success: false,
            daily_quests: getGoalSpecificDefaultQuests(context.goal_type),
            nutrition_plan: getGoalSpecificNutritionPlan(context),
            warnings: ['AI servisi geçici olarak kullanılamıyor.'],
            motivational_tip: getGoalSpecificMotivation(context.goal_type),
            council_notes: '',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }
}

// =====================================================
// Goal-Specific Helpers
// =====================================================

function validateGoalSpecificQuests(
    quests: AIGeneratedQuest[],
    goalType: GoalType
): AIGeneratedQuest[] {
    if (!Array.isArray(quests)) return getGoalSpecificDefaultQuests(goalType)

    return quests.map(quest => ({
        title: String(quest.title || 'Görev').slice(0, 100),
        description: String(quest.description || '').slice(0, 500),
        category: validateCategory(quest.category),
        difficulty: validateDifficulty(quest.difficulty),
        estimated_minutes: Math.min(Math.max(Number(quest.estimated_minutes) || 15, 5), 120),
        calorie_impact: Number(quest.calorie_impact) || 0,
        xp_reward: Math.min(Math.max(Number(quest.xp_reward) || 20, 5), 100),
        emoji: String(quest.emoji || '✨').slice(0, 4),
        scientific_rationale: String(quest.scientific_rationale || '').slice(0, 300),
        is_morning: Boolean(quest.is_morning),
        is_evening: Boolean(quest.is_evening)
    }))
}

function getGoalSpecificDefaultQuests(goalType: GoalType): AIGeneratedQuest[] {
    switch (goalType) {
        case 'reduce_sugar':
            return [
                {
                    title: 'Bugün Gazlı İçecek İçme',
                    description: 'Gazlı içecekler yerine su, maden suyu veya bitki çayı tercih et.',
                    category: 'habit',
                    difficulty: 'medium',
                    estimated_minutes: 0,
                    calorie_impact: -150,
                    xp_reward: 30,
                    emoji: '🚫',
                    scientific_rationale: 'Bir kutu gazlı içecek ~39g şeker içerir, günlük limitin üzerinde.',
                    is_morning: true,
                    is_evening: true
                },
                {
                    title: 'Şeker Etiketlerini Kontrol Et',
                    description: '3 ürünün besin etiketini oku ve şeker miktarını kontrol et.',
                    category: 'tracking',
                    difficulty: 'easy',
                    estimated_minutes: 10,
                    calorie_impact: 0,
                    xp_reward: 20,
                    emoji: '📖',
                    scientific_rationale: 'Farkındalık şeker tüketimini azaltmanın ilk adımıdır.',
                    is_morning: false,
                    is_evening: false
                },
                {
                    title: 'Tatlı Yerine Meyve Ye',
                    description: 'Tatlı isteği geldiğinde bir porsiyon taze meyve (elma, çilek, portakal) ye.',
                    category: 'nutrition',
                    difficulty: 'easy',
                    estimated_minutes: 5,
                    calorie_impact: -100,
                    xp_reward: 20,
                    emoji: '🍎',
                    scientific_rationale: 'Meyvedeki doğal şeker lif ile birlikte gelir ve kan şekerini yavaş yükseltir.',
                    is_morning: false,
                    is_evening: false
                },
                {
                    title: 'Kahveni Şekersiz İç',
                    description: 'Kahve veya çayına şeker eklemeden iç. Tarçın ekleyebilirsin.',
                    category: 'habit',
                    difficulty: 'medium',
                    estimated_minutes: 0,
                    calorie_impact: -50,
                    xp_reward: 25,
                    emoji: '☕',
                    scientific_rationale: 'Günde 3 şekerli kahve = 30-45g ekstra şeker.',
                    is_morning: true,
                    is_evening: false
                },
                {
                    title: 'Gece Atıştırmasına Hayır',
                    description: 'Akşam yemeğinden sonra tatlı veya atıştırmalık yeme.',
                    category: 'habit',
                    difficulty: 'hard',
                    estimated_minutes: 0,
                    calorie_impact: -200,
                    xp_reward: 35,
                    emoji: '🌙',
                    scientific_rationale: 'Gece yenen şeker metabolizmayı olumsuz etkiler ve yağ depolanmasını artırır.',
                    is_morning: false,
                    is_evening: true
                }
            ]

        case 'weight_loss':
            return [
                {
                    title: '30 Dakika Yürüyüş',
                    description: 'Tempolu bir yürüyüş yap. Nefes alıp verirken konuşabilecek tempoda.',
                    category: 'exercise',
                    difficulty: 'easy',
                    estimated_minutes: 30,
                    calorie_impact: -150,
                    xp_reward: 30,
                    emoji: '🚶',
                    scientific_rationale: 'Düşük yoğunluklu kardiyo yağ yakımını optimize eder.',
                    is_morning: false,
                    is_evening: false
                },
                {
                    title: 'Porsiyon Kontrolü',
                    description: 'Öğle yemeğinde küçük tabak kullan veya porsiyonu %20 azalt.',
                    category: 'nutrition',
                    difficulty: 'medium',
                    estimated_minutes: 0,
                    calorie_impact: -100,
                    xp_reward: 25,
                    emoji: '🍽️',
                    scientific_rationale: 'Küçük tabak kullanmak bilinçsiz kalori alımını azaltır.',
                    is_morning: false,
                    is_evening: false
                },
                {
                    title: 'Kalori Takibi',
                    description: 'Bugün yediklerini bir uygulamada veya defterde takip et.',
                    category: 'tracking',
                    difficulty: 'medium',
                    estimated_minutes: 15,
                    calorie_impact: 0,
                    xp_reward: 25,
                    emoji: '📊',
                    scientific_rationale: 'Kalori takibi farkındalığı artırır ve hedefte kalmayı sağlar.',
                    is_morning: false,
                    is_evening: true
                },
                {
                    title: '2.5L Su İç',
                    description: 'Gün boyunca düzenli aralıklarla su iç.',
                    category: 'habit',
                    difficulty: 'easy',
                    estimated_minutes: 0,
                    calorie_impact: 0,
                    xp_reward: 15,
                    emoji: '💧',
                    scientific_rationale: 'Su tokluk hissi verir ve metabolizmayı hızlandırır.',
                    is_morning: true,
                    is_evening: true
                }
            ]

        default:
            return [
                {
                    title: 'Günlük Hedefine Odaklan',
                    description: 'Bugün hedefine yönelik bir adım at.',
                    category: 'habit',
                    difficulty: 'easy',
                    estimated_minutes: 15,
                    calorie_impact: 0,
                    xp_reward: 20,
                    emoji: '🎯',
                    scientific_rationale: 'Küçük adımlar büyük değişimlerin temelidir.',
                    is_morning: true,
                    is_evening: false
                }
            ]
    }
}

function getGoalSpecificMotivation(goalType: GoalType): string {
    switch (goalType) {
        case 'reduce_sugar':
            return 'Her şekersiz gün, vücudunun şükran duyduğu bir gün! 🍬❌'
        case 'weight_loss':
            return 'Yolculuk devam ediyor, her adım seni hedefe yaklaştırıyor! 💪'
        case 'muscle_gain':
            return 'Kaslar mutfakta yapılır, antrenmanda şekillenir! 🏋️'
        case 'intermittent_fasting':
            return 'Oruç süren sona erdiğinde gurur duyacaksın! ⏰'
        case 'drink_water':
            return 'Su hayattır, bugün vücuduna ihtiyacı olan suyu ver! 💧'
        case 'activity':
            return 'Hareket et, hayata enerji kat! 🏃'
        case 'eat_healthy':
            return 'Sağlıklı beslenme bir kilo maratonu değil, yaşam tarzı! 🥗'
        default:
            return 'Bugün de harika bir gün olacak! ✨'
    }
}

function getGoalSpecificNutritionPlan(context: GoalSpecificContext): AINutritionPlan {
    // Default minimal nutrition plan for non-weight goals
    return {
        daily_calorie_target: 0,
        protein_grams: 0,
        carbs_grams: 0,
        fat_grams: 0,
        meal_suggestions: ['Dengeli beslen', 'Bol sebze tüket', 'Su içmeyi unutma'],
        hydration_goal_liters: 2.5
    }
}
