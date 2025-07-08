import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react';
import { Transaction } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { TransactionForm } from './TransactionForm';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../utils/currency';

interface TransactionListProps {
  transactions: Transaction[];
  filterType: 'all' | 'income' | 'expense';
  filterCategory: string;
  filterAccount: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions,
  filterType,
  filterCategory,
  filterAccount
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const { getActiveAccounts, getActiveTransactions, deleteTransaction } = useFinanceStore();
  const accounts = getActiveAccounts();
  const activeTransactions = getActiveTransactions();

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTransaction(undefined);
  };

  const filteredTransactions = transactions
    .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
    .filter(t => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterAccount !== 'all' && t.account_id !== filterAccount) return false;
      return true;
    });

  const sortedTransactions = filteredTransactions
    .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedTransactions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="text-lg">No transactions found</p>
        <p className="text-sm mt-1">Try adjusting your filters or add a new transaction</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {sortedTransactions.map((transaction) => {
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
                <p className="text-xs text-gray-500">{transaction.category}</p>
              </div>
            </div>
          );
        })}
      </div>

      {isFormOpen && (
        <TransactionForm
          onClose={handleCloseForm}
          transactionToEdit={selectedTransaction}
        />
      )}
    </div>
  );
};