import React, { useState, useEffect, useMemo } from 'react';
import { Heart, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useFinanceStore } from '../../store/useFinanceStore';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { useAuthStore } from '../../store/authStore';

export const DonationSavingsCard: React.FC<{ t: any; formatCurrency: any }> = ({ t, formatCurrency }) => {
  const accounts = useFinanceStore(state => state.accounts);
  const transactions = useFinanceStore(state => state.transactions);
  const { profile } = useAuthStore();
  const [donationSavingRecords, setDonationSavingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCurrency, setFilterCurrency] = useState('');

  // Get all unique currencies from accounts
  const recordCurrencies = useMemo(() => {
    return Array.from(new Set(accounts.map(a => a.currency)));
  }, [accounts]);

  // Set default currency filter
  useEffect(() => {
    if (!filterCurrency && recordCurrencies.length > 0) {
      setFilterCurrency(recordCurrencies[0]);
    }
  }, [recordCurrencies, filterCurrency]);

  // Fetch all donation records (not filtered by currency)
  useEffect(() => {
    setLoading(true);
    supabase
      .from('donation_saving_records')
      .select('*')
      .then(({ data, error }) => {
        if (!error) setDonationSavingRecords(data || []);
        setLoading(false);
      });
  }, []);

  // Auto refresh removed - data will only be fetched on component mount

  // Calculate totalDonated using the same logic as Donations page
  const totalDonated = useMemo(() => {
    return donationSavingRecords.filter(record => {
      if (record.status !== 'donated') return false;
      const transaction = transactions.find(t => t.id === record.transaction_id);
      const account = transaction ? accounts.find(a => a.id === transaction.account_id) : undefined;
      return account && account.currency === filterCurrency;
    }).reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [donationSavingRecords, accounts, transactions, filterCurrency]);

  // Calculate totalSaved by checking all DPS accounts and their linked savings accounts
  const totalSaved = useMemo(() => {
    let total = 0;
    
    // Get all DPS accounts for the selected currency
    const dpsAccounts = accounts.filter(a => a.has_dps && a.currency === filterCurrency);
    
    dpsAccounts.forEach(dpsAccount => {
      // If the DPS account has a linked savings account, add its balance
      if (dpsAccount.dps_savings_account_id) {
        const savingsAccount = accounts.find(a => a.id === dpsAccount.dps_savings_account_id);
        if (savingsAccount) {
          total += savingsAccount.calculated_balance || 0;
        }
      }
    });
    
    return total;
  }, [accounts, filterCurrency]);

  // Only show the card if there are actual saved or donated amounts
  if (totalDonated === 0 && totalSaved === 0) {
    return null;
  }

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

  // Card style matches CurrencyOverviewCard
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Donations & Savings</h2>
        {/* Currency Filter using CustomDropdown */}
        <CustomDropdown
          options={currencyOptions}
          value={filterCurrency}
          onChange={setFilterCurrency}
          fullWidth={false}
          className="bg-transparent border-0 shadow-none text-gray-500 text-xs h-7 min-h-0 hover:bg-gray-100 focus:ring-0 focus:outline-none"
          style={{ padding: '10px', paddingRight: '5px' }}
          dropdownMenuClassName="!bg-[#d3d3d3bf] !top-[20px]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {/* Total Donated */}
        <div className="flex flex-col items-center justify-center bg-green-50 dark:bg-green-900/10 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Heart className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Donated</span>
          </div>
          <span className="text-[1.2rem] font-bold text-green-700 dark:text-green-300 tabular-nums text-center">
            {formatCurrency(totalDonated, filterCurrency || 'USD')}
          </span>
        </div>
        {/* Total Saved */}
        <div className="flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/40 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">Total Saved</span>
          </div>
          <span className="text-[1.2rem] font-bold text-red-700 dark:text-red-300 tabular-nums text-center">
            {formatCurrency(totalSaved, filterCurrency || 'USD')}
          </span>
        </div>
      </div>
    </div>
  );
}; 