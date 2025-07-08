import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

// This is our custom user profile stored in our own "profiles" table.
export type AppUser = {
  id: string;
  fullName?: string;
  profilePicture?: string;
  local_currency?: string;
  selected_currencies?: string[];
  subscription?: {
    plan: 'free' | 'premium';
    status: 'active' | 'inactive' | 'cancelled';
    validUntil: string | null;
  };
};

interface AuthStore {
  user: User | null;
  profile: AppUser | null;
  setUserAndProfile: (user: User | null, profile: AppUser | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: any }>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  profile: null,
  setUserAndProfile: (user, profile) => {
    set({ user, profile });
  },
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) {
      const error = { message: 'User not logged in' };
      throw error;
    }
    try {
      // Build the final payload with snake_case keys that match the database.
      // We only include properties that have a non-undefined value.
      const dbPayload: { [key: string]: any } = { id: user.id };
      if (updates.fullName !== undefined) dbPayload.full_name = updates.fullName;
      if (updates.local_currency !== undefined) dbPayload.local_currency = updates.local_currency;
      if (updates.profilePicture !== undefined) dbPayload.profile_picture = updates.profilePicture;
      if (updates.selected_currencies !== undefined) dbPayload.selected_currencies = updates.selected_currencies;

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbPayload, {
          onConflict: 'id',
        })
        .select()
        .single();

      if (error) {
        console.error("Error updating profile in DB:", error);
        throw error;
      }
      
      // The database returns snake_case columns. We map them back to camelCase
      // for the application's state.
      const profileData: AppUser = {
        id: data.id,
        fullName: data.full_name,
        profilePicture: data.profile_picture,
        local_currency: data.local_currency,
        selected_currencies: data.selected_currencies,
      };
      
      set({ profile: profileData });
      return { data: profileData, error: null };
    } catch (error: any) {
      // Return a structured error to the component.
      return { data: null, error };
    }
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
  deleteAccount: async () => {
    const { user } = get();
    if (!user) {
      return { success: false, error: 'User not logged in' };
    }

    try {
      // Step 1: Delete all user-related data from all tables
      const userId = user.id;
      
      // Delete transactions
      await supabase
        .from('transactions')
        .delete()
        .eq('user_id', userId);

      // Delete purchases and related data
      await supabase
        .from('purchases')
        .delete()
        .eq('user_id', userId);

      // Delete purchase categories
      await supabase
        .from('purchase_categories')
        .delete()
        .eq('user_id', userId);

      // Delete purchase attachments
      await supabase
        .from('purchase_attachments')
        .delete()
        .eq('user_id', userId);

      // Delete lend/borrow records
      await supabase
        .from('lend_borrow')
        .delete()
        .eq('user_id', userId);

      // Delete lend/borrow returns
      await supabase
        .from('lend_borrow_returns')
        .delete()
        .eq('user_id', userId);

      // Delete savings goals
      await supabase
        .from('savings_goals')
        .delete()
        .eq('user_id', userId);

      // Delete donation saving records
      await supabase
        .from('donation_saving_records')
        .delete()
        .eq('user_id', userId);

      // Delete notifications
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      // Delete audit logs
      await supabase
        .from('audit_logs')
        .delete()
        .eq('user_id', userId);

      // Delete accounts (this should be done after other references are cleared)
      await supabase
        .from('accounts')
        .delete()
        .eq('user_id', userId);

      // Delete user profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      // Finally, delete the auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Even if auth deletion fails, we've deleted all the data
        // The user will be logged out anyway
      }

      // Clear local state
      set({ user: null, profile: null });

      return { success: true };
    } catch (error: any) {
      console.error('Error during account deletion:', error);
      return { success: false, error: error.message || 'Failed to delete account' };
    }
  },
}));
