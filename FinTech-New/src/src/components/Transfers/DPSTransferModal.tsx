import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Account } from '../../types';

interface DPSTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DPSTransferModal: React.FC<DPSTransferModalProps> = ({ isOpen, onClose }) => {
  const { accounts, transferDPS, loading } = useFinanceStore();
  const dpsAccounts = accounts.filter(a => a.has_dps && a.dps_savings_account_id);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const selectedAccount = dpsAccounts.find(a => a.id === selectedAccountId);
  const linkedSavingsAccount = selectedAccount && accounts.find(a => a.id === selectedAccount.dps_savings_account_id);
  const fixedAmount = selectedAccount?.dps_amount_type === 'fixed' ? selectedAccount.dps_fixed_amount : null;
  const isFixedAmount = selectedAccount && selectedAccount.dps_amount_type === 'fixed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let transferAmount = amount;
    if (isFixedAmount && selectedAccount?.dps_fixed_amount != null) {
      transferAmount = selectedAccount.dps_fixed_amount.toString();
    }
    if (!isFixedAmount && !amount) {
      setError('Please enter an amount.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      console.log('Starting DPS transfer with:', {
        selectedAccount,
        linkedSavingsAccount,
        transferAmount,
        isFixedAmount
      });
      
      await transferDPS({
        from_account_id: selectedAccountId,
        amount: parseFloat(transferAmount)
      });
      
      setSuccess('DPS transfer successful!');
      setAmount('');
      setSelectedAccountId('');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('DPS transfer error:', err);
      setError(err.message || 'Failed to transfer.');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-4xl w-full rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
            DPS Transfer
          </Dialog.Title>
          {success && <div className="mb-4 p-4 text-green-700 bg-green-100 rounded-md">{success}</div>}
          {error && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">DPS Account</label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
                disabled={loading}
              >
                <option value="">Select DPS account</option>
                {dpsAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
              </select>
            </div>
            {selectedAccount && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Linked Savings Account</label>
                <input
                  type="text"
                  value={linkedSavingsAccount ? linkedSavingsAccount.name : ''}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                  disabled
                />
              </div>
            )}
            {(selectedAccountId && dpsAccounts.find(a => a.id === selectedAccountId)?.dps_amount_type !== 'fixed') && (
              <div className="mt-4">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={isFixedAmount && selectedAccount?.dps_fixed_amount != null ? selectedAccount.dps_fixed_amount.toString() : amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  step="0.01"
                  disabled={loading || isFixedAmount}
                  placeholder={isFixedAmount ? `Fixed: ${selectedAccount?.dps_fixed_amount}` : ''}
                  {...(!isFixedAmount ? { required: true } : {})}
                />
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
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