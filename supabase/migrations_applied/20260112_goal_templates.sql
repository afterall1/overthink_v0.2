-- =====================================================
-- Goal Templates Migration
-- Migration: 20260112_goal_templates.sql
-- Description: Create goal_templates table and link quest_templates
-- =====================================================

-- 1. Create goal_templates table
CREATE TABLE IF NOT EXISTS goal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_slug TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '🎯',
    
    -- Progress Configuration
    metric_unit TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    default_target_value NUMERIC,
    progress_direction TEXT DEFAULT 'increase' CHECK (progress_direction IN ('increase', 'decrease')),
    
    -- Time Configuration
    default_period TEXT DEFAULT 'monthly' CHECK (default_period IN ('daily', 'weekly', 'monthly', 'yearly')),
    default_duration_days INTEGER DEFAULT 30,
    
    -- Difficulty & XP
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    completion_xp INTEGER DEFAULT 500,
    
    -- Quest → Goal Progress Contribution
    quest_progress_value NUMERIC DEFAULT 1,
    
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add goal_template_id to quest_templates
ALTER TABLE quest_templates 
ADD COLUMN IF NOT EXISTS goal_template_id UUID REFERENCES goal_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS progress_contribution NUMERIC DEFAULT 1;

-- 3. Add goal_template_id and metric fields to goals
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS goal_template_id UUID REFERENCES goal_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS metric_unit TEXT,
ADD COLUMN IF NOT EXISTS metric_name TEXT;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_goal_templates_category ON goal_templates(category_slug);
CREATE INDEX IF NOT EXISTS idx_goal_templates_slug ON goal_templates(slug);
CREATE INDEX IF NOT EXISTS idx_quest_templates_goal_template ON quest_templates(goal_template_id);
CREATE INDEX IF NOT EXISTS idx_goals_goal_template ON goals(goal_template_id);

-- 5. Enable RLS
ALTER TABLE goal_templates ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policy - goal_templates are publicly readable (like quest_templates)
DROP POLICY IF EXISTS "Goal templates are publicly readable" ON goal_templates;
CREATE POLICY "Goal templates are publicly readable"
    ON goal_templates FOR SELECT
    USING (true);

-- =====================================================
-- SEED DATA: Goal Templates (44 templates)
-- =====================================================

-- =====================================================
-- FOOD CATEGORY (8 Templates)
-- =====================================================

INSERT INTO goal_templates (category_slug, slug, title, description, emoji, metric_unit, metric_name, default_target_value, progress_direction, default_period, default_duration_days, difficulty, completion_xp, quest_progress_value, sort_order) VALUES

-- Food Templates
('food', 'lose_weight', 'Kilo Vermek', 'Sağlıklı beslenme ve düzenli egzersiz ile hedef kilonuza ulaşın', '⚖️', 'kg', 'Verilen Kilo', 10, 'decrease', 'monthly', 90, 'hard', 1000, 0.1, 1),
('food', 'gain_muscle', 'Kas Kazanmak', 'Protein alımı ve güç antrenmanları ile kas kütlenizi artırın', '💪', 'kg', 'Kazanılan Kas', 5, 'increase', 'monthly', 90, 'hard', 1000, 0.1, 2),
('food', 'eat_healthy', 'Sağlıklı Beslenme', '30 gün boyunca sağlıklı beslenme alışkanlığı kazanın', '🥗', 'gün', 'Sağlıklı Günler', 30, 'increase', 'monthly', 30, 'medium', 500, 1, 3),
('food', 'intermittent_fasting', 'Aralıklı Oruç', '16:8 veya tercih ettiğiniz oruç protokolünü uygulayın', '⏰', 'gün', 'Oruç Günleri', 21, 'increase', 'monthly', 30, 'medium', 400, 1, 4),
('food', 'drink_water', 'Su İçme Alışkanlığı', 'Günde 8 bardak su içme hedefini tutturun', '💧', 'bardak', 'Günlük Su', 8, 'increase', 'daily', 21, 'easy', 200, 1, 5),
('food', 'reduce_sugar', 'Şekeri Azalt', 'Rafine şeker tüketimini minimize edin', '🚫', 'gün', 'Şekersiz Günler', 21, 'increase', 'monthly', 21, 'hard', 400, 1, 6),
('food', 'meal_prep', 'Haftalık Yemek Hazırlığı', 'Haftada 5 öğün önceden hazırlayın', '🍱', 'öğün', 'Hazırlanan Öğün', 5, 'increase', 'weekly', 30, 'medium', 300, 1, 7),
('food', 'protein_goal', 'Günlük Protein Hedefi', 'Her gün yeterli protein alımını sağlayın', '🥩', 'gram', 'Günlük Protein', 120, 'increase', 'daily', 30, 'medium', 400, 10, 8),

