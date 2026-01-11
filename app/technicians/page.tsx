"use client";

import { useState, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import NavBar from '@/app/components/NavBar';
import RouteGuard from '@/app/components/RouteGuard';
import AddTechnicianModal from '@/app/components/AddTechnicianModal';

type Technician = {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  buildingId?: string;
  buildingName?: string;
  isActive: boolean;
  awaitApproval?: boolean;
  assignedTickets?: number;
  completedTickets?: number;
  rating?: number;
  specialties?: string[];
  createdAt: string;
};

type TicketStats = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
};

export default function TechniciansPage() {
  const shouldReduceMotion = useReducedMotion();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, open: 0, inProgress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');
  const [error, setError] = useState('');

  // User info for announcements
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userBuildingId, setUserBuildingId] = useState('');
  const [userBuildingName, setUserBuildingName] = useState('');

  // Announcement modal state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'info' as 'info' | 'warning' | 'urgent',
    expiresAt: ''
  });
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');

  // Add Technician modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      setUserId(profile.uid || profile.firebaseUid);
      setUserName(profile.displayName || profile.name || 'Technician');
      setUserBuildingId(profile.buildingId || '');
      setUserBuildingName(profile.buildingName || '');
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch technicians
      const response = await fetch('/api/technicians/list');
      const data = await response.json();

      if (data.success) {
        setTechnicians(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch technicians');
      }

      // Fetch stats
      const statsResponse = await fetch('/api/technicians/stats');
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.data || { total: 0, open: 0, inProgress: 0, completed: 0 });
      }
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const filteredTechnicians = technicians.filter(tech => {
    const matchesSearch = searchQuery === '' ||
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (filter === 'active') {
      matchesFilter = tech.isActive && !tech.awaitApproval;
    } else if (filter === 'pending') {
      matchesFilter = tech.awaitApproval === true;
    }

    return matchesSearch && matchesFilter;
  });

  // Announcement submission handler
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementError('');
    setAnnouncementSuccess('');
    setAnnouncementSubmitting(true);

    if (!userId || !userBuildingId) {
      setAnnouncementError('You must be assigned to a building to post announcements');
      setAnnouncementSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: userId,
          role: 'technician',
          authorName: userName,
          title: announcementForm.title,
          content: announcementForm.content,
          priority: announcementForm.priority,
          type: 'building',
          buildingId: userBuildingId,
          buildingName: userBuildingName,
          expiresAt: announcementForm.expiresAt || undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnnouncementSuccess('Announcement posted successfully!');
        setAnnouncementForm({ title: '', content: '', priority: 'info', expiresAt: '' });
        setTimeout(() => {
          setIsAnnouncementModalOpen(false);
          setAnnouncementSuccess('');
        }, 1500);
      } else {
        setAnnouncementError(data.error || 'Failed to post announcement');
      }
    } catch (err) {
      console.error('Announcement error:', err);
      setAnnouncementError('An error occurred. Please try again.');
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const openAnnouncementModal = () => {
    setAnnouncementForm({ title: '', content: '', priority: 'info', expiresAt: '' });
    setAnnouncementError('');
    setAnnouncementSuccess('');
    setIsAnnouncementModalOpen(true);
  };

  return (
    <RouteGuard allowedRoles={['admin', 'technician']}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />

        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-cyan-50/30 via-transparent to-blue-50/30 dark:from-cyan-900/10 dark:via-transparent dark:to-blue-900/10" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }} />
          </div>
        </div>

        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-linear-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Technicians
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Manage and monitor technician performance
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Add Technician Button */}
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 group"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Technician
                </button>

                {/* Post Announcement Button */}
                {userBuildingId && (
                <button
                  onClick={openAnnouncementModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300 group"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  Post Announcement
                </button>
              )}
            </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Technicians</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{technicians.length}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {technicians.filter(t => t.isActive && !t.awaitApproval).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    {technicians.filter(t => t.awaitApproval).length}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{stats.completed}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
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
                    placeholder="Search technicians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {['all', 'active', 'pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as typeof filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${filter === status
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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
                  onClick={fetchTechnicians}
                  className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Technicians List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mb-4">
                <svg className="animate-spin h-8 w-8 text-cyan-600 dark:text-cyan-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">Loading technicians...</p>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No technicians found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTechnicians.map((tech, index) => (
                <motion.div
                  key={tech.uid}
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-linear-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
                        {tech.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {tech.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Technician</p>
                      </div>
                    </div>
                    {tech.awaitApproval ? (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg text-xs font-medium">
                        Pending
                      </span>
                    ) : (
                      <div className={`w-3 h-3 rounded-full ${tech.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{tech.email}</span>
                    </div>
                    {tech.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{tech.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Building */}
                  {tech.buildingName && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned Building</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.buildingName}</p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{tech.assignedTickets || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{tech.completedTickets || 0}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
                    </div>
                  </div>

                  {/* Rating */}
                  {tech.rating && (
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${star <= tech.rating! ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{tech.rating.toFixed(1)}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </main>

        {/* Announcement Modal */}
        <AnimatePresence>
          {isAnnouncementModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsAnnouncementModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-linear-to-r from-amber-500/10 to-orange-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Post Building Announcement
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Notify residents of {userBuildingName || 'your building'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-4">
                  {announcementError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-sm text-red-800 dark:text-red-300">
                      {announcementError}
                    </div>
                  )}

                  {announcementSuccess && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {announcementSuccess}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                      placeholder="e.g., Water supply temporarily unavailable..."
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                      placeholder="Provide details about the announcement..."
                    />
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Priority
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['info', 'warning', 'urgent'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}
                          className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${announcementForm.priority === p
                              ? p === 'info'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ring-2 ring-blue-500'
                                : p === 'warning'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 ring-2 ring-amber-500'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ring-2 ring-red-500'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                          {p === 'info' && 'ℹ️ Info'}
                          {p === 'warning' && '⚠️ Warning'}
                          {p === 'urgent' && '🚨 Urgent'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Expires At <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={announcementForm.expiresAt}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, expiresAt: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsAnnouncementModalOpen(false)}
                      className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={announcementSubmitting}
                      className="px-5 py-2.5 bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium shadow-lg transition-all disabled:cursor-not-allowed"
                    >
                      {announcementSubmitting ? 'Posting...' : 'Post Announcement'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Technician Modal */}
        <AddTechnicianModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            fetchTechnicians(); // Refresh list
            setIsAddModalOpen(false);
          }}
          adminBuildingId={userBuildingId}
          adminBuildingName={userBuildingName}
        />
      </div>
    </RouteGuard>
  );
}
