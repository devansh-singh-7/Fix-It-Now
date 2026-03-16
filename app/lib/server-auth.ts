import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import { getBuilding } from '@/app/lib/database';

export interface ServerUserContext {
  uid: string;
  role: string;
  buildingId?: string;
}

function getUidFromRequest(request: Request): string | null {
  const headerUid = request.headers.get('x-user-id');
  if (headerUid) return headerUid;

  const url = new URL(request.url);
  return url.searchParams.get('uid');
}

export function isAdminOrOwner(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'owner';
}

export function isAdminOwnerOrTechnician(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'owner' || role === 'technician';
}

export async function getServerUserContext(
  request: Request
): Promise<ServerUserContext | null> {
  const uid = getUidFromRequest(request);
  if (!uid) return null;

  const db = await getDatabase();
  const user = await db.collection('users').findOne(
    { firebaseUid: uid },
    { projection: { firebaseUid: 1, role: 1, buildingId: 1 } }
  );

  if (!user?.firebaseUid || !user?.role) return null;

  return {
    uid: user.firebaseUid as string,
    role: user.role as string,
    buildingId: user.buildingId as string | undefined,
  };
}

export async function requireAdminOrOwner(request: Request): Promise<
  | { ok: true; user: ServerUserContext }
  | { ok: false; response: NextResponse }
> {
  const user = await getServerUserContext(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (!isAdminOrOwner(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

export async function requireAdminOwnerOrTechnician(request: Request): Promise<
  | { ok: true; user: ServerUserContext }
  | { ok: false; response: NextResponse }
> {
  const user = await getServerUserContext(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  if (!isAdminOwnerOrTechnician(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return { ok: true, user };
}

export async function requireBuildingAdminAccess(
  request: Request,
  buildingId: string
): Promise<
  | { ok: true; user: ServerUserContext }
  | { ok: false; response: NextResponse }
> {
  const authResult = await requireAdminOrOwner(request);
  if (!authResult.ok) return authResult;

  const building = await getBuilding(buildingId);
  if (!building) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Building not found' },
        { status: 404 }
      ),
    };
  }

  // Platform admins can manage any building.
  if (authResult.user.role === 'admin') {
    return authResult;
  }

  if (building.adminId !== authResult.user.uid) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export async function requireBuildingAccess(
  request: Request,
  buildingId: string
): Promise<
  | { ok: true; user: ServerUserContext }
  | { ok: false; response: NextResponse }
> {
  const user = await getServerUserContext(request);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  // Admin has access to all buildings
  if (user.role === 'admin') {
    return { ok: true, user };
  }

  const building = await getBuilding(buildingId);
  if (!building) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Building not found' },
        { status: 404 }
      ),
    };
  }

  // Owner must own the building
  if (user.role === 'owner' && building.adminId === user.uid) {
    return { ok: true, user };
  }

  // Technician must be assigned to the building
  if (user.role === 'technician' && user.buildingId === buildingId) {
    return { ok: true, user };
  }

  return {
    ok: false,
    response: NextResponse.json(
      { success: false, error: 'Forbidden: You do not have access to this building' },
      { status: 403 }
    ),
  };
}
