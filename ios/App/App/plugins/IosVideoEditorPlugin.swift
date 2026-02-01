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
     * Pick and edit a video
     * 
     * Options:
     * - source: "camera" | "photos" | "prompt" (default: "prompt")
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
        let quality = call.getString("quality") ?? "medium"
        
        print("📹 [IosVideoEditor] Starting video pick with source: \(source), quality: \(quality)")
        
        DispatchQueue.main.async {
            self.showVideoPicker(source: source, quality: quality)
        }
    }
    
    /**
     * Show iOS system video picker or camera
     */
    private func showVideoPicker(source: String, quality: String) {
        guard let viewController = self.bridge?.viewController else {
            self.currentCall?.reject("No view controller available")
            return
        }
        
        if source == "camera" {
            // Show camera for recording
            if UIImagePickerController.isSourceTypeAvailable(.camera) {
                let cameraPicker = UIImagePickerController()
                cameraPicker.sourceType = .camera
                cameraPicker.mediaTypes = ["public.movie"]
                cameraPicker.videoQuality = .typeHigh
                cameraPicker.delegate = self
                viewController.present(cameraPicker, animated: true)
            } else {
                self.currentCall?.reject("Camera not available")
            }
        } else {
            // Show photo library picker
            var config = PHPickerConfiguration(photoLibrary: .shared())
            config.filter = .videos // Only videos
            config.selectionLimit = 1
            
            let picker = PHPickerViewController(configuration: config)
            picker.delegate = self
            
            viewController.present(picker, animated: true)
        }
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
    
    /**
     * Show custom trim UI with AVPlayer preview
     */
    func showTrimUI(asset: AVAsset, quality: String) {
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
        let timeRange = CMTimeRangeFromTimeToTime(start: trimStart, end: trimEnd)
        exportSession.timeRange = timeRange
        
        // Output to temp file
        let tempDir = FileManager.default.temporaryDirectory
        let outputURL = tempDir.appendingPathComponent(UUID().uuidString + ".mov")
        
        exportSession.outputURL = outputURL
        exportSession.outputFileType = .mov
        exportSession.shouldOptimizeForNetworkUse = true
        
        print("📤 [IosVideoEditor] Exporting to: \(outputURL.path)")
        let exportStart = Date()
        
        // Show progress indicator
        DispatchQueue.main.async {
            self.showProgressOverlay(exportSession: exportSession)
        }
        
        exportSession.exportAsynchronously {
            let elapsed = Date().timeIntervalSince(exportStart)
            
            DispatchQueue.main.async {
                self.hideProgressOverlay()
            }
            
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
    
    // MARK: - Progress Overlay
    private func showProgressOverlay(exportSession: AVAssetExportSession) {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) else { return }
        
        let progressVC = ProgressViewController(exportSession: exportSession)
        progressVC.modalPresentationStyle = .overFullScreen
        progressVC.modalTransitionStyle = .crossDissolve
        
        window.rootViewController?.present(progressVC, animated: true)
    }
    
    private func hideProgressOverlay() {
        guard let window = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) else { return }
        window.rootViewController?.dismiss(animated: true)
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
        
        // Get quality setting
        let quality = self.currentCall?.getString("quality") ?? "medium"
        
        // Request AVAsset (fast, streams from Photos library)
        let options = PHVideoRequestOptions()
        options.version = .current
        options.deliveryMode = .highQualityFormat
        options.isNetworkAccessAllowed = true // Allow iCloud downloads if needed
        // TODO: Add options.progressHandler to show iCloud download progress if needed
        
        print("📥 [IosVideoEditor] Requesting AVAsset from PHImageManager...")
        let requestStart = Date()
        
        PHImageManager.default().requestAVAsset(forVideo: asset, options: options) { [weak self] avAsset, audioMix, info in
            let elapsed = Date().timeIntervalSince(requestStart)
            print("⏱️ [IosVideoEditor] AVAsset request took \(String(format: "%.1f", elapsed))s")
            
            // TODO: Could check info dict for PHImageResultIsDegradedKey, PHImageResultIsInCloudKey if iCloud issues arise
            
            guard let avAsset = avAsset else {
                self?.currentCall?.reject("Could not load video asset")
                return
            }
            
            print("✅ [IosVideoEditor] Got AVAsset, showing trim UI")
            
            DispatchQueue.main.async {
                self?.showTrimUI(asset: avAsset, quality: quality)
            }
        }
    }
}

