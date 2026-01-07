import { initializeApp } from 'firebase/app';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration based on environment
const getFirebaseConfig = () => {
  // Always use real credentials (required for FCM even with emulators)
  // Production configuration
  return {
    projectId: 'topomatch-pwa',
    appId: '1:592023645230:web:0de421f7ba777652ef43bf',
    storageBucket: 'topomatch-pwa.firebasestorage.app',
    apiKey: 'AIzaSyD2LND6HuSMwEFL70ke48mJczTP5uScMW0',
    authDomain: 'topomatch-pwa.firebaseapp.com',
    messagingSenderId: '592023645230',
  };
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Functions with europe-west1 region
const functions = getFunctions(app, 'europe-west1');

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth (only for web - Capacitor uses native plugin)
const isCapacitor = window.Capacitor !== undefined;
const auth = isCapacitor ? null : getAuth(app);

// Connect to emulator if in development or explicitly enabled
const useEmulators =
  import.meta.env.MODE === 'development' || import.meta.env.VITE_USE_EMULATORS === 'true';

console.log('[Firebase] MODE:', import.meta.env.MODE, 'useEmulators:', useEmulators);

if (useEmulators) {

  // Determine the emulator host - use localhost if running on the same machine,
  // or the current hostname if accessing from another device (like mobile)
  const getEmulatorHost = () => {
    // If explicitly set via environment variable, use that
    if (import.meta.env.VITE_EMULATOR_HOST) {
      return import.meta.env.VITE_EMULATOR_HOST;
    }
    
    // Check if we're accessing via an IP address (likely mobile testing)
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return hostname;
    }
    
    return 'localhost';
  };

  const emulatorHost = getEmulatorHost();

  try {
    connectStorageEmulator(storage, emulatorHost, 9199);
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== 'storage/emulator-config-failed') {
      console.warn('Storage emulator connection error:', error);
    }
  }

  try {
    connectFunctionsEmulator(functions, emulatorHost, 5001);
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== 'functions/emulator-config-failed') {
      console.warn('Functions emulator connection error:', error);
    }
  }

  try {
    connectFirestoreEmulator(db, emulatorHost, 8080);
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== 'firestore/emulator-config-failed') {
      console.warn('Firestore emulator connection error:', error);
    }
  }

  if (!isCapacitor) {
    try {
      connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
    } catch (error) {
      // Emulator might already be connected
      if (error.code !== 'auth/emulator-config-failed') {
        console.warn('Auth emulator connection error:', error);
      }
    }
  }
} else {
}

export { storage, functions, db, auth };
