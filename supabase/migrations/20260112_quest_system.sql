-- =====================================================
-- LifeNexus Quest System Migration
-- Created: 2026-01-12
-- Description: Adds tables for Daily Quests, Key Results, 
--              Rituals (Habit Stacking), and Quest Completions
-- =====================================================

-- =====================================================
-- 1. GOAL KEY RESULTS TABLE (OKR-style measurable outcomes)
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_key_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Key Result info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Metric configuration
    metric_type TEXT NOT NULL DEFAULT 'numeric' CHECK (metric_type IN ('numeric', 'boolean', 'percentage')),
    metric_name TEXT,           -- e.g., 'calories', 'steps', 'sessions'
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT,
    
    -- Frequency
    frequency TEXT NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    
    -- Status
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. DAILY QUESTS TABLE (Goal-linked daily tasks)
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
    key_result_id UUID REFERENCES goal_key_results(id) ON DELETE SET NULL,
    
    -- Quest info
    title TEXT NOT NULL,
    description TEXT,
    emoji TEXT DEFAULT '⚡',
    
    -- XP and rewards
    xp_reward INTEGER NOT NULL DEFAULT 10 CHECK (xp_reward >= 0 AND xp_reward <= 100),
    bonus_xp INTEGER DEFAULT 0,
    
    -- Scheduling
    scheduled_time TIME,            -- Specific time of day (optional)
    scheduled_date DATE,            -- Specific date (NULL for recurring)
    due_time TIME,                  -- Deadline time for the day
    
    -- Recurrence pattern
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern TEXT CHECK (recurrence_pattern IN (
        'daily', 
        'weekdays',    -- Mon-Fri
        'weekends',    -- Sat-Sun
        'mwf',         -- Mon, Wed, Fri
        'tts',         -- Tue, Thu, Sat
        'custom'
    )),
    recurrence_days INTEGER[],      -- For custom: [0,1,2,3,4,5,6] where 0=Sunday
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'expired')),
    completed_at TIMESTAMPTZ,
    
    -- AI suggestion metadata
    is_ai_suggested BOOLEAN DEFAULT FALSE,
    ai_confidence NUMERIC CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
    ai_reasoning TEXT,
    
    -- Difficulty
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    
    -- Sorting
    sort_order INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. QUEST COMPLETIONS TABLE (Completion history)
-- =====================================================
CREATE TABLE IF NOT EXISTS quest_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    
    -- Completion info
    completed_date DATE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- XP earned
    xp_earned INTEGER NOT NULL DEFAULT 0,
    base_xp INTEGER NOT NULL DEFAULT 0,
    streak_bonus_xp INTEGER DEFAULT 0,
    time_bonus_xp INTEGER DEFAULT 0,
    
    -- Streak tracking
    streak_count INTEGER DEFAULT 1,
    
    -- Notes
    notes TEXT,
    mood_rating INTEGER CHECK (mood_rating IS NULL OR (mood_rating >= 1 AND mood_rating <= 5)),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one completion per quest per day
    UNIQUE(quest_id, completed_date)
);

-- =====================================================
-- 4. RITUALS TABLE (Habit Stacking)
-- =====================================================
CREATE TABLE IF NOT EXISTS rituals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    
    -- Habit Stacking formula: "After [trigger], I will [action]"
    trigger_habit TEXT NOT NULL,    -- "Kahve içtikten sonra"
    action TEXT NOT NULL,           -- "10 merdiven çık"
    
    -- Optional linked quest template
    linked_quest_id UUID REFERENCES daily_quests(id) ON DELETE SET NULL,
    
    -- Visual
    emoji TEXT DEFAULT '🔁',
    
    -- Streak tracking
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_completed_date DATE,
    
    -- XP configuration
    base_xp INTEGER DEFAULT 5 CHECK (base_xp >= 0 AND base_xp <= 50),
    streak_multiplier NUMERIC DEFAULT 1.0 CHECK (streak_multiplier >= 1.0 AND streak_multiplier <= 5.0),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Stats
    total_completions INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. RITUAL COMPLETIONS TABLE (Ritual completion history)
-- =====================================================
CREATE TABLE IF NOT EXISTS ritual_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ritual_id UUID NOT NULL REFERENCES rituals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Completion info
    completed_date DATE NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- XP earned
    xp_earned INTEGER NOT NULL DEFAULT 0,
    streak_at_completion INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: one completion per ritual per day
    UNIQUE(ritual_id, completed_date)
);

