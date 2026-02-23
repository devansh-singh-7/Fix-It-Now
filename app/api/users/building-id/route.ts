import { NextResponse } from 'next/server';
import { getUserBuildingId } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'uid parameter is required' 
        },
        { status: 400 }
      );
    }

    const buildingId = await getUserBuildingId(uid);

    return NextResponse.json({
      success: true,
      data: { buildingId }
    });
  } catch (error) {
    console.error('Get user building ID error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get building ID'
      },
      { status: 500 }
    );
  }
}
