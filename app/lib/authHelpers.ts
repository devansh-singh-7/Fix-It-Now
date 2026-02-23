/**
 * Auth Helper Utilities
 * 
 * Utilities for managing authentication state and syncing between
 * Firebase Auth and MongoDB.
 */

import { User } from 'firebase/auth';
import { UserProfile } from './types';

/**
 * Sync Firebase user to MongoDB
 * Called when user signs in to ensure MongoDB has latest data
 * If user doesn't exist in MongoDB, creates their profile automatically
 * @returns true if user exists or was created in MongoDB, false on error
 */
export async function syncUserToMongoDB(firebaseUser: User): Promise<boolean> {
  try {
    // Check if user exists in MongoDB
    const profileResponse = await fetch(`/api/users/profile?uid=${firebaseUser.uid}`);
    
    if (profileResponse.status === 404) {
      // User doesn't exist in MongoDB - create profile automatically
      console.log('User not found in MongoDB, creating profile...');
      
      // Determine role - check if this is the super admin email
      const SUPER_ADMIN_EMAIL = 'devanshsingh@gmail.com';
      const role = firebaseUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() 
        ? 'admin' 
        : 'resident';
      
      // Create user profile in MongoDB
      const createResponse = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || 'User',
          role: role,
        }),
      });
      
      if (!createResponse.ok) {
        console.error('Failed to create user profile in MongoDB');
        return false;
      }
      
      console.log('✅ User profile created successfully in MongoDB');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing user to MongoDB:', error);
    return false;
  }
}

/**
 * Get current user profile from MongoDB
 */
export async function getCurrentUserProfile(firebaseUid: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`/api/users/profile?uid=${firebaseUid}`);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Handle both old format { user: {...} } and new format { success: true, data: {...} }
    if (data.success && data.data) {
      return data.data as UserProfile;
    } else if (data.user) {
      return data.user as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

/**
 * Store auth token in localStorage for API requests
 */
export async function storeAuthToken(user: User): Promise<void> {
  try {
    const token = await user.getIdToken();
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', user.uid);
    
    // Also fetch and store user profile
    const profile = await getCurrentUserProfile(user.uid);
    if (profile) {
      localStorage.setItem('userProfile', JSON.stringify({
        displayName: profile.name,
        email: profile.email,
        role: profile.role,
        firebaseUid: profile.uid,
      }));
    }
  } catch (error) {
    console.error('Error storing auth token:', error);
  }
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken(): void {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userProfile');
}

/**
 * Get stored auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

/**
 * Get stored user ID
 */
export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId');
}
