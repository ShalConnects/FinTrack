import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Dashboard as DashboardContent } from '../components/Dashboard/Dashboard';
import { AccountsView } from '../components/Accounts/AccountsView';
import { TransactionsView } from '../components/Transactions/TransactionsView';
import { TransfersView } from '../components/Transfers/TransfersView';
import { ReportsView } from '../components/Reports/ReportsView';
import { AnalyticsView } from '../components/Reports/AnalyticsView';
import { SavingsView } from '../components/Savings/SavingsView';
import { PurchaseTracker } from '../components/Purchases/PurchaseTracker';
import { PurchaseCategories } from '../components/Purchases/PurchaseCategories';
import { PurchaseAnalytics } from '../components/Purchases/PurchaseAnalytics';
import { LendBorrowAnalytics } from '../components/LendBorrow/LendBorrowAnalytics';
import { HelpAndSupport } from './HelpAndSupport';
import { History } from './History';
import { Settings } from '../components/Dashboard/Settings';
import LendBorrowPage from './LendBorrow';
import DonationsSavingsPage from './DonationsSavingsPage';

export const Dashboard: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardContent onViewChange={() => {}} />} />
        <Route path="/accounts" element={<AccountsView />} />
        <Route path="/transactions" element={<TransactionsView />} />
        <Route path="/transfers" element={<TransfersView />} />
        <Route path="/reports" element={<Navigate to="/analytics" />} />
        <Route path="/savings" element={<SavingsView />} />
        <Route path="/purchases" element={<PurchaseTracker />} />
        <Route path="/lend-borrow" element={<LendBorrowPage />} />
        <Route path="/purchase-categories" element={<PurchaseCategories />} />
        <Route path="/purchase-analytics" element={<PurchaseAnalytics />} />
        <Route path="/lend-borrow-analytics" element={<LendBorrowAnalytics />} />
        <Route path="/analytics" element={<AnalyticsView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<HelpAndSupport />} />
        <Route path="/history" element={<History />} />
        <Route path="/donations-savings" element={<DonationsSavingsPage />} />
      </Routes>
    </MainLayout>
  );
}; 