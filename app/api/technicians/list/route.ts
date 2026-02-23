import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { Filter, Document } from 'mongodb';

// Query interface for technician filter
interface TechnicianQuery extends Filter<Document> {
  role: string;
  buildingId?: string;
}

/**
 * GET /api/technicians/list
 * 
 * Fetch all technicians (optionally filtered by buildingId)
 * If buildingId is provided, returns only technicians for that building
 * If no buildingId, returns all technicians (for admin view)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    const db = await getDatabase();

    // Build query based on whether buildingId is provided
    const query: TechnicianQuery = { role: 'technician' };
    if (buildingId) {
      query.buildingId = buildingId;
    }

    // Fetch technicians from MongoDB
    const technicians = await db.collection('users')
      .find(query)
      .toArray();

    console.log(`[Technicians List] Found ${technicians.length} technicians${buildingId ? ` for building ${buildingId}` : ' (all buildings)'}`);

    // Get ticket counts for each technician
    const technicianData = await Promise.all(
      technicians.map(async (tech) => {
        const assignedTickets = await db.collection('tickets')
          .countDocuments({ assignedTo: tech.firebaseUid });

        const completedTickets = await db.collection('tickets')
          .countDocuments({
            assignedTo: tech.firebaseUid,
            status: 'completed'
          });

        return {
          uid: tech.firebaseUid || tech.uid,
          name: tech.name || tech.displayName || 'Unknown',
          email: tech.email,
          phoneNumber: tech.phoneNumber,
          buildingId: tech.buildingId,
          buildingName: tech.buildingName,
          isActive: tech.isActive !== undefined ? tech.isActive : true,
          awaitApproval: tech.awaitApproval || false,
          assignedTickets,
          completedTickets,
          rating: tech.rating || 0,
          specialties: tech.specialties || [],
          createdAt: tech.createdAt ? tech.createdAt.toISOString() : new Date().toISOString(),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: technicianData,
      count: technicianData.length
    });

  } catch (error) {
    console.error('[Technicians List] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch technicians',
        data: []
      },
      { status: 500 }
    );
  }
}
