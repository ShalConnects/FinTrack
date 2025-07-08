import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../components/Layout/MainLayout';
import { Dashboard as DashboardContent } from '../components/Dashboard/Dashboard';
import { AccountsView } from '../components/Accounts/AccountsView';
import { TransactionsView } from '../components/Transactions/TransactionsView';
import { TransfersView } from '../components/Transfers/TransfersView';
import { ReportsView } from '../components/Reports/ReportsView';
import { SavingsView } from '../components/Savings/SavingsView';
import { PurchaseTracker } from '../components/Purchases/PurchaseTracker';
import { PurchaseCategories } from '../components/Purchases/PurchaseCategories';
import { PurchaseAnalytics } from '../components/Purchases/PurchaseAnalytics';

export const Dashboard: React.FC = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardContent />} />
          <Route path="/dashboard/accounts" element={<AccountsView />} />
          <Route path="/dashboard/transactions" element={<TransactionsView />} />
          <Route path="/dashboard/transfers" element={<TransfersView />} />
          <Route path="/dashboard/reports" element={<ReportsView />} />
          <Route path="/dashboard/savings" element={<SavingsView />} />
          <Route path="/dashboard/purchases" element={<PurchaseTracker />} />
          <Route path="/dashboard/purchase-categories" element={<PurchaseCategories />} />
          <Route path="/dashboard/purchase-analytics" element={<PurchaseAnalytics />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}; 