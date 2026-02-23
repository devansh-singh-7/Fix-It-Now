import { NextRequest, NextResponse } from 'next/server';
import { getBuildingsForAdmin } from '@/app/lib/database';
import type { Building } from '@/app/lib/types';
import type { WithId, Document } from 'mongodb';

// Extended building type to handle MongoDB _id field
type MongoBuilding = Building & { _id?: { toString(): string } };

export async function GET(request: NextRequest) {
  try {
    // Get the user from the request headers (passed from client)
    const uid = request.headers.get('x-user-id');

    if (!uid) {
      return NextResponse.json(
        { error: 'Unauthorized - No user ID provided' },
        { status: 401 }
      );
    }

    // Get all buildings for this admin
    const buildings = await getBuildingsForAdmin(uid) as (WithId<Document> & MongoBuilding)[];

    return NextResponse.json({
      buildings: buildings.map(b => ({
        id: b._id?.toString() || b.id || '',
        name: b.name,
        address: b.address,
        joinCode: b.joinCode,
        createdAt: b.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching buildings for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}
