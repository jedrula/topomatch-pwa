import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "demo-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
const storage = getStorage(app);

// Initialize Firebase Functions
const functions = getFunctions(app);

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
}

export { storage, functions };
