import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { UserRole } from '@/app/lib/types';

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * GET /api/users/search
 *
 * Search registered users by email for admin actions like role assignment.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const adminUid = searchParams.get('adminUid')?.trim() || '';
    const limitRaw = Number(searchParams.get('limit') || '8');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 8;

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (!adminUid) {
      return NextResponse.json(
        {
          success: false,
          error: 'adminUid is required',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    const admin = await db.collection('users').findOne(
      {
        $or: [{ firebaseUid: adminUid }, { uid: adminUid }],
      },
      {
        projection: { role: 1 },
      }
    );

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only admins can search users',
        },
        { status: 403 }
      );
    }

    const safeQuery = escapeRegex(query);
    const users = await db
      .collection('users')
      .find(
        {
          email: { $regex: safeQuery, $options: 'i' },
          $or: [{ isActive: true }, { isActive: { $exists: false } }],
        },
        {
          projection: {
            _id: 0,
            firebaseUid: 1,
            uid: 1,
            name: 1,
            displayName: 1,
            email: 1,
            role: 1,
            isActive: 1,
          },
        }
      )
      .sort({ email: 1 })
      .limit(limit)
      .toArray();

    const data = users
      .map((user) => ({
        uid: String(user.firebaseUid || user.uid || ''),
        name: String(user.name || user.displayName || 'Unknown User'),
        email: String(user.email || ''),
        role: (user.role || 'resident') as UserRole,
        isActive: user.isActive !== false,
      }))
      .filter((user) => user.uid && user.email);

    return NextResponse.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('[Users Search] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search users',
      },
      { status: 500 }
    );
  }
}
