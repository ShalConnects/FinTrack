# Enable Real Database Calls

After running the database setup script in Supabase, follow these steps to enable real database calls:

## Step 1: Run the Database Setup Script

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `complete_database_setup.sql`
4. Run the script

## Step 2: Enable Real Database Calls in the App

### 1. Enable fetchAccounts
In `src/store/useFinanceStore.ts`, find the `fetchAccounts` function and:

**Comment out the mock data:**
```typescript
// Temporarily use mock data while debugging database connection
// const mockAccounts = [...];
// set({ accounts: mockAccounts, loading: false });
```

**Uncomment the database call:**
```typescript
const { user } = useAuthStore.getState();
if (!user) {
  console.error('No user found');
  return set({ loading: false, error: 'Not authenticated' });
}

const { data, error } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });

if (error) {
  console.error('Error fetching accounts:', error);
  return set({ loading: false, error: error.message });
}

set({ accounts: data || [], loading: false });
```

### 2. Enable fetchTransactions
In the same file, find the `fetchTransactions` function and:

**Comment out the mock data:**
```typescript
// Temporarily use mock data while debugging database connection
// const mockTransactions = [...];
// set({ transactions: mockTransactions, loading: false });
```

**Uncomment the database call:**
```typescript
const { user } = useAuthStore.getState();
if (!user) {
  console.error('No user found');
  return set({ loading: false, error: 'Not authenticated' });
}
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', user.id)
  .order('date', { ascending: false });

if (error) {
  console.error('Error fetching transactions:', error);
  return set({ loading: false, error: error.message });
}

set({ transactions: data || [], loading: false });
```

### 3. Enable fetchSavingsGoals
Find the `fetchSavingsGoals` function and:

**Comment out the mock data:**
```typescript
// Temporarily use mock data while debugging database connection
// const mockSavingsGoals = [...];
// set({ savingsGoals: mockSavingsGoals, loading: false });
```

**Uncomment the database call:**
```typescript
const { data, error } = await supabase
  .from('savings_goals')
  .select('*')
  .order('created_at', { ascending: false });

if (error) throw error;
set({ savingsGoals: data || [], loading: false });
```

### 4. Enable fetchPurchases (Already done)
The purchases function should already be using real database calls.

### 5. Enable fetchPurchaseCategories (Already done)
The purchase categories function should already be using real database calls.

## Step 3: Enable CRUD Operations

### Accounts CRUD
Enable the following functions:
- `addAccount`
- `updateAccount` 
- `deleteAccount`

### Transactions CRUD
Enable the following functions:
- `addTransaction`
- `updateTransaction`
- `deleteTransaction`

### Savings Goals CRUD
Enable the following functions:
- `createSavingsGoal`
- `updateSavingsGoal`
- `deleteSavingsGoal`
- `saveSavingsGoal`

## Step 4: Test the Application

1. Refresh the application
2. Try creating a new account
3. Try adding a transaction
4. Try creating a savings goal
5. Check if data persists after page refresh

## Troubleshooting

If you encounter errors:

1. **Check browser console** for specific error messages
2. **Verify RLS policies** are correctly set up
3. **Check user authentication** is working
4. **Verify table structure** matches the interface definitions

## Common Issues

1. **"Failed to fetch"** - Usually means RLS policy is blocking access
2. **"Not authenticated"** - User authentication issue
3. **"Column does not exist"** - Table structure mismatch
4. **"Foreign key constraint"** - Related table missing or incorrect references
