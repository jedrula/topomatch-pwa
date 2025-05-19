import * as ort from "onnxruntime-web/webgpu";

ort.env.wasm.wasmPaths = {
  wasm: "../../ort-wasm-simd-threaded.jsep.wasm",
};
ort.env.wasm.numThreads = 4;

self.onmessage = async (event) => {
  const { type } = event.data;

  if (type === "runInference") {
    try {
      const session = await ort.InferenceSession.create(
        "../../superpoint_lightglue_pipeline.ort.onnx"
      );

      const imgPaths = [
        "../../otwarcie_fabryczna_testowy.jpg",
        "../../fabryczna_otwarcie_topo.jpg",
      ];
      const images = await Promise.all(imgPaths.map((path) => loadImage(path)));

      const imgWidth = 256;
      const imgHeight = 256;
      const tensors = images.map((image, index) =>
        preprocessImage(image, imgWidth, imgHeight, index)
      );

      const combinedInput = new Float32Array([...tensors[0], ...tensors[1]]);
      const tensor = new ort.Tensor("float32", combinedInput, [2, 1, imgHeight, imgWidth]);
      const feeds = { images: tensor };

      const startTime = performance.now();
      const results = await session.run(feeds);
      const endTime = performance.now();

      self.postMessage({
        type: "inferenceComplete",
        data: {
          inferenceTime: endTime - startTime,
          results,
        },
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        data: { message: error.message },
      });
    }
  }
};

function preprocessImage(image, width, height, index) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height).data;

  const input = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = imageData[i * 4] / 255.0;
    const g = imageData[i * 4 + 1] / 255.0;
    const b = imageData[i * 4 + 2] / 255.0;
    input[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return input;
}

async function loadImage(url) {
  const response = await fetch(url);
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  return bitmap;
}
