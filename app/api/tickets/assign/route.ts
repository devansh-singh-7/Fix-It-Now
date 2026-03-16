import { NextResponse } from 'next/server';
import { assignTicket, getUserRole } from '@/app/lib/database';
import { getDatabase } from '@/app/lib/mongodb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, technicianId, technicianName, assignedBy, assignedByName } = body;

    if (!ticketId || !technicianId || !technicianName || !assignedBy || !assignedByName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: ticketId, technicianId, technicianName, assignedBy, assignedByName'
        },
        { status: 400 }
      );
    }

    // Verify the assigner is authorized
    const assignerRole = await getUserRole(assignedBy);
    if (assignerRole !== 'admin' && assignerRole !== 'owner') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only admins or owners can assign tickets to technicians'
        },
        { status: 403 }
      );
    }

    // Verify the technician exists in MongoDB and has the correct role.
    // Support both legacy uid and firebaseUid field names.
    const db = await getDatabase();
    const technician = await db.collection('users').findOne({
      role: 'technician',
      $or: [{ firebaseUid: technicianId }, { uid: technicianId }],
    });

    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected user is not a valid technician'
        },
        { status: 400 }
      );
    }

    await assignTicket(ticketId, technicianId, technicianName, assignedBy, assignedByName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Assign ticket error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign ticket'
      },
      { status: 500 }
    );
  }
}
