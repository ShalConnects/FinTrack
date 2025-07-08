import { Fragment, useEffect, useRef } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';

const notificationColors = {
  info: 'bg-blue-50 text-blue-800',
  success: 'bg-green-50 text-green-800',
  warning: 'bg-yellow-50 text-yellow-800',
  error: 'bg-red-50 text-red-800'
};

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotificationsStore();

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Set up real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications]);

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]"
        >
          <div className="p-2">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="mt-2 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                </div>
              ) : error ? (
                <div className="py-4 text-center text-sm text-red-500">{error}</div>
              ) : notifications.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">No notifications</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg p-3 ${
                        notification.is_read ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          {notification.body && (
                            <p className="mt-1 text-sm text-gray-500">{notification.body}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true
                            })}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button
                  onClick={() => clearAllNotifications()}
                  className="w-full rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Clear all notifications
                </button>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
} 