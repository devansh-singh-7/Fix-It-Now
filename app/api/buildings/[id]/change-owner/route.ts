import { NextRequest, NextResponse } from 'next/server';
import { changeBuildingOwner } from '@/app/lib/database';

/**
 * POST /api/buildings/[id]/change-owner
 * Change the owner of a building
 * Only the current building owner can change ownership
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = request.headers.get('x-user-id');
    const body = await request.json();

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { newOwnerEmail } = body;

    if (!newOwnerEmail || !newOwnerEmail.trim()) {
      return NextResponse.json(
        { success: false, error: 'New owner email is required' },
        { status: 400 }
      );
    }

    const result = await changeBuildingOwner(id, uid, newOwnerEmail.trim());

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      newOwner: result.newOwner
    });
  } catch (error) {
    console.error('Error changing building owner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change building owner' },
      { status: 500 }
    );
  }
}