-- =====================================================
-- SPORT CATEGORY (10 Templates)
-- =====================================================

('sport', 'build_strength', 'Güç Artışı', 'Temel kaldırışlarda güç kazanın', '🏋️', '%', '1RM Artışı', 20, 'increase', 'monthly', 90, 'hard', 800, 0.5, 1),
('sport', 'run_5k', '5K Koşusu', '5 km''yi 30 dakikanın altında koşun', '🏃', 'dakika', 'En İyi Süre', 30, 'decrease', 'monthly', 60, 'medium', 600, 1, 2),
('sport', 'run_10k', '10K Koşusu', '10 km koşusunu 60 dakikanın altında tamamlayın', '🏃‍♂️', 'dakika', 'En İyi Süre', 60, 'decrease', 'monthly', 90, 'hard', 800, 1, 3),
('sport', 'run_marathon', 'Maraton Hazırlığı', 'İlk maratonunuzu tamamlayın', '🏅', 'km', 'Toplam Mesafe', 42, 'increase', 'yearly', 180, 'hard', 2000, 5, 4),
('sport', 'lose_fat', 'Yağ Yakma', 'Vücut yağ oranınızı düşürün', '🔥', '%', 'Azaltılan Yağ', 5, 'decrease', 'monthly', 90, 'hard', 1000, 0.1, 5),
('sport', 'daily_steps', 'Günlük 10.000 Adım', 'Her gün 10.000 adım atma hedefi', '👟', 'adım', 'Günlük Adım', 10000, 'increase', 'daily', 30, 'easy', 300, 1000, 6),
('sport', 'weekly_workouts', 'Haftalık Antrenman', 'Haftada 4 antrenman seansı tamamlayın', '💪', 'seans', 'Haftalık Antrenman', 4, 'increase', 'weekly', 30, 'medium', 400, 1, 7),
('sport', 'flexibility', 'Esneklik Geliştirme', '30 gün boyunca günlük esneme', '🧘', 'gün', 'Esneme Günleri', 30, 'increase', 'monthly', 30, 'easy', 300, 1, 8),
('sport', 'swimming_distance', 'Aylık Yüzme', 'Ayda 10 km yüzme hedefi', '🏊', 'km', 'Yüzülen Mesafe', 10, 'increase', 'monthly', 30, 'medium', 500, 0.5, 9),
('sport', 'cycling_distance', 'Aylık Bisiklet', 'Ayda 100 km bisiklet hedefi', '🚴', 'km', 'Pedal Mesafesi', 100, 'increase', 'monthly', 30, 'medium', 500, 5, 10),

-- =====================================================
-- DEV CATEGORY (8 Templates)
-- =====================================================

