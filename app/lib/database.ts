
import { getDatabase, getMongoClient } from './mongodb';
import { Filter, UpdateFilter, Document, ClientSession } from 'mongodb';

export type {
  UserRole,
  UserProfile,
  Building,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TimelineEvent,
  Invoice,
  InvoiceStatus,
  Prediction,
  MLModel,
  RiskBucket,
  PredictionResult
} from './types';

import type {
  UserRole,
  UserProfile,
  Building,
  Ticket,
  TicketStatus,
  TimelineEvent,
  Invoice,
  InvoiceStatus,
  Prediction
} from './types';

// Super Admin configuration
const SUPER_ADMIN_EMAILS = [
  'devanshsingh@gmail.com',
  'devanshsingh159753@gmail.com', // Google sign-in
];
const SUPER_ADMIN_UIDS = [
  '9PIwUBTxkLQwNFdjCUAXjKiHtcA2', // devanshsingh159753@gmail.com (Google sign-in)
];

/**
 * Check if a user is the super admin
 * Super admin can be determined by:
 * 1. Email (devanshsingh@gmail.com) with admin role
 * 2. Specific Firebase UIDs in SUPER_ADMIN_UIDS array with admin role
 */
export async function isSuperAdmin(uid: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ firebaseUid: uid }, { projection: { email: 1, role: 1 } });

    if (!user) {
      console.log(`isSuperAdmin: User not found for uid ${uid}`);
      return false;
    }

    // Check if user has admin role
    const hasAdminRole = user.role === 'admin';
    if (!hasAdminRole) {
      console.log(`isSuperAdmin: User ${uid} is not an admin`);
      return false;
    }

    // Check by email (case-insensitive) - checks against all emails in the array
    const isSuperAdminEmail = SUPER_ADMIN_EMAILS.some(
      email => user.email?.toLowerCase() === email.toLowerCase()
    );
    
    // Check by UID
    const isSuperAdminUid = SUPER_ADMIN_UIDS.includes(uid);

    const result = isSuperAdminEmail || isSuperAdminUid;

    console.log(`isSuperAdmin check: uid=${uid}, email=${user.email}, role=${user.role}, isSuperAdminEmail=${isSuperAdminEmail}, isSuperAdminUid=${isSuperAdminUid}, result=${result}`);

    return result;
  } catch (error) {
    console.error('Error checking super admin:', error);
    return false;
  }
}

/**
 * Get user profile from MongoDB
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ firebaseUid: uid });

    if (!user) {
      return null;
    }

    return {
      uid: user.firebaseUid,
      name: user.name || user.displayName, // Support both field names
      email: user.email,
      passwordHash: user.passwordHash,
      phoneNumber: user.phoneNumber,
      role: user.role,
      buildingId: user.buildingId,
      buildingName: user.buildingName,
      awaitApproval: user.awaitApproval || false,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as UserProfile;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Create user profile in MongoDB
 */
export async function createUserProfile(userData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Map uid to firebaseUid for database storage
    const { uid, ...rest } = userData;
    await db.collection('users').insertOne({
      firebaseUid: uid,
      ...rest,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
}

/**
 * Get user role from MongoDB
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ firebaseUid: uid }, { projection: { role: 1 } });

    return user?.role || null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    return null;
  }
}

/**
 * Get user building ID from MongoDB
 */
export async function getUserBuildingId(uid: string): Promise<string | null> {
  try {
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ firebaseUid: uid }, { projection: { buildingId: 1 } });

    return user?.buildingId || null;
  } catch (error) {
    console.error('Error fetching user building ID:', error);
    return null;
  }
}

/**
 * Update user's building information
 */
export async function updateUserBuilding(
  uid: string,
  buildingId: string,
  buildingName: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date();

    await db.collection('users').updateOne(
      { firebaseUid: uid },
      {
        $set: {
          buildingId,
          buildingName,
          updatedAt: now,
        },
      }
    );
  } catch (error) {
    console.error('Error updating user building:', error);
    throw error;
  }
}

/**
 * Update user's subscription information
 * @param uid - Firebase UID
 * @param plan - Subscription plan (BASIC, PRO, ENTERPRISE)
 * @param tier - Subscription tier (1=Enterprise, 2=Pro, 3=Basic)
 * @param isYearly - Whether it's a yearly subscription
 */
