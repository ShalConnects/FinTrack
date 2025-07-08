import { create } from 'zustand';
import { Account, Transaction, Category, Budget, DashboardStats, SavingsGoal, Purchase, PurchaseCategory, PurchaseAnalytics } from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

// Extend the Account type to make calculated_balance optional for input
type AccountInput = Omit<Account, 'calculated_balance'>;

interface FinanceStore {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  purchases: Purchase[];
  purchaseCategories: PurchaseCategory[];
  loading: boolean;
  error: string | null;
  globalSearchTerm: string;
  showTransactionForm: boolean;
  showAccountForm: boolean;
  showTransferModal: boolean;

  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<AccountInput, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<AccountInput>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  
  // Purchase Management
  fetchPurchases: () => Promise<void>;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  bulkUpdatePurchases: (ids: string[], updates: Partial<Purchase>) => Promise<void>;
  
  fetchPurchaseCategories: () => Promise<void>;
  addPurchaseCategory: (category: Omit<PurchaseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePurchaseCategory: (id: string, category: Partial<PurchaseCategory>) => Promise<void>;
  deletePurchaseCategory: (id: number) => Promise<void>;
  fetchAllData: () => Promise<void>;
  
  getPurchaseAnalytics: () => PurchaseAnalytics;
  getPurchasesByCategory: (category: string) => Purchase[];
  getPurchasesByStatus: (status: Purchase['status']) => Purchase[];
  
  getDashboardStats: () => DashboardStats;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (category: string) => Transaction[];

  setGlobalSearchTerm: (term: string) => void;
  setShowTransactionForm: (show: boolean) => void;
  setShowAccountForm: (show: boolean) => void;
  setShowTransferModal: (show: boolean) => void;

  getActiveAccounts: () => Account[];
  getActiveTransactions: () => Transaction[];

  transfer: (params: {
    from_account_id: string,
    to_account_id: string,
    from_amount: number,
    exchange_rate: number,
    note?: string
  }) => Promise<void>;

  fetchSavingsGoals: () => Promise<void>;
  createSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'current_amount'>) => Promise<void>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
  deleteSavingsGoal: (id: string) => Promise<void>;

  saveSavingsGoal: (goalId: string, amount: number) => Promise<void>;

  transferDPS: (params: {
    from_account_id: string,
    amount: number
  }) => Promise<void>;

  getCategories: () => Category[];
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Salary', type: 'income', color: '#10B981', icon: 'Banknote' },
  { id: '2', name: 'Freelance', type: 'income', color: '#3B82F6', icon: 'Laptop' },
  { id: '3', name: 'Investment', type: 'income', color: '#8B5CF6', icon: 'TrendingUp' },
  { id: '4', name: 'Food & Dining', type: 'expense', color: '#F59E0B', icon: 'UtensilsCrossed' },
  { id: '5', name: 'Transportation', type: 'expense', color: '#EF4444', icon: 'Car' },
  { id: '6', name: 'Shopping', type: 'expense', color: '#EC4899', icon: 'ShoppingBag' },
  { id: '7', name: 'Entertainment', type: 'expense', color: '#14B8A6', icon: 'Film' },
  { id: '8', name: 'Bills & Utilities', type: 'expense', color: '#6366F1', icon: 'Receipt' },
];

