# Technician Assignment Workflow

## Overview
This document describes the complete ticket assignment and status tracking workflow implemented in FixItNow.

**Database:** All data is stored in MongoDB. Firebase is used ONLY for authentication.

## Ticket Status Flow

```
open → assigned → accepted → in-progress → completed → resolved → closed
```

### Status Definitions

1. **open** - Ticket created by resident, awaiting assignment
2. **assigned** - Admin has assigned ticket to a technician
3. **accepted** - Technician has accepted the assignment
4. **in-progress** - Technician is actively working on the ticket
5. **completed** - Technician has finished the work
6. **resolved** - Admin or resident confirms work is satisfactory
7. **closed** - Ticket is archived and finalized

## Role-Based Permissions

### Admin
- **Can see:** All tickets in their building
- **Can update status to:** All statuses
- **Special actions:** Assign tickets to technicians

### Technician
- **Can see:** Only tickets assigned to them
- **Can update status to:** assigned, accepted, in-progress, completed
- **Workflow:** assigned → accept → work → complete

### Resident
- **Can see:** Only their own tickets
- **Can update status to:** open, closed
- **Actions:** Create tickets, close resolved tickets

## Timeline Tracking

Every status change is tracked in the ticket's `timeline` array with:
- Status changed to
- Timestamp of change
- User ID who made the change
- User display name
- Optional note about the change

### Timeline Events Structure
```typescript
interface TimelineEvent {
  status: TicketStatus;
  timestamp: Timestamp | Date;
  userId: string;
  userName: string;
  note?: string;
}
```

## Implementation Details

### MongoDB Schema
```typescript
interface Ticket {
  _id?: string;
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: TicketStatus;
  location: string;
  contactPhone?: string;
  imageUrls?: string[];
  
  // User & Building
  createdBy: string;
  createdByName: string;
  buildingId: string;
  buildingName: string;
  
  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedTechnicianId?: string; // Legacy support
  assignedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  
  // Timeline
  timeline?: TimelineEvent[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}
```

### Key Functions

#### `createTicket()`
- Creates new ticket in MongoDB with initial timeline event
- Sets status to "open" by default
- Records creation in timeline with Date timestamp

#### `assignTicket(ticketId, techUid, techName, adminUid, adminName)`
- Changes status to "assigned"
- Sets `assignedTo`, `assignedToName`, `assignedTechnicianId`
- Records `assignedAt` Date timestamp
- Adds timeline event: "Assigned to [technicianName]"
- Updates MongoDB document

#### `updateTicketStatus(ticketId, status, userId, userName, note?)`
- Updates ticket status in MongoDB
- Records specific timestamps (acceptedAt, completedAt, resolvedAt)
- Appends new timeline event with optional note
- All status changes are audited

### UI Components

#### Tickets Table
- **Status Dropdown:** Shows role-appropriate options
  - Admin: all 7 statuses
  - Technician: assigned, accepted, in-progress, completed
  - Resident: open, closed
- **Assign Button:** Admins can assign unassigned tickets
- **View Details:** Opens modal with full ticket info and timeline

#### Ticket Details Modal
- Full ticket information
- Assignment details
- Contact information
- Uploaded images
- **Timeline Component:** Visual history of all status changes

#### TicketTimeline Component
- Displays chronological timeline (newest first)
- Color-coded status badges
- Status icons (📝, 👤, ✅, 🔧, ✓, 🎉, 🔒)
- User attribution for each change
- Optional notes/comments
- Formatted timestamps

## Example Workflow

### Scenario: Broken HVAC Unit

1. **Resident creates ticket**
   - Status: `open`
   - Timeline: "Ticket created" by John Resident

2. **Admin assigns to technician**
   - Status: `open` → `assigned`
   - Timeline: "Assigned to Jane Technician" by Admin Smith

3. **Technician accepts**
   - Status: `assigned` → `accepted`
   - Timeline: "Technician Accepted" by Jane Technician

4. **Technician starts work**
   - Status: `accepted` → `in-progress`
   - Timeline: "Work In Progress" by Jane Technician
   - Optional note: "Inspecting HVAC unit, ordering replacement parts"

5. **Technician completes work**
   - Status: `in-progress` → `completed`
   - Timeline: "Work Completed" by Jane Technician
   - Note: "Replaced compressor and tested system"

6. **Admin verifies and resolves**
   - Status: `completed` → `resolved`
   - Timeline: "Ticket Resolved" by Admin Smith
   - Note: "Work confirmed satisfactory"

7. **Resident closes ticket**
   - Status: `resolved` → `closed`
   - Timeline: "Ticket Closed" by John Resident

## MongoDB Security

MongoDB uses connection string authentication and server-side validation.
All database operations are performed server-side via API routes or database.ts functions.

```javascript
// Example MongoDB query with building isolation
db.collection('tickets').find({
  buildingId: userBuildingId,
  // Additional role-based filters
}).toArray();

// Role-based access control
function userCanUpdateTicket(ticket, userRole, userId) {
  return userRole === 'admin' 
    || (userRole === 'technician' && ticket.assignedTo === userId)
    || (userRole === 'resident' && ticket.createdBy === userId);
}
```

## Future Enhancements

- **Real-time updates:** Use MongoDB Change Streams for live ticket updates
- **Notifications:** Email/push notifications when ticket status changes
- **Comments system:** Allow technicians and residents to communicate
- **Time tracking:** Record time spent in each status
- **Automatic assignment:** Load-balance tickets across technicians
- **Escalation rules:** Auto-escalate tickets that remain open too long
- **Analytics dashboard:** Metrics on resolution times, technician performance
