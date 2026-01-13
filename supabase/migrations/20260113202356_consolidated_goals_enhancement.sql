-- =====================================================
-- Consolidated Migration: Goals Enhancement & Momentum System
-- Date: 2026-01-13
-- Description: Adds goal tracking columns and momentum system
-- =====================================================

-- =====================================================
-- Phase 1: Goals Enhancement Columns
-- =====================================================

-- Add psychological and tracking fields to goals table
ALTER TABLE public.goals 
ADD COLUMN IF NOT EXISTS motivation TEXT,
ADD COLUMN IF NOT EXISTS identity_statement TEXT,
ADD COLUMN IF NOT EXISTS best_time_of_day TEXT CHECK (best_time_of_day IN ('morning', 'afternoon', 'evening', 'anytime')) DEFAULT 'anytime',
ADD COLUMN IF NOT EXISTS difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'medium', 'hard', 'extreme')) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Indexes for streak queries
CREATE INDEX IF NOT EXISTS goals_streak_count_idx ON public.goals(streak_count DESC);
CREATE INDEX IF NOT EXISTS goals_last_activity_date_idx ON public.goals(last_activity_date);

-- =====================================================
-- Phase 2: Momentum Score System Columns
-- =====================================================

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

-- =====================================================
-- Phase 3: Quest Templates contribution_type
-- =====================================================

ALTER TABLE quest_templates ADD COLUMN IF NOT EXISTS contribution_type TEXT DEFAULT 'direct';
COMMENT ON COLUMN quest_templates.contribution_type IS 'Type of contribution: direct (measurable) or momentum (consistency-based)';

ALTER TABLE daily_quests ADD COLUMN IF NOT EXISTS contribution_type TEXT DEFAULT 'direct';
COMMENT ON COLUMN daily_quests.contribution_type IS 'Type of contribution: direct (measurable) or momentum (consistency-based)';

-- =====================================================
-- Phase 4: Momentum calculation function
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
-- Phase 5: Momentum status view
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

-- Notify schema cache
NOTIFY pgrst, 'reload schema';

-- =====================================================
-- End of Migration
-- =====================================================
