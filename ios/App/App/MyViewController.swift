import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        // Register inline plugins here
        bridge?.registerPluginInstance(IosPoseDetectionPlugin())
        
        print("✅ MyViewController: Registered IosPoseDetectionPlugin")
    }
}
