import React, { useState, useEffect, ReactNode } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Dashboard } from '../Dashboard/Dashboard';
import { AccountsView } from '../Accounts/AccountsView';
import { TransactionsView } from '../Transactions/TransactionsView';
import { ReportsView } from '../Reports/ReportsView';
import { Settings } from '../Dashboard/Settings';
import { About } from '../Dashboard/About';
import { Plans } from '../Dashboard/Plans';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(location.pathname.split('/')[2] || 'dashboard');

  // Sync route with currentView
  useEffect(() => {
    const view = location.pathname.split('/')[2] || 'dashboard';
    setCurrentView(view);
  }, [location]);

  // Scroll to top on route change
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [location.pathname]);

  // Update route when currentView changes
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    navigate(`/dashboard${view === 'dashboard' ? '' : `/${view}`}`);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Dashboard';
      case 'accounts': return 'Accounts';
      case 'transactions': return 'Transactions';
      case 'reports': return 'Reports';
      case 'purchases': return 'Purchase Tracker';
      case 'purchase-categories': return 'Purchase Categories';
      case 'purchase-analytics': return 'Purchase Analytics';
      case 'settings': return 'Settings';
      case 'about': return 'About';
      case 'plans': return 'Plans';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <aside className="fixed inset-y-0 left-0 w-52 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-30">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
      </aside>
      
      <div className="flex-1 flex flex-col ml-52">
        <Header 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          title={getTitle()}
        />
        
        <main className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  );
}; 