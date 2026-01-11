import { NextResponse } from 'next/server';
import { updateUserBuilding } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, buildingId, buildingName } = body;

    if (!uid || !buildingId || !buildingName) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: uid, buildingId, buildingName' 
        },
        { status: 400 }
      );
    }

    await updateUserBuilding(uid, buildingId, buildingName);

    return NextResponse.json({
      success: true,
      message: 'Building updated successfully'
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
