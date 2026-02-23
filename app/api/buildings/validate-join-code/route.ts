import { NextResponse } from 'next/server';
import { getBuildingByJoinCode } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const joinCode = searchParams.get('joinCode');

    if (!joinCode) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameter: joinCode' 
        },
        { status: 400 }
      );
    }

    const building = await getBuildingByJoinCode(joinCode);

    if (!building) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid building join code'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: building.id,
        name: building.name
      }
    });
  } catch (error) {
    console.error('Validate join code error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate join code'
      },
      { status: 500 }
    );
  }
}
