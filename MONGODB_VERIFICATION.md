# MongoDB Verification Guide

## ✅ Complete Migration Checklist

This guide verifies that your application is fully migrated to MongoDB and Firestore has been completely removed.

---

## 1. Files Deleted ✅

The following Firestore-specific files have been **DELETED**:

- ❌ `firestore.rules` - Firestore security rules (not needed)
- ❌ `FIRESTORE_RULES_GUIDE.md` - Firestore documentation
- ❌ `BUILDING_SYSTEM_TESTING.md` - Old testing guide with Firestore references
- ❌ `ROLE_BASED_AUTH.md` - Old auth guide with Firestore references

---

## 2. Updated Files ✅

These files were updated to use MongoDB instead of Firestore:

- ✅ `app/lib/firebaseClient.ts` - Auth only, re-exports MongoDB functions
- ✅ `app/lib/database.ts` - All MongoDB operations (NEW)
- ✅ `app/api/users/create/route.ts` - Uses MongoDB
- ✅ `app/api/users/profile/route.ts` - Uses MongoDB
- ✅ `app/components/CreateTicketForm.tsx` - Updated comments
- ✅ `app/components/RouteGuard.tsx` - Updated comments
- ✅ `app/components/AuthProvider.tsx` - Updated comments
- ✅ `app/tickets/page.tsx` - Updated comments
- ✅ `app/components/TicketTimeline.tsx` - Uses Date instead of Timestamp

---

## 3. Test MongoDB Connection

### Option 1: API Endpoint Test

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000/api/test-mongodb
   ```

3. You should see a JSON response like:
   ```json
   {
     "success": true,
     "message": "MongoDB connection successful",
     "database": "fixitnow",
     "collections": ["users", "buildings", "tickets"],
     "documentCounts": {
       "users": 0,
       "buildings": 0,
       "tickets": 0
     },
     "timestamp": "2025-12-06T..."
   }
   ```

### Option 2: Command Line Test

```bash
cd "C:\Users\devan\OneDrive\Desktop\FixItUp\fixitnow"
npm run dev
```

Then in another terminal:
```bash
curl http://localhost:3000/api/test-mongodb
```

---

## 4. Verify Environment Variables

Check your `.env.local` file contains:

```env
# Firebase (Authentication Only)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# MongoDB (Data Storage - REQUIRED)
MONGODB_URI=mongodb+srv://<your-username>:<your-password>@cluster.mongodb.net/fixitnow?retryWrites=true&w=majority
```

⚠️ **Make sure MONGODB_URI is set!** Without it, the app won't be able to store data.

> **⚠️ SECURITY NOTE:** Replace `<your-username>` and `<your-password>` with your actual MongoDB Atlas credentials. Never commit real credentials to version control.

---

## 5. Complete User Flow Test

### Test 1: Admin Sign Up
1. Go to `/auth/signup`
2. Select role: **Admin**
3. Fill in email, password, display name
4. Click **Sign Up**
5. **Expected:** 
   - User created in Firebase Auth
   - User profile stored in MongoDB `users` collection
   - Redirected to dashboard

**Verify in MongoDB:**
```javascript
// MongoDB Compass or CLI
use fixitnow
db.users.find({ role: "admin" })
```

### Test 2: Create Building
1. Go to `/buildings`
2. Enter building name and address
3. Click **Create Building**
4. **Expected:**
   - Building created in MongoDB `buildings` collection
   - Join code displayed (ABC-123-XYZ format)
   - Admin's profile updated with buildingId

**Verify in MongoDB:**
```javascript
db.buildings.find()
// Should see your building with join code
```

### Test 3: Resident Sign Up with Join Code
1. Sign out
2. Go to `/auth/signup`
3. Select role: **Resident**
4. Enter email, password, display name
5. Enter the join code from Test 2
6. Click **Sign Up**
7. **Expected:**
   - Join code validated against MongoDB
   - User created with buildingId and buildingName
   - User stored in MongoDB `users` collection

**Verify in MongoDB:**
```javascript
db.users.find({ role: "resident" })
// Should see resident with buildingId
```

### Test 4: Create Ticket
1. Sign in as resident
2. Go to `/tickets`
3. Click **Create Ticket**
4. Fill in ticket details
5. Submit
6. **Expected:**
   - Ticket created in MongoDB `tickets` collection
   - Timeline initialized with creation event
   - Ticket appears in resident's ticket list

**Verify in MongoDB:**
```javascript
db.tickets.find()
// Should see ticket with timeline array
```

### Test 5: Assign Ticket (Admin)
1. Sign in as admin
2. Go to `/tickets`
3. Find unassigned ticket
4. Click **Assign**
5. Select technician (if any exist)
6. **Expected:**
   - Ticket updated in MongoDB
   - Status changed to "assigned"
   - Timeline updated with assignment event

**Verify in MongoDB:**
```javascript
db.tickets.findOne({ status: "assigned" })
// Should see assignedTo, assignedAt, and timeline event
```

---

## 6. MongoDB Data Structure Verification

### Users Collection
```javascript
db.users.findOne()

