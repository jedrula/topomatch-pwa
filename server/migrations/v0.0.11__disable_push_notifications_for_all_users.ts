/**
 * Migration: Disable push notifications for all existing users
 * Date: 2026-01-08
 *
 * This migration sets pushNotificationsEnabled to false for all users.
 * This is useful during testing to prevent sending notifications to test users.
 * Users can manually enable push notifications later through app settings.
 * 
 * Changes:
 * - Sets pushNotificationsEnabled: false for all users in /users collection
 * - Preserves other user fields (merge mode)
 * - Provides summary of updated users
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("🔕 Starting migration: Disable push notifications for all users\n");

  try {
    const db = firestore.firestore;

    // Fetch all users
    console.log("📥 Fetching all users...");
    const usersSnapshot = await db.collection("users").get();

    console.log(`   Found ${usersSnapshot.size} users\n`);

    if (usersSnapshot.empty) {
      console.log("✅ No users found. Migration completed.");
      return;
    }

    let updated = 0;
    let errors = 0;

    // Process each user
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const email = userData.email || userId;

        // Set pushNotificationsEnabled to false
        await userDoc.ref.set(
          {
            pushNotificationsEnabled: false,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        updated++;
        console.log(`   🔕 Disabled: ${email}`);
      } catch (error) {
        errors++;
        console.error(`   ❌ Error processing user ${userDoc.id}:`, error);
      }
    }

    console.log("\n─────────────────────────────────────");
    console.log("📊 Migration Summary:");
    console.log(`   Disabled: ${updated}`);
    console.log(`   Errors:   ${errors}`);
    console.log(`   Total:    ${usersSnapshot.size}`);
    console.log("─────────────────────────────────────\n");

    if (errors > 0) {
      throw new Error(`Migration completed with ${errors} error(s)`);
    }

    console.log("✅ Migration completed successfully!");
    console.log("   All users have push notifications disabled.");
    console.log("   Users can re-enable in app settings when ready.\n");
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    throw error;
  }
}
