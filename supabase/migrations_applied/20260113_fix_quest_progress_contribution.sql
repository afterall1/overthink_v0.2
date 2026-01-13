-- =====================================================
-- Fix Existing Quests Progress Contribution
-- Migration: 20260113_fix_quest_progress_contribution.sql
-- Description: Set progress_contribution = 1 for existing quests where NULL
-- =====================================================

-- Set default progress_contribution for existing quests that have NULL
UPDATE daily_quests
SET progress_contribution = 1
WHERE progress_contribution IS NULL OR progress_contribution = 0;

-- Log the fix
DO $$
BEGIN
    RAISE NOTICE 'Fixed progress_contribution for existing quests';
END $$;
