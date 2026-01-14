-- =====================================================
-- Migration: Unified Health Profile
-- Date: 2026-01-15
-- Description: Expands user_health_profiles with unified fields
--              to support all goal types from a single profile
-- =====================================================

-- =====================================================
-- PHASE 1: Add new columns (all nullable for backward compatibility)
-- =====================================================

-- 🏃 Activity & Movement
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS current_steps_avg INTEGER,
ADD COLUMN IF NOT EXISTS work_environment TEXT CHECK (work_environment IN ('desk', 'mixed', 'active', 'standing')),
ADD COLUMN IF NOT EXISTS has_fitness_tracker BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS best_activity_time TEXT CHECK (best_activity_time IN ('morning', 'afternoon', 'evening', 'flexible'));

-- 🏋️ Training History
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS training_experience TEXT CHECK (training_experience IN ('none', 'beginner', 'intermediate', 'advanced')),
ADD COLUMN IF NOT EXISTS training_types TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS gym_access TEXT CHECK (gym_access IN ('full_gym', 'home_gym', 'outdoor', 'none')),
ADD COLUMN IF NOT EXISTS available_training_times TEXT[] DEFAULT '{}';

-- 🍽️ Nutrition Habits
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS meals_per_day TEXT CHECK (meals_per_day IN ('2', '3', '4', '5+')),
ADD COLUMN IF NOT EXISTS cooks_at_home TEXT CHECK (cooks_at_home IN ('always', 'often', 'sometimes', 'rarely')),
ADD COLUMN IF NOT EXISTS daily_vegetables TEXT CHECK (daily_vegetables IN ('0', '1-2', '3-4', '5+')),
ADD COLUMN IF NOT EXISTS fast_food_frequency TEXT CHECK (fast_food_frequency IN ('never', 'weekly', 'few_times_week', 'daily')),
ADD COLUMN IF NOT EXISTS has_breakfast TEXT CHECK (has_breakfast IN ('always', 'sometimes', 'rarely', 'never')),
ADD COLUMN IF NOT EXISTS alcohol_frequency TEXT CHECK (alcohol_frequency IN ('never', 'occasional', 'weekly', 'daily'));

-- 💧 Hydration
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS current_water_intake_liters DECIMAL(3,1) DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS coffee_tea_cups TEXT CHECK (coffee_tea_cups IN ('0', '1-2', '3-4', '5+')),
ADD COLUMN IF NOT EXISTS has_water_bottle BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hydration_barriers TEXT[] DEFAULT '{}';

-- 🍬 Sugar Habits
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS sugar_drinks_per_day INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sugar_sources TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sugar_craving_trigger TEXT CHECK (sugar_craving_trigger IN ('morning_coffee', 'after_lunch', 'after_dinner', 'late_night', 'stress')),
ADD COLUMN IF NOT EXISTS accepts_artificial_sweeteners BOOLEAN DEFAULT TRUE;

-- 😴 Sleep & Recovery (sleep_hours_avg and stress_level already exist)
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'fair', 'good', 'excellent'));

-- 🏥 Health Supplements
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS uses_supplements BOOLEAN DEFAULT FALSE;

-- 🎯 Goals History
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS previous_diet_attempts TEXT CHECK (previous_diet_attempts IN ('never', 'failed', 'partial', 'success')),
ADD COLUMN IF NOT EXISTS main_struggles TEXT[] DEFAULT '{}';

-- 📊 Profile Completeness Tracking
ALTER TABLE user_health_profiles
ADD COLUMN IF NOT EXISTS profile_version INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS sections_completed TEXT[] DEFAULT '{}';

-- =====================================================
-- PHASE 2: Add indexes for faster lookups
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_sections 
ON user_health_profiles (user_id, sections_completed);

CREATE INDEX IF NOT EXISTS idx_user_health_profiles_version 
ON user_health_profiles (user_id, profile_version);

-- =====================================================
-- PHASE 3: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN user_health_profiles.current_steps_avg IS 'Average daily steps (for activity-based goals)';
COMMENT ON COLUMN user_health_profiles.work_environment IS 'desk=sedentary, mixed=some movement, active=physical job, standing=standing desk';
COMMENT ON COLUMN user_health_profiles.training_experience IS 'Fitness training experience level';
COMMENT ON COLUMN user_health_profiles.training_types IS 'Array of training types: cardio, weights, hiit, yoga, crossfit, swimming, etc.';
COMMENT ON COLUMN user_health_profiles.gym_access IS 'Type of gym/workout facility access';
COMMENT ON COLUMN user_health_profiles.meals_per_day IS 'Typical number of meals eaten per day';
COMMENT ON COLUMN user_health_profiles.sugar_craving_trigger IS 'Primary trigger for sugar cravings';
COMMENT ON COLUMN user_health_profiles.hydration_barriers IS 'Array of barriers: forget, taste, access, habit';
COMMENT ON COLUMN user_health_profiles.main_struggles IS 'Array of main weight/diet struggles: emotional_eating, portion_control, late_night, etc.';
COMMENT ON COLUMN user_health_profiles.sections_completed IS 'Array of completed wizard sections for progressive profile building';
COMMENT ON COLUMN user_health_profiles.profile_version IS 'Profile schema version (1=legacy, 2=unified)';

-- =====================================================
-- PHASE 4: Update existing profiles to mark basic section as complete
-- =====================================================

UPDATE user_health_profiles
SET 
    sections_completed = ARRAY['basic', 'activity', 'health', 'goals'],
    profile_version = 2
WHERE 
    weight_kg IS NOT NULL 
    AND height_cm IS NOT NULL 
    AND birth_date IS NOT NULL
    AND (sections_completed IS NULL OR sections_completed = '{}');

-- =====================================================
-- Done!
-- =====================================================
