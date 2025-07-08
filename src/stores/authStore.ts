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
        console.error('Supabase auth error:', error);
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      // Check if user was actually created
      if (!data.user) {
        console.error('No user returned from signup');
        set({ error: 'Registration failed. Please try again.', isLoading: false });
        return { success: false, message: 'Registration failed. Please try again.' };
      }

      console.log('User created successfully:', data.user.id);

      // Create user profile with better error handling
      if (fullName) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              full_name: fullName,
              email: email
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            // Provide specific error message based on the error
            let errorMessage = 'Database error saving new user';
            if (profileError.code === '23505') {
              errorMessage = 'A user with this email already exists';
            } else if (profileError.code === '23502') {
              errorMessage = 'Missing required user information';
            } else if (profileError.code === '42P01') {
              errorMessage = 'User profile table not found - please contact support';
            } else if (profileError.message) {
              errorMessage = `Database error: ${profileError.message}`;
            }
            
            set({ error: errorMessage, isLoading: false });
            return { success: false, message: errorMessage };
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileError) {
          console.error('Exception during profile creation:', profileError);
          const errorMessage = 'Failed to create user profile. Please try again.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
      }

      const successMessage = 'Registration successful! Please check your email inbox (and spam folder) to verify your account. You will be able to log in once you confirm your email address.';
      set({ 
        user: data.user, 
        isLoading: false, 
        success: successMessage,
        error: null 
      });
      
      return { success: true, message: successMessage };
    } catch (error) {
      console.error('Registration exception:', error);
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