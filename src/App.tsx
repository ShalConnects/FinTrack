import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const { isLoading: globalLoading, loadingMessage } = useLoadingContext();

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const currentUser = session?.user;
        const { setUserAndProfile } = useAuthStore.getState();
        if (currentUser) {
          setUserAndProfile(currentUser, null);
          await useFinanceStore.getState().fetchAllData();
        } else {
          setUserAndProfile(null, null);
        }
      }
    );
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      const { setUserAndProfile } = useAuthStore.getState();
      if (currentUser) {
        setUserAndProfile(currentUser, null);
        await useFinanceStore.getState().fetchAllData();
      } else {
        setUserAndProfile(null, null);
      }
      setLoading(false);
    };
    initializeSession();
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
          <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <Auth />} />
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