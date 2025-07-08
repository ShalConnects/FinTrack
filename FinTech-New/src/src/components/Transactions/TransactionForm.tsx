import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { createNotification } from '../../lib/notifications';
import { useAuthStore } from '../../store/authStore';
import { Transaction, Account } from '../../types/index';
import { supabase } from '../../lib/supabase';

interface TransactionFormProps {
  accountId?: string;
  onClose: () => void;
  transactionToEdit?: Transaction;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ accountId, onClose, transactionToEdit }) => {
  const { 
    accounts, 
    categories,
    purchaseCategories,
    addTransaction, 
    updateTransaction, 
    loading, 
    error,
    addPurchaseCategory,
    addAccount,
    fetchAccounts,
    addCategory
  } = useFinanceStore();
  const { user } = useAuthStore();
  const isEditMode = !!transactionToEdit;

  const [data, setData] = useState({
    account_id: accountId || '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category: '',
    description: '',
    tags: [] as string[],
    date: new Date().toISOString().split('T')[0],
    is_recurring: false,
    recurring_frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly'
  });

  const [isExpenseType, setIsExpenseType] = useState<'purchase' | 'cash_withdrawal'>('purchase');
  const [savingType, setSavingType] = useState<'fixed' | 'percent'>('fixed');
  const [savingValue, setSavingValue] = useState<number | undefined>(undefined);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    category_name: '',
    description: '',
    monthly_budget: 0,
    category_color: '#10B981'
  });

  useEffect(() => {
    if (transactionToEdit) {
      setData({
        account_id: transactionToEdit.account_id,
        amount: transactionToEdit.amount.toString(),
        type: transactionToEdit.type,
        category: transactionToEdit.category,
        description: transactionToEdit.description,
        tags: transactionToEdit.tags || [],
        date: new Date(transactionToEdit.date).toISOString().split('T')[0],
        is_recurring: transactionToEdit.is_recurring,
        recurring_frequency: (transactionToEdit.recurring_frequency as 'daily' | 'weekly' | 'monthly' | 'yearly') || 'monthly'
      });
      // Set expense type based on category
      if (transactionToEdit.type === 'expense') {
        setIsExpenseType(transactionToEdit.category === 'Cash Withdrawal' ? 'cash_withdrawal' : 'purchase');
      }
    }
  }, [transactionToEdit]);

  useEffect(() => {
    if (transactionToEdit && transactionToEdit.type === 'income') {
      if (typeof transactionToEdit.saving_amount === 'number') {
        if (transactionToEdit.saving_amount < 0) {
          setSavingType('percent');
          setSavingValue(Math.abs(transactionToEdit.saving_amount));
        } else {
          setSavingType('fixed');
          setSavingValue(transactionToEdit.saving_amount);
        }
      }
    }
  }, [transactionToEdit]);

  // Get the cash account or create one if it doesn't exist
  const getCashAccount = async () => {
    console.log('Looking for cash account...');
    const cashAccount = accounts.find(a => a.name === 'Cash Wallet');
    if (cashAccount) {
      console.log('Found existing cash account:', cashAccount);
      return cashAccount;
    }

    console.log('No cash account found, creating new one...');
    // Get the source account to use its currency
    const sourceAccount = accounts.find(a => a.id === data.account_id);
    const defaultCurrency = sourceAccount?.currency || 'USD';
    console.log('Using currency:', defaultCurrency);

    try {
      // Create a new cash account directly using supabase
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: newCashAccount, error } = await supabase
        .from('accounts')
        .insert([{
          name: 'Cash Wallet',
          type: 'checking', // Use checking type temporarily if cash is not allowed
          initial_balance: 0,
          currency: defaultCurrency,
          description: 'Cash wallet for tracking physical money',
          has_dps: false,
          dps_type: null,
          dps_amount_type: null,
          dps_fixed_amount: null,
          is_active: true,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating cash account:', error);
        throw new Error(`Failed to create cash account: ${error.message}`);
      }

      console.log('Cash account created successfully:', newCashAccount);
      
      // Refresh accounts list
      await fetchAccounts();
      
      // Find the newly created account
      const refreshedAccounts = await supabase
        .from('account_balances')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'Cash Wallet')
        .order('created_at', { ascending: false });

      if (refreshedAccounts.error) {
        console.error('Error fetching refreshed accounts:', refreshedAccounts.error);
        throw new Error('Failed to fetch updated accounts');
      }

      const cashAccount = refreshedAccounts.data?.[0];
      if (!cashAccount) {
        throw new Error('Cash account was created but not found in refreshed list');
      }

      console.log('Found cash account in refreshed list:', cashAccount);
      return {
        ...cashAccount,
        id: cashAccount.account_id,
        isActive: cashAccount.is_active,
        calculated_balance: Number(cashAccount.calculated_balance) || 0,
        initial_balance: Number(cashAccount.initial_balance) || 0,
      };
    } catch (error) {
      console.error('Error in getCashAccount:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.account_id || !data.amount || !data.type) {
      return;
    }

    let saving_amount: number | undefined = undefined;
    if (data.type === 'income' && savingValue !== undefined && !isNaN(savingValue)) {
      saving_amount = savingType === 'percent' ? -Math.abs(savingValue) : Math.abs(savingValue);
    }

    try {
      if (data.type === 'expense' && isExpenseType === 'cash_withdrawal') {
        console.log('Processing cash withdrawal...');
        // Handle cash withdrawal
        const cashAccount = await getCashAccount();
        if (!cashAccount) {
          throw new Error('Failed to get or create cash account');
        }

        console.log('Cash account found:', cashAccount);

        // Create withdrawal transaction
        const withdrawalData = {
          account_id: data.account_id,
          amount: parseFloat(data.amount),
          type: 'expense' as const,
          category: 'Cash Withdrawal',
          description: data.description || 'Cash Withdrawal',
          date: new Date(data.date).toISOString(),
          tags: ['cash_withdrawal'],
          user_id: user?.id || ''
        };

        console.log('Withdrawal data:', withdrawalData);

        // Create deposit transaction for cash account
        const depositData = {
          account_id: cashAccount.id,
          amount: parseFloat(data.amount),
          type: 'income' as const,
          category: 'Cash Deposit',
          description: data.description || 'Cash Withdrawal',
          date: new Date(data.date).toISOString(),
          tags: ['transfer', 'cash_deposit'],
          user_id: user?.id || ''
        };

        console.log('Deposit data:', depositData);

        if (isEditMode && transactionToEdit) {
          await updateTransaction(transactionToEdit.id, withdrawalData);
        } else {
          console.log('Adding withdrawal transaction...');
          await addTransaction(withdrawalData);
          console.log('Adding deposit transaction...');
          await addTransaction(depositData);
          console.log('Both transactions added successfully');
        }
      } else {
        console.log('Processing regular transaction...');
        // Handle regular transaction
        const transactionData = {
          account_id: data.account_id,
          amount: parseFloat(data.amount),
          type: data.type,
          category: data.category,
          description: data.description,
          date: new Date(data.date).toISOString(),
          tags: data.tags,
          saving_amount,
          is_recurring: data.is_recurring,
          recurring_frequency: data.is_recurring ? data.recurring_frequency : undefined,
          user_id: user?.id || ''
        };

        console.log('Transaction data:', transactionData);

        if (isEditMode && transactionToEdit) {
          await updateTransaction(transactionToEdit.id, transactionData);
        } else {
          await addTransaction(transactionData);
        }
      }

      if (user) {
        await createNotification(
          user.id,
          isEditMode ? 'Transaction Updated' : 'New Transaction',
          'success',
          `${isEditMode ? 'Updated' : 'Added'} ${data.type} of ${data.amount}`
        );
      }

      onClose();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Account</label>
            <select
              value={data.account_id}
              onChange={(e) => setData({ ...data, account_id: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select an account</option>
              {accounts
                .filter(account => account.type !== 'cash' && !account.name.includes('(DPS)'))
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.currency})
                  </option>
                ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              step="0.01"
              value={data.amount}
              onChange={(e) => setData({ ...data, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={data.type}
              onChange={(e) => {
                const newType = e.target.value as 'income' | 'expense';
                setData({ ...data, type: newType, category: '' });
                if (newType === 'expense') {
                  setIsExpenseType('purchase');
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>

          {/* Expense Type Selection */}
          {data.type === 'expense' && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Expense Type</label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="purchase"
                    checked={isExpenseType === 'purchase'}
                    onChange={(e) => {
                      setIsExpenseType('purchase');
                      setData(prev => ({ ...prev, category: '' }));
                    }}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Purchase</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="cash_withdrawal"
                    checked={isExpenseType === 'cash_withdrawal'}
                    onChange={(e) => {
                      setIsExpenseType('cash_withdrawal');
                      setData(prev => ({ ...prev, category: 'Cash Withdrawal' }));
                    }}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2">Cash Withdrawal</span>
                </label>
              </div>
            </div>
          )}

          {/* Category */}
          {data.type === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={data.category}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowCategoryModal(true);
                  } else {
                    setData({ ...data, category: e.target.value });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories
                  .filter((cat) => cat.type === 'income')
                  .map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                <option value="__add_new__">+ Add New Category</option>
              </select>
            </div>
          )}

          {data.type === 'expense' && isExpenseType === 'purchase' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={data.category}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setShowCategoryModal(true);
                  } else {
                    setData({ ...data, category: e.target.value });
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {purchaseCategories.map((category) => (
                  <option key={category.id} value={category.category_name}>
                    {category.category_name}
                  </option>
                ))}
                <option value="__add_new__">+ Add New Category</option>
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => setData({ ...data, date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          {/* Recurring Transaction */}
          {isExpenseType !== 'cash_withdrawal' && (
            <>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={data.is_recurring}
                  onChange={(e) => setData({ ...data, is_recurring: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
                  Recurring Transaction
                </label>
              </div>

              {data.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Frequency</label>
                  <select
                    value={data.recurring_frequency}
                    onChange={(e) =>
                      setData({
                        ...data,
                        recurring_frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}
            </>
          )}

          {data.type === 'income' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saving Preference (how much to save from this income)
              </label>
              <div className="flex items-center space-x-4 mb-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    value="fixed"
                    checked={savingType === 'fixed'}
                    onChange={() => setSavingType('fixed')}
                  />
                  <span>Fixed Amount</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    value="percent"
                    checked={savingType === 'percent'}
                    onChange={() => setSavingType('percent')}
                  />
                  <span>Percentage</span>
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={savingValue === undefined ? '' : savingValue}
                  onChange={e => setSavingValue(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder={savingType === 'fixed' ? 'e.g., 100 (for $100)' : 'e.g., 10 (for 10%)'}
                />
                <span className="text-gray-500 text-lg">{savingType === 'fixed' ? '$' : '%'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {savingType === 'fixed'
                  ? `You will save: $${savingValue || 0} from this income`
                  : `You will save: ${savingValue || 0}% from this income`}
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={() => setShowCategoryModal(false)} />
          <div className="relative bg-white w-full max-w-md shadow-xl p-6 rounded-lg animate-fadein">
            <h2 className="text-xl font-bold mb-4">Add New Category</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (data.type === 'income') {
                  addCategory({ 
                    name: newCategory.category_name,
                    type: 'income',
                    color: newCategory.category_color,
                    icon: ''
                  });
                  setData({ ...data, category: newCategory.category_name });
                } else {
                  addPurchaseCategory(newCategory);
                  setData({ ...data, category: newCategory.category_name });
                }
                setShowCategoryModal(false);
                setNewCategory({
                  category_name: '',
                  description: '',
                  monthly_budget: 0,
                  category_color: '#10B981'
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newCategory.category_name}
                  onChange={e => setNewCategory({ ...newCategory, category_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              {data.type === 'expense' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={newCategory.description}
                      onChange={e => setNewCategory({ ...newCategory, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Brief description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Budget</label>
                    <input
                      type="number"
                      value={newCategory.monthly_budget}
                      onChange={e => setNewCategory({ ...newCategory, monthly_budget: parseFloat(e.target.value) || 0 })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Color</label>
                <input
                  type="color"
                  value={newCategory.category_color}
                  onChange={e => setNewCategory({ ...newCategory, category_color: e.target.value })}
                  className="mt-1 block w-16 h-10 rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="px-4 py-2 rounded bg-gray-100 text-gray-700" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};