-- =====================================================
-- 6. USER XP STATS TABLE (Aggregate XP tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_xp_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    -- Total XP
    total_xp INTEGER DEFAULT 0,
    
    -- Level (calculated from XP)
    current_level INTEGER DEFAULT 1,
    xp_to_next_level INTEGER DEFAULT 60,
    
    -- Daily/Weekly stats
    xp_today INTEGER DEFAULT 0,
    xp_this_week INTEGER DEFAULT 0,
    xp_this_month INTEGER DEFAULT 0,
    
    -- Streak stats
    longest_quest_streak INTEGER DEFAULT 0,
    current_daily_streak INTEGER DEFAULT 0,  -- Perfect days in a row
    
    -- Achievement counts
    perfect_days_count INTEGER DEFAULT 0,
    perfect_weeks_count INTEGER DEFAULT 0,
    quests_completed_count INTEGER DEFAULT 0,
    rituals_completed_count INTEGER DEFAULT 0,
    
    -- Last activity
    last_xp_earned_at TIMESTAMPTZ,
    last_perfect_day DATE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Key Results indexes
CREATE INDEX IF NOT EXISTS idx_key_results_goal ON goal_key_results(goal_id);
CREATE INDEX IF NOT EXISTS idx_key_results_user ON goal_key_results(user_id);

-- Daily Quests indexes
CREATE INDEX IF NOT EXISTS idx_quests_user_date ON daily_quests(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_quests_goal ON daily_quests(goal_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON daily_quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_recurring ON daily_quests(is_recurring) WHERE is_recurring = true;

-- Quest Completions indexes
CREATE INDEX IF NOT EXISTS idx_quest_completions_user_date ON quest_completions(user_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest ON quest_completions(quest_id);

-- Rituals indexes
CREATE INDEX IF NOT EXISTS idx_rituals_user ON rituals(user_id);
CREATE INDEX IF NOT EXISTS idx_rituals_active ON rituals(user_id) WHERE is_active = true;

-- Ritual Completions indexes
CREATE INDEX IF NOT EXISTS idx_ritual_completions_user_date ON ritual_completions(user_id, completed_date);

-- User XP Stats indexes
CREATE INDEX IF NOT EXISTS idx_user_xp_total ON user_xp_stats(total_xp DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE goal_key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ritual_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp_stats ENABLE ROW LEVEL SECURITY;

-- goal_key_results policies
CREATE POLICY "Users can view own key_results" ON goal_key_results
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own key_results" ON goal_key_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own key_results" ON goal_key_results
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own key_results" ON goal_key_results
    FOR DELETE USING (auth.uid() = user_id);

-- daily_quests policies
CREATE POLICY "Users can view own quests" ON daily_quests
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quests" ON daily_quests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quests" ON daily_quests
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quests" ON daily_quests
    FOR DELETE USING (auth.uid() = user_id);

-- quest_completions policies
CREATE POLICY "Users can view own quest_completions" ON quest_completions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quest_completions" ON quest_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quest_completions" ON quest_completions
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own quest_completions" ON quest_completions
    FOR DELETE USING (auth.uid() = user_id);

-- rituals policies
CREATE POLICY "Users can view own rituals" ON rituals
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rituals" ON rituals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rituals" ON rituals
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rituals" ON rituals
    FOR DELETE USING (auth.uid() = user_id);

-- ritual_completions policies
CREATE POLICY "Users can view own ritual_completions" ON ritual_completions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ritual_completions" ON ritual_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own ritual_completions" ON ritual_completions
    FOR DELETE USING (auth.uid() = user_id);

-- user_xp_stats policies
CREATE POLICY "Users can view own xp_stats" ON user_xp_stats
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp_stats" ON user_xp_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own xp_stats" ON user_xp_stats
    FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Auto-update updated_at timestamp
-- =====================================================

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_goal_key_results_updated_at
    BEFORE UPDATE ON goal_key_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_quests_updated_at
    BEFORE UPDATE ON daily_quests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rituals_updated_at
    BEFORE UPDATE ON rituals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_xp_stats_updated_at
    BEFORE UPDATE ON user_xp_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Initialize user XP stats on first quest
-- =====================================================

CREATE OR REPLACE FUNCTION initialize_user_xp_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_xp_stats (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_xp_stats_on_quest_completion
    AFTER INSERT ON quest_completions
    FOR EACH ROW EXECUTE FUNCTION initialize_user_xp_stats();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
