/**
 * ML Predictor for Asset Failure Prediction
 * 
 * TypeScript implementation of the trained Random Forest model.
 * Loads model parameters from JSON and makes predictions client-side.
 */

import type { RiskBucket } from './types';

// Asset feature input for prediction
export interface AssetFeatures {
  asset_type: string;
  asset_age_months: number;
  days_since_last_maintenance: number;
  total_maintenance_count: number;
  avg_monthly_usage_hours: number;
  last_repair_severity: 'none' | 'minor' | 'moderate' | 'major';
  ambient_temperature_avg: number;
  humidity_level_avg: number;
  power_outage_events_last_year: number;
  manufacturer_rating: number;
  installation_quality: 'poor' | 'average' | 'good' | 'excellent';
  building_age_years: number;
  seasonal_load_factor: number;
}

// Prediction result
export interface PredictionResult {
  riskLevel: RiskBucket;
  failureProbability: number;
  estimatedDaysToFailure: number;
  contributingFactors: string[];
  suggestedActions: string[];
}

// Tree node structure (matches Python export)
interface TreeNode {
  type: 'split' | 'leaf';
  feature?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  prediction?: string;
  probability?: number;
  days?: number;
  samples?: number;
}

// Model structure from JSON
interface ModelParams {
  model_type: string;
  n_trees: number;
  trees: TreeNode[];
  feature_importances: Record<string, number>;
  metadata: {
    trained_on: number;
    tested_on: number;
    accuracy: number;
    features: string[];
    categorical_features: string[];
    target_classes: string[];
  };
}

// Load model params - will be populated from API or embedded
let modelParams: ModelParams | null = null;
let modelLoaded = false;

/**
 * Load model parameters from JSON file
 */
export async function loadModel(): Promise<boolean> {
  if (modelLoaded && modelParams) {
    return true;
  }

  try {
    // In browser, fetch from API endpoint
    const response = await fetch('/api/predictions/model');
    if (!response.ok) {
      console.warn('Failed to load model from API, using fallback');
      return false;
    }
    modelParams = await response.json();
    modelLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading model:', error);
    return false;
  }
}

/**
 * Traverse a decision tree to get prediction
 */
function predictTree(tree: TreeNode, features: Record<string, number>): TreeNode {
  if (tree.type === 'leaf') {
    return tree;
  }

  const value = features[tree.feature || ''] || 0;
  if (value < (tree.threshold || 0)) {
    return predictTree(tree.left!, features);
  } else {
    return predictTree(tree.right!, features);
  }
}

/**
 * Convert asset features to numeric format for model
 */
function preprocessFeatures(features: AssetFeatures): Record<string, number> {
  return {
    asset_age_months: features.asset_age_months,
    days_since_last_maintenance: features.days_since_last_maintenance,
    total_maintenance_count: features.total_maintenance_count,
    avg_monthly_usage_hours: features.avg_monthly_usage_hours,
    ambient_temperature_avg: features.ambient_temperature_avg,
    humidity_level_avg: features.humidity_level_avg,
    power_outage_events_last_year: features.power_outage_events_last_year,
    manufacturer_rating: features.manufacturer_rating,
    building_age_years: features.building_age_years,
    seasonal_load_factor: features.seasonal_load_factor,
  };
}

/**
 * Generate contributing factors based on asset features
 */
function generateContributingFactors(features: AssetFeatures, riskLevel: RiskBucket): string[] {
  const factors: string[] = [];
  
  const age = features.asset_age_months;
  const daysSince = features.days_since_last_maintenance;
  const maintCount = features.total_maintenance_count;
  const expectedMaint = age / 6;
  const temp = features.ambient_temperature_avg;
  const humidity = features.humidity_level_avg;
  
  if (age > 120) {
    factors.push(`Asset age (${age} months) exceeds recommended lifecycle`);
  } else if (age > 60) {
    factors.push(`Asset approaching mid-life at ${age} months`);
  }
  
  if (daysSince > 180) {
    factors.push(`Maintenance overdue by ${daysSince - 180} days`);
  } else if (daysSince > 90) {
    factors.push(`Last maintenance was ${daysSince} days ago`);
  }
  
  if (maintCount > expectedMaint * 2) {
    factors.push(`Unusually high repair frequency (${maintCount} repairs)`);
  }
  
  if (temp > 38) {
    factors.push(`High ambient temperature (${temp.toFixed(1)}°C) increasing stress`);
  }
  
  if (humidity > 80) {
    factors.push(`High humidity (${humidity.toFixed(0)}%) may cause corrosion`);
  }
  
  if (features.manufacturer_rating <= 2) {
    factors.push('Low manufacturer quality rating');
  }
  
  if (features.installation_quality === 'poor') {
    factors.push('Poor installation quality documented');
  }
  
  if (factors.length === 0) {
    if (riskLevel === 'low') {
      factors.push('No significant risk factors detected');
      factors.push('Asset operating within normal parameters');
    } else {
      factors.push('Multiple minor factors contributing to risk');
    }
  }
  
  return factors.slice(0, 4);
}

