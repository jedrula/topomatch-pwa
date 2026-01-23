import Foundation
import Capacitor

/**
 * iOS Pose Detection Plugin - Swift Implementation
 * Step 1: Echo test to verify Capacitor bridge works
 */
@objc(IosPoseDetection)
public class IosPoseDetectionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosPoseDetection"
    public let jsName = "IosPoseDetection"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise)
    ]
    
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
}
