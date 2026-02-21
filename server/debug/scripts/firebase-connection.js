/**
 * Firebase Connection Helper for Debug Scripts
 * 
 * This module provides Firebase initialization for local debugging scripts
 * that need to connect to production or emulator services.
 * 
 * Usage:
 * ```
 * import { getFirestore } from './firebase-connection.js';
 * const db = getFirestore();
 * ```
 */

import { initializeApp } from 'firebase/app';
import { getFirestore as getFirestoreSDK, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth as getAuthSDK, connectAuthEmulator } from 'firebase/auth';
import { getStorage as getStorageSDK, connectStorageEmulator } from 'firebase/storage';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
let app;
let db;
let auth;
let storage;

export function initializeFirebase(useEmulator = true) {
  if (app) {
    console.log('✅ Firebase already initialized');
    return { app, db, auth, storage };
  }

  console.log(`🔧 Initializing Firebase (${useEmulator ? 'EMULATOR' : 'PRODUCTION'})...`);
  
  app = initializeApp(firebaseConfig);
  db = getFirestoreSDK(app);
  auth = getAuthSDK(app);
  storage = getStorageSDK(app);

  if (useEmulator) {
    console.log('🔌 Connecting to Firebase Emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Connected to emulators');
  } else {
    console.log('☁️  Connected to production Firebase');
  }

  return { app, db, auth, storage };
}

export function getFirestore() {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
}

export function getAuth() {
  if (!auth) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
}

export function getStorage() {
  if (!storage) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return storage;
}

/**
 * HOW TO USE IN DEBUG SCRIPTS:
 * 
 * 1. For LOCAL EMULATOR (default):
 *    ```
 *    import { initializeFirebase, getFirestore } from './firebase-connection.js';
 *    initializeFirebase(true); // or just initializeFirebase()
 *    const db = getFirestore();
 *    ```
 * 
 * 2. For PRODUCTION:
 *    ```
 *    import { initializeFirebase, getFirestore } from './firebase-connection.js';
 *    initializeFirebase(false); // Use production
 *    const db = getFirestore();
 *    ```
 * 
 * 3. Run the script:
 *    ```bash
 *    node --experimental-modules debug/scripts/your-script.js
 *    ```
 *    
 *    Or add to package.json:
 *    ```json
 *    "scripts": {
 *      "debug:inspect": "node debug/scripts/inspect-diagnostic.js"
 *    }
 *    ```
 */
