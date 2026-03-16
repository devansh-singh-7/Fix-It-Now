'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiskCard } from './RiskCard';
import type { AssetRisk, RiskBucket, UserRole } from '@/app/lib/types';
import { canViewCostImpact } from '@/app/lib/predictor-access';

interface PredictorDashboardProps {
  userRole: UserRole;
  buildingId?: string;
}

interface APIResponse {
  success: boolean;
  buildingId: string;
  buildingName: string;
  totalAssets: number;
  riskSummary: {
    high: number;
    medium: number;
    low: number;
  };
  assets: AssetRisk[];
  requiresServiceEntries?: boolean;
  message?: string;
  error?: string;
}

interface Building {
  id: string;
  name: string;
  address?: string;
}

export function PredictorDashboard({
  userRole,
  buildingId: propBuildingId,
}: PredictorDashboardProps) {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(propBuildingId || '');
  const [selectedAssetType, setSelectedAssetType] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('30days');
  const [selectedAsset, setSelectedAsset] = useState<AssetRisk | null>(null);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Buildings list state
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loadingBuildings, setLoadingBuildings] = useState(true);

  // API state
  const [assetRisks, setAssetRisks] = useState<AssetRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictionMessage, setPredictionMessage] = useState<string | null>(null);

  const showCostImpact = canViewCostImpact(userRole);

  // Fetch buildings list on mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const storedProfile = localStorage.getItem('userProfile');
        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const requesterUid = parsedProfile?.uid || parsedProfile?.firebaseUid;

        const response = await fetch('/api/buildings/list', {
          headers: requesterUid ? { 'x-user-id': requesterUid } : undefined,
        });
        const data = await response.json();

        const fetchedBuildings = data.data || data.buildings || [];

        if (data.success && Array.isArray(fetchedBuildings)) {
          setBuildings(fetchedBuildings);

          // Auto-select first building if none provided and no building in localStorage
          if (!propBuildingId && fetchedBuildings.length > 0) {
            const userProfile = localStorage.getItem('userProfile');
            if (userProfile) {
              const profile = JSON.parse(userProfile);
              const storedBuildingId =
                typeof profile.buildingId === 'object'
                  ? profile.buildingId?.buildingId
                  : profile.buildingId;

              if (storedBuildingId) {
                setSelectedBuildingId(storedBuildingId);
              } else {
                setSelectedBuildingId(fetchedBuildings[0].id);
              }
            } else {
              setSelectedBuildingId(fetchedBuildings[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching buildings:', err);
      } finally {
        setLoadingBuildings(false);
      }
    };

    fetchBuildings();
  }, [propBuildingId]);

  // Fetch predictions when building changes
  useEffect(() => {
    if (!selectedBuildingId) {
      setAssetRisks([]);
      return;
    }

    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      setPredictionMessage(null);

      try {
        const storedProfile = localStorage.getItem('userProfile');
        const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
        const requesterUid = parsedProfile?.uid || parsedProfile?.firebaseUid;

        const response = await fetch(`/api/predictions/assets?buildingId=${selectedBuildingId}`, {
          headers: requesterUid ? { 'x-user-id': requesterUid } : undefined,
        });
        const data: APIResponse = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch predictions');
        }

        if (data.requiresServiceEntries && data.message) {
          setPredictionMessage(data.message);
        }

        // Convert dates from strings
        const assetsWithDates = data.assets.map((asset) => ({
          ...asset,
          createdAt: new Date(asset.createdAt || new Date()),
          updatedAt: new Date(asset.updatedAt || new Date()),
          lastMaintenanceDate: asset.lastMaintenanceDate
            ? new Date(asset.lastMaintenanceDate)
            : undefined,
        }));

        setAssetRisks(assetsWithDates);
      } catch (err) {
        console.error('Error fetching predictions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [selectedBuildingId]);

  // Filter assets based on selections
  const filteredAssets = assetRisks.filter((asset) => {
    if (selectedAssetType !== 'all' && asset.assetType !== selectedAssetType) {
      return false;
    }

    const normalizedQuery = assetSearchQuery.trim().toLowerCase();
    if (normalizedQuery) {
      const searchableText = [
        asset.assetName,
        asset.assetType,
        asset.buildingName,
        ...(asset.contributingFactors || []),
      ]
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(normalizedQuery)) {
        return false;
      }
    }

    return true;
  });

  // Group assets by risk level
  const groupedAssets = filteredAssets.reduce(
    (acc, asset) => {
      acc[asset.riskLevel].push(asset);
      return acc;
    },
    { high: [], medium: [], low: [] } as Record<RiskBucket, AssetRisk[]>
  );

  const riskCounts = {
    high: groupedAssets.high.length,
    medium: groupedAssets.medium.length,
    low: groupedAssets.low.length,
    total: filteredAssets.length,
  };
  const highRiskPct = riskCounts.total > 0 ? Math.round((riskCounts.high / riskCounts.total) * 100) : 0;
  const mediumRiskPct = riskCounts.total > 0 ? Math.round((riskCounts.medium / riskCounts.total) * 100) : 0;
  const lowRiskPct = riskCounts.total > 0 ? Math.round((riskCounts.low / riskCounts.total) * 100) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
        <p className="text-center text-gray-500 dark:text-gray-400">Loading AI predictions...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Failed to Load Predictions
        </h3>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Predictive Maintenance Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor asset health and prevent failures before they happen
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedBuildingId}
            onChange={(e) => setSelectedBuildingId(e.target.value)}
            className="min-w-[260px] px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loadingBuildings}
          >
            <option value="">{loadingBuildings ? 'Loading buildings...' : 'Select building'}</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </select>

          <div className="relative min-w-[260px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={assetSearchQuery}
              onChange={(e) => setAssetSearchQuery(e.target.value)}
              placeholder="Search assets or factors..."
              className="w-full pl-10 pr-8 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            {assetSearchQuery && (
              <button
                onClick={() => setAssetSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            )}
          </div>

          <select
            value={selectedAssetType}
            onChange={(e) => setSelectedAssetType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assets</option>
            <option value="hvac">HVAC</option>
            <option value="elevator">Elevators</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="security">Security</option>
            <option value="appliance">Appliances</option>
          </select>

          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* No building selected state */}
      {!selectedBuildingId && !loadingBuildings && (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Select a Building
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Choose a building from the dropdown above to view AI-powered asset failure predictions
            and maintenance recommendations.
          </p>
        </div>
      )}

      {/* Main content - only show when building is selected */}
      {selectedBuildingId && (
        <>
          {predictionMessage && (
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">{predictionMessage}</p>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {riskCounts.total}
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-sm text-red-600 dark:text-red-400">High Risk</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">
                {riskCounts.high}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400">Medium Risk</p>
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {riskCounts.medium}
              </p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">Low Risk</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                {riskCounts.low}
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Risk Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* High Risk Section */}
              {groupedAssets.high.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      High Risk ({groupedAssets.high.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {groupedAssets.high.map((asset: AssetRisk) => (
                      <RiskCard
                        key={asset.id}
                        assetName={asset.assetName}
                        assetType={asset.assetType}
                        riskLevel={asset.riskLevel}
                        failureWindow={asset.estimatedFailureWindow}
                        reason={asset.contributingFactors[0]}
                        onClick={() => setSelectedAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Medium Risk Section */}
              {groupedAssets.medium.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Medium Risk ({groupedAssets.medium.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {groupedAssets.medium.map((asset: AssetRisk) => (
                      <RiskCard
                        key={asset.id}
                        assetName={asset.assetName}
                        assetType={asset.assetType}
                        riskLevel={asset.riskLevel}
                        failureWindow={asset.estimatedFailureWindow}
                        reason={asset.contributingFactors[0]}
                        onClick={() => setSelectedAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Low Risk Section */}
              {groupedAssets.low.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      Low Risk ({groupedAssets.low.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {groupedAssets.low.map((asset: AssetRisk) => (
                      <RiskCard
                        key={asset.id}
                        assetName={asset.assetName}
                        assetType={asset.assetType}
                        riskLevel={asset.riskLevel}
                        failureWindow={asset.estimatedFailureWindow}
                        reason={asset.contributingFactors[0]}
                        onClick={() => setSelectedAsset(asset)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Risk Distribution Chart Placeholder */}
            <div className="space-y-6">
              {/* Risk Overview Card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Risk Distribution
                </h3>
                <div className="space-y-4">
                  {/* High Risk Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">High Risk</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {highRiskPct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${highRiskPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-red-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Medium Risk Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Medium Risk</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {mediumRiskPct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${mediumRiskPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                        className="h-full bg-amber-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Low Risk Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Low Risk</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {lowRiskPct}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${lowRiskPct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Impact Summary (Admin/Enterprise only) */}
              {showCostImpact && assetRisks.length > 0 && (
                <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
                  <h3 className="font-semibold mb-3">Potential Cost Impact</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-blue-100 text-sm">If risks ignored</p>
                      <p className="text-2xl font-bold">
                        ₹
                        {(
                          assetRisks.reduce((sum, a) => sum + (a.estimatedCostIfIgnored || 0), 0) /
                          100
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-blue-400/30">
                      <p className="text-blue-100 text-sm">Est. prevention cost</p>
                      <p className="text-lg font-semibold">
                        ₹
                        {(
                          (assetRisks.reduce((sum, a) => sum + (a.estimatedCostIfIgnored || 0), 0) *
                            0.15) /
                          100
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Generate Maintenance Report
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Preventive Tasks
                  </button>
                  <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 inline-flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h3v8H7v-8zM14 4h3v16h-3V4zM3 16h3v4H3v-4z" />
                    </svg>
                    Export Risk Analysis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <AssetDetailModal
            asset={selectedAsset}
            showCostImpact={showCostImpact}
            onClose={() => setSelectedAsset(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Asset Detail Modal Component
function AssetDetailModal({
  asset,
  showCostImpact,
  onClose,
}: {
  asset: AssetRisk;
  showCostImpact: boolean;
  onClose: () => void;
}) {
  const riskColors: Record<RiskBucket, string> = {
    high: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
    medium:
      'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
    low: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{asset.assetName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{asset.buildingName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Risk Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${riskColors[asset.riskLevel]}`}
          >
            <span className="font-semibold uppercase text-sm">{asset.riskLevel} Risk</span>
            <span className="text-sm opacity-80">Est. failure: {asset.estimatedFailureWindow}</span>
          </div>

          {/* Contributing Factors */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Contributing Factors
            </h3>
            <ul className="space-y-2">
              {asset.contributingFactors.map((factor: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <svg
                    className="w-5 h-5 text-amber-500 mt-0.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Actions */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Suggested Preventive Actions
            </h3>
            <ul className="space-y-2">
              {(asset.suggestedActions ?? []).map((action: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cost Impact (Admin/Enterprise only) */}
          {showCostImpact && asset.estimatedCostIfIgnored && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Cost Impact Analysis
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">If ignored</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    ₹{(asset.estimatedCostIfIgnored / 100).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Prevention cost</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{((asset.estimatedCostIfIgnored * 0.15) / 100).toLocaleString()}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Potential savings:{' '}
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  ₹{((asset.estimatedCostIfIgnored * 0.85) / 100).toLocaleString()}
                </span>
              </p>
            </div>
          )}

          {/* Last Maintenance */}
          {asset.lastMaintenanceDate && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last maintenance: {asset.lastMaintenanceDate.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            Create Maintenance Ticket
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PredictorDashboard;