export async function updateUserSubscription(
  uid: string,
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE',
  tier: 1 | 2 | 3,
  isYearly: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();
    const now = new Date();

    const result = await db.collection('users').updateOne(
      { firebaseUid: uid },
      {
        $set: {
          subscriptionPlan: plan,
          subscriptionTier: tier,
          subscriptionBillingCycle: isYearly ? 'yearly' : 'monthly',
          subscriptionStartDate: now,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'User not found' };
    }

    console.log(`Updated subscription for user ${uid}: ${plan} (Tier ${tier})`);
    return { success: true };
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return { success: false, error: 'Failed to update subscription' };
  }
}

/**
 * Generate a random join code in format ABC-123-XYZ
 */
function generateJoinCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';

  let part1 = '';
  for (let i = 0; i < 3; i++) {
    part1 += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  let part2 = '';
  for (let i = 0; i < 3; i++) {
    part2 += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  let part3 = '';
  for (let i = 0; i < 3; i++) {
    part3 += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  return `${part1}-${part2}-${part3}`;
}

/**
 * Create a new building (admin only)
 * Uses a transaction to ensure atomicity
 */
export async function createBuilding(
  adminUid: string,
  buildingData: {
    name: string;
    address: string;
  }
): Promise<Building> {
  let session: ClientSession | undefined;
  try {
    const db = await getDatabase();
    const client = await getMongoClient();
    
    // Start session for transaction
    session = client.startSession();

    // Verify user is admin
    const role = await getUserRole(adminUid);
    if (role !== 'admin') {
      throw new Error('Only admins can create buildings');
    }

    // Generate unique join code
    let joinCode = generateJoinCode();
    let isUnique = false;

    // Join code generation doesn't need to be in the transaction as it's just querying
    while (!isUnique) {
      const existing = await db.collection('buildings').findOne({ joinCode });
      if (!existing) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
      }
    }

    const now = new Date();
    const building: Building = {
      id: new Date().getTime().toString(),
      name: buildingData.name,
      address: buildingData.address,
      joinCode,
      adminId: adminUid,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    // Execute transaction
    await session.withTransaction(async () => {
      // 1. Create building
      await db.collection('buildings').insertOne(building, { session });

      // 2. Update admin's user document with building ID
      await db.collection('users').updateOne(
        { firebaseUid: adminUid },
        {
          $set: {
            buildingId: building.id,
            buildingName: building.name,
            updatedAt: now,
          },
        },
        { session }
      );
    });

    return building;
  } catch (error) {
    console.error('Error creating building:', error);
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

/**
 * Get building by ID
 */
export async function getBuilding(buildingId: string): Promise<Building | null> {
  try {
    const db = await getDatabase();
    const building = await db.collection('buildings').findOne({ id: buildingId });

    return building as Building | null;
  } catch (error) {
    console.error('Error fetching building:', error);
    return null;
  }
}

/**
 * Get building by join code
 */
export async function getBuildingByJoinCode(joinCode: string): Promise<Building | null> {
  try {
    const db = await getDatabase();
    const building = await db.collection('buildings').findOne({ joinCode });

    return building as Building | null;
  } catch (error) {
    console.error('Error fetching building by join code:', error);
    return null;
  }
}

/**
 * Get tickets based on user role
 * Falls back to retrieving all tickets if no buildingId match (for legacy data)
 */
export async function getTicketsForUser(
  uid: string,
  role: UserRole,
  buildingId: string
): Promise<Ticket[]> {
  try {
    const db = await getDatabase();
    let filter: Filter<Document>;

    console.log('[DB getTicketsForUser] Params:', { uid, role, buildingId });

    if (role === 'admin') {
      // Admin sees all tickets for their building, or all tickets if no buildingId match
      filter = { buildingId };
    } else if (role === 'technician') {
      filter = { buildingId, assignedTo: uid };
    } else {
      filter = { buildingId, createdBy: uid };
    }

    let tickets = await db.collection('tickets')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    console.log('[DB getTicketsForUser] Found with buildingId filter:', tickets.length);

    // If no tickets found and user is admin, try fetching all tickets (legacy support)
    if (tickets.length === 0 && role === 'admin') {
      console.log('[DB getTicketsForUser] No tickets with buildingId, fetching all tickets');
      tickets = await db.collection('tickets')
        .find({})
        .sort({ createdAt: -1 })
        .toArray();
      console.log('[DB getTicketsForUser] Found total tickets:', tickets.length);
    }

    // If still no tickets for resident, try without buildingId filter
    if (tickets.length === 0 && role === 'resident') {
      console.log('[DB getTicketsForUser] No tickets with buildingId for resident, trying with createdBy only');
      tickets = await db.collection('tickets')
        .find({ createdBy: uid })
        .sort({ createdAt: -1 })
        .toArray();
      console.log('[DB getTicketsForUser] Found for resident:', tickets.length);
    }

    // Map MongoDB documents to Ticket type, handling _id
    return tickets.map(t => ({
      ...t,
      id: t.id || t._id?.toString(),
    })) as unknown as Ticket[];
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

/**
 * Create a new ticket
 */
export async function createTicket(
  ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'timeline'>,
  uid: string
): Promise<Ticket> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const ticketId = new Date().getTime().toString();

    const initialTimelineEvent: TimelineEvent = {
      status: ticketData.status,
      timestamp: now,
      by: uid,
      userName: ticketData.createdByName,
      note: 'Ticket created',
    };

    const ticket: Omit<Ticket, '_id'> = {
      ...ticketData,
      id: ticketId,
      createdBy: uid,
      timeline: [initialTimelineEvent],
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('tickets').insertOne(ticket);

    return ticket as Ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw error;
  }
}

/**
 * Update ticket status with timeline tracking
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  userId: string,
  userName: string,
  note?: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Get current ticket
    const currentTicket = await db.collection('tickets').findOne({ id: ticketId });

    const updateData: UpdateFilter<Document> = {
      $set: {
        status,
        updatedAt: now,
      },
    };

    // Update specific timestamps based on status
    if (status === 'accepted') {
      updateData.$set!.acceptedAt = now;
    } else if (status === 'completed') {
      updateData.$set!.completedAt = now;
    }

    // Add timeline event
    const timelineEvent: TimelineEvent = {
      status,
      timestamp: now,
      by: userId,
      userName,
      note,
    };

    const currentTimeline = currentTicket?.timeline || [];
    updateData.$set!.timeline = [...currentTimeline, timelineEvent];

    await db.collection('tickets').updateOne(
      { id: ticketId },
      updateData
    );
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

/**
 * Assign ticket to technician
 */
export async function assignTicket(
  ticketId: string,
  technicianUid: string,
  technicianName: string,
  adminUid: string,
  adminName: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const now = new Date();

    // Get current ticket
    const currentTicket = await db.collection('tickets').findOne({ id: ticketId });

    const timelineEvent: TimelineEvent = {
      status: 'assigned',
      timestamp: now,
      by: adminUid,
      userName: adminName,
      note: `Assigned to ${technicianName}`,
    };

    const currentTimeline = currentTicket?.timeline || [];

    await db.collection('tickets').updateOne(
      { id: ticketId },
      {
        $set: {
          assignedTo: technicianUid,
          assignedToName: technicianName,
          assignedTechnicianId: technicianUid,
          assignedAt: now,
          status: 'assigned',
          timeline: [...currentTimeline, timelineEvent],
          updatedAt: now,
        },
      }
    );
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
}

/**
 * Get all technicians for a building
 */
export async function getTechniciansForBuilding(
  buildingId: string
): Promise<UserProfile[]> {
  try {
    const db = await getDatabase();
    const technicians = await db.collection('users')
      .find({
        buildingId,
        role: 'technician',
      })
      .toArray();

    return technicians as unknown as UserProfile[];
  } catch (error) {
    console.error('Error fetching technicians:', error);
    return [];
  }
}

/**
 * Get all buildings for an admin
 */
export async function getBuildingsForAdmin(adminUid: string): Promise<Building[]> {
  try {
    const db = await getDatabase();
    const buildings = await db.collection('buildings')
      .find({ adminId: adminUid })
      .sort({ createdAt: -1 })
      .toArray();

    return buildings as unknown as Building[];
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
}

/**
 * Update a building
 * Only the admin who created the building can update it
 */
export async function updateBuilding(
  buildingId: string,
  adminUid: string,
  updates: { name?: string; address?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();

    // Verify admin owns this building
    const building = await db.collection('buildings').findOne({ id: buildingId });

    if (!building) {
      return { success: false, error: 'Building not found' };
    }

    if (building.adminId !== adminUid) {
      return { success: false, error: 'Not authorized to update this building' };
    }

    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.name) updateData.name = updates.name.trim();
    if (updates.address) updateData.address = updates.address.trim();

    await db.collection('buildings').updateOne(
      { id: buildingId },
      { $set: updateData }
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating building:', error);
    return { success: false, error: 'Failed to update building' };
  }
}

/**
 * Delete a building (soft delete by setting isActive = false)
 * Only the admin who created the building can delete it
 */
export async function deleteBuilding(
  buildingId: string,
  adminUid: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();

    // Verify admin owns this building
    const building = await db.collection('buildings').findOne({ id: buildingId });

    if (!building) {
      return { success: false, error: 'Building not found' };
    }

    if (building.adminId !== adminUid) {
      return { success: false, error: 'Not authorized to delete this building' };
    }

    // Soft delete - set isActive to false
    await db.collection('buildings').updateOne(
      { id: buildingId },
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting building:', error);
    return { success: false, error: 'Failed to delete building' };
  }
}

// ==================== INVOICE OPERATIONS ====================

/**
 * Create a new invoice
 */
export async function createInvoice(
  invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Invoice> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const invoiceId = new Date().getTime().toString();

    const invoice: Omit<Invoice, '_id'> = {
      ...invoiceData,
      id: invoiceId,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('invoices').insertOne(invoice);

    return invoice as Invoice;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

/**
 * Get invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  try {
    const db = await getDatabase();
    const invoice = await db.collection('invoices').findOne({ id: invoiceId });

    return invoice as Invoice | null;
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }
}

/**
 * Get all invoices for a user
 */
export async function getInvoicesForUser(userId: string): Promise<Invoice[]> {
  try {
    const db = await getDatabase();
    const invoices = await db.collection('invoices')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return invoices as unknown as Invoice[];
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    return [];
  }
}

/**
 * Get all invoices for a building
 */
export async function getInvoicesForBuilding(buildingId: string): Promise<Invoice[]> {
  try {
    const db = await getDatabase();
    const invoices = await db.collection('invoices')
      .find({ buildingId })
      .sort({ createdAt: -1 })
      .toArray();

    return invoices as unknown as Invoice[];
  } catch (error) {
    console.error('Error fetching building invoices:', error);
    return [];
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  stripeSessionId?: string
): Promise<void> {
  try {
    const db = await getDatabase();
    const updateData: UpdateFilter<Document> = {
      $set: {
        status,
        updatedAt: new Date(),
      },
    };

    if (stripeSessionId) {
      updateData.$set!.stripeSessionId = stripeSessionId;
    }

    await db.collection('invoices').updateOne(
      { id: invoiceId },
      updateData
    );
  } catch (error) {
    console.error('Error updating invoice status:', error);
    throw error;
  }
}

// ==================== PREDICTION OPERATIONS ====================

/**
 * Create a new prediction
 */
export async function createPrediction(
  predictionData: Omit<Prediction, 'id' | 'createdAt'>
): Promise<Prediction> {
  try {
    const db = await getDatabase();
    const now = new Date();
    const predictionId = new Date().getTime().toString();

    const prediction: Omit<Prediction, '_id'> = {
      ...predictionData,
      id: predictionId,
      createdAt: now,
    };

    await db.collection('predictions').insertOne(prediction);

    return prediction as Prediction;
  } catch (error) {
    console.error('Error creating prediction:', error);
    throw error;
  }
}

/**
 * Get prediction by ID
 */
export async function getPrediction(predictionId: string): Promise<Prediction | null> {
  try {
    const db = await getDatabase();
    const prediction = await db.collection('predictions').findOne({ id: predictionId });

    return prediction as Prediction | null;
  } catch (error) {
    console.error('Error fetching prediction:', error);
    return null;
  }
}

/**
 * Get all predictions for a building
 */
export async function getPredictionsForBuilding(buildingId: string): Promise<Prediction[]> {
  try {
    const db = await getDatabase();
    const predictions = await db.collection('predictions')
      .find({ buildingId })
      .sort({ createdAt: -1 })
      .toArray();

    return predictions as unknown as Prediction[];
  } catch (error) {
    console.error('Error fetching building predictions:', error);
    return [];
  }
}

/**
 * Get predictions for a specific ticket
 */
export async function getPredictionsForTicket(ticketId: string): Promise<Prediction[]> {
  try {
    const db = await getDatabase();
    const predictions = await db.collection('predictions')
      .find({ ticketId })
      .sort({ createdAt: -1 })
      .toArray();

    return predictions as unknown as Prediction[];
  } catch (error) {
    console.error('Error fetching ticket predictions:', error);
    return [];
  }
}

/**
 * Get high-risk predictions for a building
 */
export async function getHighRiskPredictions(buildingId: string): Promise<Prediction[]> {
  try {
    const db = await getDatabase();
    const predictions = await db.collection('predictions')
      .find({
        buildingId,
        'prediction.riskBucket': 'high',
      })
      .sort({ createdAt: -1 })
      .toArray();

    return predictions as unknown as Prediction[];
  } catch (error) {
    console.error('Error fetching high-risk predictions:', error);
    return [];
  }
}

// ==================== STATUS WORKFLOW VALIDATION ====================

/**
 * Valid status transitions map
 * Defines which status transitions are allowed
 */
const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  'open': ['assigned'],
  'assigned': ['accepted', 'open'], // Can be unassigned back to open
  'accepted': ['in_progress', 'assigned'], // Can decline back to assigned
  'in_progress': ['completed', 'accepted'], // Can pause back to accepted
  'completed': ['open'], // Can reopen if needed
};

/**
 * Validate if a status transition is allowed
 */
export function validateStatusTransition(
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  if (currentStatus === newStatus) return true; // No change is always valid
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get allowed next statuses for a given current status
 */
export function getAllowedNextStatuses(currentStatus: TicketStatus): TicketStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a role can perform a specific status transition
 */
export function canRolePerformTransition(
  role: UserRole,
  currentStatus: TicketStatus,
  newStatus: TicketStatus
): boolean {
  // First check if the transition is valid
  if (!validateStatusTransition(currentStatus, newStatus)) {
    return false;
  }

  // Admin can perform any valid transition
  if (role === 'admin') {
    return true;
  }

  // Technician can: accept assigned tickets, start work, complete work
  if (role === 'technician') {
    const allowedTransitions = [
      { from: 'assigned', to: 'accepted' },
      { from: 'accepted', to: 'in_progress' },
      { from: 'in_progress', to: 'completed' },
      { from: 'in_progress', to: 'accepted' }, // Pause
      { from: 'accepted', to: 'assigned' }, // Decline
    ];
    return allowedTransitions.some(t => t.from === currentStatus && t.to === newStatus);
  }

  // Residents can only reopen completed tickets (acknowledge resolution)
  if (role === 'resident') {
    return currentStatus === 'completed' && newStatus === 'open';
  }

  return false;
}

// ==================== PERMISSION HELPERS ====================

/**
 * Check if a user can access a specific ticket
 */
export async function canUserAccessTicket(
  ticketId: string,
  userId: string,
  role: UserRole
): Promise<boolean> {
  try {
    const db = await getDatabase();
    const ticket = await db.collection('tickets').findOne({ id: ticketId });

    if (!ticket) return false;

    // Admin can access all tickets in their building
    if (role === 'admin') return true;

    // Technician can only access tickets assigned to them
    if (role === 'technician') {
      return ticket.assignedTo === userId;
    }

    // Resident can only access their own tickets
    if (role === 'resident') {
      return ticket.createdBy === userId;
    }

    return false;
  } catch (error) {
    console.error('Error checking ticket access:', error);
    return false;
  }
}

/**
 * Check if a user can modify a specific ticket
 */
export async function canUserModifyTicket(
  ticketId: string,
  userId: string,
  role: UserRole
): Promise<{ canModify: boolean; reason?: string }> {
  try {
    const db = await getDatabase();
    const ticket = await db.collection('tickets').findOne({ id: ticketId });

    if (!ticket) {
      return { canModify: false, reason: 'Ticket not found' };
    }

    // Admin can modify any ticket
    if (role === 'admin') {
      return { canModify: true };
    }

    // Technician can only modify tickets assigned to them
    if (role === 'technician') {
      if (ticket.assignedTo !== userId) {
        return { canModify: false, reason: 'Ticket not assigned to you' };
      }
      return { canModify: true };
    }

    // Resident can only modify their own tickets
    if (role === 'resident') {
      if (ticket.createdBy !== userId) {
        return { canModify: false, reason: 'Not your ticket' };
      }
      return { canModify: true };
    }

    return { canModify: false, reason: 'Invalid role' };
  } catch (error) {
    console.error('Error checking ticket modify permission:', error);
    return { canModify: false, reason: 'Server error' };
  }
}

/**
 * Check if a user can delete a specific ticket
 */
export async function canUserDeleteTicket(
  ticketId: string,
  userId: string,
  role: UserRole
): Promise<{ canDelete: boolean; reason?: string }> {
  try {
    const db = await getDatabase();
    const ticket = await db.collection('tickets').findOne({ id: ticketId });

    if (!ticket) {
      return { canDelete: false, reason: 'Ticket not found' };
    }

    // Admin can delete any ticket
    if (role === 'admin') {
      return { canDelete: true };
    }

    // Technician cannot delete tickets
    if (role === 'technician') {
      return { canDelete: false, reason: 'Technicians cannot delete tickets' };
    }

    // Resident can only delete their own open tickets
    if (role === 'resident') {
      if (ticket.createdBy !== userId) {
        return { canDelete: false, reason: 'Not your ticket' };
      }
      if (ticket.status !== 'open') {
        return { canDelete: false, reason: 'Can only delete open tickets' };
      }
      return { canDelete: true };
    }

    return { canDelete: false, reason: 'Invalid role' };
  } catch (error) {
    console.error('Error checking ticket delete permission:', error);
    return { canDelete: false, reason: 'Server error' };
  }
}

// ==================== SINGLE TICKET OPERATIONS ====================

/**
 * Get a single ticket by ID with authorization check
 */
export async function getTicketById(
  ticketId: string,
  userId: string,
  role: UserRole
): Promise<{ ticket: Ticket | null; authorized: boolean }> {
  try {
    const db = await getDatabase();
    const ticket = await db.collection('tickets').findOne({ id: ticketId });

    if (!ticket) {
      return { ticket: null, authorized: false };
    }

    // Check authorization
    const canAccess = await canUserAccessTicket(ticketId, userId, role);

    if (!canAccess) {
      return { ticket: null, authorized: false };
    }

    return { ticket: ticket as unknown as Ticket, authorized: true };
  } catch (error) {
    console.error('Error fetching ticket by ID:', error);
    return { ticket: null, authorized: false };
  }
}

/**
 * Delete a ticket with authorization check
 * Also deletes associated Cloudinary images
 */
export async function deleteTicket(
  ticketId: string,
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check delete permission
    const { canDelete, reason } = await canUserDeleteTicket(ticketId, userId, role);

    if (!canDelete) {
      return { success: false, error: reason || 'Not authorized to delete' };
    }

    const db = await getDatabase();

    // Get the ticket first to retrieve imagePublicIds for Cloudinary cleanup
    const ticket = await db.collection('tickets').findOne({ id: ticketId });

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Delete images from Cloudinary if any exist
    const imagePublicIds = ticket.imagePublicIds as string[] | undefined;
    if (imagePublicIds && imagePublicIds.length > 0) {
      // Dynamic import to avoid issues with client/server components
      const { deleteMultipleImages } = await import('./cloudinary');
      await deleteMultipleImages(imagePublicIds);
    }

    const result = await db.collection('tickets').deleteOne({ id: ticketId });

    if (result.deletedCount === 0) {
      return { success: false, error: 'Ticket not found or already deleted' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { success: false, error: 'Server error' };
  }
}

/**
 * Update ticket status with full authorization and workflow validation
 */
export async function updateTicketStatusWithAuth(
  ticketId: string,
  newStatus: TicketStatus,
  userId: string,
  userName: string,
  role: UserRole,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = await getDatabase();

    // Get current ticket
    const currentTicket = await db.collection('tickets').findOne({ id: ticketId });

    if (!currentTicket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Check if user can access this ticket
    const canAccess = await canUserAccessTicket(ticketId, userId, role);
    if (!canAccess) {
      return { success: false, error: 'Not authorized to access this ticket' };
    }

    // Check if the status transition is allowed for this role
    const currentStatus = currentTicket.status as TicketStatus;
    if (!canRolePerformTransition(role, currentStatus, newStatus)) {
      return {
        success: false,
        error: `Cannot transition from ${currentStatus} to ${newStatus} with your role`
      };
    }

    const now = new Date();

    const updateData: UpdateFilter<Document> = {
      $set: {
        status: newStatus,
        updatedAt: now,
      },
    };

    // Update specific timestamps based on status
    if (newStatus === 'accepted') {
      updateData.$set!.acceptedAt = now;
    } else if (newStatus === 'completed') {
      updateData.$set!.completedAt = now;
    }

    // Add timeline event
    const timelineEvent: TimelineEvent = {
      status: newStatus,
      timestamp: now,
      by: userId,
      userName,
      note,
    };

    const currentTimeline = currentTicket.timeline || [];
    updateData.$set!.timeline = [...currentTimeline, timelineEvent];

    await db.collection('tickets').updateOne(
      { id: ticketId },
      updateData
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return { success: false, error: 'Server error' };
  }
}
