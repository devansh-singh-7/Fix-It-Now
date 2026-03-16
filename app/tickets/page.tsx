'use client';

/**
 * Tickets Page
 *
 * Role-based ticket visibility:
 * - Admins: See ALL tickets for their building
 * - Technicians: See only tickets assigned to them
 * - Residents: See only their own tickets
 *
 * Features:
 * - Real-time ticket loading from MongoDB
 * - Different table views based on role
 * - Status badges with colors
 * - Priority indicators
 * - Assign tickets to technicians (admins only)
 * - Update ticket status
 * - Create new tickets
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  type UserRole,
  type TicketStatus,
  type UserProfile,
  type TicketComment,
} from '@/app/lib/firebaseClient';
import TicketTimeline from '@/app/components/TicketTimeline';
import NavBar from '@/app/components/NavBar';
import { normalizeTickets, type NormalizedTicket } from '@/app/lib/ticketUtils';

// Lazy load CreateTicketForm to avoid loading AI classifier on initial page load
const CreateTicketForm = dynamic(() => import('@/app/components/CreateTicketForm'), {
  ssr: false,
  loading: () => null,
});

export default function TicketsPage() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  // User state
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [buildingId, setBuildingId] = useState<string | null>(null);

  // Tickets state - using normalized tickets for consistent UI display
  const [tickets, setTickets] = useState<NormalizedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Building filter for admins
  const [buildings, setBuildings] = useState<Array<{ id: string; name: string; address: string }>>(
    []
  );
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');

  // Technicians (for admin assignment)
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);

  // UI state
  const [selectedTicket, setSelectedTicket] = useState<NormalizedTicket | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<NormalizedTicket | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Comments state
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [ticketComments, setTicketComments] = useState<TicketComment[]>([]);

  // Completion proof state (used in View modal)
  const [completionWorkFile, setCompletionWorkFile] = useState<File | null>(null);
  const [completionWorkPreview, setCompletionWorkPreview] = useState<string | null>(null);
  const [completionWorkImageUrl, setCompletionWorkImageUrl] = useState<string | null>(null);
  const [completionWorkPublicId, setCompletionWorkPublicId] = useState<string | null>(null);
  const [uploadingCompletionImage, setUploadingCompletionImage] = useState(false);
  const [finishingTicket, setFinishingTicket] = useState(false);

  const resetCompletionState = () => {
    setCompletionWorkFile(null);
    setCompletionWorkPreview(null);
    setCompletionWorkImageUrl(null);
    setCompletionWorkPublicId(null);
    setUploadingCompletionImage(false);
    setFinishingTicket(false);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTicket(null);
    setTicketComments([]);
    setNewComment('');
    resetCompletionState();
  };

  // Load user data and tickets
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        setUserId(user.uid);
        setUserName(user.displayName || user.email || 'User');

        // Parallel API calls for better performance
        const [roleRes, buildingRes] = await Promise.all([
          fetch(`/api/users/role?uid=${user.uid}`),
          fetch(`/api/users/building-id?uid=${user.uid}`),
        ]);

        const [roleData, buildingData] = await Promise.all([roleRes.json(), buildingRes.json()]);

        if (!roleData.success) {
          setError('User profile not found. Please contact support.');
          setLoading(false);
          return;
        }

        // Extract role and buildingId from nested data objects
        const role = roleData.data?.role || roleData.data;
        const building = buildingData.data?.buildingId || buildingData.data || '';

        setUserRole(role);
        setBuildingId(building);

        // Build params for tickets query
        const params = new URLSearchParams({
          uid: user.uid,
          role: role,
        });
        if (building && building !== 'null' && building !== 'undefined') {
          params.append('buildingId', building);
        }

        // Fetch tickets and optional data in parallel
        const fetchPromises: Promise<Response>[] = [
          fetch(`/api/tickets/list?${params.toString()}`, { cache: 'no-store' }),
        ];

        // Add technicians fetch for admin/owner
        if (role === 'admin' || role === 'owner') {
          if (role === 'admin') {
            // Admin can fetch all technicians when no specific building is selected
            const technicianUrl = building
              ? `/api/technicians/list?buildingId=${building}`
              : '/api/technicians/list';
            fetchPromises.push(fetch(technicianUrl));
          } else if (building) {
            // Owners are always scoped to their own building
            fetchPromises.push(fetch(`/api/technicians/list?buildingId=${building}`));
          }
          if (role === 'admin') {
            fetchPromises.push(
              fetch('/api/buildings/list', {
                headers: { 'x-user-id': user.uid },
              })
            );
          }
        }

        const responses = await Promise.all(fetchPromises);
        const [ticketsData, ...optionalData] = await Promise.all(responses.map((r) => r.json()));

        if (ticketsData.success) {
          const normalized = normalizeTickets(ticketsData.data);
          setTickets(normalized);
        } else {
          setError(ticketsData.error || 'Failed to load tickets');
        }

        // Process optional data
        if (optionalData.length > 0 && optionalData[0]?.success) {
          setTechnicians(optionalData[0].data || []);
        }
        if (optionalData.length > 1 && optionalData[1]?.success) {
          setBuildings(optionalData[1].data || []);
        }
      } catch (err) {
        console.error('Error loading tickets:', err);
        setError('Failed to load tickets');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch all buildings for admin filter
  useEffect(() => {
    if (!userId || !userRole || userRole !== 'admin') {
      return;
    }

    const fetchBuildings = async () => {
      try {
        const response = await fetch('/api/buildings/list', {
          headers: {
            'x-user-id': userId,
          },
        });
        const data = await response.json();

        if (data.success && data.data) {
          setBuildings(data.data);
          console.log('[Tickets] Loaded', data.data.length, 'buildings for filter');
        }
      } catch (error) {
        console.error('[Tickets] Error fetching buildings:', error);
      }
    };

    fetchBuildings();
  }, [userId, userRole]);

  // Update buildingId when filter changes
  useEffect(() => {
    if (userRole !== 'admin') {
      return;
    }

    if (selectedBuildingFilter === 'all') {
      setBuildingId(null); // Show all tickets from all buildings
    } else {
      setBuildingId(selectedBuildingFilter); // Show tickets from selected building only
    }
  }, [selectedBuildingFilter, userRole]);

  // Reload technicians when building filter changes
  useEffect(() => {
    if (!userId || !userRole || (userRole !== 'admin' && userRole !== 'owner')) {
      return;
    }

    const loadTechnicians = async () => {
      try {
        // Use the selected building filter or current buildingId
        const targetBuildingId =
          selectedBuildingFilter !== 'all' ? selectedBuildingFilter : buildingId;

        // Admin can fetch all technicians in "all buildings" mode.
        // Owners must remain scoped to their assigned building.
        if (userRole === 'owner' && !targetBuildingId) {
          console.log('[Tickets] No building ID for owner technician fetch');
          setTechnicians([]);
          return;
        }

        const technicianUrl = targetBuildingId
          ? `/api/technicians/list?buildingId=${targetBuildingId}`
          : '/api/technicians/list';

        const techsRes = await fetch(technicianUrl);
        const techsData = await techsRes.json();

        if (techsData.success) {
          setTechnicians(techsData.data);
          console.log('[Tickets] Loaded', techsData.data.length, 'technicians for building');
        }
      } catch (error) {
        console.error('[Tickets] Error loading technicians:', error);
        setTechnicians([]);
      }
    };

    loadTechnicians();
  }, [userId, userRole, buildingId, selectedBuildingFilter]);

  // Memoized fetch function to avoid recreating on every render
  const fetchTicketsPolling = useCallback(async () => {
    if (!userId || !userRole) return;

    try {
      const params = new URLSearchParams({
        uid: userId,
        role: userRole,
      });
      if (buildingId && buildingId !== 'null' && buildingId !== 'undefined') {
        params.append('buildingId', buildingId);
      }

      const ticketsRes = await fetch(`/api/tickets/list?${params.toString()}`, {
        cache: 'no-store',
      });
      const ticketsData = await ticketsRes.json();

      if (ticketsData.success) {
        setTickets(normalizeTickets(ticketsData.data));
      }
    } catch (err) {
      console.error('[Tickets Real-time] Error fetching tickets:', err);
    }
  }, [userId, userRole, buildingId]);

  // Real-time polling - reduced to 30 seconds for better performance
  useEffect(() => {
    if (!userId || !userRole) return;

    const interval = setInterval(fetchTicketsPolling, 30000);
    return () => clearInterval(interval);
  }, [userId, userRole, fetchTicketsPolling]);

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    if (!userId || !userName) return;

    try {
      const response = await fetch('/api/tickets/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
          userId,
          userName,
          role: userRole,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to update status');
        return;
      }

      // Reload tickets using the shared function
      await fetchTicketsPolling();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update ticket status');
    }
  };

  const handleCompletionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setCompletionWorkFile(null);
      setCompletionWorkPreview(null);
      setCompletionWorkImageUrl(null);
      setCompletionWorkPublicId(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Completion image must be under 5MB');
      return;
    }

    setCompletionWorkFile(file);
    setCompletionWorkImageUrl(null);
    setCompletionWorkPublicId(null);
    setCompletionWorkPreview(URL.createObjectURL(file));
  };

  const uploadCompletionImageIfNeeded = async () => {
    if (completionWorkImageUrl) {
      return {
        secureUrl: completionWorkImageUrl,
        publicId: completionWorkPublicId,
      };
    }

    if (!completionWorkFile) {
      return null;
    }

    setUploadingCompletionImage(true);
    try {
      const formData = new FormData();
      formData.append('file', completionWorkFile);

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadData.success || !uploadData.data?.secure_url) {
        throw new Error(uploadData.error || 'Failed to upload completion image');
      }

      const secureUrl = String(uploadData.data.secure_url);
      const publicId = uploadData.data.public_id ? String(uploadData.data.public_id) : null;

      setCompletionWorkImageUrl(secureUrl);
      setCompletionWorkPublicId(publicId);

      return { secureUrl, publicId };
    } finally {
      setUploadingCompletionImage(false);
    }
  };

  const handleFinishTicket = async () => {
    if (!selectedTicket || !userId || !userName || !userRole) return;

    setError('');
    setFinishingTicket(true);
    try {
      const uploaded = await uploadCompletionImageIfNeeded();

      const completionImageUrls = uploaded?.secureUrl
        ? [uploaded.secureUrl]
        : selectedTicket.completionImageUrls || [];
      const completionImagePublicIds = uploaded?.publicId ? [uploaded.publicId] : [];

      const response = await fetch('/api/tickets/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: 'completed',
          userId,
          userName,
          role: userRole,
          note: 'Ticket marked complete with work proof image',
          completionImageUrls,
          completionImagePublicIds,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        setError(data.error || 'Failed to finish ticket');
        return;
      }

      await fetchTicketsPolling();
      closeDetailsModal();
    } catch (err) {
      console.error('Error finishing ticket:', err);
      setError('Failed to finish ticket');
    } finally {
      setFinishingTicket(false);
    }
  };

  const handleAssignTicket = async (technicianUid: string, technicianName: string) => {
    if (!selectedTicket || !userId || !userName) return;

    try {
      const response = await fetch('/api/tickets/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          technicianId: technicianUid,
          technicianName: technicianName,
          assignedBy: userId,
          assignedByName: userName,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to assign ticket');
      }

      setShowAssignModal(false);
      setSelectedTicket(null);

      // Reload tickets using the shared function
      await fetchTicketsPolling();
    } catch (err) {
      console.error('Error assigning ticket:', err);
      setError('Failed to assign ticket');
    }
  };

  // Handle ticket deletion
  const handleDeleteTicket = async () => {
    if (!ticketToDelete || !userId || !userRole) return;

    try {
      setDeleteLoading(true);
      setError('');

      const response = await fetch(
        `/api/tickets/${ticketToDelete.id}?uid=${userId}&role=${userRole}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to delete ticket');
        return;
      }

      // Remove ticket from local state immediately
      setTickets((prev) => prev.filter((t) => t.id !== ticketToDelete.id));
      setShowDeleteModal(false);
      setTicketToDelete(null);
    } catch (err) {
      console.error('Error deleting ticket:', err);
      setError('Failed to delete ticket');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Check if user can delete a specific ticket
  const canDeleteTicket = (ticket: NormalizedTicket): boolean => {
    if (!userRole || !userId) return false;

    // Admin can delete any ticket
    if (userRole === 'admin') return true;

    // Technician cannot delete tickets
    if (userRole === 'technician') return false;

    // Resident can only delete their own open tickets
    if (userRole === 'resident') {
      return ticket.createdBy === userId && ticket.status === 'open';
    }

    return false;
  };

  // Load comments for a ticket
  const loadComments = async (ticketId: string) => {
    if (!userId || !userRole) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments?uid=${userId}&role=${userRole}`);
      const data = await res.json();
      if (data.success) {
        setTicketComments(data.data);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  // Add a comment to a ticket
  const handleAddComment = async () => {
    if (!selectedTicket || !userId || !userName || !userRole || !newComment.trim()) return;

    try {
      setCommentLoading(true);
      const res = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          userRole,
          content: newComment.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketComments((prev) => [...prev, data.data]);
        setNewComment('');
      } else {
        setError(data.error || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    if (!selectedTicket || !userId || !userRole) return;

    try {
      const res = await fetch(
        `/api/tickets/${selectedTicket.id}/comments?uid=${userId}&role=${userRole}&commentId=${commentId}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        setTicketComments((prev) => prev.filter((c) => c.id !== commentId));
      } else {
        setError(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment');
    }
  };

  // Reload tickets after creating a new one
  const handleTicketCreated = async () => {
    setShowCreateModal(false);
    await fetchTicketsPolling();
  };

  // Get valid status options based on current status and user role
  const getValidStatusOptions = (currentStatus: TicketStatus): TicketStatus[] => {
    if (!userRole) return [currentStatus];

    // Define valid transitions
    const transitions: Record<TicketStatus, TicketStatus[]> = {
      open: ['assigned'],
      assigned: ['accepted', 'open'],
      accepted: ['in_progress', 'assigned'],
      in_progress: ['completed', 'accepted'],
      completed: ['open'],
    };

    const validNext = transitions[currentStatus] || [];

    // Filter based on role
    let allowedForRole: TicketStatus[] = [];

    if (userRole === 'admin') {
      allowedForRole = validNext;
    } else if (userRole === 'technician') {
      const techAllowed: TicketStatus[] = ['accepted', 'in_progress', 'completed', 'assigned'];
      allowedForRole = validNext.filter((s) => techAllowed.includes(s));
    } else if (userRole === 'resident') {
      // Residents can only reopen completed tickets
      if (currentStatus === 'completed') {
        allowedForRole = ['open'];
      }
    }

    // Always include current status
    return [currentStatus, ...allowedForRole];
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
      case 'assigned':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'accepted':
        return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400';
      case 'high':
        return 'text-orange-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-emerald-400';
      default:
        return 'text-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-lg" style={{ color: 'var(--card-contrast-text)' }}>
            Loading tickets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      <div className="relative overflow-hidden pt-8 pb-8 px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/20 via-transparent to-purple-50/20 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
          <div
            className="absolute inset-0 opacity-10 dark:opacity-5"
            style={{
              backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px),
                             linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900 dark:text-white">
                {(userRole === 'admin' || userRole === 'owner') && 'All Tickets'}
                {userRole === 'technician' && 'My Assigned Tickets'}
                {userRole === 'resident' && 'My Tickets'}
                {!userRole && 'Tickets'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {(userRole === 'admin' || userRole === 'owner') &&
                  'View and manage all tickets for your building'}
                {userRole === 'technician' && 'Tickets assigned to you'}
                {userRole === 'resident' && 'Track your maintenance requests'}
                {!userRole && 'Manage your maintenance tickets'}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Building Filter for Admins */}
              {userRole === 'admin' && buildings.length > 0 && (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <select
                    value={selectedBuildingFilter}
                    onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                    className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
                  >
                    <option value="all">All Buildings ({buildings.length})</option>
                    {buildings.map((building) => (
                      <option key={building.id} value={building.id}>
                        {building.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {userRole !== 'technician' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Ticket
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </button>
            </div>
          </div>

          {/* Active Filter Indicator for Admins */}
          {userRole === 'admin' && buildings.length > 0 && selectedBuildingFilter !== 'all' && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Filtered:{' '}
                {buildings.find((b) => b.id === selectedBuildingFilter)?.name ||
                  'Selected Building'}
              </span>
              <button
                onClick={() => setSelectedBuildingFilter('all')}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                title="Clear filter"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200"
            >
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Tickets Table */}
          {tickets.length === 0 ? (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-12 text-center rounded-2xl overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow:
                  '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
            >
              {/* Animated gradient border effect */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 184, 166, 0.1) 50%, rgba(59, 130, 246, 0.15) 100%)',
                  opacity: 0.5,
                }}
              />

              {/* Decorative glow orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl" />

              {/* Icon with gradient background */}
              <div className="relative mx-auto mb-6 w-20 h-20 rounded-2xl bg-linear-to-br from-slate-700/50 to-slate-800/50 flex items-center justify-center border border-slate-600/30">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <h3 className="relative text-xl font-semibold mb-3 text-white">No tickets found</h3>
              <p className="relative text-slate-400 mb-6 max-w-md mx-auto">
                {(userRole === 'admin' || userRole === 'owner') &&
                  'No tickets have been created for your building yet.'}
                {userRole === 'technician' && 'No tickets have been assigned to you yet.'}
                {userRole === 'resident' && "You haven't created any tickets yet."}
                {!userRole && 'Create a new ticket to get started.'}
              </p>
              {userRole !== 'technician' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="relative inline-flex items-center gap-2 px-6 py-3.5 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.02] transition-all duration-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Create Your First Ticket
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              }}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Ticket ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Status
                      </th>
                      {(userRole === 'admin' || userRole === 'owner') && (
                        <>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                            Created By
                          </th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                            Assigned To
                          </th>
                        </>
                      )}
                      {userRole === 'technician' && (
                        <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                          Resident
                        </th>
                      )}
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {tickets.map((ticket, index) => (
                      <tr
                        key={`${ticket.id}-${ticket.createdAt?.toISOString() || 'no-date'}-${index}`}
                        className="transition-colors hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-slate-400">
                            {ticket.displayId}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-white">{ticket.title}</p>
                            <p className="text-sm mt-1 text-slate-400">
                              {ticket.description.slice(0, 60)}...
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priorityLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}
                          >
                            {ticket.statusLabel}
                          </span>
                        </td>
                        {(userRole === 'admin' || userRole === 'owner') && (
                          <>
                            <td className="px-6 py-4">
                              <span className="text-slate-200">{ticket.createdByName}</span>
                            </td>
                            <td className="px-6 py-4">
                              {ticket.assignedToName !== 'Unassigned' ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-200">{ticket.assignedToName}</span>
                                  <button
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setShowAssignModal(true);
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                                    title="Reassign ticket"
                                  >
                                    ↻
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setShowAssignModal(true);
                                  }}
                                  className="text-emerald-400 hover:text-emerald-300 text-sm font-medium transition-colors"
                                >
                                  + Assign
                                </button>
                              )}
                            </td>
                          </>
                        )}
                        {userRole === 'technician' && (
                          <td className="px-6 py-4">
                            <span className="text-slate-200">{ticket.createdByName}</span>
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <span className="text-slate-400">{ticket.location}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <select
                              value={ticket.status}
                              onChange={(e) =>
                                handleStatusChange(ticket.id, e.target.value as TicketStatus)
                              }
                              className="px-3 py-1.5 rounded-lg text-sm bg-slate-700/50 border border-slate-600/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                              disabled={getValidStatusOptions(ticket.status).length <= 1}
                            >
                              {getValidStatusOptions(ticket.status).map((status) => (
                                <option key={status} value={status} className="bg-slate-800">
                                  {status === 'open'
                                    ? 'Open'
                                    : status === 'assigned'
                                      ? 'Assigned'
                                      : status === 'accepted'
                                        ? 'Accepted'
                                        : status === 'in_progress'
                                          ? 'In Progress'
                                          : status === 'completed'
                                            ? 'Completed'
                                            : status}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowDetailsModal(true);
                                loadComments(ticket.id);
                              }}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-700/50 border border-slate-600/50 text-slate-200 hover:bg-slate-600/50 transition-all"
                            >
                              View
                            </button>

                            {/* Delete button - only shown if user can delete */}
                            {canDeleteTicket(ticket) && (
                              <button
                                onClick={() => {
                                  setTicketToDelete(ticket);
                                  setShowDeleteModal(true);
                                }}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-900/30 border border-red-700/50 text-red-400 hover:bg-red-800/40 hover:text-red-300 transition-all"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Assign Ticket Modal */}
          {showAssignModal && selectedTicket && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={
                  shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
                }
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg w-full p-6 rounded-xl"
                style={{ background: 'var(--card)' }}
              >
                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: 'var(--card-contrast-text)' }}
                >
                  Assign Ticket to Technician
                </h3>
                <p className="mb-1 text-sm" style={{ color: 'var(--muted)' }}>
                  Ticket: <span className="font-medium">{selectedTicket.title}</span>
                </p>
                {selectedTicket.assignedToName &&
                  selectedTicket.assignedToName !== 'Unassigned' && (
                    <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        Currently assigned to:{' '}
                        <span className="font-semibold">{selectedTicket.assignedToName}</span>
                      </p>
                    </div>
                  )}
                <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
                  {technicians.length === 0 ? (
                    <div className="text-center py-8">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <p className="text-gray-600 dark:text-gray-400">No technicians available</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Add technicians to this building first
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Available Technicians ({technicians.length})
                      </p>
                      {technicians.map((tech) => {
                        // Check if this tech is currently assigned to this ticket
                        const isAssignedToThisTicket = selectedTicket.assignedTo === tech.uid;
                        // Count how many tickets this tech has assigned (from all tickets)
                        const assignedTicketsCount = tickets.filter(
                          (t) => t.assignedTo === tech.uid
                        ).length;

                        return (
                          <button
                            key={tech.uid}
                            onClick={() => handleAssignTicket(tech.uid, tech.name)}
                            className={`w-full px-4 py-3 rounded-lg border text-left transition-all hover:shadow-md ${
                              isAssignedToThisTicket
                                ? 'border-blue-500 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            style={{
                              background: isAssignedToThisTicket ? undefined : 'var(--card)',
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p
                                    className="font-medium"
                                    style={{ color: 'var(--card-contrast-text)' }}
                                  >
                                    {tech.name}
                                  </p>
                                  {isAssignedToThisTicket && (
                                    <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full font-semibold">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                  {tech.email}
                                </p>
                                {tech.phoneNumber && (
                                  <p className="text-xs mt-1 inline-flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.9 1.368l.736 2.207a2 2 0 01-.45 2.047l-1.29 1.291a16.001 16.001 0 006.588 6.588l1.29-1.29a2 2 0 012.048-.45l2.207.735A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {tech.phoneNumber}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {assignedTicketsCount > 0 && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-md font-medium">
                                    {assignedTicketsCount} ticket
                                    {assignedTicketsCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {tech.isActive !== false ? (
                                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                    Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-gray-500">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                    Inactive
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTicket(null);
                  }}
                  className="w-full px-4 py-2 rounded-lg border font-medium transition-all hover:opacity-80"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'rgba(15,23,42,0.1)',
                    color: 'var(--card-contrast-text)',
                  }}
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}

          {/* Ticket Details Modal */}
          {showDetailsModal && selectedTicket && (
            <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-md supports-backdrop-filter:bg-slate-900/45 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={
                  shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
                }
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-3xl w-full p-6 rounded-2xl my-8 border shadow-2xl text-slate-100"
                style={{
                  background: 'rgba(2,6,23,0.96)',
                  borderColor: 'rgba(71,85,105,0.7)',
                  backdropFilter: 'blur(14px)',
                  ['--card' as string]: '#0b1220',
                  ['--card-contrast-text' as string]: '#e2e8f0',
                  ['--muted' as string]: '#94a3b8',
                }}
              >
                <div className="flex justify-between items-start mb-6">
                  <button
                    onClick={closeDetailsModal}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors bg-slate-900/60 hover:bg-slate-800/80"
                    style={{
                      color: '#e2e8f0',
                      borderColor: 'rgba(71,85,105,0.9)',
                    }}
                  >
                    <span aria-hidden="true">←</span>
                    Go Back
                  </button>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold" style={{ color: 'var(--card-contrast-text)' }}>
                      Ticket Details
                    </h3>
                    <button
                      onClick={closeDetailsModal}
                      className="text-2xl hover:opacity-70 transition-opacity text-slate-300"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Ticket Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                      Ticket ID
                    </p>
                    <p className="font-mono" style={{ color: 'var(--card-contrast-text)' }}>
                      #{selectedTicket.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                      Title
                    </p>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: 'var(--card-contrast-text)' }}
                    >
                      {selectedTicket.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                      Description
                    </p>
                    <p style={{ color: 'var(--card-contrast-text)' }}>
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Category
                      </p>
                      <p className="capitalize" style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Priority
                      </p>
                      <span
                        className={`font-medium capitalize ${getPriorityColor(selectedTicket.priority)}`}
                      >
                        {selectedTicket.priority}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Status
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(selectedTicket.status)}`}
                      >
                        {selectedTicket.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Location
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.location}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Building
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.buildingName || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Created By
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.createdByName}
                      </p>
                    </div>

                    {selectedTicket.assignedToName && (
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                          Assigned To
                        </p>
                        <p style={{ color: 'var(--card-contrast-text)' }}>
                          {selectedTicket.assignedToName}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedTicket.contactPhone && (
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Contact Phone
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.contactPhone}
                      </p>
                    </div>
                  )}

                  {selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                        Issue Images
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedTicket.imageUrls.map((url, index) => (
                          <div key={index} className="relative w-full h-32">
                            <Image
                              src={url}
                              alt={`Ticket image ${index + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Created At
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.createdAt
                          ? new Date(selectedTicket.createdAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Last Updated
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.updatedAt
                          ? new Date(selectedTicket.updatedAt).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: 'var(--muted)' }}>
                        Completed At
                      </p>
                      <p style={{ color: 'var(--card-contrast-text)' }}>
                        {selectedTicket.completedAt
                          ? new Date(selectedTicket.completedAt).toLocaleString()
                          : 'Not completed'}
                      </p>
                    </div>
                  </div>

                  {selectedTicket.completionImageUrls && selectedTicket.completionImageUrls.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted)' }}>
                        Completed Work Images
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedTicket.completionImageUrls.map((url, index) => (
                          <div key={index} className="relative w-full h-32">
                            <Image
                              src={url}
                              alt={`Completed work ${index + 1}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTicket.status !== 'completed' &&
                    (userRole === 'technician' || userRole === 'admin') && (
                    <div className="p-4 rounded-lg border bg-slate-900/70" style={{ borderColor: 'rgba(71,85,105,0.75)' }}>
                      <p className="text-sm font-medium mb-2" style={{ color: 'var(--card-contrast-text)' }}>
                        Completion Proof
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCompletionFileChange}
                        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-500"
                      />
                      <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                        Upload an image of the completed repair before finishing this ticket.
                      </p>

                      {completionWorkPreview && (
                        <div className="relative w-full h-48 mt-3 rounded overflow-hidden border" style={{ borderColor: 'rgba(15,23,42,0.15)' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={completionWorkPreview} alt="Completion preview" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <button
                        onClick={handleFinishTicket}
                        disabled={finishingTicket || uploadingCompletionImage}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-md"
                      >
                        {finishingTicket || uploadingCompletionImage ? 'Finishing...' : 'Finish Ticket'}
                      </button>
                    </div>
                  )}

                  {/* AI Detection Results */}
                  {selectedTicket.aiDetection && (
                    <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-5 h-5 text-blue-600 dark:text-blue-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                          AI Image Analysis
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-medium">
                          MobileNetV2
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Detected Object
                          </p>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 capitalize">
                            {selectedTicket.aiDetection.detectedLabel}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Confidence
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-blue-500 to-indigo-500 rounded-full"
                                style={{ width: `${selectedTicket.aiDetection.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              {(selectedTicket.aiDetection.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Mapped Category
                          </p>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 capitalize">
                            {selectedTicket.aiDetection.mappedCategory}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Model
                          </p>
                          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                            {selectedTicket.aiDetection.modelVersion}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div className="border-t pt-6 mt-6" style={{ borderColor: 'rgba(15,23,42,0.1)' }}>
                  <details>
                    <summary
                      className="cursor-pointer text-sm font-semibold"
                      style={{ color: 'var(--card-contrast-text)' }}
                    >
                      Activity Log ({selectedTicket.timeline?.length || 0})
                    </summary>
                    <div className="mt-4">
                      <TicketTimeline timeline={selectedTicket.timeline || []} />
                    </div>
                  </details>
                </div>

                {/* Comments Section */}
                <div className="border-t pt-6 mt-6" style={{ borderColor: 'rgba(15,23,42,0.1)' }}>
                  <h4
                    className="text-lg font-semibold mb-4"
                    style={{ color: 'var(--card-contrast-text)' }}
                  >
                    Comments ({ticketComments.length})
                  </h4>

                  {/* Add Comment Form */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 px-4 py-2 rounded-lg border text-sm"
                        style={{
                          background: 'var(--card)',
                          borderColor: 'rgba(15,23,42,0.2)',
                          color: 'var(--card-contrast-text)',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddComment();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={commentLoading || !newComment.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {commentLoading ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {ticketComments.length === 0 ? (
                      <p className="text-sm text-center py-4" style={{ color: 'var(--muted)' }}>
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      ticketComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="p-3 rounded-lg border"
                          style={{
                            background: 'rgba(15,23,42,0.02)',
                            borderColor: 'rgba(15,23,42,0.1)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-medium text-sm"
                                style={{ color: 'var(--card-contrast-text)' }}
                              >
                                {comment.userName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                  comment.userRole === 'admin'
                                    ? 'bg-purple-100 text-purple-800'
                                    : comment.userRole === 'technician'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {comment.userRole}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                                {new Date(comment.createdAt).toLocaleDateString()}{' '}
                                {new Date(comment.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {(comment.userId === userId || userRole === 'admin') && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-red-500 hover:text-red-700 text-xs"
                                  title="Delete comment"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm" style={{ color: 'var(--card-contrast-text)' }}>
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={closeDetailsModal}
                  className="w-full px-4 py-2 rounded-lg border font-medium transition-all hover:bg-slate-800 mt-6"
                  style={{
                    background: '#0f172a',
                    borderColor: 'rgba(71,85,105,0.8)',
                    color: '#e2e8f0',
                  }}
                >
                  Go Back
                </button>
              </motion.div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && ticketToDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <motion.div
                initial={
                  shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
                }
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full p-6 rounded-xl"
                style={{ background: 'var(--card)' }}
              >
                <h3 className="text-xl font-bold mb-4 text-red-600">Delete Ticket</h3>
                <p className="mb-2" style={{ color: 'var(--card-contrast-text)' }}>
                  Are you sure you want to delete this ticket?
                </p>
                <p className="mb-4 font-medium" style={{ color: 'var(--card-contrast-text)' }}>
                  &quot;{ticketToDelete.title}&quot;
                </p>
                <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
                  This action cannot be undone.
                </p>

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setTicketToDelete(null);
                      setError('');
                    }}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 rounded-lg border font-medium transition-all hover:opacity-80"
                    style={{
                      background: 'var(--card)',
                      borderColor: 'rgba(15,23,42,0.1)',
                      color: 'var(--card-contrast-text)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteTicket}
                    disabled={deleteLoading}
                    className="flex-1 px-4 py-2 rounded-lg font-medium transition-all bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
          {/* Create Ticket Modal */}
          <CreateTicketForm
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleTicketCreated}
          />
        </div>
      </div>
    </div>
  );
}
