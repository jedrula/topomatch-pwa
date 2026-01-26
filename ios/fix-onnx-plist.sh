#!/bin/bash
# Fix ONNX Runtime frameworks missing MinimumOSVersion
# See: https://github.com/microsoft/onnxruntime-swift-package-manager/issues/16

set -e

echo "🔧 Fixing ONNX Runtime frameworks Info.plist..."

# Get the minimum iOS version from the project (default to 15.0)
MIN_OS_VERSION="${IPHONEOS_DEPLOYMENT_TARGET:-15.0}"

echo "  Using MinimumOSVersion: $MIN_OS_VERSION"

# Fix onnxruntime.framework
ONNX_PLIST="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/onnxruntime.framework/Info.plist"
if [ -f "$ONNX_PLIST" ]; then
  echo "  Patching onnxruntime.framework..."
  /usr/libexec/PlistBuddy -c "Delete :MinimumOSVersion" "$ONNX_PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :MinimumOSVersion string $MIN_OS_VERSION" "$ONNX_PLIST"
  echo "  ✅ onnxruntime.framework patched"
else
  echo "  ⚠️  onnxruntime.framework not found, skipping"
fi

# Fix onnxruntime_extensions.framework
ONNX_EXT_PLIST="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/onnxruntime_extensions.framework/Info.plist"
if [ -f "$ONNX_EXT_PLIST" ]; then
  echo "  Patching onnxruntime_extensions.framework..."
  /usr/libexec/PlistBuddy -c "Delete :MinimumOSVersion" "$ONNX_EXT_PLIST" 2>/dev/null || true
  /usr/libexec/PlistBuddy -c "Add :MinimumOSVersion string $MIN_OS_VERSION" "$ONNX_EXT_PLIST"
  echo "  ✅ onnxruntime_extensions.framework patched"
else
  echo "  ⚠️  onnxruntime_extensions.framework not found, skipping"
fi

echo "✅ ONNX Runtime frameworks fixed!"
