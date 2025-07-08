import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { accounts, transfer, loading, error } = useFinanceStore();
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    note: ''
  });

  // State for transfer history
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);

  // Fetch transfer history on mount
  useEffect(() => {
    if (isOpen) {
      fetchTransferHistory();
    }
  }, [isOpen]);

  const fetchTransferHistory = async () => {
    try {
      // Fetch regular transfers
      const { data: transferData, error: transferError } = await supabase
        .from('transactions')
        .select('*')
        .eq('category', 'Transfer')
        .order('date', { ascending: false });

      if (transferError) throw transferError;
      setTransfers(transferData || []);

      // Fetch DPS transfers
      const { data: dpsData, error: dpsError } = await supabase
        .from('dps_transfers')
        .select('*, from_account:accounts!from_account_id(name), to_account:accounts!to_account_id(name)')
        .order('date', { ascending: false });

      if (dpsError) throw dpsError;
      setDpsTransfers(dpsData || []);
    } catch (err) {
      console.error('Error fetching transfer history:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.from_account_id || !formData.to_account_id || !formData.amount) return;

    const fromAccount = accounts.find(a => a.id === formData.from_account_id);
    const toAccount = accounts.find(a => a.id === formData.to_account_id);
    if (!fromAccount || !toAccount) return;

    await transfer({
      from_account_id: formData.from_account_id,
      to_account_id: formData.to_account_id,
      from_amount: parseFloat(formData.amount),
      exchange_rate: fromAccount.currency === toAccount.currency ? 1 : 1, // Add proper exchange rate handling if needed
      note: formData.note
    });

    setFormData({
      from_account_id: '',
      to_account_id: '',
      amount: '',
      note: ''
    });
    
    // Refresh transfer history
    fetchTransferHistory();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            Currency Transfer
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          {/* Currency Transfer Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="from_account" className="block text-sm font-medium text-gray-700">
                  From Account
                </label>
                <select
                  id="from_account"
                  value={formData.from_account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, from_account_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                  disabled={loading}
                >
                  <option value="">Select account</option>
                  {accounts.map((account: Account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.calculated_balance, account.currency)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="to_account" className="block text-sm font-medium text-gray-700">
                  To Account
                </label>
                <select
                  id="to_account"
                  value={formData.to_account_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, to_account_id: e.target.value }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                  disabled={loading}
                >
                  <option value="">Select account</option>
                  {accounts.map((account: Account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.calculated_balance, account.currency)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                step="0.01"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note (Optional)
              </label>
              <input
                type="text"
                id="note"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={loading}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gradient-primary hover:bg-gradient-primary-hover text-white px-4 py-2 rounded-lg transition-colors"
                disabled={loading}
              >
                {loading ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}; 