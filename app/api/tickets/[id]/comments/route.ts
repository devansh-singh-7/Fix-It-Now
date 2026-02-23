import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { UserRole, TicketComment } from '@/app/lib/types';

interface RouteContext {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/tickets/[id]/comments
 * Get all comments for a ticket
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

        const client = await clientPromise;
        const db = client.db();

        // Fetch ticket with comments
        const ticket = await db.collection('tickets').findOne({
            _id: new ObjectId(ticketId)
        });

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: ticket.comments || []
        });
    } catch (error) {
        console.error('Get comments error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get comments' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tickets/[id]/comments
 * Add a comment to a ticket
 */
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: ticketId } = await context.params;
        const body = await request.json();
        const { userId, userName, userRole, content } = body;

        if (!userId || !userName || !userRole || !content) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: userId, userName, userRole, content' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        const comment: TicketComment = {
            id: new ObjectId().toString(),
            ticketId,
            userId,
            userName,
            userRole,
            content,
            createdAt: new Date()
        };

        // Add comment to ticket
        const result = await db.collection('tickets').updateOne(
            { _id: new ObjectId(ticketId) },
            {
                $push: { comments: comment },
                $set: { updatedAt: new Date() }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: comment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add comment' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tickets/[id]/comments
 * Delete a comment from a ticket
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
        const commentId = searchParams.get('commentId');

        if (!userId || !role || !commentId) {
            return NextResponse.json(
                { success: false, error: 'Missing required parameters: uid, role, commentId' },
                { status: 400 }
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Get the ticket first to check permissions
        const ticket = await db.collection('tickets').findOne({
            _id: new ObjectId(ticketId)
        });

        if (!ticket) {
            return NextResponse.json(
                { success: false, error: 'Ticket not found' },
                { status: 404 }
            );
        }

        // Find the comment
        const comment = (ticket.comments || []).find((c: TicketComment) => c.id === commentId);
        if (!comment) {
            return NextResponse.json(
                { success: false, error: 'Comment not found' },
                { status: 404 }
            );
        }

        // Only allow deletion by comment author or admin
        if (comment.userId !== userId && role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Not authorized to delete this comment' },
                { status: 403 }
            );
        }

        // Remove comment
        await db.collection('tickets').updateOne(
            { _id: new ObjectId(ticketId) },
            {
                $pull: { comments: { id: commentId } },
                $set: { updatedAt: new Date() }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete comment error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete comment' },
            { status: 500 }
        );
    }
}
