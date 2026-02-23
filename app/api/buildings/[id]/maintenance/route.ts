import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, COLLECTIONS } from '@/app/lib/mongodb';
import { createMaintenanceLogSchema } from '@/app/lib/schemas';
import { requireBuildingAdminAccess } from '@/app/lib/server-auth';

const ML_TRAIN_ENDPOINT = process.env.ML_TRAIN_ENDPOINT || 'http://localhost:8000/api/train';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireBuildingAdminAccess(request, id);
    if (!authResult.ok) {
      return authResult.response;
    }

    const db = await getDatabase();
    const logs = await db
      .collection(COLLECTIONS.MAINTENANCE_LOGS)
      .find({ buildingId: id })
      .sort({ dateCompleted: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      data: logs.map((log) => ({
        ...log,
        _id: log._id.toString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance logs' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireBuildingAdminAccess(request, id);
    if (!authResult.ok) {
      return authResult.response;
    }

    const body = await request.json();
    const parsed = createMaintenanceLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid maintenance log payload',
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const now = new Date();
    const maintenanceLog = {
      buildingId: id,
      maintenanceType: parsed.data.maintenanceType,
      actionTaken: parsed.data.actionTaken.trim(),
      dateCompleted: parsed.data.dateCompleted,
      cost: parsed.data.cost,
      notes: parsed.data.notes.trim(),
      createdAt: now,
      updatedAt: now,
      createdBy: authResult.user.uid,
    };

    const insertResult = await db
      .collection(COLLECTIONS.MAINTENANCE_LOGS)
      .insertOne(maintenanceLog);

    const savedRecord = {
      ...maintenanceLog,
      _id: insertResult.insertedId.toString(),
    };

    try {
      await fetch(ML_TRAIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'maintenance_log_created',
          maintenanceLog: savedRecord,
        }),
      });
    } catch (mlError) {
      console.warn('ML training trigger failed after maintenance log save:', mlError);
    }

    return NextResponse.json(
      {
        success: true,
        data: savedRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance log' },
      { status: 500 }
    );
  }
}
