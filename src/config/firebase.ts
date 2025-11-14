import { initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, Firestore, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, Functions, getFunctions } from 'firebase/functions';
import { connectStorageEmulator, FirebaseStorage, getStorage } from 'firebase/storage';

/**
 * Firebase configuration object
 * All values are loaded from environment variables for security
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

/**
 * Required Firebase configuration fields
 */
const REQUIRED_FIREBASE_FIELDS = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID',
] as const;

/**
 * Validates that all required Firebase configuration values are present
 * 
 * @throws {Error} When required environment variables are missing
 */
const validateFirebaseConfig = (): void => {
  const missingFields = REQUIRED_FIREBASE_FIELDS.filter(
    field => !process.env[field] || process.env[field] === 'your_firebase_api_key_here'
  );

  if (missingFields.length > 0) {
    const errorMessage = `Missing required Firebase configuration: ${missingFields.join(', ')}`;
    
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `❌ ${errorMessage}\n\n` +
        '📝 To fix this:\n' +
        '1. Copy .env.example to .env\n' +
        '2. Fill in your Firebase project configuration values\n' +
        '3. Restart the development server\n\n' +
        '🔗 Get your config from https://console.firebase.google.com/'
      );
      throw new Error(`Development stopped: ${errorMessage}`);
    } else {
      throw new Error(`Production build failed: ${errorMessage}`);
    }
  }

  // Additional validation for production
  if (process.env.NODE_ENV === 'production') {
    const invalidProdValues = REQUIRED_FIREBASE_FIELDS.filter(
      field => process.env[field]?.includes('your_') || 
               process.env[field]?.includes('localhost') ||
               process.env[field]?.includes('demo')
    );

    if (invalidProdValues.length > 0) {
      throw new Error(
        `Production build contains placeholder/demo values: ${invalidProdValues.join(', ')}`
      );
    }
  }
};

// Validate configuration before initializing
validateFirebaseConfig();

/**
 * Initialize Firebase app
 * Configuration validation already ensures we have valid config
 */
const app = initializeApp(firebaseConfig);

/**
 * Initialize Firebase services
 * All services are guaranteed to be available since validation passed
 */
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);
export const functions: Functions = getFunctions(app);

/**
 * Connect to Firebase emulators in development environment
 * This allows local development without affecting production data
 */
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_EMULATOR === 'true' && auth && db && storage && functions) {
  try {
    // Connect to Auth emulator (check if already connected)
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch (error) {
    // Auth emulator already connected or failed to connect
    console.log('Auth emulator connection skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  try {
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Firestore emulator already connected or failed to connect
    console.log('Firestore emulator connection skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  try {
    // Connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    // Storage emulator already connected or failed to connect
    console.log('Storage emulator connection skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
  
  try {
    // Connect to Functions emulator
    connectFunctionsEmulator(functions, 'localhost', 5001);
  } catch (error) {
    // Functions emulator already connected or failed to connect
    console.log('Functions emulator connection skipped:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Firebase app instance
 * Export for advanced usage or configuration
 */
export default app;