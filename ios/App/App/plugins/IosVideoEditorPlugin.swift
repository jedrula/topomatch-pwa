import Foundation
import Capacitor
import UIKit
import AVFoundation
import PhotosUI
import Photos

/**
 * iOS native video editor plugin - Modern implementation
 * 
 * Uses PHAsset + AVPlayer for instant video preview (no 60s file copy wait)
 * Custom trim UI with direct asset access
 * Single export operation (trim + compress together)
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
    
    // Store selected asset
    private var selectedAsset: PHAsset?
    
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
        
        print("📹 [IosVideoEditor] Video selected, fetching PHAsset...")
        
        // Get the PHAsset identifier (instant, no file copy!)
        guard let assetIdentifier = result.assetIdentifier else {
            self.currentCall?.reject("Could not get asset identifier")
            return
        }
        
        // Fetch the PHAsset using the identifier
        let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [assetIdentifier], options: nil)
        guard let asset = fetchResult.firstObject else {
            self.currentCall?.reject("Could not fetch asset")
            return
        }
        
        self.selectedAsset = asset
        print("✅ [IosVideoEditor] Got PHAsset - Duration: \(asset.duration)s")
        
        // Get video options
        let allowTrim = self.currentCall?.getBool("allowTrim") ?? true
        let quality = self.currentCall?.getString("quality") ?? "medium"
        
        // Request AVAsset (fast, streams from Photos library)
        let options = PHVideoRequestOptions()
        options.version = .current
        options.deliveryMode = .highQualityFormat
        options.isNetworkAccessAllowed = true // Allow iCloud downloads if needed
        
        print("📥 [IosVideoEditor] Requesting AVAsset from PHImageManager...")
        let requestStart = Date()
        
        PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { [weak self] avAsset, audioMix, info in
            let elapsed = Date().timeIntervalSince(requestStart)
            print("⏱️ [IosVideoEditor] AVAsset request took \(String(format: "%.1f", elapsed))s")
            
            guard let avAsset = avAsset else {
                self?.currentCall?.reject("Could not load video asset")
                return
            }
            
            // For now (Phase 1), just export without trim to test the new flow
            // Phase 2 will add trim UI here
            print("✅ [IosVideoEditor] Got AVAsset, will export without trim (Phase 1)")
            
            DispatchQueue.main.async {
                self?.exportVideo(asset: avAsset, quality: quality)
            }
        }
    }
    
    /**
     * Export video with compression (Phase 1: no trim yet)
     */
    private func exportVideo(asset: AVAsset, quality: String) {
        print("🎬 [IosVideoEditor] Starting export with quality: \(quality)")
        
        // Determine preset based on quality setting
        let presetName: String
        switch quality {
        case "low":
            presetName = AVAssetExportPreset640x480
        case "high":
            presetName = AVAssetExportPresetHighestQuality
        default: // "medium" - 720p is sweet spot for climbing videos (good quality, <150MB)
            presetName = AVAssetExportPreset1280x720
        }
        
        guard let exportSession = AVAssetExportSession(asset: asset, presetName: presetName) else {
            self.currentCall?.reject("Could not create export session")
            return
        }
        
        // Output to temp file
        let tempDir = FileManager.default.temporaryDirectory
        let outputURL = tempDir.appendingPathComponent(UUID().uuidString + ".mov")
        
        exportSession.outputURL = outputURL
        exportSession.outputFileType = .mov
        exportSession.shouldOptimizeForNetworkUse = true
        
        print("📤 [IosVideoEditor] Exporting to: \(outputURL.path)")
        let exportStart = Date()
        
        exportSession.exportAsynchronously {
            let elapsed = Date().timeIntervalSince(exportStart)
            
            switch exportSession.status {
            case .completed:
                print("✅ [IosVideoEditor] Export completed in \(String(format: "%.1f", elapsed))s")
                self.returnVideoResult(url: outputURL, status: "compressed")
                
            case .failed:
                print("❌ [IosVideoEditor] Export failed: \(exportSession.error?.localizedDescription ?? "unknown")")
                self.currentCall?.reject("Export failed: \(exportSession.error?.localizedDescription ?? "unknown")")
                
            case .cancelled:
                print("⚠️ [IosVideoEditor] Export cancelled")
                self.currentCall?.reject("Export cancelled")
                
            default:
                print("⚠️ [IosVideoEditor] Export ended with status: \(exportSession.status.rawValue)")
                self.currentCall?.reject("Export failed")
            }
        }
    }
}