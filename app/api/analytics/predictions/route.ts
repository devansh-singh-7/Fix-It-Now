import { NextResponse } from 'next/server';
import { getPredictionSummary } from '@/app/lib/analytics';

/**
 * GET /api/analytics/predictions
 * 
 * Returns AI prediction summary for a building
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

    const predictions = await getPredictionSummary(buildingId);

    return NextResponse.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Prediction summary error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch prediction summary',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
