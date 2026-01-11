import { NextRequest, NextResponse } from 'next/server';
import { getBuilding, updateBuilding, deleteBuilding, getTechniciansForBuilding } from '@/app/lib/database';

/**
 * GET /api/buildings/[id]
 * Get building details by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const uid = request.headers.get('x-user-id');

        if (!uid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const building = await getBuilding(id);

        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        // Get technicians count for this building
        const technicians = await getTechniciansForBuilding(id);

        return NextResponse.json({
            success: true,
            data: {
                ...building,
                technicianCount: technicians.length
            }
        });
    } catch (error) {
        console.error('Error getting building:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get building' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/buildings/[id]
 * Update building details
 */
export async function PUT(
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

        const { name, address } = body;

        if (!name && !address) {
            return NextResponse.json(
                { success: false, error: 'No updates provided' },
                { status: 400 }
            );
        }

        const result = await updateBuilding(id, uid, { name, address });

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        // ----------------------------------------------------------------------
        // DENORMALIZATION SYNC: Propagate building name changes to users
        // ----------------------------------------------------------------------
        if (name) {
            console.log(`🔄 Building ${id} renamed to "${name}". Propagating to users...`);
            const { getDatabase } = await import('@/app/lib/mongodb');
            const db = await getDatabase();
            
            const userUpdateResult = await db.collection('users').updateMany(
                { buildingId: id },
                { $set: { buildingName: name } }
            );
            
            console.log(`✅ Propagated building name change to ${userUpdateResult.modifiedCount} users.`);
        }
        // ----------------------------------------------------------------------

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating building:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update building' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/buildings/[id]
 * Soft delete a building
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const uid = request.headers.get('x-user-id');

        if (!uid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const result = await deleteBuilding(id, uid);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting building:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete building' },
            { status: 500 }
        );
    }
}
