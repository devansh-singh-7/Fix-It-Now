import { NextResponse } from 'next/server';
import { getTechnicianPerformance } from '@/app/lib/analytics';

/**
 * GET /api/analytics/technicians
 * 
 * Returns technician performance metrics for a building
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

    const performance = await getTechnicianPerformance(buildingId);

    return NextResponse.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Technician performance error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch technician performance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
