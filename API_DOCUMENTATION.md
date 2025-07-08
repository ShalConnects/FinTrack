# Finance SaaS Platform - API Documentation

## Table of Contents

1. [Core Types & Interfaces](#core-types--interfaces)
2. [Utility Functions](#utility-functions)
3. [Custom Hooks](#custom-hooks)
4. [State Management Stores](#state-management-stores)
5. [Component Libraries](#component-libraries)
6. [API Integration](#api-integration)
7. [Notification System](#notification-system)
8. [Exchange Rate System](#exchange-rate-system)
9. [Transaction Management](#transaction-management)
10. [Usage Examples](#usage-examples)

---

## Core Types & Interfaces

### Account Interface

```typescript
interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  initial_balance?: number;
  calculated_balance: number;
  currency: string;
  description?: string;
  isActive: boolean;
  has_dps?: boolean;
  dps_type?: 'monthly' | 'flexible' | null;
  dps_amount_type?: 'fixed' | 'custom' | null;
  dps_fixed_amount?: number | null;
  dps_savings_account_id?: string | null;
  donation_preference?: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}
```

**Description:** Core account data structure for financial account management.

**Usage:**
```typescript
const account: Account = {
  id: 'acc_123',
  name: 'Main Checking',
  type: 'checking',
  calculated_balance: 5000.50,
  currency: 'USD',
  isActive: true,
  user_id: 'user_123'
  // ... other required fields
};
```

### Transaction Interface

```typescript
interface Transaction {
  id: string;
  account_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  tags?: string[];
  saving_amount?: number;
  note?: string;
  transaction_id?: string;
  created_at: string;
  updated_at?: string;
  user_id: string;
}
```

**Description:** Core transaction data structure for financial transactions.

**Usage:**
```typescript
const transaction: Transaction = {
  id: 'txn_123',
  account_id: 'acc_123',
  type: 'expense',
  amount: 150.75,
  description: 'Grocery shopping',
  category: 'Food',
  date: '2024-01-15',
  tags: ['groceries', 'essential'],
  user_id: 'user_123'
};
```

### Purchase Interface

```typescript
interface Purchase {
  id: string;
  user_id: string;
  transaction_id?: string;
  account_id?: string;
  purchase_id?: string;
  item_name: string;
  category: string;
  price: number;
  currency: string;
  purchase_date: string;
  status: 'planned' | 'purchased' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  created_at: string;
  updated_at: string;
  exclude_from_calculation?: boolean;
}
```

**Description:** Purchase management data structure for tracking planned and completed purchases.

### LendBorrow Interface

```typescript
interface LendBorrow {
  id: string;
  user_id: string;
  type: 'lend' | 'borrow';
  person_name: string;
  amount: number;
  currency: string;
  due_date?: string;
  status: 'active' | 'settled' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**Description:** Lending and borrowing transaction tracking.

---

## Utility Functions

### Currency Utilities

#### `getCurrencySymbol(currency: string): string`

**Description:** Returns the symbol for a given currency code.

**Parameters:**
- `currency` (string): Currency code (e.g., 'USD', 'EUR', 'BDT')

**Returns:** Currency symbol string

**Example:**
```typescript
import { getCurrencySymbol } from './utils/currency';

const symbol = getCurrencySymbol('USD'); // Returns: '$'
const bdtSymbol = getCurrencySymbol('BDT'); // Returns: '৳'
const euroSymbol = getCurrencySymbol('EUR'); // Returns: '€'
```

#### `formatCurrency(amount: number, currency?: string): string`

**Description:** Formats a number as a currency with proper symbol and formatting.

**Parameters:**
- `amount` (number): The amount to format
- `currency` (string, optional): Currency code, defaults to 'USD'

**Returns:** Formatted currency string

**Example:**
```typescript
import { formatCurrency } from './utils/currency';

const formatted = formatCurrency(1234.56, 'USD'); // Returns: '$1,234.56'
const bdtFormatted = formatCurrency(1000, 'BDT'); // Returns: '৳1,000.00'
```

### Transaction ID Utilities

#### `generateTransactionId(): string`

**Description:** Generates a unique 8-character transaction ID starting with 'F'.

**Returns:** Transaction ID string

**Example:**
```typescript
import { generateTransactionId } from './utils/transactionId';

const txnId = generateTransactionId(); // Returns: 'F1234567'
```

#### `isValidTransactionId(transactionId: string): boolean`

**Description:** Validates if a transaction ID follows the correct format.

**Parameters:**
- `transactionId` (string): Transaction ID to validate

**Returns:** Boolean indicating validity

**Example:**
```typescript
import { isValidTransactionId } from './utils/transactionId';

const isValid = isValidTransactionId('F1234567'); // Returns: true
const isInvalid = isValidTransactionId('ABC123'); // Returns: false
```

#### `createTransactionMetadata(action: string, entityType: string, description?: string, additionalData?: Record<string, any>): Record<string, any>`

**Description:** Creates a complete transaction metadata object with ID and timestamp.

**Parameters:**
- `action` (string): Action performed (e.g., 'create', 'update')
- `entityType` (string): Type of entity (e.g., 'transaction', 'account')
- `description` (string, optional): Optional description
- `additionalData` (object, optional): Additional metadata

**Returns:** Metadata object with transaction ID and timestamp

**Example:**
```typescript
import { createTransactionMetadata } from './utils/transactionId';

const metadata = createTransactionMetadata(
  'create',
  'transaction',
  'Created new expense transaction',
  { amount: 100, category: 'Food' }
);
// Returns: {
//   transaction_id: 'F1234567',
//   action: 'create',
//   entity_type: 'transaction',
//   description: 'Created new expense transaction',
//   timestamp: '2024-01-15T10:30:00.000Z',
//   amount: 100,
//   category: 'Food'
// }
```

#### `copyTransactionIdToClipboard(transactionId: string): Promise<boolean>`

**Description:** Copies a transaction ID to the system clipboard.

**Parameters:**
- `transactionId` (string): Transaction ID to copy

**Returns:** Promise resolving to success boolean

**Example:**
```typescript
import { copyTransactionIdToClipboard } from './utils/transactionId';

const success = await copyTransactionIdToClipboard('F1234567');
if (success) {
  console.log('Transaction ID copied to clipboard');
}
```

### Exchange Rate Utilities

#### `getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number>`

**Description:** Gets exchange rate between two currencies, with fallback to common rates.

**Parameters:**
- `fromCurrency` (string): Source currency code
- `toCurrency` (string): Target currency code

**Returns:** Promise resolving to exchange rate

**Example:**
```typescript
import { getExchangeRate } from './utils/exchangeRate';

const rate = await getExchangeRate('USD', 'EUR'); // Returns: ~0.85
const sameRate = await getExchangeRate('USD', 'USD'); // Returns: 1
```

#### `calculateConvertedAmount(amount: number, fromCurrency: string, toCurrency: string, exchangeRate: number): number`

**Description:** Calculates converted amount using exchange rate.

**Parameters:**
- `amount` (number): Original amount
- `fromCurrency` (string): Source currency
- `toCurrency` (string): Target currency
- `exchangeRate` (number): Exchange rate to use

**Returns:** Converted amount

**Example:**
```typescript
import { calculateConvertedAmount } from './utils/exchangeRate';

const converted = calculateConvertedAmount(100, 'USD', 'EUR', 0.85); // Returns: 85
```

#### `formatExchangeRate(rate: number, fromCurrency: string, toCurrency: string): string`

**Description:** Formats exchange rate for display.

**Example:**
```typescript
import { formatExchangeRate } from './utils/exchangeRate';

const formatted = formatExchangeRate(0.85, 'USD', 'EUR'); // Returns: '1.1765:1'
```

---

## Custom Hooks

### `useLoading()`

**Description:** Custom hook for managing loading states with async function wrapping.

**Returns:**
```typescript
interface UseLoadingReturn {
  isLoading: boolean;
  wrapAsync: <T extends (...args: any[]) => Promise<any>>(
    asyncFn: T
  ) => (...args: Parameters<T>) => Promise<ReturnType<T>>;
  setLoading: (loading: boolean) => void;
}
```

**Example:**
```typescript
import { useLoading } from './hooks/useLoading';

function MyComponent() {
  const { isLoading, wrapAsync, setLoading } = useLoading();

  const handleSubmit = wrapAsync(async (data) => {
    // This will automatically set loading to true before execution
    // and false after completion
    await api.createTransaction(data);
  });

  const handleManualLoading = () => {
    setLoading(true);
    // Do some work
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      <button onClick={handleSubmit}>Create Transaction</button>
      <button onClick={handleManualLoading}>Manual Loading</button>
    </div>
  );
}
```

---

## State Management Stores

### Auth Store (`useAuthStore`)

**Description:** Zustand store for authentication state management with Supabase integration.

**State:**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}
```

**Example:**
```typescript
import { useAuthStore } from './stores/authStore';

function LoginComponent() {
  const { user, isLoading, error, signIn, signOut } = useAuthStore();

  const handleLogin = async () => {
    try {
      await signIn('user@example.com', 'password123');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  if (user) {
    return (
      <div>
        <p>Welcome, {user.email}!</p>
        <button onClick={signOut}>Sign Out</button>
      </div>
    );
  }

  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      <button onClick={handleLogin}>Sign In</button>
    </div>
  );
}
```

### Notifications Store (`useNotificationsStore`)

**Description:** Zustand store for managing notification state.

**Example:**
```typescript
import { useNotificationsStore } from './stores/notificationsStore';

function NotificationsComponent() {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## API Integration

### Supabase Client

**Description:** Configured Supabase client for database operations.

**Usage:**
```typescript
import { supabase } from './lib/supabase';

// Query data
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId);

// Insert data
const { data, error } = await supabase
  .from('accounts')
  .insert({
    name: 'New Account',
    type: 'checking',
    currency: 'USD',
    user_id: userId
  });

// Update data
const { data, error } = await supabase
  .from('transactions')
  .update({ description: 'Updated description' })
  .eq('id', transactionId);

// Delete data
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId);
```

---

## Notification System

### Basic Toast Functions

#### `showToast.success(message: string, options?)`

**Description:** Shows a success toast notification.

**Parameters:**
- `message` (string): Main message
- `options` (object, optional): Additional options including description and action

**Example:**
```typescript
import { showToast } from './lib/notifications';

showToast.success('Transaction created successfully');

// With description and action
showToast.success('Account created', {
  description: 'Your new checking account is ready to use',
  action: {
    label: 'View Account',
    onClick: () => navigateToAccount()
  }
});
```

#### `showToast.error(message: string, options?)`

**Description:** Shows an error toast notification.

**Example:**
```typescript
showToast.error('Failed to create transaction', {
  description: 'Please check your internet connection and try again'
});
```

#### `showToast.warning(message: string, options?)`
#### `showToast.info(message: string, options?)`
#### `showToast.loading(message: string)`

### Context-Aware Notifications

#### Transaction Notifications

```typescript
import { contextAwareNotifications } from './lib/notifications';

// Transaction created
contextAwareNotifications.transaction.created(150.50, 'USD');

// Transaction updated
contextAwareNotifications.transaction.updated(200.00, 'EUR');

// Transaction deleted
contextAwareNotifications.transaction.deleted();

// Transaction error
contextAwareNotifications.transaction.error('Insufficient funds');
```

#### Account Notifications

```typescript
// Account created
contextAwareNotifications.account.created('Main Checking');

// Account updated
contextAwareNotifications.account.updated('Savings Account');

// Account deleted
contextAwareNotifications.account.deleted('Old Account');

// Account error
contextAwareNotifications.account.error('Account validation failed');
```

#### Purchase Notifications

```typescript
// Purchase created
contextAwareNotifications.purchase.created('Laptop');

// Purchase updated
contextAwareNotifications.purchase.updated('Office Chair');

// Purchase completed
contextAwareNotifications.purchase.completed('Desk Setup');

// Purchase error
contextAwareNotifications.purchase.error('Price validation failed');
```

### Smart Notification Manager

**Description:** Intelligent notification system with priority queuing and spam prevention.

```typescript
import { notificationManager } from './lib/notifications';

// Add notifications with priority
notificationManager.addToQueue('success', 'High priority message', 'Description', 5);
notificationManager.addToQueue('info', 'Low priority message', 'Description', 1);

// Smart notifications (prevents duplicates)
notificationManager.smartNotify('warning', 'This message will only show once every 5 seconds');

// Clear all notifications
notificationManager.clearAll();
```

### Database Notifications

#### `createNotification(userId: string, title: string, type?: NotificationType, body?: string, shouldShowToast?: boolean)`

**Description:** Creates a notification in the database and optionally shows a toast.

**Example:**
```typescript
import { createNotification } from './lib/notifications';

await createNotification(
  'user_123',
  'Account Balance Low',
  'warning',
  'Your checking account balance is below $100',
  true // Show toast notification
);
```

---

## Component Libraries

### Dashboard Components

#### `<StatCard />`

**Description:** Displays financial statistics with currency formatting.

**Props:**
```typescript
interface StatCardProps {
  title: string;
  value: number;
  currency: string;
  change?: number;
  changeType?: 'increase' | 'decrease';
  icon?: React.ReactNode;
}
```

**Example:**
```typescript
<StatCard
  title="Total Balance"
  value={5000.50}
  currency="USD"
  change={150.25}
  changeType="increase"
  icon={<DollarIcon />}
/>
```

#### `<TransactionChart />`

**Description:** Renders transaction data visualization.

**Props:**
```typescript
interface TransactionChartProps {
  data: Transaction[];
  period: 'week' | 'month' | 'year';
  currency: string;
}
```

#### `<AccountsOverview />`

**Description:** Displays account summary with balances.

#### `<RecentTransactions />`

**Description:** Shows recent transaction list with filtering.

### Layout Components

#### `<Sidebar />`

**Description:** Main navigation sidebar component.

#### `<Settings />`

**Description:** Application settings panel.

### Auth Components

#### `<CustomSignUp />`

**Description:** Custom registration component with enhanced validation.

### Common Components

#### `<StickyNote />`

**Description:** Sticky note component for user notes.

#### `<InteractiveBackground />`

**Description:** Animated background component.

---

## Usage Examples

### Complete Transaction Creation Flow

```typescript
import { generateTransactionId, createTransactionMetadata } from './utils/transactionId';
import { formatCurrency } from './utils/currency';
import { showToast, contextAwareNotifications } from './lib/notifications';
import { supabase } from './lib/supabase';

async function createTransaction(transactionData: Omit<Transaction, 'id' | 'transaction_id' | 'created_at'>) {
  try {
    // Generate transaction ID
    const transactionId = generateTransactionId();
    
    // Create metadata
    const metadata = createTransactionMetadata(
      'create',
      'transaction',
      `Created ${transactionData.type} transaction`,
      { amount: transactionData.amount, category: transactionData.category }
    );

    // Prepare transaction object
    const transaction: Partial<Transaction> = {
      ...transactionData,
      transaction_id: transactionId,
      created_at: new Date().toISOString()
    };

    // Save to database
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;

    // Show success notification
    contextAwareNotifications.transaction.created(
      transactionData.amount,
      'USD' // or get from account currency
    );

    // Log metadata for audit trail
    console.log('Transaction created:', metadata);

    return data;
  } catch (error) {
    console.error('Failed to create transaction:', error);
    contextAwareNotifications.transaction.error(error.message);
    throw error;
  }
}
```

### Multi-Currency Balance Display

```typescript
import { formatCurrency, getCurrencySymbol } from './utils/currency';
import { getExchangeRate, calculateConvertedAmount } from './utils/exchangeRate';

interface AccountBalanceProps {
  accounts: Account[];
  preferredCurrency: string;
}

function AccountBalanceDisplay({ accounts, preferredCurrency }: AccountBalanceProps) {
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const calculateTotal = async () => {
      let total = 0;
      
      for (const account of accounts) {
        if (account.currency === preferredCurrency) {
          total += account.calculated_balance;
        } else {
          const rate = await getExchangeRate(account.currency, preferredCurrency);
          const converted = calculateConvertedAmount(
            account.calculated_balance,
            account.currency,
            preferredCurrency,
            rate
          );
          total += converted;
        }
      }
      
      setTotalBalance(total);
    };

    calculateTotal();
  }, [accounts, preferredCurrency]);

  return (
    <div>
      <h2>Total Balance</h2>
      <p>{formatCurrency(totalBalance, preferredCurrency)}</p>
      
      <div>
        {accounts.map(account => (
          <div key={account.id}>
            <span>{account.name}: </span>
            <span>{formatCurrency(account.calculated_balance, account.currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Loading State Management

```typescript
import { useLoading } from './hooks/useLoading';
import { showToast } from './lib/notifications';

function TransactionForm() {
  const { isLoading, wrapAsync } = useLoading();

  const handleSubmit = wrapAsync(async (formData) => {
    const loadingToast = showToast.loading('Creating transaction...');
    
    try {
      const transaction = await createTransaction(formData);
      showToast.dismiss(loadingToast);
      showToast.success('Transaction created successfully');
      return transaction;
    } catch (error) {
      showToast.dismiss(loadingToast);
      showToast.error('Failed to create transaction');
      throw error;
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Transaction'}
      </button>
    </form>
  );
}
```

### Purchase Management with Notifications

```typescript
import { contextAwareNotifications } from './lib/notifications';
import { generateTransactionId } from './utils/transactionId';

async function completePurchase(purchaseId: string, accountId: string) {
  try {
    // Get purchase details
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (!purchase) throw new Error('Purchase not found');

    // Generate transaction ID for the purchase
    const transactionId = generateTransactionId();

    // Update purchase status
    await supabase
      .from('purchases')
      .update({
        status: 'purchased',
        transaction_id: transactionId,
        account_id: accountId,
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    // Create corresponding transaction
    await supabase
      .from('transactions')
      .insert({
        account_id: accountId,
        type: 'expense',
        amount: purchase.price,
        description: `Purchase: ${purchase.item_name}`,
        category: purchase.category,
        date: new Date().toISOString(),
        transaction_id: transactionId,
        user_id: purchase.user_id
      });

    // Show success notification
    contextAwareNotifications.purchase.completed(purchase.item_name);

    return { success: true, transactionId };
  } catch (error) {
    contextAwareNotifications.purchase.error(error.message);
    throw error;
  }
}
```

---

## Error Handling Best Practices

### Transaction ID Validation

```typescript
import { isValidTransactionId } from './utils/transactionId';

function validateTransactionData(data: any) {
  if (data.transaction_id && !isValidTransactionId(data.transaction_id)) {
    throw new Error('Invalid transaction ID format');
  }
  
  // Other validations...
}
```

### Currency Validation

```typescript
import { getSupportedCurrencies, isValidExchangeRate } from './utils/exchangeRate';

function validateCurrencyData(currency: string, exchangeRate?: number) {
  const supportedCurrencies = getSupportedCurrencies();
  
  if (!supportedCurrencies.includes(currency)) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  
  if (exchangeRate && !isValidExchangeRate(exchangeRate)) {
    throw new Error('Invalid exchange rate');
  }
}
```

### Safe Notification Handling

```typescript
import { notificationManager } from './lib/notifications';

function safeNotify(type: ToastType, message: string, description?: string) {
  try {
    notificationManager.smartNotify(type, message, description);
  } catch (error) {
    console.error('Notification error:', error);
    // Fallback to simple alert or console log
    console.log(`${type.toUpperCase()}: ${message}`);
  }
}
```

---

## Contributing

When adding new APIs or components:

1. **Types**: Add TypeScript interfaces to `src/types.ts`
2. **Utilities**: Place utility functions in `src/utils/`
3. **Components**: Organize in feature-based folders under `src/components/`
4. **Hooks**: Add custom hooks to `src/hooks/`
5. **Stores**: Add Zustand stores to `src/stores/`
6. **Documentation**: Update this documentation with new APIs

### Naming Conventions

- **Components**: PascalCase (e.g., `TransactionForm`)
- **Functions**: camelCase (e.g., `generateTransactionId`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `TRANSACTION_TYPES`)
- **Types/Interfaces**: PascalCase (e.g., `Transaction`, `Account`)

### Code Style

- Use TypeScript for all new code
- Include JSDoc comments for public functions
- Add proper error handling and validation
- Use the notification system for user feedback
- Follow the existing patterns for state management

---

This documentation covers all major public APIs, functions, and components in the Finance SaaS Platform. For implementation details, refer to the source code in the respective directories.