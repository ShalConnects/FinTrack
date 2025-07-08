import { useEffect, useState, useRef } from 'react';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useFinanceStore } from './store/useFinanceStore';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Toaster } from 'sonner';

function App() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // This effect should only run once. The ref prevents issues with
    // React 18's strict mode calling useEffect twice.
    if (initialized.current) return;
    initialized.current = true;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        if (currentUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          setUserAndProfile(currentUser, profile);
          
          // Use the store's getState to ensure we have the latest version
          // without adding it as a useEffect dependency.
          await useFinanceStore.getState().fetchAllData();
        } else {
          setUserAndProfile(null, null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
          Loading FinTrack...
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      {user ? <Dashboard /> : <Auth />}
    </>
  );
}

export default App;