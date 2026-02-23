"use client";

/**
 * ProtectedRoute Component
 * 
 * Wrapper component that protects routes based on authentication and role.
 * Shows loading skeleton during auth initialization and sign-in prompt for unauthenticated users.
 */

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { UserRole } from '../lib/firebaseClient';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole | UserRole[];
}

export default function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();

  /**
   * Loading skeleton shown during auth initialization
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="space-y-3 pt-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  /**
   * User is not authenticated - show sign-in prompt
   */
  if (!user) {
    return (
      <Transition appear show={true} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-8 shadow-xl transition-all">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    
                    <Dialog.Title className="text-xl font-bold text-gray-900 mb-2">
                      Authentication Required
                    </Dialog.Title>
                    
                    <Dialog.Description className="text-gray-600 mb-6">
                      You need to sign in to access this page. Please sign in to continue.
                    </Dialog.Description>

                    <div className="flex flex-col gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/auth'}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Sign In
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = '/'}
                        className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                      >
                        Go to Home
                      </motion.button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  /**
   * Check role-based access
   */
  if (requiredRoles && role) {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    if (!roles.includes(role)) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p className="text-gray-600 mb-6">
                  You don&apos;t have permission to access this page. Please contact your administrator if you believe this is an error.
                </p>              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </motion.button>
            </div>
          </motion.div>
        </div>
      );
    }
  }

  /**
   * User is authenticated and authorized - render children
   */
  return <>{children}</>;
}
