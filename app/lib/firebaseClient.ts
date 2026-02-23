/**
 * Firebase Client Configuration (Barrel File)
 * 
 * This file now re-exports from the split architecture:
 * - firebase-app.ts: Initialization and core app/auth instances (Lightweight)
 * - auth-actions.ts: Heavy authentication functions (SignIn, SignUp, etc.)
 * - types.ts: Type definitions
 * 
 * New components should import directly from firebase-app.ts or auth-actions.ts
 * to optimize bundle size.
 */

import { getAdditionalUserInfo } from 'firebase/auth';

// Re-export core instances
export * from './firebase-app';

// Re-export actions
export * from './auth-actions';

// Re-export types
export * from './types';

// Re-export specific firebase functions that were previously here
export { getAdditionalUserInfo };
