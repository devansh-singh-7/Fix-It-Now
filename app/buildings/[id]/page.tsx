'use client';

import React, { useState, useEffect, use } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import RouteGuard from '@/app/components/RouteGuard';
import { auth } from '@/app/lib/firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { MaintenanceType, MaintenanceLog } from '@/app/lib/types';

interface BuildingData {
  id: string;
  name: string;
  address: string;
  joinCode: string;
  adminId?: string;
  technicianCount?: number;
  createdAt?: string;
}

interface BuildingMember {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: 'owner' | 'admin' | 'technician' | 'resident';
  isActive: boolean;
  joinedAt?: string;
}

interface MembersByRole {
  owners: BuildingMember[];
  technicians: BuildingMember[];
  residents: BuildingMember[];
  totals: {
    owners: number;
    technicians: number;
    residents: number;
    all: number;
  };
}

interface MaintenanceLogExtended extends Omit<
  MaintenanceLog,
  'id' | 'createdAt' | 'updatedAt' | 'dateCompleted'
> {
  _id: string;
  dateCompleted: string;
}

interface TicketStatusSummary {
  open: number;
  assigned: number;
  inProgress: number;
  completed: number;
  total: number;
}

export default function BuildingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // State
  const [building, setBuilding] = useState<BuildingData | null>(null);
  const [membersByRole, setMembersByRole] = useState<MembersByRole>({
    owners: [],
    technicians: [],
    residents: [],
    totals: { owners: 0, technicians: 0, residents: 0, all: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'owner'>('admin');

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [saving, setSaving] = useState(false);

  // Change owner state
  const [isChangingOwner, setIsChangingOwner] = useState(false);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [changingOwner, setChangingOwner] = useState(false);

  // Maintenance log state
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogExtended[]>([]);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [addingMaintenance, setAddingMaintenance] = useState(false);
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>('General');
  const [maintenanceAssetType, setMaintenanceAssetType] = useState<
    'hvac' | 'electrical' | 'plumbing' | 'elevator' | 'security' | 'appliance'
  >('hvac');
  const [maintenanceAssetName, setMaintenanceAssetName] = useState('');
  const [maintenanceAction, setMaintenanceAction] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [maintenanceCost, setMaintenanceCost] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [ticketStatusSummary, setTicketStatusSummary] = useState<TicketStatusSummary>({
    open: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    total: 0,
  });
  const [isRefreshingLiveData, setIsRefreshingLiveData] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const [copiedCode, setCopiedCode] = useState(false);

  const loadMaintenanceLogs = async (uid: string) => {
    try {
      setLoadingMaintenance(true);
      const res = await fetch(`/api/buildings/${id}/maintenance`, {
        headers: { 'x-user-id': uid },
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceLogs(data.data || []);
      }
    } catch (err) {
      console.error('Failed to load maintenance logs:', err);
    } finally {
      setLoadingMaintenance(false);
    }
  };

  const loadMembersAndTicketStatus = async (uid: string, silent = true) => {
    try {
      if (!silent) {
        setIsRefreshingLiveData(true);
      }

      const [membersRes, ticketRes] = await Promise.all([
        fetch(`/api/buildings/${id}/members`, {
          headers: { 'x-user-id': uid },
        }),
        fetch(`/api/tickets/list?uid=${uid}&role=${userRole}&buildingId=${id}`),
      ]);

      const [membersData, ticketData] = await Promise.all([membersRes.json(), ticketRes.json()]);

      if (membersData.success) {
        const memberData: MembersByRole = membersData.data;
        setMembersByRole(memberData);
      }

      if (ticketData.success && Array.isArray(ticketData.data)) {
        const stats: TicketStatusSummary = {
          open: 0,
          assigned: 0,
          inProgress: 0,
          completed: 0,
          total: ticketData.data.length,
        };

        ticketData.data.forEach((ticket: { status?: string }) => {
          const status = ticket.status;
          if (status === 'open') stats.open += 1;
          if (status === 'assigned') stats.assigned += 1;
          if (status === 'accepted' || status === 'in_progress') stats.inProgress += 1;
          if (status === 'completed') stats.completed += 1;
        });

        setTicketStatusSummary(stats);
      }

      setLastSyncedAt(new Date());
    } catch (err) {
      console.error('Failed to load live building data:', err);
    } finally {
      if (!silent) {
        setIsRefreshingLiveData(false);
      }
    }
  };

  // Load building data
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      setUserId(user.uid);

      const profileRaw = localStorage.getItem('userProfile');
      if (profileRaw) {
        try {
          const profile = JSON.parse(profileRaw);
          const roleValue = typeof profile.role === 'object' ? profile.role?.role : profile.role;
          if (roleValue === 'owner' || roleValue === 'admin') {
            setUserRole(roleValue);
          }
        } catch {
          // Ignore parsing issues and fall back to admin role for summary query.
        }
      }

      try {
        // Fetch building details
        const buildingRes = await fetch(`/api/buildings/${id}`, {
          headers: { 'x-user-id': user.uid },
        });
        const buildingData = await buildingRes.json();

        if (!buildingData.success) {
          throw new Error(buildingData.error || 'Failed to load building');
        }

        setBuilding(buildingData.data);
        setEditName(buildingData.data.name);
        setEditAddress(buildingData.data.address);

        await loadMembersAndTicketStatus(user.uid, true);

        await loadMaintenanceLogs(user.uid);
      } catch (err) {
        console.error('Error loading building:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load building');
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, userRole]);

  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      loadMembersAndTicketStatus(userId, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [userId, id]);

  const handleAddMaintenanceLog = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) return;
    if (!maintenanceAssetName.trim() || !maintenanceAction.trim() || !maintenanceDate || !maintenanceNotes.trim()) {
      setError('Please fill asset name, action taken, date, and notes.');
      return;
    }

    setAddingMaintenance(true);
    setError('');

    try {
      const response = await fetch(`/api/buildings/${id}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          assetName: maintenanceAssetName,
          assetType: maintenanceAssetType,
          maintenanceType,
          actionTaken: maintenanceAction,
          dateCompleted: maintenanceDate,
          cost: maintenanceCost ? Number(maintenanceCost) : undefined,
          notes: maintenanceNotes,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        const fieldErrors = result.details?.fieldErrors
          ? Object.values(result.details.fieldErrors)
              .flat()
              .filter(Boolean)
              .join(' ')
          : '';
        throw new Error(fieldErrors || result.error || 'Failed to add maintenance log');
      }

      setSuccess('Maintenance record added successfully.');
      setMaintenanceAssetName('');
      setMaintenanceAssetType('hvac');
      setMaintenanceAction('');
      setMaintenanceDate('');
      setMaintenanceCost('');
      setMaintenanceNotes('');
      await loadMaintenanceLogs(userId);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to add maintenance log');
      }
    } finally {
      setAddingMaintenance(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!userId || !building) return;

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/buildings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          name: editName,
          address: editAddress,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update building');
      }

      setBuilding((prev) => (prev ? { ...prev, name: editName, address: editAddress } : null));
      setIsEditing(false);
      setSuccess('Building updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update building');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTechnician = async (techUid: string) => {
    if (!userId) return;

    if (!confirm('Are you sure you want to remove this technician?')) return;

    try {
      const response = await fetch(`/api/buildings/${id}/technicians?technicianUid=${techUid}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove technician');
      }

      setMembersByRole((prev) => {
        const nextTechnicians = prev.technicians.filter((t) => t.uid !== techUid);
        return {
          ...prev,
          technicians: nextTechnicians,
          totals: {
            ...prev.totals,
            technicians: nextTechnicians.length,
            all: prev.owners.length + prev.residents.length + nextTechnicians.length,
          },
        };
      });
      setSuccess('Technician removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove technician');
      }
    }
  };

  const handleChangeOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newOwnerEmail.trim()) return;

    if (!confirm(`Are you sure you want to transfer ownership to ${newOwnerEmail}? This action will remove your ownership of this building.`)) return;

    setChangingOwner(true);
    setError('');

    try {
      const response = await fetch(`/api/buildings/${id}/change-owner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          newOwnerEmail: newOwnerEmail.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to change owner');
      }

      setSuccess(`Building owner changed successfully to ${result.newOwner?.email || newOwnerEmail}`);
      setIsChangingOwner(false);
      setNewOwnerEmail('');
      
      // Redirect user back to buildings list after ownership transfer
      setTimeout(() => {
        router.push('/buildings');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to change owner');
      }
    } finally {
      setChangingOwner(false);
    }
  };

  const handleCopyCode = () => {
    if (building?.joinCode) {
      navigator.clipboard.writeText(building.joinCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const renderMemberRoleSection = (
    title: string,
    roleColorClasses: string,
    members: BuildingMember[],
    allowRemoveTechnician = false
  ) => {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${roleColorClasses}`}>
            {members.length}
          </span>
        </div>
        {members.length === 0 ? (
          <p className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">No members in this role.</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {members.map((member) => (
              <li key={member.uid} className="flex items-center justify-between px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-sm">
                    {(member.name || member.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                    {member.phoneNumber && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{member.phoneNumber}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                      Role: {member.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                      member.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {allowRemoveTechnician && (
                    <button
                      onClick={() => handleRemoveTechnician(member.uid)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <RouteGuard allowedRoles={['admin', 'owner']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading building...</p>
          </div>
        </div>
      </RouteGuard>
    );
  }

  if (!building) {
    return (
      <RouteGuard allowedRoles={['admin', 'owner']}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400">{error || 'Building not found'}</p>
            <Link href="/buildings" className="mt-4 inline-block text-blue-600 hover:underline">
              Back to Buildings
            </Link>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['admin', 'owner']}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/buildings"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Buildings
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  {building.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {building.address}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </motion.div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Building Info Card */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Building Details
              </h2>

              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white font-medium">{building.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                    <p className="text-gray-900 dark:text-white font-medium">{building.address}</p>
                  </div>
                </div>
              )}

              {/* Join Code */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  Join Code
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 font-mono text-lg font-bold text-blue-700 dark:text-blue-300">
                    {building.joinCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Change Owner Section */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsChangingOwner(!isChangingOwner)}
                  className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium"
                >
                  {isChangingOwner ? 'Cancel Ownership Transfer' : 'Transfer Building Ownership'}
                </button>

                {isChangingOwner && (
                  <form onSubmit={handleChangeOwner} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        New Owner Email
                      </label>
                      <input
                        type="email"
                        value={newOwnerEmail}
                        onChange={(e) => setNewOwnerEmail(e.target.value)}
                        placeholder="newowner@example.com"
                        required
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Enter the email of a registered user who will become the new building owner.
                        You will lose ownership access to this building.
                      </p>
                    </div>
                    <button
                      type="submit"
                      disabled={changingOwner || !newOwnerEmail.trim()}
                      className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {changingOwner ? 'Transferring...' : 'Transfer Ownership'}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>

            {/* Members List Section */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 dark:bg-gray-900/40 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Building Members
                    <span className="ml-2 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full">
                      {membersByRole.totals.all}
                    </span>
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {lastSyncedAt
                      ? `Live data synced at ${lastSyncedAt.toLocaleTimeString()}`
                      : 'Waiting for first sync...'}
                  </p>
                </div>

                <button
                  onClick={() => userId && loadMembersAndTicketStatus(userId, false)}
                  disabled={isRefreshingLiveData}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshingLiveData ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582M20 20v-5h-.581M5.64 18.364A9 9 0 1118.36 5.636"
                    />
                  </svg>
                  {isRefreshingLiveData ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>

              <ul className="mb-6 divide-y divide-gray-200 dark:divide-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total tickets</span>
                  <span className="text-base font-semibold text-gray-900 dark:text-white">{ticketStatusSummary.total}</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Open</span>
                  <span className="text-base font-semibold text-blue-700 dark:text-blue-300">{ticketStatusSummary.open}</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Assigned</span>
                  <span className="text-base font-semibold text-amber-700 dark:text-amber-300">{ticketStatusSummary.assigned}</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">In progress</span>
                  <span className="text-base font-semibold text-purple-700 dark:text-purple-300">{ticketStatusSummary.inProgress}</span>
                </li>
                <li className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                  <span className="text-base font-semibold text-green-700 dark:text-green-300">{ticketStatusSummary.completed}</span>
                </li>
              </ul>

              <div className="space-y-4">
                {renderMemberRoleSection(
                  'Owners',
                  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
                  membersByRole.owners
                )}
                {renderMemberRoleSection(
                  'Technicians',
                  'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
                  membersByRole.technicians,
                  true
                )}
                {renderMemberRoleSection(
                  'Residents',
                  'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
                  membersByRole.residents
                )}
              </div>
            </motion.div>
          </div>

          {/* Maintenance History */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Maintenance History
            </h2>

            <form onSubmit={handleAddMaintenanceLog} className="grid gap-4 md:grid-cols-2 mb-8">
              <div>
                <Label htmlFor="maintenanceAssetName">Asset Name</Label>
                <Input
                  id="maintenanceAssetName"
                  value={maintenanceAssetName}
                  onChange={(e) => setMaintenanceAssetName(e.target.value)}
                  placeholder="e.g. HVAC Unit A"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maintenanceAssetType">Asset Type</Label>
                <select
                  id="maintenanceAssetType"
                  value={maintenanceAssetType}
                  onChange={(e) =>
                    setMaintenanceAssetType(
                      e.target.value as
                        | 'hvac'
                        | 'electrical'
                        | 'plumbing'
                        | 'elevator'
                        | 'security'
                        | 'appliance'
                    )
                  }
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="hvac" className="bg-white text-gray-900">HVAC</option>
                  <option value="electrical" className="bg-white text-gray-900">Electrical</option>
                  <option value="plumbing" className="bg-white text-gray-900">Plumbing</option>
                  <option value="elevator" className="bg-white text-gray-900">Elevator</option>
                  <option value="security" className="bg-white text-gray-900">Security</option>
                  <option value="appliance" className="bg-white text-gray-900">Appliance</option>
                </select>
              </div>
              <div>
                <Label htmlFor="maintenanceType">Maintenance Type</Label>
                <select
                  id="maintenanceType"
                  value={maintenanceType}
                  onChange={(e) => setMaintenanceType(e.target.value as MaintenanceType)}
                  className="mt-1 flex h-10 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="HVAC" className="bg-white text-gray-900">HVAC</option>
                  <option value="Plumbing" className="bg-white text-gray-900">Plumbing</option>
                  <option value="Electrical" className="bg-white text-gray-900">Electrical</option>
                  <option value="Elevator" className="bg-white text-gray-900">Elevator</option>
                  <option value="General" className="bg-white text-gray-900">General</option>
                </select>
              </div>
              <div>
                <Label htmlFor="maintenanceDate">Date Completed</Label>
                <Input
                  id="maintenanceDate"
                  type="date"
                  value={maintenanceDate}
                  onChange={(e) => setMaintenanceDate(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maintenanceAction">Action Taken</Label>
                <Input
                  id="maintenanceAction"
                  value={maintenanceAction}
                  onChange={(e) => setMaintenanceAction(e.target.value)}
                  placeholder="Routine Inspection / Repair / Replacement"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maintenanceCost">Cost (Optional)</Label>
                <Input
                  id="maintenanceCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={maintenanceCost}
                  onChange={(e) => setMaintenanceCost(e.target.value)}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="maintenanceNotes">Notes</Label>
                <Textarea
                  id="maintenanceNotes"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                  placeholder="Describe what was done and any follow-up needed."
                  required
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={addingMaintenance}
                  className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {addingMaintenance ? 'Saving Log...' : 'Add Maintenance Log'}
                </Button>
              </div>
            </form>

            {loadingMaintenance ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Loading maintenance logs...
              </p>
            ) : maintenanceLogs.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No maintenance records yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Asset</th>
                      <th className="py-2 pr-3">Asset Type</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Action</th>
                      <th className="py-2 pr-3">Cost</th>
                      <th className="py-2 pr-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceLogs.map((log) => (
                      <tr key={log._id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {new Date(log.dateCompleted).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {log.assetName || '-'}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300 uppercase">
                          {log.assetType || '-'}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {log.maintenanceType}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {log.actionTaken}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {typeof log.cost === 'number' ? `$${log.cost.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{log.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </RouteGuard>
  );
}
