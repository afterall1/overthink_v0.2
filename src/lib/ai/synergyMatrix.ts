'use strict'

// =====================================================
// Goal Synergy Matrix
// Defines relationships between all goal templates
// Used by GoalSynergyEngine for intelligent quest coordination
// =====================================================

// =====================================================
// Types
// =====================================================

/**
 * Types of relationships between goals
 * 
 * SYNERGISTIC:  Same direction, almost identical outcome
 *               Example: lose_weight + lose_fat
 *               → Share 80%+ quests, high overlap
 * 
 * COMPLEMENTARY: Support each other indirectly
 *                Example: muscle_gain + protein_goal
 *                → Some shared quests, moderate overlap
 * 
 * PARALLEL:     No direct relationship but compatible
 *               Example: weight_loss + daily_steps
 *               → Few shared quests, low overlap
 * 
 * CONFLICTING:  Opposite directions, should warn user
 *               Example: weight_loss + weight_gain
 *               → Show warning, cannot share quests
 */
export type SynergyType = 'SYNERGISTIC' | 'COMPLEMENTARY' | 'PARALLEL' | 'CONFLICTING'

export interface SynergyRelationship {
    type: SynergyType
    questShareRatio: number      // 0.0 - 1.0, how much quests should be shared
    contributionWeight: number   // Weight multiplier when quest contributes to both
    description: string          // Human-readable explanation
}

export interface GoalSynergyInfo {
    slug: string
    title: string
    category: string
    primaryFocus: 'nutrition' | 'exercise' | 'habit' | 'tracking' | 'mixed'
    calorieDirection: 'deficit' | 'surplus' | 'maintenance' | 'neutral'
}

// =====================================================
// Goal Metadata
// =====================================================

