import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Firebase configuration based on environment
const getFirebaseConfig = () => {
  // Check if we're in development mode or should use emulators
  const useEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_EMULATORS === "true";

  console.log("🔍 Environment debug:", {
    "import.meta.env.DEV": import.meta.env.DEV,
    "import.meta.env.VITE_USE_EMULATORS": import.meta.env.VITE_USE_EMULATORS,
    useEmulators: useEmulators,
    mode: import.meta.env.MODE,
  });

  if (useEmulators) {
    // Development/Emulator configuration
    return {
      apiKey: "demo-api-key",
      authDomain: "topomatch-pwa.firebaseapp.com",
      projectId: "topomatch-pwa",
      storageBucket: "topomatch-pwa.appspot.com",
      messagingSenderId: "123456789",
      appId: "demo-app-id",
    };
  } else {
    // Production configuration
    return {
      projectId: "topomatch-pwa",
      appId: "1:592023645230:web:0de421f7ba777652ef43bf",
      storageBucket: "topomatch-pwa.firebasestorage.app",
      apiKey: "AIzaSyD2LND6HuSMwEFL70ke48mJczTP5uScMW0",
      authDomain: "topomatch-pwa.firebaseapp.com",
      messagingSenderId: "592023645230",
    };
  }
};

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Functions
const functions = getFunctions(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Connect to emulator if in development or explicitly enabled
const useEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_EMULATORS === "true";

if (useEmulators) {
  console.log("🔧 Connecting to Firebase emulators...");

  try {
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("✅ Connected to Firebase Storage emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "storage/emulator-config-failed") {
      console.warn("Storage emulator connection error:", error);
    }
  }

  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("✅ Connected to Firebase Functions emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "functions/emulator-config-failed") {
      console.warn("Functions emulator connection error:", error);
    }
  }

  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("✅ Connected to Firestore emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "firestore/emulator-config-failed") {
      console.warn("Firestore emulator connection error:", error);
    }
  }

  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    console.log("✅ Connected to Firebase Auth emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "auth/emulator-config-failed") {
      console.warn("Auth emulator connection error:", error);
    }
  }
} else {
  console.log("🚀 Using production Firebase services");
}

export { storage, functions, db, auth };
