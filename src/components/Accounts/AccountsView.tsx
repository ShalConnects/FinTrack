import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Info, PlusCircle, InfoIcon, Search, ArrowLeft, Wallet, ChevronUp, ChevronDown } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { AccountForm } from './AccountForm';
import { TransactionForm } from '../Transactions/TransactionForm';
import { Account } from '../../types';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { generateTransactionId, createSuccessMessage } from '../../utils/transactionId';
import { DeleteConfirmationModal } from '../common/DeleteConfirmationModal';
import { getAccountIcon, getAccountColor } from '../../utils/accountIcons';
import { useAuthStore } from '../../store/authStore';
import { useLoadingContext } from '../../context/LoadingContext';
import { SkeletonCard } from '../common/Skeleton';
import { useSearchParams } from 'react-router-dom';

export const AccountsView: React.FC = () => {
  const { accounts, deleteAccount, getTransactionsByAccount, transactions, loading, error, updateAccount, fetchAccounts, showTransactionForm, setShowTransactionForm } = useFinanceStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [hoveredDpsAccount, setHoveredDpsAccount] = useState<string | null>(null);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);

  // Handle URL parameter for selected account
  useEffect(() => {
    const selectedAccountId = searchParams.get('selected');
    console.log('AccountsView: URL parameter check:', { selectedAccountId, accountsLength: accounts.length });
    if (selectedAccountId) {
      const account = accounts.find(a => a.id === selectedAccountId);
      console.log('AccountsView: Found account:', account);
      if (account) {
        setSelectedAccount(account);
        // Clear the URL parameter after setting the account
        setSearchParams({}, { replace: true });
        // Scroll to the account after a short delay
        setTimeout(() => {
          const element = document.getElementById(`account-${selectedAccountId}`);
          console.log('AccountsView: Looking for element:', `account-${selectedAccountId}`, element);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
            setTimeout(() => {
              element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
            }, 3000);
          }
        }, 100);
      }
    }
  }, [searchParams, accounts, setSearchParams]);

  // New state for unified table view
  const [tableFilters, setTableFilters] = useState({
    search: '',
    currency: '',
    type: 'all',
    status: 'active' // 'active' or 'all'
  });
  
  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Refs for dropdown menus
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // State for row expansion
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Add new state for cardCurrency
  const [cardCurrency, setCardCurrency] = useState<string>('');

  // Add separate state and ref for the top card currency filter
  const [showCardCurrencyMenu, setShowCardCurrencyMenu] = useState(false);
  const cardCurrencyMenuRef = useRef<HTMLDivElement>(null);

  // Add state for delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [showDpsDeleteModal, setShowDpsDeleteModal] = useState(false);
  const [dpsDeleteContext, setDpsDeleteContext] = useState<{ mainAccount: Account, dpsAccount: Account } | null>(null);

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
  const sortData = (data: Account[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'currency':
          aValue = a.currency.toLowerCase();
          bValue = b.currency.toLowerCase();
          break;
        case 'balance':
          aValue = a.calculated_balance;
          bValue = b.calculated_balance;
          break;
        case 'transactions':
          const aTransactions = transactions.filter(t => t.account_id === a.id).length;
          const bTransactions = transactions.filter(t => t.account_id === b.id).length;
          aValue = aTransactions;
          bValue = bTransactions;
          break;
        case 'dps':
          aValue = a.has_dps ? 1 : 0;
          bValue = b.has_dps ? 1 : 0;
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

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
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

  const handleDeleteAccount = (account: Account) => {
    setAccountToDelete(account);
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = wrapAsync(async () => {
    if (accountToDelete) {
      setLoadingMessage('Deleting account...'); // Show loading message for account deletion
      const transactionId = generateTransactionId();
      await deleteAccount(accountToDelete.id, transactionId);
      toast.success(createSuccessMessage('Delete Account', transactionId, `Account deleted`));
      setShowDeleteModal(false);
      setAccountToDelete(null);
    }
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.calculated_balance, 0);

  // Debug DPS accounts
  console.log('All accounts:', accounts);
  console.log('DPS accounts:', accounts.filter(a => a.has_dps));
  console.log('Account with DPS details:', accounts.filter(a => a.has_dps).map(a => ({
    name: a.name,
    has_dps: a.has_dps,
    dps_type: a.dps_type,
    dps_amount_type: a.dps_amount_type,
    dps_fixed_amount: a.dps_fixed_amount
  })));

  // Group accounts by currency
  const accountsByCurrency = useMemo(() => {
    return accounts
      .filter(account => {
        // Filter out DPS savings accounts (accounts that are linked to other accounts)
        const isDpsSavingsAccount = accounts.some(otherAccount => 
          otherAccount.dps_savings_account_id === account.id
        );
        return !isDpsSavingsAccount;
      })
      .reduce((groups, account) => {
        const currency = account.currency;
        if (!groups[currency]) {
          groups[currency] = [];
        }
        groups[currency].push(account);
        return groups;
      }, {} as Record<string, Account[]>);
  }, [accounts]);

  // Accordion state for currency sections
  const currencyKeys = Object.keys(accountsByCurrency);
  const defaultOpenCurrency = currencyKeys[0];
  const [openCurrency, setOpenCurrency] = useState<string>(defaultOpenCurrency);

  const { profile } = useAuthStore();

  useEffect(() => {
    // Fetch DPS transfers for the current user
    const fetchDpsTransfers = async () => {
      const { data, error } = await supabase
        .from('dps_transfers')
        .select('*');
      if (!error) setDpsTransfers(data || []);
    };
    fetchDpsTransfers();
  }, []);

  // Get all unique currencies from accounts
  const accountCurrencies = Array.from(new Set(accounts.map(a => a.currency)));
  // Only show selected_currencies if available, else all from accounts
  const currencyOptions = useMemo(() => {
    if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
      return accountCurrencies.filter(c => profile.selected_currencies?.includes?.(c));
    }
    return accountCurrencies;
  }, [profile?.selected_currencies, accountCurrencies]);
  const accountTypes = Array.from(new Set(accounts.map(a => a.type)));



  // Filter accounts (for cards and table)
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.name.toLowerCase().includes(tableFilters.search.toLowerCase()) ||
                           account.description?.toLowerCase().includes(tableFilters.search.toLowerCase());
      const matchesCurrency = tableFilters.currency === '' || account.currency === tableFilters.currency;
      const matchesType = tableFilters.type === 'all' || account.type === tableFilters.type;
      const matchesStatus = tableFilters.status === 'all' || (tableFilters.status === 'active' && account.isActive);
      
      return matchesSearch && matchesCurrency && matchesType && matchesStatus;
    });
  }, [accounts, tableFilters]);

  // Sort filtered accounts for table display only
  const filteredAccountsForTable = useMemo(() => {
    return sortData(filteredAccounts);
  }, [filteredAccounts, sortConfig, transactions]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Row expansion handlers
  const toggleRowExpansion = (accountId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(accountId)) {
      newExpandedRows.delete(accountId);
    } else {
      newExpandedRows.add(accountId);
    }
    setExpandedRows(newExpandedRows);
  };

  const isRowExpanded = (accountId: string) => expandedRows.has(accountId);

  // DPS management handlers
  const handleToggleDPS = async (account: Account) => {
    if (account.has_dps) {
      // Disable DPS
      const confirmDisable = window.confirm('Are you sure you want to disable DPS for this account?');
      if (confirmDisable) {
        await updateAccount(account.id, {
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          dps_savings_account_id: null
        });
      }
    } else {
      // Enable DPS - open account form in edit mode
      setEditingAccount(account);
      setShowAccountForm(true);
    }
  };

  const handleManageDPS = (account: Account) => {
    setEditingAccount(account);
    setShowAccountForm(true);
  };

  // New DPS delete handler with balance transfer
  const handleDeleteDPSWithTransfer = async (mainAccount: Account, dpsAccount: Account) => {
    setDpsDeleteContext({ mainAccount, dpsAccount });
    setShowDpsDeleteModal(true);
  };

  const confirmDeleteDPS = async (moveToMainAccount: boolean) => {
    if (!dpsDeleteContext) return;
    
    const { mainAccount, dpsAccount } = dpsDeleteContext;
    const dpsBalance = dpsAccount.calculated_balance;
    
    try {
      if (moveToMainAccount) {
        // Move DPS balance to main account by creating an income transaction
        await updateAccount(mainAccount.id, {
          dps_savings_account_id: null,
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null
        });
        await deleteAccount(dpsAccount.id);
        // Add income transaction to main account
        await useFinanceStore.getState().addTransaction({
          account_id: mainAccount.id,
          amount: dpsBalance,
          type: 'income',
          description: 'DPS balance returned on DPS account deletion',
          category: 'DPS',
          date: new Date().toISOString(),
          user_id: mainAccount.user_id,
          tags: ['dps_deletion'],
        });
        toast.success('DPS account deleted and balance moved to Cash Account');
      } else {
        // Find cash account for the same currency
        let cashAccount = accounts.find(a => a.type === 'cash' && a.currency === dpsAccount.currency);
        if (!cashAccount) {
          // Create a new cash account for this currency
          const newAccountName = 'Cash Account';
          const { user_id } = dpsAccount;
          const newAccount = {
            name: newAccountName,
            type: 'cash' as const,
            currency: dpsAccount.currency,
            initial_balance: 0,
            calculated_balance: 0,
            isActive: true,
            user_id,
            updated_at: new Date().toISOString(),
          };
          // Assume addAccount returns the created account with id
          const created = await useFinanceStore.getState().addAccount(newAccount);
          // Refetch accounts to get the new one
          await useFinanceStore.getState().fetchAccounts();
          cashAccount = useFinanceStore.getState().accounts.find(a => a.type === 'cash' && a.currency === dpsAccount.currency);
          toast.success(`New Cash Account created for ${dpsAccount.currency}`);
        }
        if (cashAccount) {
          // Do NOT update initial_balance. Only add income transaction to cash account
          await useFinanceStore.getState().addTransaction({
            account_id: cashAccount.id,
            amount: dpsBalance,
            type: 'income',
            description: `DPS balance transferred from ${dpsAccount.name}`,
            category: 'DPS',
            date: new Date().toISOString(),
            user_id: cashAccount.user_id,
            tags: ['dps_deletion'],
          });
        }
        // Delete DPS account and update main account
        await updateAccount(mainAccount.id, {
          dps_savings_account_id: null,
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null
        });
        await deleteAccount(dpsAccount.id);
        toast.success('DPS account deleted and balance moved to Cash Account');
      }
    } catch (error) {
      console.error('Error deleting DPS:', error);
      toast.error('Failed to delete DPS account');
    }
    
    setShowDpsDeleteModal(false);
    setDpsDeleteContext(null);
  };

  // Set default cardCurrency to first available currency
  useEffect(() => {
    if (accountCurrencies.length > 0 && (!cardCurrency || !accountCurrencies.includes(cardCurrency))) {
      setCardCurrency(accountCurrencies[0]);
    }
  }, [accountCurrencies, cardCurrency]);

  // Add click outside handler for card currency menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cardCurrencyMenuRef.current && !cardCurrencyMenuRef.current.contains(event.target as Node)) {
        setShowCardCurrencyMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <SkeletonCard className="w-64 h-10" />
                <SkeletonCard className="w-32 h-10" />
                <SkeletonCard className="w-32 h-10" />
                <SkeletonCard className="w-32 h-10" />
              </div>
              <SkeletonCard className="w-32 h-10" />
            </div>
          </div>
          
          {/* Skeleton for summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            <SkeletonCard className="h-20" />
            <SkeletonCard className="h-20" />
            <SkeletonCard className="h-20" />
          </div>
          
          {/* Skeleton for table */}
          <div className="p-4">
            <SkeletonCard className="h-8 mb-4" />
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} className="h-16 mb-2" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="min-h-[300px] flex items-center justify-center text-red-600 text-xl">{error}</div>;
  }

  return (
    <div>
      {/* Header */}
      {/* Only keep the header at the top-level layout, remove this one from the body */}

      {/* Unified Table View - New Section */}
      <div className="space-y-6">

        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center w-full" style={{ marginBottom: 0 }}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={tableFilters.search}
                      onChange={(e) => setTableFilters({ ...tableFilters, search: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-[14px] h-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Search accounts..."
                    />
                  </div>
                </div>

                <div>
                  <div className="relative" ref={currencyMenuRef}>
                    <button
                      onClick={() => setShowCurrencyMenu(v => !v)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span>{tableFilters.currency === '' ? 'All Currencies' : tableFilters.currency}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCurrencyMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, currency: '' }); setShowCurrencyMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.currency === '' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Currencies
                        </button>
                        {currencyOptions.map(currency => (
                          <button
                            key={currency}
                            onClick={() => { setTableFilters({ ...tableFilters, currency }); setShowCurrencyMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.currency === currency ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            {currency}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative" ref={typeMenuRef}>
                    <button
                      onClick={() => setShowTypeMenu(v => !v)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span>{tableFilters.type === 'all' ? 'All Types' : tableFilters.type.charAt(0).toUpperCase() + tableFilters.type.slice(1)}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setTableFilters({ ...tableFilters, type: 'all' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                        >
                          All Types
                        </button>
                        {accountTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => { setTableFilters({ ...tableFilters, type }); setShowTypeMenu(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.type === type ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="relative" ref={statusMenuRef}>
                  <button
                    onClick={() => setShowStatusMenu(v => !v)}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                  >
                    <span>{tableFilters.status === 'active' ? 'Active Only' : 'All Accounts'}</span>
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStatusMenu && (
                    <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'active' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        Active Only
                      </button>
                      <button
                        onClick={() => { setTableFilters({ ...tableFilters, status: 'all' }); setShowStatusMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${tableFilters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : ''}`}
                      >
                        All Accounts
                      </button>
                    </div>
                  )}
                </div>

                {/* Clear Filters */}
                {(tableFilters.search || tableFilters.currency || tableFilters.type !== 'all' || tableFilters.status !== 'active') && (
                  <button
                    onClick={() => setTableFilters({ search: '', currency: '', type: 'all', status: 'active' })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingAccount(null);
                  setShowAccountForm(true);
                }}
                className="bg-gradient-primary text-white px-4 py-2 rounded-lg hover:bg-gradient-primary-hover transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account</span>
              </button>
            </div>
          </div>

          {/* Summary Cards - Now dynamic and after filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {(() => {
              const filteredTransactions = transactions.filter(t => filteredAccounts.some(a => a.id === t.account_id));
              // Use the first account's currency or fallback
              const currency = filteredAccounts[0]?.currency || 'USD';
              const currencySymbol = {
                USD: '$', BDT: '৳', EUR: '€', GBP: '£', JPY: '¥', ALL: 'L', INR: '₹', CAD: '$', AUD: '$'
              }[currency] || currency;
              return (
                <>
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Accounts</p>
                        <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>{filteredAccounts.filter(a => a.isActive).length}</p>
                      </div>
                      <span className="text-3xl font-bold text-green-600">{currencySymbol}</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Transactions</p>
                        <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>{filteredTransactions.length}</p>
                      </div>
                      <span className="text-3xl font-bold text-blue-600">{currencySymbol}</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">DPS Accounts</p>
                        <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>{filteredAccounts.filter(a => a.has_dps).length}</p>
                      </div>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2l4 -4" /></svg>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

                    {/* Table Section */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-[14px]">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Account Name</span>
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Type</span>
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('currency')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Currency</span>
                      {getSortIcon('currency')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Balance</span>
                      {getSortIcon('balance')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('transactions')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Transactions</span>
                      {getSortIcon('transactions')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSort('dps')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>DPS</span>
                      {getSortIcon('dps')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAccountsForTable.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 text-lg">No accounts found</td>
                  </tr>
                ) : (
                  filteredAccountsForTable.map((account) => {
                    const accountTransactions = transactions.filter(t => t.account_id === account.id);
                    const incomeTransactions = accountTransactions.filter(t => t.type === 'income');
                    const expenseTransactions = accountTransactions.filter(t => t.type === 'expense');
                    
                    // Calculate total saved and donated
                    let totalSaved = 0;
                    let totalDonated = 0;
                    incomeTransactions.forEach(t => {
                      const income = t.amount;
                      if (t.category === 'Savings') {
                        totalSaved += income;
                      } else if (t.category === 'Donation') {
                        totalDonated += income;
                      }
                    });
                    
                    // Get DPS savings account
                    const dpsSavingsAccount = accounts.find(a => a.id === account.dps_savings_account_id);
                    
                    // Check if this account is a DPS savings account (linked to another account)
                    const isDpsSavingsAccount = accounts.some(otherAccount => 
                      otherAccount.dps_savings_account_id === account.id
                    );
                    
                    return (
                      <React.Fragment key={account.id}>
                        <tr 
                          id={`account-${account.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" 
                          onClick={() => toggleRowExpansion(account.id)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div 
                                  className="text-sm font-medium text-gray-900 dark:text-white cursor-help relative group"
                                  title={account.description || 'No description available'}
                                >
                                  {account.name.charAt(0).toUpperCase() + account.name.slice(1)}
                                  {account.description && (
                                    <div className="absolute left-0 top-full mt-2 w-64 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                      {account.description}
                                      <div className="absolute top-0 left-4 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="ml-2">
                                <svg 
                                  className={`w-4 h-4 text-gray-400 transition-transform ${isRowExpanded(account.id) ? 'rotate-90' : ''}`} 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {account.type === 'cash' ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 gap-1">
                                <Wallet className="w-4 h-4 mr-1 text-yellow-500" />
                                Cash Account
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm text-gray-900 dark:text-white">{account.currency}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(account.calculated_balance, account.currency)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {accountTransactions.length}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {incomeTransactions.length} income, {expenseTransactions.length} expense
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {account.has_dps ? (
                                <>
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                                    Active
                                  </span>
                                  {dpsSavingsAccount && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatCurrency(dpsSavingsAccount.calculated_balance, dpsSavingsAccount.currency)}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                              {/* Action buttons: Only hide toggle and delete for cash and DPS savings accounts. Show info, edit, and add transaction for cash accounts. */}
                              {(!isDpsSavingsAccount && account.type !== 'cash') && (
                                <button
                                  onClick={async () => {
                                    await updateAccount(account.id, { isActive: !account.isActive });
                                  }}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${account.isActive ? 'bg-green-600' : 'bg-gray-300'}`}
                                  title={account.isActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${account.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedAccount(account);
                                  setModalOpen(true);
                                }}
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                title="More Info"
                              >
                                <InfoIcon className="w-4 h-4" />
                              </button>
                              {!isDpsSavingsAccount && (
                                <button
                                  onClick={() => handleEditAccount(account)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {!isDpsSavingsAccount && (
                                <button
                                  onClick={() => handleAddTransaction(account.id)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Add Transaction"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                </button>
                              )}
                              {(account.type !== 'cash' && !isDpsSavingsAccount) && (
                                <button
                                  onClick={() => handleDeleteAccount(account)}
                                  className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {isRowExpanded(account.id) && (
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Account Details */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Account Details</h4>
                                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                    <div>
                                      <span className="font-medium">Initial Balance:</span> {formatCurrency(Number(account.initial_balance), account.currency)}
                                    </div>
                                    {accounts.some(a => a.dps_savings_account_id === account.id) && (
                                      <div>
                                        <span className="font-medium">DPS Balance:</span> {
                                          (() => {
                                            const incoming = dpsTransfers
                                              .filter(t => t.to_account_id === account.id)
                                              .reduce((sum, t) => sum + (t.amount || 0), 0);
                                            return formatCurrency(Number(account.initial_balance) + incoming, account.currency);
                                          })()
                                        }
                                      </div>
                                    )}
                                    {!accounts.some(a => a.dps_savings_account_id === account.id) && (
                                      <>
                                        <div><span className="font-medium">Total Saved:</span> {formatCurrency(totalSaved, account.currency)}</div>
                                        <div><span className="font-medium">Total Donated:</span> {formatCurrency(totalDonated, account.currency)}</div>
                                      </>
                                    )}
                                    <div><span className="font-medium">Last Transaction:</span> {accountTransactions.length > 0 ? new Date(accountTransactions[accountTransactions.length - 1].date).toLocaleDateString() : 'None'}</div>
                                  </div>
                                </div>

                                {/* DPS Information */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">DPS Settings</h4>
                                  {account.has_dps ? (
                                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                                      <div><span className="font-medium">Type:</span> {account.dps_type}</div>
                                      <div><span className="font-medium">Amount Type:</span> {account.dps_amount_type}</div>
                                      {account.dps_fixed_amount && (
                                        <div><span className="font-medium">Fixed Amount:</span> {formatCurrency(account.dps_fixed_amount, account.currency)}</div>
                                      )}
                                      {dpsSavingsAccount && (
                                        <div><span className="font-medium">Savings Account:</span> {dpsSavingsAccount.name}</div>
                                      )}
                                      <div className="pt-2 flex gap-2">
                                        <button
                                          onClick={() => handleManageDPS(account)}
                                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                        >
                                          Manage DPS
                                        </button>
                                        <button
                                          onClick={() => handleDeleteDPSWithTransfer(account, dpsSavingsAccount || account)}
                                          className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                                        >
                                          Delete DPS
                                        </button>
                                      </div>
                                    </div>
                                  ) : isDpsSavingsAccount ? (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      <div>DPS Savings Account</div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500">This account holds DPS savings</div>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      <div>DPS not enabled</div>
                                      <div className="pt-2">
                                        <button
                                          onClick={() => handleToggleDPS(account)}
                                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                        >
                                          Enable DPS
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Recent Activity */}
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
                                  <div className="text-xs text-gray-600 space-y-1">
                                    {accountTransactions.slice(-3).reverse().map((transaction, index) => (
                                      <div key={transaction.id} className="flex justify-between">
                                        <span className="truncate">{transaction.description}</span>
                                        <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, account.currency)}
                                        </span>
                                      </div>
                                    ))}
                                    {accountTransactions.length === 0 && (
                                      <div className="text-gray-400">No transactions yet</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
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
            className="bg-gradient-primary text-white px-6 py-2 rounded-lg hover:bg-gradient-primary-hover transition-colors"
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

      {/* Delete Account Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal && !!accountToDelete}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message={`Are you sure you want to delete ${accountToDelete?.name}? This will remove all associated transactions and cannot be undone.`}
        recordDetails={
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium text-red-800">Account Details:</span>
            </div>
            <div className="text-sm text-red-700 space-y-1">
              <div><span className="font-medium">Name:</span> {accountToDelete?.name}</div>
              <div><span className="font-medium">Type:</span> {accountToDelete?.type}</div>
              <div><span className="font-medium">Balance:</span> {formatCurrency(accountToDelete?.calculated_balance || 0, accountToDelete?.currency || 'USD')}</div>
          </div>
          </>
        }
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
      />

      {/* DPS Delete Confirmation Modal */}
      {showDpsDeleteModal && dpsDeleteContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowDpsDeleteModal(false)} />
          <div className="relative bg-white rounded-lg p-4 max-w-sm w-full mx-2 shadow-xl">
            {/* Header */}
            <div className="text-center mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Delete DPS Account</h3>
              <p className="text-gray-600 text-xs">Choose where to transfer your remaining balance</p>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded p-3 mb-4 text-center">
              <div className="text-xl font-bold text-blue-700 mb-0.5">
                {formatCurrency(dpsDeleteContext.dpsAccount.calculated_balance, dpsDeleteContext.dpsAccount.currency)}
              </div>
              <div className="text-xs text-blue-600">Available Balance</div>
            </div>

            {/* Action Cards */}
            <div className="space-y-2 mb-3">
              <button
                onClick={() => confirmDeleteDPS(true)}
                className="w-full p-2 border border-blue-200 rounded hover:border-blue-400 hover:bg-blue-50 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                    <ArrowLeft className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Move to Main Account</div>
                    <div className="text-xs text-gray-600">Transfer balance back to your primary account</div>
                  </div>
                  <div className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Recommended</div>
                </div>
              </button>

              <div className="flex items-center justify-center">
                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => confirmDeleteDPS(false)}
                className="w-full p-2 border border-green-200 rounded hover:border-green-400 hover:bg-green-50 transition-all duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-gray-900 text-sm">Move to Cash Account</div>
                    <div className="text-xs text-gray-600">Create or use existing cash account</div>
                  </div>
                  <div className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Auto-create</div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowDpsDeleteModal(false)}
              className="w-full py-2 text-gray-500 hover:text-gray-700 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {modalOpen && selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white w-full" style={{ width: '65rem', minHeight: '60vh', maxHeight: '90vh', borderRadius: '5px', overflow: 'hidden' }}>
            <div className="shadow-xl p-6 animate-fadein flex" style={{ width: '65rem', minHeight: '60vh', maxHeight: '90vh' }}>
              <button className="absolute top-4 right-4 text-gray-500" onClick={() => setModalOpen(false)}>✕</button>
              {/* Left: Transactions List (75%) */}
              <div className="w-3/4 pr-6 border-r border-gray-200 overflow-y-auto hide-scrollbar" style={{ maxHeight: '75vh' }}>
                <h2 className="text-xl font-bold mb-4">Transactions</h2>
                {(() => {
                  const accountTransactions = transactions.filter(t => t.account_id === selectedAccount.id);
                  if (accountTransactions.length === 0) {
                    return <p className="text-gray-400">No transactions</p>;
                  }
                  return (
                    <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: '65vh' }}>
                      {accountTransactions.map((t, index) => {
                        // Calculate running balance
                        let runningBalance = Number(selectedAccount.initial_balance);
                        for (let i = 0; i <= index; i++) {
                          const tx = accountTransactions[i];
                          if (tx.type === 'income') {
                            runningBalance += tx.amount;
                          } else {
                            runningBalance -= tx.amount;
                          }
                        }
                        
                        return (
                          <div key={t.id} className="flex items-center justify-between border-b py-2">
                            <div>
                              <div className="font-medium text-gray-900">{t.description}</div>
                              <div className="text-xs text-gray-500">{t.category} • {t.type} • {new Date(t.date).toLocaleString()}</div>
                              <div className="text-xs text-blue-600 mt-1">Balance: {formatCurrency(runningBalance, selectedAccount.currency)}</div>
                            </div>
                            <div className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, selectedAccount.currency)}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              {/* Right: Account Info (25%) */}
              <div className="w-1/4 pl-6 flex flex-col justify-start">
                <h2 className="text-lg font-bold mb-2">Account Info</h2>
                <div style={{ fontSize: 13 }}>
                  <div style={{ marginBottom: '0.1rem' }}><b>Name:</b> {selectedAccount.name.charAt(0).toUpperCase() + selectedAccount.name.slice(1)}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Type:</b> {selectedAccount.type === 'cash' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 gap-1 ml-1">
                      <Wallet className="w-4 h-4 mr-1 text-yellow-500" />
                      Cash Account
                    </span>
                  ) : (
                    selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)
                  )}
                </div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Initial Balance:</b> {formatCurrency(Number(selectedAccount.initial_balance), selectedAccount.currency)}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Currency:</b> {selectedAccount.currency}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Description:</b> {selectedAccount.description || 'N/A'}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Transactions:</b> {transactions.filter(t => t.account_id === selectedAccount.id).length}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Total Saved:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Total Donated:</b> {formatCurrency(0, selectedAccount.currency)}</div>
                  <div style={{ marginBottom: '0.1rem' }}><b>Donation Preference:</b> None</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
