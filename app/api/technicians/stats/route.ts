import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/technicians/stats
 * 
 * Returns ticket statistics (optionally filtered by buildingId)
 * If buildingId is provided, returns stats for that building only
 * If no buildingId, returns global stats (for admin view)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    const db = await getDatabase();
    const ticketsCollection = db.collection('tickets');

    // Build query based on whether buildingId is provided
    const query: Record<string, string> = {};
    if (buildingId) {
      query.buildingId = buildingId;
    }

    // Get ticket statistics
    const totalTickets = await ticketsCollection.countDocuments(query);
    const openTickets = await ticketsCollection.countDocuments({ ...query, status: 'open' });
    const inProgressTickets = await ticketsCollection.countDocuments({ 
      ...query,
      status: { $in: ['assigned', 'accepted', 'in_progress'] }
    });
    const completedTickets = await ticketsCollection.countDocuments({ ...query, status: 'completed' });

    console.log(`[Technicians Stats] Total: ${totalTickets}, Open: ${openTickets}, InProgress: ${inProgressTickets}, Completed: ${completedTickets}${buildingId ? ` (building: ${buildingId})` : ' (all buildings)'}`);

    return NextResponse.json({
      success: true,
      data: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        completed: completedTickets
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Technicians Stats] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch technician statistics',
        data: { total: 0, open: 0, inProgress: 0, completed: 0 }
      },
      { status: 500 }
    );
  }
}
