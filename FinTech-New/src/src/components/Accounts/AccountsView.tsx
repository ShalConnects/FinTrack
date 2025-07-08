import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Info, PlusCircle, InfoIcon } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { AccountForm } from './AccountForm';
import { TransactionForm } from '../Transactions/TransactionForm';
import { Account } from '../../types';
import { Switch } from '@headlessui/react';
import { supabase } from '../../lib/supabase';

export const AccountsView: React.FC = () => {
  const { accounts, deleteAccount, getTransactionsByAccount, transactions, loading, error, updateAccount, fetchAccounts } = useFinanceStore();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const handleAddTransaction = (accountId: string) => {
    setSelectedAccountId(accountId);
    setShowTransactionForm(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  const handleCloseAccountForm = () => {
    setEditingAccount(null);
    setShowAccountForm(false);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (window.confirm('Are you sure you want to delete this account? All associated transactions will be removed.')) {
      deleteAccount(accountId);
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.calculated_balance, 0);

  if (loading) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">Loading accounts...</div>;
  }
  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
          <p className="text-gray-600">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => {
            setEditingAccount(null);
            setShowAccountForm(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm opacity-90">Total Balance</h3>
            <p className="text-3xl font-bold">{formatCurrency(totalBalance, accounts[0]?.currency || 'USD')}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Active Accounts</p>
            <p className="text-2xl font-bold">{accounts.filter(a => a.isActive).length}</p>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => {
          // Get all transactions for this account
          const accountTransactions = transactions.filter(t => t.account_id === account.id);
          const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
          const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
          
          // Calculate total saved and donated for all time
          let totalSaved = 0;
          let totalDonated = 0;
          incomeTransactions.forEach(t => {
            const income = t.amount;
            // Saving
            const saving = t.saving_amount || 0;
            const saved = saving < 0 ? income * (Math.abs(saving) / 100) : saving;
            totalSaved += saved;
            // Donation (after saving)
            const donationPref = account.donation_preference || 0;
            const donationBase = income - saved;
            const donated = donationPref < 0 ? donationBase * (Math.abs(donationPref) / 100) : donationPref;
            totalDonated += donated;
          });

          // Donation preference display
          let donationPrefText = 'None';
          if (account.donation_preference) {
            if (account.donation_preference < 0) {
              donationPrefText = `${Math.abs(account.donation_preference)}% of remaining income`;
            } else {
              donationPrefText = `$${account.donation_preference} after saving`;
            }
          }
          
          return (
            <div key={account.id} className={`bg-white rounded-xl shadow p-6 border border-gray-200 flex flex-col space-y-2 ${!account.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    {account.name}
                    {account.has_dps && (
                      <div className="relative group inline-block">
                        <span
                          className="ml-2 px-2 py-0.5 rounded text-xs font-semibold"
                          style={{ backgroundColor: 'rgba(216,100,1,0.24)', color: 'rgb(216,100,1)' }}
                        >
                          Have DPS
                        </span>
                        <div className="absolute left-1/2 z-10 hidden group-hover:block min-w-[200px] -translate-x-1/2 mt-2 px-4 py-2 rounded bg-white border border-gray-300 shadow-lg text-xs text-gray-800 whitespace-pre-line">
                          <div><b>DPS Type:</b> {account.dps_type || 'N/A'}</div>
                          <div><b>Amount Type:</b> {account.dps_amount_type || 'N/A'}</div>
                          <div><b>Fixed Amount:</b> {account.dps_fixed_amount != null ? account.dps_fixed_amount : 'N/A'}</div>
                          <div><b>Savings Account ID:</b> {account.dps_savings_account_id || 'N/A'}</div>
                        </div>
                      </div>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{account.type} Account</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      checked={account.isActive}
                      onChange={async (checked) => {
                        try {
                          const { error } = await supabase
                            .from('accounts')
                            .update({ is_active: checked })
                            .eq('id', account.id);

                          if (error) throw error;
                          await fetchAccounts();
                        } catch (error) {
                          console.error('Error toggling account status:', error);
                        }
                      }}
                      className={`${
                        account.isActive ? 'bg-blue-600' : 'bg-gray-200'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          account.isActive ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                    <span className="text-xs text-gray-500">
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={(e) => handleEditAccount(account)} className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => handleDeleteAccount(account.id)} className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 mb-1">
                <span className="text-2xl font-bold">{formatCurrency(account.calculated_balance, account.currency)}</span>
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {accountTransactions.length} transaction{accountTransactions.length !== 1 ? 's' : ''} 
                ({incomeTransactions.length} income, {expenseTransactions.length} expense)
              </div>
              <div className="text-sm text-gray-500">
                <div>Total Saved: {formatCurrency(totalSaved, account.currency)}</div>
                <div>Total Donated: {formatCurrency(totalDonated, account.currency)}</div>
                <div>Donation Preference: {donationPrefText}</div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={(e) => handleAddTransaction(account.id)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Transaction</span>
                </button>
                <button
                  onClick={(e) => {
                    setSelectedAccount(account);
                    setModalOpen(true);
                  }}
                  className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center space-x-1"
                >
                  <InfoIcon className="w-4 h-4" />
                  <span>More Info</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {accounts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first financial account</p>
          <button
            onClick={() => setShowAccountForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Your First Account
          </button>
        </div>
      )}

      {/* Account Form Modal */}
      <AccountForm
        isOpen={showAccountForm}
        onClose={handleCloseAccountForm}
        account={editingAccount || undefined}
      />

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <TransactionForm
          accountId={selectedAccountId}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedAccountId('');
          }}
        />
      )}

      {modalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl shadow-xl p-6 rounded-lg animate-fadein">
            <button className="absolute top-4 right-4 text-gray-500" onClick={() => setModalOpen(false)}>✕</button>
            <h2 className="text-xl font-bold mb-2">{selectedAccount?.name} - Details</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedAccount?.type} Account</p>
            {/* Income Transaction Table */}
            {(() => {
              if (!selectedAccount) return null;
              const accountTransactions = transactions.filter(t => t.account_id === selectedAccount.id && t.type === 'income');
              if (accountTransactions.length === 0) {
                return <p className="text-gray-400">No income transactions</p>;
              }
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 border">Date</th>
                        <th className="px-2 py-1 border">Description</th>
                        <th className="px-2 py-1 border">Income</th>
                        <th className="px-2 py-1 border">Saved</th>
                        <th className="px-2 py-1 border">Donated</th>
                        <th className="px-2 py-1 border">Remaining</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountTransactions.map(t => {
                        let saved = 0;
                        if (typeof t.saving_amount === 'number') {
                          saved = t.saving_amount < 0 ? t.amount * Math.abs(t.saving_amount) / 100 : t.saving_amount;
                        }
                        let donation = 0;
                        const afterSaving = t.amount - saved;
                        if (typeof selectedAccount.donation_preference === 'number') {
                          if (selectedAccount.donation_preference < 1 && selectedAccount.donation_preference > 0) {
                            donation = afterSaving * selectedAccount.donation_preference;
                          } else {
                            donation = selectedAccount.donation_preference;
                          }
                        }
                        donation = Math.min(donation, afterSaving);
                        const remaining = afterSaving - donation;
                        return (
                          <tr key={t.id}>
                            <td className="px-2 py-1 border">{t.date}</td>
                            <td className="px-2 py-1 border">{t.description}</td>
                            <td className="px-2 py-1 border">{t.amount.toFixed(2)}</td>
                            <td className="px-2 py-1 border">{saved.toFixed(2)}</td>
                            <td className="px-2 py-1 border">{donation.toFixed(2)}</td>
                            <td className="px-2 py-1 border">{remaining.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
