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

// MARK: - Video Trim UI
class VideoTrimViewController: UIViewController {
    // Video player
    private var player: AVPlayer?
    private var playerLayer: AVPlayerLayer?
    private var avAsset: AVAsset?
    
    // Trim range
    private var startTime: CMTime = .zero
    private var endTime: CMTime = .zero
    
    // UI Elements
    private let playerContainer = UIView()
    private let playPauseButton = UIButton(type: .system)
    private let trimSlider = UISlider()
    private let startTimeLabel = UILabel()
    private let endTimeLabel = UILabel()
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
        
        setupPlayer()
        setupUI()
    }
    
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        playerLayer?.frame = playerContainer.bounds
    }
    
    private func setupPlayer() {
        guard let avAsset = avAsset else { return }
        
        let playerItem = AVPlayerItem(asset: avAsset)
        player = AVPlayer(playerItem: playerItem)
        
        playerLayer = AVPlayerLayer(player: player)
        playerLayer?.videoGravity = .resizeAspect
        playerContainer.layer.addSublayer(playerLayer!)
    }
    
    private func setupUI() {
        // Player container
        playerContainer.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(playerContainer)
        
        // Play/Pause button
        playPauseButton.setTitle("▶️ Play", for: .normal)
        playPauseButton.titleLabel?.font = .systemFont(ofSize: 18, weight: .medium)
        playPauseButton.addTarget(self, action: #selector(playPauseTapped), for: .touchUpInside)
        playPauseButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(playPauseButton)
        
        // Time labels
        startTimeLabel.text = formatTime(startTime)
        startTimeLabel.textColor = .white
        startTimeLabel.font = .monospacedDigitSystemFont(ofSize: 14, weight: .regular)
        startTimeLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(startTimeLabel)
        
        endTimeLabel.text = formatTime(endTime)
        endTimeLabel.textColor = .white
        endTimeLabel.font = .monospacedDigitSystemFont(ofSize: 14, weight: .regular)
        endTimeLabel.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(endTimeLabel)
        
        // Trim slider (for now, simple position slider - will enhance with range selection later)
        trimSlider.minimumValue = 0
        trimSlider.maximumValue = Float(CMTimeGetSeconds(endTime))
        trimSlider.addTarget(self, action: #selector(sliderChanged), for: .valueChanged)
        trimSlider.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(trimSlider)
        
        // Save button
        saveButton.setTitle("✓ Save", for: .normal)
        saveButton.titleLabel?.font = .systemFont(ofSize: 18, weight: .bold)
        saveButton.backgroundColor = .systemGreen
        saveButton.layer.cornerRadius = 8
        saveButton.addTarget(self, action: #selector(saveTapped), for: .touchUpInside)
        saveButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(saveButton)
        
        // Cancel button
        cancelButton.setTitle("✕ Cancel", for: .normal)
        cancelButton.titleLabel?.font = .systemFont(ofSize: 18, weight: .medium)
        cancelButton.setTitleColor(.white, for: .normal)
        cancelButton.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        cancelButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(cancelButton)
        
        // Layout constraints
        NSLayoutConstraint.activate([
            // Player container (top half of screen)
            playerContainer.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            playerContainer.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            playerContainer.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            playerContainer.heightAnchor.constraint(equalTo: view.heightAnchor, multiplier: 0.5),
            
            // Play/Pause button
            playPauseButton.topAnchor.constraint(equalTo: playerContainer.bottomAnchor, constant: 20),
            playPauseButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            // Start time label
            startTimeLabel.topAnchor.constraint(equalTo: playPauseButton.bottomAnchor, constant: 20),
            startTimeLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            
            // End time label
            endTimeLabel.topAnchor.constraint(equalTo: playPauseButton.bottomAnchor, constant: 20),
            endTimeLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // Trim slider
            trimSlider.topAnchor.constraint(equalTo: startTimeLabel.bottomAnchor, constant: 10),
            trimSlider.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            trimSlider.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            
            // Cancel button
            cancelButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            cancelButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            cancelButton.widthAnchor.constraint(equalToConstant: 120),
            cancelButton.heightAnchor.constraint(equalToConstant: 50),
            
            // Save button
            saveButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            saveButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            saveButton.widthAnchor.constraint(equalToConstant: 120),
            saveButton.heightAnchor.constraint(equalToConstant: 50),
        ])
    }
    
    @objc private func playPauseTapped() {
        guard let player = player else { return }
        
        if player.rate > 0 {
            // Currently playing, pause it
            player.pause()
            playPauseButton.setTitle("▶️ Play", for: .normal)
        } else {
            // Currently paused, play it
            player.play()
            playPauseButton.setTitle("⏸ Pause", for: .normal)
        }
    }
    
    @objc private func sliderChanged() {
        let time = CMTime(seconds: Double(trimSlider.value), preferredTimescale: 600)
        player?.seek(to: time)
    }
    
    @objc private func saveTapped() {
        player?.pause()
        // For Phase 2.1: Save full video (trim UI is working, actual trim logic in Phase 2.2)
        onSave?(startTime, endTime)
    }
    
    @objc private func cancelTapped() {
        player?.pause()
        onCancel?()
    }
    
    private func formatTime(_ time: CMTime) -> String {
        let seconds = CMTimeGetSeconds(time)
        let mins = Int(seconds) / 60
        let secs = Int(seconds) % 60
        let fraction = Int((seconds.truncatingRemainder(dividingBy: 1)) * 10)
        return String(format: "%d:%02d.%d", mins, secs, fraction)
    }
    
    deinit {
        player?.pause()
        player = nil
    }
}
