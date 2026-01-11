import { NextResponse } from 'next/server';
import { getTicketStatistics } from '@/app/lib/analytics';

/**
 * GET /api/analytics/tickets
 * 
 * Returns detailed ticket statistics for a building
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

    const stats = await getTicketStatistics(buildingId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Ticket statistics error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch ticket statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
