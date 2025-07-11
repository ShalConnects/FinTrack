import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Copy, Edit2, Trash2, Plus, Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react';
import { Transaction } from '../../types/index';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { TransactionForm } from './TransactionForm';
import { formatCurrency, getCurrencySymbol } from '../../utils/currency';
import { formatTransactionId } from '../../utils/transactionId';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { parseISO } from 'date-fns';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuthStore } from '../../store/authStore';
import { startOfToday, startOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, endOfWeek, endOfDay } from 'date-fns';
import { useLoadingContext } from '../../context/LoadingContext';

export const TransactionList: React.FC<{ 
  transactions: Transaction[];
  selectedTransactionId?: string | null;
}> = ({ transactions, selectedTransactionId }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
  const { getActiveAccounts, getActiveTransactions, deleteTransaction } = useFinanceStore();
  const accounts = getActiveAccounts();
  const activeTransactions = getActiveTransactions();
  const { profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    type: 'all' as 'all' | 'income' | 'expense',
    account: 'all',
    currency: '', // <-- add currency filter
    dateRange: { start: '', end: '' }
  });
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false); // <-- add state for currency menu
  const currencyMenuRef = useRef<HTMLDivElement>(null); // <-- add ref for click outside
  const accountMenuRef = useRef<HTMLDivElement>(null);
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  // Add export menu state and ref
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Sorting function
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Sort function
  const sortData = (data: Transaction[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'description':
          aValue = a.description.toLowerCase();
          bValue = b.description.toLowerCase();
          break;
        case 'account':
          const accountA = accounts.find(acc => acc.id === a.account_id)?.name || '';
          const accountB = accounts.find(acc => acc.id === b.account_id)?.name || '';
          aValue = accountA.toLowerCase();
          bValue = accountB.toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Add useEffect to highlight selected transaction
  useEffect(() => {
    if (selectedTransactionId) {
      setTimeout(() => {
        const element = document.getElementById(`transaction-${selectedTransactionId}`);
        console.log('TransactionList: Looking for element:', `transaction-${selectedTransactionId}`, element);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
          }, 3000);
        }
      }, 100);
    }
  }, [selectedTransactionId]);

  // Hide export menu on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  // Add click outside handler for account menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu]);

  // Export handlers
  const handleExportCSV = () => {
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
    setShowExportMenu(false);
  };
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const headers = [['Date', 'Description', 'Category', 'Account', 'Type', 'Amount']];
    const rows = filteredTransactions.map(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      return [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount
      ];
    });
    autoTable(doc, {
      head: headers,
      body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 185] },
      margin: { top: 20 },
    });
    doc.save(`transactions-${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };
  const handleExportHTML = () => {
    let html = '<table border="1"><thead><tr>';
    const headers = ['Date', 'Description', 'Category', 'Account', 'Type', 'Amount', 'Tags'];
    html += headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead><tbody>';
    filteredTransactions.forEach(transaction => {
      const account = accounts.find(a => a.id === transaction.account_id);
      html += '<tr>' + [
        new Date(transaction.date).toLocaleDateString(),
        transaction.description,
        transaction.category,
        account?.name || 'Unknown',
        transaction.tags?.includes('transfer') ? 'Transfer' : transaction.type,
        transaction.amount,
        (transaction.tags || []).join('; ')
      ].map(field => `<td>${field}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table>';
    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    window.URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = React.useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);



  // Always use a valid currency code for formatting
  const selectedCurrency = filters.currency || accountCurrencies[0] || 'USD';

  // Set default currency filter to user's local_currency if available and valid
  React.useEffect(() => {
    if (!filters.currency && profile?.local_currency && accountCurrencies.includes(profile.local_currency)) {
      setFilters(f => ({ ...f, currency: profile.local_currency || '' }));
    }
  }, [profile, accountCurrencies, filters.currency]);

  // Click outside handler for currency menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || 'Unknown Account';
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    // Wrap the delete process with loading state
    const wrappedDelete = wrapAsync(async () => {
      setLoadingMessage('Deleting transaction...');
    try {
      await deleteTransaction(transaction.id);
      toast.success('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
    });
    
    // Execute the wrapped delete function
    await wrappedDelete();
  };



  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTransaction(undefined);
  };

  const handleCopyTransactionId = (transactionId: string) => {
    navigator.clipboard.writeText(transactionId);
    toast.success('Transaction ID copied to clipboard');
  };

  // Filtering
  const filteredTransactions = React.useMemo(() => {
    const filtered = transactions
      .filter(t => !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer') || tag === 'dps_deletion'))
      .filter(t => {
        if (filters.type !== 'all' && t.type !== filters.type) return false;
        if (filters.account !== 'all' && t.account_id !== filters.account) return false;
        if (filters.currency && accounts.find(a => a.id === t.account_id)?.currency !== filters.currency) return false;
        if (
          filters.search &&
          !(
            t.description.toLowerCase().includes(filters.search.toLowerCase()) ||
            (t.transaction_id && t.transaction_id.toLowerCase().includes(filters.search.toLowerCase()))
          )
        ) return false;
        if (filters.dateRange.start && filters.dateRange.end) {
          const txDate = new Date(t.date);
          const startDate = new Date(filters.dateRange.start);
          const endDate = new Date(filters.dateRange.end);
          if (txDate < startDate || txDate > endDate) return false;
        }
        return true;
      });
    
    // Apply sorting
    return sortData(filtered);
  }, [transactions, filters, sortConfig, accounts]);

  // Summary card values should be based on filteredTransactions only
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const transactionCount = filteredTransactions.length;

  // Add state to track if custom is selected
  const [customDateActive, setCustomDateActive] = useState(false);

  // Preset date range handler
  const handlePresetRange = (preset: string) => {
    const today = startOfToday();
    setCustomDateActive(preset === 'custom');
    if (preset === 'custom') {
      setShowPresetDropdown(false);
      setShowCustomModal(true);
      setCustomStart(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
      setCustomEnd(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');
      return;
    }
    setShowCustomModal(false);
    switch (preset) {
      case 'today':
        setFilters(f => ({ ...f, dateRange: { start: today.toISOString(), end: endOfDay(today).toISOString() } }));
        break;
      case 'thisWeek':
        setFilters(f => ({ ...f, dateRange: { start: startOfWeek(today, { weekStartsOn: 1 }).toISOString(), end: endOfWeek(today, { weekStartsOn: 1 }).toISOString() } }));
        break;
      case 'thisMonth':
        setFilters(f => ({ ...f, dateRange: { start: startOfMonth(today).toISOString(), end: endOfMonth(today).toISOString() } }));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setFilters(f => ({ ...f, dateRange: { start: startOfMonth(lastMonth).toISOString(), end: endOfMonth(lastMonth).toISOString() } }));
        break;
      case 'thisYear':
        setFilters(f => ({ ...f, dateRange: { start: startOfYear(today).toISOString(), end: endOfYear(today).toISOString() } }));
        break;
      default:
        break;
    }
  };

  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const presetDropdownRef = React.useRef<HTMLDivElement>(null);

  // Click outside handler for preset dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresetDropdown(false);
      }
    }
    if (showPresetDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPresetDropdown]);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(filters.dateRange.start ? filters.dateRange.start.slice(0, 10) : '');
  const [customEnd, setCustomEnd] = useState(filters.dateRange.end ? filters.dateRange.end.slice(0, 10) : '');

  return (
    <div className="space-y-6">
      {/* Unified Filters and Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Filters Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {/* Search Filter */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 text-[14px] h-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                  placeholder="Search transactions…"
                />
              </div>
            </div>
            {/* Currency Filter */}
            <div>
              <div className="relative" ref={currencyMenuRef}>
                <button
                  onClick={() => {
                    setShowCurrencyMenu(v => !v);
                    setShowTypeMenu(false);
                    setShowAccountMenu(false);
                    setShowDateMenu(false);
                  }}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                >
                  <span>{filters.currency === '' ? (currencyOptions[0] || '') : filters.currency}</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showCurrencyMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                    {currencyOptions.map(currency => (
                      <button
                        key={currency}
                        onClick={() => { setFilters({ ...filters, currency }); setShowCurrencyMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
            <div className="relative">
              <button
                  onClick={() => {
                    setShowTypeMenu(v => !v);
                    setShowAccountMenu(false);
                    setShowDateMenu(false);
                    setShowCurrencyMenu(false);
                  }}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <span>{filters.type === 'all' ? 'All Types' : filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showTypeMenu && (
                  <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                    {(['all', 'income', 'expense'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => { setFilters({ ...filters, type: type as 'all' | 'income' | 'expense' }); setShowTypeMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === type ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>

            <div>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowAccountMenu(v => !v);
                  setShowTypeMenu(false);
                  setShowDateMenu(false);
                  setShowCurrencyMenu(false);
                }}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 w-full"
              >
                <span>{filters.account === 'all' ? 'All Accounts' : getAccountName(filters.account)}</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showAccountMenu && (
                <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto min-w-[180px] py-2">
                  <button
                    onClick={() => { setFilters({ ...filters, account: 'all' }); setShowAccountMenu(false); }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                  >
                    All Accounts
                  </button>
                  {accounts.map(account => (
                    <button
                      key={account.id}
                      onClick={() => { setFilters({ ...filters, account: account.id }); setShowAccountMenu(false); }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.account === account.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                    >
                      {account.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            </div>
            {/* Date Preset Dropdown styled as filter button */}
            <div className="relative">
              <button
                className={`bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${showPresetDropdown ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => {
                  setShowPresetDropdown(v => !v);
                  setShowTypeMenu(false);
                  setShowAccountMenu(false);
                  setShowCurrencyMenu(false);
                }}
                type="button"
              >
                <span>Date Range</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showPresetDropdown && (
                <div ref={presetDropdownRef} className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[140px]">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('today'); setShowPresetDropdown(false); }}>Today</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisWeek'); setShowPresetDropdown(false); }}>This Week</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisMonth'); setShowPresetDropdown(false); }}>This Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('lastMonth'); setShowPresetDropdown(false); }}>Last Month</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('thisYear'); setShowPresetDropdown(false); }}>This Year</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100" onClick={() => { handlePresetRange('custom'); }}>Custom Range…</button>
                </div>
              )}
            </div>
            {/* Custom Range Modal */}
            {showCustomModal && (
              <>
                <style>{`
                  .react-datepicker, .react-datepicker * {
                    font-family: 'Manrope', sans-serif !important;
                  }
                `}</style>
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                  <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCustomModal(false)} />
                  <div className="relative bg-white dark:bg-gray-900 rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl flex flex-col items-center border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Custom Date Range</h3>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">Start Date</label>
                        <DatePicker
                          selected={customStart ? new Date(customStart) : null}
                          onChange={date => setCustomStart(date ? date.toISOString().slice(0, 10) : '')}
                          selectsStart
                          startDate={customStart ? new Date(customStart) : null}
                          endDate={customEnd ? new Date(customEnd) : null}
                          maxDate={customEnd ? new Date(customEnd) : undefined}
                          dateFormat="MM/dd/yyyy"
                          className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 px-3 py-2 rounded w-full font-sans border border-gray-200 dark:border-gray-700"
                          placeholderText="Select start date"
                          isClearable
                          showPopperArrow={false}
                          popperPlacement="bottom"
                          autoComplete="off"
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-gray-600 dark:text-gray-300 mb-1">End Date</label>
                        <DatePicker
                          selected={customEnd ? new Date(customEnd) : null}
                          onChange={date => setCustomEnd(date ? date.toISOString().slice(0, 10) : '')}
                          selectsEnd
                          startDate={customStart ? new Date(customStart) : null}
                          endDate={customEnd ? new Date(customEnd) : null}
                          minDate={customStart ? new Date(customStart) : undefined}
                          dateFormat="MM/dd/yyyy"
                          className="bg-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-400 px-3 py-2 rounded w-full font-sans border border-gray-200 dark:border-gray-700"
                          placeholderText="Select end date"
                          isClearable
                          showPopperArrow={false}
                          popperPlacement="bottom"
                          autoComplete="off"
                        />
                      </div>
                      {customStart && customEnd && new Date(customEnd) < new Date(customStart) && (
                        <div className="text-xs text-red-500 mt-1">End date cannot be before start date.</div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-6 w-full">
                      <button
                        className="flex-1 py-2 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                        onClick={() => setShowCustomModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="flex-1 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 border border-blue-700 dark:border-blue-800"
                        disabled={!!(customStart && customEnd && new Date(customEnd) < new Date(customStart))}
                        onClick={() => {
                          setFilters(f => ({ ...f, dateRange: {
                            start: customStart ? new Date(customStart).toISOString() : '',
                            end: customEnd ? new Date(customEnd).toISOString() : ''
                          }}));
                          setShowCustomModal(false);
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {(filters.search || filters.type !== 'all' || filters.account !== 'all' || (filters.dateRange && (filters.dateRange.start || filters.dateRange.end))) && (
              <button
                onClick={() => setFilters({ search: '', type: 'all', account: 'all', currency: '', dateRange: { start: '', end: '' } })}
                className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                title="Clear all filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="flex-grow" />
            {/* Action Buttons in filter row */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={exportMenuRef}>
                <button
                  onClick={() => setShowExportMenu(v => !v)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 h-10 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                  aria-label="Export"
                >
                  <Download className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={handleExportCSV}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      CSV
                    </button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      PDF
                    </button>
                    <button
                      onClick={handleExportHTML}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      HTML
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-gradient-primary text-white px-4 py-2 h-10 rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Transaction</span>
              </button>
            </div>
          </div>
        </div>
        {/* Summary Cards - moved inside table container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Income</p>
                <p className="font-bold text-green-600 dark:text-green-400" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalIncome, selectedCurrency)}
                </p>
              </div>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expense</p>
                <p className="font-bold text-red-600 dark:text-red-400" style={{ fontSize: '1.2rem' }}>
                  {formatCurrency(totalExpense, selectedCurrency)}
                </p>
              </div>
              <span className="text-3xl font-bold text-red-600 dark:text-red-400">{getCurrencySymbol(selectedCurrency)}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Transactions</p>
                <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>{transactionCount}</p>
              </div>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">#</span>
            </div>
          </div>
        </div>
        {/* Table Section */}
        <div className="overflow-x-auto">
          <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date</span>
                      {getSortIcon('date')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Description</span>
                      {getSortIcon('description')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Account</span>
                      {getSortIcon('account')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Amount</span>
                      {getSortIcon('amount')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500 text-lg">No data available</td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => {
                    const account = accounts.find(a => a.id === transaction.account_id);
                    const currency = account?.currency || 'USD';
                    const isSelected = selectedTransactionId === transaction.transaction_id || selectedTransactionId === transaction.id;
                    return (
                      <tr 
                        key={transaction.id} 
                        id={`transaction-${transaction.transaction_id || transaction.id}`}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                      >
                        <td className="px-6 py-2 text-left">
                          <span className="text-gray-900 dark:text-white" style={{ fontSize: '14px' }}>{format(new Date(transaction.date), 'MMM dd, yyyy')}</span>
                        </td>
                        <td className="px-6 py-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{transaction.description}</div>
                            {transaction.transaction_id && (
                              <button
                                onClick={() => handleCopyTransactionId(transaction.transaction_id!)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors mt-1"
                              >
                                <span className="font-mono">#{formatTransactionId(transaction.transaction_id)}</span>
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">{getAccountName(transaction.account_id)}</span>
                        </td>
                        <td className="px-6 py-2 text-center">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(transaction.amount, selectedCurrency)}</span>
                        </td>
                        <td className="px-6 py-2 text-center">
                          {transaction.type === 'income' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                              <ArrowDownRight className="w-3 h-3" /> Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                              <ArrowUpRight className="w-3 h-3" /> Expense
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-2 text-center">
                          <div className="flex justify-center gap-2 items-center">
                            <button
                              onClick={() => handleEdit(transaction)}
                              className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setTransactionToDelete(transaction); setShowDeleteModal(true); }}
                              className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <TransactionForm
          onClose={handleCloseForm}
          transactionToEdit={selectedTransaction}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!transactionToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          if (transactionToDelete) await handleDelete(transactionToDelete.id);
          setShowDeleteModal(false);
        }}
        title="Delete Transaction"
        message={`Are you sure you want to delete ${transactionToDelete?.description}? This will update the account balance and cannot be undone.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Transaction Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Description:</span> {transactionToDelete?.description}</div>
              <div><span className="font-medium">Amount:</span> {formatCurrency(transactionToDelete?.amount || 0, selectedCurrency)}</div>
              <div><span className="font-medium">Type:</span> {transactionToDelete?.type}</div>
              <div><span className="font-medium">Account:</span> {transactionToDelete ? getAccountName(transactionToDelete.account_id) : ''}</div>
            </div>
          </>
        }
        confirmLabel="Delete Transaction"
        cancelLabel="Cancel"
      />
    </div>
  );
};