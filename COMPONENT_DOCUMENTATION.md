# Component Documentation - Finance SaaS Platform

## Table of Contents

1. [Dashboard Components](#dashboard-components)
2. [Transaction Components](#transaction-components)
3. [Account Components](#account-components)
4. [Purchase Management Components](#purchase-management-components)
5. [Layout & Navigation Components](#layout--navigation-components)
6. [Authentication Components](#authentication-components)
7. [Notification Components](#notification-components)
8. [Common UI Components](#common-ui-components)
9. [Forms & Input Components](#forms--input-components)
10. [Component Composition Patterns](#component-composition-patterns)

---

## Dashboard Components

### `<Dashboard />`

**Location:** `src/pages/Dashboard.tsx`  
**Description:** Main dashboard page component that displays financial overview.

**Props:**
```typescript
interface DashboardProps {
  // No external props - uses internal state and context
}
```

**Usage:**
```typescript
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}
```

### `<StatCard />`

**Location:** `src/components/Dashboard/StatCard.tsx`  
**Description:** Displays financial statistics with formatting and optional change indicators.

**Props:**
```typescript
interface StatCardProps {
  title: string;
  value: number;
  currency?: string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}
```

**Usage:**
```typescript
import StatCard from './components/Dashboard/StatCard';
import { DollarSign, TrendingUp } from 'lucide-react';

function DashboardOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        title="Total Balance"
        value={15750.50}
        currency="USD"
        change={250.00}
        changeType="increase"
        icon={<DollarSign className="w-6 h-6" />}
        onClick={() => navigate('/accounts')}
      />
      
      <StatCard
        title="Monthly Income"
        value={4200.00}
        currency="USD"
        change={-150.00}
        changeType="decrease"
        icon={<TrendingUp className="w-6 h-6" />}
      />
      
      <StatCard
        title="Pending Purchases"
        value={850.75}
        currency="USD"
        loading={isLoading}
      />
    </div>
  );
}
```

### `<CurrencyOverviewCard />`

**Location:** `src/components/Dashboard/CurrencyOverviewCard.tsx`  
**Description:** Displays currency-specific financial overview with conversion capabilities.

**Props:**
```typescript
interface CurrencyOverviewCardProps {
  currency: string;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  accounts: Account[];
  showConversion?: boolean;
  preferredCurrency?: string;
}
```

**Usage:**
```typescript
import CurrencyOverviewCard from './components/Dashboard/CurrencyOverviewCard';

function MultiCurrencyDashboard({ currencyStats }: { currencyStats: CurrencyDashboardStats[] }) {
  return (
    <div className="space-y-4">
      {currencyStats.map(stats => (
        <CurrencyOverviewCard
          key={stats.currency}
          currency={stats.currency}
          balance={stats.balance}
          monthlyIncome={stats.monthlyIncome}
          monthlyExpenses={stats.monthlyExpenses}
          accounts={accountsForCurrency}
          showConversion={true}
          preferredCurrency="USD"
        />
      ))}
    </div>
  );
}
```

### `<TransactionChart />`

**Location:** `src/components/Dashboard/TransactionChart.tsx`  
**Description:** Renders interactive charts for transaction data visualization.

**Props:**
```typescript
interface TransactionChartProps {
  data: Transaction[];
  chartType: 'line' | 'bar' | 'pie' | 'area';
  period: 'week' | 'month' | 'quarter' | 'year';
  groupBy: 'date' | 'category' | 'type';
  currency: string;
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
}
```

**Usage:**
```typescript
import TransactionChart from './components/Dashboard/TransactionChart';

function AnalyticsPage({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <TransactionChart
        data={transactions}
        chartType="line"
        period="month"
        groupBy="date"
        currency="USD"
        height={300}
        showLegend={true}
        interactive={true}
      />
      
      <TransactionChart
        data={transactions}
        chartType="pie"
        period="month"
        groupBy="category"
        currency="USD"
        height={300}
      />
    </div>
  );
}
```

### `<RecentTransactions />`

**Location:** `src/components/Dashboard/RecentTransactions.tsx`  
**Description:** Displays a list of recent transactions with quick actions.

**Props:**
```typescript
interface RecentTransactionsProps {
  limit?: number;
  showActions?: boolean;
  onTransactionClick?: (transaction: Transaction) => void;
  onEditTransaction?: (transaction: Transaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
  filter?: {
    type?: 'income' | 'expense';
    category?: string;
    accountId?: string;
  };
}
```

**Usage:**
```typescript
import RecentTransactions from './components/Dashboard/RecentTransactions';

function DashboardSidebar() {
  const handleTransactionClick = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}`);
  };

  return (
    <div className="space-y-6">
      <RecentTransactions
        limit={5}
        showActions={true}
        onTransactionClick={handleTransactionClick}
        onEditTransaction={openEditModal}
        filter={{ type: 'expense' }}
      />
    </div>
  );
}
```

---

## Transaction Components

### `<TransactionForm />`

**Description:** Form component for creating and editing transactions.

**Props:**
```typescript
interface TransactionFormProps {
  transaction?: Transaction; // For editing
  accounts: Account[];
  categories: Category[];
  onSubmit: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  defaultValues?: Partial<Transaction>;
}
```

**Usage:**
```typescript
import TransactionForm from './components/Transactions/TransactionForm';

function CreateTransactionModal({ isOpen, onClose }: ModalProps) {
  const { accounts } = useAccountsStore();
  const { categories } = useCategoriesStore();

  const handleSubmit = async (transactionData) => {
    try {
      await createTransaction(transactionData);
      showToast.success('Transaction created successfully');
      onClose();
    } catch (error) {
      showToast.error('Failed to create transaction');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TransactionForm
        accounts={accounts}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={onClose}
        defaultValues={{
          type: 'expense',
          date: new Date().toISOString().split('T')[0]
        }}
      />
    </Modal>
  );
}
```

### `<TransactionList />`

**Description:** Displays a filterable and sortable list of transactions.

**Props:**
```typescript
interface TransactionListProps {
  transactions: Transaction[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  filters?: TransactionFilters;
  onFilterChange?: (filters: TransactionFilters) => void;
  onTransactionEdit?: (transaction: Transaction) => void;
  onTransactionDelete?: (transactionId: string) => void;
  selectable?: boolean;
  selectedTransactions?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}
```

**Usage:**
```typescript
import TransactionList from './components/Transactions/TransactionList';

function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });

  return (
    <div className="space-y-4">
      <TransactionList
        transactions={transactions}
        loading={isLoading}
        pagination={{
          ...pagination,
          onPageChange: (page) => setPagination(prev => ({ ...prev, page }))
        }}
        filters={filters}
        onFilterChange={setFilters}
        onTransactionEdit={openEditModal}
        onTransactionDelete={handleDelete}
        selectable={true}
        selectedTransactions={selectedTransactionIds}
        onSelectionChange={setSelectedTransactionIds}
      />
    </div>
  );
}
```

### `<TransactionDetails />`

**Description:** Detailed view of a single transaction with edit capabilities.

**Props:**
```typescript
interface TransactionDetailsProps {
  transaction: Transaction;
  account?: Account;
  editable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  showMetadata?: boolean;
}
```

---

## Account Components

### `<AccountManagement />`

**Location:** `src/components/Dashboard/AccountManagement.tsx`  
**Description:** Comprehensive account management interface.

**Props:**
```typescript
interface AccountManagementProps {
  accounts: Account[];
  onAccountCreate: (account: Omit<Account, 'id' | 'created_at'>) => Promise<void>;
  onAccountUpdate: (id: string, updates: Partial<Account>) => Promise<void>;
  onAccountDelete: (id: string) => Promise<void>;
  onAccountTransfer: (transfer: TransferRequest) => Promise<void>;
}
```

**Usage:**
```typescript
import AccountManagement from './components/Dashboard/AccountManagement';

function AccountsPage() {
  const { accounts, createAccount, updateAccount, deleteAccount } = useAccountsStore();

  const handleTransfer = async (transfer: TransferRequest) => {
    try {
      await processTransfer(transfer);
      showToast.success('Transfer completed successfully');
    } catch (error) {
      showToast.error('Transfer failed');
    }
  };

  return (
    <AccountManagement
      accounts={accounts}
      onAccountCreate={createAccount}
      onAccountUpdate={updateAccount}
      onAccountDelete={deleteAccount}
      onAccountTransfer={handleTransfer}
    />
  );
}
```

### `<AccountForm />`

**Description:** Form for creating and editing accounts.

**Props:**
```typescript
interface AccountFormProps {
  account?: Account; // For editing
  onSubmit: (account: Omit<Account, 'id' | 'created_at'>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  supportedCurrencies: string[];
  accountTypes: AccountType[];
}
```

### `<AccountCard />`

**Description:** Card component displaying account summary.

**Props:**
```typescript
interface AccountCardProps {
  account: Account;
  showBalance?: boolean;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onViewTransactions?: () => void;
  compact?: boolean;
}
```

**Usage:**
```typescript
import AccountCard from './components/Accounts/AccountCard';

function AccountsGrid({ accounts }: { accounts: Account[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map(account => (
        <AccountCard
          key={account.id}
          account={account}
          showBalance={true}
          showActions={true}
          onEdit={() => openEditModal(account)}
          onDelete={() => handleDelete(account.id)}
          onViewTransactions={() => navigate(`/transactions?account=${account.id}`)}
        />
      ))}
    </div>
  );
}
```

---

## Purchase Management Components

### `<PurchaseForm />`

**Description:** Form for creating and editing purchases.

**Props:**
```typescript
interface PurchaseFormProps {
  purchase?: Purchase; // For editing
  accounts: Account[];
  categories: PurchaseCategory[];
  onSubmit: (purchase: Omit<Purchase, 'id' | 'created_at'>) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  allowFileAttachments?: boolean;
}
```

**Usage:**
```typescript
import PurchaseForm from './components/Purchases/PurchaseForm';

function AddPurchaseModal({ isOpen, onClose }: ModalProps) {
  const { accounts } = useAccountsStore();
  const { purchaseCategories } = usePurchasesStore();

  const handleSubmit = async (purchaseData) => {
    try {
      await createPurchase(purchaseData);
      contextAwareNotifications.purchase.created(purchaseData.item_name);
      onClose();
    } catch (error) {
      contextAwareNotifications.purchase.error(error.message);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Purchase">
      <PurchaseForm
        accounts={accounts}
        categories={purchaseCategories}
        onSubmit={handleSubmit}
        onCancel={onClose}
        allowFileAttachments={true}
      />
    </Modal>
  );
}
```

### `<PurchaseList />`

**Description:** Displays purchases with filtering and status management.

**Props:**
```typescript
interface PurchaseListProps {
  purchases: Purchase[];
  loading?: boolean;
  groupBy?: 'status' | 'category' | 'priority' | 'date';
  showActions?: boolean;
  onStatusChange?: (purchaseId: string, status: Purchase['status']) => void;
  onEdit?: (purchase: Purchase) => void;
  onDelete?: (purchaseId: string) => void;
  onComplete?: (purchaseId: string, accountId: string) => void;
}
```

### `<PurchaseAnalytics />`

**Description:** Analytics dashboard for purchase data.

**Props:**
```typescript
interface PurchaseAnalyticsProps {
  data: MultiCurrencyPurchaseAnalytics;
  period: 'month' | 'quarter' | 'year';
  currency?: string;
  showBreakdown?: boolean;
}
```

---

## Layout & Navigation Components

### `<Sidebar />`

**Location:** `src/components/Dashboard/Sidebar.tsx`  
**Description:** Main navigation sidebar with active state management.

**Props:**
```typescript
interface SidebarProps {
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  activeRoute?: string;
  userRole?: 'admin' | 'user';
}
```

**Usage:**
```typescript
import Sidebar from './components/Layout/Sidebar';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
        activeRoute={location.pathname}
      />
      
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        {children}
      </main>
    </div>
  );
}
```

### `<Header />`

**Description:** Application header with user menu and notifications.

**Props:**
```typescript
interface HeaderProps {
  user?: User;
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogout?: () => void;
}
```

### `<BreadcrumbNavigation />`

**Description:** Breadcrumb navigation component.

**Props:**
```typescript
interface BreadcrumbNavigationProps {
  items: Array<{
    label: string;
    href?: string;
    active?: boolean;
  }>;
  separator?: React.ReactNode;
}
```

---

## Authentication Components

### `<CustomSignUp />`

**Location:** `src/components/CustomSignUp.tsx`  
**Description:** Enhanced registration component with validation.

**Props:**
```typescript
interface CustomSignUpProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  requireEmailVerification?: boolean;
}
```

**Usage:**
```typescript
import CustomSignUp from './components/Auth/CustomSignUp';

function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = (user: User) => {
    showToast.success('Account created successfully!');
    navigate('/dashboard');
  };

  const handleError = (error: string) => {
    showToast.error(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <CustomSignUp
        onSuccess={handleSuccess}
        onError={handleError}
        redirectTo="/dashboard"
        requireEmailVerification={true}
      />
    </div>
  );
}
```

### `<LoginForm />`

**Description:** Login form with enhanced security features.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
  onForgotPassword?: () => void;
  rememberMe?: boolean;
  socialLogin?: boolean;
}
```

### `<ProtectedRoute />`

**Description:** Route protection component.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  fallback?: React.ReactNode;
}
```

**Usage:**
```typescript
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminPanel />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
```

---

## Notification Components

### `<UrgentNotifications />`

**Location:** `src/components/Dashboard/UrgentNotifications.tsx`  
**Description:** Displays urgent system notifications and alerts.

**Props:**
```typescript
interface UrgentNotificationsProps {
  notifications: UrgentNotification[];
  onDismiss?: (notificationId: string) => void;
  onAction?: (notificationId: string, action: string) => void;
  maxVisible?: number;
  autoHide?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}
```

**Usage:**
```typescript
import UrgentNotifications from './components/Dashboard/UrgentNotifications';

function App() {
  const { urgentNotifications, dismissNotification } = useNotificationsStore();

  return (
    <div className="app">
      <UrgentNotifications
        notifications={urgentNotifications}
        onDismiss={dismissNotification}
        maxVisible={3}
        autoHide={false}
        position="top-right"
      />
      
      {/* Rest of your app */}
    </div>
  );
}
```

### `<NotificationCenter />`

**Description:** Central notification management interface.

**Props:**
```typescript
interface NotificationCenterProps {
  notifications: Notification[];
  loading?: boolean;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (notificationId: string) => void;
  onClearAll?: () => void;
  groupBy?: 'date' | 'type' | 'priority';
}
```

---

## Common UI Components

### `<StickyNote />`

**Location:** `src/components/StickyNote.tsx`  
**Description:** Customizable sticky note component for user notes.

**Props:**
```typescript
interface StickyNoteProps {
  content: string;
  onContentChange?: (content: string) => void;
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'purple';
  editable?: boolean;
  onDelete?: () => void;
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  draggable?: boolean;
}
```

**Usage:**
```typescript
import StickyNote from './components/StickyNote';

function NotesWidget() {
  const [notes, setNotes] = useState([
    { id: '1', content: 'Remember to pay utilities', color: 'yellow', position: { x: 100, y: 100 } },
    { id: '2', content: 'Budget review meeting', color: 'blue', position: { x: 300, y: 150 } }
  ]);

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...updates } : note
    ));
  };

  return (
    <div className="relative w-full h-96 bg-gray-50 rounded-lg">
      {notes.map(note => (
        <StickyNote
          key={note.id}
          content={note.content}
          color={note.color}
          position={note.position}
          editable={true}
          draggable={true}
          onContentChange={(content) => updateNote(note.id, { content })}
          onPositionChange={(position) => updateNote(note.id, { position })}
          onDelete={() => setNotes(prev => prev.filter(n => n.id !== note.id))}
        />
      ))}
    </div>
  );
}
```

### `<InteractiveBackground />`

**Location:** `src/components/InteractiveBackground.tsx`  
**Description:** Animated background component with interactive elements.

**Props:**
```typescript
interface InteractiveBackgroundProps {
  variant?: 'particles' | 'waves' | 'geometric';
  color?: string;
  intensity?: 'low' | 'medium' | 'high';
  interactive?: boolean;
  className?: string;
}
```

### `<LoadingSpinner />`

**Description:** Customizable loading spinner component.

**Props:**
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  text?: string;
  overlay?: boolean;
}
```