export const GOAL_METADATA: Record<string, GoalSynergyInfo> = {
    // Food Category
    'lose_weight': {
        slug: 'lose_weight',
        title: 'Kilo Vermek',
        category: 'food',
        primaryFocus: 'mixed',
        calorieDirection: 'deficit'
    },
    'gain_muscle': {
        slug: 'gain_muscle',
        title: 'Kas Kazanmak',
        category: 'food',
        primaryFocus: 'mixed',
        calorieDirection: 'surplus'
    },
    'eat_healthy': {
        slug: 'eat_healthy',
        title: 'Sağlıklı Beslenme',
        category: 'food',
        primaryFocus: 'nutrition',
        calorieDirection: 'maintenance'
    },
    'intermittent_fasting': {
        slug: 'intermittent_fasting',
        title: 'Aralıklı Oruç',
        category: 'food',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'drink_water': {
        slug: 'drink_water',
        title: 'Su İçme Alışkanlığı',
        category: 'food',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'reduce_sugar': {
        slug: 'reduce_sugar',
        title: 'Şekeri Azalt',
        category: 'food',
        primaryFocus: 'nutrition',
        calorieDirection: 'deficit'
    },
    'meal_prep': {
        slug: 'meal_prep',
        title: 'Haftalık Yemek Hazırlığı',
        category: 'food',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'protein_goal': {
        slug: 'protein_goal',
        title: 'Günlük Protein Hedefi',
        category: 'food',
        primaryFocus: 'nutrition',
        calorieDirection: 'neutral'
    },

    // Sport Category
    'build_strength': {
        slug: 'build_strength',
        title: 'Güç Artışı',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'surplus'
    },
    'run_5k': {
        slug: 'run_5k',
        title: '5K Koşusu',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'deficit'
    },
    'run_10k': {
        slug: 'run_10k',
        title: '10K Koşusu',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'deficit'
    },
    'run_marathon': {
        slug: 'run_marathon',
        title: 'Maraton Hazırlığı',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'neutral'
    },
    'lose_fat': {
        slug: 'lose_fat',
        title: 'Yağ Yakma',
        category: 'sport',
        primaryFocus: 'mixed',
        calorieDirection: 'deficit'
    },
    'daily_steps': {
        slug: 'daily_steps',
        title: 'Günlük 10.000 Adım',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'deficit'
    },
    'weekly_workouts': {
        slug: 'weekly_workouts',
        title: 'Haftalık Antrenman',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'neutral'
    },
    'flexibility': {
        slug: 'flexibility',
        title: 'Esneklik Geliştirme',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'neutral'
    },
    'swimming_distance': {
        slug: 'swimming_distance',
        title: 'Aylık Yüzme',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'deficit'
    },
    'cycling_distance': {
        slug: 'cycling_distance',
        title: 'Aylık Bisiklet',
        category: 'sport',
        primaryFocus: 'exercise',
        calorieDirection: 'deficit'
    },

    // Dev Category
    'learn_language': {
        slug: 'learn_language',
        title: 'Yeni Dil Öğren',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'build_project': {
        slug: 'build_project',
        title: 'Proje Tamamla',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'daily_commits': {
        slug: 'daily_commits',
        title: 'Günlük Commit',
        category: 'dev',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'open_source': {
        slug: 'open_source',
        title: 'Açık Kaynak Katkı',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'certification': {
        slug: 'certification',
        title: 'Sertifika Al',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'leetcode': {
        slug: 'leetcode',
        title: 'Algoritma Pratiği',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'reading_tech': {
        slug: 'reading_tech',
        title: 'Teknik Okuma',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'side_project': {
        slug: 'side_project',
        title: 'Yan Proje',
        category: 'dev',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },

    // Trade Category
    'trading_discipline': {
        slug: 'trading_discipline',
        title: 'Trading Disiplini',
        category: 'trade',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'risk_management': {
        slug: 'risk_management',
        title: 'Risk Yönetimi',
        category: 'trade',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'profit_target': {
        slug: 'profit_target',
        title: 'Aylık Kar Hedefi',
        category: 'trade',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'win_rate': {
        slug: 'win_rate',
        title: 'Kazanç Oranı',
        category: 'trade',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'journal_habit': {
        slug: 'journal_habit',
        title: 'Trade Günlüğü',
        category: 'trade',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'market_study': {
        slug: 'market_study',
        title: 'Piyasa Analizi',
        category: 'trade',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },

    // Etsy Category
    'monthly_revenue': {
        slug: 'monthly_revenue',
        title: 'Aylık Gelir Hedefi',
        category: 'etsy',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'new_listings': {
        slug: 'new_listings',
        title: 'Yeni Ürün Ekleme',
        category: 'etsy',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'conversion_rate': {
        slug: 'conversion_rate',
        title: 'Dönüşüm Oranı',
        category: 'etsy',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'customer_response': {
        slug: 'customer_response',
        title: 'Hızlı Müşteri Yanıtı',
        category: 'etsy',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'social_marketing': {
        slug: 'social_marketing',
        title: 'Sosyal Medya Pazarlama',
        category: 'etsy',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'review_rating': {
        slug: 'review_rating',
        title: 'Yorum Puanı',
        category: 'etsy',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },

    // Gaming Category
    'rank_up': {
        slug: 'rank_up',
        title: 'Rank Yükseltme',
        category: 'gaming',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'stream_consistency': {
        slug: 'stream_consistency',
        title: 'Yayın Tutarlılığı',
        category: 'gaming',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'game_completion': {
        slug: 'game_completion',
        title: 'Oyun Bitirme',
        category: 'gaming',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    },
    'skill_improvement': {
        slug: 'skill_improvement',
        title: 'Beceri Geliştirme',
        category: 'gaming',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'content_creation': {
        slug: 'content_creation',
        title: 'İçerik Üretimi',
        category: 'gaming',
        primaryFocus: 'habit',
        calorieDirection: 'neutral'
    },
    'community_growth': {
        slug: 'community_growth',
        title: 'Topluluk Büyütme',
        category: 'gaming',
        primaryFocus: 'tracking',
        calorieDirection: 'neutral'
    }
}

// =====================================================
// Synergy Matrix - Core Relationships
// =====================================================

/**
 * Complete synergy mapping between health/fitness goal templates
 * Format: GOAL_SYNERGY_MATRIX[goalA][goalB] = SynergyRelationship
 * 
 * Only health/fitness goals have meaningful synergy relationships.
 * Other categories (dev, trade, etsy, gaming) are PARALLEL by default.
 */
export const GOAL_SYNERGY_MATRIX: Record<string, Record<string, SynergyRelationship>> = {
    // =====================================================
    // LOSE_WEIGHT Relationships
    // =====================================================
    'lose_weight': {
        'lose_fat': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Kilo vermek ve yağ yakmak neredeyse aynı süreç. Aynı görevler her ikisine de katkı sağlar.'
        },
        'eat_healthy': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Sağlıklı beslenme kilo vermeyi destekler. Beslenme görevleri paylaşılabilir.'
        },
        'drink_water': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Su içmek metabolizmayı hızlandırır ve kilo vermeye yardımcı olur.'
        },
        'reduce_sugar': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.7,
            contributionWeight: 0.8,
            description: 'Şeker azaltmak kalori açığı oluşturur ve kilo vermeyi hızlandırır.'
        },
        'intermittent_fasting': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Aralıklı oruç kalori kontrolünü kolaylaştırır.'
        },
        'meal_prep': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Yemek hazırlığı porsiyon kontrolünü kolaylaştırır.'
        },
        'daily_steps': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Yürüyüş kalori yakımını artırır.'
        },
        'weekly_workouts': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Düzenli antrenman kilo vermeyi hızlandırır.'
        },
        'run_5k': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Koşu kalori yakar ama ana odak farklı.'
        },
        'gain_muscle': {
            type: 'CONFLICTING',
            questShareRatio: 0,
            contributionWeight: 0,
            description: '⚠️ Kilo vermek kalori açığı, kas yapmak kalori fazlası gerektirir. Bu hedefler çatışıyor.'
        },
        'protein_goal': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Protein hedefi kilo verirken kas korumaya yardımcı olabilir.'
        },
        'flexibility': {
            type: 'PARALLEL',
            questShareRatio: 0.2,
            contributionWeight: 0.2,
            description: 'Esneklik bağımsız bir hedef, dolaylı destek sağlar.'
        }
    },

    // =====================================================
    // LOSE_FAT Relationships
    // =====================================================
    'lose_fat': {
        'lose_weight': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Yağ yakmak ve kilo vermek neredeyse aynı süreç.'
        },
        'daily_steps': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.8,
            contributionWeight: 0.85,
            description: 'Adım atmak direkt yağ yakımını artırır.'
        },
        'weekly_workouts': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.75,
            contributionWeight: 0.8,
            description: 'Düzenli antrenman yağ yakımı için kritik.'
        },
        'eat_healthy': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Sağlıklı beslenme yağ yakımını destekler.'
        },
        'reduce_sugar': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.7,
            contributionWeight: 0.75,
            description: 'Şeker azaltmak yağ depolanmasını önler.'
        },
        'drink_water': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Hidrasyon metabolizmayı hızlandırır.'
        },
        'intermittent_fasting': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Oruç yağ yakımını tetikler.'
        },
        'build_strength': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Güç antrenmanı metabolizmayı artırır.'
        },
        'run_5k': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Koşu kardiyovasküler yağ yakımı sağlar.'
        },
        'gain_muscle': {
            type: 'CONFLICTING',
            questShareRatio: 0,
            contributionWeight: 0,
            description: '⚠️ Yağ yakmak açık, kas yapmak fazla gerektirir.'
        }
    },

    // =====================================================
    // GAIN_MUSCLE Relationships
    // =====================================================
    'gain_muscle': {
        'protein_goal': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.9,
            contributionWeight: 0.95,
            description: 'Protein alımı kas yapımı için zorunlu. Aynı beslenme görevleri.'
        },
        'build_strength': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Güç artışı ve kas kazanımı aynı antrenman programını paylaşır.'
        },
        'weekly_workouts': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.8,
            contributionWeight: 0.85,
            description: 'Düzenli antrenman kas yapımı için temel.'
        },
        'eat_healthy': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Sağlıklı beslenme kas yapımını destekler.'
        },
        'meal_prep': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Yemek hazırlığı tutarlı protein alımını sağlar.'
        },
        'flexibility': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Esneklik toparlanmayı hızlandırır.'
        },
        'drink_water': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.3,
            description: 'Hidrasyon kas performansını destekler.'
        },
        'lose_weight': {
            type: 'CONFLICTING',
            questShareRatio: 0,
            contributionWeight: 0,
            description: '⚠️ Kas yapmak fazla, kilo vermek açık gerektirir.'
        },
        'lose_fat': {
            type: 'CONFLICTING',
            questShareRatio: 0,
            contributionWeight: 0,
            description: '⚠️ Kas yapmak ve yağ yakmak aynı anda zor.'
        }
    },

    // =====================================================
    // DAILY_STEPS Relationships
    // =====================================================
    'daily_steps': {
        'lose_fat': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.8,
            contributionWeight: 0.85,
            description: 'Adım atmak direkt yağ yakımı sağlar.'
        },
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Yürüyüş kalori açığına katkı sağlar.'
        },
        'weekly_workouts': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Aktif yaşam tarzının parçası.'
        },
        'run_5k': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Koşuya hazırlık için yürüyüş iyi bir temel.'
        },
        'cycling_distance': {
            type: 'PARALLEL',
            questShareRatio: 0.2,
            contributionWeight: 0.3,
            description: 'Farklı aktivite türleri, dolaylı destek.'
        }
    },

    // =====================================================
    // REDUCE_SUGAR Relationships
    // =====================================================
    'reduce_sugar': {
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.7,
            contributionWeight: 0.8,
            description: 'Şeker azaltmak kilo vermeyi hızlandırır.'
        },
        'lose_fat': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.7,
            contributionWeight: 0.75,
            description: 'Şeker azaltmak yağ depolanmasını önler.'
        },
        'eat_healthy': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.75,
            contributionWeight: 0.8,
            description: 'Şeker azaltmak sağlıklı beslenmenin önemli parçası.'
        },
        'drink_water': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Su şekerli içeceklerin yerini alır.'
        },
        'intermittent_fasting': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Farklı odak noktaları ama uyumlu.'
        }
    },

    // =====================================================
    // EAT_HEALTHY Relationships
    // =====================================================
    'eat_healthy': {
        'reduce_sugar': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.75,
            contributionWeight: 0.8,
            description: 'Şeker azaltmak sağlıklı beslenmenin parçası.'
        },
        'meal_prep': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.7,
            contributionWeight: 0.75,
            description: 'Yemek hazırlığı sağlıklı beslenmeyi kolaylaştırır.'
        },
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Sağlıklı beslenme kilo kontrolüne yardımcı olur.'
        },
        'protein_goal': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Protein hedefi sağlıklı beslenmenin parçası.'
        },
        'drink_water': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Hidrasyon sağlıklı yaşamın temeli.'
        }
    },

    // =====================================================
    // DRINK_WATER Relationships
    // =====================================================
    'drink_water': {
        'eat_healthy': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Hidrasyon sağlıklı yaşamın temeli.'
        },
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Su metabolizmayı hızlandırır.'
        },
        'reduce_sugar': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Su şekerli içeceklerin yerini alır.'
        },
        'daily_steps': {
            type: 'PARALLEL',
            questShareRatio: 0.2,
            contributionWeight: 0.3,
            description: 'Aktif yaşam tarzını destekler.'
        }
    },

    // =====================================================
    // WEEKLY_WORKOUTS Relationships
    // =====================================================
    'weekly_workouts': {
        'lose_fat': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.75,
            contributionWeight: 0.8,
            description: 'Düzenli antrenman yağ yakımı için kritik.'
        },
        'gain_muscle': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.8,
            contributionWeight: 0.85,
            description: 'Düzenli antrenman kas yapımı için temel.'
        },
        'build_strength': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Güç artışı için tutarlı antrenman gerekli.'
        },
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Antrenman kalori açığına katkı sağlar.'
        },
        'daily_steps': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Aktif yaşam tarzının parçası.'
        },
        'flexibility': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Esneklik antrenmani tamamlar.'
        }
    },

    // =====================================================
    // BUILD_STRENGTH Relationships
    // =====================================================
    'build_strength': {
        'gain_muscle': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Güç ve kas aynı antrenman programı.'
        },
        'weekly_workouts': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.85,
            contributionWeight: 0.9,
            description: 'Tutarlı antrenman güç için zorunlu.'
        },
        'protein_goal': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Protein güç artışını destekler.'
        },
        'flexibility': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Esneklik yaralanma riskini azaltır.'
        },
        'lose_fat': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.4,
            contributionWeight: 0.5,
            description: 'Güç antrenmanı metabolizmayı artırır.'
        }
    },

    // =====================================================
    // PROTEIN_GOAL Relationships
    // =====================================================
    'protein_goal': {
        'gain_muscle': {
            type: 'SYNERGISTIC',
            questShareRatio: 0.9,
            contributionWeight: 0.95,
            description: 'Protein kas yapımı için zorunlu.'
        },
        'build_strength': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.6,
            contributionWeight: 0.7,
            description: 'Protein güç artışını destekler.'
        },
        'eat_healthy': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Protein sağlıklı beslenmenin parçası.'
        },
        'lose_weight': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Protein tokluk verir ve kas korur.'
        }
    },

    // =====================================================
    // INTERMITTENT_FASTING Relationships
    // =====================================================
    'intermittent_fasting': {
        'lose_weight': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Oruç kalori kontrolünü kolaylaştırır.'
        },
        'lose_fat': {
            type: 'COMPLEMENTARY',
            questShareRatio: 0.5,
            contributionWeight: 0.6,
            description: 'Oruç yağ yakımını tetikler.'
        },
        'eat_healthy': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Farklı odak noktaları ama uyumlu.'
        },
        'reduce_sugar': {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.4,
            description: 'Her ikisi de beslenme disiplini gerektirir.'
        }
    }
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get synergy relationship between two goals
 * Returns PARALLEL if no specific relationship defined
 */
