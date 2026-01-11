"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import NavBar from '@/app/components/NavBar';
import RouteGuard from '@/app/components/RouteGuard';

type User = {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'technician' | 'resident';
  buildingId?: string;
  buildingName?: string;
  isActive: boolean;
  awaitApproval?: boolean;
  createdAt: string;
};

export default function ManageUsersPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'admin' | 'technician' | 'resident'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[Admin Users Page] Fetching users...');
      
      const response = await fetch('/api/admin/users/list');
      console.log('[Admin Users Page] Response status:', response.status);
      
      const data = await response.json();
      console.log('[Admin Users Page] Response data:', data);
      
      if (data.success) {
        console.log(`[Admin Users Page] Setting ${data.data?.length || 0} users`);
        setUsers(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch users');
        console.error('[Admin Users Page] API returned error:', data.error);
      }
    } catch (error) {
      console.error('[Admin Users Page] Error fetching users:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.role === filter;
    const matchesSearch = searchQuery === '' || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'technician':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'resident':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <RouteGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
        </div>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Manage Users
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  View and manage all users across buildings
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl font-medium shadow-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {['all', 'admin', 'technician', 'resident'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilter(role as typeof filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filter === role
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                <button 
                  onClick={fetchUsers}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <svg className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No users found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.uid}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* User Avatar & Name */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>

                  {/* Building Info */}
                  {user.buildingName && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Building</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user.buildingName}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {user.awaitApproval && (
                      <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded">
                        Pending
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {!loading && filteredUsers.length > 0 && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {users.filter(u => u.role === 'technician').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Technicians</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {users.filter(u => u.role === 'resident').length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Residents</p>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </RouteGuard>
  );
}
