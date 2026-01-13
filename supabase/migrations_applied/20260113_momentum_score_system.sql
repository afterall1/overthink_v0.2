-- =====================================================
-- Migration: Momentum Score System
-- Date: 2026-01-13
-- Description: Adds momentum-based progress tracking for indirect habit contribution
-- =====================================================

-- Phase 1: Add momentum columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS momentum_score NUMERIC DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS habit_maturity_days INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS last_quest_completed_at TIMESTAMPTZ;

-- Comments for documentation
COMMENT ON COLUMN goals.momentum_score IS 'Calculated momentum score (0-100) based on consistency, streaks, and habit maturity';
COMMENT ON COLUMN goals.current_streak IS 'Current consecutive days of quest completion for this goal';
COMMENT ON COLUMN goals.best_streak IS 'Highest streak ever achieved for this goal';
COMMENT ON COLUMN goals.habit_maturity_days IS 'Total days with at least one quest completed for this goal';
COMMENT ON COLUMN goals.last_quest_completed_at IS 'Timestamp of last quest completion for streak calculation';

-- Phase 2: Add contribution_type to quest_templates
ALTER TABLE quest_templates ADD COLUMN IF NOT EXISTS contribution_type TEXT DEFAULT 'direct';

COMMENT ON COLUMN quest_templates.contribution_type IS 'Type of contribution: direct (measurable) or momentum (consistency-based)';

-- Phase 3: Add contribution_type to daily_quests (inherited from template)
ALTER TABLE daily_quests ADD COLUMN IF NOT EXISTS contribution_type TEXT DEFAULT 'direct';

COMMENT ON COLUMN daily_quests.contribution_type IS 'Type of contribution: direct (measurable) or momentum (consistency-based)';

-- =====================================================
-- Update quest templates with contribution types
-- =====================================================

-- FOOD category - momentum-based habits (supporting behaviors)
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'food' 
AND slug IN (
    'healthy_breakfast',
    'drink_water_2l',
    'eat_vegetables',
    'avoid_late_snacks',
    'meal_prep',
    'mindful_eating',
    'no_sugar_day',
    'protein_with_meal',
    'healthy_snack',
    'food_journal'
);

-- SPORT category - split between direct and momentum
UPDATE quest_templates 
SET contribution_type = 'direct'
WHERE category_slug = 'sport'
AND slug IN (
    'hiit_workout',
    'cardio_session',
    'strength_training',
    'running',
    'cycling',
    'swimming'
);

UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'sport'
AND slug IN (
    'morning_stretch',
    'walk_10k_steps',
    'yoga_session',
    'desk_stretches',
    'posture_check',
    'active_break',
    'stair_climbing',
    'evening_walk'
);

-- DEV category - mostly momentum (learning/productivity habits)
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'dev'
AND slug IN (
    'code_review',
    'learn_new_tech',
    'read_documentation',
    'write_tests',
    'refactor_code',
    'pair_programming',
    'deep_work_session',
    'no_meeting_block',
    'inbox_zero',
    'daily_standup'
);

-- TRADE category - mixed
UPDATE quest_templates 
SET contribution_type = 'direct'
WHERE category_slug = 'trade'
AND slug IN (
    'execute_trade',
    'close_position',
    'take_profit'
);

UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'trade'
AND slug IN (
    'market_research',
    'journal_trade',
    'review_strategy',
    'risk_assessment',
    'watchlist_update',
    'news_check',
    'backtesting'
);

-- ETSY category - mixed
UPDATE quest_templates 
SET contribution_type = 'direct'
WHERE category_slug = 'etsy'
AND slug IN (
    'create_listing',
    'ship_order',
    'complete_sale'
);

UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'etsy'
AND slug IN (
    'product_photo',
    'seo_optimization',
    'social_post',
    'customer_reply',
    'inventory_check',
    'trend_research'
);

-- GAMING category - mostly momentum (skill building)
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE category_slug = 'gaming'
AND slug IN (
    'practice_session',
    'watch_tutorial',
    'review_replay',
    'aim_training',
    'strategy_study',
    'community_engage'
);