export const useFinanceStore = create<FinanceStore>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: defaultCategories,
  budgets: [],
  savingsGoals: [],
  purchases: [],
  purchaseCategories: [],
  loading: false,
  error: null,
  globalSearchTerm: '',
  showTransactionForm: false,
  showAccountForm: false,
  showTransferModal: false,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    console.log('Fetching accounts...');
    
    const { user } = useAuthStore.getState();
    if (!user) {
      console.error('No user found');
      return set({ loading: false, error: 'Not authenticated' });
    }
    
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return set({ loading: false, error: error.message });
    }

    console.log('Raw accounts data:', data);
    console.log('DPS accounts:', data?.filter(a => a.has_dps));
    console.log('Account fields:', data?.[0] ? Object.keys(data[0]) : 'No accounts');

    const accounts = data.map(account => ({
      ...account,
      id: account.id,
      isActive: account.is_active,
      calculated_balance: Number(account.calculated_balance) || 0,
      initial_balance: Number(account.initial_balance) || 0,
    }));

    console.log('Processed accounts:', accounts);
    console.log('Processed DPS accounts:', accounts.filter(a => a.has_dps));

    set({ accounts, loading: false });
    
    // Mock data (commented out):
    // const mockAccounts = [...];
    // set({ accounts: mockAccounts, loading: false });
  },

  addAccount: async (account: Omit<AccountInput, 'id' | 'user_id' | 'created_at'>) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // First create the main account
      const { data: mainAccount, error: mainError } = await supabase
        .from('accounts')
        .insert([{
          ...account,
          user_id: user.id,
          is_active: true,
          has_dps: account.has_dps || false,
          dps_type: account.has_dps ? account.dps_type : null,
          dps_amount_type: account.has_dps ? account.dps_amount_type : null,
          dps_fixed_amount: account.has_dps && account.dps_amount_type === 'fixed' ? account.dps_fixed_amount : null
        }])
        .select()
        .single();

      if (mainError) throw mainError;

      // If this is a DPS account, create a linked savings account
      if (account.has_dps) {
        const { data: savingsAccount, error: savingsError } = await supabase
          .from('accounts')
          .insert([{
            name: `${account.name} (DPS)`,
            type: 'savings',
            initial_balance: 0,
            calculated_balance: 0,
            currency: account.currency,
            user_id: user.id,
            is_active: true,
            description: `DPS account for ${account.name}`
          }])
          .select()
          .single();

        if (savingsError) throw savingsError;

        // Update the main account with the savings account ID
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ dps_savings_account_id: savingsAccount.id })
          .eq('id', mainAccount.id);

        if (updateError) throw updateError;
      }

      await get().fetchAccounts();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to add account', loading: false });
    }
  },
  
  updateAccount: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Get the current account state
      const currentAccount = get().accounts.find(a => a.id === id);
      if (!currentAccount) throw new Error('Account not found');

      // Convert isActive to is_active for database
      const dbUpdates: any = {
        ...updates,
        is_active: updates.isActive,
        has_dps: updates.has_dps || false,
        dps_type: updates.has_dps ? updates.dps_type : null,
        dps_amount_type: updates.has_dps ? updates.dps_amount_type : null,
        dps_fixed_amount: updates.has_dps && updates.dps_amount_type === 'fixed' ? updates.dps_fixed_amount : null
      };
      delete dbUpdates.isActive;

      // If DPS is being enabled and there's no savings account linked
      if (updates.has_dps && !currentAccount.has_dps) {
        // Create a linked savings account
        const { data: savingsAccount, error: savingsError } = await supabase
          .from('accounts')
          .insert([{
            name: `${currentAccount.name} (DPS)`,
            type: 'savings',
            initial_balance: 0,
            calculated_balance: 0,
            currency: currentAccount.currency,
            user_id: user.id,
            is_active: true,
            description: `DPS account for ${currentAccount.name}`
          }])
          .select()
          .single();

        if (savingsError) throw savingsError;

        // Add the savings account ID to the updates
        dbUpdates.dps_savings_account_id = savingsAccount.id;
      }

      // Update the account
      const { error } = await supabase
        .from('accounts')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchAccounts();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update account', loading: false });
      throw err;
    }
  },
  
  deleteAccount: async (id) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) return set({ loading: false, error: error.message });
    await get().fetchAccounts();
    set({ loading: false });
  },

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    console.log('Fetching transactions...');
    
    const { user } = useAuthStore.getState();
    if (!user) {
      console.error('No user found');
      return set({ loading: false, error: 'Not authenticated' });
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching transactions:', error);
      return set({ loading: false, error: error.message });
    }

    console.log('Transactions data:', data);
    set({ transactions: data || [], loading: false });
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    set({ loading: true, error: null });
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });
    
    const { error } = await supabase.from('transactions').insert({
      ...transaction,
      user_id: user.id,
    });
    
    if (error) return set({ loading: false, error: error.message });
    
    // Refresh both transactions and accounts to get updated balances
    await Promise.all([
      get().fetchTransactions(),
      get().fetchAccounts()
    ]);
    set({ loading: false });
  },

  updateTransaction: async (id: string, transaction: Partial<Transaction>) => {
    set({ loading: true, error: null });
    const { error } = await supabase
      .from('transactions')
      .update(transaction)
      .eq('id', id);
      
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    
    // Refresh both transactions and accounts to get updated balances
    await Promise.all([
      get().fetchTransactions(),
      get().fetchAccounts()
    ]);
    set({ loading: false });
  },
  
  deleteTransaction: async (id) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return set({ loading: false, error: error.message });
    
    // Refresh both transactions and accounts to get updated balances
    await Promise.all([
      get().fetchTransactions(),
      get().fetchAccounts()
    ]);
    set({ loading: false });
  },
  
  addCategory: (categoryData) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    set((state) => ({ categories: [...state.categories, newCategory] }));
    
    // If this is an expense category, also create a purchase category to unify them
    if (categoryData.type === 'expense') {
      const { user } = useAuthStore.getState();
      if (user && user.id) {
        const newPurchaseCategory: PurchaseCategory = {
          id: crypto.randomUUID(),
          user_id: user.id,
          category_name: categoryData.name,
          description: `Category for ${categoryData.name}`,
          monthly_budget: 0, // Default budget, user can update later
          category_color: categoryData.color || '#3B82F6', // Default blue color if undefined
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        set((state) => ({ 
          purchaseCategories: [newPurchaseCategory, ...state.purchaseCategories]
        }));
      }
    }
  },
  
  deleteCategory: (id) => {
    set((state) => ({ categories: state.categories.filter((cat) => cat.id !== id) }));
  },
  
  getDashboardStats: () => {
    const { accounts, transactions } = get();
    const activeAccounts = accounts.filter(a => a.isActive);
    const activeAccountIds = activeAccounts.map(a => a.id);
    const activeTransactions = transactions.filter(t => activeAccountIds.includes(t.account_id));

    // Group by currency
    const byCurrency = activeAccounts.reduce((acc: any[], account) => {
      const currencyGroup = acc.find(g => g.currency === account.currency);
      if (!currencyGroup) {
        // Calculate monthly income and expenses for this currency
        const monthlyTransactions = activeTransactions.filter(t => {
          const transactionAccount = activeAccounts.find(a => a.id === t.account_id);
          return transactionAccount?.currency === account.currency &&
                 new Date(t.date).getMonth() === new Date().getMonth() &&
                 !t.tags?.some(tag => tag.includes('transfer') || tag.includes('dps_transfer'));
        });

    const monthlyIncome = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const monthlyExpenses = monthlyTransactions
          .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

        acc.push({
          currency: account.currency,
          balance: account.calculated_balance || 0,
          monthlyIncome,
          monthlyExpenses
        });
      } else {
        currencyGroup.balance += (account.calculated_balance || 0);
      }
      return acc;
    }, []);
    
    return {
      byCurrency,
      accountsCount: activeAccounts.length,
      transactionsCount: transactions.length
    };
  },
  
  getTransactionsByAccount: (accountId: string) => {
    return get().transactions.filter((transaction: Transaction) => transaction.account_id === accountId);
  },
  
  getTransactionsByCategory: (category: string) => {
    return get().transactions.filter((transaction: Transaction) => transaction.category === category);
  },

  setGlobalSearchTerm: (term: string) => set({ globalSearchTerm: term }),

  getActiveAccounts: () => get().accounts.filter(a => a.isActive),
  
  getActiveTransactions: () => {
    const activeAccounts = get().accounts.filter(a => a.isActive);
    const activeAccountIds = activeAccounts.map(a => a.id);
    return get().transactions.filter(t => activeAccountIds.includes(t.account_id));
  },

  getCategories: () => get().categories,

  setShowTransactionForm: (show: boolean) => set({ showTransactionForm: show }),
  setShowAccountForm: (show: boolean) => set({ showAccountForm: show }),
  setShowTransferModal: (show: boolean) => set({ showTransferModal: show }),

  transfer: async ({ from_account_id, to_account_id, from_amount, exchange_rate, note }: {
    from_account_id: string,
    to_account_id: string,
    from_amount: number,
    exchange_rate: number,
    note?: string
  }) => {
    set({ loading: true, error: null });
    try {
      const { accounts } = get();
      const fromAcc = accounts.find(a => a.id === from_account_id);
      const toAcc = accounts.find(a => a.id === to_account_id);
      
      if (!fromAcc || !toAcc) {
        throw new Error('Invalid account selection');
      }
      if (fromAcc.id === toAcc.id) {
        throw new Error('Source and destination accounts must be different');
      }
      if (fromAcc.calculated_balance < from_amount) {
        throw new Error('Insufficient funds');
      }
      
      const to_amount = from_amount * exchange_rate;
      const { user } = useAuthStore.getState();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const transferId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create expense transaction for source account
      const { error: sourceError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: from_account_id,
        amount: from_amount,
        type: 'expense',
        description: note || `Transfer to ${toAcc.name}`,
        date: now,
        category: 'Transfer',
        tags: ['transfer', transferId, to_account_id, to_amount.toString()]
      });

      if (sourceError) {
        throw new Error(`Failed to create source transaction: ${sourceError.message}`);
      }

      // Create income transaction for destination account
      const { error: destError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: to_account_id,
        amount: to_amount,
        type: 'income',
        description: note || `Transfer from ${fromAcc.name}`,
        date: now,
        category: 'Transfer',
        tags: ['transfer', transferId, from_account_id, from_amount.toString()]
      });

      if (destError) {
        // Rollback the source transaction if destination fails
        await supabase.from('transactions')
          .delete()
          .match({ user_id: user.id, tags: ['transfer', transferId] });
        throw new Error(`Failed to create destination transaction: ${destError.message}`);
      }

      // Update account balances
      const { error: sourceUpdateError } = await supabase
        .from('accounts')
        .update({ 
          calculated_balance: fromAcc.calculated_balance - from_amount 
        })
        .eq('id', from_account_id);

      if (sourceUpdateError) throw sourceUpdateError;

      const { error: destUpdateError } = await supabase
        .from('accounts')
        .update({ 
          calculated_balance: toAcc.calculated_balance + to_amount 
        })
        .eq('id', to_account_id);

      if (destUpdateError) throw destUpdateError;

      // Refresh both transactions and accounts to get updated balances
      await Promise.all([
        get().fetchTransactions(),
        get().fetchAccounts()
      ]);

      set({ loading: false, error: null });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  fetchSavingsGoals: async () => {
    try {
      set({ loading: true, error: null });
      
      const { user } = useAuthStore.getState();
      if (!user) {
        console.error('No user found');
        return set({ loading: false, error: 'Not authenticated' });
      }
      
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ savingsGoals: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch savings goals', loading: false });
    }
  },

  createSavingsGoal: async (goal) => {
    try {
      set({ loading: true, error: null });
      
      // First create a new savings account
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .insert([{
          name: `${goal.name} (Savings)`,
          type: 'savings',
          balance: 0,
          currency: (await get().accounts.find(a => a.id === goal.source_account_id))?.currency || 'USD',
          description: goal.description
        }])
        .select()
        .single();

      if (accountError) throw accountError;

      // Then create the savings goal
      const { error: goalError } = await supabase
        .from('savings_goals')
        .insert([{
          ...goal,
          savings_account_id: accountData.id,
          current_amount: 0
        }]);

      if (goalError) throw goalError;

      // Refresh the data
      await get().fetchSavingsGoals();
      await get().fetchAccounts();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to create savings goal', loading: false });
    }
  },

  updateSavingsGoal: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('savings_goals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await get().fetchSavingsGoals();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to update savings goal', loading: false });
    }
  },

  deleteSavingsGoal: async (id) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await get().fetchSavingsGoals();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete savings goal', loading: false });
    }
  },

  saveSavingsGoal: async (goalId: string, amount: number) => {
    try {
      set({ loading: true, error: null });
      const goal = get().savingsGoals.find(g => g.id === goalId);
      if (!goal) throw new Error('Savings goal not found');

      // Create the transfer
      const transferId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Create expense transaction for source account
      const { error: sourceTransactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: goal.source_account_id,
        type: 'expense',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.savings_account_id, 'savings']
      });

      if (sourceTransactionError) throw sourceTransactionError;

      // Create income transaction for savings account
      const { error: destTransactionError } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: goal.savings_account_id,
        type: 'income',
        amount,
        description: `Savings: ${goal.name}`,
        category: 'Transfer',
        date: now,
        tags: ['transfer', transferId, goal.source_account_id, 'savings']
      });

      if (destTransactionError) throw destTransactionError;

      // Update the goal's current amount
      const { error: updateError } = await supabase
        .from('savings_goals')
        .update({ current_amount: goal.current_amount + amount })
        .eq('id', goalId);

      if (updateError) throw updateError;

      // Refresh the data
      await get().fetchSavingsGoals();
      await get().fetchAccounts();
      await get().fetchTransactions();
      set({ loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to save to goal', loading: false });
    }
  },

  transferDPS: async ({ from_account_id, amount }: { from_account_id: string, amount: number }) => {
    try {
      set({ loading: true, error: null });
      console.log('Starting transferDPS with:', { from_account_id, amount });
      
      const { user } = useAuthStore.getState();
      if (!user) throw new Error('Not authenticated');

      // Get the source account
      const sourceAccount = get().accounts.find(a => a.id === from_account_id);
      console.log('Source account:', sourceAccount);
      
      if (!sourceAccount) throw new Error('Source account not found');
      if (!sourceAccount.has_dps) throw new Error('Account does not have DPS enabled');
      if (!sourceAccount.dps_savings_account_id) throw new Error('DPS savings account not found');

      // Get the destination (savings) account
      const destAccount = get().accounts.find(a => a.id === sourceAccount.dps_savings_account_id);
      console.log('Destination account:', destAccount);
      
      if (!destAccount) throw new Error('DPS savings account not found');

      // Create transaction records
      console.log('Creating transaction records...');
      const transferId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Create expense transaction for source account
      const { error: sourceTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: from_account_id,
          amount: amount,
          type: 'expense',
          description: `DPS Transfer to ${destAccount.name}`,
          date: now,
          category: 'DPS',
          tags: [`dps_transfer_${transferId}`]
        });

      if (sourceTransactionError) {
        console.error('Source transaction error:', sourceTransactionError);
        throw sourceTransactionError;
      }

      // Create income transaction for destination account
      const { error: destTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          account_id: sourceAccount.dps_savings_account_id,
          amount: amount,
          type: 'income',
          description: `DPS Transfer from ${sourceAccount.name}`,
          date: now,
          category: 'DPS',
          tags: [`dps_transfer_${transferId}`]
        });

      if (destTransactionError) {
        console.error('Destination transaction error:', destTransactionError);
        // Rollback the source transaction
        await supabase
          .from('transactions')
          .delete()
          .match({ tags: [`dps_transfer_${transferId}`] });
        throw destTransactionError;
      }

      // Create DPS transfer record
      console.log('Creating DPS transfer record...');
      const { error: dpsError } = await supabase
        .from('dps_transfers')
        .insert({
          user_id: user.id,
          from_account_id,
          to_account_id: sourceAccount.dps_savings_account_id,
          amount,
          date: now
        });

      if (dpsError) {
        console.error('DPS transfer record error:', dpsError);
        // Rollback the transactions
        await supabase
          .from('transactions')
          .delete()
          .match({ tags: [`dps_transfer_${transferId}`] });
        throw dpsError;
      }

      // Refresh the data
      console.log('Refreshing accounts and transactions...');
      await Promise.all([
        get().fetchAccounts(),
        get().fetchTransactions()
      ]);
      console.log('DPS transfer completed successfully');
      set({ loading: false });
    } catch (err: any) {
      console.error('DPS transfer failed:', err);
      set({ error: err.message || 'Failed to process DPS transfer', loading: false });
      throw err;
    }
  },

  fetchPurchases: async () => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) {
      return set({ loading: false, error: 'Not authenticated' });
    }

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      const errorMessage = error.message ? error.message : 'An unknown error occurred.';
      return set({ loading: false, error: errorMessage });
    }

    set({ purchases: data || [], loading: false });
  },

  addPurchase: async (purchase: Omit<Purchase, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });

    const { error } = await supabase.from('purchases').insert({
      ...purchase,
      user_id: user.id,
    });

    if (error) {
      const errorMessage = error.message ? error.message : 'An unknown error occurred.';
      set({ loading: false, error: errorMessage });
      return;
    }

    await get().fetchPurchases();
    set({ loading: false });
  },

  updatePurchase: async (id: string, purchase: Partial<Purchase>) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('purchases')
      .update(purchase)
      .eq('id', id);
      
    if (error) {
      const errorMessage = error.message ? error.message : 'An unknown error occurred.';
      set({ loading: false, error: errorMessage });
      return;
    }
    
    await get().fetchPurchases();
    set({ loading: false });
  },
  
  deletePurchase: async (id) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      console.error('Error deleting purchase:', error);
      return set({ loading: false, error: error.message });
    }
    
    await get().fetchPurchases();
    set({ loading: false });
  },

  bulkUpdatePurchases: async (ids: string[], updates: Partial<Purchase>) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('purchases')
      .update(updates)
      .in('id', ids);
    
    if (error) {
      set({ loading: false, error: error.message });
      return;
    }
    
    await Promise.all([
      get().fetchPurchases(),
      get().fetchAccounts()
    ]);
    set({ loading: false });
  },

  fetchPurchaseCategories: async () => {
    set({ loading: true, error: null });
    console.log('Fetching purchase categories...');
    
    const { user } = useAuthStore.getState();
    if (!user) {
      console.error('No user found');
      return set({ loading: false, error: 'Not authenticated' });
    }
    
    const { data, error } = await supabase
      .from('purchase_categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      const errorMessage = error.message ? error.message : 'Failed to fetch purchase categories';
      console.error('Error fetching purchase categories:', error);
      return set({ loading: false, error: errorMessage });
    }

    console.log('Purchase categories data:', data);
    set({ purchaseCategories: data || [], loading: false });
  },

  addPurchaseCategory: async (category: Omit<PurchaseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    set({ loading: true, error: null });
    
    const { user } = useAuthStore.getState();
    if (!user) return set({ loading: false, error: 'Not authenticated' });
    
    const { data, error } = await supabase.from('purchase_categories').insert({
      ...category,
      user_id: user.id,
    }).select().single();
    
    if (error) {
      console.error('Error adding purchase category:', error);
      return set({ loading: false, error: error.message });
    }
    
    set((state) => ({ 
      purchaseCategories: [data, ...state.purchaseCategories],
      loading: false 
    }));
  },

  updatePurchaseCategory: async (id: string, category: Partial<PurchaseCategory>) => {
    set({ loading: true, error: null });
    
    const { error } = await supabase
      .from('purchase_categories')
      .update({
        ...category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) {
      console.error('Error updating purchase category:', error);
      set({ loading: false, error: error.message });
      return;
    }
    
    await get().fetchPurchaseCategories();
    set({ loading: false });
  },

  deletePurchaseCategory: async (id: number) => {
    set({ loading: true, error: null });
    const { error } = await supabase.from('purchase_categories').delete().eq('id', id);
    if (error) {
      set({ error: error.message });
    } else {
      set((state) => ({
        purchaseCategories: state.purchaseCategories.filter((c) => c.id !== id),
      }));
    }
    set({ loading: false });
  },

  getPurchaseAnalytics: () => {
    const { purchases } = get();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const monthlyPurchases = purchases.filter(purchase => {
      const purchaseDate = new Date(purchase.purchase_date);
      return purchaseDate.getMonth() === currentMonth && 
             purchaseDate.getFullYear() === currentYear &&
             purchase.status === 'purchased';
    });
    
    const totalSpent = purchases
      .filter(p => p.status === 'purchased')
      .reduce((sum, p) => sum + p.price, 0);
    
    const monthlySpent = monthlyPurchases.reduce((sum, p) => sum + p.price, 0);
    
    const plannedCount = purchases.filter(p => p.status === 'planned').length;
    const purchasedCount = purchases.filter(p => p.status === 'purchased').length;
    const cancelledCount = purchases.filter(p => p.status === 'cancelled').length;
    
    // Calculate category breakdown
    const categoryMap = new Map<string, { total: number; count: number }>();
    purchases
      .filter(p => p.status === 'purchased')
      .forEach(purchase => {
        const existing = categoryMap.get(purchase.category) || { total: 0, count: 0 };
        categoryMap.set(purchase.category, {
          total: existing.total + purchase.price,
          count: existing.count + 1
        });
      });
    
    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total_spent: data.total,
        item_count: data.count,
        percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0
      }))
      .sort((a, b) => b.total_spent - a.total_spent);
    
    const topCategory = categoryBreakdown[0]?.category;
    
    return {
      total_spent: totalSpent,
      monthly_spent: monthlySpent,
      planned_count: plannedCount,
      purchased_count: purchasedCount,
      cancelled_count: cancelledCount,
      top_category: topCategory,
      category_breakdown: categoryBreakdown
    };
  },

  getPurchasesByCategory: (category: string) => {
    return get().purchases.filter((purchase: Purchase) => purchase.category === category);
  },

  getPurchasesByStatus: (status: Purchase['status']) => {
    return get().purchases.filter((purchase: Purchase) => purchase.status === status);
  },

  fetchAllData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchAccounts(),
        get().fetchTransactions(),
        get().fetchPurchases(),
        get().fetchPurchaseCategories(),
      ]);
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },
}));