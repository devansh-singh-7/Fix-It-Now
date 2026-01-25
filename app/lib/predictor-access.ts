/**
 * Predictor Access Control Utility
 * 
 * Determines access level for the AI Failure Predictor module
 * based on user role and subscription tier.
 */

import type { UserRole, SubscriptionTier, PredictorAccessLevel } from './types';

/**
 * Get the predictor access level for a user
 * 
 * Access Rules:
 * - Admins and Technicians: Always FULL access (internal users)
 * - Enterprise (Tier 1): FULL access
 * - Pro (Tier 2): LIMITED access (building-level trends only)
 * - Basic (Tier 3) or no subscription: NO access (locked preview)
 */
export function getPredictorAccessLevel(
  role: UserRole,
  tier?: SubscriptionTier | null
): PredictorAccessLevel {
  // Internal users (admin/technician) always have full access
  if (role === 'admin' || role === 'technician') {
    return 'full';
  }
  
  // External users (residents) depend on subscription tier
  if (tier === 1) return 'full';      // Enterprise
  if (tier === 2) return 'limited';   // Pro
  return 'none';                       // Basic or no subscription
}

/**
 * Check if user can see asset-level predictions
 */
export function canViewAssetPredictions(
  role: UserRole,
  tier?: SubscriptionTier | null
): boolean {
  return getPredictorAccessLevel(role, tier) === 'full';
}

/**
 * Check if user can see cost impact data
 */
export function canViewCostImpact(
  role: UserRole,
  tier?: SubscriptionTier | null
): boolean {
  // Only admins and enterprise users see cost data
  // Technicians focus on actions, not costs
  if (role === 'admin') return true;
  if (role === 'resident' && tier === 1) return true;
  return false;
}

/**
 * Check if user should see upgrade prompts
 */
export function shouldShowUpgradePrompt(
  role: UserRole,
  tier?: SubscriptionTier | null
): boolean {
  // Only show upgrade prompts for residents with Pro or Basic tier
  if (role !== 'resident') return false;
  return tier === 2 || tier === 3 || !tier;
}

/**
 * Get appropriate empty state message based on access level
 */
export function getEmptyStateMessage(accessLevel: PredictorAccessLevel): string {
  switch (accessLevel) {
    case 'full':
      return 'No maintenance risks detected. All systems operating normally.';
    case 'limited':
      return 'Building health data is being analyzed. Check back soon.';
    case 'none':
      return 'Upgrade your plan to access predictive maintenance insights.';
  }
}
