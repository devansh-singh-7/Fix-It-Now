# Admin User Setup Guide

## ✅ Configuration Complete

Your admin user has been configured in the system:

**Email:** devanshsingh@gmail.com  
**Password:** Devansh@69  
**Role:** Admin (automatically assigned)

---

## 🚀 Setup Steps

### 1. Sign Up as Admin

The app is already running at: http://localhost:3000

1. Go to: **http://localhost:3000/auth/signup**
2. Fill in the signup form:
   - **Name:** Devansh Singh
   - **Email:** devanshsingh@gmail.com
   - **Password:** Devansh@69
   - **Confirm Password:** Devansh@69
   - **Role:** Select any role (will be overridden to Admin automatically)

3. Click "Create Account"

### 2. Automatic Admin Assignment

The system has been configured to **automatically grant admin privileges** to this email address:
- When you sign up with `devanshsingh@gmail.com`, the system will automatically assign the `admin` role
- This happens during user creation in the database
- No manual intervention needed!

### 3. Verify Admin Access

After signing up:
1. The system will automatically log you in
2. You should see admin features in the navigation
3. You can access:
   - Dashboard with all stats
   - User management
   - Building management
   - All tickets across all buildings
   - Analytics and reports

---

## 🔐 Super Admin Configuration

The following files have been updated:

### 1. [app/lib/database.ts](../app/lib/database.ts)
```typescript
const SUPER_ADMIN_EMAIL = 'devanshsingh@gmail.com';
```

### 2. [app/api/users/create/route.ts](../app/api/users/create/route.ts)
```typescript
// Automatically assign admin role if this is the super admin email
if (email && email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
  userRole = 'admin';
}
```

---

## 📝 Quick Commands

```bash
# Check database status
npm run db:status

# Verify admin setup
npm run admin:setup

# Clear database (if you need to start over)
npm run db:clear
```

---

## ✨ What Happens When You Sign Up

1. **Firebase Authentication**
   - Account created in Firebase Auth
   - UID generated automatically

2. **MongoDB User Creation**
   - API checks if email matches super admin email
   - Role automatically set to `admin`
   - User profile created with admin privileges

3. **Automatic Sign In**
   - You're immediately logged in
   - Admin features are available
   - No need to sign in again

---

## 🎯 Next Steps After Signup

### As Admin, You Can:

1. **Create Buildings**
   - Go to Buildings page
   - Create a new building with a name and address
   - Get a join code to share with residents

2. **Manage Users**
   - View all users in the system
   - Assign roles
   - Approve technician requests

3. **View All Tickets**
   - See tickets from all buildings
   - Assign to technicians
   - Update status and priorities

4. **Access Analytics**
   - View system-wide statistics
   - Generate reports
   - Monitor ticket trends

---

## 🔧 Troubleshooting

### If You Already Have an Account

If you already created an account with this email:
1. Sign in at: http://localhost:3000/auth/signin
2. The system should already have admin privileges
3. If not, run: `npm run admin:setup` to update the role

### If Role Doesn't Update

1. Sign out completely
2. Clear browser cache/localStorage
3. Sign back in
4. Role should be updated

### Database Issues

```bash
# Check what's in the database
npm run db:status

# Verify MongoDB connection
npm run db:verify

# Start fresh (clears all data)
npm run db:clear
```

---

## 📚 Architecture Notes

### Admin Privileges

Admins have access to:
- All API routes
- User management endpoints
- Building creation and management
- Cross-building ticket visibility
- System analytics

### Super Admin vs Regular Admin

- **Super Admin** (devanshsingh@gmail.com)
  - Platform-level access
  - Can manage all buildings
  - No `buildingId` restriction

- **Regular Admin**
  - Building-level access
  - Tied to specific building
  - Has `buildingId` field

Your account is configured as a **Super Admin** with platform-level access.

---

## ✅ Current Status

- ✅ Super admin email configured: devanshsingh@gmail.com
- ✅ Automatic admin role assignment enabled
- ✅ Database cleared and ready
- ✅ MongoDB connection verified
- ✅ App running at http://localhost:3000

**You're all set!** Just go to the signup page and create your account. 🎉
