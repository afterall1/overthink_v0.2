-- =====================================================
-- AI Conversations & Insights Migration
-- Migration: 20260113_ai_conversations_insights.sql
-- Description: Tables for AI conversation history and insight caching
-- =====================================================

-- =====================================================
-- 1. AI Conversations Table
-- Stores conversation history with AI council members
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Council member identifier
    council_member TEXT NOT NULL CHECK (council_member IN ('task_advisor', 'life_coach', 'health_council', 'wizard_ai')),
    
    -- Conversation content
    messages JSONB NOT NULL DEFAULT '[]',
    context_data JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user's conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_member ON ai_conversations(user_id, council_member);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created ON ai_conversations(created_at DESC);

-- =====================================================
-- 2. AI Insights Cache Table
-- Caches AI-generated insights to reduce API calls
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Insight type
    insight_type TEXT NOT NULL CHECK (insight_type IN ('daily', 'weekly', 'task_specific', 'goal_analysis', 'health_advice')),
    
    -- Content
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    
    -- Cache validity
    valid_until TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for insight lookups
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_valid ON ai_insights(valid_until) WHERE valid_until IS NOT NULL;

-- =====================================================
-- 3. RLS Policies
-- =====================================================

-- AI Conversations RLS
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

-- AI Insights RLS
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

-- =====================================================
-- 4. Cleanup Function - Auto-delete expired insights
-- =====================================================

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
