import SwiftUI
import AVFoundation

// MARK: - Video Trimmer View
struct VideoTrimmerView: View {
    let asset: AVAsset
    let player: AVPlayer?
    @Binding var startTime: CMTime
    @Binding var endTime: CMTime
    @Binding var currentPlayheadTime: CMTime
    
    @State private var thumbnails: [UIImage] = []
    @State private var isDraggingStart = false
    @State private var isDraggingEnd = false
    @State private var isDraggingPlayhead = false
    @State private var lastHapticTime: Double = 0 // Track last haptic feedback time
    
    private let trimmerHeight: CGFloat = 60
    private let handleWidth: CGFloat = 16
    private let cornerRadius: CGFloat = 8
    private let borderWidth: CGFloat = 3
    private let minTrimDuration: Double = 1.0 // Minimum 1 second trim
    private let hapticThreshold: Double = 0.5 // Only trigger haptic every 0.5s of video time change
    
    var body: some View {
        GeometryReader { geometry in
            let totalWidth = geometry.size.width
            let usableWidth = totalWidth - (handleWidth * 2)
            let duration = asset.duration.seconds
            
            ZStack(alignment: .leading) {
                // Thumbnail strip background
                thumbnailStrip(width: totalWidth, height: trimmerHeight)
                
                // Dimmed overlay for excluded regions
                HStack(spacing: 0) {
                    // Left dimmed region
                    Rectangle()
                        .fill(Color.black.opacity(0.6))
                        .frame(width: handleWidth + (startTime.seconds / duration) * usableWidth)
                    
                    Spacer()
                    
                    // Right dimmed region
                    Rectangle()
                        .fill(Color.black.opacity(0.6))
                        .frame(width: handleWidth + ((duration - endTime.seconds) / duration) * usableWidth)
                }
                .frame(height: trimmerHeight)
                
                // Trim selection frame
                trimFrame(geometry: geometry, duration: duration, usableWidth: usableWidth)
                
                // Playhead
                playhead(geometry: geometry, duration: duration, usableWidth: usableWidth)
            }
            .frame(height: trimmerHeight)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .contentShape(Rectangle())
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        let location = value.location
                        // Calculate time from touch position
                        let tappedPosition = location.x - handleWidth
                        let usableWidth = geometry.size.width - (handleWidth * 2)
                        let tappedTime = max(startTime.seconds, min((tappedPosition / usableWidth) * duration, endTime.seconds))
                        currentPlayheadTime = CMTime(seconds: tappedTime, preferredTimescale: 600)
                        player?.seek(to: currentPlayheadTime, toleranceBefore: .zero, toleranceAfter: .zero)
                    }
            )
            .onAppear {
                generateThumbnails(width: totalWidth)
                currentPlayheadTime = startTime
            }
        }
        .frame(height: trimmerHeight)
    }
    
    // MARK: - Thumbnail Strip
    @ViewBuilder
    private func thumbnailStrip(width: CGFloat, height: CGFloat) -> some View {
        HStack(spacing: 0) {
            ForEach(thumbnails.indices, id: \.self) { index in
                Image(uiImage: thumbnails[index])
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(width: width / CGFloat(max(thumbnails.count, 1)), height: height)
                    .clipped()
            }
        }
    }
    
    // MARK: - Trim Frame
    @ViewBuilder
    private func trimFrame(geometry: GeometryProxy, duration: Double, usableWidth: CGFloat) -> some View {
        let totalWidth = geometry.size.width
        let startOffset = handleWidth + (startTime.seconds / duration) * usableWidth
        let endOffset = handleWidth + (endTime.seconds / duration) * usableWidth
        let frameWidth = endOffset - startOffset + handleWidth * 2
        
        ZStack(alignment: .leading) {
            // Single continuous rounded rectangle border
            RoundedRectangle(cornerRadius: cornerRadius)
                .strokeBorder(Color.yellow, lineWidth: borderWidth)
                .frame(width: frameWidth, height: trimmerHeight)
            
            // Left handle
            trimHandle(isLeft: true)
                .gesture(
                    DragGesture()
                        .onChanged { value in
                            let wasNotDragging = !isDraggingStart
                            isDraggingStart = true
                            let handleStartX = startOffset - handleWidth
                            let newPosition = handleStartX + value.location.x
                            let newTime = max(0, min(newPosition / usableWidth * duration, endTime.seconds - minTrimDuration))
                            startTime = CMTime(seconds: newTime, preferredTimescale: 600)
                            currentPlayheadTime = startTime
                            player?.seek(to: startTime, toleranceBefore: .zero, toleranceAfter: .zero)
                            
                            // Throttled haptic feedback
                            if wasNotDragging || abs(newTime - lastHapticTime) >= hapticThreshold {
                                provideHapticFeedback()
                                lastHapticTime = newTime
                            }
                        }
                        .onEnded { _ in
                            isDraggingStart = false
                            lastHapticTime = 0 // Reset for next drag
                        }
                )
            
            // Right handle
            HStack {
                Spacer()
                trimHandle(isLeft: false)
                    .gesture(
                        DragGesture()
                            .onChanged { value in
                                let wasNotDragging = !isDraggingEnd
                                isDraggingEnd = true
                                let handleStartX = endOffset - handleWidth
                                let newPosition = handleStartX + value.location.x
                                let newTime = max(startTime.seconds + minTrimDuration, min(newPosition / usableWidth * duration, duration))
                                endTime = CMTime(seconds: newTime, preferredTimescale: 600)
                                currentPlayheadTime = endTime
                                player?.seek(to: endTime, toleranceBefore: .zero, toleranceAfter: .zero)
                                
                                // Throttled haptic feedback
                                if wasNotDragging || abs(newTime - lastHapticTime) >= hapticThreshold {
                                    provideHapticFeedback()
                                    lastHapticTime = newTime
                                }
                            }
                            .onEnded { _ in
                                isDraggingEnd = false
                                lastHapticTime = 0 // Reset for next drag
                            }
                    )
            }
            .frame(width: frameWidth)
        }
        .frame(width: frameWidth, height: trimmerHeight)
        .offset(x: startOffset - handleWidth)
    }
    
    // MARK: - Trim Handle
    @ViewBuilder
    private func trimHandle(isLeft: Bool) -> some View {
        ZStack {
            // Solid yellow fill for the handle area with rounded outer corners
            CustomUnevenRoundedRectangle(
                topLeadingRadius: isLeft ? cornerRadius : 0,
                bottomLeadingRadius: isLeft ? cornerRadius : 0,
                bottomTrailingRadius: isLeft ? 0 : cornerRadius,
                topTrailingRadius: isLeft ? 0 : cornerRadius
            )
            .fill(Color.yellow)
            .frame(width: handleWidth, height: trimmerHeight)
            
            // Chevron icon
            Image(systemName: isLeft ? "chevron.compact.left" : "chevron.compact.right")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.black)
                .scaleEffect(x: 1.0, y: 1.3)
        }
        .scaleEffect((isLeft ? isDraggingStart : isDraggingEnd) ? 1.05 : 1.0)
        .animation(.easeInOut(duration: 0.1), value: isLeft ? isDraggingStart : isDraggingEnd)
    }
    
    // MARK: - Playhead
    @ViewBuilder
    private func playhead(geometry: GeometryProxy, duration: Double, usableWidth: CGFloat) -> some View {
        let playheadPosition = handleWidth + (currentPlayheadTime.seconds / duration) * usableWidth
        
        ZStack {
            // Playhead line
            Rectangle()
                .fill(Color.white)
                .frame(width: 3, height: trimmerHeight + 16)
                .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 0)
            
            // Top knob
            Circle()
                .fill(Color.white)
                .frame(width: 10, height: 10)
                .offset(y: -(trimmerHeight / 2 + 8))
                .shadow(color: .black.opacity(0.3), radius: 2, x: 0, y: 0)
        }
        .offset(x: playheadPosition - 1.5)
        .gesture(
            DragGesture()
                .onChanged { value in
                    isDraggingPlayhead = true
                    let newPosition = value.location.x - handleWidth
                    let newTime = max(startTime.seconds, min((newPosition / usableWidth) * duration, endTime.seconds))
                    let time = CMTime(seconds: newTime, preferredTimescale: 600)
                    currentPlayheadTime = time
                    player?.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
                }
                .onEnded { _ in
                    isDraggingPlayhead = false
                }
        )
    }
    
    // MARK: - Thumbnail Generation
    private func generateThumbnails(width: CGFloat) {
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 100, height: trimmerHeight * UIScreen.main.scale)
        
        let thumbnailCount = Int(width / 50) // Approximately 50pt per thumbnail
        let duration = asset.duration.seconds
        let interval = duration / Double(thumbnailCount)
        
        var times: [NSValue] = []
        for i in 0..<thumbnailCount {
            let time = CMTime(seconds: Double(i) * interval, preferredTimescale: 600)
            times.append(NSValue(time: time))
        }
        
        // Use dictionary to preserve ordering by index
        var thumbnailsByIndex: [Int: UIImage] = [:]
        let lock = NSLock()
        
        generator.generateCGImagesAsynchronously(forTimes: times) { requestedTime, image, actualTime, result, error in
            guard let cgImage = image else { return }
            
            // Find the index of this thumbnail by matching requested time
            let requestedSeconds = CMTimeGetSeconds(requestedTime)
            let index = Int(round(requestedSeconds / interval))
            
            let uiImage = UIImage(cgImage: cgImage)
            
            DispatchQueue.main.async {
                lock.lock()
                thumbnailsByIndex[index] = uiImage
                
                // Once all thumbnails are generated, sort by index and assign
                if thumbnailsByIndex.count == thumbnailCount {
                    self.thumbnails = (0..<thumbnailCount).compactMap { thumbnailsByIndex[$0] }
                }
                lock.unlock()
            }
        }
    }
    
    // MARK: - Haptic Feedback
    private func provideHapticFeedback() {
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }
}

