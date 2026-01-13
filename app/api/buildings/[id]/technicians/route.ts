import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { getBuilding, getTechniciansForBuilding } from '@/app/lib/database';

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
 * Add a technician to a building (assign existing user or create new)
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

        // Verify building exists and admin owns it
        const building = await getBuilding(id);
        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        if (building.adminId !== adminUid) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to manage this building' },
                { status: 403 }
            );
        }

        const { technicianUid, name, email, phoneNumber } = body;
        const db = await getDatabase();

        if (technicianUid) {
            // Assign existing user as technician to this building
            const existingUser = await db.collection('users').findOne({ firebaseUid: technicianUid });

            if (!existingUser) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

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
                message: 'Technician assigned to building'
            });
        } else if (name && email) {
            // Check if a technician with this email already exists for this building
            const existingTech = await db.collection('users').findOne({
                email: email.toLowerCase(),
                buildingId: id,
                role: 'technician'
            });

            if (existingTech) {
                return NextResponse.json(
                    { success: false, error: 'A technician with this email already exists for this building' },
                    { status: 400 }
                );
            }

            // Create a new technician profile (they'll need to sign up to complete)
            // Generate a temporary ID that will be replaced when they claim their account
            const tempUid = `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newTechnician = {
                firebaseUid: tempUid, // Temporary ID until they sign up
                name,
                email: email.toLowerCase(),
                phoneNumber: phoneNumber || null,
                role: 'technician',
                buildingId: id,
                buildingName: building.name,
                isActive: true,
                awaitApproval: true, // Pending until they sign up
                isPending: true, // Flag to indicate they haven't claimed their account
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await db.collection('users').insertOne(newTechnician);

            return NextResponse.json({
                success: true,
                message: 'Technician profile created. They will need to sign up with this email to access their account.'
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Provide either technicianUid or name and email' },
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

        // Verify building exists and admin owns it
        const building = await getBuilding(id);
        if (!building) {
            return NextResponse.json(
                { success: false, error: 'Building not found' },
                { status: 404 }
            );
        }

        if (building.adminId !== adminUid) {
            return NextResponse.json(
                { success: false, error: 'Not authorized to manage this building' },
                { status: 403 }
            );
        }

        const db = await getDatabase();

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
