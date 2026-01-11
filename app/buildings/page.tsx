"use client";

import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import RouteGuard from "@/app/components/RouteGuard";
import { auth } from "@/app/lib/firebaseClient";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

interface BuildingData {
  id: string;
  name: string;
  address: string;
  joinCode: string;
  adminId?: string;
  createdAt?: Date;
  technicianCount?: number;
}

interface Technician {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
}

export default function BuildingManagementPage() {
  const shouldReduceMotion = useReducedMotion();

  // Form state
  const [buildingName, setBuildingName] = useState("");
  const [buildingAddress, setBuildingAddress] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<BuildingData[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  
  // Technician assignment modal state
  const [showTechModal, setShowTechModal] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedBuildingName, setSelectedBuildingName] = useState<string>("");
  const [techName, setTechName] = useState("");
  const [techEmail, setTechEmail] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [addingTech, setAddingTech] = useState(false);
  const [buildingTechnicians, setBuildingTechnicians] = useState<Record<string, Technician[]>>({});

  // Load all buildings for this admin
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoadingBuildings(false);
        return;
      }

      try {
        const buildingsRes = await fetch('/api/buildings/list-for-admin', {
          headers: {
            'x-user-id': user.uid,
          },
        });
        const buildingsData = await buildingsRes.json();

        if (buildingsData.buildings) {
          setBuildings(buildingsData.buildings);
        }
      } catch (err) {
        console.error("Error loading buildings:", err);
      } finally {
        setLoadingBuildings(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!buildingName.trim()) {
      setError("Building name is required");
      return;
    }

    if (!buildingAddress.trim()) {
      setError("Building address is required");
      return;
    }

    if (!auth?.currentUser) {
      setError("You must be signed in to create a building");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/buildings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminUid: auth.currentUser.uid,
          name: buildingName.trim(),
          address: buildingAddress.trim(),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create building');
      }

      const building = result.data;
      const newBuilding = {
        id: building.id,
        name: building.name,
        address: building.address,
        joinCode: building.joinCode,
        adminId: building.adminId,
      };

      setBuildings(prev => [newBuilding, ...prev]);
      setSuccess("Building created successfully!");
      setBuildingName("");
      setBuildingAddress("");
    } catch (err) {
      console.error("Error creating building:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create building. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    if (!confirm('Are you sure you want to delete this building? This action cannot be undone.')) {
      return;
    }

    if (!auth?.currentUser) {
      setError('You must be signed in to delete a building');
      return;
    }

    try {
      const response = await fetch(`/api/buildings/${buildingId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': auth.currentUser.uid,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete building');
      }

      // Remove from local state
      setBuildings(prev => prev.filter(b => b.id !== buildingId));
      setSuccess('Building deleted successfully');
    } catch (err) {
      console.error('Error deleting building:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete building');
      }
    }
  };

  const openTechModal = async (buildingId: string, buildingName: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedBuildingName(buildingName);
    setShowTechModal(true);
    setTechName("");
    setTechEmail("");
    setTechPhone("");
    setError("");
    
    // Load existing technicians for this building
    if (!buildingTechnicians[buildingId]) {
      try {
        const res = await fetch(`/api/buildings/${buildingId}/technicians`, {
          headers: { 'x-user-id': auth?.currentUser?.uid || '' },
        });
        const data = await res.json();
        if (data.success) {
          setBuildingTechnicians(prev => ({ ...prev, [buildingId]: data.data }));
        }
      } catch (err) {
        console.error('Error loading technicians:', err);
      }
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedBuildingId || !techName || !techEmail || !auth?.currentUser) return;
    
    setAddingTech(true);
    setError("");

    try {
      const response = await fetch(`/api/buildings/${selectedBuildingId}/technicians`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': auth.currentUser.uid,
        },
        body: JSON.stringify({
          name: techName,
          email: techEmail,
          phoneNumber: techPhone || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign technician');
      }

      // Reload technicians for this building
      const techRes = await fetch(`/api/buildings/${selectedBuildingId}/technicians`, {
        headers: { 'x-user-id': auth.currentUser.uid },
      });
      const techData = await techRes.json();
      if (techData.success) {
        setBuildingTechnicians(prev => ({ ...prev, [selectedBuildingId]: techData.data }));
      }

      setSuccess(`Technician "${techName}" has been assigned to ${selectedBuildingName}`);
      setTechName("");
      setTechEmail("");
      setTechPhone("");
      setShowTechModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error('Error assigning technician:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to assign technician');
      }
    } finally {
      setAddingTech(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["admin"]}>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 relative overflow-hidden">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 25px 25px, #94a3b8 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }} />
          </div>
          {/* Animated gradient orbs */}
          <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-300/20 dark:bg-purple-700/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-300/20 dark:bg-blue-700/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
          {/* Header Section */}
          <div className="mb-10">
            {/* Back to Dashboard Button */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 px-5 py-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-lg font-medium border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </Link>
            </motion.div>

            {/* Page Title */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Building Management
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl">
                Create and manage buildings, generate unique join codes for residents and technicians
              </p>
            </motion.div>
          </div>

          <div className="space-y-8">
            {/* Create Building Form */}
            <div className="space-y-8">
              {/* Create Building Card */}
              <motion.div
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 shadow-lg hover:shadow-xl transition-all duration-300 p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Create New Building
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      Add a new building to manage maintenance requests
                    </p>
                  </div>
                </div>

                {/* Messages */}
                {error && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-red-50/80 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 backdrop-blur-sm"
                    role="alert"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                    </div>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-green-50/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 backdrop-blur-sm"
                    role="alert"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-green-500 dark:text-green-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-green-800 dark:text-green-300">{success}</p>
                    </div>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleCreateBuilding} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="buildingName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Building Name
                    </label>
                    <input
                      id="buildingName"
                      type="text"
                      value={buildingName}
                      onChange={(e) => setBuildingName(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Sunset Apartments"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="buildingAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Building Address
                    </label>
                    <input
                      id="buildingAddress"
                      type="text"
                      value={buildingAddress}
                      onChange={(e) => setBuildingAddress(e.target.value)}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-gray-800/50 border border-gray-300/50 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="123 Main Street, City, State 12345"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3 group"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Building...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Building
                      </>
                    )}
                  </button>
                </form>
              </motion.div>

              {/* Buildings List */}
              {loadingBuildings ? (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 p-8"
                >
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-800 border-t-blue-600 dark:border-t-blue-500 animate-spin"></div>
                    </div>
                    <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading your buildings...</p>
                  </div>
                </motion.div>
              ) : buildings.length > 0 ? (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Your Buildings
                      <span className="ml-3 px-3 py-1 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                        {buildings.length}
                      </span>
                    </h2>
                  </div>

                  <div className="space-y-6">
                    {buildings.map((building, index) => (
                      <motion.div
                        key={building.id}
                        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200/80 dark:border-gray-800/80 p-6 hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-lg transition-all duration-300"
                      >
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {building.name}
                              </h3>
                              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300">
                                Active
                              </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {building.address}
                            </p>
                          </div>
                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/buildings/${building.id}`}
                              className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </Link>
                            <button
                              onClick={() => openTechModal(building.id, building.name)}
                              className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                              Assign Tech
                            </button>
                            <button
                              onClick={() => handleDeleteBuilding(building.id)}
                              className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>

                        {/* Join Code Section */}
                        <div className="rounded-xl bg-linear-to-r from-blue-50/80 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/50 dark:border-blue-800/30 p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <label className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                              Join Code
                            </label>
                          </div>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <div className="flex-1 px-5 py-3.5 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-blue-200/50 dark:border-blue-800/50">
                              <code className="font-mono text-lg font-bold tracking-wider text-blue-700 dark:text-blue-300">
                                {building.joinCode}
                              </code>
                            </div>
                            <button
                              onClick={() => handleCopyCode(building.joinCode)}
                              className="px-6 py-3.5 rounded-lg bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all duration-300 hover:shadow-lg active:scale-95 flex items-center justify-center gap-3 min-w-[120px]"
                            >
                              {copiedCode === building.joinCode ? (
                                <>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  Copy Code
                                </>
                              )}
                            </button>
                          </div>
                          <p className="mt-3 text-sm text-blue-700/80 dark:text-blue-400/80">
                            Share this code with residents and technicians to join this building
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      
      {/* Technician Assignment Modal */}
      {showTechModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Assign Technician</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">to {selectedBuildingName}</p>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Existing Technicians */}
              {selectedBuildingId && buildingTechnicians[selectedBuildingId]?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Technicians</h3>
                  <div className="space-y-2">
                    {buildingTechnicians[selectedBuildingId].map((tech) => (
                      <div key={tech.uid} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{tech.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Add New Technician Form */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Technician</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Name *</label>
                    <input
                      type="text"
                      value={techName}
                      onChange={(e) => setTechName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Email *</label>
                    <input
                      type="email"
                      value={techEmail}
                      onChange={(e) => setTechEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="technician@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Phone (Optional)</label>
                    <input
                      type="tel"
                      value={techPhone}
                      onChange={(e) => setTechPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowTechModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTechnician}
                disabled={addingTech || !techName || !techEmail}
                className="px-6 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {addingTech ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Assigning...
                  </>
                ) : (
                  <>Assign Technician</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </RouteGuard>
  );
}