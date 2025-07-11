-- Verify history tracking system
-- Run this in Supabase SQL Editor to check if transaction & purchase updates are being tracked

-- 1. Check if the update tables exist
SELECT 
    'transaction_updates' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'transaction_updates'
    ) as exists
UNION ALL
SELECT 
    'purchase_updates' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'purchase_updates'
    ) as exists;

-- 2. Check if the views exist
SELECT 
    'transaction_update_history' as view_name,
    EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'transaction_update_history'
    ) as exists
UNION ALL
SELECT 
    'purchase_update_history' as view_name,
    EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'purchase_update_history'
    ) as exists;

-- 3. Check if the logging functions exist
SELECT 
    'log_transaction_update' as function_name,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'log_transaction_update'
    ) as exists
UNION ALL
SELECT 
    'log_purchase_update' as function_name,
    EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'log_purchase_update'
    ) as exists;

-- 4. Check if the triggers exist
SELECT 
    'trigger_log_transaction_update' as trigger_name,
    EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_log_transaction_update'
    ) as exists
UNION ALL
SELECT 
    'trigger_log_purchase_update' as trigger_name,
    EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_log_purchase_update'
    ) as exists;

-- 5. Check if there are any existing update records
SELECT 
    'transaction_updates' as table_name,
    COUNT(*) as record_count
FROM transaction_updates
UNION ALL
SELECT 
    'purchase_updates' as table_name,
    COUNT(*) as record_count
FROM purchase_updates;

-- 6. Show recent transaction updates (if any)
SELECT 
    'Recent Transaction Updates' as info,
    COUNT(*) as count
FROM transaction_update_history
WHERE updated_at >= NOW() - INTERVAL '7 days';

-- 7. Show recent purchase updates (if any)
SELECT 
    'Recent Purchase Updates' as info,
    COUNT(*) as count
FROM purchase_update_history
WHERE updated_at >= NOW() - INTERVAL '7 days';

-- 8. Test the views by selecting a few records
SELECT 'Testing transaction_update_history view:' as test_info;
SELECT 
    transaction_id,
    field_name,
    old_value,
    new_value,
    updated_at
FROM transaction_update_history
ORDER BY updated_at DESC
LIMIT 5;

SELECT 'Testing purchase_update_history view:' as test_info;
SELECT 
    purchase_id,
    field_name,
    old_value,
    new_value,
    updated_at
FROM purchase_update_history
ORDER BY updated_at DESC
LIMIT 5;
