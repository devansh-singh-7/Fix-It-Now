import { NextResponse } from 'next/server';
import { createBuilding, getUserRole } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminUid, name, address, state, area, ownerEmail } = body;

    // Validate required fields
    if (!adminUid || !name || !address) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: adminUid, name, address',
        },
        { status: 400 }
      );
    }

    // SECURITY: Verify user is actually an admin
    const role = await getUserRole(adminUid);
    if (role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only administrators can create buildings',
        },
        { status: 403 }
      );
    }

    // Create building with optional state, area, and ownerEmail
    const building = await createBuilding(adminUid, {
      name: name.trim(),
      address: address.trim(),
      state: state?.trim() || undefined,
      area: area?.trim() || undefined,
      ownerEmail: ownerEmail?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      data: building,
    });
  } catch (error) {
    console.error('Create building error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create building',
      },
      { status: 500 }
    );
  }
}
