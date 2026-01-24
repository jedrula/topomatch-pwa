import Foundation
import Capacitor
import Vision

/**
 * iOS Pose Detection Plugin - Swift Implementation
 * Uses Vision Framework for native pose detection on iOS
 * 
 * NOTE: Inline plugins require CAPBridgedPlugin + manual registration in ViewController
 */
@objc(IosPoseDetection)
public class IosPoseDetectionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosPoseDetectionPlugin"
    public let jsName = "IosPoseDetection"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processImage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detectPose", returnType: CAPPluginReturnPromise)
    ]
    
    override public func load() {
        print("✅ IosPoseDetectionPlugin loaded successfully")
    }
    
    /**
     * Echo test method - verifies plugin communication
     */
    @objc func echo(_ call: CAPPluginCall) {
        let message = call.getString("message") ?? "No message provided"
        print("📱 iOS Native: echo called with: \(message)")
        
        call.resolve([
            "message": "iOS native echo: \(message)"
        ])
    }
    
    /**
     * Step 2: Process image data
     * Accepts base64 image, converts to UIImage, returns dimensions
     */
    @objc func processImage(_ call: CAPPluginCall) {
        guard let base64String = call.getString("imageData") else {
            call.reject("Missing imageData parameter")
            return
        }
        
        print("📸 iOS Native: processImage called, data length: \(base64String.count)")
        
        // Convert base64 to UIImage
        guard let imageData = Data(base64Encoded: base64String),
              let image = UIImage(data: imageData) else {
            call.reject("Failed to decode image from base64")
            return
        }
        
        let width = Int(image.size.width)
        let height = Int(image.size.height)
        
        print("✅ Image decoded: \(width)x\(height)")
        
        call.resolve([
            "width": width,
            "height": height,
            "success": true
        ])
    }
    
    /**
     * Step 3: Detect pose using Vision Framework
     * Accepts base64 image, runs Vision pose detection, returns raw keypoints
     */
    @objc func detectPose(_ call: CAPPluginCall) {
        guard let base64String = call.getString("imageData") else {
            call.reject("Missing imageData parameter")
            return
        }
        
        print("🧍 iOS Native: detectPose called, data length: \(base64String.count)")
        
        // Convert base64 to UIImage
        guard let imageData = Data(base64Encoded: base64String),
              let image = UIImage(data: imageData),
              let cgImage = image.cgImage else {
            call.reject("Failed to decode image from base64")
            return
        }
        
        // Run Vision detection on background thread
        DispatchQueue.global(qos: .userInitiated).async {
            let request = VNDetectHumanBodyPoseRequest()
            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            
            do {
                try handler.perform([request])
                
                guard let observation = request.results?.first else {
                    call.reject("No person detected in image")
                    return
                }
                
                // Extract recognized points
                let recognizedPoints = try observation.recognizedPoints(.all)
                
                // Convert Vision points to dictionary
                var keypoints: [[String: Any]] = []
                for (jointName, point) in recognizedPoints {
                    if point.confidence > 0.1 { // Filter low-confidence points
                        keypoints.append([
                            "name": jointName.rawValue,
                            "x": Double(point.location.x),
                            "y": Double(point.location.y),
                            "confidence": Double(point.confidence)
                        ])
                    }
                }
                
                print("✅ Pose detected: \(keypoints.count) keypoints")
                
                call.resolve([
                    "keypoints": keypoints,
                    "success": true
                ])
            } catch {
                call.reject("Vision detection failed: \(error.localizedDescription)")
            }
        }
    }
}
