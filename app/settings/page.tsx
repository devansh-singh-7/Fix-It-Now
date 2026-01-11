'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/app/lib/firebaseClient';
import { updatePassword, updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Profile settings
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  
  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [ticketUpdates, setTicketUpdates] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);

  useEffect(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (!userProfile) {
      router.push('/auth/signin');
      return;
    }

    const profile: UserProfile = JSON.parse(userProfile);
    setDisplayName(profile.displayName || '');
    setEmail(profile.email || '');
    setPhoneNumber(profile.phoneNumber || '');
    setRole(profile.role || '');
    setLoading(false);
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      await updateProfile(user, {
        displayName: displayName,
      });

      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        profile.displayName = displayName;
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match!' });
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters!' });
      setSaving(false);
      return;
    }

    try {
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      await updatePassword(user, newPassword);
      
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const err = error as { code?: string };
      if (err.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Please sign out and sign in again before changing your password.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    setSaving(true);
    setMessage(null);

    setTimeout(() => {
      setMessage({ type: 'success', text: 'Notification preferences saved!' });
      setSaving(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25px 25px, #94a3b8 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }} />
        </div>
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-300/20 dark:bg-purple-700/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-300/20 dark:bg-blue-700/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
        {/* Header Section */}
        <div className="mb-10">
          {/* Back to Dashboard Button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg font-medium border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </motion.div>

          {/* Page Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Account Settings
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
              Manage your profile, security, and notification preferences
            </p>
          </motion.div>
        </div>

        {/* Message Alert */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-8 p-4 rounded-xl border backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800/50' 
                : 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800/50'
            }`}
            role="alert"
          >
            <div className="flex items-center gap-3">
              {message.type === 'success' ? (
                <svg className="w-5 h-5 text-green-500 dark:text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className={`text-sm ${message.type === 'success' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                {message.text}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Password */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Profile Information
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update your personal details
                  </p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                </div>

                {phoneNumber && (
                  <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Phone number cannot be changed</p>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <input
                    type="text"
                    id="role"
                    value={role}
                    disabled
                    className="w-full px-4 py-3 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed capitalize"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Role cannot be changed</p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating Profile...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Update Profile
                    </>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Change Password Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/30">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Change Password
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Update your account password
                  </p>
                </div>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    New Password
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Re-enter new password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving || !newPassword || !confirmPassword}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* Right Column - Notifications & App Settings */}
          <div className="lg:col-span-1 space-y-8">
            {/* Notification Preferences Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/30">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Notifications
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage your notification preferences
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  {
                    label: 'Email Notifications',
                    description: 'Receive notifications via email',
                    enabled: emailNotifications,
                    toggle: () => setEmailNotifications(!emailNotifications),
                    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                  },
                  {
                    label: 'Push Notifications',
                    description: 'Receive push notifications',
                    enabled: pushNotifications,
                    toggle: () => setPushNotifications(!pushNotifications),
                    icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8'
                  },
                  {
                    label: 'Ticket Updates',
                    description: 'Get notified about ticket status changes',
                    enabled: ticketUpdates,
                    toggle: () => setTicketUpdates(!ticketUpdates),
                    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                  },
                  {
                    label: 'Maintenance Reminders',
                    description: 'Receive reminders for scheduled maintenance',
                    enabled: maintenanceReminders,
                    toggle: () => setMaintenanceReminders(!maintenanceReminders),
                    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  }
                ].map((setting, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${setting.enabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-800'} transition-colors`}>
                        <svg className={`w-5 h-5 ${setting.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={setting.icon} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{setting.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{setting.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={setting.toggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                        setting.enabled ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                          setting.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </motion.div>
                ))}

                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group mt-6"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Preferences
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}