### `<EmptyState />`

**Description:** Empty state component for lists and data views.

**Props:**
```typescript
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

**Usage:**
```typescript
import EmptyState from './components/EmptyState';
import { Plus, Receipt } from 'lucide-react';

function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions found"
        description="Start tracking your finances by adding your first transaction."
        icon={<Receipt className="w-12 h-12 text-gray-400" />}
        action={{
          label: "Add Transaction",
          onClick: () => openTransactionModal()
        }}
      />
    );
  }

  return (
    <div>
      {/* Render transactions */}
    </div>
  );
}
```

---

## Forms & Input Components

### `<CurrencyInput />`

**Description:** Specialized input for currency amounts with formatting.

**Props:**
```typescript
interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  currency: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  max?: number;
  min?: number;
}
```

**Usage:**
```typescript
import CurrencyInput from './components/Forms/CurrencyInput';

function TransactionForm() {
  const [amount, setAmount] = useState(0);
  
  return (
    <form>
      <CurrencyInput
        value={amount}
        onChange={setAmount}
        currency="USD"
        placeholder="Enter amount"
        min={0}
        max={999999}
      />
    </form>
  );
}
```

### `<DateRangePicker />`

**Description:** Date range picker for filtering and reporting.

**Props:**
```typescript
interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  presets?: Array<{
    label: string;
    getValue: () => [Date, Date];
  }>;
  maxDate?: Date;
  minDate?: Date;
}
```

### `<CategorySelect />`

**Description:** Searchable category selection component.

**Props:**
```typescript
interface CategorySelectProps {
  categories: Category[];
  value?: string;
  onChange: (categoryId: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
  onCreateCategory?: (name: string) => Promise<Category>;
}
```

---

## Component Composition Patterns

### Higher-Order Components (HOCs)

#### `withLoading(Component)`

**Description:** HOC that adds loading state management to any component.

**Usage:**
```typescript
import { withLoading } from './hocs/withLoading';

const TransactionFormWithLoading = withLoading(TransactionForm);

function MyComponent() {
  return (
    <TransactionFormWithLoading
      loading={isSubmitting}
      onSubmit={handleSubmit}
      // ... other props
    />
  );
}
```

#### `withNotifications(Component)`

**Description:** HOC that provides notification functionality to components.

### Compound Components

#### `<Modal />` with sub-components

**Usage:**
```typescript
import Modal from './components/Modal';

function EditAccountModal({ account, isOpen, onClose }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <Modal.Title>Edit Account</Modal.Title>
        <Modal.CloseButton />
      </Modal.Header>
      
      <Modal.Body>
        <AccountForm account={account} onSubmit={handleSubmit} />
      </Modal.Body>
      
      <Modal.Footer>
        <Modal.CancelButton onClick={onClose}>Cancel</Modal.CancelButton>
        <Modal.ConfirmButton onClick={handleSubmit}>Save Changes</Modal.ConfirmButton>
      </Modal.Footer>
    </Modal>
  );
}
```

### Render Props Pattern

#### `<DataFetcher />` component

**Usage:**
```typescript
import DataFetcher from './components/DataFetcher';

