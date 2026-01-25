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
    override func viewDidAppear(_ animated: Bool) {
      super.viewDidAppear(animated)
      
      // Test ONNX model once on launch
      DispatchQueue.global(qos: .userInitiated).async {
          let result = OnnxModelTester.testModel()
          print(result.message)
      }
  }
}
