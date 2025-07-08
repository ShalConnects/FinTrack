import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, Banknote, ArrowRight, Plus } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { StatCard } from './StatCard';
import { TransactionChart } from './TransactionChart';
import { RecentTransactions } from './RecentTransactions';
import { AccountsOverview } from './AccountsOverview';
import { ToDoList } from './ToDoList';
import { formatCurrency } from '../../utils/currency';
import { FloatingActionButton } from '../Layout/FloatingActionButton';
import { TransactionForm } from '../Transactions/TransactionForm';
import { AccountForm } from '../Accounts/AccountForm';
import { TransferModal } from '../Transfers/TransferModal';
import { useNavigate } from 'react-router-dom';

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
    setShowTransferModal
  } = useFinanceStore();
  
  const stats = getDashboardStats();
  const accounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  const [selectedCurrency, setSelectedCurrency] = useState(stats.byCurrency[0]?.currency || 'USD');
  const navigate = useNavigate();

  // Calculate total income and expenses
  const totalIncome = transactions
    .filter(t => t.type === 'income' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && !t.tags?.some((tag: string) => tag.includes('transfer') || tag.includes('dps_transfer')))
    .reduce((sum, t) => sum + t.amount, 0);

  if (!stats || !stats.byCurrency || stats.byCurrency.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to your Dashboard!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">No data available. Please check your connection.</p>
        <FloatingActionButton />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Welcome to your Dashboard!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">No active accounts found. Please add or activate an account to get started.</p>
        <div className="w-full max-w-xl mt-8">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg h-48 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <span>No data to display</span>
          </div>
        </div>
        <FloatingActionButton />
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="flex-1 pr-6 space-y-6">
        {/* Currency Sections */}
        {stats.byCurrency.map(({ currency, balance, monthlyIncome, monthlyExpenses }) => (
          <div key={currency} className="bg-white dark:bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">{currency} Overview</h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                title={`Total Balance`}
                value={formatCurrency(balance, currency)}
                icon={<Wallet className="w-5 h-5 text-blue-600" />}
                trend={balance >= 0 ? 'up' : 'down'}
                color="blue"
              />
              <StatCard
                title={`Monthly Income`}
                value={formatCurrency(monthlyIncome, currency)}
                icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                trend="up"
                color="green"
              />
              <StatCard
                title={`Monthly Expenses`}
                value={formatCurrency(monthlyExpenses, currency)}
                icon={<TrendingDown className="w-5 h-5 text-red-600" />}
                trend="down"
                color="red"
              />
            </div>
          </div>
        ))}

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Recent Transactions</h2>
          <RecentTransactions />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-72">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
          <ToDoList 
            renderHeader={(showAllTasks, taskCount) => (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">To Do List</h2>
                <button
                  onClick={showAllTasks}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>View All Tasks ({taskCount})</span>
                </button>
              </div>
            )}
          />
        </div>
      </div>

      <FloatingActionButton />

      {showTransactionForm && (
        <TransactionForm onClose={() => setShowTransactionForm(false)} />
      )}

      {showAccountForm && (
        <AccountForm isOpen={showAccountForm} onClose={() => setShowAccountForm(false)} />
      )}

      {showTransferModal && (
        <TransferModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} />
      )}
    </div>
  );
};

// Add fade-in animation to global styles (tailwind.config.js or index.css):
// .animate-fadein { animation: fadein 0.8s cubic-bezier(0.4,0,0.2,1) both; }
// @keyframes fadein { from { opacity: 0; transform: translateY(24px);} to { opacity: 1; transform: none; } }