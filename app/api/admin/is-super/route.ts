import { NextResponse } from 'next/server';
import { isSuperAdmin } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameter: uid' 
        },
        { status: 400 }
      );
    }

    const isSuper = await isSuperAdmin(uid);

    return NextResponse.json({
      success: true,
      data: {
        isSuperAdmin: isSuper
      }
    });
  } catch (error) {
    console.error('Check super admin error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to check super admin status'
      },
      { status: 500 }
    );
  }
}
