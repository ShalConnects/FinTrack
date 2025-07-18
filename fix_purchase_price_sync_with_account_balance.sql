-- Fix purchase price sync to properly update account balances
-- This ensures that when a purchase price changes, the account balance is recalculated

-- Drop existing sync functions and triggers
DROP TRIGGER IF EXISTS sync_purchase_price_trigger ON purchases;
DROP TRIGGER IF EXISTS sync_transaction_price_trigger ON transactions;
DROP FUNCTION IF EXISTS sync_purchase_price();
DROP FUNCTION IF EXISTS sync_transaction_price();

-- Create improved function to sync purchase price with transaction amount AND account balance
CREATE OR REPLACE FUNCTION sync_purchase_price()
RETURNS TRIGGER AS $$
DECLARE
    old_amount DECIMAL;
    new_amount DECIMAL;
    account_id UUID;
    transaction_type TEXT;
BEGIN
    -- When a purchase is updated, sync the linked transaction amount
    IF NEW.transaction_id IS NOT NULL AND NEW.price != OLD.price THEN
        -- Get the current transaction details
        SELECT t.amount, t.account_id, t.type 
        INTO old_amount, account_id, transaction_type
        FROM transactions t 
        WHERE t.id = NEW.transaction_id;
        
        -- Update the transaction amount
        UPDATE transactions 
        SET amount = NEW.price, updated_at = NOW()
        WHERE id = NEW.transaction_id;
        
        -- Update account balance by removing old amount and adding new amount
        IF account_id IS NOT NULL AND old_amount IS NOT NULL THEN
            IF transaction_type = 'expense' THEN
                -- For expenses: remove old amount, add new amount (negative adjustment)
                UPDATE accounts 
                SET balance = balance + old_amount - NEW.price,
                    updated_at = NOW()
                WHERE id = account_id;
            ELSIF transaction_type = 'income' THEN
                -- For income: remove old amount, add new amount (positive adjustment)
                UPDATE accounts 
                SET balance = balance - old_amount + NEW.price,
                    updated_at = NOW()
                WHERE id = account_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create improved function to sync transaction amount with purchase price AND account balance
CREATE OR REPLACE FUNCTION sync_transaction_price()
RETURNS TRIGGER AS $$
DECLARE
    old_amount DECIMAL;
    account_id UUID;
    transaction_type TEXT;
BEGIN
    -- When a transaction is updated, sync the linked purchase price
    IF NEW.amount != OLD.amount THEN
        -- Update purchase price
        UPDATE purchases 
        SET price = NEW.amount, updated_at = NOW()
        WHERE transaction_id = NEW.id;
        
        -- Update account balance by removing old amount and adding new amount
        account_id := NEW.account_id;
        old_amount := OLD.amount;
        transaction_type := NEW.type;
        
        IF account_id IS NOT NULL AND old_amount IS NOT NULL THEN
            IF transaction_type = 'expense' THEN
                -- For expenses: remove old amount, add new amount (negative adjustment)
                UPDATE accounts 
                SET balance = balance + old_amount - NEW.amount,
                    updated_at = NOW()
                WHERE id = account_id;
            ELSIF transaction_type = 'income' THEN
                -- For income: remove old amount, add new amount (positive adjustment)
                UPDATE accounts 
                SET balance = balance - old_amount + NEW.amount,
                    updated_at = NOW()
                WHERE id = account_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers
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

-- Test the functions
-- You can test this by updating a purchase price and checking if the account balance updates correctly
