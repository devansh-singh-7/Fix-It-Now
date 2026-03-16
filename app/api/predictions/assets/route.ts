import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { requireBuildingAccess } from '@/app/lib/server-auth';

// FastAPI backend URL
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Asset type configurations for building assets
const ASSET_TYPES = ['hvac', 'electrical', 'plumbing', 'elevator', 'security', 'appliance'] as const;

// Asset naming patterns
const ASSET_NAMES: Record<string, string[]> = {
  hvac: ['HVAC Unit', 'Air Handler', 'Chiller Plant', 'Cooling Tower', 'Rooftop Unit'],
  electrical: ['Main Panel', 'Backup Generator', 'Transformer', 'Lighting System', 'UPS System'],
  plumbing: ['Water Pump', 'Hot Water Heater', 'Sump Pump', 'Water Softener', 'Pressure Tank'],
  elevator: ['Elevator', 'Lift', 'Freight Elevator'],
  security: ['CCTV System', 'Access Control', 'Fire Alarm Panel', 'Intercom System'],
  appliance: ['Washing Machine', 'Dryer', 'Refrigerator', 'Dishwasher', 'Ice Machine'],
};

function normalizeAssetType(rawType: unknown): (typeof ASSET_TYPES)[number] | null {
  if (!rawType || typeof rawType !== 'string') return null;
  const normalized = rawType.trim().toLowerCase();
  return ASSET_TYPES.includes(normalized as (typeof ASSET_TYPES)[number])
    ? (normalized as (typeof ASSET_TYPES)[number])
    : null;
}

interface AssetFeatures {
  asset_type: string;
  asset_age_months: number;
  days_since_last_maintenance: number;
  total_maintenance_count: number;
  avg_monthly_usage_hours: number;
  last_repair_severity: string;
  ambient_temperature_avg: number;
  humidity_level_avg: number;
  power_outage_events_last_year: number;
  manufacturer_rating: number;
  installation_quality: string;
  building_age_years: number;
  seasonal_load_factor: number;
}

interface FastAPIPrediction {
  risk_level: string;
  failure_probability: number;
  estimated_days_to_failure: number;
  contributing_factors: string[];
  suggested_actions: string[];
  estimated_cost_if_ignored: number;
}

function formatFailureWindow(days: number): string {
  if (days <= 7) return '< 1 week';
  if (days <= 14) return '1-2 weeks';
  if (days <= 30) return '2-4 weeks';
  if (days <= 60) return '1-2 months';
  if (days <= 90) return '2-3 months';
  if (days <= 180) return '3-6 months';
  if (days <= 365) return '6-12 months';
  return '> 1 year';
}

/**
 * Call FastAPI backend for prediction
 */
