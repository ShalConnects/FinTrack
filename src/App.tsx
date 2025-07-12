import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './stores/authStore';
import { useFinanceStore } from './store/useFinanceStore';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'sonner';
import About from './pages/About';
import Blog from './pages/Blog';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { LoadingProvider, useLoadingContext } from './context/LoadingContext';
import { Loader } from './components/common/Loader';
import TestAuthPanel from './components/TestAuthPanel';

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const checkAuthState = useAuthStore((state) => state.checkAuthState);
  const handleEmailConfirmation = useAuthStore((state) => state.handleEmailConfirmation);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();
  const location = useLocation();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        if (currentUser) {
          console.log('User authenticated:', currentUser.id);
          setUserAndProfile(currentUser, null);
          await useFinanceStore.getState().fetchAllData();
        } else {
          console.log('User signed out');
          setUserAndProfile(null, null);
        }
      }
    );
    
    const initializeSession = async () => {
      try {
        // Check if this is an email confirmation redirect
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log('Email confirmation detected, setting session');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
          } else if (data.user) {
            console.log('Email confirmation successful, user:', data.user.id);
            await handleEmailConfirmation();
          }
        }
        
        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        
        if (currentUser) {
          console.log('Session found, user:', currentUser.id);
          setUserAndProfile(currentUser, null);
          await useFinanceStore.getState().fetchAllData();
        } else {
          console.log('No session found');
          setUserAndProfile(null, null);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeSession();
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleEmailConfirmation]);

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
      <Loader isLoading={globalLoading} message={loadingMessage} />
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
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
        <Route path="/dashboard/*" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsofservice" element={<TermsOfService />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <LoadingProvider>
      <Router>
        <AppContent />
      </Router>
      {/* Test Panels - Only show in development */}
      {import.meta.env.DEV && (
        <>
          <TestAuthPanel />
        </>
      )}
    </LoadingProvider>
  );
}

export default App;