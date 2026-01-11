import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  deleteUser
} from 'firebase/auth';
import { auth } from './firebase-app';
import type { UserRole } from './types';

/**
 * Delete the currently authenticated user
 * Used for rollback when profile creation fails
 */
export async function deleteFirebaseUser(user: any): Promise<void> {
  try {
    await deleteUser(user);
    console.log('User deleted successfully (rollback)');
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Create a new user with email and password
 * Creates user in Firebase Auth and stores profile in MongoDB
 */
export async function createUserWithEmail(
  email: string,
  password: string,
  displayName: string,
  role: UserRole,
  buildingJoinCode?: string
): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  // Optionally validate building join code if provided
  let buildingId: string | undefined;
  let buildingName: string | undefined;

  if (buildingJoinCode) {
    const response = await fetch(`/api/buildings/validate-join-code?joinCode=${buildingJoinCode}`);
    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error('Invalid building join code');
    }

    buildingId = data.data.id;
    buildingName = data.data.name;
  }

  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  try {
    // Update user profile with display name
    await updateProfile(userCredential.user, { displayName });

    // Create user profile in MongoDB via API
    const response = await fetch('/api/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uid: userCredential.user.uid,
        email,
        name: displayName,
        role,
        buildingId,
        buildingName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to create user in MongoDB:', errorData);

      if (response.status === 409) {
        throw new Error(errorData.error || 'An account with this email already exists');
      } else {
        throw new Error(errorData.error || 'Failed to create user profile');
      }
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
    
    // Rollback: Delete the Firebase user if MongoDB creation failed
    try {
      if (userCredential && userCredential.user) {
        console.log('Rolling back: Deleting orphaned Firebase user...');
        await deleteUser(userCredential.user);
        console.log('Rollback successful.');
      }
    } catch (deleteError) {
      console.error('Critical Error: Failed to rollback user creation:', deleteError);
    }

    throw error;
  }

  return userCredential;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe: boolean = true
): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  // Set persistence based on remember me checkbox
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign out the current user
 */
export async function signOutUser(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  return signOut(auth);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmailClient(email: string): Promise<void> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(rememberMe: boolean = true): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook(rememberMe: boolean = true): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  const provider = new FacebookAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Sign in with Apple
 */
export async function signInWithApple(rememberMe: boolean = true): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  );

  const provider = new OAuthProvider('apple.com');
  return signInWithPopup(auth, provider);
}

/**
 * Initialize reCAPTCHA for phone authentication
 */
export function initializeRecaptcha(containerId: string): RecaptchaVerifier | null {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
    });
  } catch (error) {
    console.error('Error initializing reCAPTCHA:', error);
    return null;
  }
}

/**
 * Send verification code to phone number
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
}

/**
 * Verify phone number with code and create/sign in user
 */
export async function verifyPhoneCode(
  confirmationResult: ConfirmationResult,
  code: string
): Promise<UserCredential> {
  return confirmationResult.confirm(code);
}
