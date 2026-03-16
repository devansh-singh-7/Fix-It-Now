import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';

/**
 * POST /api/technicians/assign-building
 *
 * Assign or update a technician's building (admin only)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { technicianUid, buildingId, adminUid } = body;

    if (!technicianUid || !adminUid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: technicianUid, adminUid',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Verify admin user
    const admin = await db.collection('users').findOne({ firebaseUid: adminUid });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Only admins can assign buildings',
        },
        { status: 403 }
      );
    }

    // Verify technician exists
    const technician = await db.collection('users').findOne({ firebaseUid: technicianUid });
    if (!technician) {
      return NextResponse.json(
        {
          success: false,
          error: 'Technician not found',
        },
        { status: 404 }
      );
    }

    if (technician.role !== 'technician') {
      return NextResponse.json(
        {
          success: false,
          error: 'User is not a technician',
        },
        { status: 400 }
      );
    }

    // Get building details if buildingId provided
    let buildingName = null;
    if (buildingId && buildingId !== 'null') {
      const building = await db.collection('buildings').findOne({ id: buildingId });
      buildingName = building?.name || null;
    }

    // Update technician's building assignment
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (buildingId && buildingId !== 'null') {
      updateData.buildingId = buildingId;
      updateData.buildingName = buildingName;
    } else {
      // Remove building assignment
      updateData.buildingId = null;
      updateData.buildingName = null;
    }

    const result = await db
      .collection('users')
      .updateOne({ firebaseUid: technicianUid }, { $set: updateData });

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update building assignment',
        },
        { status: 500 }
      );
    }

    console.log(
      `[Assign Building] Admin ${adminUid} assigned technician ${technicianUid} to building ${buildingId || 'none'}`
    );

    return NextResponse.json({
      success: true,
      data: {
        technicianUid,
        buildingId: buildingId || null,
        buildingName: buildingName || null,
      },
    });
  } catch (error) {
    console.error('[Assign Building] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign building',
      },
      { status: 500 }
    );
  }
}
