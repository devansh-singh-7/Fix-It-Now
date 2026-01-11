import { NextResponse } from 'next/server';
import { assignTicket, getUserRole } from '@/app/lib/database';

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

    // Verify the assigner is an admin
    const assignerRole = await getUserRole(assignedBy);
    if (assignerRole !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only admins can assign tickets to technicians'
        },
        { status: 403 }
      );
    }

    // Verify the technician exists and has the correct role
    const technicianRole = await getUserRole(technicianId);
    if (technicianRole !== 'technician') {
      return NextResponse.json(
        {
          success: false,
          error: 'The selected user is not a technician'
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
        error: 'Failed to assign ticket'
      },
      { status: 500 }
    );
  }
}
