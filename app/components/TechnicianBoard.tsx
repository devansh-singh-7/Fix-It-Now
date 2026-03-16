'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Ticket,
  TicketStatus,
  TicketPriority,
  UserRole,
  TicketComment,
  UserProfile,
  Building,
} from '@/app/lib/types';

interface TechnicianBoardProps {
  userId: string;
  userName: string;
  userRole: UserRole | null;
  buildingId?: string | null;
}

type FilterTab = 'assigned' | 'in_progress' | 'completed';
type AdminTab = 'overview' | 'manage';
type BoardIconKey = 'clipboard' | 'wrench' | 'check' | 'clock' | 'phone' | 'star' | 'list' | 'ticket';

interface TechnicianDetails extends UserProfile {
  assignedTickets?: number;
  completedTickets?: number;
  rating?: number;
  specialties?: string[];
}

interface UserSearchResult {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export default function TechnicianBoard({
  userId,
  userName,
  userRole,
  buildingId = null,
}: TechnicianBoardProps) {
  // Technician view states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('assigned');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Admin view states
  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const [technicians, setTechnicians] = useState<TechnicianDetails[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [newTechEmail, setNewTechEmail] = useState('');
  const [addingTech, setAddingTech] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Modal states
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [completionWorkFile, setCompletionWorkFile] = useState<File | null>(null);
  const [completionWorkPreview, setCompletionWorkPreview] = useState<string | null>(null);
  const [completionWorkImageUrl, setCompletionWorkImageUrl] = useState<string | null>(null);
  const [completionWorkPublicId, setCompletionWorkPublicId] = useState<string | null>(null);
  const [uploadingCompletionImage, setUploadingCompletionImage] = useState(false);
  const [finishingTicket, setFinishingTicket] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>(
    {
      show: false,
      message: '',
      type: 'success',
    }
  );

  // Stats
  const stats = {
    assigned: tickets.filter((t) => t.status === 'assigned').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress' || t.status === 'accepted')
      .length,
    completed: tickets.filter((t) => t.status === 'completed').length,
    avgResolutionTime: calculateAvgResolutionTime(tickets),
  };

  // Helper function to calculate average resolution time
  function calculateAvgResolutionTime(tickets: Ticket[]): string {
    const completedTickets = tickets.filter(
      (t) => t.status === 'completed' && t.completedAt && t.createdAt
    );
    if (completedTickets.length === 0) return 'N/A';

    const totalHours = completedTickets.reduce((sum, ticket) => {
      const completed = new Date(ticket.completedAt!).getTime();
      const created = new Date(ticket.createdAt).getTime();
      return sum + (completed - created) / (1000 * 60 * 60);
    }, 0);

    const avgHours = totalHours / completedTickets.length;
    if (avgHours < 24) return `${avgHours.toFixed(1)}h`;
    return `${(avgHours / 24).toFixed(1)}d`;
  }

  // Fetch assigned tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        uid: userId,
        role: userRole,
      });

      if (buildingId && buildingId !== 'null' && buildingId !== 'undefined') {
        params.append('buildingId', buildingId);
      }

