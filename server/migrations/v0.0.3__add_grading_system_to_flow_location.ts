/**
 * Migration: Add grading system to Flow location and convert boulder problems
 * Date: 2025-08-09
 *
 * This migration adds a V-Scale grading system to the Flow location (YIYwNAjQ0uycov4oGy7Z)
 * and converts all its boulder problems to use random grades from this system
 */

export async function migrate(firestore: any): Promise<void> {
  console.log("Starting migration: Add grading system to Flow location");

  try {
    const db = firestore.firestore;

    const FLOW_LOCATION_ID = "YIYwNAjQ0uycov4oGy7Z";

    // Define V-Scale grading system to match frontend structure
    const vScaleGradingSystem = {
      id: "v-scale",
      name: "V-Scale (Traditional Bouldering)",
      type: "preset",
      grades: [
        { value: 0, label: "VB", difficulty: 0 },
        { value: 1, label: "V0", difficulty: 1 },
        { value: 2, label: "V1", difficulty: 2 },
        { value: 3, label: "V2", difficulty: 3 },
        { value: 4, label: "V3", difficulty: 4 },
        { value: 5, label: "V4", difficulty: 5 },
        { value: 6, label: "V5", difficulty: 6 },
        { value: 7, label: "V6", difficulty: 7 },
        { value: 8, label: "V7", difficulty: 8 },
        { value: 9, label: "V8", difficulty: 9 },
        { value: 10, label: "V9", difficulty: 10 },
        { value: 11, label: "V10", difficulty: 11 },
        { value: 12, label: "V11", difficulty: 12 },
        { value: 13, label: "V12", difficulty: 13 },
        { value: 14, label: "V13", difficulty: 14 },
        { value: 15, label: "V14", difficulty: 15 },
        { value: 16, label: "V15", difficulty: 16 },
        { value: 17, label: "V16", difficulty: 17 },
        { value: 18, label: "V17", difficulty: 18 },
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

    // Add grading system to the location
    await locationRef.update({
      gradingSystem: vScaleGradingSystem,
      updatedAt: new Date(),
      migrationApplied: "v0.0.3__add_grading_system_to_flow_location",
    });

    console.log("✅ Added V-Scale grading system to Flow location");

    // Get all boulder problems for this location
    const boulderProblemsSnapshot = await locationRef.collection("boulderProblems").get();

    if (boulderProblemsSnapshot.empty) {
      console.log("No boulder problems found for Flow location.");
      return;
    }

    console.log(`Found ${boulderProblemsSnapshot.size} boulder problems to update`);

    // Helper function to get random grade from V-Scale system
    const getRandomVScaleGrade = (): { value: number; label: string; difficulty: number } => {
      // Favor easier grades (VB-V7) for more realistic distribution
      const weights = [
        3,
        3,
        3,
        2,
        2,
        2,
        2,
        1,
        1,
        1, // VB-V9: higher weight
        0.5,
        0.5,
        0.3,
        0.3,
        0.2,
        0.2,
        0.1,
        0.1,
        0.1, // V10-V17: lower weight
      ];

      const weightedGrades: Array<{ value: number; label: string; difficulty: number }> = [];
      vScaleGradingSystem.grades.forEach((grade, index) => {
        const weight = weights[index] || 0.1;
        for (let i = 0; i < weight * 10; i++) {
          weightedGrades.push(grade);
        }
      });

      return weightedGrades[Math.floor(Math.random() * weightedGrades.length)];
    };

    // Process boulder problems in batches
    const batch = db.batch();
    let batchCount = 0;
    let totalUpdated = 0;

    for (const problemDoc of boulderProblemsSnapshot.docs) {
      const problemData = problemDoc.data();
      const problemId = problemDoc.id;

      console.log(`  Processing boulder problem: ${problemData.name || problemId}`);

      // Assign a random V-Scale grade
      const randomGrade = getRandomVScaleGrade();

      // Update the boulder problem with the new grade
      const problemRef = locationRef.collection("boulderProblems").doc(problemId);

      batch.update(problemRef, {
        grade: randomGrade,
        gradingSystemId: vScaleGradingSystem.id,
        updatedAt: new Date(),
        migrationApplied: "v0.0.3__add_grading_system_to_flow_location",
      });

      console.log(`    Assigned grade: ${randomGrade.label} (${randomGrade.difficulty})`);

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
    console.log(`Grading system added: ${vScaleGradingSystem.name}`);
    console.log(`Boulder problems updated: ${totalUpdated}`);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
