import React from 'react';

interface LoaderProps {
  isLoading: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ isLoading, message = 'Loading...' }) => {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center space-y-4">
        {/* Spinner */}
        <div className="animate-spin rounded-full border-4 border-blue-500 border-t-transparent h-12 w-12"></div>
        
        {/* Loading message */}
        <p className="text-gray-700 dark:text-gray-300 font-medium text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}; 