('dev', 'learn_language', 'Yeni Dil Öğren', 'Yeni bir programlama dili öğrenin', '📚', 'gün', 'Öğrenme Günleri', 30, 'increase', 'monthly', 30, 'medium', 600, 1, 1),
('dev', 'build_project', 'Proje Tamamla', 'Bir projeyi baştan sona tamamlayın', '🚀', 'milestone', 'Tamamlanan Milestone', 10, 'increase', 'monthly', 60, 'hard', 1000, 1, 2),
('dev', 'daily_commits', 'Günlük Commit', 'Her gün en az 1 commit yapın', '📝', 'commit', 'Günlük Commit', 1, 'increase', 'daily', 30, 'easy', 300, 1, 3),
('dev', 'open_source', 'Açık Kaynak Katkı', 'Açık kaynak projelere katkı yapın', '🌐', 'PR', 'Merged PR', 5, 'increase', 'monthly', 90, 'hard', 800, 1, 4),
('dev', 'certification', 'Sertifika Al', 'Bir teknoloji sertifikası kazanın', '🎓', 'sertifika', 'Tamamlanan Sertifika', 1, 'increase', 'monthly', 90, 'hard', 1000, 0.1, 5),
('dev', 'leetcode', 'Algoritma Pratiği', 'Haftalık algoritma problemleri çözün', '🧩', 'problem', 'Çözülen Problem', 5, 'increase', 'weekly', 30, 'medium', 400, 1, 6),
('dev', 'reading_tech', 'Teknik Okuma', 'Haftalık teknik makale okuyun', '📖', 'makale', 'Okunan Makale', 3, 'increase', 'weekly', 30, 'easy', 200, 1, 7),
('dev', 'side_project', 'Yan Proje', 'Yan projeye haftalık zaman ayırın', '⏱️', 'saat', 'Haftalık Saat', 10, 'increase', 'weekly', 30, 'medium', 400, 1, 8),

-- =====================================================
-- TRADE CATEGORY (6 Templates)
-- =====================================================

('trade', 'trading_discipline', 'Trading Disiplini', 'Günlük trading rutinlerinizi oluşturun', '📊', 'gün', 'Disiplinli Günler', 30, 'increase', 'monthly', 30, 'hard', 600, 1, 1),
('trade', 'risk_management', 'Risk Yönetimi', '21 gün boyunca risk kurallarına uyun', '🛡️', 'gün', 'Kurallara Uygun Günler', 21, 'increase', 'monthly', 21, 'hard', 500, 1, 2),
('trade', 'profit_target', 'Aylık Kar Hedefi', 'Aylık kar hedefinize ulaşın', '💰', '%', 'Portföy Getirisi', 10, 'increase', 'monthly', 30, 'hard', 800, 1, 3),
('trade', 'win_rate', 'Kazanç Oranı', 'Kazanç oranınızı artırın', '🎯', '%', 'Win Rate', 60, 'increase', 'monthly', 30, 'hard', 700, 1, 4),
('trade', 'journal_habit', 'Trade Günlüğü', 'Her işlemi günlüğe kaydedin', '📓', 'gün', 'Günlük Tutulan Günler', 30, 'increase', 'monthly', 30, 'medium', 400, 1, 5),
('trade', 'market_study', 'Piyasa Analizi', 'Haftalık piyasa analizi yapın', '📈', 'saat', 'Haftalık Analiz', 5, 'increase', 'weekly', 30, 'medium', 300, 1, 6),

-- =====================================================
-- ETSY CATEGORY (6 Templates)
-- =====================================================

('etsy', 'monthly_revenue', 'Aylık Gelir Hedefi', 'Aylık gelir hedefinize ulaşın', '💵', '$', 'Aylık Gelir', 500, 'increase', 'monthly', 30, 'hard', 800, 10, 1),
('etsy', 'new_listings', 'Yeni Ürün Ekleme', 'Ayda yeni ürün listeleri ekleyin', '📦', 'ürün', 'Yeni Listeler', 10, 'increase', 'monthly', 30, 'medium', 400, 1, 2),
('etsy', 'conversion_rate', 'Dönüşüm Oranı', 'Mağaza dönüşüm oranını artırın', '📊', '%', 'Dönüşüm Oranı', 3, 'increase', 'monthly', 30, 'hard', 600, 0.1, 3),
('etsy', 'customer_response', 'Hızlı Müşteri Yanıtı', 'Müşteri mesajlarına hızlı yanıt verin', '💬', 'saat', 'Ortalama Yanıt Süresi', 4, 'decrease', 'daily', 30, 'easy', 200, 0.5, 4),
('etsy', 'social_marketing', 'Sosyal Medya Pazarlama', 'Haftalık sosyal medya paylaşımları', '📱', 'post', 'Haftalık Post', 7, 'increase', 'weekly', 30, 'medium', 300, 1, 5),
('etsy', 'review_rating', 'Yorum Puanı', 'Mağaza yorum puanını yükseltin', '⭐', 'puan', 'Ortalama Puan', 4.8, 'increase', 'monthly', 90, 'hard', 700, 0.1, 6),

