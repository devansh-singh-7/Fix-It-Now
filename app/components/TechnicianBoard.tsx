"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Ticket, TicketStatus, TicketPriority, UserRole, TicketComment } from '@/app/lib/types';

interface TechnicianBoardProps {
  userId: string;
  userName: string;
  userRole: UserRole | null;
}

type FilterTab = 'assigned' | 'in_progress' | 'completed';

export default function TechnicianBoard({ userId, userName, userRole }: TechnicianBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('assigned');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Modal states
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [toast, setToast] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Stats
  const stats = {
    assigned: tickets.filter(t => t.status === 'assigned' || t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress' || t.status === 'accepted').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    avgResolutionTime: calculateAvgResolutionTime(tickets)
  };

  // Helper function to calculate average resolution time
  function calculateAvgResolutionTime(tickets: Ticket[]): string {
    const completedTickets = tickets.filter(t => t.status === 'completed' && t.completedAt && t.createdAt);
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

      const response = await fetch(`/api/tickets/list?uid=${userId}&role=${userRole}`);
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
  }, [userId, userRole]);

  useEffect(() => {
    if (userId && userRole) {
      fetchTickets();
    }
  }, [userId, userRole, fetchTickets]);

  // Fetch comments when a ticket is selected
  const fetchComments = useCallback(async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments?uid=${userId}&role=${userRole}`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [userId, userRole]);

  // Filter tickets based on active tab
  const filteredTickets = tickets.filter(ticket => {
    switch (activeTab) {
      case 'assigned':
        return ticket.status === 'assigned' || ticket.status === 'open';
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
    fetchComments(ticket.id);
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
          note: `Status updated by technician`
        })
      });

      const data = await response.json();

      if (data.success) {
        // Optimistic UI update
        setTickets(prev => prev.map(t => 
          t.id === selectedTicket.id 
            ? { ...t, status: newStatus } 
            : t
        ));
        setSelectedTicket(prev => prev ? { ...prev, status: newStatus } : null);
        
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
          content: newComment.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setComments(prev => [...prev, data.data]);
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

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Assigned to Me', value: stats.assigned, icon: '📋', color: 'from-blue-500 to-blue-600' },
          { label: 'In Progress', value: stats.in_progress, icon: '🔧', color: 'from-amber-500 to-orange-500' },
          { label: 'Completed This Week', value: stats.completed, icon: '✅', color: 'from-green-500 to-emerald-500' },
          { label: 'Avg Resolution Time', value: stats.avgResolutionTime, icon: '⏱️', color: 'from-purple-500 to-pink-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-lg`}>
                {stat.icon}
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
          {(['assigned', 'in_progress', 'completed'] as FilterTab[]).map(tab => (
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
              <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{ticket.id.slice(-6).toUpperCase()}</span>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}></div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {ticket.title}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="truncate">{ticket.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{ticket.category}</span>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:underline">View Details →</span>
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono opacity-90">#{selectedTicket.id.slice(-6).toUpperCase()}</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-white/20`}>
                        {selectedTicket.priority.toUpperCase()}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">{selectedTicket.title}</h2>
                    <p className="text-sm opacity-90">Created {new Date(selectedTicket.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.location}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Category</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{selectedTicket.category}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reporter</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.createdByName}</p>
                  </div>
                  {selectedTicket.contactPhone && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Contact</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedTicket.contactPhone}</p>
                    </div>
                  )}
                </div>

                {/* Images */}
                {selectedTicket.imageUrls && selectedTicket.imageUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Images</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedTicket.imageUrls.map((url, index) => (
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

                {/* Status Update */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {(['assigned', 'accepted', 'in_progress', 'completed'] as TicketStatus[]).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusUpdate(status)}
                        disabled={updatingStatus || status === selectedTicket.status}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          status === selectedTicket.status
                            ? 'bg-blue-600 text-white ring-2 ring-blue-500/50'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {status.replace('_', ' ').toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Work Notes & Comments</h3>
                  
                  {/* Comments List */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No comments yet</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{comment.userName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                              {comment.userRole}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
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
                      className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
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
            <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-green-600 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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