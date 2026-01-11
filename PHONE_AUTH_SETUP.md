# Phone & Social Authentication Setup Guide

## Summary

I've added the following authentication features to your FixItNow project:

### ✅ Completed Backend Changes:

1. **Firebase Client (`app/lib/firebaseClient.ts`)**:
   - ✅ Added `signInWithGoogle()`, `signInWithFacebook()`, `signInWithApple()`
   - ✅ Added `initializeRecaptcha()`, `sendPhoneVerificationCode()`, `verifyPhoneCode()`
   - ✅ All provider imports added (GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, RecaptchaVerifier)

2. **MongoDB Schema (`scripts/init-db.js`)**:
   - ✅ Added `phoneNumber` index to users collection (unique, sparse)
   - ✅ Email index updated to sparse (allows phone-only users)

3. **API Routes (`app/api/users/create/route.ts`)**:
   - ✅ Updated to accept either `email` OR `phoneNumber` (not both required)
   - ✅ Added duplicate phone number validation (409 Conflict)
   - ✅ Updated technician profile creation to include phoneNumber

4. **Sign-Up Page (`app/auth/signup/page.tsx`)**:
   - ✅ Added phone validation function
   - ✅ Added `handleSendPhoneCode()` and `handleVerifyPhoneCode()` handlers
   - ✅ Updated `handleSocialSignUp()` to work with real providers
   - ✅ Added state for phone number, verification code, and codeSent flag

---

## ⚠️ Frontend UI Updates Needed

The sign-up page needs UI updates to display the email/phone toggle and phone verification flow. Here's what needs to be added:

### 1. Add Email/Phone Toggle (Before the form)

Insert this after the social buttons and before the main form:

