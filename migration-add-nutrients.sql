-- Run this in Supabase SQL Editor to add new columns for scientific food tracking
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS fiber REAL DEFAULT 0;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS sugar REAL DEFAULT 0;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS sodium REAL DEFAULT 0;