-- =====================================================
-- GAMING CATEGORY (6 Templates)
-- =====================================================

('gaming', 'rank_up', 'Rank Yükseltme', 'Rekabetçi oyunlarda rank atlayın', '🏆', 'rank', 'Rank Atlama', 1, 'increase', 'monthly', 30, 'hard', 600, 0.1, 1),
('gaming', 'stream_consistency', 'Yayın Tutarlılığı', 'Haftalık düzenli yayın yapın', '🎥', 'yayın', 'Haftalık Yayın', 5, 'increase', 'weekly', 30, 'medium', 400, 1, 2),
('gaming', 'game_completion', 'Oyun Bitirme', 'Bir oyunu %100 tamamlayın', '🎮', 'oyun', 'Tamamlanan Oyun', 1, 'increase', 'monthly', 60, 'medium', 500, 0.1, 3),
('gaming', 'skill_improvement', 'Beceri Geliştirme', 'Belirli bir oyunda pratik yapın', '🎯', 'saat', 'Pratik Saati', 50, 'increase', 'monthly', 30, 'medium', 400, 1, 4),
('gaming', 'content_creation', 'İçerik Üretimi', 'Haftalık oyun videosu/içerik üretin', '📹', 'video', 'Haftalık Video', 2, 'increase', 'weekly', 30, 'hard', 500, 1, 5),
('gaming', 'community_growth', 'Topluluk Büyütme', 'Takipçi/abone sayısını artırın', '👥', 'takipçi', 'Yeni Takipçi', 100, 'increase', 'monthly', 30, 'hard', 600, 1, 6)

ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    emoji = EXCLUDED.emoji,
    metric_unit = EXCLUDED.metric_unit,
    metric_name = EXCLUDED.metric_name,
    default_target_value = EXCLUDED.default_target_value,
    progress_direction = EXCLUDED.progress_direction,
    default_period = EXCLUDED.default_period,
    default_duration_days = EXCLUDED.default_duration_days,
    difficulty = EXCLUDED.difficulty,
    completion_xp = EXCLUDED.completion_xp,
    quest_progress_value = EXCLUDED.quest_progress_value,
    sort_order = EXCLUDED.sort_order;

-- =====================================================
-- Link Quest Templates to Goal Templates
-- COMPREHENSIVE LINKING: All 44 goal templates
-- =====================================================

-- =====================================================
-- FOOD CATEGORY LINKS
-- =====================================================

-- Food: lose_weight
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'lose_weight'), progress_contribution = 0.05
WHERE category_slug = 'food' AND slug IN ('food_morning_hydration', 'food_healthy_breakfast', 'food_calorie_tracking', 'food_no_processed');

-- Food: gain_muscle
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'gain_muscle'), progress_contribution = 0.1
WHERE category_slug = 'food' AND slug IN ('food_protein_breakfast', 'food_meal_timing', 'food_calorie_surplus');

-- Food: eat_healthy
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'eat_healthy'), progress_contribution = 1
WHERE category_slug = 'food' AND slug IN ('food_veggie_portion', 'food_whole_grains', 'food_mindful_eating', 'food_no_junk');

-- Food: intermittent_fasting
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'intermittent_fasting'), progress_contribution = 1
WHERE category_slug = 'food' AND slug IN ('food_fasting_window', 'food_break_fast_healthy');

