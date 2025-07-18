-- Add DPS fields to accounts table
ALTER TABLE accounts 
ADD COLUMN has_dps boolean DEFAULT false,
ADD COLUMN dps_type text CHECK (dps_type IN ('monthly', 'flexible') OR dps_type IS NULL),
ADD COLUMN dps_amount_type text CHECK (dps_amount_type IN ('fixed', 'custom') OR dps_amount_type IS NULL),
ADD COLUMN dps_fixed_amount decimal DEFAULT NULL,
ADD COLUMN dps_savings_account_id uuid REFERENCES accounts(id);

-- Create index on has_dps for faster filtering
CREATE INDEX idx_accounts_has_dps ON accounts(has_dps) WHERE has_dps = true;

-- Create DPS transfers table to track DPS history separately from regular transfers
CREATE TABLE dps_transfers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  from_account_id uuid REFERENCES accounts(id),
  to_account_id uuid REFERENCES accounts(id),
  amount decimal NOT NULL,
  date timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes for faster DPS transfer queries
CREATE INDEX idx_dps_transfers_user_id ON dps_transfers(user_id);
CREATE INDEX idx_dps_transfers_from_account ON dps_transfers(from_account_id);
CREATE INDEX idx_dps_transfers_to_account ON dps_transfers(to_account_id);
CREATE INDEX idx_dps_transfers_date ON dps_transfers(date);

-- Add RLS policies for DPS transfers
ALTER TABLE dps_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own DPS transfers"
  ON dps_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DPS transfers"
  ON dps_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id); 