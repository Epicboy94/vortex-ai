-- Vortex AI Database Schema
-- Run this in your Supabase SQL Editor

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT,
  age INTEGER,
  gender TEXT,
  height REAL,
  weight REAL,
  activity_level TEXT,
  bmi REAL,
  bmr REAL,
  tdee REAL,
  fitness_goal TEXT DEFAULT 'be_healthy', -- 'lose_weight', 'be_healthy', 'build_muscle'
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]'::jsonb,
  streak_count INTEGER DEFAULT 0,
  last_active_date DATE,
  last_xp_login_date DATE,
  meal_generations_today INTEGER DEFAULT 0,
  meal_gen_date DATE,
  is_pro BOOLEAN DEFAULT FALSE,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Food logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  calories INTEGER DEFAULT 0,
  protein REAL DEFAULT 0,
  carbs REAL DEFAULT 0,
  fat REAL DEFAULT 0,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercises JSONB,
  total_burn INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cuisine TEXT,
  diet_type TEXT,
  allergies TEXT[],
  plan JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weight logs table (new)
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight REAL NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/write their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = user_id);

-- Food logs
CREATE POLICY "Users can view own food logs" ON food_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own food logs" ON food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own food logs" ON food_logs FOR DELETE USING (auth.uid() = user_id);

-- Workouts
CREATE POLICY "Users can view own workouts" ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat messages
CREATE POLICY "Users can view own chats" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chat_messages FOR DELETE USING (auth.uid() = user_id);

-- Meal plans
CREATE POLICY "Users can view own meal plans" ON meal_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meal plans" ON meal_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weight logs
CREATE POLICY "Users can view own weight logs" ON weight_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weight logs" ON weight_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own weight logs" ON weight_logs FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs (user_id, logged_at);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts (user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON weight_logs (user_id, logged_at);

-- ============================================
-- MIGRATION SQL (Run this if tables already exist)
-- ============================================
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fitness_goal TEXT DEFAULT 'be_healthy';
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]'::jsonb;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_xp_login_date DATE;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_generations_today INTEGER DEFAULT 0;
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS meal_gen_date DATE;
