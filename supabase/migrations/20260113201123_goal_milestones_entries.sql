-- =====================================================
-- Consolidated Migration: Missing Tables
-- All tables that need to be created on remote
-- =====================================================

-- =====================================================
-- 1. Goal Entries Table
-- =====================================================

CREATE TABLE IF NOT EXISTS goal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL DEFAULT 0,
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_entries_goal ON goal_entries(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_user ON goal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_goal_entries_logged ON goal_entries(goal_id, logged_at DESC);

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
-- 2. Goal Milestones Table
-- =====================================================

CREATE TABLE IF NOT EXISTS goal_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_order ON goal_milestones(goal_id, sort_order);

ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

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

-- Updated_at trigger
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
-- 3. AI Conversations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    council_member TEXT NOT NULL CHECK (council_member IN ('task_advisor', 'life_coach', 'health_council', 'wizard_ai')),
    messages JSONB NOT NULL DEFAULT '[]',
    context_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_member ON ai_conversations(user_id, council_member);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);

ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON ai_conversations;
CREATE POLICY "Users can view own conversations"
    ON ai_conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON ai_conversations;
CREATE POLICY "Users can insert own conversations"
    ON ai_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own conversations" ON ai_conversations;
CREATE POLICY "Users can delete own conversations"
    ON ai_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. AI Insights Cache Table
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('daily', 'weekly', 'task_specific', 'goal_analysis', 'health_advice')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_valid ON ai_insights(valid_until) WHERE valid_until IS NOT NULL;

ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own insights" ON ai_insights;
CREATE POLICY "Users can view own insights"
    ON ai_insights FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own insights" ON ai_insights;
CREATE POLICY "Users can insert own insights"
    ON ai_insights FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own insights" ON ai_insights;
CREATE POLICY "Users can delete own insights"
    ON ai_insights FOR DELETE
    USING (auth.uid() = user_id);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_insights()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_insights
    WHERE valid_until IS NOT NULL AND valid_until < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- End of Migration
-- =====================================================
