"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, type UserProfile } from '../lib/firebaseClient';
import NavBar from '@/app/components/NavBar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  buildingId: string;
  healthScore: number;
  tickets: {
    total: number;
    open: number;
    assigned: number;
    accepted: number;
    inProgress: number;
    completed: number;
    byCategory: { category: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    avgCompletionTime: number;
    trend: { date: string; count: number }[];
  };
  technicians: {
    uid: string;
    name: string;
    totalAssigned: number;
    completed: number;
    inProgress: number;
    avgCompletionTime: number;
    completionRate: number;
    ticketsByCategory: { category: string; count: number }[];
  }[];
  predictions: {
    total: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    byModel: { model: string; count: number; avgProbability: number }[];
    recentPredictions: {
      id: string;
      ticketId?: string;
      riskBucket: string;
      failureProbability: number;
      recommendedAction: string;
      createdAt: Date;
    }[];
  };
  invoices: {
    totalRevenue: number;
    pendingAmount: number;
    paidAmount: number;
    cancelledAmount: number;
    totalInvoices: number;
    avgInvoiceAmount: number;
    revenueByMonth: { month: string; revenue: number }[];
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<{ id: string; name: string; address: string }[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all'); // 'all' or buildingId

  useEffect(() => {
    if (!auth) {
      router.push('/auth/signin');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        // Fetch user profile via API
        const profileRes = await fetch(`/api/users/profile?uid=${user.uid}`);
        const profileData = await profileRes.json();
        
        if (!profileData.success || !profileData.data) {
          router.push('/auth/signin');
          return;
        }

        const profile = profileData.data;
        if (profile.role !== 'admin') {
          router.push('/dashboard');
          return;
        }

        setUserProfile(profile);

        // Fetch buildings list for filter dropdown
        try {
          const buildingsRes = await fetch('/api/buildings/list');
          const buildingsData = await buildingsRes.json();
          if (buildingsData.success && buildingsData.buildings) {
            setBuildings(buildingsData.buildings);
            console.log('[Analytics Page] Buildings loaded:', buildingsData.buildings.length);
          }
        } catch (err) {
          console.error('[Analytics Page] Error loading buildings:', err);
        }

        // Fetch analytics data - default to 'all' buildings
        const analyticsUrl = `/api/analytics/overview?buildingId=all`;

        const response = await fetch(analyticsUrl);
        const result = await response.json();

        console.log('[Analytics Page] API Response:', result);

        if (result.success) {
          setAnalytics(result.data);
          console.log('[Analytics Page] Data loaded successfully:', result.data);
        } else {
          console.error('[Analytics Page] API Error:', result.error);
          setError(result.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Refetch analytics when building filter changes
  useEffect(() => {
    if (!userProfile) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const analyticsUrl = `/api/analytics/overview?buildingId=${selectedBuilding}`;
        
        console.log('[Analytics Page] Fetching analytics for:', selectedBuilding);
        
        const response = await fetch(analyticsUrl);
        const result = await response.json();

        if (result.success) {
          setAnalytics(result.data);
          setError(null);
          console.log('[Analytics Page] Analytics updated for building:', selectedBuilding);
        } else {
          setError(result.error || 'Failed to load analytics');
        }
      } catch (err) {
        console.error('[Analytics Page] Error fetching analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedBuilding, userProfile]);

  // Real-time polling - refresh analytics every 60 seconds
  useEffect(() => {
    if (!userProfile) return;

    const refreshAnalytics = async () => {
      try {
        const analyticsUrl = `/api/analytics/overview?buildingId=${selectedBuilding}`;

        const response = await fetch(analyticsUrl);
        const result = await response.json();

        if (result.success) {
          setAnalytics(result.data);
          setError(null);
          console.log('[Analytics Page] Data refreshed at:', new Date().toISOString());
        }
      } catch (err) {
        console.error('[Analytics Page] Error refreshing analytics:', err);
      }
    };

    const interval = setInterval(refreshAnalytics, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userProfile, selectedBuilding]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'No analytics data available'}</p>
        </div>
      </div>
    );
  }

  // Chart configurations
  const ticketStatusData = {
    labels: ['Open', 'Assigned', 'Accepted', 'In Progress', 'Completed'],
    datasets: [{
      label: 'Tickets by Status',
      data: [
        analytics.tickets.open,
        analytics.tickets.assigned,
        analytics.tickets.accepted,
        analytics.tickets.inProgress,
        analytics.tickets.completed
      ],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(99, 102, 241, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)'
      ],
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(139, 92, 246)',
        'rgb(99, 102, 241)',
        'rgb(234, 179, 8)',
        'rgb(34, 197, 94)'
      ],
      borderWidth: 1
    }]
  };

  const categoryData = {
    labels: analytics.tickets.byCategory.map(c => c.category.charAt(0).toUpperCase() + c.category.slice(1)),
    datasets: [{
      label: 'Tickets by Category',
      data: analytics.tickets.byCategory.map(c => c.count),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ]
    }]
  };

  const priorityData = {
    labels: analytics.tickets.byPriority.map(p => p.priority.charAt(0).toUpperCase() + p.priority.slice(1)),
    datasets: [{
      label: 'Tickets by Priority',
      data: analytics.tickets.byPriority.map(p => p.count),
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(249, 115, 22, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };

  const trendData = {
    labels: analytics.tickets.trend.map(t => new Date(t.date).toLocaleDateString()),
    datasets: [{
      label: 'Tickets Created',
      data: analytics.tickets.trend.map(t => t.count),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const riskData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      label: 'AI Predictions',
      data: [analytics.predictions.lowRisk, analytics.predictions.mediumRisk, analytics.predictions.highRisk],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(234, 179, 8, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ]
    }]
  };

  const technicianPerformanceData = {
    labels: analytics.technicians.map(t => t.name),
    datasets: [
      {
        label: 'Completed',
        data: analytics.technicians.map(t => t.completed),
        backgroundColor: 'rgba(34, 197, 94, 0.8)'
      },
      {
        label: 'In Progress',
        data: analytics.technicians.map(t => t.inProgress),
        backgroundColor: 'rgba(234, 179, 8, 0.8)'
      }
    ]
  };

  const revenueData = {
    labels: analytics.invoices.revenueByMonth.map(m => m.month),
    datasets: [{
      label: 'Revenue (₹)',
      data: analytics.invoices.revenueByMonth.map(m => m.revenue),
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // Model Performance Data
  const modelPerformanceData = analytics.predictions.byModel.length > 0 ? {
    labels: analytics.predictions.byModel.map(m => m.model.replace('_', ' ').toUpperCase()),
    datasets: [{
      label: 'Predictions Count',
      data: analytics.predictions.byModel.map(m => m.count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)',
        'rgba(251, 146, 60, 0.8)'
      ]
    }]
  } : null;

  const modelAccuracyData = analytics.predictions.byModel.length > 0 ? {
    labels: analytics.predictions.byModel.map(m => m.model.replace('_', ' ').toUpperCase()),
    datasets: [{
      label: 'Avg Failure Probability',
      data: analytics.predictions.byModel.map(m => (m.avgProbability * 100).toFixed(1)),
      backgroundColor: 'rgba(239, 68, 68, 0.8)',
      borderColor: 'rgba(239, 68, 68, 1)',
      borderWidth: 1
    }]
  } : null;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Building Filter */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedBuilding === 'all' 
                  ? 'Viewing analytics for all buildings'
                  : `Building: ${buildings.find(b => b.id === selectedBuilding)?.name || 'Selected Building'}`
                }
              </p>
            </div>
            
            {/* Building Filter Dropdown */}
            <div className="min-w-[250px]">
              <label htmlFor="building-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Building
              </label>
              <select
                id="building-filter"
                value={selectedBuilding}
                onChange={(e) => setSelectedBuilding(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all"
              >
                <option value="all">All Buildings</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name} - {building.address}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Health Score */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-8 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Building Health Score</h2>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={analytics.healthScore >= 80 ? '#22c55e' : analytics.healthScore >= 60 ? '#eab308' : '#ef4444'}
                  strokeWidth="8"
                  strokeDasharray={`${analytics.healthScore * 2.51} 251`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-5xl font-bold ${getHealthScoreColor(analytics.healthScore)}`}>
                  {analytics.healthScore}
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">
            {analytics.healthScore >= 80 ? 'Excellent' : analytics.healthScore >= 60 ? 'Good' : 'Needs Attention'}
          </p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.tickets.total}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 000-4V7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.tickets.open}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.tickets.completed}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Completion</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {analytics.tickets.avgCompletionTime.toFixed(1)}h
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Charts Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          {/* Ticket Status */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ticket Status Distribution</h3>
            <Bar data={ticketStatusData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickets by Category</h3>
            <Doughnut data={categoryData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Priority Distribution */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Tickets by Priority</h3>
            <Pie data={priorityData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>

          {/* Ticket Trend */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ticket Trend (30 Days)</h3>
            <Line data={trendData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
        </motion.div>

        {/* Technician Performance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Technician Performance</h3>
          
          {analytics.technicians.length > 0 ? (
            <>
              <Bar data={technicianPerformanceData} options={{ responsive: true, maintainAspectRatio: true }} />
              
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {analytics.technicians.map((tech) => (
                      <tr key={tech.uid}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tech.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.totalAssigned}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.completed}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.completionRate.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.avgCompletionTime.toFixed(1)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A10.97 10.97 0 0112 15c2.503 0 4.81.835 6.879 2.243M15 11a3 3 0 11-6 0 3 3 0 016 0" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No technician performance data available yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Add technicians to your building to track their performance</p>
            </div>
          )}
        </motion.div>

        {/* AI Predictions & Revenue */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">AI Risk Assessment</h3>
            <Doughnut data={riskData} options={{ responsive: true, maintainAspectRatio: true }} />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Predictions:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{analytics.predictions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600 dark:text-red-400">High Risk:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{analytics.predictions.highRisk}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent High-Risk Predictions</h3>
            {analytics.predictions.recentPredictions.length > 0 ? (
              <div className="space-y-3">
                {analytics.predictions.recentPredictions.slice(0, 5).map((pred, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            pred.riskBucket === 'high' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                              : pred.riskBucket === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          }`}>
                            {pred.riskBucket.toUpperCase()} RISK
                          </span>
                          {pred.ticketId && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Ticket: {pred.ticketId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{pred.recommendedAction}</p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {(pred.failureProbability * 100).toFixed(0)}%
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">probability</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h3v8H7v-8zM14 4h3v16h-3V4zM3 16h3v4H3v-4z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">No recent predictions available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Prediction Analytics */}
        {analytics.predictions.total > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 mb-6"
          >
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Predictive Analytics Insights</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Model Performance */}
              {modelPerformanceData && (
                <div>
                  <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Model Predictions Count</h4>
                  <Bar data={modelPerformanceData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              )}

              {/* Model Accuracy */}
              {modelAccuracyData && (
                <div>
                  <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Average Failure Probability (%)</h4>
                  <Bar data={modelAccuracyData} options={{ 
                    responsive: true, 
                    maintainAspectRatio: true,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100
                      }
                    },
                    plugins: {
                      legend: {
                        display: false
                      }
                    }
                  }} />
                </div>
              )}
            </div>

            {/* Model Statistics Table */}
            {analytics.predictions.byModel.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-medium mb-3 text-gray-800 dark:text-gray-200">Model Performance Details</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Model</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Predictions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Probability</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {analytics.predictions.byModel.map((model, idx) => {
                        const riskLevel = model.avgProbability >= 0.7 ? 'High' : model.avgProbability >= 0.4 ? 'Medium' : 'Low';
                        const riskColor = model.avgProbability >= 0.7 
                          ? 'text-red-600 dark:text-red-400' 
                          : model.avgProbability >= 0.4 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-green-600 dark:text-green-400';
                        
                        return (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {model.model.replace('_', ' ').toUpperCase()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {model.count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {(model.avgProbability * 100).toFixed(1)}%
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${riskColor}`}>
                              {riskLevel}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Risk Distribution Insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium">High Risk</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{analytics.predictions.highRisk}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {analytics.predictions.total > 0 
                        ? `${((analytics.predictions.highRisk / analytics.predictions.total) * 100).toFixed(1)}% of total`
                        : '0% of total'
                      }
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-.01-11a9 9 0 100 18 9 9 0 000-18z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium">Medium Risk</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.predictions.mediumRisk}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {analytics.predictions.total > 0 
                        ? `${((analytics.predictions.mediumRisk / analytics.predictions.total) * 100).toFixed(1)}% of total`
                        : '0% of total'
                      }
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-300 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.33 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium">Low Risk</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analytics.predictions.lowRisk}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {analytics.predictions.total > 0 
                        ? `${((analytics.predictions.lowRisk / analytics.predictions.total) * 100).toFixed(1)}% of total`
                        : '0% of total'
                      }
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State for Predictions */}
        {analytics.predictions.total === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 mb-6 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m2-4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Predictions Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Start using the AI-powered prediction system to identify potential issues before they occur. 
              Upload images or create tickets to generate predictive insights.
            </p>
          </motion.div>
        )}

        {/* Revenue Analytics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{analytics.invoices.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{analytics.invoices.paidAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">₹{analytics.invoices.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Invoice</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">₹{analytics.invoices.avgInvoiceAmount.toFixed(0)}</p>
            </div>
          </div>
          <Line data={revenueData} options={{ responsive: true, maintainAspectRatio: true }} />
        </motion.div>
      </main>
    </div>
  );
}