      const response = await fetch(`/api/tickets/list?${params.toString()}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (data.success) {
        setTickets(data.data || []);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }, [userId, userRole, buildingId]);

  // Fetch technicians list (admin only)
  const fetchTechnicians = useCallback(async () => {
    try {
      const response = await fetch('/api/technicians/list');
      const data = await response.json();

      if (data.success) {
        setTechnicians(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching technicians:', err);
    }
  }, []);

  // Fetch buildings (admin only)
  const fetchBuildings = useCallback(async () => {
    try {
      const response = await fetch('/api/buildings/list', {
        headers: {
          'x-user-id': userId,
        },
      });
      const data = await response.json();

      if (data.success) {
        setBuildings(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching buildings:', err);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && userRole) {
      if (userRole === 'admin') {
        fetchTechnicians();
        fetchBuildings();
      }
      fetchTickets();
    }
  }, [userId, userRole, fetchTickets, fetchTechnicians, fetchBuildings]);

  // Fetch comments when a ticket is selected
  const fetchComments = useCallback(
    async (ticketId: string) => {
      try {
        const response = await fetch(
          `/api/tickets/${ticketId}/comments?uid=${userId}&role=${userRole}`
        );
        const data = await response.json();

        if (data.success) {
          setComments(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching comments:', err);
      }
    },
    [userId, userRole]
  );

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter((ticket) => {
    switch (activeTab) {
      case 'assigned':
        return ticket.status === 'assigned';
      case 'in_progress':
        return ticket.status === 'in_progress' || ticket.status === 'accepted';
      case 'completed':
        return ticket.status === 'completed';
      default:
        return true;
    }
  });

  // Handle ticket selection
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowModal(true);
    setNewComment('');
    setCompletionWorkFile(null);
    setCompletionWorkPreview(null);
    setCompletionWorkImageUrl(null);
    setCompletionWorkPublicId(null);
    fetchComments(ticket.id);
  };

  const closeTicketModal = () => {
    setShowModal(false);
    setSelectedTicket(null);
    setNewComment('');
    setComments([]);
    setCompletionWorkFile(null);
    setCompletionWorkPreview(null);
    setCompletionWorkImageUrl(null);
    setCompletionWorkPublicId(null);
  };

  // Handle status update
  const handleStatusUpdate = async (newStatus: TicketStatus) => {
    if (!selectedTicket || !userId || !userName || !userRole) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch('/api/tickets/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          status: newStatus,
          userId,
          userName,
          role: userRole,
          note: `Status updated by technician`,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic UI update
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: newStatus } : t))
        );
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));

        showToast('Status updated successfully!', 'success');
        fetchTickets(); // Refresh to get server state
      } else {
        showToast(data.error || 'Failed to update status', 'error');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle add comment
  const handleAddComment = async () => {
    if (!selectedTicket || !newComment.trim() || !userId || !userName || !userRole) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userName,
          userRole,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComments((prev) => [...prev, data.data]);
        setNewComment('');
        showToast('Comment added successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to add comment', 'error');
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmittingComment(false);
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
      showToast('Please select a valid image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Completion image must be under 5MB', 'error');
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

    setFinishingTicket(true);
    try {
      const existingProof = selectedTicket.completionImageUrls || [];

      const uploaded = await uploadCompletionImageIfNeeded();
      const completionImageUrls = uploaded?.secureUrl ? [uploaded.secureUrl] : existingProof;
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
          note: 'Ticket finished with completed-work proof image',
          completionImageUrls,
          completionImagePublicIds,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        showToast(data.error || 'Failed to finish ticket', 'error');
        return;
      }

      await fetchTickets();
      closeTicketModal();
      showToast('Ticket marked completed successfully', 'success');
    } catch (err) {
      console.error('Error finishing ticket:', err);
      showToast('Failed to finish ticket', 'error');
    } finally {
      setFinishingTicket(false);
    }
  };

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const closeAddTechnicianModal = () => {
    setShowAddTechModal(false);
    setNewTechEmail('');
    setSelectedUser(null);
    setSearchResults([]);
    setSearchingUsers(false);
  };

  useEffect(() => {
    if (!showAddTechModal || !userId) return;

    const query = newTechEmail.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearchingUsers(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setSearchingUsers(true);
        const params = new URLSearchParams({
          query,
          adminUid: userId,
          limit: '8',
        });

        const response = await fetch(`/api/users/search?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching users by email:', err);
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [newTechEmail, showAddTechModal, userId]);

