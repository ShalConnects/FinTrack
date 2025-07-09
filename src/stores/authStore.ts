import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  error: string | null;
  success: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearMessages: () => void;
  setUserAndProfile: (user: User | null, profile: any) => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
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
        // For testing: You can temporarily bypass email confirmation errors
        // by commenting out this error handling and allowing unconfirmed users
        console.error('Sign in error:', error);
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      console.log('Sign in successful:', data.user?.id);
      set({ user: data.user, isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Sign in exception:', error);
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
      console.log('Profile will be created automatically by database trigger');

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
      set({ user: null, profile: null, isLoading: false });
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
  },

  // Fetch and map profile from Supabase
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) {
      // Map snake_case to camelCase
      const profile = {
        ...data,
        fullName: data.full_name,
        profilePicture: data.profile_picture,
      };
      set({ profile });
    } else {
      set({ profile: null });
    }
  },

  setUserAndProfile: (user: User | null, profile: any) => {
    set({ user });
    if (user) {
      // Always fetch and map the profile when a user is set
      get().fetchProfile(user.id);
    } else {
      set({ profile: null });
    }
  }
})); 