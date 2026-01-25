import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/buildings/list
 * 
 * Returns all active buildings for the building selector
 */
export async function GET() {
  try {
    const db = await getDatabase();
    
    const buildings = await db.collection('buildings')
      .find({ isActive: { $ne: false } })
      .project({
        _id: 1,
        name: 1,
        address: 1,
        state: 1,
        area: 1,
      })
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      buildings: buildings.map(b => ({
        id: b._id.toString(),
        name: b.name,
        address: b.address,
        state: b.state,
        area: b.area,
      }))
    });
  } catch (error) {
    console.error('Error fetching buildings list:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch buildings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
