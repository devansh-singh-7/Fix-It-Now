import { NextResponse } from 'next/server';
import { updateTicketStatusWithAuth } from '@/app/lib/database';
import type { TicketStatus, UserRole } from '@/app/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ticketId, status, userId, userName, role, note, completionImageUrls, completionImagePublicIds } = body;

    if (!ticketId || !status || !userId || !userName || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: ticketId, status, userId, userName, role'
        },
        { status: 400 }
      );
    }

    // Use the new authorized update function
    const result = await updateTicketStatusWithAuth(
      ticketId,
      status as TicketStatus,
      userId,
      userName,
      role as UserRole,
      note,
      completionImageUrls,
      completionImagePublicIds
    );

    if (!result.success) {
      const errorMessage = result.error || 'Not authorized to update ticket';
      const lowerError = errorMessage.toLowerCase();

      let statusCode = 403;
      if (lowerError.includes('not found')) {
        statusCode = 404;
      } else if (lowerError.includes('cannot transition')) {
        statusCode = 400;
      }

      console.warn('[tickets/update-status] Rejected request:', {
        ticketId,
        userId,
        role,
        status,
        error: errorMessage,
      });

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: statusCode }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update ticket status'
      },
      { status: 500 }
    );
  }
}
