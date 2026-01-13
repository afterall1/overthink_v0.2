-- =====================================================
-- Scientific Progress Contribution System Migration
-- Migration: 20260112_scientific_progress_system.sql
-- Description: Add MET-based calorie calculation columns
--              and update quest templates with scientific values
-- =====================================================

-- Phase 1: Add new columns to quest_templates
ALTER TABLE quest_templates
ADD COLUMN IF NOT EXISTS contribution_unit TEXT DEFAULT 'kcal',
ADD COLUMN IF NOT EXISTS contribution_met_value NUMERIC,
ADD COLUMN IF NOT EXISTS contribution_display TEXT;

COMMENT ON COLUMN quest_templates.contribution_unit IS 'Unit of contribution: kcal, step, gram, minute, percent';
COMMENT ON COLUMN quest_templates.contribution_met_value IS 'MET value for calorie calculation (MET x 3.5 x kg / 200 = kcal/min)';
COMMENT ON COLUMN quest_templates.contribution_display IS 'Human-readable contribution display for UI';

-- =====================================================
-- SPORT CATEGORY: lose_fat Goal - Scientific Values
-- Base: 70kg user, 5% fat loss = 3.5kg = 26,950 kcal needed
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 10.0,
    contribution_display = '+306 kcal (~1.1% yağ)',
    progress_contribution = 306
WHERE slug = 'lf_hiit';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 8.0,
    contribution_display = '+392 kcal (~1.5% yağ)',
    progress_contribution = 392
WHERE slug = 'lf_steady_cardio';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 4.0,
    contribution_display = '+147 kcal (~0.5% yağ)',
    progress_contribution = 147
WHERE slug = 'lf_morning_fasted';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 6.0,
    contribution_display = '+367 kcal (~1.4% yağ)',
    progress_contribution = 367
WHERE slug = 'lf_strength_combo';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 2.5,
    contribution_display = '+300 kcal (~1.1% yağ)',
    progress_contribution = 300
WHERE slug = 'lf_neat_boost';

-- =====================================================
-- SPORT CATEGORY: daily_steps Goal
-- Base: 10,000 steps target, 0.04 kcal/step
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 3.5,
    contribution_display = '+1000 adım (10%)',
    progress_contribution = 1000
WHERE slug = 'ds_morning_walk';

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 2.5,
    contribution_display = '+500 adım (5%)',
    progress_contribution = 500
WHERE slug = 'ds_stairs';

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 3.5,
    contribution_display = '+1500 adım (15%)',
    progress_contribution = 1500
WHERE slug = 'ds_lunch_walk';

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 5.0,
    contribution_display = '+3000 adım (30%)',
    progress_contribution = 3000
WHERE slug = 'ds_brisk_walk';

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 3.5,
    contribution_display = '+2000 adım (20%)',
    progress_contribution = 2000
WHERE slug = 'ds_evening_walk';

UPDATE quest_templates SET
    contribution_unit = 'step',
    contribution_met_value = 4.0,
    contribution_display = '+2000 adım (20%)',
    progress_contribution = 2000
WHERE slug = 'ds_active_day';

-- =====================================================
-- SPORT CATEGORY: build_strength Goal
-- Base: 20% 1RM increase target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = 6.0,
    contribution_display = '+1% 1RM artışı',
    progress_contribution = 1
WHERE slug = 'bs_compound_lift';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = 6.0,
    contribution_display = '+1.5% 1RM artışı',
    progress_contribution = 1.5
WHERE slug = 'bs_progressive_weight';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = 3.0,
    contribution_display = '+0.3% hazırlık katkısı',
    progress_contribution = 0.3
WHERE slug = 'bs_warmup_sets';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = 1.0,
    contribution_display = '+0.5% recovery katkısı',
    progress_contribution = 0.5
WHERE slug = 'bs_rest_recovery';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = 1.0,
    contribution_display = '+0.3% takip katkısı',
    progress_contribution = 0.3
WHERE slug = 'bs_log_workout';

-- =====================================================
-- SPORT CATEGORY: run_5k Goal
-- Base: 30 dakika altında 5K hedefi
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 4.0,
    contribution_display = '+0.5 dk iyileşme',
    progress_contribution = 0.5
WHERE slug = 'r5k_warmup';

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 8.0,
    contribution_display = '+1 dk iyileşme',
    progress_contribution = 1
WHERE slug = 'r5k_easy_run';

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 10.0,
    contribution_display = '+1.5 dk iyileşme',
    progress_contribution = 1.5
