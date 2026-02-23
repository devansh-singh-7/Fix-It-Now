import { NextResponse } from 'next/server';
import { isSuperAdmin, createUserProfile } from '@/app/lib/database';

/**
 * Create admin user API endpoint
 * Only accessible by super admin
 * 
 * Note: Firebase Auth user must be created client-side first,
 * then this endpoint creates the MongoDB profile.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestorUid, uid, name, email, buildingId, buildingName } = body;

    if (!requestorUid || !uid || !name || !email) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: requestorUid, uid, name, email' 
        },
        { status: 400 }
      );
    }

    // Check if requestor is super admin
    const isSuper = await isSuperAdmin(requestorUid);
    if (!isSuper) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized. Only the super admin can create admin accounts.' 
        },
        { status: 403 }
      );
    }

    // Create user profile in MongoDB
    await createUserProfile({
      uid,
      name,
      email,
      role: 'admin',
      buildingId: buildingId || undefined,
      buildingName: buildingName || undefined,
      isActive: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user profile created successfully',
      uid
    });
  } catch (error) {
    console.error('Create admin error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create admin user profile'
      },
      { status: 500 }
    );
  }
}
