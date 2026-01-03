/**
 * Migration: Backfill Firestore users collection from Firebase Auth
 * Date: 2026-01-03
 *
 * This migration ensures all Firebase Auth users have a corresponding Firestore document.
 * Required for push notification queries that depend on users collection.
 * 
 * Changes:
 * - Creates user documents in /users/{uid} for all Firebase Auth users
 * - Preserves existing documents (merge mode)
 * - Adds email, displayName, createdAt, updatedAt fields
 */


export async function migrate(firestore: any): Promise<void> {
  console.log("🚀 Starting user backfill migration...\n");

  try {
    const db = firestore.firestore;
    const auth = firestore.app.auth();

    // Fetch all users from Firebase Auth
    console.log("📥 Fetching all Firebase Auth users...");
    const listUsersResult = await auth.listUsers();
    const authUsers = listUsersResult.users;

    console.log(`   Found ${authUsers.length} users in Firebase Auth\n`);

    if (authUsers.length === 0) {
      console.log("✅ No users to migrate. Migration completed.");
      return;
    }

    let created = 0;
    let updated = 0;
    let errors = 0;

    // Process each user
    for (const authUser of authUsers) {
      try {
        const userRef = db.collection("users").doc(authUser.uid);
        const userDoc = await userRef.get();

        const userData = {
          email: authUser.email || null,
          displayName: authUser.displayName || null,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        if (!userDoc.exists) {
          // Create new document
          await userRef.set({
            ...userData,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
          created++;
          console.log(`   ✅ Created: ${authUser.email || authUser.uid}`);
        } else {
          // Update existing document (merge to preserve other fields)
          await userRef.set(userData, { merge: true });
          updated++;
          console.log(`   🔄 Updated: ${authUser.email || authUser.uid}`);
        }
      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing ${authUser.email || authUser.uid}:`, error);
      }
    }

    console.log("\n─────────────────────────────────────");
    console.log("📊 Migration Summary:");
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors:  ${errors}`);
    console.log(`   Total:   ${authUsers.length}`);
    console.log("─────────────────────────────────────\n");

    if (errors > 0) {
      throw new Error(`Migration completed with ${errors} error(s)`);
    }

    console.log("✅ User backfill migration completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}
