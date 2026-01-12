-- =====================================================
-- Goals Enhancement Migration
-- Run this in Supabase SQL Editor to add new columns
-- Date: 2026-01-12
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

-- Add index for streak queries
CREATE INDEX IF NOT EXISTS goals_streak_count_idx ON public.goals(streak_count DESC);
CREATE INDEX IF NOT EXISTS goals_last_activity_date_idx ON public.goals(last_activity_date);

-- Notify schema cache to reload (run Supabase Dashboard -> Settings -> API -> Reload Schema after this)
NOTIFY pgrst, 'reload schema';
