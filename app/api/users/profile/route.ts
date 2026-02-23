/**
 * API Route: Get User Profile
 * 
 * Retrieves user profile from MongoDB using Firebase UID.
 * 
 * GET /api/users/profile?uid={uid}
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { firebaseUid: uid },
      { projection: { _id: 0, uid: 0 } } // Exclude MongoDB _id from response
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add uid field for API compatibility (map firebaseUid to uid)
    return NextResponse.json({ 
      success: true,
      data: {
        ...user,
        uid: user.firebaseUid
      } 
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
