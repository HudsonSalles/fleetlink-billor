// firebase
import { User as FirebaseUser, getIdTokenResult } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// types
import { User } from '../types/entities';

/**
 * User roles in the system (simplified - admin only)
 */
export enum UserRole {
  ADMIN = 'admin'
}

/**
 * Permission mapping for admin role (full access)
 */
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'read:trucks', 'create:trucks', 'update:trucks', 'delete:trucks',
    'read:drivers', 'create:drivers', 'update:drivers', 'delete:drivers',
    'read:loads', 'create:loads', 'update:loads', 'delete:loads',
    'read:dashboard', 'manage:users'
  ]
};

/**
 * Get user permissions based on role
 */
export const getUserPermissions = (role: UserRole): string[] => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[UserRole.ADMIN];
};

/**
 * Check if user has specific permission
 */
export const hasPermission = (userRole: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
};

/**
 * Get user's Firebase custom claims and role information
 */
export const getUserClaims = async (firebaseUser: FirebaseUser): Promise<{
  role: UserRole;
  permissions: string[];
} | null> => {
  try {
    // Get fresh token with custom claims
    const idTokenResult = await getIdTokenResult(firebaseUser, true);
    const role = (idTokenResult.claims.role as UserRole) || UserRole.ADMIN;
    const permissions = getUserPermissions(role);

    return { role, permissions };
  } catch (error) {
    console.error('Error getting user claims:', error);
    return null;
  }
};

/**
 * Get or create user profile in Firestore
 */
export const getUserProfile = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userRef);

    // Get role and permissions from custom claims
    const claims = await getUserClaims(firebaseUser);
    if (!claims) {
      throw new Error('Failed to get user claims');
    }

    if (userDoc.exists()) {
      // User exists, return with fresh claims data
      const userData = userDoc.data();
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: userData.displayName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: claims.role,
        permissions: claims.permissions,
        createdAt: userData.createdAt?.toDate() || new Date(),
        updatedAt: userData.updatedAt?.toDate() || new Date(),
      } as User;
    } else {
      // User doesn't exist, create new profile
      const newUser = {
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        role: claims.role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(userRef, newUser);

      return {
        uid: firebaseUser.uid,
        ...newUser,
        permissions: claims.permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Initialize admin user (for initial setup)
 * Note: This requires Firebase Admin SDK or Firebase Functions
 * For now, this would need to be done manually in Firebase Console
 */
export const initializeAdminUser = async (email: string): Promise<boolean> => {
  try {
    // This would typically be done via Firebase Functions or Firebase Admin SDK
    // For frontend-only solution, admin initialization needs to be done manually
    console.warn('Admin initialization requires Firebase Functions or manual setup in Firebase Console');
    console.info(`To set admin role for ${email}:`);
    console.info('1. Go to Firebase Console → Authentication → Users');
    console.info('2. Find the user and set custom claims: {"role": "admin"}');
    console.info('3. Or use Firebase Admin SDK in a secure environment');
    
    return false;
  } catch (error) {
    console.error('Error initializing admin user:', error);
    return false;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (
  uid: string, 
  updates: Partial<Pick<User, 'displayName' | 'role'>>
): Promise<boolean> => {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== uid) {
      // Only allow users to update their own profile (except role)
      // Role updates would need admin privileges via Firebase Functions
      if (updates.role) {
        console.warn('Role updates require admin privileges via Firebase Functions');
        return false;
      }
    }

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Check if current user is admin
 */
export const isCurrentUserAdmin = async (): Promise<boolean> => {
  if (!auth.currentUser) return false;

  try {
    const claims = await getUserClaims(auth.currentUser);
    return claims?.role === UserRole.ADMIN;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

/**
 * Refresh user token to get latest custom claims
 */
export const refreshUserToken = async (): Promise<void> => {
  if (!auth.currentUser) return;

  try {
    await getIdTokenResult(auth.currentUser, true);
  } catch (error) {
    console.error('Error refreshing user token:', error);
  }
};