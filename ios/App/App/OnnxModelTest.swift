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
            
            // Step 5: Create dummy input tensor (two 256x256 grayscale images stacked)
            // Model expects: "images" with shape [2, 1, 256, 256] (batch of 2 images)
            let imageSize = 256
            let pixelCount = imageSize * imageSize
            let numImages = 2
            
            // Create two black square images (all zeros), stacked together
            var imagesData = [Float](repeating: 0.0, count: numImages * pixelCount)
            
            // Add a few white pixels to make it interesting (optional)
            for i in stride(from: 0, to: imagesData.count, by: 100) {
                imagesData[i] = 1.0
            }
            
            let imagesNSData = NSMutableData(bytes: &imagesData, length: imagesData.count * MemoryLayout<Float>.size)
            
            // Shape: [batch=2, channels=1, height=256, width=256]
            let inputShape: [NSNumber] = [numImages as NSNumber, 1, imageSize as NSNumber, imageSize as NSNumber]
            
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
            
            // Step 7: Validate outputs
            guard let firstOutput = outputs[outputNames[0]] else {
                return OnnxModelTestResult(
                    success: false,
                    message: "❌ No output returned from model",
                    loadTimeMs: loadTimeMs,
                    inferenceTimeMs: inferenceTimeMs,
                    outputShape: nil
                )
            }
            
            let outputTypeAndShape = try firstOutput.tensorTypeAndShapeInfo()
            let outputShape = outputTypeAndShape.shape.map { $0.intValue }
            
            print("✅ [OnnxModelTest] Output shape: \(outputShape)")
            print("✅ [OnnxModelTest] All output names: \(outputNames)")
            
            return OnnxModelTestResult(
                success: true,
                message: "✅ Model works! Load: \(String(format: "%.2f", loadTimeMs))ms, Inference: \(String(format: "%.2f", inferenceTimeMs))ms",
                loadTimeMs: loadTimeMs,
                inferenceTimeMs: inferenceTimeMs,
                outputShape: outputShape
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
}
