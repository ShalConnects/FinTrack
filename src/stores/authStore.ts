import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearMessages: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  success: null,

  clearMessages: () => {
    set({ error: null, success: null });
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }
      
      set({ user: data.user, isLoading: false, success: 'Login successful!' });
      return { success: true };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      // Proceed with registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      // Check if user was actually created
      if (!data.user) {
        set({ error: 'Registration failed. Please try again.', isLoading: false });
        return { success: false, message: 'Registration failed. Please try again.' };
      }

      // Create user profile
      if (fullName) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            full_name: fullName,
            email: email
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Still consider registration successful even if profile creation fails
        }
      }

      const successMessage = 'Registration successful! Please check your email to verify your account before logging in.';
      set({ 
        user: data.user, 
        isLoading: false, 
        success: successMessage,
        error: null 
      });
      
      return { success: true, message: successMessage };
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  resetPassword: async (email: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      set({ isLoading: false, success: 'Password reset email sent!' });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  }
})); 