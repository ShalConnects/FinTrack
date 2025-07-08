import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '../../types/index';
import { format } from 'date-fns';
import { useFinanceStore } from '../../store/useFinanceStore';

export const RecentTransactions: React.FC = () => {
  const { getActiveAccounts, getActiveTransactions } = useFinanceStore();
  const accounts = getActiveAccounts();
  const transactions = getActiveTransactions();
  
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(Math.abs(amount));
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
      </div>
    );
  }

  // Get the 10 most recent transactions
  const recentTransactions = transactions
    .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="max-h-[400px] overflow-y-auto">
      <div className="space-y-2">
        {recentTransactions.map((transaction) => {
          const account = accounts.find(a => a.id === transaction.account_id);
          const currency = account?.currency || 'USD';
          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-full ${transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.type === 'income' ? (
                    <ArrowDownRight className="w-4 h-4 text-green-600" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(transaction.date), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount, currency)}
                </p>
                <p className="text-xs text-gray-500">{account?.name || 'Unknown Account'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};