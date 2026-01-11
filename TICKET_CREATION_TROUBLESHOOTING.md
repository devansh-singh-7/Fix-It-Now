# Ticket Creation Troubleshooting Guide

## ✅ System Status

After debugging and testing, here's what we've confirmed:

### MongoDB Connection
- ✅ MongoDB is running on `mongodb://127.0.0.1:27017`
- ✅ Database: `fixitnow`
- ✅ All collections exist: users, tickets, buildings, technicians, dashboard_stats, preventive_maintenance
- ✅ Test ticket creation works successfully

### Database Statistics
- **Users**: 5 total
  - 3 with buildingId (can create tickets)
  - 2 without buildingId (need to join a building)
- **Buildings**: 2 available
  - Marine View Building (Join Code: `WPL-128-SLV`)
  - SANTACEIZ (Join Code: `IXL-975-XDV`)
- **Tickets**: Working properly

## 🔧 Fixes Implemented

### 1. Improved JoinBuildingBanner.tsx
**Problem**: Inconsistent uid field names between components
**Fix**: 
- Now handles both `uid` and `firebaseUid` fields
- Updates localStorage with both fields for consistency
- Added console logging for debugging
- Better error handling

### 2. Enhanced CreateTicketForm.tsx
**Problem**: Form wasn't reloading fresh user profile after joining building
**Fix**:
- Now reloads user profile from localStorage before submission
- Handles both `uid` and `firebaseUid` fields
- Better error messages with details
- Added comprehensive console logging
- Shows exactly which required fields are missing

### 3. Improved API Error Messages
**Problem**: Generic error messages made debugging difficult
**Fix**: `/api/tickets/create` now returns:
- Specific list of missing required fields
- Detailed error information
- Better error logging

## 📋 How to Create Tickets (User Flow)

### Step 1: Sign In
User must be authenticated with Firebase

### Step 2: Join a Building
**CRITICAL**: Users MUST join a building before creating tickets

**How to Join**:
1. Go to Dashboard or Settings page
2. Look for "Join Your Building" banner at the top
3. Click "Enter Join Code"
4. Enter one of these codes:
   - `WPL-128-SLV` - Marine View Building
   - `IXL-975-XDV` - SANTACEIZ
5. Click "Join"
6. Wait for success message

**What Happens Behind the Scenes**:
- System validates join code with `/api/buildings/validate-join-code`
- Updates user profile in MongoDB via `/api/users/update-building`
- Updates localStorage with buildingId and buildingName
- User can now create tickets

### Step 3: Create Ticket
1. Click "Create Ticket" button
2. Fill in the form:
   - Title (required)
   - Description (required)
   - Category (required) - dropdown
   - Contact Phone (optional)
3. Click "Submit"
4. System validates:
   - User has buildingId
   - All required fields are filled
   - User is authenticated
5. Ticket is created in MongoDB

## 🐛 Debugging Tips

### Check User Profile Status
Run this in browser console:
```javascript
const profile = JSON.parse(localStorage.getItem('userProfile'));
console.log('Building ID:', profile?.buildingId);
console.log('Building Name:', profile?.buildingName);
console.log('User ID:', profile?.uid || profile?.firebaseUid);
```

Or use the debug script:
```bash
# Copy contents of scripts/check-user-profile.js and paste in browser console
```

### Common Issues

#### Issue: "You must join a building before creating tickets"
**Solution**: User hasn't joined a building yet
- Go to Dashboard
- Use join code banner
- Enter valid building code

#### Issue: "Missing required fields"
**Solution**: Check browser console for specific fields
- Look for error message showing which fields are missing
- Verify user profile has buildingId
- Check that form fields are filled

#### Issue: "User profile not found"
**Solution**: Authentication issue
- User needs to sign out and sign in again
- Clear browser cache/localStorage
- Verify Firebase authentication is working

## 🧪 Testing

### Test Ticket Creation
Run the test script:
```bash
node scripts/test-ticket-creation.js
```

This will:
- ✅ Check MongoDB connectivity
- ✅ List all collections
- ✅ Show user statistics
- ✅ List available buildings with join codes
- ✅ Create a test ticket
- ✅ Display summary

### Manual Testing Checklist
1. [ ] Start MongoDB: `mongod`
2. [ ] Start dev server: `npm run dev`
3. [ ] Sign in as user
4. [ ] Check if user has building (console.log profile)
5. [ ] If no building, join one using join code
6. [ ] Verify localStorage has buildingId
7. [ ] Try creating a ticket
8. [ ] Check browser console for any errors
9. [ ] Verify ticket appears in MongoDB

### Verify in MongoDB
```bash
mongosh
use fixitnow

# Check users
db.users.find().pretty()

# Check buildings
db.buildings.find().pretty()

# Check tickets
db.tickets.find().pretty()

# Check specific user
db.users.findOne({ email: "user@example.com" })
```

## 🚀 Next Steps

If issues persist:

1. **Check MongoDB is running**: `mongosh` should connect
2. **Check .env.local**: Should have `MONGODB_URI=mongodb://localhost:27017/fixitnow`
3. **Check browser console**: Look for error messages
4. **Check network tab**: See API responses
5. **Check server logs**: Look for errors in terminal

## 📝 Code Changes Summary

### Files Modified:
1. `app/components/JoinBuildingBanner.tsx`
   - Handles both uid formats
   - Updates localStorage consistently
   - Added logging

2. `app/components/CreateTicketForm.tsx`
   - Reloads profile before submission
   - Better error handling
   - Added comprehensive logging

3. `app/api/tickets/create/route.ts`
   - Shows specific missing fields
   - Better error messages

### Files Created:
1. `scripts/test-ticket-creation.js` - Comprehensive testing script
2. `scripts/check-user-profile.js` - Browser console debug script
3. `TICKET_CREATION_TROUBLESHOOTING.md` - This guide

## ✨ Current Status

**WORKING**: 
- ✅ MongoDB connectivity
- ✅ Building join functionality
- ✅ Ticket creation (when user has buildingId)
- ✅ User profile management
- ✅ Error handling and logging

**ACTION REQUIRED**:
- Users without buildingId need to join a building using join codes
- Available codes: `WPL-128-SLV` or `IXL-975-XDV`
