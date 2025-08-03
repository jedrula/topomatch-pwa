#!/usr/bin/env node

const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase Admin with project ID
initializeApp({
  projectId: "demo-offline-vue-pwa",
});

const auth = getAuth();
const db = getFirestore();

// Configure for emulator if needed
if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log(`🔧 Using Firebase Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
}
if (process.env.FIRESTORE_EMULATOR_HOST) {
  console.log(`🔧 Using Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

async function checkUserAdmin(email) {
  try {
    console.log(`🔍 Checking admin status for: ${email}`);

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid}`);

    // Check custom claims
    console.log(`🔧 Custom claims:`, userRecord.customClaims);
    console.log(`👑 Is admin:`, userRecord.customClaims?.admin === true);

    // Check Firestore document
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (userDoc.exists) {
      console.log(`💾 Firestore document:`, userDoc.data());
    } else {
      console.log(`❌ No Firestore document found`);
    }
  } catch (error) {
    console.error(`❌ Error checking user:`, error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error(`❌ Usage: npm run check-admin <email>`);
  console.error(`   Example: npm run check-admin user@example.com`);
  process.exit(1);
}

checkUserAdmin(email)
  .then(() => {
    console.log(`✨ Check completed`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`💥 Check failed:`, error);
    process.exit(1);
  });
