import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

export const AccountForm: React.FC<AccountFormProps> = ({ isOpen, onClose, account }) => {
  const { addAccount, updateAccount, loading, error } = useFinanceStore();

  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'checking',
    balance: account?.initial_balance?.toString() || '0',
    currency: account?.currency || 'USD',
    description: account?.description || '',
    has_dps: account?.has_dps || false,
    dps_type: account?.dps_type || null,
    dps_amount_type: account?.dps_amount_type || null,
    dps_fixed_amount: account?.dps_fixed_amount?.toString() || ''
  });

  // Update form data when account prop changes
  React.useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        type: account.type,
        balance: account.initial_balance?.toString() || '0',
        currency: account.currency,
        description: account.description || '',
        has_dps: account.has_dps || false,
        dps_type: account.dps_type || null,
        dps_amount_type: account.dps_amount_type || null,
        dps_fixed_amount: account.dps_fixed_amount?.toString() || ''
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountData = {
      name: formData.name,
      type: formData.type as Account['type'],
      initial_balance: parseFloat(formData.balance),
      calculated_balance: parseFloat(formData.balance),
      currency: formData.currency,
      description: formData.description,
      has_dps: formData.has_dps,
      dps_type: formData.has_dps ? formData.dps_type : null,
      dps_amount_type: formData.has_dps ? formData.dps_amount_type : null,
      dps_fixed_amount: formData.has_dps && formData.dps_amount_type === 'fixed' ? parseFloat(formData.dps_fixed_amount) : null,
      isActive: account?.isActive ?? true,
      dps_savings_account_id: account?.dps_savings_account_id || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (account) {
        await updateAccount(account.id, accountData);
      } else {
        await addAccount(accountData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            {account ? 'Edit Account' : 'Create New Account'}
          </Dialog.Title>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Account Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading}
              >
                <option value="checking">Checking</option>
                <option value="savings">Savings</option>
                <option value="credit">Credit</option>
                <option value="investment">Investment</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                Initial Balance
              </label>
              <input
                type="number"
                id="balance"
                value={formData.balance}
                onChange={(e) => setFormData(prev => ({ ...prev, balance: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                step="0.01"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="BDT">BDT</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_dps"
                  checked={formData.has_dps}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    has_dps: e.target.checked,
                    dps_type: e.target.checked ? prev.dps_type : null,
                    dps_amount_type: e.target.checked ? prev.dps_amount_type : null,
                    dps_fixed_amount: e.target.checked ? prev.dps_fixed_amount : ''
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="has_dps" className="ml-2 block text-sm text-gray-900">
                  Has DPS (Deposit Pension Scheme)?
                </label>
              </div>

              {formData.has_dps && (
                <>
                  <div className="ml-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      DPS Type
                    </label>
                    <div className="space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="monthly"
                          checked={formData.dps_type === 'monthly'}
                          onChange={(e) => setFormData(prev => ({ ...prev, dps_type: 'monthly' }))}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Monthly</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="flexible"
                          checked={formData.dps_type === 'flexible'}
                          onChange={(e) => setFormData(prev => ({ ...prev, dps_type: 'flexible' }))}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Flexible</span>
                      </label>
                    </div>
                  </div>

                  <div className="ml-6 space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Amount Type
                    </label>
                    <div className="space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="fixed"
                          checked={formData.dps_amount_type === 'fixed'}
                          onChange={(e) => setFormData(prev => ({ ...prev, dps_amount_type: 'fixed' }))}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Fixed</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          value="custom"
                          checked={formData.dps_amount_type === 'custom'}
                          onChange={(e) => setFormData(prev => ({ ...prev, dps_amount_type: 'custom' }))}
                          className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Custom</span>
                      </label>
                    </div>
                  </div>

                  {formData.dps_amount_type === 'fixed' && (
                    <div className="ml-6">
                      <label htmlFor="dps_fixed_amount" className="block text-sm font-medium text-gray-700">
                        Fixed Amount
                      </label>
                      <input
                        type="number"
                        id="dps_fixed_amount"
                        value={formData.dps_fixed_amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, dps_fixed_amount: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                        step="0.01"
                        disabled={loading}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};