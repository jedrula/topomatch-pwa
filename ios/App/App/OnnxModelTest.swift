// Copyright (c) 2026. Test to verify ONNX Runtime works on iOS.

import Foundation
import UIKit
import OnnxRuntimeBindings

/// Result of ONNX model test
struct OnnxModelTestResult {
    let success: Bool
    let message: String
    let loadTimeMs: Double?
    let inferenceTimeMs: Double?
    let outputShape: [Int]?
}

/// Tests the SuperPoint+LightGlue ONNX model on iOS
class OnnxModelTester {
    
    /**
     * Runs a complete test of the ONNX model:
     * - Load model from bundle
     * - Create dummy input (two 256x256 grayscale images as Float32)
     * - Run inference
     * - Validate output
     */
    static func testModel() -> OnnxModelTestResult {
        print("🧪 [OnnxModelTest] Starting ONNX model validation...")
        
        do {
            // Step 1: Find model in bundle
            guard let modelPath = Bundle.main.path(forResource: "superpoint_lightglue_pipeline.ort", ofType: "onnx") else {
                return OnnxModelTestResult(
                    success: false,
                    message: "❌ Model file not found in bundle. Expected: superpoint_lightglue_pipeline.ort.onnx",
                    loadTimeMs: nil,
                    inferenceTimeMs: nil,
                    outputShape: nil
                )
            }
            
            print("✅ [OnnxModelTest] Found model at: \(modelPath)")
            
            // Step 2: Create ORT environment
            let loadStartTime = CFAbsoluteTimeGetCurrent()
            let env = try ORTEnv(loggingLevel: ORTLoggingLevel.warning)
            
            // Step 3: Create session with model
            let session = try ORTSession(env: env, modelPath: modelPath, sessionOptions: nil)
            let loadEndTime = CFAbsoluteTimeGetCurrent()
            let loadTimeMs = (loadEndTime - loadStartTime) * 1000
            
            print("✅ [OnnxModelTest] Model loaded in \(String(format: "%.2f", loadTimeMs))ms")
            
            // Step 4: Get input/output names
            let inputNames = try session.inputNames()
            let outputNames = try session.outputNames()
            print("📥 [OnnxModelTest] Input names: \(inputNames)")
            print("📤 [OnnxModelTest] Output names: \(outputNames)")
            
            // Step 5: Load real test images and convert to grayscale 256x256
            guard let image1 = loadAndPrepareImage(filename: "test-image-1.jpg"),
                  let image2 = loadAndPrepareImage(filename: "test-image-2.jpg") else {
                return OnnxModelTestResult(
                    success: false,
                    message: "❌ Failed to load test images. Make sure test-image-1.jpg and test-image-2.jpg are in bundle.",
                    loadTimeMs: loadTimeMs,
                    inferenceTimeMs: nil,
                    outputShape: nil
                )
            }
            
            print("✅ [OnnxModelTest] Loaded and preprocessed 2 real climbing gym images")
            
            // Stack the two images: [2, 1, 256, 256]
            var imagesData = image1 + image2
            let imagesNSData = NSMutableData(bytes: &imagesData, length: imagesData.count * MemoryLayout<Float>.size)
            
            let inputShape: [NSNumber] = [2, 1, 256, 256]
            let imagesTensor = try ORTValue(
                tensorData: imagesNSData,
                elementType: ORTTensorElementDataType.float,
                shape: inputShape
            )
            
            print("✅ [OnnxModelTest] Created input tensor with shape: \(inputShape)")
            
            // Step 6: Run inference
            let inferenceStartTime = CFAbsoluteTimeGetCurrent()
            let outputs = try session.run(
                withInputs: ["images": imagesTensor],
                outputNames: Set(outputNames),
                runOptions: nil
            )
            let inferenceEndTime = CFAbsoluteTimeGetCurrent()
            let inferenceTimeMs = (inferenceEndTime - inferenceStartTime) * 1000
            
            print("✅ [OnnxModelTest] Inference completed in \(String(format: "%.2f", inferenceTimeMs))ms")
            
            // Step 7: Analyze match quality
            guard let keypointsOutput = outputs["keypoints"],
                  let matchesOutput = outputs["matches"],
                  let mscoresOutput = outputs["mscores"] else {
                return OnnxModelTestResult(
                    success: false,
                    message: "❌ Missing expected outputs",
                    loadTimeMs: loadTimeMs,
                    inferenceTimeMs: inferenceTimeMs,
                    outputShape: nil
                )
            }
            
            let keypointsData = try keypointsOutput.tensorData() as Data
            let matchesData = try matchesOutput.tensorData() as Data
            let mscoresData = try mscoresOutput.tensorData() as Data
            
            let keypointsShape = try keypointsOutput.tensorTypeAndShapeInfo().shape.map { $0.intValue }
            let matchesShape = try matchesOutput.tensorTypeAndShapeInfo().shape.map { $0.intValue }
            let mscoresShape = try mscoresOutput.tensorTypeAndShapeInfo().shape.map { $0.intValue }
            
            print("📊 [OnnxModelTest] Output shapes:")
            print("   - keypoints: \(keypointsShape)")
            print("   - matches: \(matchesShape)")
            print("   - mscores: \(mscoresShape)")
            
            // Analyze match scores
            let mscoresArray = mscoresData.withUnsafeBytes { (buffer: UnsafeRawBufferPointer) -> [Float] in
                let floatBuffer = buffer.bindMemory(to: Float.self)
                return Array(floatBuffer)
            }
            
            // Count high-confidence matches (score > 0.5)
            let highConfidenceMatches = mscoresArray.filter { $0 > 0.5 }.count
            let mediumConfidenceMatches = mscoresArray.filter { $0 > 0.3 && $0 <= 0.5 }.count
            let avgScore = mscoresArray.reduce(0, +) / Float(mscoresArray.count)
            let maxScore = mscoresArray.max() ?? 0
            
            print("🎯 [OnnxModelTest] Match Quality Analysis:")
            print("   - Total possible matches: \(mscoresArray.count)")
            print("   - High confidence (>0.5): \(highConfidenceMatches)")
            print("   - Medium confidence (0.3-0.5): \(mediumConfidenceMatches)")
            print("   - Average score: \(String(format: "%.3f", avgScore))")
            print("   - Max score: \(String(format: "%.3f", maxScore))")
            
            let matchQuality = highConfidenceMatches > 10 ? "✅ GOOD MATCH" : (highConfidenceMatches > 0 ? "⚠️ WEAK MATCH" : "❌ NO MATCH")
            print("   - Overall: \(matchQuality)")
            
            // NEGATIVE TEST: Compare with completely different image
            print("\n🧪 [OnnxModelTest] Running negative test (should NOT match)...")
            
            guard let imageDifferent = loadAndPrepareImage(filename: "test-image-different.jpg") else {
                print("⚠️ Skipping negative test - image not found")
                return OnnxModelTestResult(
                    success: true,
                    message: "✅ Positive test passed! Load: \(String(format: "%.2f", loadTimeMs))ms, Inference: \(String(format: "%.2f", inferenceTimeMs))ms, Matches: \(highConfidenceMatches) high-conf",
                    loadTimeMs: loadTimeMs,
                    inferenceTimeMs: inferenceTimeMs,
                    outputShape: keypointsShape
                )
            }
            
            // Test image1 vs different image (should have very few matches)
            var negativeTestData = image1 + imageDifferent
            let negativeTestNSData = NSMutableData(bytes: &negativeTestData, length: negativeTestData.count * MemoryLayout<Float>.size)
            let negativeTestTensor = try ORTValue(
                tensorData: negativeTestNSData,
                elementType: ORTTensorElementDataType.float,
                shape: inputShape
            )
            
            let negativeStartTime = CFAbsoluteTimeGetCurrent()
            let negativeOutputs = try session.run(
                withInputs: ["images": negativeTestTensor],
                outputNames: Set(outputNames),
                runOptions: nil
            )
            let negativeEndTime = CFAbsoluteTimeGetCurrent()
            
            guard let negativeMscores = negativeOutputs["mscores"] else {
                print("⚠️ Failed to get negative test scores")
                return OnnxModelTestResult(
                    success: true,
                    message: "✅ Positive test passed! Matches: \(highConfidenceMatches) high-conf",
                    loadTimeMs: loadTimeMs,
                    inferenceTimeMs: inferenceTimeMs,
                    outputShape: keypointsShape
                )
            }
            
            let negativeMscoresData = try negativeMscores.tensorData() as Data
            let negativeMscoresArray = negativeMscoresData.withUnsafeBytes { (buffer: UnsafeRawBufferPointer) -> [Float] in
                let floatBuffer = buffer.bindMemory(to: Float.self)
                return Array(floatBuffer)
            }
            
            let negativeHighConf = negativeMscoresArray.filter { $0 > 0.5 }.count
            let negativeMediumConf = negativeMscoresArray.filter { $0 > 0.3 && $0 <= 0.5 }.count
            let negativeAvg = negativeMscoresArray.reduce(0, +) / Float(negativeMscoresArray.count)
            let negativeMax = negativeMscoresArray.max() ?? 0
            
            print("📊 [OnnxModelTest] Negative Test Results:")
            print("   - High confidence (>0.5): \(negativeHighConf)")
            print("   - Medium confidence (0.3-0.5): \(negativeMediumConf)")
            print("   - Average score: \(String(format: "%.3f", negativeAvg))")
            print("   - Max score: \(String(format: "%.3f", negativeMax))")
            
            let negativeQuality = negativeHighConf < 5 ? "✅ CORRECTLY REJECTED" : "⚠️ FALSE POSITIVE"
            print("   - Result: \(negativeQuality)")
            
            let summary = """
            ✅ Both tests passed!
            Positive (should match): \(highConfidenceMatches) matches
            Negative (should reject): \(negativeHighConf) matches
            Load: \(String(format: "%.0f", loadTimeMs))ms, Inference: \(String(format: "%.0f", inferenceTimeMs))ms
            """
            
            return OnnxModelTestResult(
                success: true,
                message: summary,
                loadTimeMs: loadTimeMs,
                inferenceTimeMs: inferenceTimeMs,
                outputShape: keypointsShape
            )
            
        } catch {
            return OnnxModelTestResult(
                success: false,
                message: "❌ Error: \(error.localizedDescription)",
                loadTimeMs: nil,
                inferenceTimeMs: nil,
                outputShape: nil
            )
        }
    }
    
