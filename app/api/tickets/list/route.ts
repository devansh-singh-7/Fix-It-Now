import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { UserRole } from '@/app/lib/types';

/**
 * GET /api/tickets/list
 * 
 * Uses the EXACT same aggregation pipeline as dashboard stats API
 * to ensure consistent data retrieval and ID handling.
 */
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
    
    // Build filter EXACTLY like dashboard stats API
    const filter: Record<string, unknown> = {};

    // Only add buildingId filter if it's a valid value
    if (buildingId && buildingId !== 'null' && buildingId !== 'undefined' && buildingId !== '') {
      filter.buildingId = buildingId;
    }

    if (role === 'technician') {
      filter.assignedTo = uid;
    } else if (role === 'resident') {
      filter.createdBy = uid;
    }
    // Admin sees all tickets (filtered by building if specified, otherwise all)

    console.log('[API tickets/list] Using filter:', JSON.stringify(filter));

    // Use the EXACT SAME aggregation pipeline as dashboard stats API
    // This is copied directly from /api/dashboard/stats/route.ts
    const tickets = await db.collection('tickets').aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      // NO $limit - we want ALL tickets, not just 10
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "firebaseUid",
          as: "assignedTechnician"
        }
      },
      {
        $unwind: {
          path: "$assignedTechnician",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          // EXACT same projection as dashboard stats API
          id: { $ifNull: ["$id", { $toString: "$_id" }] },
          title: 1,
          description: 1,
          status: 1,
          priority: 1,
          category: 1,
          location: 1,
          buildingId: 1,
          buildingName: 1,
          createdBy: 1,
          createdByName: 1,
          assignedTo: 1,
          assignedToName: 1,
          assignedTechnicianPhone: "$assignedTechnician.phoneNumber",
          contactPhone: 1,
          imageUrls: 1,
          timeline: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1
        }
      }
    ]).toArray();

    console.log('[API tickets/list] Aggregation returned:', tickets.length, 'tickets');

    // Map tickets using the EXACT same mapping as dashboard stats API
    const mappedTickets = tickets.map((ticket: any) => ({
      ...ticket,
      // Ensure dates are Date objects or strings as expected by frontend
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      building: ticket.buildingName || 'Unknown',
      assigned_technician_phone: ticket.assignedTechnicianPhone
    }));

    console.log('[API tickets/list] Mapped', mappedTickets.length, 'tickets');
    if (mappedTickets.length > 0) {
      console.log('[API tickets/list] First ticket ID:', mappedTickets[0].id);
      console.log('[API tickets/list] First ticket title:', mappedTickets[0].title);
    }

    return NextResponse.json({
      success: true,
      data: mappedTickets,
      count: mappedTickets.length
    });
  } catch (error) {
    console.error('[API tickets/list] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get tickets'
      },
      { status: 500 }
    );
  }
}
