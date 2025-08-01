import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-offline-vue-pwa.firebaseapp.com",
  projectId: "demo-offline-vue-pwa",
  storageBucket: "demo-offline-vue-pwa.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Functions
const functions = getFunctions(app);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Connect to emulator if in development
if (import.meta.env.DEV) {
  try {
    connectStorageEmulator(storage, "localhost", 9199);
    console.log("Connected to Firebase Storage emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "storage/emulator-config-failed") {
      console.warn("Storage emulator connection error:", error);
    }
  }

  try {
    connectFunctionsEmulator(functions, "localhost", 5001);
    console.log("Connected to Firebase Functions emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "functions/emulator-config-failed") {
      console.warn("Functions emulator connection error:", error);
    }
  }

  try {
    connectFirestoreEmulator(db, "localhost", 8080);
    console.log("Connected to Firestore emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "firestore/emulator-config-failed") {
      console.warn("Firestore emulator connection error:", error);
    }
  }

  try {
    connectAuthEmulator(auth, "http://localhost:9099");
    console.log("Connected to Firebase Auth emulator");
  } catch (error) {
    // Emulator might already be connected
    if (error.code !== "auth/emulator-config-failed") {
      console.warn("Auth emulator connection error:", error);
    }
  }
}

export { storage, functions, db, auth };
