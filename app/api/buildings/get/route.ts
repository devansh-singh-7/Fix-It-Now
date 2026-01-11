import { NextResponse } from 'next/server';
import { getBuilding } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const buildingId = searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'buildingId parameter is required' 
        },
        { status: 400 }
      );
    }

    const building = await getBuilding(buildingId);

    if (!building) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Building not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: building
    });
  } catch (error) {
    console.error('Get building error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get building'
      },
      { status: 500 }
    );
  }
}
