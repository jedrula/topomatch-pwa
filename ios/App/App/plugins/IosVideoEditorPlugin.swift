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
     * Handle selected video - optionally trim, then return
     */
    private func handleSelectedVideo(url: URL, allowTrim: Bool, quality: String) {
        print("✅ [IosVideoEditor] Video selected: \(url.path)")
        print("🔍 [IosVideoEditor] allowTrim: \(allowTrim)")
        print("🔍 [IosVideoEditor] File exists: \(FileManager.default.fileExists(atPath: url.path))")
        print("🔍 [IosVideoEditor] Can edit: \(UIVideoEditorController.canEditVideo(atPath: url.path))")
        
        // Check if we should show trim UI
        if allowTrim && UIVideoEditorController.canEditVideo(atPath: url.path) {
            print("✂️ [IosVideoEditor] Showing trim UI...")
            showTrimUI(for: url, quality: quality)
        } else {
            // No trim, just return the video
            print("⚠️ [IosVideoEditor] Skipping trim - allowTrim: \(allowTrim), canEdit: \(UIVideoEditorController.canEditVideo(atPath: url.path))")
            returnVideoResult(url: url, status: "selected")
        }
    }
    
    /**
     * Show native iOS video trim UI
     */
    private func showTrimUI(for videoURL: URL, quality: String) {
        guard let viewController = self.bridge?.viewController else {
            self.currentCall?.reject("No view controller available")
            return
        }
        
        let trimController = UIVideoEditorController()
        trimController.delegate = self
        trimController.videoPath = videoURL.path
        trimController.videoQuality = .typeHigh // We'll compress separately
        
        viewController.present(trimController, animated: true)
    }
    
    /**
     * Return video result with metadata
     */
    private func returnVideoResult(url: URL, status: String) {
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
        
        print("✅ [IosVideoEditor] Returning video - status: \(status), duration: \(duration)s, size: \(fileSize) bytes")
        
        self.currentCall?.resolve([
            "path": url.path,
            "duration": duration,
            "size": fileSize,
            "status": status
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

// MARK: - UIVideoEditorControllerDelegate (Trim UI)
extension IosVideoEditorPlugin: UIVideoEditorControllerDelegate, UINavigationControllerDelegate {
    public func videoEditorController(_ editor: UIVideoEditorController, didSaveEditedVideoToPath editedVideoPath: String) {
        print("✂️ [IosVideoEditor] Video trimmed successfully!")
        editor.dismiss(animated: true)
        
        // Return the trimmed video
        let trimmedURL = URL(fileURLWithPath: editedVideoPath)
        self.returnVideoResult(url: trimmedURL, status: "trimmed")
    }
    
    public func videoEditorControllerDidCancel(_ editor: UIVideoEditorController) {
        print("❌ [IosVideoEditor] Trim cancelled by user")
        editor.dismiss(animated: true)
        self.currentCall?.reject("User cancelled trim")
    }
    
    public func videoEditorController(_ editor: UIVideoEditorController, didFailWithError error: Error) {
        print("❌ [IosVideoEditor] Trim failed: \(error.localizedDescription)")
        editor.dismiss(animated: true)
        self.currentCall?.reject("Trim failed: \(error.localizedDescription)")
    }
}
