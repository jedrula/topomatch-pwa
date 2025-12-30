/**
 * Migration: Fix manual hold SVG styling (remove hardcoded fill/stroke)
 * Date: 2025-12-30
 *
 * This migration removes hardcoded fill and stroke attributes from manual hold svgMarkup
 * to allow HoldSvg component to handle all styling through interaction states.
 * 
 * Changes:
 * - fill="rgba(59, 130, 246, 0.3)" → fill="transparent"
 * - stroke="#3b82f6" → stroke="transparent"
 * - Keeps stroke-width="2" intact
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("🚀 Starting manual hold SVG styling fix migration...\n");

  try {
    const db = firestore.firestore;

    // Get all locations to iterate through their boulder problems
    console.log("📥 Fetching all locations...");
    const locationsSnapshot = await db.collection("locations").get();

    if (locationsSnapshot.empty) {
      console.log("   No locations found. Migration completed.");
      return;
    }

    console.log(`   Found ${locationsSnapshot.size} locations\n`);

    let totalProblemsChecked = 0;
    let totalProblemsUpdated = 0;
    let totalHoldsFixed = 0;

    // Process each location
    for (const locationDoc of locationsSnapshot.docs) {
      const locationId = locationDoc.id;
      console.log(`📍 Processing location: ${locationId}`);

      // Get all boulder problems for this location
      const boulderProblemsSnapshot = await db
        .collection("locations")
        .doc(locationId)
        .collection("boulderProblems")
        .get();

      if (boulderProblemsSnapshot.empty) {
        console.log(`   No boulder problems found for location ${locationId}\n`);
        continue;
      }

      console.log(`   Found ${boulderProblemsSnapshot.size} boulder problems`);

      // Process each boulder problem
      for (const problemDoc of boulderProblemsSnapshot.docs) {
        const problemData = problemDoc.data();
        const problemId = problemDoc.id;
        totalProblemsChecked++;

        // Check if holds array exists
        if (!problemData.holds || !Array.isArray(problemData.holds)) {
          continue;
        }

        let problemNeedsUpdate = false;
        const updatedHolds = problemData.holds.map((hold: any, index: number) => {
          // Check if hold has svgMarkup (manual hold) or hold.svgMarkup (nested structure)
          const svgMarkup = hold.svgMarkup || hold.hold?.svgMarkup;
          
          if (!svgMarkup || typeof svgMarkup !== "string") {
            return hold;
          }

          // Check if this hold has the old styling that needs fixing
          const hasOldFill = svgMarkup.includes('fill="rgba(59, 130, 246, 0.3)"');
          const hasOldBlueStroke = svgMarkup.includes('stroke="#3b82f6"');
          const hasOldGreenStroke = svgMarkup.includes('stroke="#059669"');

          if (!hasOldFill && !hasOldBlueStroke && !hasOldGreenStroke) {
            return hold; // Already fixed or different styling
          }

          // Fix the SVG markup
          let fixedMarkup = svgMarkup;

          // Replace old fill with transparent
          if (hasOldFill) {
            fixedMarkup = fixedMarkup.replace(
              /fill="rgba\(59,\s*130,\s*246,\s*0\.3\)"/g,
              'fill="transparent"'
            );
          }

          // Replace old blue stroke with transparent
          if (hasOldBlueStroke) {
            fixedMarkup = fixedMarkup.replace(
              /stroke="#3b82f6"/g,
              'stroke="transparent"'
            );
          }

          // Replace old green stroke with transparent
          if (hasOldGreenStroke) {
            fixedMarkup = fixedMarkup.replace(
              /stroke="#059669"/g,
              'stroke="transparent"'
            );
          }

          problemNeedsUpdate = true;
          totalHoldsFixed++;

          console.log(`      ✓ Fixed hold ${index} in problem ${problemId}`);

          // Return with correct structure (preserve whether it's nested or not)
          if (hold.hold?.svgMarkup) {
            return {
              ...hold,
              hold: {
                ...hold.hold,
                svgMarkup: fixedMarkup,
              },
            };
          } else {
            return {
              ...hold,
              svgMarkup: fixedMarkup,
            };
          }
        });

        // Update the problem if any holds were fixed
        if (problemNeedsUpdate) {
          await db
            .collection("locations")
            .doc(locationId)
            .collection("boulderProblems")
            .doc(problemId)
            .update({
              holds: updatedHolds,
            });

          totalProblemsUpdated++;
          console.log(`   ✅ Updated problem ${problemId}`);
        }
      }

      console.log(`   Completed location ${locationId}\n`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration completed successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   • Locations processed: ${locationsSnapshot.size}`);
    console.log(`   • Problems checked: ${totalProblemsChecked}`);
    console.log(`   • Problems updated: ${totalProblemsUpdated}`);
    console.log(`   • Holds fixed: ${totalHoldsFixed}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Migration failed with error:", error);
    throw error;
  }
}
