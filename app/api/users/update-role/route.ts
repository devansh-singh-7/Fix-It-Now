import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { UserRole } from '@/app/lib/types';

/**
 * POST /api/users/update-role
 *
 * Update a user's role (admin only)
 * Allows promoting users to technician role
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, newRole, adminUid } = body;

    if (!email || !newRole || !adminUid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: email, newRole, adminUid',
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: UserRole[] = ['admin', 'owner', 'technician', 'resident'];
    if (!validRoles.includes(newRole as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid role. Must be one of: admin, owner, technician, resident',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify admin user
    const admin = await db.collection('users').findOne({ firebaseUid: adminUid });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only admins can update user roles',
        },
        { status: 403 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await db.collection('users').findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found with this email address',
        },
        { status: 404 }
      );
    }

    // Update user role
    const result = await db.collection('users').updateOne(
      { firebaseUid: user.firebaseUid },
      {
        $set: {
          role: newRole,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update user role',
        },
        { status: 500 }
      );
    }

    console.log(`[Update Role] Admin ${adminUid} updated ${email} to role: ${newRole}`);

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        name: user.name || user.displayName,
        previousRole: user.role,
        newRole,
        uid: user.firebaseUid,
      },
    });
  } catch (error) {
    console.error('[Update Role] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user role',
      },
      { status: 500 }
    );
  }
}