export function getSynergyRelationship(
    goalA: string,
    goalB: string
): SynergyRelationship {
    // Check direct relationship
    if (GOAL_SYNERGY_MATRIX[goalA]?.[goalB]) {
        return GOAL_SYNERGY_MATRIX[goalA][goalB]
    }

    // Check reverse relationship
    if (GOAL_SYNERGY_MATRIX[goalB]?.[goalA]) {
        return GOAL_SYNERGY_MATRIX[goalB][goalA]
    }

    // Check if same category (dev, trade, etsy, gaming goals)
    const metaA = GOAL_METADATA[goalA]
    const metaB = GOAL_METADATA[goalB]

    if (metaA && metaB && metaA.category === metaB.category) {
        // Same category, non-health goals are parallel
        return {
            type: 'PARALLEL',
            questShareRatio: 0.3,
            contributionWeight: 0.3,
            description: 'Aynı kategorideki hedefler, bazı görevler paylaşılabilir.'
        }
    }

    // Default: PARALLEL with low sharing
    return {
        type: 'PARALLEL',
        questShareRatio: 0.1,
        contributionWeight: 0.2,
        description: 'Bu hedefler bağımsız çalışıyor.'
    }
}

/**
 * Get all synergistic relationships for a goal
 */
export function getSynergisticGoals(goalSlug: string): Array<{
    slug: string
    relationship: SynergyRelationship
}> {
    const results: Array<{ slug: string; relationship: SynergyRelationship }> = []

    // Check GOAL_SYNERGY_MATRIX for all goals where this goal is source
    if (GOAL_SYNERGY_MATRIX[goalSlug]) {
        for (const [targetSlug, relationship] of Object.entries(GOAL_SYNERGY_MATRIX[goalSlug])) {
            if (relationship.type === 'SYNERGISTIC') {
                results.push({ slug: targetSlug, relationship })
            }
        }
    }

    // Check reverse relationships
    for (const [sourceSlug, relationships] of Object.entries(GOAL_SYNERGY_MATRIX)) {
        if (sourceSlug !== goalSlug && relationships[goalSlug]?.type === 'SYNERGISTIC') {
            results.push({ slug: sourceSlug, relationship: relationships[goalSlug] })
        }
    }

    return results
}

