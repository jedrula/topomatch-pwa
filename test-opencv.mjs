// Test OpenCV.js matrix creation and homography
import cvReadyPromise from "@techstark/opencv-js";

async function testOpenCVHomography() {
  try {
    console.log("Loading OpenCV...");
    const cv = await cvReadyPromise;
    console.log("✅ OpenCV loaded successfully!");

    // Test basic Mat creation
    console.log("\n--- Testing Mat creation ---");
    console.log("cv.Mat type:", typeof cv.Mat);

    if (cv.Mat) {
      // Test basic matrix creation
      const testMat = new cv.Mat(3, 3, cv.CV_64F);
      console.log(`✅ Created ${testMat.rows}x${testMat.cols} matrix`);
      testMat.delete();

      // Test homography functions availability
      console.log("\n--- Testing homography functions ---");
      console.log("cv.findHomography available:", typeof cv.findHomography === "function");
      console.log(
        "cv.perspectiveTransform available:",
        typeof cv.perspectiveTransform === "function"
      );
      console.log("cv.RANSAC available:", typeof cv.RANSAC !== "undefined");

      // Test point matrix creation for homography
      console.log("\n--- Testing point matrix creation ---");

      // Sample matching points (4 points minimum for homography)
      const srcPoints = [
        [100, 200],
        [200, 150],
        [300, 250],
        [150, 300],
      ];

      const dstPoints = [
        [110, 210],
        [205, 145],
        [295, 255],
        [155, 295],
      ];

      // Method 1: Create matrices and fill manually
      const srcMat = new cv.Mat(srcPoints.length, 1, cv.CV_32FC2);
      const dstMat = new cv.Mat(dstPoints.length, 1, cv.CV_32FC2);

      // Fill the matrices
      for (let i = 0; i < srcPoints.length; i++) {
        srcMat.data32F[i * 2] = srcPoints[i][0];
        srcMat.data32F[i * 2 + 1] = srcPoints[i][1];
        dstMat.data32F[i * 2] = dstPoints[i][0];
        dstMat.data32F[i * 2 + 1] = dstPoints[i][1];
      }

      console.log(
        `✅ Created source matrix: ${srcMat.rows}x${srcMat.cols}, type: ${srcMat.type()}`
      );
      console.log(
        `✅ Created destination matrix: ${dstMat.rows}x${dstMat.cols}, type: ${dstMat.type()}`
      );

      // Test homography calculation
      if (cv.findHomography && cv.RANSAC) {
        console.log("\n--- Testing homography calculation ---");
        const mask = new cv.Mat();

        try {
          const homography = cv.findHomography(srcMat, dstMat, cv.RANSAC, 5.0, mask);
          console.log(`✅ Homography calculated: ${homography.rows}x${homography.cols}`);

          // Extract matrix values
          const matrixData = [];
          for (let i = 0; i < 9; i++) {
            matrixData.push(homography.data64F[i]);
          }
          console.log("Matrix values:", matrixData.map((v) => v.toFixed(6)).join(", "));

          // Test point transformation
          console.log("\n--- Testing point transformation ---");
          const testPoint = new cv.Mat(1, 1, cv.CV_64FC2);
          testPoint.data64F[0] = 150; // x
          testPoint.data64F[1] = 200; // y

          const transformedPoint = new cv.Mat();
          cv.perspectiveTransform(testPoint, transformedPoint, homography);

          console.log(
            `✅ Point (150, 200) -> (${transformedPoint.data64F[0].toFixed(
              2
            )}, ${transformedPoint.data64F[1].toFixed(2)})`
          );

          // Cleanup
          homography.delete();
          testPoint.delete();
          transformedPoint.delete();
        } catch (err) {
          console.error("❌ Homography calculation failed:", err.message);
        }

        mask.delete();
      }

      // Cleanup
      srcMat.delete();
      dstMat.delete();
    } else {
      console.error("❌ cv.Mat not available");
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error("Full error:", err);
  }
}

testOpenCVHomography();
