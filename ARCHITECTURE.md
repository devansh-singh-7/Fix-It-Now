# FixItNow Architecture - Post MongoDB Migration

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  React Components (pages & components)                          │
│  ├─ SignUpForm                                                  │
│  ├─ BuildingsPage                                               │
│  ├─ TicketsPage                                                 │
│  └─ CreateTicketForm                                            │
│                          │                                       │
│                          ▼                                       │
│              app/lib/firebaseClient.ts                          │
│              (Imports & Re-exports)                             │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  FIREBASE AUTH   │    │  DATABASE OPS    │
    │  (Authentication)│    │  (Data Storage)  │
    └──────────────────┘    └──────────────────┘
              │                         │
              │                         ▼
              │             app/lib/database.ts
              │             (MongoDB Operations)
              │                         │
              │                         ▼
              │             ┌──────────────────┐
              │             │  API Routes      │
              │             │  /api/users/*    │
              │             └──────────────────┘
              │                         │
              ▼                         ▼
    ┌──────────────────┐    ┌──────────────────┐
    │  Firebase        │    │  MongoDB Atlas   │
    │  Authentication  │    │  (Cloud DB)      │
    │  Service         │    │                  │
    └──────────────────┘    └──────────────────┘
```

---

## Authentication Flow (Firebase Only)

```
User Signs Up
     │
     ▼
firebaseClient.createUserWithEmail()
     │
     ├─► Firebase Auth: Create user account
     │   └─► Success: User authenticated
     │
     └─► API Call: /api/users/create
         └─► MongoDB: Store user profile
             └─► Collection: users
```

---

## Data Operations Flow (MongoDB Only)

```
User Creates Ticket
     │
     ▼
Component calls createTicket()
     │
     ▼
database.ts → createTicket()
     │
     ▼
MongoDB: Insert into tickets collection
     │
     └─► Document: {
           id, title, status,
           timeline: [...],
           createdAt: Date
         }
```

---

## MongoDB Collections Structure

```
fixitnow (database)
│
├── users
│   ├── { uid, email, role, buildingId, ... }
│   ├── { uid, email, role, buildingId, ... }
│   └── ...
│
├── buildings
│   ├── { id, name, joinCode, adminId, ... }
│   ├── { id, name, joinCode, adminId, ... }
│   └── ...
│
└── tickets
    ├── { id, title, status, timeline: [...], ... }
    ├── { id, title, status, timeline: [...], ... }
    └── ...
```

---

## File Structure

```
fixitnow/
├── app/
│   ├── lib/
│   │   ├── firebaseClient.ts  ⚠️  Auth Only + Re-exports
│   │   ├── database.ts        ✅  All MongoDB Operations
│   │   └── mongodb.ts         ✅  MongoDB Connection
│   │
│   ├── api/
│   │   └── users/
│   │       ├── create/
│   │       │   └── route.ts   ✅  Create user in MongoDB
│   │       └── profile/
│   │           └── route.ts   ✅  Get user from MongoDB
│   │
│   ├── components/
│   │   ├── TicketTimeline.tsx ✅  Updated: Date instead of Timestamp
│   │   └── ...
│   │
│   └── (pages)
│       ├── tickets/
│       ├── buildings/
│       └── ...
│
├── .env.local
│   ├── NEXT_PUBLIC_FIREBASE_* (Auth)
│   └── MONGODB_URI (Data)
│
└── Documentation
    ├── MIGRATION_SUMMARY.md
    ├── MONGODB_MIGRATION.md
    └── TECHNICIAN_WORKFLOW.md
```

---

## Key Principles

1. **Separation of Concerns**
   - Firebase = Authentication
   - MongoDB = Data Storage

2. **Type Safety**
   - All interfaces defined in database.ts
   - Re-exported from firebaseClient.ts
   - No breaking changes to components

3. **Date Handling**
   - All timestamps use JavaScript Date
   - No Firestore Timestamp conversions

4. **API-First**
   - Server-side operations via API routes
   - Direct database access from database.ts
   - Secure connection string in environment

---

## Component Import Pattern

```typescript
// Components import from firebaseClient.ts (unchanged)
import { 
  auth,                    // Firebase Auth
  getUserProfile,          // MongoDB via database.ts
  createTicket,            // MongoDB via database.ts
  type Ticket,             // Type from database.ts
} from '@/app/lib/firebaseClient';

// firebaseClient.ts re-exports everything
export { auth };           // Firebase Auth instance
export {                   // MongoDB functions
  getUserProfile,
  createTicket,
  // ...
} from './database';
export type {              // TypeScript types
  Ticket,
  UserProfile,
  // ...
} from './database';
```

---

## Migration Benefits

✅ **No Firestore costs** - MongoDB pricing more predictable  
✅ **Better queries** - Complex aggregations supported  
✅ **Flexible schema** - Easy to add new fields  
✅ **Local development** - Can run MongoDB locally  
✅ **Type safety** - Maintained with TypeScript interfaces  
✅ **No component changes** - Re-exports keep imports working  

---

## Testing Strategy

1. **Authentication (Firebase)**
   ```typescript
   await signInWithEmail(email, password);
   await createUserWithEmail(email, password, name, role);
   ```

2. **Data Operations (MongoDB)**
   ```typescript
   const profile = await getUserProfile(uid);
   const building = await createBuilding(adminUid, data);
   const tickets = await getTicketsForUser(uid, role, buildingId);
   ```

3. **Timeline Tracking**
   ```typescript
   await createTicket(ticketData, uid);
   // ✅ Timeline initialized with creation event
   
   await assignTicket(ticketId, techUid, techName, adminUid, adminName);
   // ✅ Timeline updated with assignment event
   ```

---

**Migration Status: COMPLETE ✅**