  // Handle add technician (promote user to technician role)
  const handleAddTechnician = async () => {
    if (!selectedUser || selectedUser.role === 'technician') return;

    setAddingTech(true);
    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedUser.email,
          newRole: 'technician',
          adminUid: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Successfully promoted ${data.data.email} to technician`, 'success');
        closeAddTechnicianModal();
        fetchTechnicians(); // Refresh list
      } else {
        showToast(data.error || 'Failed to add technician', 'error');
      }
    } catch (err) {
      console.error('Error adding technician:', err);
      showToast('Failed to add technician', 'error');
    } finally {
      setAddingTech(false);
    }
  };

  // Handle assign building to technician
  const handleAssignBuilding = async (techUid: string, buildingId: string) => {
    try {
      const response = await fetch('/api/technicians/assign-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianUid: techUid,
          buildingId: buildingId === 'none' ? null : buildingId,
          adminUid: userId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast('Building assignment updated', 'success');
        fetchTechnicians(); // Refresh list
      } else {
        showToast(data.error || 'Failed to assign building', 'error');
      }
    } catch (err) {
      console.error('Error assigning building:', err);
      showToast('Failed to assign building', 'error');
    }
  };

  // Get priority color
  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-500/20';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-500/20';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 ring-1 ring-yellow-500/20';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 ring-1 ring-green-500/20';
    }
  };

  // Get status color
  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
      case 'accepted':
        return 'bg-blue-500';
      case 'assigned':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const renderBoardIcon = (icon: BoardIconKey, className = 'w-5 h-5') => {
    const commonProps = {
      className,
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
    } as const;

    switch (icon) {
      case 'clipboard':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'wrench':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927a1 1 0 011.902 0l.969 2.955a1 1 0 00.95.69h3.108a1 1 0 01.592 1.806l-2.515 1.828a1 1 0 00-.364 1.118l.96 2.955a1 1 0 01-1.538 1.118L12 13.974l-2.514 1.823a1 1 0 01-1.539-1.118l.96-2.955a1 1 0 00-.364-1.118L6.028 8.378A1 1 0 016.62 6.572h3.108a1 1 0 00.95-.69l.97-2.955z" />
          </svg>
        );
      case 'check':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'clock':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'phone':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h2.28a2 2 0 011.9 1.368l.736 2.207a2 2 0 01-.45 2.047l-1.29 1.291a16.001 16.001 0 006.588 6.588l1.29-1.29a2 2 0 012.048-.45l2.207.735A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'star':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927a1 1 0 011.902 0l2.118 6.518a1 1 0 00.95.69h6.854a1 1 0 01.592 1.806l-5.546 4.03a1 1 0 00-.364 1.118l2.118 6.518a1 1 0 01-1.538 1.118L12 20.194l-5.536 4.031a1 1 0 01-1.539-1.118l2.118-6.518a1 1 0 00-.364-1.118l-5.546-4.03a1 1 0 01.592-1.806h6.854a1 1 0 00.95-.69l2.118-6.518z" />
          </svg>
        );
      case 'list':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      case 'ticket':
        return (
          <svg {...commonProps}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7a2 2 0 012-2h12a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H6a2 2 0 01-2-2v-3a2 2 0 000-4V7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Technician view: Show assigned tickets
  const renderTechnicianView = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Assigned to Me',
            value: stats.assigned,
            icon: 'clipboard' as BoardIconKey,
            color: 'from-blue-500 to-blue-600',
          },
          {
            label: 'In Progress',
            value: stats.in_progress,
            icon: 'wrench' as BoardIconKey,
            color: 'from-amber-500 to-orange-500',
          },
          {
            label: 'Completed This Week',
            value: stats.completed,
            icon: 'check' as BoardIconKey,
            color: 'from-green-500 to-emerald-500',
          },
          {
            label: 'Avg Resolution Time',
            value: stats.avgResolutionTime,
            icon: 'clock' as BoardIconKey,
            color: 'from-purple-500 to-pink-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                {renderBoardIcon(stat.icon, 'w-6 h-6')}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs and Tickets */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800/50">
          {(['assigned', 'in_progress', 'completed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'assigned' && 'Assigned to Me'}
              {tab === 'in_progress' && 'In Progress'}
              {tab === 'completed' && 'Resolved'}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No tickets in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleTicketClick(ticket)}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          #{ticket.id.slice(-6).toUpperCase()}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}
                        ></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                      <span className="truncate">{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {ticket.category}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );

  // Admin view: Overview of all technicians
  const renderAdminOverview = () => (
    <div className="space-y-6">
      {/* Header with Add Technician button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Technician Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {technicians.length} technician{technicians.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={() => setShowAddTechModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Technician
        </button>
      </div>

      {/* Technicians Grid - Scrollable */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {technicians.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No technicians registered yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Add technicians by promoting existing users
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {technicians.map((tech, index) => (
                <motion.li
                  key={tech.uid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="px-6 py-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {tech.name?.charAt(0).toUpperCase() || 'T'}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {tech.name || 'Unknown'}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{tech.email}</p>
                          {tech.phoneNumber && (
                            <div className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500">
                              {renderBoardIcon('phone', 'w-4 h-4')}
                              <span>{tech.phoneNumber}</span>
                            </div>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              (tech.assignedTickets || 0) > 0
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            }`}
                          >
                            {(tech.assignedTickets || 0) > 0 ? 'Working' : 'Available'}
                          </span>
                        </div>
                      </div>

