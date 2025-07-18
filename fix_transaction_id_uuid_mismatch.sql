-- Fix UUID/VARCHAR mismatch for transaction_id columns
-- This script addresses the "operator does not exist: character varying = uuid" error

-- Step 1: Drop any existing foreign key constraints that reference transaction_id
ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_transaction_id_fkey;
ALTER TABLE purchase_categories DROP CONSTRAINT IF EXISTS purchase_categories_transaction_id_fkey;
ALTER TABLE savings_goals DROP CONSTRAINT IF EXISTS savings_goals_transaction_id_fkey;
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_transaction_id_fkey;
ALTER TABLE dps_transfers DROP CONSTRAINT IF EXISTS dps_transfers_transaction_id_fkey;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_transaction_id_fkey;

-- Step 2: Drop existing indexes on transaction_id columns
DROP INDEX IF EXISTS idx_transactions_transaction_id;
DROP INDEX IF EXISTS idx_dps_transfers_transaction_id;
DROP INDEX IF EXISTS idx_accounts_transaction_id;
DROP INDEX IF EXISTS idx_purchases_transaction_id;
DROP INDEX IF EXISTS idx_purchase_categories_transaction_id;
DROP INDEX IF EXISTS idx_savings_goals_transaction_id;
DROP INDEX IF EXISTS idx_notifications_transaction_id;

-- Step 3: Ensure all transaction_id columns are VARCHAR(8)
ALTER TABLE transactions ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE dps_transfers ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE accounts ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE purchases ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE purchase_categories ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE savings_goals ALTER COLUMN transaction_id TYPE VARCHAR(8);
ALTER TABLE notifications ALTER COLUMN transaction_id TYPE VARCHAR(8);

-- Step 4: Recreate indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_dps_transfers_transaction_id ON dps_transfers(transaction_id);
CREATE INDEX IF NOT EXISTS idx_accounts_transaction_id ON accounts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_categories_transaction_id ON purchase_categories(transaction_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_transaction_id ON savings_goals(transaction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_transaction_id ON notifications(transaction_id);

-- Step 5: Verify the changes
SELECT 
  'transactions' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchases' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchases' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'accounts' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' AND column_name = 'transaction_id'

UNION ALL

SELECT 
  'purchase_categories' as table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'purchase_categories' AND column_name = 'transaction_id';
