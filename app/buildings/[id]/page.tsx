"use client";

import React, { useState, useEffect, use } from "react";
import { motion, useReducedMotion } from "framer-motion";
import RouteGuard from "@/app/components/RouteGuard";
import { auth } from "@/app/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface BuildingData {
    id: string;
    name: string;
    address: string;
    joinCode: string;
    adminId?: string;
    technicianCount?: number;
    createdAt?: string;
}

interface Technician {
    uid: string;
    name: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
}

export default function BuildingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const shouldReduceMotion = useReducedMotion();

    // State
    const [building, setBuilding] = useState<BuildingData | null>(null);
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [userId, setUserId] = useState<string | null>(null);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editAddress, setEditAddress] = useState("");
    const [saving, setSaving] = useState(false);



    const [copiedCode, setCopiedCode] = useState(false);

    // Load building data
    useEffect(() => {
        if (!auth) return;

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push('/auth/signin');
                return;
            }

            setUserId(user.uid);

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

                // Fetch technicians
                const techRes = await fetch(`/api/buildings/${id}/technicians`, {
                    headers: { 'x-user-id': user.uid },
                });
                const techData = await techRes.json();

                if (techData.success) {
                    setTechnicians(techData.data);
                }
            } catch (err) {
                console.error("Error loading building:", err);
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load building");
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [id, router]);

    const handleSaveEdit = async () => {
        if (!userId || !building) return;

        setSaving(true);
        setError("");

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

            setBuilding(prev => prev ? { ...prev, name: editName, address: editAddress } : null);
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

            setTechnicians(prev => prev.filter(t => t.uid !== techUid));
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

    const handleCopyCode = () => {
        if (building?.joinCode) {
            navigator.clipboard.writeText(building.joinCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        }
    };

    if (loading) {
        return (
            <RouteGuard allowedRoles={["admin"]}>
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
            <RouteGuard allowedRoles={["admin"]}>
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
        <RouteGuard allowedRoles={["admin"]}>
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
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Building Details</h2>

                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
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
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Join Code</p>
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
                        </motion.div>

                        {/* Technicians Card */}
                        <motion.div
                            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Technicians
                                    <span className="ml-2 px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full">
                                        {technicians.length}
                                    </span>
                                </h2>
                            </div>



                            {/* Technicians List */}
                            {technicians.length > 0 ? (
                                <div className="space-y-3">
                                    {technicians.map((tech) => (
                                        <div
                                            key={tech.uid}
                                            className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800"
                                        >
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{tech.email}</p>
                                                {tech.phoneNumber && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{tech.phoneNumber}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleRemoveTechnician(tech.uid)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400">No technicians assigned</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">Add technicians to manage this building</p>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </RouteGuard>
    );
}
