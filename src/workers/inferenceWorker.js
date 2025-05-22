self.onmessage = async (event) => {
  const { type, userImageBuffer, topoImageBuffer } = event.data;

  if (type === "createSession") {
    console.log("createSession in worker");
    try {
      const startTime = performance.now();
      const session = await ort.InferenceSession.create(
        "../../superpoint_lightglue_pipeline.ort.onnx"
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

    try {
      if (!userImageBuffer || !topoImageBuffer) {
        console.log("wwwww");
        self.postMessage({
          type: "error",
          data: { message: "Both user and topo images must be provided." },
        });
        return;
      }
      const userBlob = new Blob([userImageBuffer]);
      const userBitmap = await createImageBitmap(userBlob);
      const blob = new Blob([topoImageBuffer]);
      const topoBitmap = await createImageBitmap(blob);
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
