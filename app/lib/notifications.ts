/**
 * Notification Helper Functions
 * 
 * Utility functions for creating notifications from various parts of the app.
 */

interface CreateNotificationParams {
  userId: string;
  type: 'ticket' | 'system' | 'announcement' | 'assignment';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        icon: params.icon || getDefaultIcon(params.type),
        actionUrl: params.actionUrl
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Get default icon for notification type
 */
function getDefaultIcon(type: string): string {
  switch (type) {
    case 'ticket':
      return '🎫';
    case 'assignment':
      return '🔧';
    case 'announcement':
      return '📢';
    case 'system':
      return '⚙️';
    default:
      return '🔔';
  }
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  ticketCreated: (ticketId: string, title: string, creatorName: string) => ({
    type: 'ticket' as const,
    title: `New Ticket Created`,
    message: `${creatorName} created ticket: ${title}`,
    icon: '🎫',
    actionUrl: `/tickets/${ticketId}`
  }),

  ticketAssigned: (ticketId: string, title: string) => ({
    type: 'assignment' as const,
    title: `New Ticket Assigned`,
    message: `You have been assigned to: ${title}`,
    icon: '🔧',
    actionUrl: `/tickets/${ticketId}`
  }),

  ticketResolved: (ticketId: string, title: string) => ({
    type: 'ticket' as const,
    title: `Ticket Resolved`,
    message: `Your ticket "${title}" has been resolved`,
    icon: '✅',
    actionUrl: `/tickets/${ticketId}`
  }),

  ticketComment: (ticketId: string, commenterName: string) => ({
    type: 'ticket' as const,
    title: `New Comment`,
    message: `${commenterName} commented on your ticket`,
    icon: '💬',
    actionUrl: `/tickets/${ticketId}`
  }),

  announcement: (title: string, message: string) => ({
    type: 'announcement' as const,
    title,
    message,
    icon: '📢'
  })
};
