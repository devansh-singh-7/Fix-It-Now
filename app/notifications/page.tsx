"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebaseClient';
import NavBar from '@/app/components/NavBar';

interface Notification {
  id: string;
  type: 'ticket' | 'system' | 'announcement' | 'assignment';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  icon: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

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

      // Load sample notifications (in production, fetch from API)
      setNotifications([
        {
          id: '1',
          type: 'ticket',
          title: 'Ticket #1234 Resolved',
          message: 'Your AC repair ticket has been marked as completed by the technician.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false,
          actionUrl: '/tickets/1234',
          icon: '✅'
        },
        {
          id: '2',
          type: 'assignment',
          title: 'New Ticket Assigned',
          message: 'You have been assigned to ticket #1235 - Plumbing Issue in Apt 302.',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false,
          actionUrl: '/tickets/1235',
          icon: '🔧'
        },
        {
          id: '3',
          type: 'announcement',
          title: 'Scheduled Maintenance',
          message: 'Building maintenance scheduled for this Saturday, 10 AM - 2 PM.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: true,
          icon: '📢'
        },
        {
          id: '4',
          type: 'system',
          title: 'System Update',
          message: 'FixItNow has been updated with new features. Check out the improvements!',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
          read: true,
          icon: '🚀'
        },
        {
          id: '5',
          type: 'ticket',
          title: 'New Comment on Ticket #1230',
          message: 'Technician John has added a comment on your elevator repair ticket.',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          read: true,
          actionUrl: '/tickets/1230',
          icon: '💬'
        }
      ]);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <NavBar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    filter === 'all'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    filter === 'unread'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Mark all read
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`bg-white dark:bg-gray-900 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 ${
                    !notification.read 
                      ? 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10' 
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <div 
                    className="p-4 cursor-pointer"
                    onClick={() => {
                      markAsRead(notification.id);
                      if (notification.actionUrl) {
                        router.push(notification.actionUrl);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="text-2xl shrink-0">{notification.icon}</div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`text-sm font-semibold ${
                              !notification.read 
                                ? 'text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatTime(notification.timestamp)}
                            </span>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                        </div>
                        
                        {/* Type badge */}
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'ticket' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : notification.type === 'assignment'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : notification.type === 'announcement'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                          </span>
                          
                          {notification.actionUrl && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              View details →
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800"
              >
                <div className="text-6xl mb-4">🔔</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {filter === 'unread' 
                    ? 'You\'ve read all your notifications!'
                    : 'When you receive notifications, they\'ll appear here.'
                  }
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}
