import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { getBuilding, getTechniciansForBuilding } from '@/app/lib/database';

async function canManageBuilding(db: Awaited<ReturnType<typeof getDatabase>>, uid: string, buildingAdminId?: string): Promise<boolean> {
    const actor = await db.collection('users').findOne(
        { firebaseUid: uid },
        { projection: { role: 1 } }
    );

    // Platform admins can manage any building.
    if (actor?.role === 'admin') {
        return true;
    }

    // Building owner (or creator on legacy records) can manage their own building.
    return !!buildingAdminId && buildingAdminId === uid;
}

/**
 * GET /api/buildings/[id]/technicians
 * Get all technicians for a building
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

        // Verify building exists
        const building = await getBuilding(id);
        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        const technicians = await getTechniciansForBuilding(id);

        return NextResponse.json({
            success: true,
            data: technicians.map(tech => ({
                // Use firebaseUid if available, otherwise generate from MongoDB _id or email
                uid: tech.uid || (tech as unknown as { firebaseUid?: string }).firebaseUid || `pending_${tech.email}`,
                name: tech.name,
                email: tech.email,
                phoneNumber: tech.phoneNumber,
                isActive: tech.isActive,
                createdAt: tech.createdAt
            }))
        });
    } catch (error) {
        console.error('Error getting technicians:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to get technicians' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/buildings/[id]/technicians
 * Assign a technician to a building (must be a registered user)
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const adminUid = request.headers.get('x-user-id');
        const body = await request.json();

        if (!adminUid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify building exists and actor can manage it
        const building = await getBuilding(id);
        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        const db = await getDatabase();
        const hasAccess = await canManageBuilding(db, adminUid, building.adminId);
        if (!hasAccess) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to manage this building' },
                { status: 403 }
            );
        }

        const { technicianUid, name, email, phoneNumber } = body;

        if (technicianUid) {
            // Assign existing user as technician to this building
            const existingUser = await db.collection('users').findOne({ firebaseUid: technicianUid });

            if (!existingUser) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            // Store the previous building ID before updating
            const previousBuildingId = existingUser.buildingId || null;

            await db.collection('users').updateOne(
                { firebaseUid: technicianUid },
                {
                    $set: {
                        role: 'technician',
                        buildingId: id,
                        buildingName: building.name,
                        updatedAt: new Date()
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: 'Technician assigned to building',
                previousBuildingId // Return this so frontend can clear cache for the old building
            });
        } else if (email) {
            // Find registered user by email
            const registeredUser = await db.collection('users').findOne({
                email: email.toLowerCase()
            });

            if (!registeredUser) {
                return NextResponse.json(
                    { success: false, error: 'No registered user found with this email. The user must sign up first before being assigned as a technician.' },
                    { status: 404 }
                );
            }

            // Check if already a technician for this building
            if (registeredUser.role === 'technician' && registeredUser.buildingId === id) {
                return NextResponse.json(
                    { success: false, error: 'This user is already assigned as a technician for this building' },
                    { status: 400 }
                );
            }

            // Store the previous building ID if they were assigned elsewhere
            const previousBuildingId = registeredUser.buildingId || null;

            // Assign registered user as technician to this building
            await db.collection('users').updateOne(
                { firebaseUid: registeredUser.firebaseUid },
                {
                    $set: {
                        role: 'technician',
                        buildingId: id,
                        buildingName: building.name,
                        updatedAt: new Date()
                    }
                }
            );

            return NextResponse.json({
                success: true,
                message: `${registeredUser.name} has been assigned as a technician`,
                previousBuildingId
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Provide either technicianUid or email of a registered user' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error adding technician:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add technician' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/buildings/[id]/technicians
 * Remove a technician from a building
 * Query param: ?technicianUid=xxx
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const adminUid = request.headers.get('x-user-id');
        const { searchParams } = new URL(request.url);
        const technicianUid = searchParams.get('technicianUid');

        if (!adminUid) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        if (!technicianUid) {
            return NextResponse.json(
                { success: false, error: 'technicianUid is required' },
                { status: 400 }
            );
        }

        // Verify building exists and actor can manage it
        const building = await getBuilding(id);
        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        const db = await getDatabase();
        const hasAccess = await canManageBuilding(db, adminUid, building.adminId);
        if (!hasAccess) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to manage this building' },
                { status: 403 }
            );
        }

        // Remove technician from building (set to resident, clear building)
        await db.collection('users').updateOne(
            { firebaseUid: technicianUid, buildingId: id },
            {
                $set: {
                    role: 'resident',
                    updatedAt: new Date()
                },
                $unset: {
                    buildingId: '',
                    buildingName: ''
                }
            }
        );

        return NextResponse.json({
            success: true,
            message: 'Technician removed from building'
        });
    } catch (error) {
        console.error('Error removing technician:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove technician' },
            { status: 500 }
        );
    }
}