function TransactionsPage() {
  return (
    <DataFetcher
      url="/api/transactions"
      params={{ userId: currentUser.id }}
    >
      {({ data: transactions, loading, error, refetch }) => (
        <div>
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage error={error} />}
          {transactions && (
            <TransactionList 
              transactions={transactions} 
              onRefresh={refetch}
            />
          )}
        </div>
      )}
    </DataFetcher>
  );
}
```

### Custom Hooks for Component Logic

#### `useComponentState`

**Usage:**
```typescript
import { useComponentState } from './hooks/useComponentState';

function ComplexForm() {
  const {
    state,
    actions: { updateField, validate, reset, submit },
    computed: { isValid, isDirty, errors }
  } = useComponentState({
    initialValues: { name: '', amount: 0 },
    validation: formValidationSchema,
    onSubmit: handleFormSubmit
  });

  return (
    <form onSubmit={submit}>
      <input
        value={state.name}
        onChange={(e) => updateField('name', e.target.value)}
      />
      {errors.name && <span className="error">{errors.name}</span>}
      
      <button type="submit" disabled={!isValid}>
        Submit
      </button>
    </form>
  );
}
```

---

## Best Practices

### Component Organization

1. **Feature-based folder structure:**
   ```
   src/components/
   ├── Dashboard/
   │   ├── StatCard.tsx
   │   ├── TransactionChart.tsx
   │   └── index.ts
   ├── Transactions/
   │   ├── TransactionForm.tsx
   │   ├── TransactionList.tsx
   │   └── index.ts
   └── common/
       ├── LoadingSpinner.tsx
       ├── Modal.tsx
       └── index.ts
   ```

2. **Export patterns:**
   ```typescript
   // components/Dashboard/index.ts
   export { default as StatCard } from './StatCard';
   export { default as TransactionChart } from './TransactionChart';
   export { default as RecentTransactions } from './RecentTransactions';
   ```

### Performance Optimization

1. **Memoization:**
   ```typescript
   import { memo, useMemo, useCallback } from 'react';
   
   const ExpensiveComponent = memo(({ data, onAction }) => {
     const processedData = useMemo(() => {
       return data.map(item => ({ ...item, computed: expensiveCalculation(item) }));
     }, [data]);
   
     const memoizedAction = useCallback((id) => {
       onAction(id);
     }, [onAction]);
   
     return (
       <div>
         {processedData.map(item => (
           <Item key={item.id} data={item} onAction={memoizedAction} />
         ))}
       </div>
     );
   });
   ```

2. **Lazy loading:**
   ```typescript
   import { lazy, Suspense } from 'react';
   
   const LazyDashboard = lazy(() => import('./components/Dashboard'));
   
   function App() {
     return (
       <Suspense fallback={<LoadingSpinner />}>
         <LazyDashboard />
       </Suspense>
     );
   }
   ```

### Error Handling

1. **Error boundaries:**
   ```typescript
   class ComponentErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
   
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
   
     componentDidCatch(error, errorInfo) {
       console.error('Component error:', error, errorInfo);
       // Send to error reporting service
     }
   
     render() {
       if (this.state.hasError) {
         return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
       }
   
       return this.props.children;
     }
   }
   ```

2. **Error handling in components:**
   ```typescript
   function TransactionForm() {
     const [error, setError] = useState(null);
   
     const handleSubmit = async (data) => {
       try {
         setError(null);
         await createTransaction(data);
       } catch (err) {
         setError(err.message);
         contextAwareNotifications.transaction.error(err.message);
       }
     };
   
     return (
       <form onSubmit={handleSubmit}>
         {error && <ErrorMessage message={error} />}
         {/* Form fields */}
       </form>
     );
   }
   ```

This comprehensive component documentation provides detailed information about all the React components in the Finance SaaS Platform, including their props, usage patterns, and best practices for implementation.