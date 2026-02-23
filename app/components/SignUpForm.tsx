"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import RoleSelector from './RoleSelector';
import { UserRole } from '../lib/firebaseClient';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signUp, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'resident' as UserRole,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (formData.displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Include uppercase, lowercase, and numbers';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(
        formData.email,
        formData.password,
        formData.displayName,
        formData.role
      );
      onSuccess?.();
    } catch (error) {
      const err = error as { code?: string; message?: string };
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          setSubmitError('An account with this email already exists. Try signing in instead.');
          break;
        case 'auth/weak-password':
          setSubmitError('Password is too weak. Please use a stronger password with at least 8 characters including uppercase, lowercase, and numbers.');
          break;
        case 'auth/invalid-email':
          setSubmitError('Please enter a valid email address.');
          break;
        case 'auth/operation-not-allowed':
          setSubmitError('Email/password accounts are not enabled. Please contact support.');
          break;
        default:
          setSubmitError(err.message || 'Failed to create account. Please try again.');
      }
    }
  };

  const handleDemoSignUp = () => {
    setFormData({
      displayName: 'Demo User',
      email: 'demo@fixitnow.com',
      password: 'Demo123!',
      confirmPassword: 'Demo123!',
      role: 'resident',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      {/* Card Container */}
      <div className="relative">
        {/* Background Gradient Effect */}
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000" />
        
        <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl blur-md opacity-20" />
                <div className="relative w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Join FixItNow
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Start streamlining your maintenance operations today
              </p>
            </div>

            {/* Demo Sign Up Button */}
            <motion.button
              type="button"
              onClick={handleDemoSignUp}
              disabled={isLoading}
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              className="w-full mb-6 px-4 py-3 bg-linear-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 text-gray-800 dark:text-gray-300 rounded-xl font-medium hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Try Demo Account
              </div>
            </motion.button>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or create your account
                </span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        {submitError}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Display Name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="displayName"
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => {
                      setFormData({ ...formData, displayName: e.target.value });
                      if (errors.displayName) setErrors({ ...errors, displayName: '' });
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.displayName 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="John Doe"
                    disabled={isLoading}
                    aria-invalid={!!errors.displayName}
                    aria-describedby={errors.displayName ? 'displayName-error' : undefined}
                  />
                </div>
                <AnimatePresence>
                  {errors.displayName && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      id="displayName-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.displayName}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89-4.46a2 2 0 012.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.email 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                </div>
                <AnimatePresence>
                  {errors.email && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      id="email-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.email}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.password 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="••••••••"
                    disabled={isLoading}
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.password && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      id="password-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.password}
                    </motion.p>
                  )}
                </AnimatePresence>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Minimum 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                    }}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 transition-all ${
                      errors.confirmPassword 
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/20 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-blue-500 focus:border-blue-500'
                    } text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400`}
                    placeholder="••••••••"
                    disabled={isLoading}
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <AnimatePresence>
                  {errors.confirmPassword && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      id="confirmPassword-error"
                      className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.confirmPassword}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Role Selector */}
              <div className="pt-2">
                <RoleSelector
                  value={formData.role}
                  onChange={(role) => setFormData({ ...formData, role })}
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-500 dark:focus:ring-blue-600 border-gray-300 dark:border-gray-700 rounded cursor-pointer bg-white dark:bg-gray-800 mt-1"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                    Privacy Policy
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="w-full px-4 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Create Account
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                )}
              </motion.button>
            </form>

            {/* Social Sign Up Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    Sign up with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="#000000" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          </div>

          {/* Footer Section */}
          <div className="px-8 py-6 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                  disabled={isLoading}
                >
                  Sign in here
                </button>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Fast</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Reliable</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Notice */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Start with a <span className="font-semibold text-blue-600 dark:text-blue-400">14-day free trial</span>. No credit card required.
          </p>
        </div>
      </div>
    </motion.div>
  );
}