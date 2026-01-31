import Foundation
import Capacitor
import UIKit
import AVFoundation
import AVKit
import PhotosUI
import Photos
import SwiftUI

/**
 * iOS native video editor plugin - Modern implementation
 * 
 * Uses PHAsset + AVPlayer for instant video preview (no 60s file copy wait)
 * SwiftUI VideoTrimmerView for native-style trim UI
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
            
            print("✅ [IosVideoEditor] Got AVAsset, showing trim UI (Phase 2)")
            
            DispatchQueue.main.async {
                self?.showTrimUI(asset: avAsset, allowTrim: allowTrim, quality: quality)
            }
        }
    }
    
    /**
     * Show custom trim UI with AVPlayer preview
     */
    private func showTrimUI(asset: AVAsset, allowTrim: Bool, quality: String) {
        guard let viewController = self.bridge?.viewController else {
            self.currentCall?.reject("No view controller available")
            return
        }
        
        let trimVC = VideoTrimViewController(asset: asset)
        
        // Handle save
        trimVC.onSave = { [weak self] startTime, endTime in
            print("✂️ [IosVideoEditor] Trim saved - Start: \(CMTimeGetSeconds(startTime))s, End: \(CMTimeGetSeconds(endTime))s")
            trimVC.dismiss(animated: true) {
                self?.exportVideo(asset: asset, quality: quality, startTime: startTime, endTime: endTime)
            }
        }
        
        // Handle cancel
        trimVC.onCancel = { [weak self] in
            print("❌ [IosVideoEditor] Trim cancelled by user")
            trimVC.dismiss(animated: true) {
                self?.currentCall?.reject("User cancelled trim")
            }
        }
        
        trimVC.modalPresentationStyle = .fullScreen
        viewController.present(trimVC, animated: true)
    }
    
    /**
     * Export video with compression and optional time range trim
     */
    /**
     * Export video with compression and optional time range trim
     */
    private func exportVideo(asset: AVAsset, quality: String, startTime: CMTime? = nil, endTime: CMTime? = nil) {
        let trimStart = startTime ?? .zero
        let trimEnd = endTime ?? asset.duration
        let trimDuration = CMTimeGetSeconds(trimEnd) - CMTimeGetSeconds(trimStart)
        
        print("🎬 [IosVideoEditor] Starting export with quality: \(quality)")
        print("✂️ [IosVideoEditor] Trim range: \(String(format: "%.1f", CMTimeGetSeconds(trimStart)))s - \(String(format: "%.1f", CMTimeGetSeconds(trimEnd)))s (duration: \(String(format: "%.1f", trimDuration))s)")
        
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
        
        // Set trim time range if provided
        let timeRange = CMTimeRange(start: trimStart, end: trimEnd)
        exportSession.timeRange = timeRange
        
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

// MARK: - Video Trim UI with SwiftUI
class VideoTrimViewController: UIViewController {
    // Video asset and player
    private var avAsset: AVAsset?
    
    // Trim range (will be bound to SwiftUI)
    private var startTime: CMTime = .zero
    private var endTime: CMTime = .zero
    
    // SwiftUI hosting controller
    private var trimmerHostingController: UIHostingController<VideoTrimmerWrapper>?
    
    // UI Elements
    private let saveButton = UIButton(type: .system)
    private let cancelButton = UIButton(type: .system)

    
    // Callbacks
    var onSave: ((CMTime, CMTime) -> Void)?
    var onCancel: (() -> Void)?
    
    init(asset: AVAsset) {
        self.avAsset = asset
        super.init(nibName: nil, bundle: nil)
        
        // Initialize times
        self.endTime = asset.duration
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        
        setupUI()
    }
    
    private func setupUI() {
        guard let avAsset = avAsset else { return }
        
        // Create SwiftUI trimmer view
        let trimmerWrapper = VideoTrimmerWrapper(
            asset: avAsset,
            initialStartTime: .zero,
            initialEndTime: avAsset.duration,
            onSave: { [weak self] start, end in
                self?.onSave?(start, end)
            },
            onCancel: { [weak self] in
                self?.onCancel?()
            }
        )
        
        let hostingController = UIHostingController(rootView: trimmerWrapper)
        trimmerHostingController = hostingController
        
        addChild(hostingController)
        view.addSubview(hostingController.view)
        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        hostingController.didMove(toParent: self)
        
        NSLayoutConstraint.activate([
            hostingController.view.topAnchor.constraint(equalTo: view.topAnchor),
            hostingController.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            hostingController.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            hostingController.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
}

// MARK: - SwiftUI Wrapper for Trim UI
struct VideoTrimmerWrapper: View {
    let asset: AVAsset
    let onSave: (CMTime, CMTime) -> Void
    let onCancel: () -> Void
    
    @State private var startTime: CMTime
    @State private var endTime: CMTime
    @State private var currentPlayheadTime: CMTime = .zero
    @State private var player: AVPlayer?
    @State private var isPlaying = false
    @State private var timeObserver: Any?
    
    init(asset: AVAsset, initialStartTime: CMTime, initialEndTime: CMTime, onSave: @escaping (CMTime, CMTime) -> Void, onCancel: @escaping () -> Void) {
        self.asset = asset
        self.onSave = onSave
        self.onCancel = onCancel
        _startTime = State(initialValue: initialStartTime)
        _endTime = State(initialValue: initialEndTime)
    }
    
    var body: some View {
        VStack(spacing: 40) {
            Spacer()
            
            // Video preview
            if let player = player {
                VideoPlayer(player: player)
                    .frame(height: 300)
                    .cornerRadius(12)
                    .padding(.horizontal, 20)
            }
            
            // Play/Pause button
            Button(action: togglePlayback) {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 50))
                    .foregroundColor(.white)
            }
            
            // Trimmer
            VideoTrimmerView(
                asset: asset,
                player: player,
                startTime: $startTime,
                endTime: $endTime,
                currentPlayheadTime: $currentPlayheadTime
            )
            .padding(.horizontal, 16)
            
            // Time labels
            HStack {
                Text(formatTime(startTime.seconds))
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
                Text("Duration: \(formatTime(endTime.seconds - startTime.seconds))")
                    .font(.caption)
                    .foregroundColor(.yellow)
                Spacer()
                Text(formatTime(endTime.seconds))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            // Action buttons
            HStack(spacing: 60) {
                Button("✕ Cancel") {
                    onCancel()
                }
                .foregroundColor(.white)
                .font(.system(size: 18))
                
                Button("✓ Save") {
                    onSave(startTime, endTime)
                }
                .foregroundColor(.green)
                .font(.system(size: 18, weight: .bold))
            }
            .padding(.bottom, 40)
        }
        .background(Color.black.edgesIgnoringSafeArea(.all))
        .onAppear {
            let playerItem = AVPlayerItem(asset: asset)
            player = AVPlayer(playerItem: playerItem)
            currentPlayheadTime = startTime
            
            // Add periodic time observer to update playhead during playback
            let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
            timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [self] time in
                if isPlaying {
                    currentPlayheadTime = time
                    // Loop within trim range
                    if time >= endTime {
                        player?.seek(to: startTime)
                    }
                }
            }
        }
        .onDisappear {
            player?.pause()
            if let observer = timeObserver {
                player?.removeTimeObserver(observer)
            }
        }
    }
    
    private func togglePlayback() {
        guard let player = player else { return }
        if isPlaying {
            player.pause()
        } else {
            player.seek(to: startTime)
            player.play()
        }
        isPlaying.toggle()
    }
    
    private func formatTime(_ seconds: Double) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        let ms = Int((seconds.truncatingRemainder(dividingBy: 1)) * 10)
        return String(format: "%d:%02d.%d", mins, secs, ms)
    }
}
