'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SubscriptionPlan, SubscriptionTier } from '@/app/lib/types';

interface UserProfile {
  displayName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  firebaseUid: string;
  buildingId?: string;
  buildingName?: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionTier?: SubscriptionTier;
}

// Plan display info
const PLAN_INFO: Record<SubscriptionPlan, { name: string; color: string; tierLabel: string }> = {
  'ENTERPRISE': { name: 'Enterprise', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300', tierLabel: 'Tier 1' },
  'PRO': { name: 'Pro', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300', tierLabel: 'Tier 2' },
  'BASIC': { name: 'Basic', color: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300', tierLabel: 'Tier 3' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const userProfile = localStorage.getItem('userProfile');
      return userProfile ? JSON.parse(userProfile) : null;
    }
    return null;
  });

  // Re-read profile from localStorage when it updates
  useEffect(() => {
    const readProfile = () => {
      if (typeof window !== 'undefined') {
        const userProfile = localStorage.getItem('userProfile');
        if (userProfile) {
          setProfile(JSON.parse(userProfile));
        }
      }
    };

    // Listen for storage changes (cross-tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        readProfile();
      }
    };

    // Listen for custom event (same tab)
    const handleProfileUpdate = () => {
      readProfile();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    if (!profile) {
      router.push('/auth/signin');
    }
  }, [router, profile]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  const planInfo = profile.subscriptionPlan ? PLAN_INFO[profile.subscriptionPlan] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="group inline-flex items-center gap-2 mb-6 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg 
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">View your profile information</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-12">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-blue-600">
                  {profile.displayName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{profile.displayName || 'User'}</h2>
                <p className="text-blue-100 capitalize">{profile.role}</p>
                {planInfo && (
                  <span className={`inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium ${planInfo.color}`}>
                    {planInfo.name} Plan ({planInfo.tierLabel})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-6 py-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Display Name</h3>
                <p className="text-lg text-gray-900 dark:text-white">{profile.displayName || 'Not set'}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email Address</h3>
                <p className="text-lg text-gray-900 dark:text-white">{profile.email || 'Not set'}</p>
              </div>

              {profile.phoneNumber && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Phone Number</h3>
                  <p className="text-lg text-gray-900 dark:text-white">{profile.phoneNumber}</p>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Role</h3>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 capitalize">
                  {profile.role}
                </span>
              </div>

              {/* Building Information */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Building</h3>
                {profile.buildingName ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white">{profile.buildingName}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Building ID: {profile.buildingId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">No building assigned</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        Use a building join code to join your building from the dashboard.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Subscription Section */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Subscription Plan</h3>
                {planInfo ? (
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${planInfo.color}`}>
                      {planInfo.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {planInfo.tierLabel}
                    </span>
                    {profile.subscriptionTier && profile.subscriptionTier <= 2 && (
                      <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        AI Support Access
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 dark:text-gray-400">No active subscription</span>
                    <button
                      onClick={() => router.push('/#pricing')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      View Plans →
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User ID</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">{profile.firebaseUid}</p>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex gap-3">
                <button
                  onClick={() => router.push('/settings')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Benefits Info */}
        {planInfo && profile.subscriptionTier && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
              {planInfo.name} Plan Benefits
            </h3>
            <ul className="space-y-2">
              {profile.subscriptionTier <= 2 && (
                <li className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  AI Support Chatbot Access
                </li>
              )}
              {profile.subscriptionTier <= 2 && (
                <li className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Priority Support
                </li>
              )}
              {profile.subscriptionTier === 1 && (
                <li className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Dedicated Account Manager
                </li>
              )}
              <li className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {profile.subscriptionTier === 1 ? 'Unlimited Buildings' : profile.subscriptionTier === 2 ? 'Up to 5 Buildings' : '1 Building'}
              </li>
            </ul>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Profile Information</p>
              <p className="text-sm text-blue-700 mt-1">
                To update your email, phone number, or role, please contact your administrator.
                You can change your display name and password in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