-- Food: drink_water
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'drink_water'), progress_contribution = 1
WHERE category_slug = 'food' AND slug IN ('food_morning_hydration', 'food_water_tracking');

-- Food: reduce_sugar
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'reduce_sugar'), progress_contribution = 1
WHERE category_slug = 'food' AND slug IN ('food_no_soda', 'food_fruit_dessert', 'food_no_sugar_coffee');

-- Food: meal_prep
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'meal_prep'), progress_contribution = 1
WHERE category_slug = 'food' AND slug IN ('food_weekly_prep', 'food_portion_control');

-- Food: protein_goal
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'protein_goal'), progress_contribution = 30
WHERE category_slug = 'food' AND slug IN ('food_protein_breakfast', 'food_protein_lunch', 'food_protein_dinner');

-- =====================================================
-- SPORT CATEGORY LINKS
-- =====================================================

-- Sport: build_strength
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'build_strength'), progress_contribution = 1
WHERE category_slug = 'sport' AND slug IN ('sport_gym_session', 'sport_strength_training', 'sport_progressive_overload');

-- Sport: run_5k / run_10k / run_marathon
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'run_5k'), progress_contribution = 1
WHERE category_slug = 'sport' AND slug IN ('sport_running_session', 'sport_interval_training', 'sport_tempo_run');

-- Sport: lose_fat
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'lose_fat'), progress_contribution = 0.05
WHERE category_slug = 'sport' AND slug IN ('sport_cardio_session', 'sport_hiit_workout', 'sport_morning_workout', 'sport_walk_10min');

-- Sport: daily_steps
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'daily_steps'), progress_contribution = 1000
WHERE category_slug = 'sport' AND slug IN ('sport_walk_10min', 'sport_stairs', 'sport_lunch_walk');

-- Sport: weekly_workouts
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'weekly_workouts'), progress_contribution = 1
WHERE category_slug = 'sport' AND slug IN ('sport_morning_workout', 'sport_gym_session', 'sport_cardio_session', 'sport_home_workout');

-- Sport: flexibility
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'flexibility'), progress_contribution = 1
WHERE category_slug = 'sport' AND slug IN ('sport_stretching', 'sport_yoga_session', 'sport_morning_mobility');

-- Sport: swimming_distance
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'swimming_distance'), progress_contribution = 0.5
WHERE category_slug = 'sport' AND slug IN ('sport_swimming_session', 'sport_pool_laps');

-- Sport: cycling_distance
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'cycling_distance'), progress_contribution = 5
WHERE category_slug = 'sport' AND slug IN ('sport_cycling_session', 'sport_bike_commute');

-- =====================================================
-- DEV CATEGORY LINKS
-- =====================================================

-- Dev: learn_language
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'learn_language'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_learning_time', 'dev_read_article', 'dev_watch_tutorial', 'dev_new_tool_explore');

-- Dev: build_project ← THIS WAS MISSING!
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'build_project'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_feature_complete', 'dev_deep_work_block', 'dev_pomodoro_set', 'dev_side_project', 'dev_bug_fix', 'dev_refactor_session');

-- Dev: daily_commits
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'daily_commits'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_commit_atomic', 'dev_git_push', 'dev_morning_standup');

-- Dev: open_source
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'open_source'), progress_contribution = 0.2
WHERE category_slug = 'dev' AND slug IN ('dev_code_review', 'dev_documentation', 'dev_feature_complete');

-- Dev: certification
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'certification'), progress_contribution = 0.05
WHERE category_slug = 'dev' AND slug IN ('dev_learning_time', 'dev_read_article', 'dev_watch_tutorial');

-- Dev: leetcode
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'leetcode'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_deep_work_block', 'dev_pomodoro_set');

-- Dev: reading_tech
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'reading_tech'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_read_article', 'dev_watch_tutorial');

-- Dev: side_project
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'side_project'), progress_contribution = 1
WHERE category_slug = 'dev' AND slug IN ('dev_side_project', 'dev_deep_work_block', 'dev_feature_complete');

