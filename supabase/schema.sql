-- =====================================================
-- LifeNexus Database Schema
-- Supabase SQL Editor'da çalıştırın
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (Supabase Auth ile entegre)
-- =====================================================
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Users için RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. CATEGORIES TABLE (Sabit 6 kategori)
-- =====================================================
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    color_code TEXT NOT NULL,
    icon_slug TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Categories için RLS (herkes okuyabilir)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
    ON public.categories FOR SELECT
    USING (true);

-- Sabit kategorileri ekle
INSERT INTO public.categories (name, slug, color_code, icon_slug, description) VALUES
    ('Trade', 'trade', '#F59E0B', 'chart-line', 'Kripto ve borsa işlemleri'),
    ('Food', 'food', '#10B981', 'utensils', 'Yemek ve beslenme takibi'),
    ('Sport', 'sport', '#3B82F6', 'dumbbell', 'Spor ve fitness aktiviteleri'),
    ('Dev', 'dev', '#8B5CF6', 'code', 'Yazılım geliştirme aktiviteleri'),
    ('Etsy', 'etsy', '#EC4899', 'shopping-bag', 'Etsy mağaza ve satış işlemleri'),
    ('Gaming', 'gaming', '#EF4444', 'gamepad-2', 'Oyun oynama aktiviteleri');

-- =====================================================
-- 3. LOGS TABLE (JSONB data ile esnek yapı)
-- =====================================================
CREATE TABLE public.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    data JSONB NOT NULL DEFAULT '{}',
    sentiment INTEGER CHECK (sentiment >= 1 AND sentiment <= 10),
    notes TEXT,
    logged_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Logs için indexler
CREATE INDEX logs_user_id_idx ON public.logs(user_id);
CREATE INDEX logs_category_id_idx ON public.logs(category_id);
CREATE INDEX logs_logged_at_idx ON public.logs(logged_at DESC);
CREATE INDEX logs_data_gin_idx ON public.logs USING GIN(data);

-- Logs için RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
    ON public.logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
    ON public.logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
    ON public.logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
    ON public.logs FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 4. GOALS TABLE (Günlük/Haftalık hedefler)
-- =====================================================
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_value NUMERIC,
    current_value NUMERIC DEFAULT 0,
    unit TEXT,
    period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'daily',
    is_completed BOOLEAN DEFAULT FALSE,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Goals için indexler
CREATE INDEX goals_user_id_idx ON public.goals(user_id);
CREATE INDEX goals_category_id_idx ON public.goals(category_id);
CREATE INDEX goals_period_idx ON public.goals(period);
CREATE INDEX goals_start_date_idx ON public.goals(start_date);

-- Goals için RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
    ON public.goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
    ON public.goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
    ON public.goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
    ON public.goals FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS: updated_at otomatik güncelleme
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logs_updated_at
    BEFORE UPDATE ON public.logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Yeni kullanıcı kaydında profil oluştur
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ÖRNEK DATA YAPILARI (JSONB için referans)
-- =====================================================
-- Trade: {"pair": "BTC/USDT", "side": "long", "entry": 42000, "exit": 43500, "pnl": 150, "pnl_percent": 3.5}
-- Food:  {"meal_type": "lunch", "calories": 650, "protein": 35, "carbs": 80, "fat": 20, "foods": ["tavuk", "pilav"]}
-- Sport: {"activity": "weight_training", "duration_min": 60, "calories_burned": 400, "exercises": [{"name": "bench press", "sets": 4, "reps": 10}]}
-- Dev:   {"project": "LifeNexus", "task": "API geliştirme", "duration_min": 120, "commits": 5, "language": "TypeScript"}
-- Etsy:  {"order_id": "12345", "product": "El yapımı kolye", "revenue": 45.99, "cost": 15, "profit": 30.99}
-- Gaming:{\"game\": \"Elden Ring\", \"duration_min\": 90, \"achievement\": \"Boss defeated\", \"platform\": \"PC\"}

-- =====================================================
-- 5. EVENTS TABLE (Gelecek planları ve bildirimler)
-- =====================================================
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    
    -- Event details
    title TEXT NOT NULL,
    description TEXT,
    data JSONB NOT NULL DEFAULT '{}',
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_min INTEGER DEFAULT 30,
    reminder_min INTEGER DEFAULT 15,
    
    -- Recurrence
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_rule TEXT,
    
    -- Status tracking
    status TEXT CHECK (status IN ('pending', 'notified', 'completed', 'skipped')) DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    linked_log_id UUID REFERENCES public.logs(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Events için indexler
CREATE INDEX events_user_id_idx ON public.events(user_id);
CREATE INDEX events_scheduled_at_idx ON public.events(scheduled_at);
CREATE INDEX events_status_idx ON public.events(status);
CREATE INDEX events_category_id_idx ON public.events(category_id);

-- Events için RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
    ON public.events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events"
    ON public.events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events"
    ON public.events FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events"
    ON public.events FOR DELETE
    USING (auth.uid() = user_id);

-- Events için updated_at trigger
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