WHERE slug = 'r5k_intervals';

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 9.0,
    contribution_display = '+1.5 dk iyileşme',
    progress_contribution = 1.5
WHERE slug = 'r5k_tempo_run';

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 2.5,
    contribution_display = '+0.5 dk recovery',
    progress_contribution = 0.5
WHERE slug = 'r5k_stretching';

UPDATE quest_templates SET
    contribution_unit = 'minute',
    contribution_met_value = 10.0,
    contribution_display = '+3 dk iyileşme (test)',
    progress_contribution = 3
WHERE slug = 'r5k_time_trial';

-- =====================================================
-- FOOD CATEGORY: lose_weight Goal
-- Base: 10kg weight loss = 77,000 kcal deficit needed
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+20 kcal metabolizma',
    progress_contribution = 20
WHERE slug = 'lw_morning_water';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+100 kcal takip',
    progress_contribution = 100
WHERE slug = 'lw_calorie_tracking';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 7.0,
    contribution_display = '+257 kcal yakım',
    progress_contribution = 257
WHERE slug = 'lw_cardio_30min';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+200 kcal tasarruf',
    progress_contribution = 200
WHERE slug = 'lw_avoid_processed';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+50 kcal TEF boost',
    progress_contribution = 50
WHERE slug = 'lw_protein_meals';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+150 kcal tasarruf',
    progress_contribution = 150
WHERE slug = 'lw_no_sugar_drinks';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+500 kcal açık',
    progress_contribution = 500
WHERE slug = 'lw_calorie_deficit';

-- =====================================================
-- FOOD CATEGORY: gain_muscle Goal
-- Base: 5kg muscle gain = ~12,500 kcal surplus + training
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+30g protein',
    progress_contribution = 30
WHERE slug = 'gm_protein_breakfast';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+30g protein',
    progress_contribution = 30
WHERE slug = 'gm_post_workout_protein';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = 6.0,
    contribution_display = '+275 kcal (kas uyarımı)',
    progress_contribution = 275
WHERE slug = 'gm_strength_training';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+120g protein hedef',
    progress_contribution = 120
WHERE slug = 'gm_daily_protein_goal';

UPDATE quest_templates SET
    contribution_unit = 'kcal',
    contribution_met_value = NULL,
    contribution_display = '+400 kcal fazla',
    progress_contribution = 400
WHERE slug = 'gm_calorie_surplus';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+10% recovery',
    progress_contribution = 10
WHERE slug = 'gm_sleep_recovery';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+8% adaptasyon',
    progress_contribution = 8
WHERE slug = 'gm_progressive_overload';

-- =====================================================
-- FOOD CATEGORY: protein_goal Goal
-- Base: 120g daily protein target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+30g protein',
    progress_contribution = 30
WHERE slug = 'pg_protein_breakfast';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+30g protein',
    progress_contribution = 30
WHERE slug = 'pg_protein_lunch';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+30g protein',
    progress_contribution = 30
WHERE slug = 'pg_protein_dinner';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+15g protein',
    progress_contribution = 15
WHERE slug = 'pg_protein_snack';

UPDATE quest_templates SET
    contribution_unit = 'gram',
    contribution_met_value = NULL,
    contribution_display = '+15g (takip bonus)',
    progress_contribution = 15
WHERE slug = 'pg_track_protein';

-- =====================================================
-- FOOD CATEGORY: drink_water Goal
-- Base: 8 glasses (2L) daily target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'glass',
    contribution_met_value = NULL,
    contribution_display = '+2 bardak',
    progress_contribution = 2
WHERE slug = 'dw_morning_glass';

UPDATE quest_templates SET
    contribution_unit = 'glass',
    contribution_met_value = NULL,
    contribution_display = '+3 bardak',
    progress_contribution = 3
WHERE slug = 'dw_before_meals';

UPDATE quest_templates SET
    contribution_unit = 'glass',
    contribution_met_value = NULL,
    contribution_display = '+2 bardak/saat',
    progress_contribution = 2
WHERE slug = 'dw_hourly_reminder';

UPDATE quest_templates SET
    contribution_unit = 'glass',
    contribution_met_value = NULL,
    contribution_display = '+1 bardak (takip)',
    progress_contribution = 1
WHERE slug = 'dw_track_intake';

-- =====================================================
-- DEV CATEGORY: daily_commits Goal
-- Base: 1 commit/day target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'commit',
    contribution_met_value = NULL,
    contribution_display = '+0.1 hazırlık',
    progress_contribution = 0.1
WHERE slug = 'dc_ide_setup';

