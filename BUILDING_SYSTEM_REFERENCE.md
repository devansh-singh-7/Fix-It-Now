# Building & Join Code System - Quick Reference

## 🏢 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Authentication                   │
│                  (Email, Phone, Social Auth)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Firestore Collections                       │
│  ┌──────────────┐              ┌──────────────┐            │
│  │    users/    │              │  buildings/  │            │
│  │  {uid}       │◄─────────────┤  {id}        │            │
│  │              │  buildingId  │              │            │
│  │  • role      │              │  • joinCode  │            │
│  │  • email     │              │  • adminId   │            │
│  │  • building  │              │  • createdBy │            │
│  └──────────────┘              └──────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Join Code Format

**Pattern:** `ABC-123-XYZ`
- 3 uppercase letters
- 3 numbers
- 3 uppercase letters
- Separated by hyphens

**Examples:**
- ✅ `XYZ-456-ABC`
- ✅ `TOP-123-FLR`
- ❌ `ABC-12-XYZ` (too short)
- ❌ `abc-123-xyz` (lowercase - will auto-convert)

## 🔐 User Roles & Permissions

| Role | Create Building | Sign-Up Requirement | Access Building Page |
|------|----------------|---------------------|---------------------|
| **Admin** | ✅ Yes | No join code needed | ✅ Yes |
| **Technician** | ❌ No | Requires join code | ❌ No |
| **Resident** | ❌ No | Requires join code | ❌ No |

## 🚀 Key Features

### ✅ For Admins
1. **Create Buildings**
   - Navigate to `/buildings`
   - Enter building name & address
   - Automatic join code generation
   - Copy code to share

2. **Manage Buildings**
   - View current building
   - See join code anytime
   - Copy to clipboard

### ✅ For Residents & Technicians
1. **Sign Up**
   - Get join code from admin
   - Enter during registration
   - Automatic building assignment
   - Access building-specific data

## 🔧 Helper Functions

### `createBuilding(adminUid, buildingData)`
```typescript
const building = await createBuilding(adminUid, {
  name: "Sunset Apartments",
  address: "123 Main St"
});
// Returns: { id, name, address, joinCode, adminId, createdBy, ... }
```

### `getUserRole(uid)`
```typescript
const role = await getUserRole(userId);
// Returns: "admin" | "technician" | "resident" | null
```

### `getUserBuildingId(uid)`
```typescript
const buildingId = await getUserBuildingId(userId);
// Returns: string | null
```

### `getBuilding(buildingId)`
```typescript
const building = await getBuilding(buildingId);
// Returns: Building object | null
```

## 🔒 Firestore Security Rules

### Users Collection
```javascript
// Read: Own profile only
allow read: if request.auth.uid == userId;

// Create: Own profile only
allow create: if request.auth.uid == userId;

// Update: Own profile only
allow update: if request.auth.uid == userId;

// Delete: Admins only
allow delete: if isAdmin();
```

### Buildings Collection
```javascript
// Read: Any authenticated user (for join code validation)
allow read: if request.auth != null;

// Create: Admins only
allow create: if isAdmin() &&
                 request.resource.data.createdBy == request.auth.uid;

// Update/Delete: Creator only
allow update, delete: if resource.data.createdBy == request.auth.uid;
```

## 🎯 Sign-Up Flow

```
┌──────────────┐
│  User visits │
│  /auth/signup│
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  Select Role     │
│  ┌──────────────┐│
│  │ □ Admin      ││
│  │ □ Technician ││
│  │ □ Resident   ││
│  └──────────────┘│
└──────┬───────────┘
       │
       ├─────────────► Admin: No join code field
       │
       └─────────────► Resident/Tech: Join code field shows
                       │
                       ▼
                 ┌──────────────────┐
                 │ Enter Join Code  │
                 │ ABC-123-XYZ      │
                 └──────┬───────────┘
                        │
                        ▼
                 ┌──────────────────┐
                 │ Validate against │
                 │  Firestore       │
                 └──────┬───────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
      ✅ Valid                      ❌ Invalid
         │                             │
         ▼                             ▼
  ┌──────────────┐            ┌──────────────┐
  │ Create User  │            │ Show Error   │
  │ Link Building│            │ Retry        │
  └──────────────┘            └──────────────┘
```

