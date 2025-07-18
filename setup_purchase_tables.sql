-- =====================================================
-- SETUP PURCHASE TABLES AND RLS POLICIES
-- =====================================================

-- 1. Create purchase_categories table
CREATE TABLE IF NOT EXISTS purchase_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_name TEXT NOT NULL,
    description TEXT,
    monthly_budget DECIMAL DEFAULT 0,
    category_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create purchases table with transaction_id foreign key
CREATE TABLE IF NOT EXISTS purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL NOT NULL,
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT CHECK (status IN ('planned', 'purchased', 'cancelled')) DEFAULT 'purchased',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create purchase_attachments table for file uploads
CREATE TABLE IF NOT EXISTS purchase_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 5242880), -- 5MB max
    file_type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security on all tables
ALTER TABLE purchase_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_attachments ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for purchase_categories
CREATE POLICY "Users can view their own purchase categories"
    ON purchase_categories FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase categories"
    ON purchase_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase categories"
    ON purchase_categories FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase categories"
    ON purchase_categories FOR DELETE
    USING (auth.uid() = user_id);

-- 6. Create RLS policies for purchases
CREATE POLICY "Users can view their own purchases"
    ON purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
    ON purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases"
    ON purchases FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchases"
    ON purchases FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Create RLS policies for purchase_attachments
CREATE POLICY "Users can view their own purchase attachments"
    ON purchase_attachments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase attachments"
    ON purchase_attachments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase attachments"
    ON purchase_attachments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase attachments"
    ON purchase_attachments FOR DELETE
    USING (auth.uid() = user_id);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_categories_user_id ON purchase_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_categories_created_at ON purchase_categories(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_transaction_id ON purchases(transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_attachments_purchase_id ON purchase_attachments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_user_id ON purchase_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_attachments_created_at ON purchase_attachments(created_at DESC);

-- 9. Create function to validate file types
CREATE OR REPLACE FUNCTION validate_file_type(file_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Allowed file types: images, documents, PDFs
    RETURN file_type IN (
        'jpg', 'jpeg', 'png', 'gif',  -- Images
        'pdf', 'docx', 'xlsx', 'txt'  -- Documents
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to validate file type on insert
CREATE OR REPLACE FUNCTION check_file_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_file_type(NEW.file_type) THEN
        RAISE EXCEPTION 'File type % is not allowed. Allowed types: jpg, jpeg, png, gif, pdf, docx, xlsx, txt', NEW.file_type;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_file_type_trigger
    BEFORE INSERT ON purchase_attachments
    FOR EACH ROW
    EXECUTE FUNCTION check_file_type();

-- 11. Create function to sync purchase price with transaction amount
CREATE OR REPLACE FUNCTION sync_purchase_price()
RETURNS TRIGGER AS $$
BEGIN
    -- When a purchase is updated, sync the linked transaction amount
    IF NEW.transaction_id IS NOT NULL AND NEW.price != OLD.price THEN
        UPDATE transactions 
        SET amount = NEW.price, updated_at = NOW()
        WHERE id = NEW.transaction_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_purchase_price_trigger
    AFTER UPDATE ON purchases
    FOR EACH ROW
    WHEN (OLD.price IS DISTINCT FROM NEW.price)
    EXECUTE FUNCTION sync_purchase_price();

-- 12. Create function to sync transaction amount with purchase price
CREATE OR REPLACE FUNCTION sync_transaction_price()
RETURNS TRIGGER AS $$
BEGIN
    -- When a transaction is updated, sync the linked purchase price
    IF NEW.amount != OLD.amount THEN
        UPDATE purchases 
        SET price = NEW.amount, updated_at = NOW()
        WHERE transaction_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_transaction_price_trigger
    AFTER UPDATE ON transactions
    FOR EACH ROW
    WHEN (OLD.amount IS DISTINCT FROM NEW.amount)
    EXECUTE FUNCTION sync_transaction_price();
