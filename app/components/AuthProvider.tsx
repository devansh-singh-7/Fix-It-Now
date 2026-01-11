"use client";

/**
 * AuthProvider Component
 * 
 * Provides authentication context throughout the application.
 * Manages user state, role information, and auth operations.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  createUserWithEmail,
  signInWithEmail,
  signOutUser,
  sendPasswordResetEmailClient,
  UserRole,
  UserProfile,
} from '../lib/firebaseClient';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch user profile from MongoDB to get role
        try {
          const response = await fetch(`/api/users/profile?uid=${firebaseUser.uid}`);
          const data = await response.json();
          
          if (data.success && data.data) {
            setUserProfile(data.data);
          } else {
            setUserProfile(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Sign up a new user
   */
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    role: UserRole
  ) => {
    setIsLoading(true);
    try {
      await createUserWithEmail(email, password, displayName, role);
      // Auth state listener will update user and profile automatically
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Sign in an existing user
   */
  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      // Auth state listener will update user and profile automatically
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  /**
   * Sign out the current user
   */
  const signOut = async () => {
    setIsLoading(true);
    try {
      await signOutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send password reset email
   */
  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmailClient(email);
  };

  const value: AuthContextType = {
    user,
    userProfile,
    role: userProfile?.role || null,
    isLoading,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use auth context
 * 
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
