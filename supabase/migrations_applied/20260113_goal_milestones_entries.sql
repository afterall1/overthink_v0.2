-- =====================================================
-- Goal Milestones & Entries Migration
-- Migration: 20260113_goal_milestones_entries.sql
-- Description: Tables for goal progress tracking and milestone management
-- =====================================================

-- =====================================================
-- 1. Goal Entries Table
-- Tracks individual progress log entries for goals
-- =====================================================

CREATE TABLE IF NOT EXISTS goal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress data
    value NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    
    -- Timestamp
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for goal_entries
CREATE INDEX IF NOT EXISTS idx_goal_entries_goal ON goal_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_user ON goal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_logged ON goal_entries(goal_id, logged_at DESC);

-- =====================================================
-- 2. Goal Milestones Table
-- Tracks milestone checkpoints for goals
-- =====================================================

CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    
    -- Milestone data
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    
    -- Status
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for goal_milestones
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_order ON goal_milestones(goal_id, sort_order);

-- =====================================================
-- 3. RLS Policies for goal_entries
-- =====================================================

ALTER TABLE goal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own goal entries" ON goal_entries;
CREATE POLICY "Users can view own goal entries"
    ON goal_entries FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goal entries" ON goal_entries;
CREATE POLICY "Users can insert own goal entries"
    ON goal_entries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goal entries" ON goal_entries;
CREATE POLICY "Users can update own goal entries"
    ON goal_entries FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goal entries" ON goal_entries;
CREATE POLICY "Users can delete own goal entries"
    ON goal_entries FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. RLS Policies for goal_milestones
-- =====================================================

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

-- First need to check goal ownership via goals table
DROP POLICY IF EXISTS "Users can view own goal milestones" ON goal_milestones;
CREATE POLICY "Users can view own goal milestones"
    ON goal_milestones FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM goals
            WHERE goals.id = goal_milestones.goal_id
            AND goals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert own goal milestones" ON goal_milestones;
CREATE POLICY "Users can insert own goal milestones"
    ON goal_milestones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM goals
            WHERE goals.id = goal_milestones.goal_id
            AND goals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update own goal milestones" ON goal_milestones;
CREATE POLICY "Users can update own goal milestones"
    ON goal_milestones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM goals
            WHERE goals.id = goal_milestones.goal_id
            AND goals.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete own goal milestones" ON goal_milestones;
CREATE POLICY "Users can delete own goal milestones"
    ON goal_milestones FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM goals
            WHERE goals.id = goal_milestones.goal_id
            AND goals.user_id = auth.uid()
        )
    );

-- =====================================================
-- 5. Updated_at trigger for goal_milestones
-- =====================================================

CREATE OR REPLACE FUNCTION update_goal_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_goal_milestones_updated_at ON goal_milestones;
CREATE TRIGGER trigger_goal_milestones_updated_at
    BEFORE UPDATE ON goal_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_milestones_updated_at();

-- =====================================================
-- End of Migration
-- =====================================================