// MARK: - Uneven Rounded Rectangle Helper
struct CustomUnevenRoundedRectangle: Shape {
    var topLeadingRadius: CGFloat
    var bottomLeadingRadius: CGFloat
    var bottomTrailingRadius: CGFloat
    var topTrailingRadius: CGFloat
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        
        path.move(to: CGPoint(x: rect.minX + topLeadingRadius, y: rect.minY))
        path.addLine(to: CGPoint(x: rect.maxX - topTrailingRadius, y: rect.minY))
        path.addArc(center: CGPoint(x: rect.maxX - topTrailingRadius, y: rect.minY + topTrailingRadius),
                    radius: topTrailingRadius, startAngle: .degrees(-90), endAngle: .degrees(0), clockwise: false)
        path.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - bottomTrailingRadius))
        path.addArc(center: CGPoint(x: rect.maxX - bottomTrailingRadius, y: rect.maxY - bottomTrailingRadius),
                    radius: bottomTrailingRadius, startAngle: .degrees(0), endAngle: .degrees(90), clockwise: false)
        path.addLine(to: CGPoint(x: rect.minX + bottomLeadingRadius, y: rect.maxY))
        path.addArc(center: CGPoint(x: rect.minX + bottomLeadingRadius, y: rect.maxY - bottomLeadingRadius),
                    radius: bottomLeadingRadius, startAngle: .degrees(90), endAngle: .degrees(180), clockwise: false)
        path.addLine(to: CGPoint(x: rect.minX, y: rect.minY + topLeadingRadius))
        path.addArc(center: CGPoint(x: rect.minX + topLeadingRadius, y: rect.minY + topLeadingRadius),
                    radius: topLeadingRadius, startAngle: .degrees(180), endAngle: .degrees(270), clockwise: false)
        
        return path
    }
}
