// firebase
import {
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firebase';

// zustand
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// utils
import { getUserProfile } from '../utils/firebaseAuth';

//types
import { User } from '../types/entities';

/**
 * Authentication state interface
 */
interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Loading state for auth operations */
  loading: boolean;
  /** Error message from auth operations */
  error: string | null;
  /** Whether auth state has been initialized */
  initialized: boolean;
}

/**
 * Authentication actions interface
 */
interface AuthActions {
  /** Sign in with email and password */
  signIn: (email: string, password: string) => Promise<void>;
  /** Sign up new user */
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  /** Sign out current user */
  signOut: () => Promise<void>;
  /** Force clear all auth data (development helper) */
  forceSignOut: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Initialize authentication listener */
  initializeAuth: () => () => void;
  /** Set user data */
  setUser: (user: User | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Refresh user data from backend */
  refreshUser: () => Promise<void>;
  /** Check if user has specific role */
  hasRole: (role: string) => boolean;
  /** Check if user can perform action */
  canPerform: (action: string) => boolean;
}

/**
 * Combined auth store type
 */
type AuthStore = AuthState & AuthActions;

/**
 * Fetches user data from Firebase directly - no backend required
 */
const fetchUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User | null> => {
  try {
    const userData = await getUserProfile(firebaseUser);
    
    if (!userData) {
      throw new Error('Failed to get user profile from Firebase');
    }
    
    return userData;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🚨 Firebase user fetch failed:', errorMessage);
    throw new Error(`Firebase authentication failed: ${errorMessage}`);
  }
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      loading: false,
      error: null,
      initialized: false,

      // Actions
      signIn: async (email: string, password: string) => {
        if (!auth) {
          set({ error: 'Authentication service not available', loading: false });
          throw new Error('Authentication service not available');
        }

        set({ loading: true, error: null });
        try {
          const { user: firebaseUser } = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
          
          // Force token refresh to get latest custom claims
          await firebaseUser.getIdToken(true);
          
          // Get user profile directly from Firebase
          try {
            const userData = await fetchUserFromFirebase(firebaseUser);
            set({ 
              user: userData, 
              loading: false,
              error: null
            });
          } catch (firebaseError) {
            // Firebase user profile fetch failed - sign out the user and show error
            console.error('🚨 Firebase user profile fetch failed - signing out user');
            await firebaseSignOut(auth);
            
            set({ 
              user: null,
              loading: false,
              error: 'Failed to load user profile - please try again later'
            });
            throw new Error('Backend authentication required but unavailable');
          }
        } catch (error: unknown) {
          console.error('Sign in error:', error);
          const firebaseError = error as { code?: string; message?: string };
          const errorMessage = firebaseError.code === 'auth/user-not-found' 
            ? 'No account found with this email address'
            : firebaseError.code === 'auth/wrong-password'
            ? 'Incorrect password'
            : firebaseError.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : firebaseError.code === 'auth/too-many-requests'
            ? 'Too many failed attempts. Please try again later.'
            : 'Failed to sign in. Please try again.';
          
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, displayName: string) => {
        if (!auth) {
          set({ error: 'Authentication service not available', loading: false });
          throw new Error('Authentication service not available');
        }

        set({ loading: true, error: null });
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          
          // Get user profile directly from Firebase after signup
          const firebaseUser = auth.currentUser;
          if (!firebaseUser) {
            throw new Error('No user after signup');
          }
          
          try {
            const userData = await fetchUserFromFirebase(firebaseUser);
            set({ 
              user: userData, 
              loading: false,
              error: null
            });
          } catch (backendError) {
            // Backend failed during signup - sign out and show error
            console.error('🚨 Backend unavailable during signup - signing out');
            await firebaseSignOut(auth);
            
            set({ 
              user: null,
              loading: false,
              error: 'System unavailable - please try again later'
            });
            throw new Error('Backend authentication required but unavailable');
          }
        } catch (error: any) {
          console.error('Sign up error:', error);
          const errorMessage = error.code === 'auth/email-already-in-use'
            ? 'An account with this email already exists'
            : error.code === 'auth/weak-password'
            ? 'Password should be at least 6 characters'
            : error.code === 'auth/invalid-email'
            ? 'Invalid email address'
            : 'Failed to create account. Please try again.';
          
          set({ 
            error: errorMessage, 
            loading: false 
          });
          throw error;
        }
      },

      signOut: async () => {
        if (!auth) {
          console.warn('Auth service not available');
          set({ user: null, loading: false, error: null });
          return;
        }

        set({ loading: true });
        try {
          // Sign out from Firebase
          await firebaseSignOut(auth);
          
          // Clear all authentication-related data from localStorage
          localStorage.removeItem('firebase:authUser:' + auth.app.options.apiKey + ':[DEFAULT]');
          localStorage.removeItem('firebase:host:' + auth.app.options.authDomain);
          
          // Clear any other auth-related localStorage items
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('firebase:') || key.includes('auth') || key.includes('token')) {
              localStorage.removeItem(key);
            }
          });
          
