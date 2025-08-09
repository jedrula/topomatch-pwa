/**
 * Migration: Convert Flow location to numeric 1-10 grading system
 * Date: 2025-08-10
 *
 * This migration updates the Flow location (YIYwNAjQ0uycov4oGy7Z) from V-Scale
 * to a numeric 1-10 grading system and converts all boulder problems accordingly
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("Starting migration: Convert Flow location to numeric 1-10 grading system");

  try {
    const db = firestore.firestore;

    const FLOW_LOCATION_ID = "YIYwNAjQ0uycov4oGy7Z";

    // Define numeric 1-10 grading system
    const numericGradingSystem = {
      id: "numeric-10",
      name: "Numeric Scale (1-10)",
      type: "numeric",
      maxLevel: 10,
      grades: [
        { value: 0, label: "1", difficulty: 0 },
        { value: 1, label: "2", difficulty: 1 },
        { value: 2, label: "3", difficulty: 2 },
        { value: 3, label: "4", difficulty: 3 },
        { value: 4, label: "5", difficulty: 4 },
        { value: 5, label: "6", difficulty: 5 },
        { value: 6, label: "7", difficulty: 6 },
        { value: 7, label: "8", difficulty: 7 },
        { value: 8, label: "9", difficulty: 8 },
        { value: 9, label: "10", difficulty: 9 },
      ],
    };

    // Check if the Flow location exists
    const locationRef = db.collection("locations").doc(FLOW_LOCATION_ID);
    const locationDoc = await locationRef.get();

    if (!locationDoc.exists) {
      console.log(`Location ${FLOW_LOCATION_ID} not found. Skipping migration.`);
      return;
    }

    console.log(`Found Flow location: ${FLOW_LOCATION_ID}`);

    // Update the location with the numeric grading system
    await locationRef.update({
      gradingSystem: numericGradingSystem,
      updatedAt: new Date(),
      migrationApplied: "v0.0.4__convert_flow_to_numeric_grading",
    });

    console.log("✅ Updated Flow location to numeric 1-10 grading system");

    // Get all boulder problems for this location
    const boulderProblemsSnapshot = await locationRef.collection("boulderProblems").get();

    if (boulderProblemsSnapshot.empty) {
      console.log("No boulder problems found for Flow location.");
      return;
    }

    console.log(`Found ${boulderProblemsSnapshot.size} boulder problems to convert`);

    // Helper function to convert V-Scale difficulty to numeric 1-10 grade
    const convertToNumericGrade = (
      originalGrade: any
    ): { value: number; label: string; difficulty: number } => {
      let originalDifficulty = 0;

      // Extract difficulty from the original grade
      if (typeof originalGrade === "object" && originalGrade.difficulty !== undefined) {
        originalDifficulty = originalGrade.difficulty;
      } else if (typeof originalGrade === "string") {
        // Handle legacy string grades
        if (originalGrade === "VB") originalDifficulty = 0;
        else if (originalGrade.startsWith("V")) {
          const vNumber = parseInt(originalGrade.substring(1));
          originalDifficulty = isNaN(vNumber) ? 0 : vNumber + 1;
        }
      }

      // Map V-Scale difficulty (0-18) to numeric scale (0-9 for grades 1-10)
      // VB-V1 -> 1-2, V2-V4 -> 3-4, V5-V7 -> 5-6, V8-V10 -> 7-8, V11+ -> 9-10
      let numericValue;
      if (originalDifficulty <= 2) numericValue = Math.min(originalDifficulty, 1); // VB-V1 -> 1-2
      else if (originalDifficulty <= 5)
        numericValue = 2 + Math.floor((originalDifficulty - 2) / 2); // V2-V5 -> 3-4
      else if (originalDifficulty <= 8)
        numericValue = 4 + Math.floor((originalDifficulty - 5) / 2); // V6-V8 -> 5-6
      else if (originalDifficulty <= 11)
        numericValue = 6 + Math.floor((originalDifficulty - 8) / 2); // V9-V11 -> 7-8
      else numericValue = 8 + Math.min(Math.floor((originalDifficulty - 11) / 4), 1); // V12+ -> 9-10

      // Ensure we stay within bounds
      numericValue = Math.max(0, Math.min(9, numericValue));

      return numericGradingSystem.grades[numericValue];
    };

    // Process boulder problems in batches
    const batch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;

    for (const problemDoc of boulderProblemsSnapshot.docs) {
      const problemData = problemDoc.data();
      const problemId = problemDoc.id;

      console.log(`  Processing boulder problem: ${problemData.name || problemId}`);

      // Convert the grade from V-Scale to numeric
      const originalGrade = problemData.grade;
      const numericGrade = convertToNumericGrade(originalGrade);

      console.log(
        `    Converting grade: ${JSON.stringify(originalGrade)} -> ${numericGrade.label}`
      );

      // Update the boulder problem with the new numeric grade
      const problemRef = locationRef.collection("boulderProblems").doc(problemId);

      batch.update(problemRef, {
        grade: numericGrade,
        gradingSystemId: numericGradingSystem.id,
        updatedAt: new Date(),
        migrationApplied: "v0.0.4__convert_flow_to_numeric_grading",
        previousGrade: originalGrade, // Keep track of the original grade for reference
      });

      batchCount++;
      totalUpdated++;

      // Commit batch if it gets too large (Firestore limit is 500)
      if (batchCount >= 400) {
        console.log(`  Committing batch of ${batchCount} updates...`);
        await batch.commit();

        // Create new batch for remaining updates
        const newBatch = db.batch();
        Object.assign(batch, newBatch);
        batchCount = 0;
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      console.log(`Committing final batch of ${batchCount} updates...`);
      await batch.commit();
    }

    console.log("\n=== Migration Summary ===");
    console.log(`Location updated: ${FLOW_LOCATION_ID}`);
    console.log(`Grading system changed to: ${numericGradingSystem.name}`);
    console.log(`Boulder problems converted: ${totalUpdated}`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
