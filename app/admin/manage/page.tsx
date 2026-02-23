"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebaseClient';
import RouteGuard from '@/app/components/RouteGuard';

export default function ManageAdminsPage() {
  const router = useRouter();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    buildingId: '',
    buildingName: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      setUserId(user.uid);

      try {
        const response = await fetch(`/api/admin/is-super?uid=${user.uid}`);
        const data = await response.json();

        if (data.success && data.data.isSuperAdmin) {
          setIsSuperAdmin(true);
        } else {
          setIsSuperAdmin(false);
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Error checking super admin:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // Step 1: Create Firebase Auth user
      const { createUserWithEmailAndPassword } = await import('firebase/auth');
      const { auth: firebaseAuth } = await import('@/app/lib/firebaseClient');
      
      if (!firebaseAuth) {
        setError('Firebase not initialized');
        setSubmitting(false);
        return;
      }

      let newUserCredential;
      try {
        newUserCredential = await createUserWithEmailAndPassword(
          firebaseAuth,
          formData.email,
          formData.password
        );
      } catch (authError: unknown) {
        const error = authError as { code?: string; message?: string };
        if (error.code === 'auth/email-already-in-use') {
          setError('Email already exists in Firebase Auth');
        } else {
          setError(`Firebase error: ${error.message || 'Unknown error'}`);
        }
        setSubmitting(false);
        return;
      }

      // Step 2: Create MongoDB profile via API
      const response = await fetch('/api/admin/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestorUid: userId,
          uid: newUserCredential.user.uid,
          email: formData.email,
          name: formData.name,
          buildingId: formData.buildingId || undefined,
          buildingName: formData.buildingName || undefined
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create admin profile');
        setSubmitting(false);
        return;
      }

      setSuccess(`Admin account created successfully for ${formData.email}`);
      setFormData({
        email: '',
        password: '',
        name: '',
        buildingId: '',
        buildingName: ''
      });
    } catch (err) {
      console.error('Create admin error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <RouteGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-purple-50/30 via-transparent to-blue-50/30 dark:from-purple-900/10 dark:via-transparent dark:to-blue-900/10" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
          </div>
        </div>

        <div className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Manage Admin Accounts
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Super Admin Panel - Create new admin accounts for the platform
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Admin</h2>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    placeholder="admin@example.com"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    placeholder="Minimum 6 characters"
                    minLength={6}
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Minimum 6 characters required</p>
                </div>

                {/* Building ID (Optional) */}
                <div>
                  <label htmlFor="buildingId" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Building ID <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="buildingId"
                    type="text"
                    value={formData.buildingId}
                    onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    placeholder="building_12345"
                  />
                </div>

                {/* Building Name (Optional) */}
                <div>
                  <label htmlFor="buildingName" className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Building Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="buildingName"
                    type="text"
                    value={formData.buildingName}
                    onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                    placeholder="Sunset Apartments"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-3 group"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating Admin...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Admin Account
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Info Card */}
            <div className="mt-6 p-5 rounded-xl bg-linear-to-r from-purple-50/80 to-blue-50/80 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200/50 dark:border-purple-800/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">Super Admin Access Required</p>
                  <p className="text-sm text-purple-700 dark:text-purple-400">
                    Only you (devanshsingh@gmail.com) can access this page and create new admin accounts. New admins will have full building management capabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
