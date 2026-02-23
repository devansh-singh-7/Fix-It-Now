import { NextResponse } from 'next/server';
import { updateUserBuilding } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, buildingId, buildingName } = body;

    console.log('[API update-building] Request:', { uid, buildingId, buildingName });

    if (!uid || !buildingId || !buildingName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: uid, buildingId, buildingName' 
        },
        { status: 400 }
      );
    }

    const result = await updateUserBuilding(uid, buildingId, buildingName);

    if (result.matchedCount === 0) {
      console.error('[API update-building] No user found with uid:', uid);
      return NextResponse.json({
        success: false,
        error: 'User not found in database. The user may not be registered.',
        details: { uid, matchedCount: 0 }
      }, { status: 404 });
    }

    console.log('[API update-building] Success:', result);

    return NextResponse.json({
      success: true,
      message: 'Building updated successfully',
      details: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Update building error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update building'
      },
      { status: 500 }
    );
  }
}
