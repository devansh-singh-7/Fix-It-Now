# MongoDB Database Schema

This document describes the complete MongoDB schema for the FixItNow application.

## Database Name
`fixitnow`

## Collections

### 1. users
Stores user profiles and authentication information.

```typescript
{
  "_id": ObjectId,
  "uid": string,                    // Firebase Auth UID (unique)
  "name": string,                   // User's display name
  "email": string,                  // unique
  "passwordHash"?: string,          // bcrypt hash (optional, for custom auth)
  "phoneNumber"?: string,
  "role": "admin" | "resident" | "technician",
  "buildingId"?: string,            // null for platform super admin
  "buildingName"?: string,
  "awaitApproval"?: boolean,        // true for technicians pending approval
  "isActive": boolean,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes:**
- `{ uid: 1 }` - Unique index for Firebase Auth UID lookup
- `{ email: 1 }` - Unique index for email lookup
- `{ buildingId: 1, role: 1 }` - Compound index for building queries

---

### 2. buildings
Stores building/property information.

```typescript
{
  "_id": ObjectId,
  "id": string,                     // Custom string ID (timestamp-based)
  "name": string,                   // "Sunrise Apartments"
  "address": string,                // "Somewhere, City"
  "joinCode": string,               // "EQX-92H-TK5" (unique, format: ABC-123-XYZ)
  "adminId": string,                // user UID who created this building
  "isActive": boolean,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes:**
- `{ id: 1 }` - Unique index for building ID lookup
- `{ joinCode: 1 }` - Unique index for join code validation
- `{ adminId: 1 }` - Index for admin's buildings lookup

---

### 3. tickets
Stores maintenance tickets with timeline tracking.

```typescript
{
  "_id": ObjectId,
  "id": string,                     // Custom string ID (timestamp-based)
  "buildingId": string,
  "createdBy": string,              // resident user UID
  "createdByName": string,
  "assignedTo"?: string,            // technician user UID (optional)
  "assignedToName"?: string,
  "title": string,                  // "Leaking pipe"
  "description": string,            // "Ceiling is leaking near bedroom."
  "category": "plumbing" | "electrical" | "hvac" | "cleaning" | "other",
  "priority": "low" | "medium" | "high" | "urgent",
  "status": "open" | "assigned" | "accepted" | "in_progress" | "completed",
  "location": string,               // "Flat 402 - Bedroom ceiling"
  "contactPhone"?: string,
  "imageUrl"?: string,              // primary image URL
  "imageUrls"?: string[],           // multiple image URLs
  "aiCategory"?: "plumbing" | "electrical" | "hvac" | "cleaning" | "other", // from MobileNetV2
  "timeline": [
    {
      "status": "open" | "assigned" | "accepted" | "in_progress" | "completed",
      "timestamp": ISODate,
      "by": string,                  // user UID who caused the change
      "userName"?: string,           // optional user name for display
      "note"?: string
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "assignedAt"?: ISODate,
  "acceptedAt"?: ISODate,
  "completedAt"?: ISODate
}
```

**Indexes:**
- `{ id: 1 }` - Unique index for ticket ID lookup
- `{ buildingId: 1, status: 1 }` - Compound index for building ticket queries
- `{ createdBy: 1 }` - Index for resident's tickets
- `{ assignedTo: 1 }` - Index for technician's assigned tickets
- `{ buildingId: 1, createdAt: -1 }` - Compound index for sorted queries

---

### 4. invoices
Stores billing and payment information.

```typescript
{
  "_id": ObjectId,
  "id": string,                     // Custom string ID (timestamp-based)
  "ticketId": string,
  "buildingId": string,
  "userId": string,                 // resident user UID
  "amount": number,                 // 1200
  "currency": string,               // "INR", "USD", etc.
  "status": "pending" | "paid" | "cancelled",
  "stripeSessionId"?: string,       // "cs_test_..." (optional)
  "description": string,            // "Pipe replacement charges"
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes:**
- `{ id: 1 }` - Unique index for invoice ID lookup
- `{ ticketId: 1 }` - Index for ticket's invoices
- `{ userId: 1, status: 1 }` - Compound index for user invoices
- `{ buildingId: 1, createdAt: -1 }` - Compound index for building invoices

---

### 5. predictions
Stores ML model predictions for predictive maintenance.

```typescript
{
  "_id": ObjectId,
  "id": string,                     // Custom string ID (timestamp-based)
  "buildingId": string,
  "ticketId"?: string,              // null for general building predictions
  "model": "RandomForest" | "LogisticRegression",
  "inputFeatures": {                // anonymized features
    // Example: { "temperature": 25, "humidity": 60, "age_days": 180 }
  },
  "prediction": {
    "failureProbability": number,   // 0.83
    "riskBucket": "low" | "medium" | "high",
    "recommendedAction": string     // "Schedule preventive check in 3 days"
  },
  "createdAt": ISODate
}
```

**Indexes:**
- `{ id: 1 }` - Unique index for prediction ID lookup
- `{ buildingId: 1, createdAt: -1 }` - Compound index for building predictions
- `{ ticketId: 1 }` - Index for ticket predictions
- `{ buildingId: 1, "prediction.riskBucket": 1 }` - Compound index for risk filtering

---

## API Functions

All database operations are available in `app/lib/database.ts`:

### User Operations
- `getUserProfile(uid)` - Get user profile by UID
- `createUserProfile(userData)` - Create new user profile
- `getUserRole(uid)` - Get user's role
- `getUserBuildingId(uid)` - Get user's building ID

### Building Operations
- `createBuilding(adminUid, buildingData)` - Create new building with unique join code
- `getBuilding(buildingId)` - Get building by ID
- `getBuildingByJoinCode(joinCode)` - Validate and get building by join code
- `getBuildingsForAdmin(adminUid)` - Get all buildings for admin

### Ticket Operations
- `getTicketsForUser(uid, role, buildingId)` - Get tickets based on user role
- `createTicket(ticketData, uid)` - Create new ticket with timeline
- `updateTicketStatus(ticketId, status, userId, userName, note)` - Update status with timeline
- `assignTicket(ticketId, techUid, techName, adminUid, adminName)` - Assign to technician
- `getTechniciansForBuilding(buildingId)` - Get all technicians in building

### Invoice Operations
- `createInvoice(invoiceData)` - Create new invoice
- `getInvoice(invoiceId)` - Get invoice by ID
- `getInvoicesForUser(userId)` - Get all invoices for user
- `getInvoicesForBuilding(buildingId)` - Get all invoices for building
- `updateInvoiceStatus(invoiceId, status, stripeSessionId)` - Update invoice status

### Prediction Operations
- `createPrediction(predictionData)` - Create new prediction
- `getPrediction(predictionId)` - Get prediction by ID
- `getPredictionsForBuilding(buildingId)` - Get all predictions for building
- `getPredictionsForTicket(ticketId)` - Get predictions for specific ticket
- `getHighRiskPredictions(buildingId)` - Get high-risk predictions for building

---

## Recommended MongoDB Indexes

Run these commands in MongoDB shell to create performance indexes:

```javascript
use fixitnow;

// Users collection
db.users.createIndex({ "uid": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "buildingId": 1, "role": 1 });

// Buildings collection
db.buildings.createIndex({ "id": 1 }, { unique: true });
db.buildings.createIndex({ "joinCode": 1 }, { unique: true });
db.buildings.createIndex({ "adminId": 1 });

// Tickets collection
db.tickets.createIndex({ "id": 1 }, { unique: true });
db.tickets.createIndex({ "buildingId": 1, "status": 1 });
db.tickets.createIndex({ "createdBy": 1 });
db.tickets.createIndex({ "assignedTo": 1 });
db.tickets.createIndex({ "buildingId": 1, "createdAt": -1 });

// Invoices collection
db.invoices.createIndex({ "id": 1 }, { unique: true });
db.invoices.createIndex({ "ticketId": 1 });
db.invoices.createIndex({ "userId": 1, "status": 1 });
db.invoices.createIndex({ "buildingId": 1, "createdAt": -1 });

// Predictions collection
db.predictions.createIndex({ "id": 1 }, { unique: true });
db.predictions.createIndex({ "buildingId": 1, "createdAt": -1 });
db.predictions.createIndex({ "ticketId": 1 });
db.predictions.createIndex({ "buildingId": 1, "prediction.riskBucket": 1 });
```

---

## Data Flow

1. **User Registration**
   - Firebase Auth creates user → `users` collection stores profile

2. **Building Creation**
   - Admin creates building → unique join code generated → `buildings` collection

3. **Resident/Technician Join**
   - User enters join code → validated against `buildings` → user profile updated

4. **Ticket Creation**
   - Resident creates ticket → `tickets` collection with initial timeline event

5. **Ticket Assignment**
   - Admin assigns to technician → `tickets` updated with assignment + timeline event

6. **Invoice Creation**
   - Admin creates invoice for ticket → `invoices` collection → Stripe integration

7. **ML Predictions**
   - ML model analyzes building/ticket data → `predictions` collection → risk alerts

---

## Security Notes

- **Authentication**: Firebase handles user authentication
- **Authorization**: Role-based access control (admin, resident, technician)
- **Data Validation**: All API routes validate user permissions before operations
- **Password Storage**: bcrypt hashing for custom auth (if implemented)
- **Join Codes**: Unique, random codes for building access control

---

## Migration from Firestore

This schema replaces the previous Firestore structure. Key differences:

1. **Field Changes**:
   - `displayName` → `name`
   - `firebaseUid` → `uid`
   - Timeline events: `userId` → `by`

2. **Removed Fields**:
   - Firestore `Timestamp` → JavaScript `Date`
   - Building `createdBy` (redundant with `adminId`)

3. **New Features**:
   - `invoices` collection for billing
   - `predictions` collection for ML models
   - `awaitApproval` for technician approval workflow
   - `aiCategory` for AI-powered ticket categorization
