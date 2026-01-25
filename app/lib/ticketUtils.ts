/**
 * Ticket Normalization Utilities
 * 
 * These functions normalize ticket data from the backend to ensure
 * consistent UI display regardless of data inconsistencies.
 */

import type { Ticket, TicketStatus, TicketPriority } from './types';

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
  buildingId: string | null;
  buildingName: string;
  timeline: any[];
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
  _raw: any;
}

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
function normalizeStatus(status: any): TicketStatus {
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
function normalizePriority(priority: any): TicketPriority {
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
function parseDate(value: any): Date | null {
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
function generateDisplayId(id: any): string {
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
function getString(value: any, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * Safely get an array with fallback
 */
function getArray(value: any): any[] {
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
export function normalizeTicket(ticket: any): NormalizedTicket {
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

  // Extract ID - handle both 'id' and '_id' fields
  const id = getString(ticket.id || ticket._id, 'unknown');
  
  // Normalize status and priority
  const status = normalizeStatus(ticket.status);
  const priority = normalizePriority(ticket.priority);
  
  // Handle assigned to - show "Unassigned" if no value
  const assignedToName = getString(
    ticket.assignedToName || ticket.assigned_to_name,
    ''
  );

  return {
    id,
    displayId: generateDisplayId(id),
    title: getString(ticket.title, 'Untitled Ticket'),
    description: getString(ticket.description, 'No description provided.'),
    category: getString(ticket.category, 'General'),
    priority,
    priorityLabel: capitalize(priority),
    status,
    statusLabel: formatStatusLabel(status),
    location: getString(ticket.location, 'Not specified'),
    createdBy: getString(ticket.createdBy || ticket.created_by, ''),
    createdByName: getString(
      ticket.createdByName || ticket.created_by_name || ticket.createdBy,
      'Unknown User'
    ),
    assignedTo: ticket.assignedTo || ticket.assigned_to || null,
    assignedToName: assignedToName || 'Unassigned',
    assignedTechnicianPhone: getString(
      ticket.assignedTechnicianPhone || ticket.assigned_technician_phone,
      ''
    ) || null,
    contactPhone: getString(ticket.contactPhone || ticket.contact_phone, '') || null,
    imageUrls: getArray(ticket.imageUrls || ticket.image_urls),
    buildingId: ticket.buildingId || ticket.building_id || null,
    buildingName: getString(
      ticket.buildingName || ticket.building_name || ticket.building,
      'Unknown Building'
    ),
    timeline: getArray(ticket.timeline),
    createdAt: parseDate(ticket.createdAt || ticket.created_at),
    updatedAt: parseDate(ticket.updatedAt || ticket.updated_at),
    completedAt: parseDate(ticket.completedAt || ticket.completed_at),
    // AI detection results from MobileNetV2
    aiDetection: ticket.aiDetection ? {
      detectedLabel: getString(ticket.aiDetection.detectedLabel, 'Unknown'),
      confidence: typeof ticket.aiDetection.confidence === 'number' ? ticket.aiDetection.confidence : 0,
      mappedCategory: getString(ticket.aiDetection.mappedCategory, 'other'),
      modelVersion: getString(ticket.aiDetection.modelVersion, 'unknown'),
    } : null,
    _raw: ticket,
  };
}

/**
 * Normalize an array of tickets
 * Filters out any completely invalid entries
 */
export function normalizeTickets(tickets: any[]): NormalizedTicket[] {
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
