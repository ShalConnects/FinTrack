import React from 'react';
import { supabase } from '../lib/supabase';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useThemeStore } from '../store/themeStore';

export const Auth: React.FC = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <div>
          <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
            FinTrack
          </h2>
          <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        <SupabaseAuth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          theme={isDarkMode ? 'dark' : 'default'}
        />
      </div>
    </div>
  );
}; 