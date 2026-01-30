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
    SIZE=$(du -h "$FILE" | cut -f1)
    rm "$FILE"
    echo "   ✓ Removed $model ($SIZE)"
    TOTAL_SAVED=$((TOTAL_SAVED + $(du -k "$FILE" 2>/dev/null | cut -f1 || echo 0)))
  fi
done

# Remove duplicate SuperPoint model (iOS has it in App/ root, manually added to Xcode)
SUPERPOINT="$IOS_PUBLIC_DIR/superpoint_lightglue_pipeline.ort.onnx"
if [ -f "$SUPERPOINT" ]; then
  SIZE=$(du -h "$SUPERPOINT" | cut -f1)
  rm "$SUPERPOINT"
  echo "   ✓ Removed superpoint_lightglue_pipeline.ort.onnx (duplicate, $SIZE)"
fi

echo "✅ iOS asset cleanup complete!"
echo "   Approximate space saved: ~207MB"
