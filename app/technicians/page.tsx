'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import NavBar from '@/app/components/NavBar';
import TechnicianBoard from '@/app/components/TechnicianBoard';
import { auth } from '@/app/lib/firebaseClient';
import type { UserRole } from '@/app/lib/types';

export default function TechnicianDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [buildingId, setBuildingId] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      try {
        const [roleRes, buildingRes] = await Promise.all([
          fetch(`/api/users/role?uid=${currentUser.uid}`),
          fetch(`/api/users/building-id?uid=${currentUser.uid}`),
        ]);

        const [roleData, buildingData] = await Promise.all([roleRes.json(), buildingRes.json()]);
        const roleRaw = roleData?.data?.role ?? roleData?.data ?? null;
        const role =
          roleRaw === 'admin' || roleRaw === 'technician' || roleRaw === 'owner' || roleRaw === 'resident'
            ? roleRaw
            : null;

        if (role !== 'technician' && role !== 'admin') {
          sessionStorage.setItem(
            'accessDeniedMessage',
            'Access denied: This page is only accessible to technicians and administrators'
          );
          router.replace('/dashboard?accessDenied=technicians');
          return;
        }

        const resolvedBuildingId = buildingData?.data?.buildingId ?? buildingData?.data ?? null;

        setUserId(currentUser.uid);
        setUserName(currentUser.displayName || currentUser.email || 'Technician');
        setUserRole(role);
        setBuildingId(
          resolvedBuildingId && resolvedBuildingId !== 'null' && resolvedBuildingId !== 'undefined'
            ? String(resolvedBuildingId)
            : null
        );
      } catch (error) {
        console.error('Error loading technician auth context:', error);
        router.push('/auth/signin');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Technician Dashboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Welcome back, {userName}!{' '}
            {userRole === 'admin'
              ? 'View and manage technician assignments.'
              : 'Manage your assigned tickets and work orders.'}
          </p>
        </motion.div>

        <TechnicianBoard
          userId={userId}
          userName={userName}
          userRole={userRole}
          buildingId={buildingId}
        />
      </main>
    </div>
  );
}
