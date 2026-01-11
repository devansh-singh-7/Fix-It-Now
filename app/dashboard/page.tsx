"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { SubscriptionTier, SubscriptionPlan } from "@/app/lib/types";

// Lazy load heavy components to reduce initial bundle
const NavBar = dynamic(() => import("@/app/components/NavBar"), {
  ssr: false,
  loading: () => (
    <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800" />
  )
});

const AnnouncementBanner = dynamic(() => import("@/app/components/AnnouncementBanner"), {
  ssr: false,
  loading: () => null
});

const CreateTicketForm = dynamic(() => import("@/app/components/CreateTicketForm"), {
  ssr: false,
  loading: () => null
});

const SupportChatBot = dynamic(() => import("@/app/components/SupportChatBot").then(mod => mod.SupportChatBot), {
  ssr: false,
  loading: () => null
});

const StatCard = dynamic(() => import("@/app/components/StatCard"), {
  ssr: false,
  loading: () => <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
});

const TicketCard = dynamic(() => import("@/app/components/TicketCard"), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
});

const QuickActions = dynamic(() => import("@/app/components/dashboard/QuickActions").then(mod => mod.QuickActions), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
});

const RecentActivity = dynamic(() => import("@/app/components/dashboard/RecentActivity").then(mod => mod.RecentActivity), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
});


type User = {
  displayName: string;
  email: string;
  role: 'admin' | 'technician' | 'resident';
  subscriptionPlan?: SubscriptionPlan;
  subscriptionTier?: SubscriptionTier;
};

