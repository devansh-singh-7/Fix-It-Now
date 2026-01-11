"use client";

/**
 * PasswordResetForm Component
 * 
 * Password reset request form with email validation.
 * Sends password reset email via Firebase Auth.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';

interface PasswordResetFormProps {
  onBack?: () => void;
}

export default function PasswordResetForm({ onBack }: PasswordResetFormProps) {
  const { sendPasswordReset } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  /**
   * Validate email
   */
  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      const error = err as { code?: string; message?: string };
      
      // Handle Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later');
      } else {
        setError(error.message || 'Failed to send reset email. Please try again');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
        <p className="text-gray-600 mb-6">
          Enter your email address and we&apos;ll send you instructions to reset your password
        </p>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-6"
            >
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">Email Sent!</h3>
                    <p className="mt-1 text-sm text-green-700">
                      Check your inbox for password reset instructions. The email may take a few minutes to arrive.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                    disabled={isLoading}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'email-error' : undefined}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    'Send Reset Link'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Sign In Link */}
        {onBack && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors inline-flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
