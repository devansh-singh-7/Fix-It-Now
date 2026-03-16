/**
 * Ticket Normalization Utilities
 * 
 * These functions normalize ticket data from the backend to ensure
 * consistent UI display regardless of data inconsistencies.
 */

import type { TicketStatus, TicketPriority, TimelineEvent } from './types';

// Valid status values for type safety
const VALID_STATUSES: TicketStatus[] = ['open', 'assigned', 'accepted', 'in_progress', 'completed'];
const VALID_PRIORITIES: TicketPriority[] = ['low', 'medium', 'high'];

/**
 * Normalized ticket interface for UI consumption
 */
export interface NormalizedTicket {
  id: string;
  displayId: string; // Shortened ID for display (#xxx)
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  priorityLabel: string; // Capitalized for display
  status: TicketStatus;
  statusLabel: string; // Formatted for display
  location: string;
  createdBy: string;
  createdByName: string;
  assignedTo: string | null;
  assignedToName: string; // "Unassigned" if null
  assignedTechnicianPhone: string | null;
  contactPhone: string | null;
  imageUrls: string[];
  completionImageUrls: string[];
  buildingId: string | null;
  buildingName: string;
  timeline: TimelineEvent[];
  createdAt: Date | null;
  updatedAt: Date | null;
  completedAt: Date | null;
  // AI/MobileNetV2 detection info
  aiDetection: {
    detectedLabel: string;
    confidence: number;
    mappedCategory: string;
    modelVersion: string;
  } | null;
  // Original data reference
  _raw: unknown;
}

/** Shape of a raw ticket from the backend – all keys optional */
type RawTicket = Record<string, unknown>;

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Format status for display
 * Examples: "in_progress" → "In Progress", "open" → "Open"
 */
function formatStatusLabel(status: string): string {
  if (!status || typeof status !== 'string') return 'Unknown';
  
  const formatted = status
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
  
  return formatted;
}

/**
 * Normalize status to valid enum value
 * Handles lowercase, mixed case, and invalid values
 */
function normalizeStatus(status: unknown): TicketStatus {
  if (!status || typeof status !== 'string') return 'open';
  
  const lowercased = status.toLowerCase().trim();
  
  // Handle common variations first (before type assertion)
  if (lowercased === 'inprogress' || lowercased === 'in-progress') {
    return 'in_progress';
  }
  
  const normalized = lowercased as TicketStatus;
  
  if (VALID_STATUSES.includes(normalized)) {
    return normalized;
  }
  
  return 'open'; // Default fallback
}

/**
 * Normalize priority to valid enum value
 */
function normalizePriority(priority: unknown): TicketPriority {
  if (!priority || typeof priority !== 'string') return 'medium';
  
  const lowercased = priority.toLowerCase().trim();
  
  // Handle variations first (before type assertion)
  if (lowercased === 'critical' || lowercased === 'urgent') {
    return 'high';
  }
  
  const normalized = lowercased as TicketPriority;
  
  if (VALID_PRIORITIES.includes(normalized)) {
    return normalized;
  }
  
  return 'medium'; // Default fallback
}

/**
 * Safely parse a date from various formats
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }
  
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  return null;
}

/**
 * Generate a shortened display ID from the full ticket ID
 * Uses last 8 characters for uniqueness (MongoDB ObjectIds share prefixes for same-time creation)
 */
function generateDisplayId(id: unknown): string {
  if (!id || typeof id !== 'string') {
    return '#unknown';
  }
  
  // Use last 8 characters for uniqueness
  const shortId = id.length > 8 ? id.slice(-8) : id;
  return `#${shortId}`;
}

/**
 * Safely get a string value with fallback
 */
function getString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Safely get an array with fallback
 */
function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return [];
}

/**
 * Main normalization function
 * 
 * Transforms raw backend ticket data into a normalized format for UI consumption.
 * Handles missing fields, invalid values, and inconsistent data.
 * 
 * @param ticket - Raw ticket object from backend
 * @returns Normalized ticket object safe for UI display
 */
