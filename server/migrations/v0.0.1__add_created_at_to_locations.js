// Migration: Add createdAt field to all existing locations
// Date: 2025-07-29

const admin = require("firebase-admin");

// This migration adds createdAt field to all existing locations
// that don't have it set, using today's date (July 29, 2025)
module.exports.migrate = async () => {
  const db = admin.firestore();
  const defaultDate = new Date("2025-07-29T00:00:00Z");

  console.log("Starting migration: Add createdAt to existing locations");

  try {
    // Get all locations
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      console.log("No locations found. Migration completed.");
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    locationsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Only update if createdAt is missing
      if (!data.createdAt) {
        batch.update(doc.ref, {
          createdAt: defaultDate,
          // Also ensure updatedAt is set if missing
          updatedAt: data.updatedAt || defaultDate,
        });
        updateCount++;
        console.log(`Queued update for location: ${doc.id} (${data.name || "unnamed"})`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully updated ${updateCount} locations with createdAt field`);
    } else {
      console.log("All locations already have createdAt field. No updates needed.");
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};

// Rollback function (optional)
module.exports.rollback = async () => {
  const db = admin.firestore();

  console.log("Starting rollback: Remove createdAt from locations");

  try {
    // Get all locations with createdAt field
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      console.log("No locations found. Rollback completed.");
      return;
    }

    const batch = db.batch();
    let updateCount = 0;

    locationsSnapshot.forEach((doc) => {
      const data = doc.data();

      // Only rollback if createdAt exists and matches our migration date
      if (
        data.createdAt &&
        data.createdAt.toDate().toDateString() === new Date("2025-07-29").toDateString()
      ) {
        batch.update(doc.ref, {
          createdAt: admin.firestore.FieldValue.delete(),
        });
        updateCount++;
        console.log(`Queued rollback for location: ${doc.id} (${data.name || "unnamed"})`);
      }
    });

    if (updateCount > 0) {
      await batch.commit();
      console.log(`Successfully rolled back ${updateCount} locations`);
    } else {
      console.log("No locations to rollback.");
    }

    console.log("Rollback completed successfully");
  } catch (error) {
    console.error("Rollback failed:", error);
    throw error;
  }
};
