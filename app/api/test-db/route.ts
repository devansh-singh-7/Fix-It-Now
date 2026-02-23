/**
 * API Route: Test Database Connection
 * 
 * Simple endpoint to verify MongoDB is connected and working.
 * 
 * GET /api/test-db
 */

import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get collection stats
    const collections = await db.listCollections().toArray();
    const userCount = await db.collection(COLLECTIONS.USERS).countDocuments();
    const ticketCount = await db.collection(COLLECTIONS.TICKETS).countDocuments();
    
    return NextResponse.json({
      status: 'connected',
      database: 'fixitnow',
      collections: collections.map(c => c.name),
      stats: {
        users: userCount,
        tickets: ticketCount,
      },
      message: 'MongoDB connection successful!',
    });

  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect to database',
      },
      { status: 500 }
    );
  }
}
