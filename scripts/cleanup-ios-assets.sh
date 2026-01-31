#!/bin/bash

# Cleanup iOS Assets - Remove unnecessary ONNX models after Capacitor sync
# iOS uses native Vision Framework for pose detection, not YOLO models
# iOS has SuperPoint model manually added to Xcode project, not from public/

IOS_PUBLIC_DIR="ios/App/App/public"

if [ ! -d "$IOS_PUBLIC_DIR" ]; then
  echo "❌ iOS public directory not found: $IOS_PUBLIC_DIR"
  exit 1
fi

echo "🧹 Cleaning up iOS assets..."
echo "   Removing unnecessary ONNX models from $IOS_PUBLIC_DIR"

# Remove YOLO pose detection models (iOS doesn't use these)
YOLO_MODELS=(
  "yolo11m-pose.onnx"
  "yolo11s-pose.onnx"
  "yolo11n-pose.onnx"
  "yolov8n-pose.onnx"
  "yolov8n-pose.int8.onnx"
  "yolov8n-freeclimbs-detect-2-fp32.onnx"
  "modified-nms-yolov8-pose.onnx"
)

TOTAL_SAVED=0

for model in "${YOLO_MODELS[@]}"; do
  FILE="$IOS_PUBLIC_DIR/$model"
  if [ -f "$FILE" ]; then
    SIZE_HUMAN=$(du -h "$FILE" | cut -f1)
    SIZE_KB=$(du -k "$FILE" | cut -f1)
    rm "$FILE"
    echo "   ✓ Removed $model ($SIZE_HUMAN)"
    TOTAL_SAVED=$((TOTAL_SAVED + SIZE_KB))
  fi
done

# Remove duplicate SuperPoint model (iOS has it in App/ root, manually added to Xcode)
SUPERPOINT="$IOS_PUBLIC_DIR/superpoint_lightglue_pipeline.ort.onnx"
if [ -f "$SUPERPOINT" ]; then
  SIZE_HUMAN=$(du -h "$SUPERPOINT" | cut -f1)
  SIZE_KB=$(du -k "$SUPERPOINT" | cut -f1)
  rm "$SUPERPOINT"
  echo "   ✓ Removed superpoint_lightglue_pipeline.ort.onnx (duplicate, $SIZE_HUMAN)"
  TOTAL_SAVED=$((TOTAL_SAVED + SIZE_KB))
fi

# Convert KB to MB for display
TOTAL_SAVED_MB=$((TOTAL_SAVED / 1024))

echo "✅ iOS asset cleanup complete!"
echo "   Total space saved: ${TOTAL_SAVED_MB}MB"