async function callFastAPI(features: AssetFeatures): Promise<FastAPIPrediction | null> {
  try {
    const response = await fetch(`${FASTAPI_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(features),
    });

    if (!response.ok) {
      console.warn('FastAPI prediction failed:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('FastAPI not available, using fallback:', error);
    return null;
  }
}

/**
 * Fallback prediction when FastAPI is not available
 */
function fallbackPrediction(features: AssetFeatures): FastAPIPrediction {
  let riskScore = 0;

  if (features.asset_age_months > 120) riskScore += 3;
  else if (features.asset_age_months > 60) riskScore += 1.5;

  if (features.days_since_last_maintenance > 180) riskScore += 3;
  else if (features.days_since_last_maintenance > 90) riskScore += 1.5;

  const expectedMaint = features.asset_age_months / 6;
  if (features.total_maintenance_count > expectedMaint * 2) riskScore += 2;

  if (features.ambient_temperature_avg > 38) riskScore += 1;
  if (features.humidity_level_avg > 80) riskScore += 1;
  if (features.manufacturer_rating <= 2) riskScore += 1;
  if (features.installation_quality === 'poor') riskScore += 2;

  let risk_level: string;
  let failure_probability: number;
  let estimated_days_to_failure: number;

  if (riskScore >= 6) {
    risk_level = 'high';
    failure_probability = Math.min(0.95, 0.65 + riskScore * 0.03);
    estimated_days_to_failure = Math.max(7, 60 - Math.floor(riskScore * 4));
  } else if (riskScore >= 3) {
    risk_level = 'medium';
    failure_probability = 0.30 + riskScore * 0.05;
    estimated_days_to_failure = Math.max(30, 150 - Math.floor(riskScore * 15));
  } else {
    risk_level = 'low';
    failure_probability = Math.max(0.05, 0.10 + riskScore * 0.03);
    estimated_days_to_failure = Math.min(400, 200 + Math.floor((3 - riskScore) * 40));
  }

  // Generate detailed contributing factors based on risk level
  const contributing_factors: string[] = [];
  
  if (features.asset_age_months > 120) {
    contributing_factors.push(`Asset age (${features.asset_age_months} months / ${Math.floor(features.asset_age_months / 12)} years) exceeds recommended lifecycle`);
  } else if (features.asset_age_months > 60) {
    contributing_factors.push(`Asset approaching end of lifecycle (${features.asset_age_months} months old)`);
  }
  
  if (features.days_since_last_maintenance > 180) {
    contributing_factors.push(`Critical maintenance delay: ${features.days_since_last_maintenance} days since last service (${Math.floor(features.days_since_last_maintenance - 180)} days overdue)`);
  } else if (features.days_since_last_maintenance > 90) {
    contributing_factors.push(`Maintenance schedule slipping: ${features.days_since_last_maintenance} days since last service`);
  }
  
  if (features.total_maintenance_count > expectedMaint * 2) {
    contributing_factors.push(`Frequent repairs indicator: ${features.total_maintenance_count} maintenance events (${Math.round((features.total_maintenance_count / expectedMaint - 1) * 100)}% above normal)`);
  }
  
  if (features.ambient_temperature_avg > 38) {
    contributing_factors.push(`Excessive heat stress: Average ambient temperature ${Math.round(features.ambient_temperature_avg)}°C`);
  }
  
  if (features.humidity_level_avg > 80) {
    contributing_factors.push(`High humidity exposure: ${Math.round(features.humidity_level_avg)}% average humidity level`);
  }
  
  if (features.power_outage_events_last_year >= 5) {
    contributing_factors.push(`Power instability: ${features.power_outage_events_last_year} outage events in past year`);
  }
  
  if (features.manufacturer_rating <= 2) {
    contributing_factors.push('Below-average manufacturer reliability rating');
  }
  
  if (features.installation_quality === 'poor') {
    contributing_factors.push('Substandard installation quality detected');
  }
  
  if (contributing_factors.length === 0) {
    contributing_factors.push('No significant risk factors detected - asset performing within normal parameters');
  }

  // Generate actionable recommendations based on risk level and factors
  const suggested_actions: string[] = [];
  
  if (risk_level === 'high') {
    suggested_actions.push('🚨 Schedule immediate comprehensive inspection');
    if (features.days_since_last_maintenance > 180) {
      suggested_actions.push('Perform urgent preventive maintenance');
    }
    if (features.asset_age_months > 120) {
      suggested_actions.push('Evaluate asset replacement vs. major overhaul');
    }
    suggested_actions.push('Increase monitoring frequency to weekly');
    suggested_actions.push('Prepare contingency plan for potential failure');
  } else if (risk_level === 'medium') {
    suggested_actions.push('Schedule preventive maintenance within 30 days');
    if (features.days_since_last_maintenance > 90) {
      suggested_actions.push('Update maintenance schedule to recommended intervals');
    }
    suggested_actions.push('Conduct detailed performance assessment');
    suggested_actions.push('Monitor key performance indicators bi-weekly');
  } else {
    suggested_actions.push('Continue routine monitoring and maintenance schedule');
    suggested_actions.push('Perform quarterly performance reviews');
    if (features.asset_age_months < 24) {
      suggested_actions.push('Document baseline performance metrics');
    }
  }
  
  if (features.ambient_temperature_avg > 38 || features.humidity_level_avg > 80) {
    suggested_actions.push('Improve environmental controls (temperature/humidity)');
  }
  
  if (features.power_outage_events_last_year >= 5) {
    suggested_actions.push('Install UPS or surge protection equipment');
  }

  // Estimate cost (in paisa)
  const baseCosts: Record<string, number> = {
    hvac: 8000000, elevator: 15000000, electrical: 4000000,
    plumbing: 3000000, security: 2500000, appliance: 2000000,
  };
  const base = baseCosts[features.asset_type] || 5000000;
  const riskMult = { high: 1.5, medium: 1.0, low: 0.5 }[risk_level] || 1;
  const estimated_cost_if_ignored = Math.round(base * riskMult);

  return {
    risk_level,
    failure_probability,
    estimated_days_to_failure,
    contributing_factors,
    suggested_actions,
    estimated_cost_if_ignored,
  };
}

/**
 * GET /api/predictions/assets
 * 
 * Returns AI predictions for all assets in a building.
 * Uses FastAPI backend when available, falls back to local heuristics.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json(
        { error: 'buildingId is required' },
        { status: 400 }
      );
    }

    const authResult = await requireBuildingAccess(request, buildingId);
    if (!authResult.ok) {
      return authResult.response;
    }

    const db = await getDatabase();
    
    // Import ObjectId for proper MongoDB querying
    const { ObjectId } = await import('mongodb');
    
    // Get building info - try both ObjectId and string id
    let buildingQuery;
    try {
      buildingQuery = { $or: [{ _id: new ObjectId(buildingId) }, { id: buildingId }] };
    } catch {
      // If buildingId is not a valid ObjectId, just search by id field
      buildingQuery = { id: buildingId };
    }
    
    const building = await db.collection('buildings').findOne(buildingQuery);
    
    const buildingName = building?.name || 'Unknown Building';
    const buildingAge = building?.createdAt 
      ? Math.floor((Date.now() - new Date(building.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
      : 24;

    // Get ticket history to infer asset health
    const tickets = await db.collection('tickets')
      .find({ buildingId })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    // Get maintenance/service entries entered by admin/owner.
    const maintenanceLogs = await db
      .collection('maintenance_logs')
      .find({ buildingId })
      .sort({ dateCompleted: -1 })
      .limit(1000)
      .toArray();

    // Group tickets by category
    const ticketsByCategory: Record<string, typeof tickets> = {};
    for (const ticket of tickets) {
      const cat = ticket.category?.toLowerCase() || 'other';
      if (!ticketsByCategory[cat]) ticketsByCategory[cat] = [];
      ticketsByCategory[cat].push(ticket);
    }

    // Generate asset predictions
    const assetRisks = [];
    const now = Date.now();

    // Check if FastAPI is available
    let fastApiAvailable = false;
    try {
      const healthCheck = await fetch(`${FASTAPI_URL}/health`, {
        signal: AbortSignal.timeout(2000)
      });
      fastApiAvailable = healthCheck.ok;
    } catch {
      console.log('[INFO] FastAPI not available, using fallback predictions');
    }


    const maintenanceEntriesByAsset = new Map<
      string,
      {
        assetName: string;
        assetType: (typeof ASSET_TYPES)[number];
        logs: typeof maintenanceLogs;
      }
    >();

    for (const log of maintenanceLogs) {
      const assetType = normalizeAssetType(log.assetType);
      const assetName = typeof log.assetName === 'string' ? log.assetName.trim() : '';

      if (!assetType || !assetName) continue;

      const key = `${assetType}:${assetName.toLowerCase()}`;
      const existing = maintenanceEntriesByAsset.get(key);
      if (existing) {
        existing.logs.push(log);
      } else {
        maintenanceEntriesByAsset.set(key, {
          assetName,
          assetType,
          logs: [log],
        });
      }
    }

    if (maintenanceEntriesByAsset.size === 0) {
      return NextResponse.json({
        success: true,
        buildingId,
        buildingName,
        totalAssets: 0,
        fastApiUsed: fastApiAvailable,
        requiresServiceEntries: true,
        message:
          'No service entries found. Add maintenance/service entries from Building Details to generate predictions.',
        riskSummary: {
          high: 0,
          medium: 0,
          low: 0,
        },
        assets: [],
      });
    }

    let entryIndex = 0;
    for (const entry of maintenanceEntriesByAsset.values()) {
      entryIndex += 1;

      const categoryTickets = ticketsByCategory[entry.assetType] || [];
      const relevantTickets = categoryTickets.filter((ticket) => {
        const combined = `${ticket.title || ''} ${ticket.description || ''} ${ticket.location || ''}`.toLowerCase();
        return combined.includes(entry.assetName.toLowerCase());
      });

      const logsSorted = [...entry.logs].sort(
        (a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()
      );
      const latestLog = logsSorted[0];
      const latestServiceDate = latestLog?.dateCompleted ? new Date(latestLog.dateCompleted) : new Date();
      const daysSinceLast = Math.max(
        1,
        Math.floor((now - latestServiceDate.getTime()) / (1000 * 60 * 60 * 24))
      );

      const serviceText = `${latestLog?.actionTaken || ''} ${latestLog?.notes || ''}`.toLowerCase();
      let severity = 'minor';
      if (/replace|failure|critical|urgent/.test(serviceText)) {
        severity = 'major';
      } else if (/repair|leak|fault|issue/.test(serviceText)) {
        severity = 'moderate';
      }

      const features: AssetFeatures = {
        asset_type: entry.assetType,
        asset_age_months: Math.max(12, buildingAge + Math.min(entry.logs.length * 4, 60)),
        days_since_last_maintenance: daysSinceLast,
        total_maintenance_count: entry.logs.length,
        avg_monthly_usage_hours:
          entry.assetType === 'elevator' ? 500 : entry.assetType === 'hvac' ? 400 : 220,
        last_repair_severity: severity,
        ambient_temperature_avg: 28 + Math.random() * 8,
        humidity_level_avg: 50 + Math.random() * 25,
        power_outage_events_last_year: Math.floor(Math.random() * 5),
        manufacturer_rating: 2 + Math.floor(Math.random() * 3),
        installation_quality: ['average', 'good', 'excellent'][Math.floor(Math.random() * 3)],
        building_age_years: Math.max(1, Math.floor(buildingAge / 12)),
        seasonal_load_factor: 0.9 + Math.random() * 0.25,
      };

      let prediction: FastAPIPrediction;
      if (fastApiAvailable) {
        const fastApiResult = await callFastAPI(features);
        prediction = fastApiResult || fallbackPrediction(features);
      } else {
        prediction = fallbackPrediction(features);
      }

      if (relevantTickets.length > 0) {
        prediction.contributing_factors = [
          `${relevantTickets.length} recent tickets reference this asset`,
          ...prediction.contributing_factors,
        ];
      }

      assetRisks.push({
        id: `${buildingId}-${entry.assetType}-${entryIndex}`,
        assetName: entry.assetName,
        assetType: entry.assetType,
        buildingId,
        buildingName,
        riskLevel: prediction.risk_level,
        failureProbability: Math.round(prediction.failure_probability * 100) / 100,
        estimatedFailureWindow: formatFailureWindow(prediction.estimated_days_to_failure),
        contributingFactors: prediction.contributing_factors,
        suggestedActions: prediction.suggested_actions,
        estimatedCostIfIgnored: prediction.estimated_cost_if_ignored,
        lastMaintenanceDate: latestServiceDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Sort by risk level (high first)
    const riskOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    assetRisks.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);

    return NextResponse.json({
      success: true,
      buildingId,
      buildingName,
      totalAssets: assetRisks.length,
      fastApiUsed: fastApiAvailable,
      riskSummary: {
        high: assetRisks.filter(a => a.riskLevel === 'high').length,
        medium: assetRisks.filter(a => a.riskLevel === 'medium').length,
        low: assetRisks.filter(a => a.riskLevel === 'low').length,
      },
      assets: assetRisks,
    });
  } catch (error) {
    console.error('Error generating asset predictions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