-- =====================================================
-- Goal-specific quest updates (from 20260112_goal_specific_quests.sql)
-- =====================================================

-- Fat Loss goal quests - supporting habits as momentum
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE goal_template_id IS NOT NULL
AND slug IN (
    'morning_stretch_fat_loss',
    'drink_water_fat_loss',
    'healthy_breakfast_fat_loss',
    'avoid_sugar_fat_loss',
    'sleep_8_hours_fat_loss',
    'mindful_eating_fat_loss',
    'meal_prep_fat_loss',
    'no_late_snacks_fat_loss'
);

-- Weight loss goal quests
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE goal_template_id IS NOT NULL
AND title ILIKE '%kahvaltı%'
   OR title ILIKE '%su iç%'
   OR title ILIKE '%uyku%'
   OR title ILIKE '%şeker%'
   OR title ILIKE '%yemek günlüğü%';

-- Muscle gain goal - protein is direct, rest is momentum
UPDATE quest_templates 
SET contribution_type = 'momentum'
WHERE goal_template_id IS NOT NULL
AND slug IN (
    'stretch_muscle_gain',
    'sleep_muscle_gain',
    'log_workout_muscle_gain',
    'hydration_muscle_gain'
);

-- =====================================================
-- Create function to calculate momentum score
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_momentum_score(
    p_daily_completion_rate NUMERIC,
    p_streak_count INTEGER,
    p_habit_maturity_days INTEGER,
    p_is_early_bird BOOLEAN DEFAULT false
) RETURNS INTEGER AS $$
DECLARE
    v_streak_multiplier NUMERIC;
    v_maturity_score NUMERIC;
    v_momentum INTEGER;
BEGIN
    -- Calculate streak multiplier
    v_streak_multiplier := CASE
        WHEN p_streak_count >= 21 THEN 2.0
        WHEN p_streak_count >= 14 THEN 1.6
        WHEN p_streak_count >= 7 THEN 1.4
        WHEN p_streak_count >= 3 THEN 1.2
        ELSE 1.0
    END;
    
    -- Calculate maturity score (0-100)
    v_maturity_score := CASE
        WHEN p_habit_maturity_days >= 21 THEN 100
        WHEN p_habit_maturity_days >= 14 THEN 75
        WHEN p_habit_maturity_days >= 7 THEN 50
        ELSE 25
    END;
    
    -- Calculate total momentum
    v_momentum := LEAST(100, ROUND(
        (p_daily_completion_rate * 40) +
        (v_streak_multiplier * 30) +
        (v_maturity_score / 100 * 20) +
        (CASE WHEN p_is_early_bird THEN 10 ELSE 0 END)
    ));
    
    RETURN v_momentum;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Create view for momentum status labels
-- =====================================================

CREATE OR REPLACE VIEW goal_momentum_status AS
SELECT 
    g.id,
    g.title,
    g.momentum_score,
    g.current_streak,
    g.best_streak,
    g.habit_maturity_days,
    CASE
        WHEN g.habit_maturity_days >= 21 THEN 'mature'
        WHEN g.habit_maturity_days >= 14 THEN 'growing'
        WHEN g.habit_maturity_days >= 7 THEN 'sprouting'
        ELSE 'seed'
    END AS maturity_stage,
    CASE
        WHEN g.habit_maturity_days >= 21 THEN '🌲'
        WHEN g.habit_maturity_days >= 14 THEN '🌳'
        WHEN g.habit_maturity_days >= 7 THEN '🌿'
        ELSE '🌱'
    END AS maturity_emoji,
    CASE
        WHEN g.current_streak >= 21 THEN 2.0
        WHEN g.current_streak >= 14 THEN 1.6
        WHEN g.current_streak >= 7 THEN 1.4
        WHEN g.current_streak >= 3 THEN 1.2
        ELSE 1.0
    END AS streak_multiplier
FROM goals g;

-- Grant access
GRANT SELECT ON goal_momentum_status TO authenticated;
