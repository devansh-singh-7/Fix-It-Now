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

        // Fetch analytics data
        // For admins, fetch analytics for their building or all buildings if no buildingId
        const analyticsUrl = profile.buildingId 
          ? `/api/analytics/overview?buildingId=${profile.buildingId}`
          : `/api/analytics/overview`; // Global analytics for super admins

        const response = await fetch(analyticsUrl);
        const result = await response.json();

        if (result.success) {
          setAnalytics(result.data);
        } else {
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

  // Real-time polling - refresh analytics every 60 seconds
  useEffect(() => {
    if (!userProfile) return;

    const refreshAnalytics = async () => {
      try {
        const analyticsUrl = userProfile.buildingId 
          ? `/api/analytics/overview?buildingId=${userProfile.buildingId}`
          : `/api/analytics/overview`; // Global analytics for super admins

        const response = await fetch(analyticsUrl);
        const result = await response.json();

        if (result.success) {
          setAnalytics(result.data);
          setError(null);
        }
      } catch (err) {
        console.error('Error refreshing analytics:', err);
      }
    };

    const interval = setInterval(refreshAnalytics, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [userProfile]);

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

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Building: {userProfile?.buildingName || 'All Buildings'}
          </p>
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
              <div className="text-4xl">🎫</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{analytics.tickets.open}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{analytics.tickets.completed}</p>
              </div>
              <div className="text-4xl">✅</div>
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
              <div className="text-4xl">⏱️</div>
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
            <div className="space-y-3">
              {analytics.predictions.recentPredictions.slice(0, 5).map((pred, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Risk: <span className={pred.riskBucket === 'high' ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}>
                          {pred.riskBucket}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{pred.recommendedAction}</p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(pred.failureProbability * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

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