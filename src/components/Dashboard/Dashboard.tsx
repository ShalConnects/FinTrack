import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, ArrowRight, Plus, ShoppingCart, Clock, CheckCircle, XCircle, PieChart, LineChart, RefreshCw } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useAuthStore } from '../../store/authStore';
import { StatCard } from './StatCard';
import { TransactionChart } from './TransactionChart';
import { RecentTransactions } from './RecentTransactions';
import { AccountsOverview } from './AccountsOverview';
import { ToDoList } from './ToDoList';
import { PurchaseOverviewAlerts } from './PurchaseOverviewAlerts';
import { formatCurrency } from '../../utils/currency';
import { FloatingActionButton } from '../Layout/FloatingActionButton';
import { TransactionForm } from '../Transactions/TransactionForm';
import { AccountForm } from '../Accounts/AccountForm';
import { TransferModal } from '../Transfers/TransferModal';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LendBorrowSingleReminder } from './LendBorrowSingleReminder';
import { LendBorrowSummaryCard } from './LendBorrowSummaryCard';
import { CurrencyOverviewCard } from './CurrencyOverviewCard';
import { DonationSavingsCard } from './DonationSavingsCard';
import { StickyNote } from '../StickyNote';
import { NotesAndTodosWidget } from './NotesAndTodosWidget';
import { PurchaseForm } from '../Purchases/PurchaseForm';
import { useLoadingContext } from '../../context/LoadingContext';
import { SkeletonCard, SkeletonChart } from '../common/Skeleton';

