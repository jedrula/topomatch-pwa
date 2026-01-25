# iOS ONNX Model Validation - Setup Instructions

## Goal
Validate that the SuperPoint+LightGlue ONNX model works on iOS **before** building any Capacitor bridge code.

## Current Status
- ✅ Model file exists: `public/superpoint_lightglue_pipeline.ort.onnx` (50.9 MB)
- ✅ Test code created: `ios/App/App/tests/OnnxModelTest.swift`
- ⏸️ Need to: Add ONNX Runtime + Copy model to bundle

## Step-by-Step Setup

### 1. Add ONNX Runtime to iOS Project

**Option A: Swift Package Manager (Recommended for this project)**

1. Open `ios/App/App.xcodeproj` in Xcode
2. Select the project in the navigator
3. Select the "App" target
4. Go to "General" tab → "Frameworks, Libraries, and Embedded Content"
5. Click the "+" button
6. Click "Add Other..." → "Add Package Dependency..."
7. Enter package URL: `https://github.com/microsoft/onnxruntime-swift-package-manager`
8. Select version: 1.19.0 or later
9. Add `onnxruntime` to the App target

**Option B: CocoaPods (Alternative)**

1. Create `ios/App/Podfile`:
```ruby
platform :ios, '13.0'

target 'App' do
  use_frameworks!
  pod 'onnxruntime-objc'
end
```

2. Run: `cd ios/App && pod install`
3. Use `App.xcworkspace` instead of `App.xcodeproj`

### 2. Copy Model to iOS Bundle

**Copy the ONNX model file:**

```bash
# From project root
cp public/superpoint_lightglue_pipeline.ort.onnx ios/App/App/
```

**Add to Xcode:**

1. In Xcode, right-click on the "App" folder
2. Select "Add Files to App..."
3. Navigate to `ios/App/App/superpoint_lightglue_pipeline.ort.onnx`
4. ✅ Check "Copy items if needed"
5. ✅ Check "Add to targets: App"
6. Click "Add"

**Verify:**
- File should appear in Xcode navigator under App folder
- Select the file → File Inspector → verify "Target Membership" includes "App"

### 3. Import ONNX Runtime in Test File

Once ONNX Runtime is added, uncomment the test code:

1. Open `ios/App/App/tests/OnnxModelTest.swift`
2. Add import at the top:
```swift
import onnxruntime_objc  // For SPM
// OR
import onnxruntime      // For CocoaPods
```
3. Uncomment the test implementation (lines marked with `// TODO:`)
4. Update input names if needed (check model with Netron)

### 4. Run Test on Real Device

**Add test call to MyViewController:**

```swift
// In MyViewController.swift, add after plugin registration:
override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    
    // Run ONNX model test once on app launch
    DispatchQueue.global(qos: .userInitiated).async {
        let result = OnnxModelTester.testModel()
        DispatchQueue.main.async {
            print(result.message)
            if !result.success {
                // Show alert to user
                let alert = UIAlertController(
                    title: "ONNX Model Test",
                    message: result.message,
                    preferredStyle: .alert
                )
                alert.addAction(UIAlertAction(title: "OK", style: .default))
                self.present(alert, animated: true)
            }
        }
    }
}
```

**Build and run:**

1. Connect iPhone via USB
2. Select your device as the build target
3. Product → Run (or Cmd+R)
4. Check Xcode console for test output

### Expected Output

```
🧪 [OnnxModelTest] Starting ONNX model validation...
✅ [OnnxModelTest] Found model at: /path/to/superpoint_lightglue_pipeline.ort.onnx
✅ [OnnxModelTest] Model loaded in 1234.56ms
📥 [OnnxModelTest] Input names: ["image0", "image1"]
📤 [OnnxModelTest] Output names: ["matches0", "matches1", "mscores0"]
✅ [OnnxModelTest] Created input tensors with shape: [1, 1, 256, 256]
✅ [OnnxModelTest] Inference completed in 567.89ms
✅ [OnnxModelTest] Output shape: [1, 256]
✅ [OnnxModelTest] All output names: ["matches0", "matches1", "mscores0"]
✅ Model works! Load: 1234.56ms, Inference: 567.89ms
```

## Troubleshooting

### Model not found in bundle
- Verify file is in Xcode project navigator
- Check "Copy Bundle Resources" build phase includes the .onnx file
- Clean build folder: Product → Clean Build Folder

### ONNX Runtime import errors
- Verify package/pod was installed correctly
- Check import statement matches your installation method
- Try clean build

### Inference fails or crashes
- Check Xcode console for detailed error messages
- Verify model input/output names (use Netron to inspect model)
- Try different input shapes if needed
- Check available memory (50MB model + inference memory)

### Performance issues
- First run is slower (model loading + compilation)
- Subsequent runs should be faster
- Consider CoreML execution provider for better performance

## Next Steps

Once this test passes:
- ✅ We know ONNX Runtime works on iOS
- ✅ We know the specific model works
- ✅ We know inference produces output
- 🚀 Safe to proceed with Capacitor plugin bridge

If this test fails:
- ❌ Stop immediately
- 🔍 Debug the model/runtime issue first
- 🔧 Fix before building any bridge code