/**
 * Check if two goals have a conflicting relationship
 */
export function areGoalsConflicting(goalA: string, goalB: string): boolean {
    const relationship = getSynergyRelationship(goalA, goalB)
    return relationship.type === 'CONFLICTING'
}

/**
 * Get goals that conflict with the given goal
 */
export function getConflictingGoals(goalSlug: string): string[] {
    const conflicts: string[] = []

    // Check GOAL_SYNERGY_MATRIX for conflicts
    if (GOAL_SYNERGY_MATRIX[goalSlug]) {
        for (const [targetSlug, relationship] of Object.entries(GOAL_SYNERGY_MATRIX[goalSlug])) {
            if (relationship.type === 'CONFLICTING') {
                conflicts.push(targetSlug)
            }
        }
    }

    // Check reverse relationships
    for (const [sourceSlug, relationships] of Object.entries(GOAL_SYNERGY_MATRIX)) {
        if (sourceSlug !== goalSlug && relationships[goalSlug]?.type === 'CONFLICTING') {
            conflicts.push(sourceSlug)
        }
    }

    return conflicts
}

/**
 * Calculate optimal quest share ratio for multiple active goals
 */
export function calculateOptimalQuestSharing(
    activeGoals: string[]
): Map<string, Map<string, number>> {
    const sharingMap = new Map<string, Map<string, number>>()

    for (const goalA of activeGoals) {
        const goalMap = new Map<string, number>()

        for (const goalB of activeGoals) {
            if (goalA !== goalB) {
                const relationship = getSynergyRelationship(goalA, goalB)
                goalMap.set(goalB, relationship.questShareRatio)
            }
        }

        sharingMap.set(goalA, goalMap)
    }

    return sharingMap
}