                      <dl className="grid grid-cols-3 gap-4 mb-4 text-sm">
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned</dt>
                          <dd className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {tech.assignedTickets || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed</dt>
                          <dd className="text-xl font-bold text-green-600 dark:text-green-400">
                            {tech.completedTickets || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rating</dt>
                          <dd className="inline-flex items-center gap-1 text-xl font-bold text-yellow-600 dark:text-yellow-400">
                            <span>{tech.rating ? tech.rating.toFixed(1) : 'N/A'}</span>
                            {renderBoardIcon('star', 'w-4 h-4')}
                          </dd>
                        </div>
                      </dl>

                      {/* Building Assignment */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Building:
                        </span>
                        <select
                          value={tech.buildingId || 'none'}
                          onChange={(e) =>
                            handleAssignBuilding(tech.uid || tech.firebaseUid || '', e.target.value)
                          }
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="none">No Building Assigned</option>
                          {buildings.map((building) => (
                            <option key={building.id} value={building.id}>
                              {building.name} - {building.address}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Current Building Info */}
                      {tech.buildingName && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                          <span>
                            Currently assigned to: <strong>{tech.buildingName}</strong>
                          </span>
                        </div>
                      )}

                      {/* Specialties */}
                      {tech.specialties && tech.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {tech.specialties.map((specialty, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs font-medium"
                            >
                              {specialty}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Admin View */}
      {userRole === 'admin' ? (
        <>
          {/* Admin Tabs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
            <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setAdminTab('overview')}
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all ${
                  adminTab === 'overview'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {renderBoardIcon('list', 'w-4 h-4')}
                  Manage Technicians
                </span>
              </button>
              <button
                onClick={() => setAdminTab('manage')}
                className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all ${
                  adminTab === 'manage'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {renderBoardIcon('ticket', 'w-4 h-4')}
                  View All Tickets
                </span>
              </button>
            </div>
          </div>

          {/* Content based on selected tab */}
          {adminTab === 'overview' ? renderAdminOverview() : renderTechnicianView()}
        </>
      ) : (
        /* Technician View */
        renderTechnicianView()
      )}

      {/* Add Technician Modal */}
      <AnimatePresence>
        {showAddTechModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeAddTechnicianModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Technician</h2>
                <button
                  onClick={closeAddTechnicianModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Registered User by Email
                  </label>
                  <input
                    type="email"
                    value={newTechEmail}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewTechEmail(value);

                      if (selectedUser && selectedUser.email.toLowerCase() !== value.toLowerCase()) {
                        setSelectedUser(null);
                      }
                    }}
                    placeholder="Type at least 2 characters..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchingUsers && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Searching users...</p>
                  )}

                  {!searchingUsers && newTechEmail.trim().length >= 2 && searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg max-h-56 overflow-y-auto bg-white dark:bg-gray-800">
                      {searchResults.map((candidate) => (
                        <button
                          key={candidate.uid}
                          type="button"
                          onClick={() => {
                            setSelectedUser(candidate);
                            setNewTechEmail(candidate.email);
                            setSearchResults([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{candidate.email}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {candidate.name} • {candidate.role}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searchingUsers && newTechEmail.trim().length >= 2 && searchResults.length === 0 && !selectedUser && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      No registered users found for this email search.
                    </p>
                  )}

                  {selectedUser && (
                    <div className="mt-3 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        Selected: {selectedUser.name}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {selectedUser.email} • Current role: {selectedUser.role}
                      </p>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Select one suggestion to promote that user to technician role.
                  </p>
                  {selectedUser?.role === 'technician' && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      This user is already a technician.
                    </p>
                  )}
                  {!selectedUser && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      Pick a user from suggestions before adding.
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                    How it works:
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1">
                    <li>• User must already be registered in the system</li>
                    <li>• They will be promoted to technician role</li>
                    <li>• You can assign them to buildings after promotion</li>
                    <li>• They will gain access to technician dashboard</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={closeAddTechnicianModal}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTechnician}
                    disabled={!selectedUser || selectedUser.role === 'technician' || addingTech}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {addingTech ? 'Adding...' : 'Add Technician'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Detail Modal (reused from original) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Assigned to Me',
            value: stats.assigned,
            icon: 'clipboard' as BoardIconKey,
            color: 'from-blue-500 to-blue-600',
          },
          {
            label: 'In Progress',
            value: stats.in_progress,
            icon: 'wrench' as BoardIconKey,
            color: 'from-amber-500 to-orange-500',
          },
          {
            label: 'Completed This Week',
            value: stats.completed,
            icon: 'check' as BoardIconKey,
            color: 'from-green-500 to-emerald-500',
          },
          {
            label: 'Avg Resolution Time',
            value: stats.avgResolutionTime,
            icon: 'clock' as BoardIconKey,
            color: 'from-purple-500 to-pink-500',
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}
              >
                {renderBoardIcon(stat.icon, 'w-6 h-6')}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800/50">
          {(['assigned', 'in_progress', 'completed'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-xl transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab === 'assigned' && 'Assigned to Me'}
              {tab === 'in_progress' && 'In Progress'}
              {tab === 'completed' && 'Resolved'}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">No tickets in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTickets.map((ticket) => (
                <motion.div
                  key={ticket.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleTicketClick(ticket)}
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                          #{ticket.id.slice(-6).toUpperCase()}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}
                        ></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
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
                      <span className="truncate">{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {ticket.category}
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                      View Details →
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/55 backdrop-blur-md supports-backdrop-filter:bg-slate-900/45 z-50 flex items-center justify-center p-4"
            onClick={closeTicketModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border text-slate-100"
              style={{
                background: 'rgba(2,6,23,0.96)',
                borderColor: 'rgba(71,85,105,0.7)',
                backdropFilter: 'blur(14px)',
              }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-linear-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <button
                      onClick={closeTicketModal}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium bg-slate-900/60 border-slate-600 hover:bg-slate-800/80 transition-colors mb-4 text-slate-100"
                    >
                      <span aria-hidden="true">←</span>
                      Go Back
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono opacity-90">
                        #{selectedTicket.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-white/20`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{selectedTicket.title}</h2>
                    <p className="text-sm opacity-90">
                      Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={closeTicketModal}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-2">
                    Description
                  </h3>
                  <p className="text-slate-300 whitespace-pre-wrap">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedTicket.location}
                    </p>
                  </div>
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {selectedTicket.category}
                    </p>
                  </div>
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reporter</p>
                    <p className="text-sm font-medium text-slate-100">
                      {selectedTicket.createdByName}
                    </p>
                  </div>
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assigned To</p>
                    <p className="text-sm font-medium text-slate-100">
                      {selectedTicket.assignedToName || 'Unassigned'}
                    </p>
                  </div>
                  {selectedTicket.contactPhone && (
                    <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact</p>
                      <p className="text-sm font-medium text-slate-100">
                        {selectedTicket.contactPhone}
                      </p>
                    </div>
                  )}
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                    <p className="text-sm font-medium text-slate-100">
                      {selectedTicket.updatedAt
                        ? new Date(selectedTicket.updatedAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Completed At</p>
                    <p className="text-sm font-medium text-slate-100">
                      {selectedTicket.completedAt
                        ? new Date(selectedTicket.completedAt).toLocaleString()
                        : 'Not completed'}
                    </p>
                  </div>
                </div>

                {/* Images */}
                {selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 mb-3">
                      Issue Images
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedTicket.imageUrls.map((url, index) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={index}
                          src={url}
                          alt={`Ticket image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {selectedTicket.completionImageUrls && selectedTicket.completionImageUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 mb-3">
                      Completed Work Images
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedTicket.completionImageUrls.map((url, index) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={`completed-${index}`}
                          src={url}
                          alt={`Completed work ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-3">
                    Update Status
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(['assigned', 'accepted', 'in_progress'] as TicketStatus[]).map(
                      (status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(status)}
                          disabled={updatingStatus || status === selectedTicket.status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            status === selectedTicket.status
                              ? 'bg-blue-600 text-white ring-2 ring-blue-500/50'
                              : 'bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {status.replace('_', ' ').toUpperCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {(userRole === 'technician' || userRole === 'admin') && selectedTicket.status !== 'completed' && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 mb-3">
                      Finish Ticket
                    </h3>
                    <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCompletionFileChange}
                        className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-emerald-500"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Upload a completed-work photo, then click Finish Ticket.
                      </p>

                      {completionWorkPreview && (
                        <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={completionWorkPreview}
                            alt="Completed work preview"
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      <button
                        onClick={handleFinishTicket}
                        disabled={finishingTicket || uploadingCompletionImage}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {finishingTicket || uploadingCompletionImage ? 'Finishing...' : 'Finish Ticket'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 mb-3">
                    Work Notes & Comments
                  </h3>

                  {/* Comments List */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No comments yet
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-slate-900/70 border border-slate-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-100">
                                  {comment.userName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-300 rounded border border-blue-500/40">
                              {comment.userRole}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <div className="flex gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a work note or comment..."
                      rows={3}
                      className="flex-1 px-4 py-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-100 resize-none"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || submittingComment}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {submittingComment ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button
                  onClick={closeTicketModal}
                  className="w-full mt-2 px-4 py-2 rounded-lg border font-medium transition-all hover:bg-slate-800"
                  style={{
                    background: '#0f172a',
                    borderColor: 'rgba(71,85,105,0.8)',
                    color: '#e2e8f0',
                  }}
                >
                  Go Back
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div
              className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
                toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <p className="font-medium">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
