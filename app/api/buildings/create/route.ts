import { NextResponse } from 'next/server';
import { createBuilding } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminUid, name, address, state, area } = body;

    // Validate required fields
    if (!adminUid || !name || !address) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: adminUid, name, address' 
        },
        { status: 400 }
      );
    }

    // Create building with optional state and area
    const building = await createBuilding(adminUid, {
      name: name.trim(),
      address: address.trim(),
      state: state?.trim() || undefined,
      area: area?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      data: building
    });
  } catch (error) {
    console.error('Create building error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create building'
      },
      { status: 500 }
    );
  }
}
