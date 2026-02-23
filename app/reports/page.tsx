"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, type UserProfile } from '../lib/firebaseClient';
import NavBar from '@/app/components/NavBar';

interface ReportData {
  ticketSummary: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    resolved: number;
  };
  categoryBreakdown: { category: string; count: number; percentage: number }[];
  priorityBreakdown: { priority: string; count: number; percentage: number }[];
  technicianStats: { name: string; assigned: number; completed: number; avgTime: number }[];
  monthlyTrend: { month: string; created: number; resolved: number }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [generating, setGenerating] = useState(false);

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
        
        // Load initial report data
        await loadReportData(profile.buildingId);
      } catch (err) {
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadReportData = async (buildingId?: string) => {
    try {
      // Fetch report data from analytics endpoint
      const url = buildingId 
        ? `/api/analytics/overview?buildingId=${buildingId}`
        : `/api/analytics/overview`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.data) {
        // Transform analytics data to report format
        const data = result.data;
        setReportData({
          ticketSummary: {
            total: data.tickets?.total || 0,
            open: data.tickets?.open || 0,
            inProgress: data.tickets?.inProgress || 0,
            completed: data.tickets?.completed || 0,
            resolved: (data.tickets?.completed || 0),
          },
          categoryBreakdown: (data.tickets?.byCategory || []).map((c: { category: string; count: number }) => ({
            category: c.category,
            count: c.count,
            percentage: data.tickets?.total > 0 ? (c.count / data.tickets.total * 100) : 0
          })),
          priorityBreakdown: (data.tickets?.byPriority || []).map((p: { priority: string; count: number }) => ({
            priority: p.priority,
            count: p.count,
            percentage: data.tickets?.total > 0 ? (p.count / data.tickets.total * 100) : 0
          })),
          technicianStats: (data.technicians || []).map((t: { name: string; totalAssigned: number; completed: number; avgCompletionTime: number }) => ({
            name: t.name,
            assigned: t.totalAssigned,
            completed: t.completed,
            avgTime: t.avgCompletionTime
          })),
          monthlyTrend: (data.invoices?.revenueByMonth || []).map((m: { month: string }) => ({
            month: m.month,
            created: Math.floor(Math.random() * 20) + 5, // Placeholder
            resolved: Math.floor(Math.random() * 15) + 3  // Placeholder
          }))
        });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const handleExportPDF = async () => {
    setGenerating(true);
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    setGenerating(false);
    alert('Report PDF generated! (PDF export functionality to be implemented)');
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    
    // Generate CSV content
    let csv = 'Category,Count,Percentage\n';
    reportData.categoryBreakdown.forEach(item => {
      csv += `${item.category},${item.count},${item.percentage.toFixed(1)}%\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Reports
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generate and export maintenance reports for {userProfile?.buildingName || 'all buildings'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Period Selector */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="quarter">Last Quarter</option>
                <option value="year">Last Year</option>
              </select>

              {/* Export Buttons */}
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Tickets</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{reportData?.ticketSummary.total || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Open</p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{reportData?.ticketSummary.open || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{reportData?.ticketSummary.inProgress || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{reportData?.ticketSummary.completed || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">Resolution Rate</p>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {reportData?.ticketSummary.total && reportData.ticketSummary.total > 0 
                ? `${((reportData.ticketSummary.completed / reportData.ticketSummary.total) * 100).toFixed(0)}%`
                : '0%'}
            </p>
          </div>
        </motion.div>

        {/* Category & Priority Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Category Breakdown */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets by Category</h2>
            <div className="space-y-4">
              {reportData?.categoryBreakdown.length ? (
                reportData.categoryBreakdown.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">{item.category}</span>
                      <span className="text-gray-500 dark:text-gray-400">{item.count} ({item.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No category data available</p>
              )}
            </div>
          </motion.div>

          {/* Priority Breakdown */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tickets by Priority</h2>
            <div className="space-y-4">
              {reportData?.priorityBreakdown.length ? (
                reportData.priorityBreakdown.map((item) => {
                  const colors: Record<string, string> = {
                    low: 'bg-green-500',
                    medium: 'bg-yellow-500',
                    high: 'bg-orange-500',
                    critical: 'bg-red-500'
                  };
                  return (
                    <div key={item.priority}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300 capitalize">{item.priority}</span>
                        <span className="text-gray-500 dark:text-gray-400">{item.count} ({item.percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`${colors[item.priority] || 'bg-blue-600'} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">No priority data available</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Technician Performance */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technician Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Technician</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completion Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg. Time</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {reportData?.technicianStats.length ? (
                  reportData.technicianStats.map((tech) => (
                    <tr key={tech.name}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tech.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.assigned}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.completed}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {tech.assigned > 0 ? `${((tech.completed / tech.assigned) * 100).toFixed(0)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{tech.avgTime.toFixed(1)}h</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No technician data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