UPDATE quest_templates SET
    contribution_unit = 'commit',
    contribution_met_value = NULL,
    contribution_display = '+1 commit',
    progress_contribution = 1
WHERE slug = 'dc_atomic_commit';

UPDATE quest_templates SET
    contribution_unit = 'commit',
    contribution_met_value = NULL,
    contribution_display = '+0.2 kalite',
    progress_contribution = 0.2
WHERE slug = 'dc_meaningful_message';

UPDATE quest_templates SET
    contribution_unit = 'commit',
    contribution_met_value = NULL,
    contribution_display = '+0.3 sync',
    progress_contribution = 0.3
WHERE slug = 'dc_push_changes';

UPDATE quest_templates SET
    contribution_unit = 'commit',
    contribution_met_value = NULL,
    contribution_display = '+0.4 verified',
    progress_contribution = 0.4
WHERE slug = 'dc_green_pipeline';

-- =====================================================
-- DEV CATEGORY: build_project Goal
-- Base: 10 milestones target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.05 planlama',
    progress_contribution = 0.05
WHERE slug = 'bp_daily_priorities';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.2 ilerleme',
    progress_contribution = 0.2
WHERE slug = 'bp_deep_work';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.3 feature',
    progress_contribution = 0.3
WHERE slug = 'bp_feature_complete';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.1 kalite',
    progress_contribution = 0.1
WHERE slug = 'bp_code_review';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.1 güvenilirlik',
    progress_contribution = 0.1
WHERE slug = 'bp_test_coverage';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.08 dokümantasyon',
    progress_contribution = 0.08
WHERE slug = 'bp_documentation';

UPDATE quest_templates SET
    contribution_unit = 'milestone',
    contribution_met_value = NULL,
    contribution_display = '+0.5 milestone!',
    progress_contribution = 0.5
WHERE slug = 'bp_milestone_done';

-- =====================================================
-- TRADE CATEGORY: trading_discipline Goal
-- Base: 30 disciplined days target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+1 hazırlık puanı',
    progress_contribution = 1
WHERE slug = 'td_premarket_scan';

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+0.5 odak puanı',
    progress_contribution = 0.5
WHERE slug = 'td_watchlist';

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+1 strateji puanı',
    progress_contribution = 1
WHERE slug = 'td_trading_plan';

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+1.5 disiplin puanı',
    progress_contribution = 1.5
WHERE slug = 'td_stick_to_plan';

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+0.5 farkındalık',
    progress_contribution = 0.5
WHERE slug = 'td_emotion_log';

UPDATE quest_templates SET
    contribution_unit = 'day',
    contribution_met_value = NULL,
    contribution_display = '+1 analiz puanı',
    progress_contribution = 1
WHERE slug = 'td_journal_entry';

-- =====================================================
-- GAMING CATEGORY: rank_up Goal
-- Base: 1 rank increase target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+2% hazırlık',
    progress_contribution = 2
WHERE slug = 'ru_hand_stretch';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+5% aim',
    progress_contribution = 5
WHERE slug = 'ru_aim_trainer';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+3% ısınma',
    progress_contribution = 3
WHERE slug = 'ru_warmup_match';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+10% rank XP',
    progress_contribution = 10
WHERE slug = 'ru_ranked_session';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+8% gelişim',
    progress_contribution = 8
WHERE slug = 'ru_vod_review';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+15% rank!',
    progress_contribution = 15
WHERE slug = 'ru_win_match';

UPDATE quest_templates SET
    contribution_unit = 'percent',
    contribution_met_value = NULL,
    contribution_display = '+5% mental',
    progress_contribution = 5
WHERE slug = 'ru_tilt_break';

-- =====================================================
-- ETSY CATEGORY: monthly_revenue Goal
-- Base: $500 monthly revenue target
-- =====================================================

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$5 potansiyel',
    progress_contribution = 5
WHERE slug = 'mr_stats_check';

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$5 müşteri ilişkisi',
    progress_contribution = 5
WHERE slug = 'mr_reply_messages';

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$10 görünürlük',
    progress_contribution = 10
WHERE slug = 'mr_seo_optimize';

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$10 trafik',
    progress_contribution = 10
WHERE slug = 'mr_social_post';

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$15 kargo tamamlandı',
    progress_contribution = 15
WHERE slug = 'mr_ship_orders';

UPDATE quest_templates SET
    contribution_unit = 'dollar',
    contribution_met_value = NULL,
    contribution_display = '+$25 yeni ürün!',
    progress_contribution = 25
WHERE slug = 'mr_new_listing';

-- =====================================================
-- End of Migration
-- =====================================================
