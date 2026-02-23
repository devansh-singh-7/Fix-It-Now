import { NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * PATCH /api/notifications/[id]
 * 
 * Update a notification (mark as read)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (typeof body.read === 'boolean') {
      updateData.read = body.read;
    }

    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('[API notifications/[id]] PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * 
 * Delete a single notification
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    
    const result = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      deleted: true
    });
  } catch (error) {
    console.error('[API notifications/[id]] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
