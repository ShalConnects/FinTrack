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
  signInWithProvider: (provider: 'google' | 'apple') => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearMessages: () => void;
  setUserAndProfile: (user: User | null, profile: any) => void;
  fetchProfile: (userId: string) => Promise<void>;
  handleEmailConfirmation: () => Promise<void>;
  checkAuthState: () => Promise<void>;
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
        console.error('Sign in error:', error);
        
        // Handle email confirmation error
        if (error.message.includes('Email not confirmed')) {
          const errorMessage = 'Please check your email and click the verification link before logging in.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
        
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

  signInWithProvider: async (provider: 'google' | 'apple') => {
    set({ isLoading: true, error: null, success: null });
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Social login error:', error);
        set({ error: error.message, isLoading: false });
        return { success: false, message: error.message };
      }

      console.log('Social login initiated:', data);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      console.error('Social login exception:', error);
      const errorMessage = (error as Error).message;
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  signUp: async (email: string, password: string, fullName?: string) => {
    set({ isLoading: true, error: null, success: null });
    try {
      // Real SaaS registration with proper error handling
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: 'https://fin-tech-dq5uuczkm-shalauddin-kaders-projects.vercel.app'
        }
      });

      if (error) {
        console.error('Supabase auth error:', error);
        
        // Handle specific email rate limit error
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          const errorMessage = 'Email service temporarily unavailable. Please set up custom SMTP in Supabase dashboard or try again later. Contact support if this persists.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
        
        // Handle email sending errors
        if (error.message.includes('Error sending confirmation email') || error.message.includes('email')) {
          const errorMessage = 'Email confirmation failed. This may be due to SMTP configuration issues. Please check your email settings in Supabase dashboard or contact support.';
          set({ error: errorMessage, isLoading: false });
          return { success: false, message: errorMessage };
        }
        
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

      // Check if email confirmation is required
      if (data.user.email_confirmed_at) {
        // User is already confirmed (rare but possible)
        const successMessage = 'Registration successful! You can now log in.';
        set({ 
          user: data.user, 
          isLoading: false, 
          success: successMessage,
          error: null 
        });
        return { success: true, message: successMessage };
      } else {
        // User needs email confirmation
        const successMessage = 'Registration successful! Please check your email inbox (and spam folder) to verify your account. You will be able to log in once you confirm your email address.';
        set({ 
          user: null, // Don't log in automatically
          isLoading: false, 
          success: successMessage,
          error: null 
        });
        return { success: true, message: successMessage };
      }
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
  },

  // Handle email confirmation redirect
  handleEmailConfirmation: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user after email confirmation:', error);
        return;
      }
      
      if (user && user.email_confirmed_at) {
        console.log('User email confirmed, setting user state');
        set({ 
          user, 
          isLoading: false, 
          success: 'Email confirmed successfully! You are now logged in.',
          error: null 
        });
      }
    } catch (error) {
      console.error('Error handling email confirmation:', error);
    }
  },

  // Check authentication state on app load
  checkAuthState: async () => {
    try {
      set({ isLoading: true });
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error checking auth state:', error);
        set({ user: null, isLoading: false });
        return;
      }
      
      if (user) {
        console.log('User authenticated:', user.id);
        set({ user, isLoading: false });
      } else {
        console.log('No user authenticated');
        set({ user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
      set({ user: null, isLoading: false });
    }
  }
})); 