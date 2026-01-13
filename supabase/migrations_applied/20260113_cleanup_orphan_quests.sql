-- =====================================================
-- Migration: Cleanup Orphan Quests (Genel Görevler)
-- Date: 2026-01-13
-- Description: Removes all quests without a linked goal and their completions
-- =====================================================

-- Step 1: Get orphan quest IDs (quests with no goal_id)
-- We'll use these to delete completions first

-- Step 2: Delete all quest_completions for orphan quests
DELETE FROM quest_completions
WHERE quest_id IN (
    SELECT id FROM daily_quests WHERE goal_id IS NULL
);

-- Step 3: Delete orphan quests (quests with no linked goal)
DELETE FROM daily_quests
WHERE goal_id IS NULL;

-- Note: XP stats should be updated separately via the application
-- This migration only cleans up the orphan records from the database

-- Verification query (optional - run separately to check)
-- SELECT COUNT(*) as remaining_orphan_quests FROM daily_quests WHERE goal_id IS NULL;