-- =====================================================
-- TRADE CATEGORY LINKS
-- =====================================================

-- Trade: trading_discipline
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'trading_discipline'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_pre_market', 'trade_market_open_check', 'trade_post_market', 'trade_journal_entry');

-- Trade: risk_management
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'risk_management'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_position_sizing', 'trade_stop_loss_check', 'trade_risk_review');

-- Trade: profit_target
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'profit_target'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_strategy_execution', 'trade_profit_taking');

-- Trade: win_rate
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'win_rate'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_strategy_execution', 'trade_pattern_recognition');

-- Trade: journal_habit
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'journal_habit'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_pre_market', 'trade_journal_entry', 'trade_post_market', 'trade_emotional_log');

-- Trade: market_study
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'market_study'), progress_contribution = 1
WHERE category_slug = 'trade' AND slug IN ('trade_chart_analysis', 'trade_news_check', 'trade_sector_review');

-- =====================================================
-- ETSY CATEGORY LINKS
-- =====================================================

-- Etsy: monthly_revenue
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'monthly_revenue'), progress_contribution = 10
WHERE category_slug = 'etsy' AND slug IN ('etsy_new_listing', 'etsy_seo_optimize', 'etsy_social_post');

-- Etsy: new_listings
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'new_listings'), progress_contribution = 1
WHERE category_slug = 'etsy' AND slug IN ('etsy_new_listing', 'etsy_product_photo', 'etsy_listing_description');

-- Etsy: conversion_rate
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'conversion_rate'), progress_contribution = 0.02
WHERE category_slug = 'etsy' AND slug IN ('etsy_seo_optimize', 'etsy_photo_update', 'etsy_price_review');

-- Etsy: customer_response
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'customer_response'), progress_contribution = 1
WHERE category_slug = 'etsy' AND slug IN ('etsy_message_check', 'etsy_review_response');

-- Etsy: social_marketing
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'social_marketing'), progress_contribution = 1
WHERE category_slug = 'etsy' AND slug IN ('etsy_social_post', 'etsy_pinterest_pin', 'etsy_instagram_story');

-- Etsy: review_rating
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'review_rating'), progress_contribution = 0.05
WHERE category_slug = 'etsy' AND slug IN ('etsy_quality_check', 'etsy_packaging_care', 'etsy_thank_you_note');

-- =====================================================
-- GAMING CATEGORY LINKS
-- =====================================================

-- Gaming: rank_up
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'rank_up'), progress_contribution = 0.1
WHERE category_slug = 'gaming' AND slug IN ('gaming_ranked_match', 'gaming_aim_practice', 'gaming_vod_review');

-- Gaming: stream_consistency
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'stream_consistency'), progress_contribution = 1
WHERE category_slug = 'gaming' AND slug IN ('gaming_stream_prep', 'gaming_go_live', 'gaming_community_engage', 'gaming_post_stream');

-- Gaming: game_completion
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'game_completion'), progress_contribution = 0.05
WHERE category_slug = 'gaming' AND slug IN ('gaming_story_progress', 'gaming_side_quest', 'gaming_achievement_hunt');

-- Gaming: skill_improvement
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'skill_improvement'), progress_contribution = 1
WHERE category_slug = 'gaming' AND slug IN ('gaming_practice_session', 'gaming_aim_practice', 'gaming_mechanics_drill');

-- Gaming: content_creation
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'content_creation'), progress_contribution = 1
WHERE category_slug = 'gaming' AND slug IN ('gaming_record_session', 'gaming_video_edit', 'gaming_thumbnail_create');

-- Gaming: community_growth
UPDATE quest_templates SET goal_template_id = (SELECT id FROM goal_templates WHERE slug = 'community_growth'), progress_contribution = 1
WHERE category_slug = 'gaming' AND slug IN ('gaming_community_engage', 'gaming_discord_active', 'gaming_collab_reach');

-- =====================================================
-- End of Migration
-- =====================================================