    /// Load image from bundle, convert to grayscale, resize to 256x256, normalize to [0,1]
    private static func loadAndPrepareImage(filename: String) -> [Float]? {
        guard let image = UIImage(named: filename),
              let cgImage = image.cgImage else {
            print("❌ Failed to load image: \(filename)")
            return nil
        }
        
        let targetSize = 256
        
        // Create grayscale context
        let colorSpace = CGColorSpaceCreateDeviceGray()
        let context = CGContext(
            data: nil,
            width: targetSize,
            height: targetSize,
            bitsPerComponent: 8,
            bytesPerRow: targetSize,
            space: colorSpace,
            bitmapInfo: CGImageAlphaInfo.none.rawValue
        )
        
        guard let context = context else {
            print("❌ Failed to create graphics context")
            return nil
        }
        
        // Draw and resize image
        context.interpolationQuality = .high
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: targetSize, height: targetSize))
        
        guard let imageData = context.data else {
            print("❌ Failed to get image data")
            return nil
        }
        
        // Convert UInt8 grayscale pixels to normalized Float array [0, 1]
        let pixelCount = targetSize * targetSize
        var floatArray = [Float](repeating: 0, count: pixelCount)
        let uint8Ptr = imageData.bindMemory(to: UInt8.self, capacity: pixelCount)
        
        for i in 0..<pixelCount {
            floatArray[i] = Float(uint8Ptr[i]) / 255.0
        }
        
        return floatArray
    }
}
