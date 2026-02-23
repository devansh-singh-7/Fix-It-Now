import { NextResponse } from 'next/server';
import { getUserRole } from '@/app/lib/database';

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

    const role = await getUserRole(uid);

    return NextResponse.json({
      success: true,
      data: { role }
    });
  } catch (error) {
    console.error('Get user role error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get user role'
      },
      { status: 500 }
    );
  }
}