// Expected structure:
{
  uid: "firebase_uid_here",
  email: "user@example.com",
  displayName: "User Name",
  role: "admin" | "technician" | "resident",
  buildingId: "building_id_here",  // for non-admins
  buildingName: "Building Name",    // for non-admins
  isActive: true,
  createdAt: ISODate("2025-12-06..."),
  updatedAt: ISODate("2025-12-06...")
}
```

### Buildings Collection
```javascript
db.buildings.findOne()

// Expected structure:
{
  id: "1733512345678",
  name: "Sunset Apartments",
  address: "123 Main St",
  joinCode: "ABC-123-XYZ",
  adminId: "admin_firebase_uid",
  createdBy: "admin_firebase_uid",
  createdAt: ISODate("2025-12-06..."),
  updatedAt: ISODate("2025-12-06...")
}
```

### Tickets Collection
```javascript
db.tickets.findOne()

// Expected structure:
{
  id: "1733512456789",
  title: "Broken AC",
  description: "AC not working",
  category: "hvac",
  priority: "high",
  status: "open",
  location: "Apt 101",
  createdBy: "resident_firebase_uid",
  createdByName: "John Doe",
  buildingId: "1733512345678",
  buildingName: "Sunset Apartments",
  timeline: [
    {
      status: "open",
      timestamp: ISODate("2025-12-06..."),
      userId: "resident_firebase_uid",
      userName: "John Doe",
      note: "Ticket created"
    }
  ],
  createdAt: ISODate("2025-12-06..."),
  updatedAt: ISODate("2025-12-06...")
}
```

---

## 7. Common Issues & Solutions

### Issue: "MongoDB not initialized"
**Solution:** Check that `MONGODB_URI` is set in `.env.local`

### Issue: Connection timeout
**Solution:** 
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for development)
- Verify connection string is correct

### Issue: "Collection not found"
**Solution:** MongoDB creates collections automatically on first insert. This is normal.

### Issue: Data not appearing
**Solution:**
- Check MongoDB Compass or Atlas dashboard
- Verify database name is "fixitnow"
- Check browser console for errors

---

## 8. Performance Checks

### Create Indexes (Recommended)

Run these commands in MongoDB to improve query performance:

```javascript
// Users collection
db.users.createIndex({ uid: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ buildingId: 1 })
db.users.createIndex({ role: 1 })

// Buildings collection
db.buildings.createIndex({ id: 1 }, { unique: true })
db.buildings.createIndex({ joinCode: 1 }, { unique: true })
db.buildings.createIndex({ adminId: 1 })

// Tickets collection
db.tickets.createIndex({ id: 1 }, { unique: true })
db.tickets.createIndex({ buildingId: 1 })
db.tickets.createIndex({ createdBy: 1 })
db.tickets.createIndex({ assignedTo: 1 })
db.tickets.createIndex({ status: 1 })
db.tickets.createIndex({ createdAt: -1 })
```

---

## 9. Firestore Packages (Optional Cleanup)

The Firestore packages are still installed but not used. You can optionally remove them:

```bash
npm uninstall @firebase/firestore @firebase/firestore-compat @firebase/firestore-types
```

⚠️ **Note:** The main `firebase` package includes Firestore by default. As long as you don't import from `firebase/firestore`, the Firestore code won't be included in your bundle.

---

## 10. Final Checklist

- [ ] MongoDB connection successful (`/api/test-mongodb` returns success)
- [ ] Admin can sign up
- [ ] Admin can create building
- [ ] Join code is generated correctly (ABC-123-XYZ format)
- [ ] Resident can sign up with join code
- [ ] Resident can create ticket
- [ ] Ticket has timeline initialized
- [ ] Admin can see all tickets
- [ ] Admin can assign ticket to technician
- [ ] Timeline updates on status changes
- [ ] All data is in MongoDB (verified with MongoDB Compass)
- [ ] No Firestore imports in code
- [ ] No compilation errors
- [ ] `.env.local` has MONGODB_URI

---

## ✅ Migration Complete!

If all tests pass, your application is successfully running on MongoDB!

**What's Using MongoDB:**
- ✅ User profiles
- ✅ Buildings and join codes
- ✅ Tickets and timelines
- ✅ All database queries

**What's Using Firebase:**
- ✅ Authentication only (email, social, phone)

---

## Support

- **MongoDB Docs:** https://www.mongodb.com/docs/
- **Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Firebase Auth:** https://firebase.google.com/docs/auth

Migration completed successfully! 🎉