export default function DashboardPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  // Real-time data from MongoDB - starts empty, populated by API
  const [statsData, setStatsData] = useState<{
    stats: {
      total: { value: number; trend: number };
      open: { value: number; trend: number };
      inProgress: { value: number; trend: number };
      completed: { value: number; trend: number };
    };
    recentTickets: Array<Record<string, unknown>>;
  } | null>(null);

  const [recentTickets, setRecentTickets] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    location: string;
    building: string;
    createdBy: string;
    assignedTo?: string;
    created_at: Date;
    updated_at: Date;
  }>>([]);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier | null>(null);

  // Enhanced stats with icons and trends - now dynamic
  const stats = useMemo(() => {
    if (!statsData) {
      return [
        {
          title: "Total Tickets",
          value: "0",
          subtitle: "Loading...",
          trend: { value: "0%", positive: true },
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          color: "from-blue-500 to-blue-600"
        },
        {
          title: "Open Tickets",
          value: "0",
          subtitle: "Loading...",
          trend: { value: "0%", positive: false },
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "from-amber-500 to-amber-600"
        },
        {
          title: "In Progress",
          value: "0",
          subtitle: "Loading...",
          trend: { value: "0%", positive: true },
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ),
          color: "from-indigo-500 to-indigo-600"
        },
        {
          title: "Completed",
          value: "0",
          subtitle: "Loading...",
          trend: { value: "0%", positive: true },
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          color: "from-emerald-500 to-emerald-600"
        },
      ];
    }

    const { stats } = statsData;
    return [
      {
        title: "Total Tickets",
        value: String(stats.total.value),
        subtitle: `${stats.total.trend >= 0 ? '+' : ''}${stats.total.trend}% from last month`,
        trend: { value: `${Math.abs(stats.total.trend)}%`, positive: stats.total.trend >= 0 },
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
        color: "from-blue-500 to-blue-600"
      },
      {
        title: "Open Tickets",
        value: String(stats.open.value),
        subtitle: stats.open.value > 0 ? "Requires attention" : "All clear!",
        trend: { value: `${Math.abs(stats.open.trend)}%`, positive: stats.open.trend <= 0 },
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: "from-amber-500 to-amber-600"
      },
      {
        title: "In Progress",
        value: String(stats.inProgress.value),
        subtitle: `${stats.inProgress.trend >= 0 ? '+' : ''}${stats.inProgress.trend}% from last month`,
        trend: { value: `${Math.abs(stats.inProgress.trend)}%`, positive: stats.inProgress.trend >= 0 },
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        color: "from-indigo-500 to-indigo-600"
      },
      {
        title: "Completed",
        value: String(stats.completed.value),
        subtitle: `${stats.completed.trend >= 0 ? '+' : ''}${stats.completed.trend}% from last month`,
        trend: { value: `${Math.abs(stats.completed.trend)}%`, positive: stats.completed.trend >= 0 },
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        color: "from-emerald-500 to-emerald-600"
      },
    ];
  }, [statsData]);

  // Filter tickets based on active filter
  const filteredTickets = useMemo(() => {
    if (activeFilter === 'all') return recentTickets;
    return recentTickets.filter(ticket => {
      if (activeFilter === 'in-progress') {
        return ['assigned', 'accepted', 'in_progress'].includes(ticket.status);
      }
      if (activeFilter === 'resolved') {
        return ticket.status === 'completed';
      }
      return ticket.status === activeFilter;
    });
  }, [activeFilter, recentTickets]);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken');
        const userProfile = localStorage.getItem('userProfile');

        if (!token || !userProfile) {
          router.push('/auth/signin');
          return;
        }

        try {
          const profile = JSON.parse(userProfile);

          // Handle both uid and firebaseUid for compatibility
          const uid = profile.uid || profile.firebaseUid;
          setUserId(uid);

          // Extract role - handle both string and nested object { role: 'admin' }
          const extractedRole = typeof profile.role === 'object'
            ? profile.role?.role || profile.role
            : profile.role;

          // Extract buildingId - handle both string and nested object { buildingId: '...' }
          const extractedBuildingId = typeof profile.buildingId === 'object'
            ? profile.buildingId?.buildingId || profile.buildingId
            : profile.buildingId;

          setBuildingId(extractedBuildingId || '');

          // Extract subscription tier (1=Enterprise, 2=Pro, 3=Basic)
          const extractedTier = profile.subscriptionTier ||
            (profile.subscriptionPlan === 'ENTERPRISE' ? 1 :
              profile.subscriptionPlan === 'PRO' ? 2 :
                profile.subscriptionPlan === 'BASIC' ? 3 : null);

          setSubscriptionTier(extractedTier);

          // Set user with proper role type and subscription
          setUser({
            ...profile,
            role: extractedRole,
            subscriptionPlan: profile.subscriptionPlan,
            subscriptionTier: extractedTier
          });

          console.log('Dashboard loaded for user:', {
            name: profile.displayName || profile.name,
            uid: uid,
            role: extractedRole,
            buildingId: extractedBuildingId,
            hasBuildingId: !!extractedBuildingId
          });
        } catch (error) {
          console.error('Error parsing user profile:', error);
          router.push('/auth/signin');
        }
      }
      setLoading(false);
    };

    checkAuth();

    // Re-check auth when window gains focus (user might have joined building in another tab)
    const handleFocus = () => {
      console.log('Window focused - reloading user profile');
      checkAuth();
    };

    window.addEventListener('focus', handleFocus);

    // Also listen for storage changes (when localStorage is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userProfile') {
        console.log('User profile updated in localStorage - reloading');
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [router]);

  // Ref to store fetch function for external calls
  const fetchDashboardStatsRef = useRef<(() => Promise<void>) | null>(null);

  // Fetch dashboard stats from MongoDB with polling
  useEffect(() => {
    if (!userId || !user?.role) {
      console.log('Waiting for user data:', { userId, role: user?.role });
      return;
    }

    const fetchStats = async () => {
      try {
        // Build URL - buildingId is optional now
        const params = new URLSearchParams({
          uid: userId,
          role: user.role
        });
        if (buildingId) {
          params.append('buildingId', buildingId);
        }

        const url = `/api/dashboard/stats?${params.toString()}`;
        console.log('Fetching dashboard stats:', url);

        const response = await fetch(url);
        const data = await response.json();

        console.log('Dashboard stats response:', data);

        if (data.success) {
          setStatsData(data.data);
          setRecentTickets(data.data.recentTickets || []);
          console.log('✅ Loaded tickets:', data.data.recentTickets?.length || 0);
        } else {
          console.error('Failed to fetch stats:', data.error);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    // Store function in ref for external access
    fetchDashboardStatsRef.current = fetchStats;

    // Initial fetch
    fetchStats();

    // Set up polling - refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, buildingId, user?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
            <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has invalid UID
  const hasInvalidUID = !userId || userId === 'undefined' || userId === 'null';

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Show error if user has invalid UID */}
        {hasInvalidUID && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-100">Authentication Issue</h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  Your user account is not properly authenticated. Please sign out and sign in again to fix this issue.
                </p>
                <button
                  onClick={() => {
                    localStorage.clear();
                    router.push('/auth/signin');
                  }}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out & Fix
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user.displayName}</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here&apos;s an overview of your maintenance operations
              </p>
            </div>

            {/* Role Badge */}
            <div className="flex items-center gap-3">
              <div className={`px-4 py-2 rounded-lg font-medium ${user.role === 'admin'
                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                : user.role === 'technician'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Announcements */}
        {userId && user?.role && (
          <AnnouncementBanner
            userId={userId}
            userRole={user.role}
            buildingId={buildingId}
          />
        )}

        {/* Stats Grid */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              {...stat}

            />
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Tickets */}
          <div className="lg:col-span-2">
            {/* Tickets Header */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Recent Tickets
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track and manage maintenance requests
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Filter Tabs */}
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {['all', 'open', 'in-progress', 'resolved'].map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter as 'all' | 'open' | 'in-progress' | 'resolved')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeFilter === filter
                          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsCreateTicketOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 group"
                  >
                    <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Ticket
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Tickets List */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.3 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                  className="space-y-4"
                >
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                      <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No tickets found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {hasInvalidUID
                          ? 'Unable to load tickets due to authentication issue'
                          : activeFilter === 'all'
                            ? user?.role === 'resident'
                              ? "You haven't created any tickets yet"
                              : user?.role === 'technician'
                                ? "No tickets assigned to you yet"
                                : "No tickets in your building yet"
                            : `No ${activeFilter} tickets at the moment`
                        }
                      </p>
                      {!hasInvalidUID && !buildingId && (
                        <p className="text-sm text-amber-600 dark:text-amber-400 mb-4">
                          ⚠️ You need to join a building to create tickets
                        </p>
                      )}
                      {!hasInvalidUID && buildingId && (
                        <button
                          onClick={() => setIsCreateTicketOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create your first ticket
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id || `ticket-${index}`}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: shouldReduceMotion ? 0 : 0.2,
                          delay: index * 0.05
                        }}
                      >
                        <TicketCard
                          ticket={{
                            id: ticket.id,
                            title: ticket.title,
                            description: ticket.description,
                            status: ticket.status,
                            priority: ticket.priority,
                            created_at: typeof ticket.created_at === 'string'
                              ? ticket.created_at
                              : ticket.created_at instanceof Date
                                ? ticket.created_at.toISOString()
                                : new Date(ticket.created_at).toISOString(),
                            assigned_to: ticket.assignedTo
                          }}
                          onClick={() => console.log('Ticket clicked:', ticket.id)}
                        />
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.3 }}
            >
              <QuickActions />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.4 }}
            >
              <RecentActivity />
            </motion.div>

            {/* Performance Metrics */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: 0.5 }}
              className="bg-linear-to-br from-gray-900 to-black rounded-2xl p-6 text-white"
            >
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="space-y-6">
                {/* Response Time */}
                <div className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Response Time</span>
                    <span className="font-bold text-blue-400">2.4h</span>
                  </div>
                  <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "75%" }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      className="h-full bg-linear-to-r from-blue-500 to-blue-400 rounded-full relative overflow-hidden group-hover:shadow-lg group-hover:shadow-blue-500/50 transition-shadow duration-300"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 1.5,
                          delay: 0.8,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-gray-700">
                      Target: 3h | Current: 2.4h
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-950 border-r border-b border-gray-700 rotate-45"></div>
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>20% better than last month</span>
                  </div>
                </div>

                {/* Resolution Rate */}
                <div className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Resolution Rate</span>
                    <span className="font-bold text-emerald-400">92%</span>
                  </div>
                  <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                      className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 rounded-full relative overflow-hidden group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-shadow duration-300"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 1.5,
                          delay: 1.0,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-gray-700">
                      Target: 85% | Current: 92%
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-950 border-r border-b border-gray-700 rotate-45"></div>
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Exceeding target by 7%</span>
                  </div>
                </div>

                {/* Satisfaction */}
                <div className="group">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Satisfaction</span>
                    <span className="font-bold text-amber-400">4.8/5</span>
                  </div>
                  <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "96%" }}
                      transition={{ duration: 1.2, delay: 1.0, ease: "easeOut" }}
                      className="h-full bg-linear-to-r from-amber-500 to-amber-400 rounded-full relative overflow-hidden group-hover:shadow-lg group-hover:shadow-amber-500/50 transition-shadow duration-300"
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        animate={{ x: "200%" }}
                        transition={{
                          duration: 1.5,
                          delay: 1.2,
                          ease: "easeInOut"
                        }}
                      />
                    </motion.div>
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-gray-700">
                      Target: 4.5 | Current: 4.8
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-950 border-r border-b border-gray-700 rotate-45"></div>
                    </div>
                  </div>
                  <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Top rated this quarter</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Role-specific Panels */}
        <AnimatePresence>
          {user.role === 'admin' && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              className="mt-8"
            >
              <div className="bg-linear-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Admin Dashboard
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage users, buildings, and system settings
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/admin/users"
                      className="px-5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow"
                    >
                      Manage Users
                    </Link>
                    <Link
                      href="/admin/settings"
                      className="px-5 py-2.5 bg-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all"
                    >
                      System Settings
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {user.role === 'technician' && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
              className="mt-8"
            >
              <div className="bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Technician Board
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      View assigned tickets, inventory, and work orders
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/technician/assignments"
                      className="px-5 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow"
                    >
                      My Assignments
                    </Link>
                    <Link
                      href="/technician/tools"
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all"
                    >
                      Tools & Resources
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Create Ticket Modal */}
      <CreateTicketForm
        isOpen={isCreateTicketOpen}
        onClose={() => setIsCreateTicketOpen(false)}
        onSuccess={() => {
          console.log('Ticket created successfully');
          // Refresh tickets list immediately
          fetchDashboardStatsRef.current?.();
        }}
      />

      {/* Support Chatbot - for Pro/Enterprise subscribers OR admins */}
      {(user.role === 'admin' || (subscriptionTier && subscriptionTier <= 2)) && (
        <SupportChatBot />
      )}
    </div>
  );
}
