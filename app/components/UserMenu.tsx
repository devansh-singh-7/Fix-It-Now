"use client";

/**
 * UserMenu Component
 * 
 * User avatar menu with profile info and sign-out action.
 * Integrates with NavBar for authentication display.
 */

import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthProvider';

export default function UserMenu() {
  const { user, userProfile, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const displayName = userProfile?.name || user.displayName || 'User';
  const email = user.email || '';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700',
    technician: 'bg-blue-100 text-blue-700',
    resident: 'bg-green-100 text-green-700',
  };

  const roleColor = userProfile?.role ? roleColors[userProfile.role] : 'bg-gray-100 text-gray-700';

  return (
    <Menu as="div" className="relative">
      <Menu.Button as={Fragment}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1.5 transition-all"
        >
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{displayName}</p>
              {userProfile?.role && (
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userProfile.role}</p>
              )}
            </div>
            
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 text-white font-semibold shadow-sm">
              {initials}
            </div>
          </div>
        </motion.button>
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
        <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right rounded-lg bg-white dark:bg-gray-900 shadow-lg ring-1 ring-black dark:ring-gray-800 ring-opacity-5 focus:outline-none overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</p>
            {userProfile?.role && (
              <span className={`inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-medium ${roleColor}`}>
                {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-50 dark:bg-gray-800' : ''
                  } w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 flex items-center transition-colors`}
                  onClick={() => {
                    // Navigate to profile page (implement as needed)
                    console.log('Navigate to profile');
                  }}
                >
                  <svg
                    className="mr-3 h-5 w-5 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Your Profile
                </button>
              )}
            </Menu.Item>

            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-50' : ''
                  } w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center transition-colors`}
                  onClick={() => {
                    // Navigate to settings page (implement as needed)
                    console.log('Navigate to settings');
                  }}
                >
                  <svg
                    className="mr-3 h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Settings
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Sign Out */}
          <div className="py-1 border-t border-gray-200">
            <Menu.Item>
              {({ active }) => (
                <motion.button
                  whileHover={{ backgroundColor: 'rgb(254 242 242)' }}
                  className={`${
                    active ? 'bg-red-50' : ''
                  } w-full text-left px-4 py-2 text-sm text-red-600 font-medium flex items-center transition-colors`}
                  onClick={async () => {
                    try {
                      await signOut();
                      window.location.href = '/';
                    } catch (error) {
                      console.error('Sign out error:', error);
                    }
                  }}
                >
                  <svg
                    className="mr-3 h-5 w-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </motion.button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