/**
 * Generate suggested actions based on asset type and features
 */
function generateSuggestedActions(features: AssetFeatures, riskLevel: RiskBucket): string[] {
  const actions: string[] = [];
  
  const daysSince = features.days_since_last_maintenance;
  const age = features.asset_age_months;
  const maintCount = features.total_maintenance_count;
  const expectedMaint = age / 6;

  // Maintenance-based actions
  if (daysSince > 180) {
    actions.push(`Schedule immediate preventive maintenance - overdue by ${daysSince - 180} days`);
  } else if (daysSince > 90) {
    actions.push('Schedule routine maintenance within 2 weeks');
  }

  // Asset type specific
  switch (features.asset_type) {
    case 'hvac':
      if (features.ambient_temperature_avg > 35) {
        actions.push('Check HVAC cooling efficiency - operating in high ambient temp');
      }
      if (features.humidity_level_avg > 75) {
        actions.push('Inspect HVAC dehumidification system');
      }
      actions.push('Replace air filters if not done recently');
      break;
      
    case 'elevator':
      actions.push('Inspect hydraulic fluid levels and pressures');
      if (age > 120) {
        actions.push('Consider modernization assessment for aging elevator');
      }
      break;
      
    case 'electrical':
      if (features.humidity_level_avg > 80) {
        actions.push('Check electrical insulation and moisture barriers');
      }
      actions.push('Test circuit breakers and safety switches');
      break;
      
    case 'plumbing':
      actions.push('Check for leaks and water pressure consistency');
      if (age > 60) {
        actions.push('Inspect pipe condition for corrosion');
      }
      break;
      
    case 'security':
      actions.push('Test all sensors and alarm systems');
      actions.push('Verify backup power functionality');
      break;
      
    case 'appliance':
      actions.push('Check for unusual noises or vibrations');
      actions.push('Verify all safety features functioning');
      break;
  }

  // Age-based actions
  if (age > 120) {
    actions.push('Evaluate replacement cost vs. ongoing maintenance');
  }

  // Maintenance fatigue
  if (maintCount > expectedMaint * 2) {
    actions.push('Asset showing signs of end-of-life - plan replacement');
  }

  // Ensure we have at least some actions
  if (actions.length === 0) {
    if (riskLevel === 'high') {
      actions.push('Urgent inspection required');
    } else if (riskLevel === 'medium') {
      actions.push('Schedule inspection within one week');
    } else {
      actions.push('Continue routine monitoring');
    }
  }

  return actions.slice(0, 5);
}

/**
 * Make prediction using trained model
 */
export async function predict(features: AssetFeatures): Promise<PredictionResult> {
  // Ensure model is loaded
  const loaded = await loadModel();
  
  if (!loaded || !modelParams) {
    // Fallback: use heuristic-based prediction
    return predictFallback(features);
  }

  // Preprocess features
  const numericFeatures = preprocessFeatures(features);

  // Get predictions from all trees
  const predictions = modelParams.trees.map(tree => predictTree(tree, numericFeatures));

  // Aggregate votes
  const votes: Record<string, number> = { low: 0, medium: 0, high: 0 };
  let totalProb = 0;
  let totalDays = 0;

  for (const pred of predictions) {
    const riskLevel = pred.prediction || 'medium';
    votes[riskLevel] = (votes[riskLevel] || 0) + 1;
    totalProb += pred.probability || 0.5;
    totalDays += pred.days || 100;
  }

  // Determine majority vote
  let riskLevel: RiskBucket = 'medium';
  let maxVotes = 0;
  for (const [level, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      riskLevel = level as RiskBucket;
    }
  }

  const failureProbability = totalProb / predictions.length;
  const estimatedDaysToFailure = Math.round(totalDays / predictions.length);

  // Generate explanations
  const contributingFactors = generateContributingFactors(features, riskLevel);
  const suggestedActions = generateSuggestedActions(features, riskLevel);

  return {
    riskLevel,
    failureProbability: Math.round(failureProbability * 10000) / 10000,
    estimatedDaysToFailure,
    contributingFactors,
    suggestedActions,
  };
}

