import React, { useEffect, useState } from 'react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { supabase } from '../../lib/supabase';

export const TransfersView: React.FC = () => {
  const { accounts } = useFinanceStore();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [dpsTransfers, setDpsTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransferHistory();
  }, []);

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch regular transfers
      const { data: transferData, error: transferError } = await supabase
        .from('transactions')
        .select('*, account:accounts(name, currency)')
        .contains('tags', ['transfer'])
        .order('date', { ascending: false });

      if (transferError) throw transferError;

      // Fetch DPS transfers with account details
      const { data: dpsData, error: dpsError } = await supabase
        .from('dps_transfers')
        .select(`
          *,
          from_account:accounts!from_account_id(name, currency),
          to_account:accounts!to_account_id(name, currency)
        `)
        .order('date', { ascending: false });

      if (dpsError) throw dpsError;

      setTransfers(transferData || []);
      setDpsTransfers(dpsData || []);
    } catch (err: any) {
      console.error('Error fetching transfer history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupTransfersByDate = (transfers: any[]) => {
    const grouped = transfers.reduce((acc, transfer) => {
      const date = format(new Date(transfer.date), 'MMMM d, yyyy');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transfer);
      return acc;
    }, {});
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading transfers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  const groupedTransfers = groupTransfersByDate(transfers);
  const groupedDpsTransfers = groupTransfersByDate(dpsTransfers);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Transfer History</h2>
        <p className="text-gray-600">View all your transfers and DPS transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currency Transfers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Currency Transfers</h3>
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {Object.entries(groupedTransfers).map(([date, dateTransfers]) => (
              <div key={date} className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-2">{date}</h4>
                <div className="space-y-3">
                  {(dateTransfers as any[]).map((transfer) => {
                    const fromAccount = accounts.find(a => a.id === transfer.account_id);
                    const toAccountId = transfer.tags?.[2];
                    const toAmount = transfer.tags?.[3];
                    const toAccount = accounts.find(a => a.id === toAccountId);

                    return (
                      <div key={transfer.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{fromAccount?.name}</p>
                              <p className="text-red-600">
                                {formatCurrency(transfer.amount, fromAccount?.currency || 'USD')}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{toAccount?.name}</p>
                              <p className="text-green-600">
                                {formatCurrency(parseFloat(toAmount), toAccount?.currency || 'USD')}
                              </p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(transfer.date), 'h:mm a')}
                          </div>
                        </div>
                        {transfer.note && (
                          <p className="mt-2 text-sm text-gray-500">{transfer.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(groupedTransfers).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No currency transfers found
              </div>
            )}
          </div>
        </div>

        {/* DPS Transfers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DPS Transfers</h3>
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {Object.entries(groupedDpsTransfers).map(([date, dateTransfers]) => (
              <div key={date} className="space-y-3">
                <h4 className="text-sm font-medium text-gray-500 sticky top-0 bg-white py-2">{date}</h4>
                <div className="space-y-3">
                  {(dateTransfers as any[]).map((transfer) => (
                    <div key={transfer.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{transfer.from_account.name}</p>
                            <p className="text-red-600">
                              {formatCurrency(transfer.amount, transfer.from_account.currency)}
                            </p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">{transfer.to_account.name}</p>
                            <p className="text-green-600">
                              {formatCurrency(transfer.amount, transfer.to_account.currency)}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(transfer.date), 'h:mm a')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedDpsTransfers).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No DPS transfers found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 