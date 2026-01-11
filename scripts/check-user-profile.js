/**
 * Debug Script - Check User Profile Status
 * Run this in the browser console to check if user profile has buildingId
 */

// Get user profile from localStorage
const profileStr = localStorage.getItem('userProfile');

if (!profileStr) {
  console.log('❌ No user profile found in localStorage');
  console.log('User needs to sign in');
} else {
  try {
    const profile = JSON.parse(profileStr);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('👤 USER PROFILE STATUS');
    console.log('═══════════════════════════════════════════════════');
    console.log('Name:', profile.name || profile.displayName || 'N/A');
    console.log('Email:', profile.email || 'N/A');
    console.log('UID:', profile.uid || profile.firebaseUid || 'N/A');
    console.log('Role:', profile.role || 'N/A');
    console.log('Building ID:', profile.buildingId || '❌ NOT SET');
    console.log('Building Name:', profile.buildingName || '❌ NOT SET');
    console.log('═══════════════════════════════════════════════════\n');
    
    if (!profile.buildingId) {
      console.log('⚠️  USER HAS NOT JOINED A BUILDING');
      console.log('To create tickets, user must:');
      console.log('1. Go to Settings or Dashboard');
      console.log('2. Look for "Join Building" banner or button');
      console.log('3. Enter a valid building join code');
      console.log('4. Click "Join"\n');
      console.log('Available building join codes:');
      console.log('- WPL-128-SLV (Marine View Building)');
      console.log('- IXL-975-XDV (SANTACEIZ)');
    } else {
      console.log('✅ USER HAS JOINED A BUILDING');
      console.log('User can now create tickets!');
    }
    
  } catch (err) {
    console.error('❌ Error parsing profile:', err);
  }
}
