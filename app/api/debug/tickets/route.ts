import { NextResponse } from 'next/server';
import clientPromise from '@/app/lib/mongodb';

/**
 * GET /api/debug/tickets
 * Debug endpoint to check raw tickets in MongoDB
 */
export async function GET() {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Get all tickets from the collection
        const tickets = await db.collection('tickets')
            .find({})
            .limit(20)
            .toArray();

        // Get collection stats
        const count = await db.collection('tickets').countDocuments();

        // Get sample of one ticket to show structure
        const sample = tickets[0] || null;

        return NextResponse.json({
            success: true,
            totalCount: count,
            ticketsReturned: tickets.length,
            sampleTicket: sample,
            allTickets: tickets.map(t => ({
                id: t._id?.toString(),
                title: t.title,
                status: t.status,
                buildingId: t.buildingId,
                createdBy: t.createdBy,
                assignedTo: t.assignedTo,
                createdAt: t.createdAt
            }))
        });
    } catch (error) {
        console.error('Debug tickets error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