interface DashboardProps {
  onViewChange: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onViewChange }) => {
  const { 
    getDashboardStats, 
    getActiveAccounts, 
    getActiveTransactions, 
    showTransactionForm, 
    showAccountForm, 
    showTransferModal, 
    setShowTransactionForm, 
    setShowAccountForm, 
    setShowTransferModal,
    loading,
    showPurchaseForm,
    setShowPurchaseForm,
    purchaseCategories,
    accounts,
    addPurchase,
    fetchTransactions,
    fetchAccounts,
    fetchDonationSavingRecords
  } = useFinanceStore();
  
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  
  const { user } = useAuthStore();
  console.log('Dashboard: Current user:', user);
  console.log('Dashboard: showAccountForm state:', showAccountForm);
  
  const stats = getDashboardStats();
  const activeAccounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const allTransactions = useFinanceStore((state) => state.transactions); // Get all transactions, not just active ones
  
  // Debug logging for currency card issue
  console.log('Dashboard Debug:', {
    totalTransactions: transactions.length,
    totalAllTransactions: allTransactions.length,
    incomeTransactions: transactions.filter(t => t.type === 'income').length,
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    recentTransactions: transactions
      .filter(t => t.type === 'income')
      .slice(0, 3)
      .map(t => ({
        date: t.date,
        amount: t.amount,
        description: t.description
      })),
    allTransactions: transactions.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      type: t.type,
      description: t.description,
      account_id: t.account_id
    })),
    stats: stats
  });
  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get purchase analytics
  const purchaseAnalytics = useFinanceStore((state) => state.getMultiCurrencyPurchaseAnalytics());
  const purchases = useFinanceStore((state) => state.purchases);
  
  // Calculate purchase overview stats
  const totalPlannedPurchases = purchases.filter(p => p.status === 'planned').length;
  const totalPurchasedItems = purchases.filter(p => p.status === 'purchased').length;
  const totalCancelledItems = purchases.filter(p => p.status === 'cancelled').length;
  const totalPlannedValue = purchases
    .filter(p => p.status === 'planned')
    .reduce((sum, p) => sum + p.price, 0);
  const recentPurchases = purchases
    .filter(p => p.status === 'purchased')
    .sort((a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime())
    .slice(0, 5);

  // Fetch purchases data when dashboard loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        await useFinanceStore.getState().fetchPurchases();
      } catch (error) {
        console.error('Error fetching purchases:', error);
      }
    };
    fetchData();
  }, []);

  // Initial data fetch when dashboard loads
  useEffect(() => {
    const refreshData = async () => {
      try {
        setLoadingMessage('Loading dashboard data...'); // Show loading message for data fetch
        console.log('Dashboard: Starting data refresh...');
        await Promise.all([
          fetchTransactions(),
          fetchAccounts(),
          fetchDonationSavingRecords()
        ]);
        console.log('Dashboard: Data refresh completed');
      } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        // Don't let errors break the dashboard
      }
    };
    
    // Only fetch data once when component mounts
    refreshData();
  }, [fetchTransactions, fetchAccounts, fetchDonationSavingRecords, setLoadingMessage]);

  // Auto refresh removed - data will only be fetched on component mount

  // Manual refresh function - wrapped with loading state
  const handleManualRefresh = wrapAsync(async () => {
    setLoadingMessage('Refreshing data...'); // Show loading message for manual refresh
    await Promise.all([
      fetchTransactions(),
      fetchAccounts(),
      fetchDonationSavingRecords()
    ]);
  });

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);

  // Use the raw accounts array from the store
  const rawAccounts = useFinanceStore((state) => state.accounts);
  const hasAnyAccount = rawAccounts && rawAccounts.length > 0;
  
  // Debug logging for accounts and stats
  console.log('Dashboard Accounts Debug:', {
    hasAnyAccount: hasAnyAccount,
    rawAccounts: rawAccounts,
    stats: stats,
    statsByCurrency: stats?.byCurrency
  });

  // Calculate spending breakdown data for pie chart
  const getSpendingBreakdown = () => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    
    const expenses = transactions.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) >= last30Days &&
      !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'))
    );

    const categoryTotals = expenses.reduce((acc, transaction) => {
      const category = transaction.category || 'Other';
      acc[category] = (acc[category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    }));
  };

  // Calculate monthly trends data for line chart
  const getMonthlyTrends = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income' && !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense' && !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
        .reduce((sum, t) => sum + t.amount, 0);
      
      months.push({
        month: monthName,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100
      });
    }
    
    return months;
  };

  const spendingData = getSpendingBreakdown();
  const trendsData = getMonthlyTrends();
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B6B'];

  const [submittingPurchase, setSubmittingPurchase] = React.useState(false);
  const handlePurchaseSubmit = async (data: any) => {
    setSubmittingPurchase(true);
    try {
      await addPurchase(data);
      setShowPurchaseForm(false);
    } finally {
      setSubmittingPurchase(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex">
          {/* Main Content - Skeleton Loading */}
          <div className="flex-1 pr-6 space-y-6">
            {/* Currency Sections Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard className="h-48" />
              <SkeletonCard className="h-48" />
            </div>

            {/* Purchase Overview & Lend & Borrow Summary Row Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonCard className="h-64" />
              <SkeletonCard className="h-64" />
            </div>

            {/* Recent Transactions Skeleton */}
            <SkeletonCard className="h-80" />
          </div>

          {/* Right Sidebar Skeleton */}
          <div className="w-72 space-y-6">
            <SkeletonCard className="h-96" />
          </div>
        </div>
        
        {/* Modals */}
        {showTransactionForm && (
          <TransactionForm onClose={() => setShowTransactionForm(false)} />
        )}

        {showAccountForm && (
          <AccountForm isOpen={showAccountForm} onClose={() => {
            console.log('AccountForm onClose called');
            setShowAccountForm(false);
          }} />
        )}

        {showTransferModal && (
          <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
        )}
      </>
    );
  }

  if (!hasAnyAccount) {
    console.log('Dashboard: No accounts found, showing Add Account button');
    return (
      <>
      <div className="flex flex-col items-center justify-center h-full py-16">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('dashboard.welcome')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No data available. Please activate your account or add an account.</p>
          <button
            className="mt-4 px-6 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors font-semibold"
            onClick={() => {
              console.log('Add Account button clicked');
              setShowAccountForm(true);
            }}
          >
            {t('dashboard.addAccount')}
          </button>
          <FloatingActionButton />
        </div>
        
        {/* Modals */}
        {showTransactionForm && (
          <TransactionForm onClose={() => setShowTransactionForm(false)} />
        )}

        {showAccountForm && (
          <AccountForm isOpen={showAccountForm} onClose={() => {
            console.log('AccountForm onClose called');
            setShowAccountForm(false);
          }} />
        )}

        {showTransferModal && (
          <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
        )}
      </>
    );
  }

  if (!stats || !stats.byCurrency || stats.byCurrency.length === 0) {
    console.log('Dashboard: No stats available, showing fallback UI');
    return (
      <>
        <div className="flex flex-col items-center justify-center h-full py-16">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{t('dashboard.welcome')}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No data available. Please activate your account from{' '}
            <Link to="/dashboard/accounts" className="text-blue-600 underline hover:text-blue-800">{t('dashboard.accounts')}</Link> page.
          </p>
        <FloatingActionButton />
      </div>
        
        {/* Modals */}
        {showTransactionForm && (
          <TransactionForm onClose={() => setShowTransactionForm(false)} />
        )}

        {showAccountForm && (
          <AccountForm isOpen={showAccountForm} onClose={() => {
            console.log('AccountForm onClose called');
            setShowAccountForm(false);
          }} />
        )}

        {showTransferModal && (
          <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 pr-6 space-y-6">
        {/* --- New Dashboard Widgets Top Row --- */}
        {/* Removed all summary cards from the top row as requested */}
        {/* --- End Dashboard Widgets Top Row --- */}

        {/* Currency Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.byCurrency.map(({ currency }) => (
            <CurrencyOverviewCard
              key={currency}
              currency={currency}
              transactions={allTransactions}
              accounts={rawAccounts}
              t={t}
              formatCurrency={formatCurrency}
            />
          ))}
          <DonationSavingsCard
            t={t}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Donation & Savings Card */}
        {/* Removed the extra grid wrapper around DonationSavingsCard */}

        {/* Purchase Overview & Lend & Borrow Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purchase Overview */}
          {purchases.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Purchase Overview</h2>
                <Link 
                  to="/dashboard/purchases" 
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              {/* Purchase Stats Cards */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <StatCard
                  title="Planned Purchases"
                  value={totalPlannedPurchases.toString()}
                  color="yellow"
                />
                <StatCard
                  title="Purchased Items"
                  value={totalPurchasedItems.toString()}
                  trend="up"
                  color="red"
                />
              </div>
              {/* Removed Smart Purchase Alerts block as it's now handled by the Urgent sidebar */}
            </div>
          )}
          {/* Lend & Borrow Summary Card */}
          <LendBorrowSummaryCard />
        </div>
        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('dashboard.recentTransactions')}</h2>
            <Link 
              to="/dashboard/transactions" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <RecentTransactions />
        </div>
        {/* Lend & Borrow Reminders Card */}
      </div>

      {/* Right Sidebar */}
      <div className="w-72 space-y-6">
        {/* --- New Dashboard Widgets Sidebar --- */}
        {/* Removed all summary cards from the sidebar as requested */}
        {/* --- End Dashboard Widgets Sidebar --- */}
        <NotesAndTodosWidget />
      </div>

      <FloatingActionButton />
    </div>
  );
};

// Add fade-in animation to global styles (tailwind.config.js or index.css):
// .animate-fadein { animation: fadein 0.8s cubic-bezier(0.4,0,0.2,1) both; }
// @keyframes fadein { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }