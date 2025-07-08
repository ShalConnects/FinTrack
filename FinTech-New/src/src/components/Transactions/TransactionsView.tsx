import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Search, TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { TransactionForm } from './TransactionForm';
import { TransactionList } from './TransactionList';

export const TransactionsView: React.FC = () => {
  const { transactions, accounts, categories, loading, error, globalSearchTerm } = useFinanceStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                         (transaction.tags || []).some(tag => tag.toLowerCase().includes(globalSearchTerm.toLowerCase()));
    
    const isTransfer = transaction.tags?.includes('transfer');
    const matchesType = filterType === 'all' || (!isTransfer && transaction.type === filterType);
    const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;
    const matchesAccount = filterAccount === 'all' || transaction.account_id === filterAccount;

    return matchesSearch && matchesType && matchesCategory && matchesAccount && !isTransfer;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income' && !t.tags?.includes('transfer'))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = Math.abs(filteredTransactions
    .filter(t => t.type === 'expense' && !t.tags?.includes('transfer'))
    .reduce((sum, t) => sum + t.amount, 0));

  const totalTransfers = filteredTransactions
    .filter(t => t.type === 'expense' && t.tags?.includes('transfer'))
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    const csvData = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">Loading transactions...</div>;
  }
  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-600">Track and manage all your financial transactions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowTransactionForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Income</h3>
            <span className="text-green-600 bg-green-100 p-2 rounded-full">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
            <span className="text-red-600 bg-red-100 p-2 rounded-full">
              <TrendingDown className="w-5 h-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transfers</h3>
            <span className="text-purple-600 bg-purple-100 p-2 rounded-full">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{formatCurrency(totalTransfers)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.name}>{category.name}</option>
              ))}
            </select>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Filtered Results</span>
            </div>
          </div>
        </div>
        <TransactionList 
          transactions={filteredTransactions}
          filterType={filterType}
          filterCategory={filterCategory}
          filterAccount={filterAccount}
        />
      </div>

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
        />
      )}
    </div>
  );
};