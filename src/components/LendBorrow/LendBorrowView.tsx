import React, { useState, useEffect, useRef } from 'react';
import { Plus, Filter, Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Handshake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { LendBorrow, LendBorrowInput, LendBorrowAnalytics } from '../../types/index';
import { LendBorrowForm } from './LendBorrowForm';
import { LendBorrowList } from './LendBorrowList';
import { PartialReturnModal } from './PartialReturnModal';
import { useFinanceStore } from '../../store/useFinanceStore';
import { toast } from 'sonner';
import { useLoadingContext } from '../../context/LoadingContext';

const currencySymbols: Record<string, string> = {
  USD: '$',
  BDT: '৳',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  ALL: 'L',
  INR: '₹',
  CAD: '$',
  AUD: '$',
};

const getCurrencySymbol = (currency: string) => currencySymbols[currency] || currency;

export const LendBorrowView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { accounts } = useFinanceStore();
  const [lendBorrowRecords, setLendBorrowRecords] = useState<LendBorrow[]>([]);
  const [analytics, setAnalytics] = useState<LendBorrowAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<LendBorrow | null>(null);
  const [partialReturnRecord, setPartialReturnRecord] = useState<LendBorrow | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const currencyMenuRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState({
    type: 'all' as 'all' | 'lend' | 'borrow',
    status: 'all' as 'all' | 'active' | 'settled' | 'overdue',
    search: '',
    currency: '' as string,
  });
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const { profile } = useAuthStore();
  const { wrapAsync, setLoadingMessage } = useLoadingContext();

  // Only show selected_currencies if available, else all
  const allCurrencyOptions = [
    'USD', 'EUR', 'GBP', 'BDT', 'JPY', 'CAD', 'AUD'
  ];
  let availableCurrencies: string[] = [];
  if (profile?.selected_currencies && profile.selected_currencies.length > 0) {
    availableCurrencies = allCurrencyOptions.filter(c => profile.selected_currencies?.includes?.(c));
  } else {
    const accountCurrencies = Array.from(new Set(accounts.map((a: any) => a.currency)));
    availableCurrencies = accountCurrencies.length > 0 ? accountCurrencies : allCurrencyOptions;
  }

  // Set default currency to user's default (first account's currency)
  useEffect(() => {
    if (availableCurrencies.length > 0 && (!selectedCurrency || !availableCurrencies.includes(selectedCurrency))) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  useEffect(() => {
    if (
      availableCurrencies.length > 0 &&
      profile?.local_currency &&
      availableCurrencies.includes(profile.local_currency) &&
      (!filters.currency || !availableCurrencies.includes(filters.currency))
    ) {
      setFilters(f => ({ ...f, currency: profile.local_currency! }));
      setSelectedCurrency(profile.local_currency!);
    } else if (availableCurrencies.length > 0 && (!filters.currency || !availableCurrencies.includes(filters.currency))) {
      setFilters(f => ({ ...f, currency: availableCurrencies[0] }));
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [profile, availableCurrencies, filters.currency]);

  // Check and update overdue status for records
  const updateOverdueStatus = async (records: LendBorrow[]) => {
    if (!user) return records;
    
    const today = new Date();
    const overdueRecords = records.filter(record => 
      record.status === 'active' && 
      record.due_date && 
      new Date(record.due_date) < today
    );

    if (overdueRecords.length === 0) return records;

    // Update overdue records in batch
    const updates = overdueRecords.map(record => ({
      id: record.id,
      status: 'overdue'
    }));

    try {
      const { error } = await supabase
        .from('lend_borrow')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        console.error('Error updating overdue status:', error);
        return records;
      }

      // Update local state
      return records.map(record => {
        const overdueRecord = overdueRecords.find(r => r.id === record.id);
        return overdueRecord ? { ...record, status: 'overdue' as const } : record;
      });
    } catch (error) {
      console.error('Error updating overdue status:', error);
      return records;
    }
  };

  // Fetch lend/borrow records
  const fetchLendBorrowRecords = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lend_borrow')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update overdue status and set records
      const updatedRecords = await updateOverdueStatus(data || []);
      setLendBorrowRecords(updatedRecords);
    } catch (error) {
      console.error('Error fetching lend/borrow records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics
  const calculateAnalytics = (records: LendBorrow[]): LendBorrowAnalytics => {
    const totalLent = records
      .filter(r => r.type === 'lend')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const totalBorrowed = records
      .filter(r => r.type === 'borrow')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const outstandingLent = records
      .filter(r => r.type === 'lend' && r.status === 'active')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const outstandingBorrowed = records
      .filter(r => r.type === 'borrow' && r.status === 'active')
      .reduce((sum, r) => sum + r.amount, 0);
    
    const overdueCount = records.filter(r => r.status === 'overdue').length;
    const activeCount = records.filter(r => r.status === 'active').length;
    const settledCount = records.filter(r => r.status === 'settled').length;
    
    // Get top person by total amount
    const personTotals = records.reduce((acc, r) => {
      acc[r.person_name] = (acc[r.person_name] || 0) + r.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const topPerson = Object.entries(personTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0];
    
    // Currency breakdown
    const currencyBreakdown = records.reduce((acc, r) => {
      if (!acc[r.currency]) {
        acc[r.currency] = {
          currency: r.currency,
          total_lent: 0,
          total_borrowed: 0,
          outstanding_lent: 0,
          outstanding_borrowed: 0
        };
      }
      
      if (r.type === 'lend') {
        acc[r.currency].total_lent += r.amount;
        if (r.status === 'active') {
          acc[r.currency].outstanding_lent += r.amount;
        }
      } else {
        acc[r.currency].total_borrowed += r.amount;
        if (r.status === 'active') {
          acc[r.currency].outstanding_borrowed += r.amount;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return {
      total_lent: totalLent,
      total_borrowed: totalBorrowed,
      outstanding_lent: outstandingLent,
      outstanding_borrowed: outstandingBorrowed,
      overdue_count: overdueCount,
      active_count: activeCount,
      settled_count: settledCount,
      top_person: topPerson,
      currency_breakdown: Object.values(currencyBreakdown)
    };
  };

  // Calculate analytics for summary cards: overdue count ignores status filter
  const calculateSummaryAnalytics = (allRecords: LendBorrow[], currency: string, type: string) => {
    const currencyRecords = allRecords.filter(r => r.currency === currency);
    const typeRecords = type === 'all' ? currencyRecords : currencyRecords.filter(r => r.type === type);
    const totalLent = typeRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
    const totalBorrowed = typeRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
    const outstandingLent = typeRecords.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
    const outstandingBorrowed = typeRecords.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
    // Overdue count: ignore status filter, but respect currency and type
    const overdueCount = typeRecords.filter(r => r.status === 'overdue').length;
    return {
      total_lent: totalLent,
      total_borrowed: totalBorrowed,
      outstanding_lent: outstandingLent,
      outstanding_borrowed: outstandingBorrowed,
      overdue_count: overdueCount,
      currency: currency
    };
  };

  // Calculate analytics for filtered records (used for summary cards that should reflect all filters)
  const calculateFilteredAnalytics = (filteredRecords: LendBorrow[], currency: string) => {
    const totalLent = filteredRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0);
    const totalBorrowed = filteredRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0);
    const outstandingLent = filteredRecords.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
    const outstandingBorrowed = filteredRecords.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0);
    const overdueCount = filteredRecords.filter(r => r.status === 'overdue').length;
    return {
      total_lent: totalLent,
      total_borrowed: totalBorrowed,
      outstanding_lent: outstandingLent,
      outstanding_borrowed: outstandingBorrowed,
      overdue_count: overdueCount,
      currency: currency
    };
  };

  // Filter records for the table (status filter included)
  const filteredRecords = lendBorrowRecords.filter(record => {
    if (filters.type !== 'all' && record.type !== filters.type) return false;
    if (filters.status !== 'all' && record.status !== filters.status) return false;
    if (filters.search && !record.person_name.toLowerCase().includes(filters.search.toLowerCase()) && 
        !record.notes?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.currency && record.currency !== filters.currency) return false;
    return true;
  });

  // Calculate overdue count directly from filtered records
  const overdueCount = filteredRecords.filter(r => r.status === 'overdue').length;
  
  const currentAnalytics = {
    total_lent: filteredRecords.filter(r => r.type === 'lend').reduce((sum, r) => sum + r.amount, 0),
    total_borrowed: filteredRecords.filter(r => r.type === 'borrow').reduce((sum, r) => sum + r.amount, 0),
    outstanding_lent: filteredRecords.filter(r => r.type === 'lend' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0),
    outstanding_borrowed: filteredRecords.filter(r => r.type === 'borrow' && r.status === 'active').reduce((sum, r) => sum + r.amount, 0),
    overdue_count: overdueCount,
    currency: filters.currency || availableCurrencies[0]
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BDT') {
      return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (!currency) return amount.toString();
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(amount);
    } catch {
      return amount.toString();
    }
  };

  // Add new record
  const handleAddRecord = async (record: LendBorrowInput) => {
    if (!user) return;

    // Convert empty string date fields to null
    const cleanRecord = {
      ...record,
      due_date: record.due_date === "" ? null : record.due_date,
      partial_return_date: record.partial_return_date === "" ? null : record.partial_return_date,
      user_id: user.id,
    };

    try {
      console.log('Attempting to add record:', cleanRecord);

      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data, error } = await supabase
        .from('lend_borrow')
        .insert([cleanRecord])
        .select()
        .single();

      console.log('Insert result:', { data, error, record });

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error adding record: ' + error.message);
        throw error;
      }

      if (!data) {
        console.error('No data returned from insert');
        toast.error('No data returned from insert. Please check your database permissions.');
        return;
      }

      console.log('Successfully added record:', data);
      setLendBorrowRecords(prev => [data, ...prev]);
      setShowForm(false);
      toast.success('Record added successfully!');
    } catch (error) {
      console.error('Error adding lend/borrow record:', error);
      toast.error('Failed to add record. Please try again.');
    }
  };

  // Update record
  const handleUpdateRecord = async (id: string, updates: Partial<LendBorrowInput>): Promise<void> => {
    if (!user) return;

    // Convert empty string date fields to null
    const cleanUpdates = {
      ...updates,
      due_date: updates.due_date === "" ? null : updates.due_date,
      partial_return_date: updates.partial_return_date === "" ? null : updates.partial_return_date,
    };

    try {
      console.log('Attempting to update record:', { id, updates: cleanUpdates });

      // Add a small delay to ensure loading animation is visible
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data, error } = await supabase
        .from('lend_borrow')
        .update(cleanUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        toast.error('Error updating record: ' + error.message);
        throw error;
      }

      if (!data) {
        console.error('No data returned from update');
        toast.error('No data returned from update. Please check your database permissions.');
        return;
      }

      console.log('Successfully updated record:', data);
      setLendBorrowRecords(prev => 
        prev.map(r => r.id === id ? data : r)
      );
      setEditingRecord(null);
      toast.success('Record updated successfully!');
    } catch (error) {
      console.error('Error updating lend/borrow record:', error);
      toast.error('Failed to update record. Please try again.');
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string) => {
    if (!user) return;

    // Wrap the delete process with loading state
    const wrappedDelete = wrapAsync(async () => {
      setLoadingMessage('Deleting record...');
      try {
        console.log('Attempting to delete record:', id);

        const { error } = await supabase
          .from('lend_borrow')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Supabase error:', error);
          toast.error('Error deleting record: ' + error.message);
          throw error;
        }

        console.log('Successfully deleted record:', id);
        setLendBorrowRecords(prev => prev.filter(r => r.id !== id));
        toast.success('Record deleted successfully!');
      } catch (error) {
        console.error('Error deleting lend/borrow record:', error);
        toast.error('Failed to delete record. Please try again.');
      }
    });
    
    // Execute the wrapped delete function
    await wrappedDelete();
  };

  // Update status
  const handleUpdateStatus = async (id: string, status: LendBorrow['status']) => {
    try {
      await handleUpdateRecord(id, { status });
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handlePartialReturn = (record: LendBorrow) => {
    console.log('Partial return clicked:', record);
    setPartialReturnRecord(record);
  };

  const handlePartialReturnUpdated = (updatedRecord: LendBorrow) => {
    setLendBorrowRecords(prev => 
      prev.map(record => record.id === updatedRecord.id ? updatedRecord : record)
    );
    setPartialReturnRecord(null);
  };

  // Update analytics when records change
  useEffect(() => {
    setAnalytics(calculateAnalytics(lendBorrowRecords));
  }, [lendBorrowRecords]);

  // Initial fetch
  useEffect(() => {
    fetchLendBorrowRecords();
  }, [user]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target as Node)) {
        setShowCurrencyMenu(false);
      }
    }
    if (showCurrencyMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCurrencyMenu]);

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

  // Helper to capitalize first letter
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (!selectedCurrency) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No currency selected or available.</div>;
  }

  if (availableCurrencies.length === 0) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">No accounts or currencies found. Please add an account first.</div>;
  }

  if (loading) {
    return <div className="min-h-[300px] flex items-center justify-center text-xl">Loading lend/borrow records...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Unified Table View - New Section */}
      <div className="space-y-6">

        {/* Unified Filters and Table */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Filters Section */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start" style={{ marginBottom: 0 }}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 w-full">
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 text-[14px] h-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
                      placeholder="Search lend & borrow…"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowCurrencyMenu(v => !v);
                        setShowTypeMenu(false);
                        setShowStatusMenu(false);
                      }}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span>{capitalize(filters.currency || availableCurrencies[0])}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showCurrencyMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {availableCurrencies.map(currency => (
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
                  <div className="relative" ref={typeMenuRef}>
                    <button
                      onClick={() => {
                        setShowTypeMenu(v => !v);
                        setShowCurrencyMenu(false);
                        setShowStatusMenu(false);
                      }}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span>{filters.type === 'all' ? 'All Types' : capitalize(filters.type)}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showTypeMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'all' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          All Types
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'lend' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'lend' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.lend')}
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, type: 'borrow' }); setShowTypeMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.type === 'borrow' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.borrow')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="relative" ref={statusMenuRef}>
                    <button
                      onClick={() => {
                        setShowStatusMenu(v => !v);
                        setShowCurrencyMenu(false);
                        setShowTypeMenu(false);
                      }}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-100 px-4 py-2 pr-[10px] text-[14px] h-10 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
                    >
                      <span>{filters.status === 'all' ? 'All Status' : capitalize(filters.status)}</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'all' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'all' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          All Status
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'active' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.active')}
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'settled' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'settled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.settled')}
                        </button>
                        <button
                          onClick={() => { setFilters({ ...filters, status: 'overdue' }); setShowStatusMenu(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100 ${filters.status === 'overdue' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : ''}`}
                        >
                          {t('lendBorrow.overdue')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {(filters.search || filters.type !== 'all' || filters.status !== 'all') && (
                  <button
                    onClick={() => setFilters({ search: '', type: 'all', status: 'all', currency: '' })}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Clear all filters"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                <div className="ml-auto">
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap h-10 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Add Lend/Borrow
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards Grid (above table header) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 pt-4 pb-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Lend</p>
                  <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.total_lent, currentAnalytics.currency)}
                  </p>
                </div>
                <span className="text-3xl font-bold text-green-600 dark:text-green-400">$</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Borrowed</p>
                  <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.total_borrowed, currentAnalytics.currency)}
                  </p>
                </div>
                <span className="text-3xl font-bold text-red-600 dark:text-red-400">$</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 py-3 px-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Outstanding</p>
                  <p className="font-bold text-gray-900 dark:text-white" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(currentAnalytics.outstanding_lent - currentAnalytics.outstanding_borrowed, currentAnalytics.currency)}
                  </p>
                </div>
                <span className="text-3xl font-bold text-blue-600 dark:text-blue-400"><Clock className="w-8 h-8" /></span>
              </div>
            </div>
          </div>
          {/* Table Section */}
          <div className="overflow-y-auto" style={{ maxHeight: '65vh' }}>
            <LendBorrowList
              records={filteredRecords}
              loading={loading}
              onEdit={record => setEditingRecord(record)}
              onDelete={handleDeleteRecord}
              onUpdateStatus={handleUpdateStatus}
              onPartialReturn={handlePartialReturn}
            />
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <LendBorrowForm
          onClose={() => setShowForm(false)}
          onSubmit={handleAddRecord}
        />
      )}

      {/* Edit Form Modal */}
      {editingRecord && (
        <LendBorrowForm
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSubmit={async (updates) => {
            try {
              await handleUpdateRecord(editingRecord.id, updates);
            } catch (error) {
              console.error('Error in edit form submission:', error);
            }
          }}
        />
      )}

      {/* Partial Return Modal */}
      {partialReturnRecord && (
        console.log('Rendering PartialReturnModal for:', partialReturnRecord),
        <PartialReturnModal
          isOpen={!!partialReturnRecord}
          record={partialReturnRecord}
          onClose={() => setPartialReturnRecord(null)}
          onUpdated={handlePartialReturnUpdated}
        />
      )}
    </div>
  );
}; 