          // Clear sessionStorage as well
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('firebase:') || key.includes('auth') || key.includes('token')) {
              sessionStorage.removeItem(key);
            }
          });
          
          // Reset the store state
          set({ 
            user: null, 
            loading: false,
            error: null,
            initialized: true
          });
        } catch (error: any) {
          console.error('Sign out error:', error);
          set({ 
            error: 'Failed to sign out. Please try again.', 
            loading: false 
          });
          throw error;
        }
      },

      forceSignOut: async () => {
        try {
          // Force sign out even if auth service is not available
          if (auth) {
            await firebaseSignOut(auth).catch(() => {
              // Ignore errors, we want to clear everything anyway
            });
          }
          
          // Aggressively clear all possible auth storage
          localStorage.clear();
          sessionStorage.clear();
          
          // Clear any indexed DB data (Firebase sometimes uses this)
          if ('indexedDB' in window) {
            try {
              const dbs = await indexedDB.databases?.();
              dbs?.forEach(db => {
                if (db.name?.includes('firebase') || db.name?.includes('auth')) {
                  indexedDB.deleteDatabase(db.name);
                }
              });
            } catch (e) {
              // Ignore indexedDB errors
            }
          }
          
          // Reset store to initial state
          set({ 
            user: null, 
            loading: false,
            error: null,
            initialized: false
          });

          // Reload the page to ensure clean state
          if (process.env.NODE_ENV === 'development') {
            setTimeout(() => window.location.reload(), 100);
          }
        } catch (error) {
          console.error('Force sign out error:', error);
        }
      },

      clearError: () => set({ error: null }),

      setUser: (user: User | null) => set({ user }),

      setLoading: (loading: boolean) => set({ loading }),

      refreshUser: async () => {
        if (!auth?.currentUser) return;

        try {
          set({ loading: true });
          
          // Force token refresh
          await auth.currentUser.getIdToken(true);
          
          // Get fresh user profile from Firebase
          try {
            const userData = await fetchUserFromFirebase(auth.currentUser);
            set({ user: userData, loading: false });
          } catch (firebaseError) {
            // Firebase failed during refresh - sign out user
            console.error('🚨 Firebase unavailable during refresh - signing out');
            await firebaseSignOut(auth);
            
            set({ 
              user: null, 
              loading: false, 
              error: 'System unavailable - please sign in again'
            });
          }
        } catch (error) {
          console.error('Failed to refresh user data:', error);
          set({ 
            loading: false,
            error: 'Failed to refresh user data' 
          });
        }
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      canPerform: (action: string) => {
        const { user } = get();
        if (!user) return false;
        
        // Use permissions from backend if available
        if (user.permissions) {
          return user.permissions.includes(action) || 
                 user.permissions.some(perm => perm.startsWith(action.split(':')[0]));
        }
        
        // Fallback to role-based permissions (admin only)
        const permissions: Record<'admin', string[]> = {
          admin: ['create', 'read', 'update', 'delete', 'manage']
        };
        
        const userPermissions = permissions[user.role as 'admin'] || [];
        return userPermissions.includes(action) || 
               userPermissions.some(perm => perm.startsWith(action.split(':')[0]));
      },

      initializeAuth: () => {
        if (!auth) {
          set({ 
            user: null, 
            loading: false,
            initialized: true,
            error: 'Firebase Auth not initialized'
          });
          return () => {}; // Return empty cleanup function
        }
        set({ loading: true, initialized: false });
        
        const unsubscribe = onAuthStateChanged(
          auth, 
          async (firebaseUser: FirebaseUser | null) => {
            try {
              if (firebaseUser) {
                              
                // Wait for auth to be fully ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Force token refresh to get latest custom claims on auth state change
                await firebaseUser.getIdToken(true);
                
                // Get user profile directly from Firebase
                try {
                  const userData = await fetchUserFromFirebase(firebaseUser);
                  set({ 
                    user: userData, 
                    loading: false,
                    initialized: true,
                    error: null
                  });
                } catch (firebaseError) {
                  await firebaseSignOut(auth);
                  
                  set({ 
                    user: null, 
                    loading: false,
                    initialized: true,
                    error: 'Failed to load user profile - please try again'
                  });
                }
              } else {
                set({ 
                  user: null, 
                  loading: false,
                  initialized: true,
                  error: null
                });
              }
            } catch (error) {
              set({ 
                user: null, 
                loading: false,
                initialized: true,
                error: 'Cannot determine Firebase Auth state'
              });
            }
          }
        );

        return unsubscribe;
      },
    }),
    {
      name: 'fleetlink-auth', // localStorage key
      partialize: (state: AuthStore) => ({ 
        user: state.user,
        initialized: state.initialized 
      }), // Only persist user data and initialized state
    }
  )
);

// Define development auth helpers interface
interface FleetAuthHelpers {
  forceSignOut: () => Promise<void>;
  signOut: () => Promise<void>;
  getCurrentUser: () => any;
  clearAuth: () => void;
}

// Extend window interface for development helpers
declare global {
  interface Window {
    fleetAuth?: FleetAuthHelpers;
  }
}

// Development helper: expose forceSignOut to window object
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.fleetAuth = {
    forceSignOut: () => useAuthStore.getState().forceSignOut(),
    signOut: () => useAuthStore.getState().signOut(),
    getCurrentUser: () => useAuthStore.getState().user,
    clearAuth: () => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };
}