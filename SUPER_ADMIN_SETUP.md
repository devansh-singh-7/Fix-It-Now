# Super Admin Setup Instructions

## Initial Super Admin Account Setup

To set up the initial super admin account (devansh@gmail.com), follow these steps:

### Step 1: Create Firebase Auth Account
1. Go to Firebase Console > Authentication
2. Click "Add User"
3. Enter:
   - Email: `devansh@gmail.com`
   - Password: `Devansh@69`
4. Copy the UID that is generated

### Step 2: Create MongoDB Profile
Run this MongoDB command in your database:

```javascript
db.users.insertOne({
  uid: "PASTE_FIREBASE_UID_HERE",
  name: "Devansh",
  email: "devansh@gmail.com",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Step 3: Configure Firebase Admin SDK
Add these to your `.env.local` file:

```env
# Firebase Admin SDK (for creating new admin accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

To get these values:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Open the downloaded JSON file
4. Copy the values to your `.env.local`

## Features

### For Super Admin (devansh@gmail.com):
- ✅ Access to all admin features
- ✅ Special "Manage Admins" option in user menu
- ✅ Can create new admin accounts via `/admin/manage`
- ✅ Exclusive permission to add admin credentials

### For Regular Admins:
- ✅ Access to admin dashboard
- ✅ Cannot create other admin accounts
- ❌ No access to "Manage Admins" page

### For Technicians & Residents:
- ✅ Access to their respective features
- ❌ No admin privileges
- ❌ Cannot see admin-only features

## Security Features

1. **Super Admin Check**: Only `devansh@gmail.com` with `role: admin` can manage admins
2. **API Protection**: `/api/admin/create` validates super admin status before creating accounts
3. **Frontend Protection**: "Manage Admins" menu only shows for super admin
4. **Route Guard**: `/admin/manage` page redirects non-super-admins to dashboard

## Usage

### Creating New Admin Accounts:
1. Sign in as super admin (devansh@gmail.com)
2. Click user avatar > "Manage Admins"
3. Fill in the form:
   - Full Name
   - Email Address
   - Password (min 6 characters)
   - Building ID (optional)
   - Building Name (optional)
4. Click "Create Admin Account"

The new admin will be created in both Firebase Auth and MongoDB.
