import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { UserRole } from '@/app/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const role = searchParams.get('role') as UserRole;
    const buildingId = searchParams.get('buildingId');

    if (!uid || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: uid, role'
        },
        { status: 400 }
      );
    }

    console.log('[API tickets/list] Fetching tickets:', { uid, role, buildingId });

    const db = await getDatabase();
    let filter: Record<string, unknown> = {};

    // Build filter based on role
    if (role === 'admin') {
      // Admin: if buildingId exists, filter by it; otherwise fetch all
      if (buildingId && buildingId !== 'null' && buildingId !== 'undefined') {
        filter = { buildingId };
      }
      // If no buildingId, filter is empty (fetch all tickets)
    } else if (role === 'technician') {
      // Technician: only see assigned tickets
      filter = { assignedTo: uid };
      if (buildingId && buildingId !== 'null' && buildingId !== 'undefined') {
        filter.buildingId = buildingId;
      }
    } else {
      // Resident: only see own tickets
      filter = { createdBy: uid };
      if (buildingId && buildingId !== 'null' && buildingId !== 'undefined') {
        filter.buildingId = buildingId;
      }
    }

    console.log('[API tickets/list] Using filter:', filter);

    const tickets = await db.collection('tickets')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    // Map _id to id for each ticket
    const mappedTickets = tickets.map(t => ({
      ...t,
      id: t.id || t._id?.toString(),
    }));

    console.log('[API tickets/list] Found', mappedTickets.length, 'tickets');

    return NextResponse.json({
      success: true,
      data: mappedTickets,
      count: mappedTickets.length
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get tickets'
      },
      { status: 500 }
    );
  }
}
