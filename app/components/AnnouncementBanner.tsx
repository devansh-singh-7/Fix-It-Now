"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Announcement } from "@/app/lib/types";

interface AnnouncementBannerProps {
    userId: string;
    userRole: string;
    buildingId?: string | null;
}

const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
    userId,
    userRole,
    buildingId,
}) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    // Load dismissed announcements from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("dismissedAnnouncements");
        if (stored) {
            try {
                setDismissedIds(JSON.parse(stored));
            } catch {
                setDismissedIds([]);
            }
        }
    }, []);

    // Fetch announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            if (!userId || !userRole) return;

            try {
                const params = new URLSearchParams({
                    uid: userId,
                    role: userRole,
                });
                if (buildingId) {
                    params.append("buildingId", buildingId);
                }

                const response = await fetch(`/api/announcements?${params.toString()}`);
                const data = await response.json();

                if (data.success) {
                    setAnnouncements(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch announcements:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, [userId, userRole, buildingId]);

    // Dismiss an announcement
    const dismissAnnouncement = (id: string) => {
        const newDismissed = [...dismissedIds, id];
        setDismissedIds(newDismissed);
        localStorage.setItem("dismissedAnnouncements", JSON.stringify(newDismissed));
    };

    // Filter out dismissed announcements
    const visibleAnnouncements = announcements.filter(
        (a) => !dismissedIds.includes(a.id)
    );

    if (loading || visibleAnnouncements.length === 0) {
        return null;
    }

    // Priority order for sorting
    const priorityOrder = { urgent: 0, warning: 1, info: 2 };
    const sortedAnnouncements = [...visibleAnnouncements].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );

    return (
        <div className="mb-6 space-y-3">
            {/* Toggle button when collapsed */}
            {!expanded && (
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setExpanded(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                    {sortedAnnouncements.length} Announcement{sortedAnnouncements.length !== 1 ? "s" : ""}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </motion.button>
            )}

            <AnimatePresence>
                {expanded && sortedAnnouncements.map((announcement, index) => (
                    <AnnouncementCard
                        key={announcement.id}
                        announcement={announcement}
                        index={index}
                        onDismiss={() => dismissAnnouncement(announcement.id)}
                        onCollapse={index === 0 ? () => setExpanded(false) : undefined}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};

interface AnnouncementCardProps {
    announcement: Announcement;
    index: number;
    onDismiss: () => void;
    onCollapse?: () => void;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
    announcement,
    index,
    onDismiss,
    onCollapse,
}) => {
    const isSystem = announcement.type === "system";
    const isUrgent = announcement.priority === "urgent";
    const isWarning = announcement.priority === "warning";

    // Background gradient based on type
    const bgGradient = isSystem
        ? "from-blue-600/10 via-indigo-600/10 to-purple-600/10 dark:from-blue-900/30 dark:via-indigo-900/30 dark:to-purple-900/30"
        : "from-amber-500/10 via-orange-500/10 to-red-500/10 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-red-900/30";

    // Border color based on type
    const borderColor = isSystem
        ? "border-blue-200 dark:border-blue-800"
        : "border-amber-200 dark:border-amber-800";

    // Icon background
    const iconBg = isSystem
        ? "bg-gradient-to-br from-blue-500 to-indigo-600"
        : "bg-gradient-to-br from-amber-500 to-orange-600";

    // Priority indicator color
    const priorityColor = isUrgent
        ? "bg-red-500"
        : isWarning
            ? "bg-amber-500"
            : "bg-blue-500";

    // Format date
    const formatDate = (date: Date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Today";
        if (days === 1) return "Yesterday";
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative overflow-hidden rounded-2xl border ${borderColor} bg-gradient-to-r ${bgGradient} backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-300`}
        >
            {/* Subtle shimmer effect for urgent */}
            {isUrgent && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent animate-shimmer pointer-events-none" />
            )}

            <div className="relative p-5">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-none w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shadow-lg`}>
                        {isSystem ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-1">
                            {/* Priority indicator */}
                            <span className={`w-2 h-2 rounded-full ${priorityColor} ${isUrgent ? "animate-pulse" : ""}`} />

                            {/* Type badge */}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isSystem
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                                }`}>
                                {isSystem ? "From FixItNow Team" : announcement.buildingName || "Building Update"}
                            </span>

                            {/* Date */}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(announcement.createdAt)}
                            </span>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {announcement.title}
                        </h3>

                        {/* Content */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                            {announcement.content}
                        </p>

                        {/* Author (for building announcements) */}
                        {!isSystem && (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Posted by <span className="font-medium">{announcement.authorName}</span>
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex-none flex items-center gap-1">
                        {onCollapse && (
                            <button
                                onClick={onCollapse}
                                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                                title="Collapse announcements"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onDismiss}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                            title="Dismiss announcement"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`h-1 w-full ${isSystem
                    ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500"
                }`} />
        </motion.div>
    );
};

export default AnnouncementBanner;
