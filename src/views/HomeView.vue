<template>
  <main>
    Hello World
    <p>Inference Time: {{ inferenceTime }}</p>
    <p>Session Time: {{ sessionTime }}</p>
    <p>WebAssembly Threads Supported: {{ wasmThreadsSupported }}</p>
    <p>WebAssembly SIMD Supported: {{ wasmSimdSupported }}</p>
    <p>Browser Info: {{ browserInfo }}</p>
    <p v-if="errorString" style="color: red">Error: {{ errorString }}</p>

    <div v-if="isLoading" class="spinner">
      <p>{{ loadingMessage }}</p>
      <div class="spinner-icon"></div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted } from "vue";
import * as ort from "onnxruntime-web/webgpu";
import * as wasmFeatureDetect from "wasm-feature-detect";
import Bowser from "bowser";
import InferenceWorker from "../workers/inferenceWorker.js?worker";

const inferenceTime = ref(null);
const sessionTime = ref(null);
const errorString = ref(null);
const wasmThreadsSupported = ref(null);
const wasmSimdSupported = ref(null);
const browserInfo = ref(null);
const isLoading = ref(false);
const loadingMessage = ref("");
const inferenceWorker = new InferenceWorker();

inferenceWorker.onmessage = (event) => {
  const { type, data } = event.data;
  if (type === "inferenceComplete") {
    inferenceTime.value = `${data.inferenceTime.toFixed(2)} ms`;
    isLoading.value = false;
    console.log("Inference results:", data.results);
    visualizeMatches(data.results, data.images, data.imgWidth, data.imgHeight);
  } else if (type === "sessionCreated") {
    sessionTime.value = `${data.sessionTime.toFixed(2)} ms`;
    isLoading.value = false;
    console.log("Session created in:", sessionTime.value);
    runInference();
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

async function createSession() {
  isLoading.value = true;
  loadingMessage.value = "Creating session...";
  inferenceWorker.postMessage({ type: "createSession" });
}

async function runInference() {
  isLoading.value = true;
  loadingMessage.value = "Inferencing...";
  inferenceWorker.postMessage({ type: "runInference" });
}

onMounted(async () => {
  checkBrowser();
  await checkWasmFeatures();
  await createSession();
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

<style>
.spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.spinner-icon {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
