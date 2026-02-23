import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';

/**
 * POST /api/notifications/mark-all-read
 * 
 * Mark all notifications as read for a user
 * Body: { uid: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: uid' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .updateMany(
        { userId: uid, read: false },
        { $set: { read: true, updatedAt: new Date() } }
      );

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('[API notifications/mark-all-read] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
