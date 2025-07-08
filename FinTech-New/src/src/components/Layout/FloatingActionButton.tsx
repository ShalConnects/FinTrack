import React, { useState } from 'react';
import { Plus, Wallet, CreditCard, ListTodo, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Dialog } from '@headlessui/react';
import { TransferModal } from '../Transfers/TransferModal';
import { DPSTransferModal } from '../Transfers/DPSTransferModal';
import { AccountForm } from '../Accounts/AccountForm';

export const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [transferType, setTransferType] = useState<'currency' | 'dps' | null>(null);
  const { setShowTransactionForm, setShowAccountForm } = useFinanceStore();
  const [showAccountForm, setShowAccountFormLocal] = useState(false);
  const [showCurrencyTransferModal, setShowCurrencyTransferModal] = useState(false);
  const [showDpsTransferModal, setShowDpsTransferModal] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleAddTransaction = () => {
    setShowTransactionForm(true);
    setIsOpen(false);
  };

  const handleAddAccount = () => {
    setShowAccountFormLocal(true);
    setIsOpen(false);
  };

  const handleTransfer = () => {
    setShowTransferTypeModal(true);
    setIsOpen(false);
  };

  const handleSelectTransferType = (type: 'currency' | 'dps') => {
    setShowTransferTypeModal(false);
    setTransferType(type);
    if (type === 'currency') {
      setShowCurrencyTransferModal(true);
    } else {
      setShowDpsTransferModal(true);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Transfer Type Modal */}
      <Dialog open={showTransferTypeModal} onClose={() => setShowTransferTypeModal(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-xs rounded-lg bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-medium text-gray-900 mb-4">
              Select Transfer Type
            </Dialog.Title>
            <div className="flex flex-col gap-4">
              <button
                onClick={() => handleSelectTransferType('currency')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Currency Transfer
              </button>
              <button
                onClick={() => handleSelectTransferType('dps')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                DPS Transfer
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
      {/* Currency Transfer Modal */}
      {showCurrencyTransferModal && (
        <TransferModal isOpen={showCurrencyTransferModal} onClose={() => setShowCurrencyTransferModal(false)} />
      )}
      {/* DPS Transfer Modal */}
      {showDpsTransferModal && (
        <DPSTransferModal isOpen={showDpsTransferModal} onClose={() => setShowDpsTransferModal(false)} />
      )}
      {/* Add Account Modal */}
      {showAccountForm && (
        <AccountForm isOpen={showAccountForm} onClose={() => setShowAccountFormLocal(false)} />
      )}
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 flex flex-col gap-2">
          <button
            onClick={handleAddTransaction}
            className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title="Add Transaction"
          >
            <CreditCard className="w-5 h-5" />
            <span className="bg-white text-blue-600 px-2 py-1 rounded text-sm font-medium">
              Add Transaction
            </span>
          </button>
          <button
            onClick={handleAddAccount}
            className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            title="Add Account"
          >
            <Wallet className="w-5 h-5" />
            <span className="bg-white text-green-600 px-2 py-1 rounded text-sm font-medium">
              Add Account
            </span>
          </button>
          <button
            onClick={handleTransfer}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            title="Transfer"
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="bg-white text-purple-600 px-2 py-1 rounded text-sm font-medium">
              Transfer
            </span>
          </button>
        </div>
      )}
      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all transform ${
          isOpen ? 'rotate-45' : ''
        }`}
        title="Add New"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}; 