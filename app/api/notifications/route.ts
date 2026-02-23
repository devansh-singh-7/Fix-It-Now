import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';


/**
 * Notification Schema:
 * {
 *   _id: ObjectId,
 *   userId: string,           // Firebase UID of recipient
 *   type: 'ticket' | 'system' | 'announcement' | 'assignment',
 *   title: string,
 *   message: string,
 *   read: boolean,
 *   actionUrl?: string,       // Optional link to related resource
 *   icon: string,             // Emoji icon
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * GET /api/notifications
 * 
 * Get notifications for a user
 * Query params: uid (required), limit (optional, default 20)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: uid' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const notifications = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .find({ userId: uid })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Map _id to id for frontend
    const mappedNotifications = notifications.map(n => ({
      id: n._id.toString(),
      userId: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      actionUrl: n.actionUrl,
      icon: n.icon,
      timestamp: n.createdAt,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt
    }));

    const unreadCount = mappedNotifications.filter(n => !n.read).length;

    return NextResponse.json({
      success: true,
      data: mappedNotifications,
      unreadCount,
      total: mappedNotifications.length
    });
  } catch (error) {
    console.error('[API notifications] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * 
 * Create a new notification
 * Body: { userId, type, title, message, icon, actionUrl? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, title, message, icon, actionUrl } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userId, type, title, message' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const notification = {
      userId,
      type,
      title,
      message,
      icon: icon || '🔔',
      actionUrl: actionUrl || null,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .insertOne(notification);

    return NextResponse.json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...notification
      }
    });
  } catch (error) {
    console.error('[API notifications] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * 
 * Clear all notifications for a user
 * Query params: uid (required)
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: uid' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .deleteMany({ userId: uid });

    return NextResponse.json({
      success: true,
      deleted: result.deletedCount
    });
  } catch (error) {
    console.error('[API notifications] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
