self.onmessage = async (event) => {
  const { type, userImageBuffer, topoImageBuffer } = event.data;

  if (type === "createSession") {
    console.log("createSession in worker 2");
    try {
      const startTime = performance.now();
      // Use WASM options to enable SIMD and threads if supported
      const session = await ort.InferenceSession.create(
        "../../superpoint_lightglue_pipeline.ort.onnx",
        {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
          wasm: {
            numThreads: navigator.hardwareConcurrency
              ? Math.max(1, Math.min(4, navigator.hardwareConcurrency))
              : 2,
            simd: true,
            threads: true,
          },
        }
      );
      const endTime = performance.now();

      self.session = session; // Store the session in the worker

      self.postMessage({
        type: "sessionCreated",
        data: {
          sessionTime: endTime - startTime,
        },
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        data: { message: error.message },
      });
    }
  }

  if (type === "runInference") {
    if (!self.session) {
      self.postMessage({
        type: "error",
        data: { message: "Session is not initialized." },
      });
      return;
    }

    let userBitmap = null;
    let topoBitmap = null;
    let userBlob = null;
    let topoBlob = null;
    try {
      if (!userImageBuffer || !topoImageBuffer) {
        self.postMessage({
          type: "error",
          data: { message: "Both user and topo images must be provided." },
        });
        return;
      }
      userBlob = new Blob([userImageBuffer]);
      userBitmap = await createImageBitmap(userBlob);
      topoBlob = new Blob([topoImageBuffer]);
      topoBitmap = await createImageBitmap(topoBlob);
      const images = [userBitmap, topoBitmap];

      const imgWidth = 256;
      const imgHeight = 256;
      const tensors = images.map((image, index) =>
        preprocessImage(image, imgWidth, imgHeight, index)
      );
      const combinedInput = new Float32Array([...tensors[0], ...tensors[1]]);
      const tensor = new ort.Tensor("float32", combinedInput, [2, 1, imgHeight, imgWidth]);
      const feeds = { images: tensor };

      const startTime = performance.now();
      const results = await self.session.run(feeds);
      const endTime = performance.now();

      self.postMessage({
        type: "inferenceComplete",
        data: {
          inferenceTime: endTime - startTime,
          results,
          images,
          imgWidth,
          imgHeight,
        },
      });
    } catch (error) {
      self.postMessage({
        type: "error",
        data: { message: error.message },
      });
    } finally {
      // Explicitly release resources to help GC, especially on mobile
      if (userBitmap && typeof userBitmap.close === "function") userBitmap.close();
      if (topoBitmap && typeof topoBitmap.close === "function") topoBitmap.close();
      userBitmap = null;
      topoBitmap = null;
      userBlob = null;
      topoBlob = null;
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
