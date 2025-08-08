/**
 * Migration: Remove <defs> tags from svgMarkup in boulder problem holds
 * Date: 2025-08-08
 *
 * This migration removes <defs>...</defs> tags from svgMarkup fields
 * in boulder problem holds to clean up legacy SVG content
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("Starting migration: Clean SVG defs from boulder problem holds");

  try {
    const db = firestore.firestore;

    // Get all locations to iterate through their boulder problems
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      console.log("No locations found. Migration completed.");
      return;
    }

    let totalUpdated = 0;
    let totalChecked = 0;

    // Process each location
    for (const locationDoc of locationsSnapshot.docs) {
      const locationId = locationDoc.id;
      console.log(`Processing location: ${locationId}`);

      // Get all boulder problems for this location
      const boulderProblemsSnapshot = await db
        .collection("locations")
        .doc(locationId)
        .collection("boulderProblems")
        .get();

      if (boulderProblemsSnapshot.empty) {
        console.log(`  No boulder problems found for location ${locationId}`);
        continue;
      }

      const batch = db.batch();
      let batchCount = 0;
      let locationUpdated = 0;

      // Process each boulder problem
      for (const problemDoc of boulderProblemsSnapshot.docs) {
        const problemData = problemDoc.data();
        const problemId = problemDoc.id;
        let problemUpdated = false;

        console.log(`  Processing boulder problem: ${problemId}`);

        // Check if holds array exists
        if (problemData.holds && Array.isArray(problemData.holds)) {
          const updatedHolds = problemData.holds.map((hold: any, index: number) => {
            totalChecked++;

            // Check if hold has nested structure with svgMarkup
            if (hold.hold && hold.hold.svgMarkup && typeof hold.hold.svgMarkup === "string") {
              const originalMarkup = hold.hold.svgMarkup;

              console.log(
                `    Checking hold ${index} for <defs> tags...`,
                originalMarkup.substring(0, 100)
              );

              // Debug: Log the actual content to see what we're working with
              if (originalMarkup.includes("<defs") || originalMarkup.includes("defs>")) {
                console.log(`    DEBUG: Found potential defs in hold ${index}`);
                console.log(`    Full content: ${originalMarkup}`);
              }

              // Remove <defs>...</defs> tags (including nested content)
              // Try multiple regex patterns to catch different variations
              let cleanedMarkup = originalMarkup;

              // Pattern 1: Standard defs tags
              cleanedMarkup = cleanedMarkup.replace(/<defs[^>]*>[\s\S]*?<\/defs>/gi, "");

              // Pattern 2: Self-closing defs tags
              cleanedMarkup = cleanedMarkup.replace(/<defs[^>]*\/>/gi, "");

              // Pattern 3: Defs with no attributes
              cleanedMarkup = cleanedMarkup.replace(/<defs>[\s\S]*?<\/defs>/gi, "");

              if (cleanedMarkup !== originalMarkup) {
                console.log(`    Cleaned hold ${index}: removed defs tags`);
                console.log(`    Before: ${originalMarkup.substring(0, 100)}...`);
                console.log(`    After:  ${cleanedMarkup.substring(0, 100)}...`);

                totalUpdated++;
                problemUpdated = true;

                return {
                  ...hold,
                  hold: {
                    ...hold.hold,
                    svgMarkup: cleanedMarkup.trim(), // Also trim whitespace
                  },
                };
              }
            }

            return hold;
          });

          // If any holds were updated, add to batch
          if (problemUpdated) {
            const problemRef = db
              .collection("locations")
              .doc(locationId)
              .collection("boulderProblems")
              .doc(problemId);

            batch.update(problemRef, {
              holds: updatedHolds,
              // Also update a timestamp for tracking
              lastSvgCleaned: new Date(),
              updatedAt: new Date(), // Update the general updatedAt timestamp
            });

            batchCount++;
            locationUpdated++;

            // Commit batch if it gets too large (Firestore limit is 500)
            if (batchCount >= 400) {
              console.log(`    Committing batch of ${batchCount} updates...`);
              await batch.commit();

              // Create new batch for remaining updates
              const newBatch = db.batch();
              Object.assign(batch, newBatch);
              batchCount = 0;
            }
          }
        }
      }

      // Commit any remaining updates for this location
      if (batchCount > 0) {
        console.log(
          `  Committing final batch of ${batchCount} updates for location ${locationId}...`
        );
        await batch.commit();
      }

      console.log(`  Location ${locationId} completed: ${locationUpdated} problems updated`);
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Total holds checked: ${totalChecked}`);
    console.log(`Total holds updated: ${totalUpdated}`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
