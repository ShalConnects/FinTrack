-- Fix Missing USER_ID Columns

-- Check which tables exist and their current structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_categories', 'purchases')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- FIX PURCHASE_CATEGORIES TABLE
-- =====================================================

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchase_categories' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE purchase_categories ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- FIX PURCHASES TABLE
-- =====================================================

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'purchases' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE purchases ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Drop existing policies for purchase_categories
DROP POLICY IF EXISTS "Users can view their own purchase categories" ON purchase_categories;
DROP POLICY IF EXISTS "Users can insert their own purchase categories" ON purchase_categories;
DROP POLICY IF EXISTS "Users can update their own purchase categories" ON purchase_categories;
DROP POLICY IF EXISTS "Users can delete their own purchase categories" ON purchase_categories;

-- Create new policies for purchase_categories
CREATE POLICY "Users can view their own purchase categories" ON purchase_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase categories" ON purchase_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase categories" ON purchase_categories
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase categories" ON purchase_categories
    FOR DELETE USING (auth.uid() = user_id);

-- Drop existing policies for purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update their own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete their own purchases" ON purchases;

-- Create new policies for purchases
CREATE POLICY "Users can view their own purchases" ON purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases" ON purchases
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check the updated table structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('purchase_categories', 'purchases')
ORDER BY table_name, ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('purchase_categories', 'purchases')
ORDER BY tablename, policyname;
