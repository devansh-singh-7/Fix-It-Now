import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, deleteTicket, updateTicketStatusWithAuth, canUserDeleteTicket } from '@/app/lib/database';
import type { UserRole, TicketStatus } from '@/app/lib/types';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/tickets/[id]
 * Get a single ticket by ID with authorization check
 */
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: ticketId } = await context.params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('uid');
        const role = searchParams.get('role') as UserRole;

        if (!userId || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role' },
                { status: 400 }
            );
        }

        const { ticket, authorized } = await getTicketById(ticketId, userId, role);

        if (!authorized) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to view this ticket' },
                { status: 403 }
            );
        }

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        // Also check if user can delete this ticket (for UI)
        const { canDelete } = await canUserDeleteTicket(ticketId, userId, role);

        return NextResponse.json({
            success: true,
            data: ticket,
            permissions: {
                canDelete,
            }
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get ticket' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/tickets/[id]
 * Update ticket status with authorization and workflow validation
 */
export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: ticketId } = await context.params;
        const body = await request.json();
        const { status, userId, userName, role, note } = body;

        if (!status || !userId || !userName || !role) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Missing required fields: status, userId, userName, role'
                },
                { status: 400 }
            );
        }

        const result = await updateTicketStatusWithAuth(
            ticketId,
            status as TicketStatus,
            userId,
            userName,
            role as UserRole,
            note
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update ticket error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update ticket' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tickets/[id]
 * Delete a ticket with authorization check
 */
export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: ticketId } = await context.params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('uid');
        const role = searchParams.get('role') as UserRole;

        if (!userId || !role) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role' },
                { status: 400 }
            );
        }

        const result = await deleteTicket(ticketId, userId, role);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 403 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete ticket error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete ticket' },
            { status: 500 }
        );
    }
}
