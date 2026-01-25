import Foundation
import Capacitor
import UIKit
import OnnxRuntimeBindings

/**
 * iOS native image matching plugin using SuperPoint + LightGlue ONNX model
 * 
 * Accepts two images (base64), runs feature matching, returns keypoints and matches
 */
@objc(IosImageMatchingPlugin)
public class IosImageMatchingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosImageMatchingPlugin"
    public let jsName = "IosImageMatching"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "matchImages", returnType: CAPPluginReturnPromise)
    ]
    
    private var ortEnv: ORTEnv?
    private var ortSession: ORTSession?
    private let modelLoadQueue = DispatchQueue(label: "com.app.imagematching.modelload")
    
    /**
     * Initialize ONNX Runtime environment and load model
     * Called once on first use
     */
    private func ensureModelLoaded() throws {
        if ortSession != nil {
            return // Already loaded
        }
        
        print("🔧 [IosImageMatching] Loading ONNX model...")
        let startTime = CFAbsoluteTimeGetCurrent()
        
        guard let modelPath = Bundle.main.path(forResource: "superpoint_lightglue_pipeline.ort", ofType: "onnx") else {
            throw NSError(domain: "IosImageMatching", code: 1, userInfo: [
                NSLocalizedDescriptionKey: "Model file not found in bundle"
            ])
        }
        
        let env = try ORTEnv(loggingLevel: ORTLoggingLevel.warning)
        let session = try ORTSession(env: env, modelPath: modelPath, sessionOptions: nil)
        
        self.ortEnv = env
        self.ortSession = session
        
        let endTime = CFAbsoluteTimeGetCurrent()
        print("✅ [IosImageMatching] Model loaded in \(String(format: "%.2f", (endTime - startTime) * 1000))ms")
    }
    
    /**
     * Match two images using SuperPoint + LightGlue
     * 
     * @param image0Base64 - Base64 encoded first image (JPEG/PNG)
     * @param image1Base64 - Base64 encoded second image (JPEG/PNG)
     * @returns Object with keypoints, matches, and match scores
     */
    @objc func matchImages(_ call: CAPPluginCall) {
        let startTime = CFAbsoluteTimeGetCurrent()
        
        guard let image0Base64 = call.getString("image0"),
              let image1Base64 = call.getString("image1") else {
            call.reject("Missing image0 or image1 parameter")
            return
        }
        
        // Run on background thread to avoid blocking UI
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }
            
            do {
                // Ensure model is loaded
                try self.ensureModelLoaded()
                
                guard let session = self.ortSession else {
                    call.reject("Model not initialized")
                    return
                }
                
                // Decode base64 images
                guard let image0Data = Data(base64Encoded: image0Base64),
                      let image1Data = Data(base64Encoded: image1Base64),
                      let image0 = UIImage(data: image0Data),
                      let image1 = UIImage(data: image1Data) else {
                    call.reject("Failed to decode base64 images")
                    return
                }
                
                let preprocessStart = CFAbsoluteTimeGetCurrent()
                
                // Preprocess images (resize to 256x256 grayscale, normalize)
                guard let image0Processed = self.preprocessImage(image0),
                      let image1Processed = self.preprocessImage(image1) else {
                    call.reject("Failed to preprocess images")
                    return
                }
                
                // Stack images: [2, 1, 256, 256]
                var imagesData = image0Processed + image1Processed
                let imagesNSData = NSMutableData(bytes: &imagesData, length: imagesData.count * MemoryLayout<Float>.size)
                
                let inputShape: [NSNumber] = [2, 1, 256, 256]
                let imagesTensor = try ORTValue(
                    tensorData: imagesNSData,
                    elementType: ORTTensorElementDataType.float,
                    shape: inputShape
                )
                
                let preprocessEnd = CFAbsoluteTimeGetCurrent()
                let preprocessTime = (preprocessEnd - preprocessStart) * 1000
                
                // Run inference
                let inferenceStart = CFAbsoluteTimeGetCurrent()
                let outputs = try session.run(
                    withInputs: ["images": imagesTensor],
                    outputNames: ["keypoints", "matches", "mscores"],
                    runOptions: nil
                )
                let inferenceEnd = CFAbsoluteTimeGetCurrent()
                let inferenceTime = (inferenceEnd - inferenceStart) * 1000
                
                // Extract outputs
                guard let keypointsOutput = outputs["keypoints"],
                      let matchesOutput = outputs["matches"],
                      let mscoresOutput = outputs["mscores"] else {
                    call.reject("Missing model outputs")
                    return
                }
                
                let keypointsData = try keypointsOutput.tensorData() as Data
                let matchesData = try matchesOutput.tensorData() as Data
                let mscoresData = try mscoresOutput.tensorData() as Data
                
                let keypointsShape = try keypointsOutput.tensorTypeAndShapeInfo().shape.map { $0.intValue }
                let matchesShape = try matchesOutput.tensorTypeAndShapeInfo().shape.map { $0.intValue }
                
                // Convert to arrays
                let keypoints = self.dataToFloatArray(keypointsData)
                let matches = self.dataToInt32Array(matchesData)
                let mscores = self.dataToFloatArray(mscoresData)
                
                // Calculate match quality
                let highConfMatches = mscores.filter { $0 > 0.5 }.count
                let avgScore = mscores.reduce(0, +) / Float(max(mscores.count, 1))
                
                let totalTime = (CFAbsoluteTimeGetCurrent() - startTime) * 1000
                
                print("✅ [IosImageMatching] Success: \(highConfMatches) high-conf matches, avg score: \(String(format: "%.3f", avgScore))")
                print("⏱️ [IosImageMatching] Timing - Preprocess: \(String(format: "%.0f", preprocessTime))ms, Inference: \(String(format: "%.0f", inferenceTime))ms, Total: \(String(format: "%.0f", totalTime))ms")
                
                call.resolve([
                    "keypoints": keypoints,
                    "matches": matches,
                    "mscores": mscores,
                    "keypointsShape": keypointsShape,
                    "matchesShape": matchesShape,
                    "stats": [
                        "highConfidenceMatches": highConfMatches,
                        "averageScore": avgScore,
                        "preprocessTimeMs": preprocessTime,
                        "inferenceTimeMs": inferenceTime,
                        "totalTimeMs": totalTime
                    ]
                ])
                
            } catch {
                print("❌ [IosImageMatching] Error: \(error.localizedDescription)")
                call.reject("Image matching failed: \(error.localizedDescription)")
            }
        }
    }
    
    /// Preprocess image: convert to grayscale, resize to 256x256, normalize to [0,1]
    private func preprocessImage(_ image: UIImage) -> [Float]? {
        guard let cgImage = image.cgImage else {
            return nil
        }
        
        let targetSize = 256
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
            return nil
        }
        
        context.interpolationQuality = .high
        context.draw(cgImage, in: CGRect(x: 0, y: 0, width: targetSize, height: targetSize))
        
        guard let imageData = context.data else {
            return nil
        }
        
        let pixelCount = targetSize * targetSize
        var floatArray = [Float](repeating: 0, count: pixelCount)
        let uint8Ptr = imageData.bindMemory(to: UInt8.self, capacity: pixelCount)
        
        for i in 0..<pixelCount {
            floatArray[i] = Float(uint8Ptr[i]) / 255.0
        }
        
        return floatArray
    }
    
    /// Convert Data to Float array
    private func dataToFloatArray(_ data: Data) -> [Float] {
        return data.withUnsafeBytes { (buffer: UnsafeRawBufferPointer) -> [Float] in
            let floatBuffer = buffer.bindMemory(to: Float.self)
            return Array(floatBuffer)
        }
    }
    
    /// Convert Data to Int32 array
    private func dataToInt32Array(_ data: Data) -> [Int32] {
        return data.withUnsafeBytes { (buffer: UnsafeRawBufferPointer) -> [Int32] in
            let intBuffer = buffer.bindMemory(to: Int32.self)
            return Array(intBuffer)
        }
    }
}
