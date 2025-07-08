import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { useFinanceStore } from './store/useFinanceStore';
// import { urgentNotificationService } from './lib/urgentNotifications';
import { LoginForm } from './components/Auth/LoginForm';
import { RegisterForm } from './components/Auth/RegisterForm';
import { Dashboard } from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'sonner';
import About from './pages/About';
import Blog from './pages/Blog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { LoadingProvider, useLoadingContext } from './context/LoadingContext';
import { Loader } from './components/common/Loader';

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();

  // Debug logging to see when user state changes
  useEffect(() => {
    console.log('User state changed:', user ? 'logged in' : 'not logged in');
  }, [user]);

  useEffect(() => {
    // This effect should only run once. The ref prevents issues with
    // React 18's strict mode calling useEffect twice.
    if (initialized.current) return;
    initialized.current = true;
    
    console.log('Setting up auth listener...');
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change event:', event, 'User:', session?.user?.email);
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        if (currentUser) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching profile:', profileError);
          }

          // Map DB fields to camelCase for the store
          const mappedProfile = profile ? {
            id: profile.id,
            fullName: profile.full_name,
            profilePicture: profile.profile_picture,
            local_currency: profile.local_currency,
            selected_currencies: profile.selected_currencies,
            subscription: profile.subscription,
          } : null;

          console.log('Setting user and profile:', currentUser.email);
          setUserAndProfile(currentUser, mappedProfile);
          
          // Use the store's getState to ensure we have the latest version
          // without adding it as a useEffect dependency.
          await useFinanceStore.getState().fetchAllData();
          
          // Start urgent notification checking - temporarily disabled
          // if (currentUser) {
          //   urgentNotificationService.checkAndCreateUrgentNotifications(currentUser.id);
          // }
        } else {
          console.log('Clearing user and profile');
          setUserAndProfile(null, null);
        }
      }
    );

    const initializeSession = async () => {
      console.log('Initializing session...');
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      const { setUserAndProfile } = useAuthStore.getState();
      
      if (currentUser) {
        console.log('Found existing session for user:', currentUser.email);
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching profile:', profileError);
        }

        // Map DB fields to camelCase for the store
        const mappedProfile = profile ? {
          id: profile.id,
          fullName: profile.full_name,
          profilePicture: profile.profile_picture,
          local_currency: profile.local_currency,
          selected_currencies: profile.selected_currencies,
        } : null;

        setUserAndProfile(currentUser, mappedProfile);
        await useFinanceStore.getState().fetchAllData();
      } else {
        console.log('No existing session found');
        setUserAndProfile(null, null);
      }
      
      setLoading(false);
    };

    initializeSession();

    return () => {
      console.log('Cleaning up auth listener...');
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Periodic urgent notification checking - temporarily disabled
  // useEffect(() => {
  //   if (!user) return;

  //   // Check immediately
  //   urgentNotificationService.checkAndCreateUrgentNotifications(user.id);

  //   // Set up periodic checking (every hour)
  //   const interval = setInterval(() => {
  //     urgentNotificationService.checkAndCreateUrgentNotifications(user.id);
  //   }, 60 * 60 * 1000); // 1 hour

  //   return () => clearInterval(interval);
  // }, [user]);

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
      {/* Global loading overlay - shows during form submissions, page navigation, and data refresh */}
      <Loader isLoading={globalLoading} message={loadingMessage} />
      
      <Router>
        <Toaster 
          position="top-right" 
          richColors 
          expand={true}
          closeButton={true}
          duration={4000}
          theme="light"
          style={{
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontWeight: '500',
            marginTop: '40px'
          }}
        />
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterForm />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <LoginForm />} />
          <Route path="/dashboard/*" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/about" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/privacypolicy" element={<PrivacyPolicy />} />
          <Route path="/termsofservice" element={<TermsOfService />} />
        </Routes>
      </Router>
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <AppContent />
    </LoadingProvider>
  );
}

export default App;