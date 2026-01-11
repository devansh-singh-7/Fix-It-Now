"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/app/lib/firebaseClient';
import RouteGuard from '@/app/components/RouteGuard';
import NavBar from '@/app/components/NavBar';
import type { Announcement, AnnouncementType, AnnouncementPriority, Building } from '@/app/lib/types';

interface FormData {
    title: string;
    content: string;
    priority: AnnouncementPriority;
    type: AnnouncementType;
    buildingId: string;
    buildingName: string;
    expiresAt: string;
}

const initialFormData: FormData = {
    title: '',
    content: '',
    priority: 'info',
    type: 'system',
    buildingId: '',
    buildingName: '',
    expiresAt: ''
};

export default function AdminAnnouncementsPage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('active');

    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/auth/signin');
                return;
            }

            setUserId(user.uid);

            // Get user profile for name
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
                const profile = JSON.parse(userProfile);
                setUserName(profile.displayName || profile.name || 'Admin');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Fetch all announcements for admin
    useEffect(() => {
        if (!userId) return;

        const fetchAnnouncements = async () => {
            try {
                const response = await fetch(`/api/announcements/admin?uid=${userId}`);
                const data = await response.json();
                if (data.success) {
                    setAnnouncements(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            }
        };

        fetchAnnouncements();
    }, [userId]);

    // Fetch buildings for dropdown
    useEffect(() => {
        if (!userId) return;

        const fetchBuildings = async () => {
            try {
                const response = await fetch(`/api/buildings/list-for-admin?uid=${userId}`);
                const data = await response.json();
                if (data.success) {
                    setBuildings(data.data || []);
                }
            } catch (error) {
                console.error('Failed to fetch buildings:', error);
            }
        };

        fetchBuildings();
    }, [userId]);

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(initialFormData);
        setError('');
        setSuccess('');
        setIsModalOpen(true);
    };

    const openEditModal = (announcement: Announcement) => {
        setEditingId(announcement.id);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            type: announcement.type,
            buildingId: announcement.buildingId || '',
            buildingName: announcement.buildingName || '',
            expiresAt: announcement.expiresAt
                ? new Date(announcement.expiresAt).toISOString().slice(0, 16)
                : ''
        });
        setError('');
        setSuccess('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);

        try {
            const payload = {
                uid: userId,
                role: 'admin',
                authorName: userName,
                title: formData.title,
                content: formData.content,
                priority: formData.priority,
                type: formData.type,
                buildingId: formData.type === 'building' ? formData.buildingId : undefined,
                buildingName: formData.type === 'building' ? formData.buildingName : undefined,
                expiresAt: formData.expiresAt || undefined,
                ...(editingId && { announcementId: editingId })
            };

            const response = await fetch('/api/announcements', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(editingId ? 'Announcement updated!' : 'Announcement created!');

                // Update local state
                if (editingId) {
                    setAnnouncements(prev =>
                        prev.map(a => a.id === editingId ? data.data : a)
                    );
                } else {
                    setAnnouncements(prev => [data.data, ...prev]);
                }

                setTimeout(() => {
                    setIsModalOpen(false);
                    setSuccess('');
                }, 1500);
            } else {
                setError(data.error || 'Failed to save announcement');
            }
        } catch (err) {
            console.error('Submit error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this announcement?')) return;

        try {
            const response = await fetch(
                `/api/announcements?uid=${userId}&role=admin&id=${id}`,
                { method: 'DELETE' }
            );

            const data = await response.json();

            if (data.success) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
            } else {
                alert(data.error || 'Failed to delete announcement');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete announcement');
        }
    };

    // Filter announcements
    const filteredAnnouncements = announcements.filter(a => {
        if (filter === 'all') return true;
        if (filter === 'active') return a.isActive;
        if (filter === 'expired') return !a.isActive;
        return true;
    });

    const getPriorityBadge = (priority: AnnouncementPriority) => {
        const styles = {
            info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
            urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        };
        return styles[priority];
    };

    const getTypeBadge = (type: AnnouncementType) => {
        return type === 'system'
            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-800 relative">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <RouteGuard allowedRoles={['admin']}>
            <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                <NavBar />

                <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                    <span className="bg-linear-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                        Announcements
                                    </span>
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Create and manage system-wide and building-specific announcements
                                </p>
                            </div>

                            <button
                                onClick={openCreateModal}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 group"
                            >
                                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Announcement
                            </button>
                        </div>
                    </motion.div>

                    {/* Filter Tabs */}
                    <div className="mb-6">
                        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            {(['active', 'all', 'expired'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === f
                                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                >
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Announcements List */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4"
                    >
                        {filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    No announcements found
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Create your first announcement to notify users
                                </p>
                                <button
                                    onClick={openCreateModal}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Announcement
                                </button>
                            </div>
                        ) : (
                            filteredAnnouncements.map((announcement, index) => (
                                <motion.div
                                    key={announcement.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`bg-white dark:bg-gray-900 rounded-xl border ${announcement.isActive
                                        ? 'border-gray-200 dark:border-gray-800'
                                        : 'border-gray-200/50 dark:border-gray-800/50 opacity-60'
                                        } p-6 hover:shadow-lg transition-all`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(announcement.type)}`}>
                                                    {announcement.type === 'system' ? '🌐 System' : '🏢 Building'}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(announcement.priority)}`}>
                                                    {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                                                </span>
                                                {!announcement.isActive && (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                                {announcement.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                                                {announcement.content}
                                            </p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                                                <span>By {announcement.authorName}</span>
                                                <span>•</span>
                                                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                {announcement.type === 'building' && announcement.buildingName && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{announcement.buildingName}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(announcement)}
                                                className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </main>

                {/* Create/Edit Modal */}
                <AnimatePresence>
                    {isModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
                            >
                                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {editingId ? 'Edit Announcement' : 'Create Announcement'}
                                    </h2>
                                </div>

                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-sm text-red-800 dark:text-red-300">
                                            {error}
                                        </div>
                                    )}

                                    {success && (
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 text-sm text-green-800 dark:text-green-300">
                                            {success}
                                        </div>
                                    )}

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Title *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                            placeholder="Announcement title..."
                                        />
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Content *
                                        </label>
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.content}
                                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white resize-none"
                                            placeholder="Announcement content..."
                                        />
                                    </div>

                                    {/* Type & Priority Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Type *
                                            </label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                            >
                                                <option value="system">🌐 System-wide</option>
                                                <option value="building">🏢 Building-specific</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Priority *
                                            </label>
                                            <select
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as AnnouncementPriority })}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                            >
                                                <option value="info">ℹ️ Info</option>
                                                <option value="warning">⚠️ Warning</option>
                                                <option value="urgent">🚨 Urgent</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Building Selector (when type is building) */}
                                    {formData.type === 'building' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                Building *
                                            </label>
                                            <select
                                                required
                                                value={formData.buildingId}
                                                onChange={(e) => {
                                                    const building = buildings.find(b => b.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        buildingId: e.target.value,
                                                        buildingName: building?.name || ''
                                                    });
                                                }}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                            >
                                                <option value="">Select a building...</option>
                                                {buildings.map(building => (
                                                    <option key={building.id} value={building.id}>
                                                        {building.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Expiration */}
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                            Expires At <span className="text-gray-400 font-normal">(optional)</span>
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-white"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-5 py-2.5 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium shadow-lg transition-all disabled:cursor-not-allowed"
                                        >
                                            {submitting ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </RouteGuard>
    );
}
