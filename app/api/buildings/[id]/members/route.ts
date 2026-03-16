import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { getBuilding } from '@/app/lib/database';

type MemberRole = 'owner' | 'admin' | 'technician' | 'resident';

interface BuildingMember {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: MemberRole;
  isActive: boolean;
  joinedAt?: Date;
}

interface RawUserDoc {
  uid?: string;
  firebaseUid?: string;
  name?: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  role?: MemberRole;
  buildingId?: string;
  isActive?: boolean;
  createdAt?: Date;
}

function sortMembers(list: BuildingMember[]): BuildingMember[] {
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * GET /api/buildings/[id]/members
 * Returns building members grouped by role for owners/admins.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requesterUid = request.headers.get('x-user-id');

    if (!requesterUid) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const building = await getBuilding(id);
    if (!building) {
      return NextResponse.json({ success: false, error: 'Building not found' }, { status: 404 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection('users');

    const actor = await usersCollection.findOne(
      { $or: [{ firebaseUid: requesterUid }, { uid: requesterUid }] },
      { projection: { role: 1, buildingId: 1 } }
    );

    const canView =
      actor?.role === 'admin' || actor?.buildingId === id || building.adminId === requesterUid;

    if (!canView) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to view this building members list' },
        { status: 403 }
      );
    }

    const rawMembers = (await usersCollection
      .find(
        {
          $or: [
            { buildingId: id },
            { firebaseUid: building.adminId },
            { uid: building.adminId },
          ],
        },
        {
          projection: {
            _id: 0,
            uid: 1,
            firebaseUid: 1,
            name: 1,
            displayName: 1,
            email: 1,
            phoneNumber: 1,
            role: 1,
            isActive: 1,
            createdAt: 1,
          },
        }
      )
      .toArray()) as RawUserDoc[];

    const owners: BuildingMember[] = [];
    const technicians: BuildingMember[] = [];
    const residents: BuildingMember[] = [];

    const seen = new Set<string>();

    for (const member of rawMembers) {
      const memberUid = String(member.firebaseUid || member.uid || member.email || '').trim();
      if (!memberUid || seen.has(memberUid)) continue;
      seen.add(memberUid);

      const role = (member.role || 'resident') as MemberRole;
      const isBuildingOwner =
        member.firebaseUid === building.adminId || member.uid === building.adminId;

      const formatted: BuildingMember = {
        uid: memberUid,
        name: member.name || member.displayName || 'Unknown User',
        email: member.email || 'No email',
        phoneNumber: member.phoneNumber,
        role,
        isActive: member.isActive ?? true,
        joinedAt: member.createdAt,
      };

      if (isBuildingOwner || role === 'owner' || role === 'admin') {
        owners.push({
          ...formatted,
          role: role === 'admin' ? 'admin' : 'owner',
        });
      } else if (role === 'technician') {
        technicians.push(formatted);
      } else {
        residents.push(formatted);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        owners: sortMembers(owners),
        technicians: sortMembers(technicians),
        residents: sortMembers(residents),
        totals: {
          owners: owners.length,
          technicians: technicians.length,
          residents: residents.length,
          all: owners.length + technicians.length + residents.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting building members:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get building members' },
      { status: 500 }
    );
  }
}
