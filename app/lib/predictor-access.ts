/**
 * Predictor Access Control Utility
 * 
 * Determines access level for the AI Failure Predictor module.
 * All users now have full access.
 */

import type { UserRole, PredictorAccessLevel } from './types';

/**
 * Get the predictor access level for a user
 * 
 * Access Rules:
 * - Everyone has FULL access
 */
export function getPredictorAccessLevel(
  role: UserRole
): PredictorAccessLevel {
  return 'full';
}

/**
 * Check if user can see asset-level predictions
 */
export function canViewAssetPredictions(
  role: UserRole
): boolean {
  return true;
}

/**
 * Check if user can see cost impact data
 */
export function canViewCostImpact(
  role: UserRole
): boolean {
  return true;
}

/**
 * Check if user should see upgrade prompts
 */
export function shouldShowUpgradePrompt(
  role: UserRole
): boolean {
  return false;
}

/**
 * Get appropriate empty state message based on access level
 */
export function getEmptyStateMessage(accessLevel: PredictorAccessLevel): string {
  if (accessLevel === 'full') {
    return 'No maintenance risks detected. All systems operating normally.';
  }
  return 'No data available.';
}