/**
 * Fallback prediction using heuristics (when model not loaded)
 */
function predictFallback(features: AssetFeatures): PredictionResult {
  // Simple heuristic scoring
  let riskScore = 0;

  // Age factor
  if (features.asset_age_months > 120) riskScore += 3;
  else if (features.asset_age_months > 60) riskScore += 1.5;

  // Maintenance neglect
  if (features.days_since_last_maintenance > 180) riskScore += 3;
  else if (features.days_since_last_maintenance > 90) riskScore += 1.5;

  // Maintenance fatigue
  const expectedMaint = features.asset_age_months / 6;
  if (features.total_maintenance_count > expectedMaint * 2) riskScore += 2;

  // Environment
  if (features.ambient_temperature_avg > 38) riskScore += 1;
  if (features.humidity_level_avg > 80) riskScore += 1;

  // Quality factors
  if (features.manufacturer_rating <= 2) riskScore += 1;
  if (features.installation_quality === 'poor') riskScore += 2;

  // Determine risk level
  let riskLevel: RiskBucket;
  let failureProbability: number;
  let estimatedDaysToFailure: number;

  if (riskScore >= 6) {
    riskLevel = 'high';
    failureProbability = 0.7 + Math.random() * 0.2;
    estimatedDaysToFailure = 7 + Math.floor(Math.random() * 30);
  } else if (riskScore >= 3) {
    riskLevel = 'medium';
    failureProbability = 0.35 + Math.random() * 0.25;
    estimatedDaysToFailure = 30 + Math.floor(Math.random() * 90);
  } else {
    riskLevel = 'low';
    failureProbability = 0.1 + Math.random() * 0.2;
    estimatedDaysToFailure = 120 + Math.floor(Math.random() * 200);
  }

  return {
    riskLevel,
    failureProbability: Math.round(failureProbability * 10000) / 10000,
    estimatedDaysToFailure,
    contributingFactors: generateContributingFactors(features, riskLevel),
    suggestedActions: generateSuggestedActions(features, riskLevel),
  };
}

/**
 * Estimate cost if failure is ignored (in paisa)
 */
export function estimateCostIfIgnored(
  assetType: string,
  riskLevel: RiskBucket,
  estimatedDaysToFailure: number
): number {
  // Base costs by asset type (in rupees)
  const baseCosts: Record<string, number> = {
    hvac: 80000,
    elevator: 150000,
    electrical: 40000,
    plumbing: 30000,
    security: 25000,
    appliance: 20000,
  };

  const baseCost = baseCosts[assetType] || 50000;

  // Multiply by risk level
  const riskMultiplier = {
    high: 1.5,
    medium: 1.0,
    low: 0.5,
  }[riskLevel];

  // Adjust by urgency
  const urgencyMultiplier = estimatedDaysToFailure < 30 ? 1.3 : 1.0;

  // Convert to paisa (1 rupee = 100 paisa)
  return Math.round(baseCost * riskMultiplier * urgencyMultiplier * 100);
}

/**
 * Generate failure window string from days
 */
export function formatFailureWindow(days: number): string {
  if (days <= 7) return '< 1 week';
  if (days <= 14) return '1-2 weeks';
  if (days <= 30) return '2-4 weeks';
  if (days <= 60) return '1-2 months';
  if (days <= 90) return '2-3 months';
  if (days <= 180) return '3-6 months';
  if (days <= 365) return '6-12 months';
  return '> 1 year';
}
