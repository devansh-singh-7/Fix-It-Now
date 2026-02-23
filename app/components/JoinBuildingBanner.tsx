"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinBuildingBannerProps {
  onJoinSuccess: () => void;
}

export default function JoinBuildingBanner({ onJoinSuccess }: JoinBuildingBannerProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleJoinBuilding = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate the join code first
      const validateRes = await fetch(`/api/buildings/validate-join-code?joinCode=${joinCode}`);
      const validateData = await validateRes.json();

      if (!validateData.success) {
        setError('Invalid building code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Get current user profile
      const userProfile = localStorage.getItem('userProfile');
      if (!userProfile) {
        setError('User profile not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const profile = JSON.parse(userProfile);

      console.log('[JoinBuildingBanner] Updating building for user:', {
        uid: profile.firebaseUid || profile.uid,
        buildingId: validateData.data.id,
        buildingName: validateData.data.name
      });

      // Update user profile with building ID
      const updateRes = await fetch('/api/users/update-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: profile.firebaseUid || profile.uid,
          buildingId: validateData.data.id,
          buildingName: validateData.data.name
        })
      });

      const updateData = await updateRes.json();
      console.log('[JoinBuildingBanner] API response:', updateData);

      if (!updateData.success) {
        console.error('[JoinBuildingBanner] Failed to update building:', updateData);
        setError(updateData.error || 'Failed to join building. Please try again.');
        setLoading(false);
        return;
      }

      // Update localStorage with new building info
      const updatedProfile = {
        ...profile,
        buildingId: validateData.data.id,
        buildingName: validateData.data.name,
        // Ensure both uid formats are set for consistency
        uid: profile.firebaseUid || profile.uid,
        firebaseUid: profile.firebaseUid || profile.uid
      };
      localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      
      // Dispatch custom event to notify NavBar (storage events don't fire in same tab)
      window.dispatchEvent(new CustomEvent('userProfileUpdated'));
      
      console.log('✅ Building joined successfully:', {
        buildingId: validateData.data.id,
        buildingName: validateData.data.name
      });

      // Success!
      onJoinSuccess();
    } catch (err) {
      console.error('Error joining building:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-lg">Join Your Building</h3>
              <p className="text-sm text-blue-100">Enter your building join code to get started</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showInput ? (
              <motion.button
                key="show-button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => setShowInput(true)}
                className="px-6 py-2.5 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-md whitespace-nowrap"
              >
                Enter Join Code
              </motion.button>
            ) : (
              <motion.div
                key="input-form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => {
                      setJoinCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="BUILDING-CODE"
                    className="px-4 py-2.5 rounded-lg text-gray-900 font-mono text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-white/50"
                    disabled={loading}
                    maxLength={20}
                  />
                  {error && (
                    <p className="absolute top-full left-0 mt-1 text-xs text-red-200 whitespace-nowrap">
                      {error}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleJoinBuilding}
                    disabled={loading || !joinCode.trim()}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors shadow-md disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Joining...
                      </span>
                    ) : (
                      'Join'
                    )}
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowInput(false);
                      setJoinCode('');
                      setError('');
                    }}
                    disabled={loading}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