## 📝 Common Tasks

### Create a Building (Admin)
1. Sign in as admin
2. Go to `/buildings`
3. Fill form:
   - Building Name: "Your Building"
   - Address: "123 Street"
4. Click "Create Building"
5. **Copy join code** and share

### Join a Building (Resident/Technician)
1. Get join code from admin
2. Go to `/auth/signup`
3. Select role
4. Enter join code: `ABC-123-XYZ`
5. Complete sign-up
6. **Automatically linked to building**

### Copy Join Code
1. Admin: Go to `/buildings`
2. Find "Building Join Code" section
3. Click "Copy Code" button
4. Share with residents/technicians

## ⚡ Auto-Formatting Examples

User types → Auto-formats to:
- `abc123xyz` → `ABC-123-XYZ`
- `XYZ789ABC` → `XYZ-789-ABC`
- `a1b2c3d4e5f6` → `A1B-2C3-D4E` (truncated)

## 🐛 Error Messages

| Error | Meaning | Solution |
|-------|---------|----------|
| "Invalid building join code" | Code doesn't exist in Firestore | Check with admin for correct code |
| "Building join code is required" | Empty field for resident/tech | Enter join code |
| "Join code must be in format ABC-123-XYZ" | Wrong format | Use pattern: 3 letters - 3 numbers - 3 letters |
| "Only admins can create buildings" | Non-admin tried to create | Sign in as admin |
| "Permission denied" | Firestore rules blocked action | Check authentication & role |

## 🎨 UI Components

### Sign-Up Page
- **Join Code Field**: Shows for residents/technicians only
- **Auto-format**: Adds hyphens as you type
- **Validation**: Real-time format checking
- **Placeholder**: "ABC-123-XYZ"

### Building Management Page (`/buildings`)
- **Admin Only**: Route protected by `RouteGuard`
- **Building Display**: Shows current building with join code
- **Copy Button**: One-click clipboard copy
- **Create Form**: Name + Address → Auto-generates join code

### Route Protection
```tsx
<RouteGuard allowedRoles={['admin']}>
  <BuildingPage />
</RouteGuard>
```

## 📦 Data Structures

### Building Object
```typescript
{
  id: "auto_generated_id",
  name: "Sunset Apartments",
  address: "123 Main Street, City, ST 12345",
  joinCode: "ABC-123-XYZ",
  adminId: "admin_user_id",
  createdBy: "admin_user_id",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### User Profile
```typescript
{
  uid: "firebase_user_id",
  email: "user@example.com",
  displayName: "John Doe",
  role: "resident",
  buildingId: "building_id",
  buildingName: "Sunset Apartments",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isActive: true
}
```

## 🚦 Status Indicators

✅ **Working correctly:**
- Admins can create buildings
- Join codes validate properly
- Auto-formatting works
- Firestore rules enforced
- Route protection active

❌ **Needs attention:**
- Firebase credentials not configured
- Firestore rules not deployed
- User not authenticated
- Invalid join code entered

## 📞 Quick Help

**Issue:** Can't create building
→ Check: Are you an admin? Is Firebase configured?

**Issue:** Invalid join code
→ Check: Is it exactly ABC-123-XYZ format? Does building exist?

**Issue:** Access denied on /buildings
→ Check: Are you signed in as admin?

**Issue:** Join code field not showing
→ Check: Did you select Resident or Technician role?

## 🔗 Related Files

- `app/lib/firebaseClient.ts` - Firebase & Firestore functions
- `app/auth/signup/page.tsx` - Sign-up page with join code input
- `app/buildings/page.tsx` - Building management (admin only)
- `app/components/RouteGuard.tsx` - Role-based route protection
- `firestore.rules` - Security rules
- `BUILDING_SYSTEM_TESTING.md` - Comprehensive test plan
- `FIRESTORE_RULES_GUIDE.md` - Rules deployment guide
