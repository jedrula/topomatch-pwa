#!/usr/bin/env python3
"""
INT8 Dynamic Quantization for ONNX models

Dynamic quantization quantizes weights to INT8 but keeps activations in FP32.
- No calibration dataset needed
- 3-4x size reduction
- 2-3x speed improvement
- Minimal accuracy loss (~1%)
- Should work with ONNX Runtime Web (unlike FP16)

Usage:
    python3 scripts/quantize-int8-dynamic.py [model_name]
    
Examples:
    python3 scripts/quantize-int8-dynamic.py yolov8n-pose  # Test with YOLOv8 first
    python3 scripts/quantize-int8-dynamic.py superpoint    # Then try SuperPoint
    python3 scripts/quantize-int8-dynamic.py all           # Both models
"""

import os
import sys
from pathlib import Path

try:
    import onnx
    from onnxruntime.quantization import quantize_dynamic, QuantType
except ImportError:
    print("❌ Missing dependencies. Installing...")
    print("Run: pip3 install onnx onnxruntime")
    sys.exit(1)


def quantize_model_int8_dynamic(input_path: str, output_path: str):
    """
    Quantize an ONNX model to INT8 using dynamic quantization.
    
    Dynamic quantization:
    - Quantizes weights to INT8 (static conversion)
    - Keeps activations in FP32 (dynamic per-inference)
    - No calibration data needed
    - Good balance of size/speed/accuracy
    """
    print(f"\n📦 Loading model: {input_path}")
    
    # Get original file size
    original_size = os.path.getsize(input_path) / (1024 * 1024)  # MB
    print(f"   Original size: {original_size:.2f} MB")
    
    # Verify model can be loaded
    try:
        model = onnx.load(input_path)
        print(f"   Model loaded successfully")
    except Exception as e:
        print(f"   ❌ Failed to load model: {e}")
        raise
    
    # Quantize with dynamic quantization
    print(f"   Converting FP32 → INT8 (dynamic)...")
    print(f"   - Weights: INT8 (static)")
    print(f"   - Activations: FP32 (dynamic)")
    print(f"   - Calibration: Not needed")
    
    try:
        quantize_dynamic(
            model_input=input_path,
            model_output=output_path,
            weight_type=QuantType.QUInt8,  # Quantize weights to unsigned INT8
            # Note: We're NOT quantizing activations (would need calibration)
        )
        print(f"   ✅ Quantization successful")
    except Exception as e:
        print(f"   ❌ Quantization failed: {e}")
        raise
    
    # Get new file size
    new_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
    reduction = ((original_size - new_size) / original_size) * 100
    
    print(f"   💾 New size: {new_size:.2f} MB")
    print(f"   📉 Saved: {original_size - new_size:.2f} MB ({reduction:.1f}% reduction)")
    
    return original_size, new_size


def main():
    # Parse arguments
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/quantize-int8-dynamic.py [model_name]")
        print("")
        print("Options:")
        print("  yolov8n-pose    - Quantize YOLOv8 pose model (recommended for testing)")
        print("  superpoint      - Quantize SuperPoint+LightGlue model")
        print("  all             - Quantize both models")
        print("")
        print("Example:")
        print("  python3 scripts/quantize-int8-dynamic.py yolov8n-pose")
        sys.exit(1)
    
    target = sys.argv[1].lower()
    
    # Get project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    public_dir = project_root / "public"
    
    print("🚀 ONNX Model Quantization: FP32 → INT8 (Dynamic)")
    print("=" * 60)
    
    # Define models
    models = []
    
    if target in ['yolov8n-pose', 'yolo', 'pose', 'all']:
        models.append({
            "name": "YOLOv8 Pose Detection",
            "input": "yolov8n-pose.onnx",
            "output": "yolov8n-pose.int8.onnx"
        })
    
    if target in ['superpoint', 'lightglue', 'matching', 'all']:
        models.append({
            "name": "SuperPoint + LightGlue",
            "input": "superpoint_lightglue_pipeline.ort.onnx",
            "output": "superpoint_lightglue_pipeline.ort.int8.onnx"
        })
    
    if not models:
        print(f"❌ Unknown model: {target}")
        print("Valid options: yolov8n-pose, superpoint, all")
        sys.exit(1)
    
    total_original = 0
    total_new = 0
    
    for model_info in models:
        print(f"\n{'=' * 60}")
        print(f"🔄 Processing: {model_info['name']}")
        print(f"{'=' * 60}")
        
        input_path = str(public_dir / model_info["input"])
        output_path = str(public_dir / model_info["output"])
        
        # Check if input exists
        if not os.path.exists(input_path):
            print(f"❌ ERROR: Input file not found: {input_path}")
            continue
        
        try:
            original, new = quantize_model_int8_dynamic(input_path, output_path)
            total_original += original
            total_new += new
        except Exception as e:
            print(f"❌ ERROR: Failed to quantize {model_info['name']}")
            print(f"   {str(e)}")
            continue
    
    # Summary
    if total_original > 0:
        print(f"\n{'=' * 60}")
        print("📊 SUMMARY")
        print(f"{'=' * 60}")
        print(f"Total original size: {total_original:.2f} MB")
        print(f"Total new size:      {total_new:.2f} MB")
        print(f"Total saved:         {total_original - total_new:.2f} MB")
        print(f"Reduction:           {((total_original - total_new) / total_original * 100):.1f}%")
        
        print(f"\n✅ Quantization complete!")
        print(f"\n📝 Next steps:")
        print(f"   1. Test INT8 model in browser (update worker to use .int8.onnx)")
        print(f"   2. Verify model loads without errors")
        print(f"   3. Compare accuracy with FP32 model")
        print(f"   4. Measure performance improvement")
        print(f"   5. If successful, replace FP32 with INT8")
        print(f"\n⚠️  Important: Test thoroughly before deploying!")
        print(f"   INT8 may have ~1% accuracy loss compared to FP32")


if __name__ == "__main__":
    main()
