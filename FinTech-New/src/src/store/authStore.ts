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
};

interface AuthStore {
  user: User | null;
  profile: AppUser | null;
  setUserAndProfile: (user: User | null, profile: AppUser | null) => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AppUser>) => Promise<{ data: AppUser | null; error: any }>;
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
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      if (error) throw error;
      set({ profile: data });
      return { data, error: null };
    } catch (error: any) {
      throw error;
    }
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },
}));