```tsx
{/* Email/Phone Toggle */}
<div className="flex items-center justify-center gap-4 my-6">
  <button
    type="button"
    onClick={() => {
      setSignUpMethod("email");
      setCodeSent(false);
    }}
    className={`px-6 py-2 rounded-lg font-medium transition-all ${
      signUpMethod === "email"
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Email
  </button>
  <button
    type="button"
    onClick={() => {
      setSignUpMethod("phone");
      setCodeSent(false);
    }}
    className={`px-6 py-2 rounded-lg font-medium transition-all ${
      signUpMethod === "phone"
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }`}
  >
    Phone
  </button>
</div>
```

### 2. Replace Email Form with Conditional Rendering

Replace the existing email/password form with:

```tsx
{signUpMethod === "email" ? (
  <form onSubmit={handleEmailPasswordSignUp} className="space-y-4">
    {/* Existing email form fields */}
    {/* Name, Email, Password, Confirm Password, Role selector */}
  </form>
) : (
  /* Phone signup form */
  !codeSent ? (
    <form onSubmit={handleSendPhoneCode} className="space-y-4">
      {/* Name field */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--card-contrast-text)" }}>
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => validateName(name)}
          className="w-full px-4 py-3 rounded-lg border"
          style={{ borderColor: nameError ? "#ef4444" : "rgba(15,23,42,0.1)" }}
        />
        {nameError && <p className="text-sm text-red-600 mt-1">{nameError}</p>}
      </div>

      {/* Phone number field */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--card-contrast-text)" }}>
          Phone Number
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          onBlur={() => validatePhone(phoneNumber)}
          placeholder="+1234567890"
          className="w-full px-4 py-3 rounded-lg border"
          style={{ borderColor: phoneError ? "#ef4444" : "rgba(15,23,42,0.1)" }}
        />
        <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +1 for US)</p>
        {phoneError && <p className="text-sm text-red-600 mt-1">{phoneError}</p>}
      </div>

      {/* Role selector (same as email form) */}

      {/* reCAPTCHA container (invisible) */}
      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg font-medium transition-all"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {loading ? "Sending code..." : "Send Verification Code"}
      </button>
    </form>
  ) : (
    /* Verification code form */
    <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: "var(--card-contrast-text)" }}>
          Verification Code
        </label>
        <input
          type="text"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          onBlur={() => validateCode(verificationCode)}
          placeholder="000000"
          maxLength={6}
          className="w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest"
          style={{ borderColor: codeError ? "#ef4444" : "rgba(15,23,42,0.1)" }}
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the 6-digit code sent to {phoneNumber}
        </p>
        {codeError && <p className="text-sm text-red-600 mt-1">{codeError}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-3 rounded-lg font-medium transition-all"
        style={{ background: "var(--accent)", color: "white" }}
      >
        {loading ? "Verifying..." : "Verify & Create Account"}
      </button>

      <button
        type="button"
        onClick={() => setCodeSent(false)}
        className="w-full text-sm text-gray-600 hover:text-gray-800"
      >
        ← Back to phone number
      </button>
    </form>
  )
)}
```

---

## 🔧 Firebase Console Configuration Required

Before phone and social auth will work, you need to enable them in Firebase Console:

### 1. Enable Phone Authentication

1. Go to https://console.firebase.google.com/project/fixitup-4595e/authentication/providers
2. Click on **Phone** provider
3. Click **Enable**
4. Save changes

### 2. Enable Google Sign-In

1. In Authentication → Sign-in method
2. Click on **Google**
3. Click **Enable**
4. Add your support email
5. Save changes

### 3. Enable Facebook Sign-In

1. Create a Facebook App at https://developers.facebook.com/
2. Get your App ID and App Secret
3. In Firebase Console → Authentication → Sign-in method → Facebook
4. Click **Enable**
5. Enter your Facebook App ID and App Secret
6. Copy the OAuth redirect URI from Firebase
7. Add it to your Facebook App settings
8. Save changes

### 4. Enable Apple Sign-In

1. In Firebase Console → Authentication → Sign-in method → Apple
2. Click **Enable**
3. Configure Apple Developer account (requires Apple Developer Program membership)
4. Add Service ID, Team ID, Key ID, and Private Key
5. Save changes

---

## 🧪 Testing Instructions

### Test Email Sign-Up (Already Working)
1. Go to `/auth/signup`
2. Ensure "Email" tab is selected
3. Fill in name, email, password, role
4. Click "Sign up"
5. Should redirect to `/dashboard`

### Test Phone Sign-Up
1. Go to `/auth/signup`
2. Click "Phone" tab
3. Enter name and phone (e.g., +15551234567 for testing)
4. Select role
5. Click "Send Verification Code"
6. Firebase will send SMS (or use test phone numbers in Firebase Console)
7. Enter 6-digit code
8. Click "Verify & Create Account"
9. Should redirect to `/dashboard`

### Test Social Sign-Up
1. Go to `/auth/signup`
2. Click "Continue with Google/Facebook/Apple"
3. Complete OAuth flow in popup
4. Should auto-create account and redirect to `/dashboard`

---

## 📊 Database Schema

Users collection now supports:

```javascript
{
  firebaseUid: String (unique, required),
  email: String (unique, sparse), // Optional if phone auth
  phoneNumber: String (unique, sparse), // Optional if email auth
  displayName: String (required),
  role: String (required: 'admin'|'technician'|'resident'),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Next Steps

1. **Update sign-in page** with same phone/social options
2. **Run database initialization**:
   ```
   node scripts/init-db.js
   ```
3. **Configure Firebase providers** in console
4. **Test all authentication methods**
5. **Add phone number to user profile page** for editing

---

## ⚠️ Important Notes

- **reCAPTCHA**: Phone auth requires reCAPTCHA (invisible by default)
- **Phone Format**: Must be E.164 format (+[country code][number])
- **Test Phone Numbers**: Use Firebase Console to add test numbers for development
- **Social Auth Role**: Social sign-ups default to "resident" role (can be changed in profile later)
- **Duplicate Prevention**: Works for email AND phone numbers (409 Conflict errors)

---

## 🐛 Troubleshooting

### "reCAPTCHA not defined"
- Ensure `<div id="recaptcha-container"></div>` exists in JSX
- Check that Firebase is initialized before calling `initializeRecaptcha()`

### "Invalid phone number format"
- Phone must start with + and country code
- Example: +1234567890 (not 234-567-8900)

### Social auth popup blocked
- Allow popups for localhost:3000
- Check Firebase provider is enabled in console

### "Account already exists with different credential"
- User tried to sign up with Google after already signing up with Facebook using same email
- Firebase prevents this for security
- User must sign in with original method

