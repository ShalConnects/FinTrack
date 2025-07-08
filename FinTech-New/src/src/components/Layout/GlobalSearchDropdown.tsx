import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Search, Box } from 'lucide-react';

const TABS = [
  { key: 'transactions', label: 'Transactions', color: 'text-yellow-600', underline: 'bg-yellow-500' },
  { key: 'accounts', label: 'Accounts', color: 'text-blue-600', underline: 'bg-blue-500' },
  { key: 'categories', label: 'Categories', color: 'text-green-600', underline: 'bg-green-500' },
];

export const GlobalSearchDropdown: React.FC = () => {
  const { globalSearchTerm, transactions, accounts, categories } = useFinanceStore();
  const search = globalSearchTerm.trim().toLowerCase();
  const [activeTab, setActiveTab] = useState('transactions');

  // Responsive dropdown style: fixed, left 77%, max width, 100% on mobile
  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    left: '77%',
    top: '4.5rem',
    width: '100%',
    maxWidth: 400,
    minWidth: 260,
    zIndex: 1000,
    boxSizing: 'border-box',
  };

  // Filter logic
  const filteredTransactions = search
    ? transactions
        .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer')))
        .filter(t =>
          t.description.toLowerCase().includes(search) ||
          t.category.toLowerCase().includes(search) ||
          t.tags?.some(tag => tag.toLowerCase().includes(search))
        )
    : [];
  const filteredAccounts = search
    ? accounts.filter(a =>
        a.name.toLowerCase().includes(search) ||
        a.type.toLowerCase().includes(search) ||
        a.currency.toLowerCase().includes(search)
      )
    : [];
  const filteredCategories = search
    ? categories.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.type.toLowerCase().includes(search)
      )
    : [];

  if (!search) return null;

  let content;
  const noData = (
    <div className="flex flex-col items-center justify-center py-10">
      <Box className="w-14 h-14 text-gray-300 mb-3" />
      <div className="text-gray-400 text-lg font-medium">No data</div>
    </div>
  );
  if (activeTab === 'transactions') {
    content = filteredTransactions.length === 0 ? (
      noData
    ) : (
      filteredTransactions.map(t => (
        <div key={t.id} className="py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer flex flex-col">
          <span className="text-gray-900 font-medium">{t.description}</span>
          <span className="text-xs text-gray-500">{t.category} • {t.amount} • {t.type}</span>
        </div>
      ))
    );
  } else if (activeTab === 'accounts') {
    content = filteredAccounts.length === 0 ? (
      noData
    ) : (
      filteredAccounts.map(a => (
        <div key={a.id} className="py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer flex flex-col">
          <span className="text-gray-900 font-medium">{a.name}</span>
          <span className="text-xs text-gray-500">{a.type} • {a.currency}</span>
        </div>
      ))
    );
  } else if (activeTab === 'categories') {
    content = filteredCategories.length === 0 ? (
      noData
    ) : (
      filteredCategories.map(c => (
        <div key={c.id} className="py-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer flex flex-col">
          <span className="text-gray-900 font-medium">{c.name}</span>
          <span className="text-xs text-gray-500">{c.type}</span>
        </div>
      ))
    );
  }

  return (
    <div
      style={dropdownStyle}
      className="bg-white rounded-[22px] shadow-[0_4px_24px_0_rgba(0,0,0,0.10)] border border-gray-100 animate-fadein flex flex-col"
    >
      <div className="flex items-center px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <Search className="w-5 h-5 text-gray-400 mr-2" />
        <input
          type="text"
          value={globalSearchTerm}
          readOnly
          className="bg-transparent text-lg text-gray-700 placeholder-gray-400 border-none outline-none w-full font-medium"
          placeholder="Search anything"
        />
      </div>
      {/* Tabs */}
      <div className="flex px-4 space-x-6 mt-1 mb-2 sm:px-6 sm:space-x-8">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`relative pb-2 font-semibold text-base bg-transparent border-none outline-none transition-colors focus:outline-none ${
              activeTab === tab.key
                ? `text-gray-900`
                : 'text-gray-400 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
            style={{ background: 'none' }}
          >
            {tab.label}
            <span className="ml-1 text-xs text-gray-400 font-normal">
              {tab.key === 'transactions' ? filteredTransactions.length : tab.key === 'accounts' ? filteredAccounts.length : filteredCategories.length}
            </span>
            {activeTab === tab.key && (
              <span
                className={`absolute left-0 right-0 -bottom-1 h-1.5 rounded-full ${tab.underline}`}
                style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="px-4 pt-2 pb-8 min-h-[160px] sm:px-6">{content}</div>
    </div>
  );
}; 