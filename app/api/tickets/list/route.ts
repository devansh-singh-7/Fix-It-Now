import { NextResponse } from 'next/server';
import { getDatabase } from '@/app/lib/mongodb';
import type { UserRole } from '@/app/lib/types';

/**
 * GET /api/tickets/list
 *
 * Uses the EXACT same aggregation pipeline as dashboard stats API
 * to ensure consistent data retrieval and ID handling.
 */
export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');
    const role = searchParams.get('role') as UserRole;
    const buildingId = searchParams.get('buildingId');

    if (!uid || !role) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: uid, role',
        },
        { status: 400 }
      );
    }

    console.log('[API tickets/list] Fetching tickets:', { uid, role, buildingId });

    const db = await getDatabase();

    const hasValidBuildingId = Boolean(
      buildingId && buildingId !== 'null' && buildingId !== 'undefined' && buildingId !== ''
    );

    const andConditions: Record<string, unknown>[] = [];

    // Support both current and legacy building key names.
    if (hasValidBuildingId) {
      andConditions.push({
        $or: [{ buildingId }, { building_id: buildingId }],
      });
    }

    if (role === 'technician') {
      // Build a resilient set of technician identifiers from user record
      // to support legacy data where uid/firebaseUid mismatches occurred.
      const techUser = await db.collection('users').findOne(
        {
          $or: [{ firebaseUid: uid }, { uid }],
        },
        {
          projection: {
            firebaseUid: 1,
            uid: 1,
          },
        }
      );

      const technicianIds = Array.from(
        new Set(
          [uid, techUser?.firebaseUid, techUser?.uid]
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
        )
      );

      const assignmentMatchers = technicianIds.flatMap((techId) => [
        { assignedTo: techId },
        { assignedTechnicianId: techId },
        { assigned_to: techId },
      ]);

      andConditions.push({
        $or: assignmentMatchers,
      });
    } else if (role === 'resident') {
      andConditions.push({
        $or: [{ createdBy: uid }, { created_by: uid }],
      });
    } else if (role === 'owner' && !hasValidBuildingId) {
      console.log(
        '[API tickets/list] WARNING: Owner without buildingId - will see all system tickets'
      );
    }
    // Admin sees all tickets (or building-scoped tickets when buildingId exists).

    const filter: Record<string, unknown> =
      andConditions.length === 0
        ? {}
        : andConditions.length === 1
          ? andConditions[0]
          : { $and: andConditions };

    console.log('[API tickets/list] Using filter:', JSON.stringify(filter));

    const runQuery = async (queryFilter: Record<string, unknown>) =>
      db
        .collection('tickets')
        .find(queryFilter)
        .sort({ createdAt: -1 })
        .limit(500) // Limit max results to prevent overwhelming client
        .project({
          _id: 1,
          id: 1,
          title: 1,
          description: 1,
          status: 1,
          priority: 1,
          category: 1,
          location: 1,
          buildingId: 1,
          building_id: 1,
          buildingName: 1,
          building_name: 1,
          createdBy: 1,
          created_by: 1,
          createdByName: 1,
          assignedTo: 1,
          assignedTechnicianId: 1,
          assignedToName: 1,
          contactPhone: 1,
          imageUrls: 1,
          completionImageUrls: 1,
          completionImagePublicIds: 1,
          timeline: 1,
          createdAt: 1,
          updatedAt: 1,
          completedAt: 1,
        })
        .toArray();

    let tickets = await runQuery(filter);

    // If admin is scoped to a building but no matches exist, fall back to all tickets.
    if (tickets.length === 0 && role === 'admin' && hasValidBuildingId) {
      console.log(
        '[API tickets/list] No tickets for admin building scope; retrying without building filter'
      );
      tickets = await runQuery({});
    }

    // If technician has assignments but legacy/missing building fields hide them,
    // retry with assignment-only filter.
    if (tickets.length === 0 && role === 'technician' && hasValidBuildingId) {
      const assignmentOnlyCondition = andConditions.find(
        (condition) =>
          Array.isArray((condition as { $or?: unknown[] }).$or) &&
          (condition as { $or: Record<string, unknown>[] }).$or.some((clause) =>
            Object.prototype.hasOwnProperty.call(clause, 'assignedTo') ||
            Object.prototype.hasOwnProperty.call(clause, 'assignedTechnicianId') ||
            Object.prototype.hasOwnProperty.call(clause, 'assigned_to')
          )
      ) as Record<string, unknown> | undefined;

      if (assignmentOnlyCondition) {
        console.log(
          '[API tickets/list] No technician tickets with building scope; retrying assignment-only filter'
        );
        tickets = await runQuery(assignmentOnlyCondition);
      }
    }

    const queryTime = Date.now() - startTime;
    console.log(
      `[API tickets/list] Query completed in ${queryTime}ms, returned ${tickets.length} tickets`
    );

    const response = NextResponse.json({
      success: true,
      data: tickets,
      count: tickets.length,
      performance: { queryTime },
    });

    // Add cache headers for faster subsequent loads (30 seconds)
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('[API tickets/list] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get tickets',
      },
      { status: 500 }
    );
  }
}
