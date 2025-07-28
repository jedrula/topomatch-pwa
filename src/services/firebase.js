import { initializeApp } from "firebase/app";
import { getStorage, connectStorageEmulator } from "firebase/storage";

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
}

export { storage };
