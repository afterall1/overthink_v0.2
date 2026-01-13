-- =====================================================
-- Goal Synergy System Migration
-- Migration: 20260113_goal_synergy_system.sql
-- Description: Multi-goal quest attribution system
-- =====================================================

-- =====================================================
-- 1. Quest-Goal Contributions Junction Table
-- Allows one quest to contribute to MULTIPLE goals
-- =====================================================

CREATE TABLE IF NOT EXISTS quest_goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contribution settings
    contribution_weight NUMERIC DEFAULT 1.0 CHECK (contribution_weight >= 0 AND contribution_weight <= 2.0),
    contribution_type TEXT DEFAULT 'direct' CHECK (contribution_type IN ('direct', 'momentum', 'synergy')),
    
    -- Source tracking
    synergy_type TEXT CHECK (synergy_type IN ('SYNERGISTIC', 'COMPLEMENTARY', 'PARALLEL')),
    is_primary BOOLEAN DEFAULT FALSE,  -- Is this the quest's primary goal?
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique quest-goal pairs
    CONSTRAINT unique_quest_goal UNIQUE (quest_id, goal_id)
);

-- =====================================================
-- 2. Performance Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quest_goal_contributions_quest ON quest_goal_contributions(quest_id);
CREATE INDEX IF NOT EXISTS idx_quest_goal_contributions_goal ON quest_goal_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_quest_goal_contributions_user ON quest_goal_contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_goal_contributions_primary ON quest_goal_contributions(quest_id) WHERE is_primary = TRUE;

-- =====================================================
-- 3. RLS Policies
-- =====================================================

ALTER TABLE quest_goal_contributions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own contributions
DROP POLICY IF EXISTS "Users can view own quest_goal_contributions" ON quest_goal_contributions;
CREATE POLICY "Users can view own quest_goal_contributions"
    ON quest_goal_contributions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own contributions
DROP POLICY IF EXISTS "Users can insert own quest_goal_contributions" ON quest_goal_contributions;
CREATE POLICY "Users can insert own quest_goal_contributions"
    ON quest_goal_contributions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own contributions
DROP POLICY IF EXISTS "Users can update own quest_goal_contributions" ON quest_goal_contributions;
CREATE POLICY "Users can update own quest_goal_contributions"
    ON quest_goal_contributions FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own contributions
DROP POLICY IF EXISTS "Users can delete own quest_goal_contributions" ON quest_goal_contributions;
CREATE POLICY "Users can delete own quest_goal_contributions"
    ON quest_goal_contributions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. Goal Synergy Metadata Columns
-- =====================================================

-- Add synergy tracking to goals table
ALTER TABLE goals
ADD COLUMN IF NOT EXISTS synergy_group_id UUID,
ADD COLUMN IF NOT EXISTS synergy_type TEXT CHECK (synergy_type IN ('SYNERGISTIC', 'COMPLEMENTARY', 'PARALLEL', 'CONFLICTING', 'INDEPENDENT'));

-- Index for synergy grouping
CREATE INDEX IF NOT EXISTS idx_goals_synergy_group ON goals(synergy_group_id) WHERE synergy_group_id IS NOT NULL;

-- =====================================================
-- 5. Helper View: Quest with All Goals
-- =====================================================

DROP VIEW IF EXISTS quest_with_goals;
CREATE VIEW quest_with_goals AS
SELECT 
    dq.id AS quest_id,
    dq.title AS quest_title,
    dq.user_id,
    dq.goal_id AS primary_goal_id,
    dq.status,
    dq.is_recurring,
    dq.xp_reward,
    dq.progress_contribution,
    COALESCE(
        (
            SELECT json_agg(json_build_object(
                'goal_id', qgc.goal_id,
                'contribution_weight', qgc.contribution_weight,
                'contribution_type', qgc.contribution_type,
                'synergy_type', qgc.synergy_type,
                'is_primary', qgc.is_primary
            ))
            FROM quest_goal_contributions qgc
            WHERE qgc.quest_id = dq.id
        ),
        '[]'::json
    ) AS goal_contributions
FROM daily_quests dq;

-- =====================================================
-- 6. Function: Get All Goals for Quest
-- =====================================================

CREATE OR REPLACE FUNCTION get_quest_goals(quest_uuid UUID)
RETURNS TABLE (
    goal_id UUID,
    goal_title TEXT,
    contribution_weight NUMERIC,
    contribution_type TEXT,
    synergy_type TEXT,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        qgc.goal_id,
        g.title AS goal_title,
        qgc.contribution_weight,
        qgc.contribution_type,
        qgc.synergy_type,
        qgc.is_primary
    FROM quest_goal_contributions qgc
    JOIN goals g ON g.id = qgc.goal_id
    WHERE qgc.quest_id = quest_uuid
    ORDER BY qgc.is_primary DESC, qgc.contribution_weight DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. Function: Update Multiple Goals on Quest Completion
-- =====================================================

CREATE OR REPLACE FUNCTION update_goals_from_quest_completion(
    p_quest_id UUID,
    p_user_id UUID,
    p_progress_contribution NUMERIC DEFAULT 1.0
)
RETURNS TABLE (
    goal_id UUID,
    progress_added NUMERIC,
    new_current_value NUMERIC
) AS $$
DECLARE
    contribution_record RECORD;
BEGIN
    -- Process each goal contribution
    FOR contribution_record IN 
        SELECT 
            qgc.goal_id,
            qgc.contribution_weight,
            g.current_value
        FROM quest_goal_contributions qgc
        JOIN goals g ON g.id = qgc.goal_id
        WHERE qgc.quest_id = p_quest_id
        AND qgc.user_id = p_user_id
    LOOP
        -- Calculate weighted progress
        progress_added := p_progress_contribution * contribution_record.contribution_weight;
        new_current_value := COALESCE(contribution_record.current_value, 0) + progress_added;
        goal_id := contribution_record.goal_id;
        
        -- Update the goal
        UPDATE goals 
        SET 
            current_value = new_current_value,
            updated_at = NOW()
        WHERE id = contribution_record.goal_id;
        
        RETURN NEXT;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. Migrate Existing Quests
-- =====================================================

-- Create primary contributions for existing quests with goal_id
-- Note: contribution_weight is a multiplier (0.0-2.0), always 1.0 for primary goals
-- progress_contribution is stored separately in daily_quests table
INSERT INTO quest_goal_contributions (quest_id, goal_id, user_id, contribution_weight, is_primary, contribution_type)
SELECT 
    id AS quest_id,
    goal_id,
    user_id,
    1.0 AS contribution_weight,  -- Primary goals always get full weight (1.0)
    TRUE AS is_primary,
    'direct' AS contribution_type
FROM daily_quests
WHERE goal_id IS NOT NULL
ON CONFLICT (quest_id, goal_id) DO NOTHING;

-- =====================================================
-- End of Migration
-- =====================================================