// MARK: - UIImagePickerControllerDelegate (for camera recording)
extension IosVideoEditorPlugin: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    public func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
        picker.dismiss(animated: true)
        
        guard let videoURL = info[.mediaURL] as? URL else {
            self.currentCall?.reject("Could not get video URL")
            return
        }
        
        print("📹 [IosVideoEditor] Camera video recorded at: \(videoURL.path)")
        
        // Load AVAsset from the recorded video
        let avAsset = AVAsset(url: videoURL)
        
        // Get quality setting
        let quality = self.currentCall?.getString("quality") ?? "medium"
        
        print("✅ [IosVideoEditor] Got AVAsset from camera, showing trim UI")
        
        DispatchQueue.main.async {
            self.showTrimUI(asset: avAsset, quality: quality)
        }
    }
    
    public func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true)
        self.currentCall?.reject("Camera recording cancelled")
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
    @State private var playerRate: Float = 0.0 // Actual player rate (0 = paused, 1 = playing)
    @State private var timeObserver: Any?
    @State private var rateObserver: Any?
    
    init(asset: AVAsset, initialStartTime: CMTime, initialEndTime: CMTime, onSave: @escaping (CMTime, CMTime) -> Void, onCancel: @escaping () -> Void) {
        self.asset = asset
        self.onSave = onSave
        self.onCancel = onCancel
        _startTime = State(initialValue: initialStartTime)
        _endTime = State(initialValue: initialEndTime)
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Video preview - takes most of the screen
            if let player = player {
                VideoPlayer(player: player)
                    .cornerRadius(12)
                    .padding(.horizontal, 20)
                    .padding(.top, 60)
            }
            
            Spacer(minLength: 20)
            
            // Trimmer
            VideoTrimmerView(
                asset: asset,
                player: player,
                startTime: $startTime,
                endTime: $endTime,
                currentPlayheadTime: $currentPlayheadTime
            )
            .padding(.horizontal, 16)
            .padding(.top, 20)
            
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
            .padding(.top, 8)
            
            // Action buttons with play in the middle
            HStack(spacing: 40) {
                Button("Cancel") {
                    onCancel()
                }
                .foregroundColor(.white)
                .font(.system(size: 18))
                .frame(width: 80)
                
                // Play/Pause button
                Button(action: togglePlayback) {
                    Image(systemName: playerRate > 0 ? "pause.circle.fill" : "play.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(.white)
                }
                
                Button("Save") {
                    onSave(startTime, endTime)
                }
                .foregroundColor(.green)
                .font(.system(size: 18, weight: .bold))
                .frame(width: 80)
            }
            .padding(.top, 30)
            .padding(.bottom, 40)
        }
        .background(Color.black.edgesIgnoringSafeArea(.all))
        .onAppear {
            let playerItem = AVPlayerItem(asset: asset)
            player = AVPlayer(playerItem: playerItem)
            player?.isMuted = true  // Mute audio during preview
            currentPlayheadTime = startTime
            
            // Add periodic time observer to update playhead during playback
            let interval = CMTime(seconds: 0.05, preferredTimescale: 600)
            timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [self] time in
                if playerRate > 0 {  // Only update if actually playing
                    currentPlayheadTime = time
                    // Stop at end of trim range
                    if time >= endTime {
                        player?.pause()
                        currentPlayheadTime = endTime
                    }
                }
            }
            
            // Observe player rate changes for accurate play/pause state
            rateObserver = player?.observe(\.rate, options: [.new]) { [self] _, change in
                DispatchQueue.main.async {
                    playerRate = change.newValue ?? 0.0
                }
            }
        }
        .onDisappear {
            player?.pause()
            if let observer = timeObserver {
                player?.removeTimeObserver(observer)
            }
            if let observer = rateObserver as? NSKeyValueObservation {
                observer.invalidate()
            }
        }
    }
    
    private func togglePlayback() {
        guard let player = player else { return }
        if playerRate > 0 {
            // Currently playing, so pause
            player.pause()
        } else {
            // Currently paused, so play
            // If at the end, restart from the beginning
            if currentPlayheadTime >= endTime {
                currentPlayheadTime = startTime
                player.seek(to: startTime)
            } else {
                // Start from current playhead position
                player.seek(to: currentPlayheadTime)
            }
            player.play()
        }
        // No need to manually update state - rate observer handles it
    }
    
    private func formatTime(_ seconds: Double) -> String {
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        let ms = Int((seconds.truncatingRemainder(dividingBy: 1)) * 10)
        return String(format: "%d:%02d.%d", mins, secs, ms)
    }
}

// MARK: - Progress Overlay View Controller
class ProgressViewController: UIViewController {
    private let exportSession: AVAssetExportSession
    private var progressView: UIProgressView!
    private var progressLabel: UILabel!
    private var progressTimer: Timer?
    
    init(exportSession: AVAssetExportSession) {
        self.exportSession = exportSession
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) not implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        view.backgroundColor = UIColor.black.withAlphaComponent(0.8)
        
        // Create container
        let container = UIView()
        container.backgroundColor = UIColor.systemBackground
        container.layer.cornerRadius = 16
        container.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(container)
        
        // Create progress view
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(progressView)
        
        // Create label
        progressLabel = UILabel()
        progressLabel.text = "Compressing video... 0%"
        progressLabel.textAlignment = .center
        progressLabel.font = UIFont.systemFont(ofSize: 16, weight: .medium)
        progressLabel.translatesAutoresizingMaskIntoConstraints = false
        container.addSubview(progressLabel)
        
        NSLayoutConstraint.activate([
            container.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            container.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            container.widthAnchor.constraint(equalToConstant: 280),
            container.heightAnchor.constraint(equalToConstant: 120),
            
            progressLabel.topAnchor.constraint(equalTo: container.topAnchor, constant: 24),
            progressLabel.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            progressLabel.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20),
            
            progressView.topAnchor.constraint(equalTo: progressLabel.bottomAnchor, constant: 16),
            progressView.leadingAnchor.constraint(equalTo: container.leadingAnchor, constant: 20),
            progressView.trailingAnchor.constraint(equalTo: container.trailingAnchor, constant: -20)
        ])
        
        // Start updating progress
        progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            let progress = self.exportSession.progress
            self.progressView.progress = progress
            self.progressLabel.text = "Compressing video... \(Int(progress * 100))%"
        }
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        progressTimer?.invalidate()
        progressTimer = nil
    }
}
