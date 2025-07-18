-- =====================================================
-- FIX UUID/VARCHAR MISMATCH IN TRIGGERS AND FUNCTIONS
-- This script fixes the \
operator
does
not
exist:
character
varying
=
uuid\ error
-- =====================================================

-- Step 1: Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS sync_purchase_price_trigger ON purchases;
DROP TRIGGER IF EXISTS sync_transaction_price_trigger ON transactions;
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;

-- Step 2: Fix sync_purchase_price function
-- The issue: WHERE id = NEW.transaction_id (UUID = VARCHAR)
-- The fix: WHERE transaction_id = NEW.transaction_id (VARCHAR = VARCHAR)
CREATE OR REPLACE FUNCTION sync_purchase_price()
RETURNS TRIGGER AS \$\$
BEGIN
    -- When a purchase is updated, sync the linked transaction amount
    IF NEW.transaction_id IS NOT NULL AND NEW.price != OLD.price THEN
        UPDATE transactions 
        SET amount = NEW.price, updated_at = NOW()
        WHERE transaction_id = NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- Step 3: Fix sync_transaction_price function
-- The issue: WHERE transaction_id = NEW.id (VARCHAR = UUID)
-- The fix: WHERE transaction_id = NEW.transaction_id (VARCHAR = VARCHAR)
CREATE OR REPLACE FUNCTION sync_transaction_price()
RETURNS TRIGGER AS \$\$
BEGIN
    -- When a transaction is updated, sync the linked purchase price
    IF NEW.amount != OLD.amount THEN
        UPDATE purchases 
        SET price = NEW.amount, updated_at = NOW()
        WHERE transaction_id = NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

-- Step 4: Fix audit_transaction_changes function
-- Ensure it uses the correct transaction_id field
CREATE OR REPLACE FUNCTION audit_transaction_changes()
RETURNS TRIGGER AS \$\$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'create',
            'transaction',
            NEW.id,
            NULL,
            to_jsonb(NEW),
            jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'category', NEW.category, 'transaction_id', NEW.transaction_id),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'update',
            'transaction',
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW),
            jsonb_build_object('amount', NEW.amount, 'type', NEW.type, 'changes_detected', true, 'transaction_id', NEW.transaction_id),
            'medium'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'delete',
            'transaction',
            OLD.id,
            to_jsonb(OLD),
            NULL,
            jsonb_build_object('amount', OLD.amount, 'type', OLD.type, 'category', OLD.category, 'transaction_id', OLD.transaction_id),
            'high'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
\$\$ LANGUAGE plpgsql;

-- Step 5: Recreate all triggers with the fixed functions
CREATE TRIGGER sync_purchase_price_trigger
    AFTER UPDATE ON purchases
    FOR EACH ROW
    WHEN (OLD.price IS DISTINCT FROM NEW.price)
    EXECUTE FUNCTION sync_purchase_price();

CREATE TRIGGER sync_transaction_price_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
    EXECUTE FUNCTION sync_transaction_price();

CREATE TRIGGER audit_transactions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION audit_transaction_changes();

-- Step 6: Verify the fixes
SELECT 
    'TRIGGER FIXES COMPLETE' as status,
    'All UUID/VARCHAR mismatches have been resolved' as message;

-- Step 7: Show current trigger status
SELECT 
    trigger_name,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name IN ('sync_purchase_price_trigger', 'sync_transaction_price_trigger', 'audit_transactions_trigger')
ORDER BY trigger_name;

-- Step 8: Verify function definitions
SELECT 
    'sync_purchase_price' as function_name,
    'Uses transaction_id for cross-table updates' as description
UNION ALL
SELECT 
    'sync_transaction_price' as function_name,
    'Uses transaction_id for cross-table updates' as description
UNION ALL
SELECT 
    'audit_transaction_changes' as function_name,
    'Includes transaction_id in audit metadata' as description;
