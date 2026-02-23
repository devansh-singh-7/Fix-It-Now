"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import NavBar from '@/app/components/NavBar';
import TechnicianBoard from '@/app/components/TechnicianBoard';
import type { UserRole } from '@/app/lib/types';

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return;

      const token = localStorage.getItem('authToken');
      const userProfile = localStorage.getItem('userProfile');

      if (!token || !userProfile) {
        router.push('/auth/signin');
        return;
      }

      try {
        const profile = JSON.parse(userProfile);
        const role = typeof profile.role === 'object' ? profile.role?.role || profile.role : profile.role || 'resident';

        // RBAC: Only technicians can access this page
        if (role !== 'technician') {
          sessionStorage.setItem(
            'accessDeniedMessage',
            'Access denied: This page is only accessible to technicians'
          );
          router.replace('/dashboard?accessDenied=technicians');
          return;
        }

        setUserId(profile.uid || profile.firebaseUid);
        setUserName(profile.name || profile.displayName || 'Technician');
        setUserRole(role as UserRole);
        setLoading(false);
      } catch (error) {
        console.error('Error parsing user profile:', error);
        router.push('/auth/signin');
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <NavBar />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              ))}
            </div>
            <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Technician Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome back, {userName}! Manage your assigned tickets and work orders.
          </p>
        </motion.div>

        <TechnicianBoard userId={userId} userName={userName} userRole={userRole} />
      </main>
    </div>
  );
}
