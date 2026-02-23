import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * GET /api/debug/db-check
 * Debug endpoint to check database connectivity and ticket count
 */
export async function GET() {
    try {
        const db = await getDatabase();

        // Check connection by getting collection names
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        // Count tickets
        const ticketCount = await db.collection('tickets').countDocuments();

        // Get sample tickets (first 3)
        const sampleTickets = await db.collection('tickets')
            .find({})
            .limit(3)
            .toArray();

        // Count users
        const userCount = await db.collection('users').countDocuments();

        return NextResponse.json({
            success: true,
            dbName: db.databaseName,
            collections: collectionNames,
            ticketCount,
            userCount,
            sampleTickets: sampleTickets.map(t => ({
                id: t.id,
                title: t.title,
                status: t.status,
                buildingId: t.buildingId,
                createdBy: t.createdBy
            }))
        });
    } catch (error) {
        console.error('Database check error:', error);
        return NextResponse.json(
            {
                success: false,
                error: String(error),
                message: 'Database connection failed'
            },
            { status: 500 }
        );
    }
}
