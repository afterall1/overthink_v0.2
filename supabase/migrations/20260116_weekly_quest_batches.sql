-- =====================================================
-- Migration: Weekly Quest Batches System
-- Weekly quest generation batch table
-- =====================================================

-- 1. Weekly Quest Batches table
CREATE TABLE IF NOT EXISTS public.weekly_quest_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    
    -- Week boundaries (ISO week - Monday start)
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    
    -- AI Response Cache - 7 days quests as JSONB
    quests_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Batch status
    status TEXT NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'expired', 'regenerating')),
    
    -- Generation metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    
    -- Tracking
    days_delivered INTEGER DEFAULT 0,
    ai_model TEXT DEFAULT 'gemini-2.0-flash',
    token_usage INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint per user/goal/week
    CONSTRAINT weekly_quest_batches_unique_week 
        UNIQUE(user_id, goal_id, week_start)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_weekly_batches_user 
    ON public.weekly_quest_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_batches_goal 
    ON public.weekly_quest_batches(goal_id);
CREATE INDEX IF NOT EXISTS idx_weekly_batches_week 
    ON public.weekly_quest_batches(week_start);
CREATE INDEX IF NOT EXISTS idx_weekly_batches_status 
    ON public.weekly_quest_batches(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_weekly_batches_quests_gin 
    ON public.weekly_quest_batches USING GIN (quests_data);

-- 3. RLS Policies
ALTER TABLE public.weekly_quest_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own weekly batches"
    ON public.weekly_quest_batches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly batches"
    ON public.weekly_quest_batches FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly batches"
    ON public.weekly_quest_batches FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weekly batches"
    ON public.weekly_quest_batches FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Updated at trigger
CREATE OR REPLACE FUNCTION public.update_weekly_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_batches_updated_at
    BEFORE UPDATE ON public.weekly_quest_batches
    FOR EACH ROW
    EXECUTE FUNCTION public.update_weekly_batches_updated_at();

-- 5. Helper function: Get current week Monday
CREATE OR REPLACE FUNCTION public.get_week_start(target_date DATE DEFAULT CURRENT_DATE)
RETURNS DATE AS $$
BEGIN
    RETURN target_date - (EXTRACT(ISODOW FROM target_date) - 1)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Comment
COMMENT ON TABLE public.weekly_quest_batches IS 
    'Weekly AI-generated quest batches for diversified daily quests.';
