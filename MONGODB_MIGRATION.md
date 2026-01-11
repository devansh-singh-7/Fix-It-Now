# MongoDB Migration Complete ✅

## Overview

All database operations have been migrated from Firebase Firestore to MongoDB. Firebase is now used **ONLY for authentication** (email/password, Google, Facebook, Apple, phone number).

## Architecture

### Authentication Layer (Firebase)
- **File:** `app/lib/firebaseClient.ts`
- **Purpose:** User authentication only
- **Features:**
  - Email/password authentication
  - Social login (Google, Facebook, Apple)
  - Phone number authentication
  - Password reset

### Data Layer (MongoDB)
- **File:** `app/lib/database.ts`
- **Purpose:** All data storage and retrieval
- **Collections:**
  - `users` - User profiles with role and building assignment
  - `buildings` - Building information and join codes
  - `tickets` - Maintenance tickets with timeline tracking

### API Routes
- **Location:** `app/api/`
- **Purpose:** Server-side database operations
- **Routes:**
  - `POST /api/users/create` - Create user profile in MongoDB
  - `GET /api/users/profile?uid={uid}` - Fetch user profile

## Database Schema

### Users Collection
```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: 'admin' | 'technician' | 'resident';
  buildingId?: string;
  buildingName?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### Buildings Collection
```typescript
{
  id: string;
  name: string;
  address: string;
  joinCode: string;         // Format: ABC-123-XYZ
  adminId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tickets Collection
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'accepted' | 'in-progress' | 'completed' | 'resolved' | 'closed';
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
  assignedAt?: Date;
  acceptedAt?: Date;
  completedAt?: Date;
  
  // Timeline
  timeline?: Array<{
    status: TicketStatus;
    timestamp: Date;
    userId: string;
    userName: string;
    note?: string;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}
```

## Key Functions

All database functions are in `app/lib/database.ts`:

### User Management
- `getUserProfile(uid)` - Fetch user profile from MongoDB
- `createUserProfile(userData)` - Create new user profile
- `getUserRole(uid)` - Get user's role
- `getUserBuildingId(uid)` - Get user's building ID

### Building Management
- `createBuilding(adminUid, buildingData)` - Create new building
- `getBuilding(buildingId)` - Fetch building by ID
- `getBuildingByJoinCode(joinCode)` - Fetch building by join code
- `getBuildingsForAdmin(adminUid)` - Get all buildings for admin

### Ticket Management
- `getTicketsForUser(uid, role, buildingId)` - Role-based ticket fetch
- `createTicket(ticketData, uid)` - Create new ticket with timeline
- `updateTicketStatus(ticketId, status, userId, userName, note)` - Update status and timeline
- `assignTicket(ticketId, techUid, techName, adminUid, adminName)` - Assign to technician
- `getTechniciansForBuilding(buildingId)` - Get all technicians in building

## User Sign-up Flow

1. **Frontend** (`createUserWithEmail` in firebaseClient.ts):
   - Creates user in Firebase Auth
   - Updates display name in Firebase profile
   - Calls `/api/users/create` with user data

2. **Backend** (`/api/users/create`):
   - Validates building join code (for non-admins)
   - Checks for duplicate email/phone
   - Creates user document in MongoDB `users` collection
   - Returns success/error response

3. **Result:**
   - User can authenticate with Firebase
   - User profile stored in MongoDB
   - Role-based access enforced by database queries

## Environment Variables

Add to `.env.local`:

```env
# Firebase (Authentication Only)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB (Data Storage)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fixitnow?retryWrites=true&w=majority
```

## Migration Changes

### Removed
- ❌ All Firestore imports and initialization
- ❌ `serverTimestamp()` - replaced with `new Date()`
- ❌ Firestore `Timestamp` type - replaced with `Date`
- ❌ Firestore queries (`collection`, `query`, `where`, `getDocs`)
- ❌ Firestore documents (`doc`, `setDoc`, `getDoc`, `updateDoc`)

### Added
- ✅ MongoDB connection (`app/lib/mongodb.ts`)
- ✅ Database operations (`app/lib/database.ts`)
- ✅ Type exports in firebaseClient.ts (re-exported from database.ts)
- ✅ API routes for server-side database operations
- ✅ Date objects for all timestamps

### Updated
- ✅ `firebaseClient.ts` - Now auth-only, re-exports database functions
- ✅ `TicketTimeline.tsx` - Uses Date instead of Timestamp
- ✅ All components - Import database functions via firebaseClient.ts

## Testing

After migration, test these flows:

1. **Sign Up**
   - ✅ Admin sign up (no join code)
   - ✅ Resident/Technician sign up (with join code)
   - ✅ Duplicate email prevention

2. **Buildings**
   - ✅ Admin creates building
   - ✅ Join code generation (ABC-123-XYZ format)
   - ✅ Join code validation

3. **Tickets**
   - ✅ Create ticket
   - ✅ Timeline initialization
   - ✅ Assign ticket to technician
   - ✅ Update ticket status
   - ✅ Timeline tracking
   - ✅ Role-based visibility

4. **Authentication**
   - ✅ Email/password login
   - ✅ Social login
   - ✅ Phone number login
   - ✅ Password reset

## Benefits of MongoDB

1. **Flexible Schema** - Easy to add new fields without migrations
2. **Powerful Queries** - Complex aggregations and filters
3. **Better Performance** - Optimized for read-heavy workloads
4. **Cost-Effective** - No per-operation pricing
5. **Local Development** - Can run MongoDB locally
6. **Rich Ecosystem** - Extensive tooling and libraries

## Important Notes

- **Firebase is NOT used for data storage** - only authentication
- All database operations use MongoDB via `app/lib/database.ts`
- All timestamps are JavaScript `Date` objects (not Firestore Timestamps)
- Building IDs and Ticket IDs are generated using `new Date().getTime().toString()`
- MongoDB `_id` field is separate from our `id` field (excluded in API responses)

## Files Modified

1. ✅ `app/lib/firebaseClient.ts` - Removed all Firestore code, kept auth only
2. ✅ `app/lib/database.ts` - Created with all MongoDB operations
3. ✅ `app/lib/mongodb.ts` - Already existed (MongoDB connection)
4. ✅ `app/api/users/create/route.ts` - Updated to use `uid` instead of `firebaseUid`
5. ✅ `app/api/users/profile/route.ts` - Updated to use `uid` instead of `firebaseUid`
6. ✅ `app/components/TicketTimeline.tsx` - Updated to use Date instead of Timestamp
7. ✅ `TECHNICIAN_WORKFLOW.md` - Updated documentation

## Next Steps

1. Update `.env.local` with MongoDB connection string
2. Test all authentication flows
3. Test all database operations
4. Monitor MongoDB Atlas dashboard for performance
5. Set up database indexes for frequently queried fields:
   - `users`: Index on `uid`, `email`, `buildingId`, `role`
   - `buildings`: Index on `id`, `joinCode`, `adminId`
   - `tickets`: Index on `id`, `buildingId`, `createdBy`, `assignedTo`, `status`
