import Foundation
import Capacitor

/**
 * iOS Pose Detection Plugin - Swift Implementation
 * Step 1: Echo test to verify Capacitor bridge works
 * 
 * NOTE: Inline plugins require CAPBridgedPlugin + manual registration in ViewController
 */
@objc(IosPoseDetection)
public class IosPoseDetectionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosPoseDetectionPlugin"
    public let jsName = "IosPoseDetection"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "processImage", returnType: CAPPluginReturnPromise)
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
}
