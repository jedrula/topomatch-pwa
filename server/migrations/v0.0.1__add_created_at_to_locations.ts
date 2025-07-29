/**
 * Migration: Add createdAt field to existing locations
 *
 * This migration adds a createdAt timestamp to any existing locations
 * that don't already have this field. New locations created after this
 * migration will automatically have createdAt set by the createLocation function.
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("Adding createdAt field to existing locations...");

  try {
    const db = firestore.firestore;
    const locationsRef = db.collection("locations");
    const snapshot = await locationsRef.get();

    if (snapshot.empty) {
      console.log("No locations found to migrate.");
      return;
    }

    const batch = db.batch();
    let updatedCount = 0;

    // Default date for existing locations (July 29, 2025)
    const defaultCreatedAt = new Date("2025-07-29T00:00:00.000Z");

    snapshot.forEach((doc: any) => {
      const data = doc.data();

      // Only update if createdAt field is missing
      if (!data.createdAt) {
        batch.update(doc.ref, {
          createdAt: defaultCreatedAt,
          updatedAt: new Date(), // Also update the updatedAt timestamp
        });
        updatedCount++;
        console.log(`Updating location: ${data.name || doc.id}`);
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully added createdAt field to ${updatedCount} locations.`);
    } else {
      console.log("All locations already have createdAt field.");
    }
  } catch (error) {
    console.error("Error migrating locations:", error);
    throw error;
  }
}
