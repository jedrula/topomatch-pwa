<template>
  <main>
    Hello World
    <p>Inference Time: {{ inferenceTime }}</p>
    <p>Session Time: {{ sessionTime }}</p>
    <p>WebAssembly Threads Supported: {{ wasmThreadsSupported }}</p>
    <p>WebAssembly SIMD Supported: {{ wasmSimdSupported }}</p>
    <p>Browser Info: {{ browserInfo }}</p>
    <p v-if="errorString" style="color: red">Error: {{ errorString }}</p>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as ort from "onnxruntime-web/webgpu";
import * as wasmFeatureDetect from "wasm-feature-detect";
import Bowser from "bowser";

const inferenceTime = ref(null);
const sessionTime = ref(null);
const errorString = ref(null);
const wasmThreadsSupported = ref(null);
const wasmSimdSupported = ref(null);
const browserInfo = ref(null);
const inferenceWorker = new Worker(new URL("../workers/inferenceWorker.js", import.meta.url), {
  type: "module",
});

inferenceWorker.onmessage = (event) => {
  const { type, data } = event.data;
  if (type === "inferenceComplete") {
    inferenceTime.value = `${data.inferenceTime.toFixed(2)} ms`;
    console.log("Inference results:", data.results);
  }
};

function checkBrowser() {
  const browser = Bowser.getParser(window.navigator.userAgent);
  browserInfo.value = {
    name: browser.getBrowserName(),
    version: browser.getBrowserVersion(),
    os: browser.getOSName(),
    osVersion: browser.getOSVersion(),
  };
}

async function checkWasmFeatures() {
  wasmThreadsSupported.value = await wasmFeatureDetect.threads();
  wasmSimdSupported.value = await wasmFeatureDetect.simd();

  if (!wasmThreadsSupported.value) {
    console.warn("WebAssembly threads are not supported. Multi-threading will be disabled.");
    ort.env.wasm.numThreads = 1; // Fallback to single-threaded mode
  }

  if (!wasmSimdSupported.value) {
    console.warn("WebAssembly SIMD is not supported. Performance may be reduced.");
  }
}

async function runInference() {
  inferenceWorker.postMessage({ type: "runInference" });
}

onMounted(async () => {
  checkBrowser();
  await checkWasmFeatures();
  await runInference();
});

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
</script>
