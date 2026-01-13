-- =====================================================
-- Goal-Specific Data Migration
-- Adds JSONB column for storing goal-specific questionnaire data
-- =====================================================

-- Add goal_specific_data column to goals table
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS goal_specific_data JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN goals.goal_specific_data IS 'Stores goal-specific questionnaire responses. Structure varies by goal type (reduce_sugar, muscle_gain, etc.)';

-- Create index for efficient JSON querying if needed
CREATE INDEX IF NOT EXISTS idx_goals_goal_specific_data 
ON goals USING gin (goal_specific_data);

-- Example data structures:
-- 
-- reduce_sugar:
-- {
--   "sugar_drinks_per_day": "2-3",
--   "sugar_sources": ["soft_drinks", "desserts"],
--   "biggest_trigger": "late_night",
--   "accepts_artificial_sweeteners": false
-- }
--
-- muscle_gain:
-- {
--   "current_training": "3-4",
--   "training_types": ["weights", "running"],
--   "training_experience": "intermediate",
--   "gym_access": "gym",
--   "sleep_quality": "good"
-- }
--
-- drink_water:
-- {
--   "current_intake_liters": 1.5,
--   "barriers": ["forget", "no_habit"],
--   "has_water_bottle": true
-- }
