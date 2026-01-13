-- =====================================================
-- User Health Profiles Table
-- Migration: 20260113_user_health_profiles.sql
-- Purpose: Store user health data for BMR/TDEE calculation
--          and AI-powered personalized quest generation
-- =====================================================

-- Create user_health_profiles table
CREATE TABLE IF NOT EXISTS user_health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- =====================================================
    -- Basic Metrics (Required for BMR Calculation)
    -- =====================================================
    weight_kg NUMERIC(5,2) NOT NULL,           -- Current weight in kg
    height_cm NUMERIC(5,2) NOT NULL,           -- Height in cm
    birth_date DATE NOT NULL,                   -- For age calculation
    biological_sex VARCHAR(10) NOT NULL        -- 'male' | 'female'
        CHECK (biological_sex IN ('male', 'female')),
    
    -- =====================================================
    -- Activity & Lifestyle
    -- =====================================================
    activity_level VARCHAR(20) NOT NULL DEFAULT 'moderate'
        CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active', 'extreme')),
    sleep_hours_avg NUMERIC(3,1),              -- Average sleep hours (4.0-12.0)
    stress_level VARCHAR(10) DEFAULT 'medium'
        CHECK (stress_level IN ('low', 'medium', 'high')),
    
    -- =====================================================
    -- Health Conditions (for AI warnings and safe recommendations)
    -- =====================================================
    health_conditions TEXT[] DEFAULT '{}',     -- ['diabetes', 'hypertension', 'heart_disease', 'thyroid']
    dietary_restrictions TEXT[] DEFAULT '{}',  -- ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'halal', 'kosher']
    allergies TEXT[] DEFAULT '{}',             -- ['nuts', 'shellfish', 'eggs', 'soy', 'wheat']
    
    -- =====================================================
    -- Goals Configuration
    -- =====================================================
    primary_goal VARCHAR(30) DEFAULT 'maintenance'
        CHECK (primary_goal IN ('weight_loss', 'weight_gain', 'maintenance', 'muscle_gain', 'endurance')),
    target_weight_kg NUMERIC(5,2),             -- Target weight (optional)
    goal_pace VARCHAR(20) DEFAULT 'moderate'
        CHECK (goal_pace IN ('slow', 'moderate', 'aggressive')),
    
    -- =====================================================
    -- Calculated Fields (auto-updated by triggers/app)
    -- =====================================================
    bmr_kcal INTEGER,                          -- Basal Metabolic Rate
    tdee_kcal INTEGER,                         -- Total Daily Energy Expenditure
    target_daily_kcal INTEGER,                 -- With deficit/surplus applied
    
    -- =====================================================
    -- Timestamps
    -- =====================================================
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_health_profiles_user_id 
    ON user_health_profiles(user_id);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================
ALTER TABLE user_health_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only view their own health profile
CREATE POLICY "Users can view own health profile"
    ON user_health_profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only insert their own health profile
CREATE POLICY "Users can insert own health profile"
    ON user_health_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own health profile
CREATE POLICY "Users can update own health profile"
    ON user_health_profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can only delete their own health profile
CREATE POLICY "Users can delete own health profile"
    ON user_health_profiles FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- Trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_health_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_health_profile_updated_at
    BEFORE UPDATE ON user_health_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_health_profile_updated_at();

-- =====================================================
-- Service Role Policy (for server-side operations)
-- =====================================================
CREATE POLICY "Service role has full access to health profiles"
    ON user_health_profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Comments for Documentation
-- =====================================================
COMMENT ON TABLE user_health_profiles IS 
    'Stores user health data for BMR/TDEE calculation and AI-powered personalized quest generation';

COMMENT ON COLUMN user_health_profiles.bmr_kcal IS 
    'Basal Metabolic Rate calculated using Mifflin-St Jeor equation';

COMMENT ON COLUMN user_health_profiles.tdee_kcal IS 
    'Total Daily Energy Expenditure = BMR × activity_multiplier';

COMMENT ON COLUMN user_health_profiles.health_conditions IS 
    'Array of health conditions for AI safety warnings: diabetes, hypertension, heart_disease, thyroid, pcos';

COMMENT ON COLUMN user_health_profiles.dietary_restrictions IS 
    'Array of dietary preferences: vegetarian, vegan, gluten_free, dairy_free, halal, kosher, low_carb, keto';
