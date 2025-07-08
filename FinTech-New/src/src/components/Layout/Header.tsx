import React, { useState } from 'react';
import { Menu, Bell, Search, Sun, Moon, User, Settings, LogOut, ArrowLeftRight } from 'lucide-react';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileEditModal } from './ProfileEditModal';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuToggle: () => void;
  title: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Transactions', href: '/transactions' },
  { name: 'Accounts', href: '/accounts' },
  { name: 'Reports', href: '/reports' },
  { name: 'Savings', href: '/savings' },
];

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, title }) => {
  const { setGlobalSearchTerm, globalSearchTerm } = useFinanceStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { user, profile, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-300 mr-2" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="bg-transparent text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 border-none outline-none w-64"
              value={globalSearchTerm}
              onChange={e => setGlobalSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold">
                  {profile?.fullName
                    ? profile.fullName.trim().split(' ').map((n: string, i: number, arr: string[]) => i === 0 || i === arr.length - 1 ? n[0].toUpperCase() : '').join('')
                    : 'U'}
                </span>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile?.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">Default Currency: {profile?.local_currency || 'USD'}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <User className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate('/dashboard/transfers')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Transfers
                </button>
                <button
                  onClick={() => {/* TODO: Implement settings */}}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </header>
  );
};