/**
 * Database Types
 * 
 * Type definitions for MongoDB collections.
 * Safe to import in both client and server components.
 */

/**
 * User role type
 */
export type UserRole = 'admin' | 'technician' | 'resident';

/**
 * Subscription plan types
 * BASIC = Tier 3, PRO = Tier 2, ENTERPRISE = Tier 1
 */
export type SubscriptionPlan = 'BASIC' | 'PRO' | 'ENTERPRISE';

/**
 * Subscription tier (1 = Enterprise, 2 = Pro, 3 = Basic)
 * Lower tier number = higher access level
 */
export type SubscriptionTier = 1 | 2 | 3;

/**
 * Building data structure
 */
export interface Building {
  id: string;
  name: string;
  address: string;
  joinCode: string;         // unique join code in format ABC-123-XYZ
  adminId: string;          // user who created this building
  isActive: boolean;        // building active status
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User profile data stored in MongoDB
 */
export interface UserProfile {
  uid: string;              // Firebase Auth UID
  name: string;
  email: string;            // unique
  passwordHash?: string;    // bcrypt hash (optional, for custom auth if needed)
  phoneNumber?: string;
  role: UserRole;
  buildingId?: string;      // null for platform super admin
  buildingName?: string;
  awaitApproval?: boolean;  // true for technicians pending approval
  isActive: boolean;
  // Subscription info
  subscriptionPlan?: SubscriptionPlan;  // BASIC, PRO, or ENTERPRISE
  subscriptionTier?: SubscriptionTier;  // 1=Enterprise, 2=Pro, 3=Basic
  subscriptionBillingCycle?: 'monthly' | 'yearly';
  subscriptionStartDate?: Date;
  // Stripe-specific fields
  stripeCustomerId?: string;      // Stripe customer ID
  subscriptionId?: string;        // Active Stripe subscription ID
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ticket category
 */
export type TicketCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'cleaning'
  | 'carpentry'
  | 'appliance'
  | 'painting'
  | 'landscaping'
  | 'security'
  | 'other';

/**
 * Ticket priority levels
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Ticket status
 */
export type TicketStatus = 'open' | 'assigned' | 'accepted' | 'in_progress' | 'completed';

/**
 * Timeline event for ticket status changes
 */
export interface TimelineEvent {
  status: TicketStatus;
  timestamp: Date;
  by: string;               // user ID who caused the change
  userName?: string;        // optional user name for display
  note?: string;
}

/**
 * Comment on a ticket
 */
export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Ticket data structure stored in MongoDB
 */
export interface Ticket {
  id: string;
  buildingId: string;
  createdBy: string;        // resident user id
  createdByName: string;
  assignedTo?: string;      // technician user id
  assignedToName?: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  location: string;
  contactPhone?: string;
  imageUrl?: string;        // primary image URL
  imageUrls?: string[];     // multiple image URLs
  imagePublicIds?: string[];  // Cloudinary public_ids for deletion
  aiCategory?: TicketCategory; // from MobileNetV2 or other AI model

  // Timeline tracking
  timeline: TimelineEvent[];

  // Comments
  comments?: TicketComment[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

/**
 * Invoice status
 */
export type InvoiceStatus = 'pending' | 'paid' | 'cancelled';

/**
 * Invoice data structure for billing
 */
export interface Invoice {
  id: string;
  ticketId: string;
  buildingId: string;
  userId: string;           // resident user id
  amount: number;
  currency: string;         // e.g., "INR", "USD"
  status: InvoiceStatus;
  stripeSessionId?: string; // Stripe checkout session ID
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ML model types
 */
export type MLModel = 'RandomForest' | 'LogisticRegression';

/**
 * Risk bucket classification
 */
export type RiskBucket = 'low' | 'medium' | 'high';

/**
 * Prediction result from ML model
 */
export interface PredictionResult {
  failureProbability: number;
  riskBucket: RiskBucket;
  recommendedAction: string;
}

/**
 * Prediction data structure for ML models
 */
export interface Prediction {
  id: string;
  buildingId: string;
  ticketId?: string;        // null for general building predictions
  model: MLModel;
  inputFeatures: Record<string, unknown>; // anonymized features
  prediction: PredictionResult;
  createdAt: Date;
}

/**
 * Announcement type - system-wide or building-specific
 */
export type AnnouncementType = 'system' | 'building';

/**
 * Announcement priority levels
 */
export type AnnouncementPriority = 'info' | 'warning' | 'urgent';

/**
 * Announcement data structure
 * System announcements: From dev team, visible to all users
 * Building announcements: From building admin/president, visible to building members only
 */
export interface Announcement {
  id: string;
  type: AnnouncementType;
  buildingId?: string;        // null/undefined for system announcements
  buildingName?: string;      // for display purposes
  title: string;
  content: string;
  priority: AnnouncementPriority;
  authorId: string;
  authorName: string;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

