// Application Configuration

export const APP_CONFIG = {
  name: 'FixItNow',
  version: '1.0.0',
  description: 'Maintenance Management System',

  // Feature flags
  features: {
    phoneAuth: true,
    socialAuth: true,
    emailAuth: true,
    notifications: true,
    preventiveMaintenance: true,
    analytics: false, // TODO: Implement analytics
  },

  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },

  // Authentication Configuration
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    rememberMe: true,
    providers: {
      email: true,
      phone: true,
      google: true,
      facebook: true,
      apple: true,
    },
  },

  // Database Configuration
  database: {
    name: 'fixitnow',
    collections: {
      users: 'users',
      tickets: 'tickets',
      technicians: 'technicians',
      preventiveMaintenance: 'preventive_maintenance',
      dashboardStats: 'dashboard_stats',
    },
  },

  // Pagination
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
    pageSizeOptions: [10, 25, 50, 100],
  },

  // Ticket Configuration
  tickets: {
    priorities: ['low', 'medium', 'high', 'urgent'] as const,
    statuses: ['open', 'in-progress', 'resolved', 'closed'] as const,
    defaultPriority: 'medium' as const,
    defaultStatus: 'open' as const,
  },

  // Technician Configuration
  technicians: {
    statuses: ['available', 'busy', 'offline'] as const,
    maxAssignedTickets: 10,
  },

  // Notification Configuration
  notifications: {
    defaultPreferences: {
      email: true,
      push: true,
      ticketUpdates: true,
      maintenanceReminders: true,
    },
    channels: ['email', 'push', 'sms'] as const,
  },

  // UI Configuration
  ui: {
    theme: {
      primaryColor: '#2563eb',
      accentColor: '#2563eb',
      borderRadius: '12px',
      motionFast: '120ms',
      motionMedium: '240ms',
      motionSlow: '360ms',
    },
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'HH:mm',
    dateTimeFormat: 'MMM dd, yyyy HH:mm',
  },

  // File Upload Configuration (for Cloudinary)
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles: 5,
  },

  // Roles and Permissions
  roles: {
    admin: {
      label: 'Administrator',
      permissions: ['all'] as string[],
      navigation: ['dashboard', 'tickets', 'technicians', 'reports', 'settings'] as string[],
    },
    technician: {
      label: 'Technician',
      permissions: ['view_tickets', 'update_tickets', 'view_technicians', 'update_profile'] as string[],
      navigation: ['dashboard', 'tickets', 'technicians', 'settings'] as string[],
    },
    resident: {
      label: 'Resident',
      permissions: ['create_tickets', 'view_own_tickets', 'update_profile'] as string[],
      navigation: ['dashboard', 'tickets', 'settings'] as string[],
    },
  },
};

// Type exports
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in-progress' | 'resolved' | 'closed';
export type TechnicianStatus = 'available' | 'busy' | 'offline';
export type UserRole = 'admin' | 'technician' | 'resident';
export type NotificationChannel = 'email' | 'push' | 'sms';

// Helper functions
export const getRoleConfig = (role: UserRole) => {
  return APP_CONFIG.roles[role];
};

export const hasPermission = (role: UserRole, permission: string) => {
  const roleConfig = getRoleConfig(role);
  return roleConfig.permissions.includes('all') || roleConfig.permissions.includes(permission);
};

export const canAccessPage = (role: UserRole, page: string) => {
  const roleConfig = getRoleConfig(role);
  return roleConfig.navigation.includes(page);
};

export const isFeatureEnabled = (feature: keyof typeof APP_CONFIG.features) => {
  return APP_CONFIG.features[feature];
};