export function normalizeTicket(ticket: unknown): NormalizedTicket {
  if (!ticket || typeof ticket !== 'object') {
    // Return a minimal valid ticket if input is invalid
    return {
      id: 'invalid',
      displayId: '#invalid',
      title: 'Invalid Ticket',
      description: 'This ticket data could not be loaded.',
      category: 'Unknown',
      priority: 'medium',
      priorityLabel: 'Medium',
      status: 'open',
      statusLabel: 'Open',
      location: 'Unknown',
      createdBy: '',
      createdByName: 'Unknown',
      assignedTo: null,
      assignedToName: 'Unassigned',
      assignedTechnicianPhone: null,
      contactPhone: null,
      imageUrls: [],
      buildingId: null,
      buildingName: 'Unknown',
      timeline: [],
      createdAt: null,
      updatedAt: null,
      completedAt: null,
      aiDetection: null,
      _raw: ticket,
    };
  }

  // Safe cast — we've confirmed it's a non-null object above
  const t = ticket as RawTicket;

  // Extract ID - handle both 'id' and '_id' fields
  const id = getString(t.id || t._id, 'unknown');
  
  // Normalize status and priority
  const status = normalizeStatus(t.status);
  const priority = normalizePriority(t.priority);
  
  // Handle assigned to - show "Unassigned" if no value
  const assignedToName = getString(
    t.assignedToName || t.assigned_to_name,
    ''
  );

  const aiRaw = t.aiDetection as RawTicket | undefined;

  return {
    id,
    displayId: generateDisplayId(id),
    title: getString(t.title, 'Untitled Ticket'),
    description: getString(t.description, 'No description provided.'),
    category: getString(t.category, 'General'),
    priority,
    priorityLabel: capitalize(priority),
    status,
    statusLabel: formatStatusLabel(status),
    location: getString(t.location, 'Not specified'),
    createdBy: getString(t.createdBy || t.created_by, ''),
    createdByName: getString(
      t.createdByName || t.created_by_name || t.createdBy,
      'Unknown User'
    ),
    assignedTo: (t.assignedTo || t.assigned_to || null) as string | null,
    assignedToName: assignedToName || 'Unassigned',
    assignedTechnicianPhone: getString(
      t.assignedTechnicianPhone || t.assigned_technician_phone,
      ''
    ) || null,
    contactPhone: getString(t.contactPhone || t.contact_phone, '') || null,
    imageUrls: getArray(t.imageUrls || t.image_urls) as string[],
    completionImageUrls: getArray(
      t.completionImageUrls || t.completion_image_urls || t.completedWorkImageUrls
    ) as string[],
    buildingId: (t.buildingId || t.building_id || null) as string | null,
    buildingName: getString(
      t.buildingName || t.building_name || t.building,
      'Unknown Building'
    ),
    timeline: getArray(t.timeline) as unknown as TimelineEvent[],
    createdAt: parseDate(t.createdAt || t.created_at),
    updatedAt: parseDate(t.updatedAt || t.updated_at),
    completedAt: parseDate(t.completedAt || t.completed_at),
    // AI detection results from MobileNetV2
    aiDetection: aiRaw ? {
      detectedLabel: getString(aiRaw.detectedLabel, 'Unknown'),
      confidence: typeof aiRaw.confidence === 'number' ? aiRaw.confidence : 0,
      mappedCategory: getString(aiRaw.mappedCategory, 'other'),
      modelVersion: getString(aiRaw.modelVersion, 'unknown'),
    } : null,
    _raw: t,
  };
}

/**
 * Normalize an array of tickets
 * Filters out any completely invalid entries
 */
export function normalizeTickets(tickets: unknown[]): NormalizedTicket[] {
  if (!Array.isArray(tickets)) return [];
  
  return tickets
    .filter(ticket => ticket && typeof ticket === 'object')
    .map(normalizeTicket);
}

/**
 * Get status badge color classes
 */
export function getStatusColor(status: TicketStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'open':
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800'
      };
    case 'assigned':
      return {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800'
      };
    case 'accepted':
      return {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800'
      };
    case 'in_progress':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'completed':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700'
      };
  }
}

/**
 * Get priority badge color classes
 */
export function getPriorityColor(priority: TicketPriority): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'high':
      return {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800'
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    case 'low':
      return {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-700 dark:text-green-300',
        border: 'border-green-200 dark:border-green-800'
      };
    default:
      return {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-200 dark:border-gray-700'
      };
  }
}
