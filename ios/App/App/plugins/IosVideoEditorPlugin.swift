import Foundation
import Capacitor
import UIKit
import AVFoundation
import PhotosUI

/**
 * iOS native video editor plugin
 * 
 * Features:
 * - Pick video from camera or photo library
 * - Trim video with system UI (optional)
 * - Compress video before upload
 */
@objc(IosVideoEditorPlugin)
public class IosVideoEditorPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IosVideoEditorPlugin"
    public let jsName = "IosVideoEditor"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickAndEditVideo", returnType: CAPPluginReturnPromise)
    ]
    
    // Store the call for async callbacks
    private var currentCall: CAPPluginCall?
    
    /**
     * Pick and optionally edit a video
     * 
     * Options:
     * - source: "camera" | "photos" | "prompt" (default: "prompt")
     * - allowTrim: boolean (default: true)
     * - quality: "low" | "medium" | "high" (default: "medium")
     * 
     * Returns:
     * - path: string (file path to processed video)
     * - duration: number (in seconds)
     * - size: number (in bytes)
     */
    @objc func pickAndEditVideo(_ call: CAPPluginCall) {
        self.currentCall = call
        
        // Get options
        let source = call.getString("source") ?? "prompt"
        let allowTrim = call.getBool("allowTrim") ?? true
        let quality = call.getString("quality") ?? "medium"
        
        print("📹 [IosVideoEditor] Starting video pick with source: \(source), trim: \(allowTrim), quality: \(quality)")
        
        DispatchQueue.main.async {
            self.showVideoPicker(source: source, allowTrim: allowTrim, quality: quality)
        }
    }
    
    /**
     * Show iOS system video picker
     */
    private func showVideoPicker(source: String, allowTrim: Bool, quality: String) {
        guard let viewController = self.bridge?.viewController else {
            self.currentCall?.reject("No view controller available")
            return
        }
        
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .videos // Only videos
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        
        viewController.present(picker, animated: true)
    }
    
    /**
     * Handle selected video - save to temp directory
     */
    private func handleSelectedVideo(url: URL, allowTrim: Bool, quality: String) {
        print("✅ [IosVideoEditor] Video selected: \(url.path)")
        
        // For iteration 1, just return the path
        // We'll add trim + compress in next iterations
        
        let asset = AVAsset(url: url)
        let duration = CMTimeGetSeconds(asset.duration)
        
        // Get file size
        let fileSize: Int64
        if let attributes = try? FileManager.default.attributesOfItem(atPath: url.path),
           let size = attributes[.size] as? NSNumber {
            fileSize = size.int64Value
        } else {
            fileSize = 0
        }
        
        // Return result
        self.currentCall?.resolve([
            "path": url.path,
            "duration": duration,
            "size": fileSize,
            "status": "selected" // Will be "trimmed", "compressed" in later iterations
        ])
    }
}

// MARK: - PHPickerViewControllerDelegate
extension IosVideoEditorPlugin: PHPickerViewControllerDelegate {
    public func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        
        guard let result = results.first else {
            self.currentCall?.reject("No video selected")
            return
        }
        
        // Load video file
        result.itemProvider.loadFileRepresentation(forTypeIdentifier: "public.movie") { url, error in
            if let error = error {
                self.currentCall?.reject("Failed to load video: \(error.localizedDescription)")
                return
            }
            
            guard let url = url else {
                self.currentCall?.reject("No video URL available")
                return
            }
            
            // Copy to temp directory (PHPicker gives us a temporary file)
            let tempDir = FileManager.default.temporaryDirectory
            let tempFile = tempDir.appendingPathComponent(UUID().uuidString + ".mov")
            
            do {
                try FileManager.default.copyItem(at: url, to: tempFile)
                
                let allowTrim = self.currentCall?.getBool("allowTrim") ?? true
                let quality = self.currentCall?.getString("quality") ?? "medium"
                
                DispatchQueue.main.async {
                    self.handleSelectedVideo(url: tempFile, allowTrim: allowTrim, quality: quality)
                }
            } catch {
                self.currentCall?.reject("Failed to copy video: \(error.localizedDescription)")
            }
        }
    }
}
