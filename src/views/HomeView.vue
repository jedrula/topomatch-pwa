<template>
  <main>
    Hello World
    <p>Inference Time: {{ inferenceTime }}</p>
  </main>
</template>

<script setup>
import { ref } from "vue";
import * as ort from "onnxruntime-web/webgpu";

// Enable multi-threading for WASM
ort.env.wasm.numThreads = 4;
ort.env.wasm.wasmPaths = {
  wasm: "./ort-wasm-simd-threaded.jsep.wasm",
};

// Load and preprocess images
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function preprocessImage(image, width, height, index) {
  console.time(`Preprocess Image Time ${index}`);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
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
  console.timeEnd(`Preprocess Image Time ${index}`);
  return input;
}

async function createSession() {
  const session = await ort.InferenceSession.create("./superpoint_lightglue_pipeline.ort.onnx");
  return session;
}

const inferenceTime = ref(null);

async function main() {
  try {
    const session = await createSession();

    const imgPaths = ["./otwarcie_fabryczna_testowy.jpg", "./fabryczna_otwarcie_topo.jpg"];
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

    inferenceTime.value = `${(endTime - startTime).toFixed(2)} ms`; // Set inference time

    console.log("Inference results:", results);
    // visualizeMatches(results, images, imgWidth, imgHeight);
  } catch (e) {
    console.error(`Failed to inference ONNX model: ${e}`);
  }
}

function visualizeMatches(rawData, images, imgWidth, imgHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = imgWidth * 2;
  canvas.height = imgHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(images[0], 0, 0, imgWidth, imgHeight);
  ctx.drawImage(images[1], imgWidth, 0, imgWidth, imgHeight);

  for (let i = 0; i < Math.min(20, rawData.matches.dims[0]); i++) {
    const matchBaseIndex = i * rawData.matches.dims[1];
    const img0Idx = Number(rawData.matches.cpuData[matchBaseIndex + 1]);
    const img1Idx = Number(rawData.matches.cpuData[matchBaseIndex + 2]);

    const x0 = Number(rawData.keypoints.cpuData[img0Idx * 2]);
    const y0 = Number(rawData.keypoints.cpuData[img0Idx * 2 + 1]);
    const x1 =
      Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2]) + imgWidth;
    const y1 = Number(rawData.keypoints.cpuData[(img1Idx + rawData.keypoints.dims[1]) * 2 + 1]);

    ctx.strokeStyle = "red";
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
}

main();
</script>
