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

async function makeUserAdmin(email) {
  try {
    console.log(`🔍 Looking up user with email: ${email}`);

    // Find user by email
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.uid}`);

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    console.log(`🔧 Set admin custom claims for user: ${userRecord.uid}`);

    // Also store in Firestore for easy querying
    await db.collection("users").doc(userRecord.uid).set(
      {
        isAdmin: true,
        email: userRecord.email,
        updatedAt: new Date(),
        role: "admin",
      },
      { merge: true }
    );
    console.log(`💾 Updated Firestore user document`);

    console.log(`🎉 Successfully granted admin privileges to: ${email}`);
  } catch (error) {
    console.error(`❌ Error making user admin:`, error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error(`❌ Usage: npm run make-admin <email>`);
  console.error(`   Example: npm run make-admin user@example.com`);
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`❌ Invalid email format: ${email}`);
  process.exit(1);
}

makeUserAdmin(email)
  .then(() => {
    console.log(`✨ Script completed successfully`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`💥 Script failed:`, error);
    process.exit(1);
  });
