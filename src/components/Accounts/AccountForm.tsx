import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';
import { contextToasts } from '../../lib/toastConfig';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  account?: Account;
}

export const AccountForm: React.FC<AccountFormProps> = ({ isOpen, onClose, account }) => {
  console.log('AccountForm render:', { isOpen, account });
  console.log('AccountForm will render modal:', isOpen);
  
  const { addAccount, updateAccount, loading, error } = useFinanceStore();
  const { profile } = useAuthStore();

  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'checking',
    balance: account?.initial_balance?.toString() || '0',
    currency: account?.currency || 'USD',
    description: account?.description || '',
    has_dps: account?.has_dps || false,
    dps_type: account?.dps_type || 'monthly',
    dps_amount_type: account?.dps_amount_type || 'fixed',
    dps_fixed_amount: account?.dps_fixed_amount?.toString() || '10',
    dps_initial_balance: '0'
  });

  const [showDpsModal, setShowDpsModal] = useState(false);
  const [dpsTransferAmount, setDpsTransferAmount] = useState('');
  const [pendingDpsEnable, setPendingDpsEnable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        dps_type: account.dps_type || 'monthly',
        dps_amount_type: account.dps_amount_type || 'fixed',
        dps_fixed_amount: account.dps_fixed_amount?.toString() || '10',
        dps_initial_balance: '0'
      });
    }
  }, [account]);

  const getInputClasses = (fieldName: string) => {
    const baseClasses = "w-full px-4 py-2 text-[14px] h-10 rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600";
    const errorClasses = "border-red-300 focus:ring-red-500 focus:border-red-500 dark:border-red-600";
    const normalClasses = "border-gray-200 focus:ring-blue-500";
    
    return `${baseClasses} ${errors[fieldName] ? errorClasses : normalClasses}`;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Account name is required';
    }
    
    if (parseFloat(formData.balance) < 0) {
      newErrors.balance = 'Initial balance cannot be negative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('AccountForm handleSubmit called with formData:', formData);
    
    if (!validateForm()) {
      return;
    }
    
    const dpsInitial = parseFloat(formData.dps_initial_balance || '0');
    const mainInitial = parseFloat(formData.balance);
    const transactionId = generateTransactionId();
    
    const accountData = {
      name: formData.name,
      type: formData.type as Account['type'],
      initial_balance: mainInitial,
      calculated_balance: mainInitial,
      currency: formData.currency,
      description: formData.description,
      has_dps: formData.has_dps,
      dps_type: formData.has_dps ? formData.dps_type : null,
      dps_amount_type: formData.has_dps ? formData.dps_amount_type : null,
      dps_fixed_amount: formData.has_dps && formData.dps_amount_type === 'fixed' ? parseFloat(formData.dps_fixed_amount) : null,
      isActive: account?.isActive ?? true,
      dps_savings_account_id: account?.dps_savings_account_id || null,
      updated_at: new Date().toISOString(),
      transaction_id: transactionId
    };

    console.log('Account data to save:', accountData);

    try {
      if (account) {
        console.log('Updating existing account');
        await updateAccount(account.id, accountData);
        contextToasts.financial.accountUpdated(formData.name);
      } else {
        console.log('Creating new account');
        await addAccount({
          ...accountData,
          dps_initial_balance: formData.has_dps ? dpsInitial : 0
        });
        contextToasts.financial.accountCreated(formData.name);
      }
      console.log('Account saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving account:', error);
      contextToasts.errors.serverError();
    }
  };

  const handleDpsCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      has_dps: e.target.checked,
      dps_type: e.target.checked ? prev.dps_type : 'monthly',
      dps_amount_type: e.target.checked ? prev.dps_amount_type : 'fixed',
      dps_fixed_amount: e.target.checked ? prev.dps_fixed_amount : '10',
      dps_initial_balance: '0'
    }));
  };

  if (!isOpen) return null;

  // Currency options: only show selected_currencies if available, else all
  const allCurrencyOptions = [
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'BDT', label: 'BDT' },
    { value: 'JPY', label: 'JPY' },
    { value: 'CAD', label: 'CAD' },
    { value: 'AUD', label: 'AUD' },
  ];
  const currencyOptions = profile?.selected_currencies && profile.selected_currencies.length > 0
    ? allCurrencyOptions.filter(opt => profile.selected_currencies?.includes?.(opt.value))
    : allCurrencyOptions;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Modal Container */}
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 w-40rem max-h-[90vh] overflow-y-auto z-50 shadow-2xl transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {account ? 'Edit Account' : 'Add Account'}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close form"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1st row: Account Name, Initial Balance */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center" style={{ marginTop: '15px' }}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, name: e.target.value }));
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`${getInputClasses('name')} min-w-[200px]`}
                required
                disabled={loading}
                placeholder="Enter account name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Initial Balance *
              </label>
              <input
                type="number"
                id="balance"
                value={formData.balance}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, balance: e.target.value }));
                  if (errors.balance) setErrors({ ...errors, balance: '' });
                }}
                className={`${getInputClasses('balance')} min-w-[160px]`}
                required
                step="0.01"
                disabled={loading}
                placeholder="0.00"
              />
              {errors.balance && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.balance}
                </p>
              )}
            </div>
          </div>

          {/* 2nd row: Account Type, Currency */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center" style={{ marginTop: '10px' }}>
            <div className="flex-1">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Account Type *
              </label>
              <div className="w-full">
                <CustomDropdown
                  value={formData.type}
                  onChange={(value: string) => {
                    setFormData(prev => ({ ...prev, type: value as Account['type'] }));
                  }}
                  options={[
                    { value: 'checking', label: 'Checking' },
                    { value: 'savings', label: 'Savings' },
                    { value: 'credit', label: 'Credit' },
                    { value: 'investment', label: 'Investment' },
                    { value: 'cash', label: 'Cash' },
                  ]}
                  placeholder="Select account type"
                />
              </div>
            </div>
            <div className="flex-1">
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency *
              </label>
              <div className="w-full">
                <CustomDropdown
                  value={formData.currency}
                  onChange={(value: string) => {
                    setFormData(prev => ({ ...prev, currency: value }));
                  }}
                  options={currencyOptions}
                  placeholder="Select currency"
                />
              </div>
            </div>
          </div>

          {/* 3rd row: Description */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 items-center" style={{ marginTop: '10px' }}>
            <div className="flex-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 text-[14px] rounded-lg border transition-colors duration-200 bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                rows={3}
                disabled={loading}
                placeholder="Enter account description"
              />
            </div>
          </div>

          {/* DPS Section */}
          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="has_dps"
              checked={formData.has_dps}
              onChange={handleDpsCheckbox}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={loading}
            />
            <label htmlFor="has_dps" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Enable DPS (Daily Personal Savings)
            </label>
          </div>

          {formData.has_dps && (
            <div className="ml-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Monthly</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="flexible"
                        checked={formData.dps_type === 'flexible'}
                        onChange={(e) => setFormData(prev => ({ ...prev, dps_type: 'flexible' }))}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Flexible</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Fixed</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        value="custom"
                        checked={formData.dps_amount_type === 'custom'}
                        onChange={(e) => setFormData(prev => ({ ...prev, dps_amount_type: 'custom' }))}
                        className="text-blue-600 focus:ring-blue-500 h-4 w-4 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Custom</span>
                    </label>
                  </div>
                </div>
              </div>

              {formData.dps_amount_type === 'fixed' && (
                <div>
                  <label htmlFor="dps_fixed_amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fixed DPS Amount
                  </label>
                  <input
                    type="number"
                    id="dps_fixed_amount"
                    value={formData.dps_fixed_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, dps_fixed_amount: e.target.value }))}
                    className={`${getInputClasses('dps_fixed_amount')} min-w-[160px]`}
                    step="0.01"
                    min="0"
                    disabled={loading}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <label htmlFor="dps_initial_balance" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  DPS Initial Balance
                </label>
                <input
                  type="number"
                  id="dps_initial_balance"
                  value={formData.dps_initial_balance}
                  onChange={(e) => setFormData(prev => ({ ...prev, dps_initial_balance: e.target.value }))}
                  className={`${getInputClasses('dps_initial_balance')} min-w-[160px]`}
                  step="0.01"
                  min="0"
                  disabled={loading}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:bg-gradient-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};