import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        // Register inline plugins here
        bridge?.registerPluginInstance(IosPoseDetectionPlugin())
        bridge?.registerPluginInstance(IosImageMatchingPlugin())
        
        print("✅ MyViewController: Registered IosPoseDetectionPlugin")
        print("✅ MyViewController: Registered IosImageMatchingPlugin")
    }
}
