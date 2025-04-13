import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import * as ort from "onnxruntime-web";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

async function runInference() {
  try {
    // Fetch the ONNX model and convert it to a Uint8Array
    // const response = await fetch("/resnet50-v2-7.onnx");
    // const arrayBuffer = await response.arrayBuffer();
    // const modelBuffer = new Uint8Array(arrayBuffer);
    // console.log("arrau", arrayBuffer);

    // Create the inference session using the Uint8Array buffer
    const session = await ort.InferenceSession.create("/resnet50-v2-7.onnx", {
      executionProviders: [{ name: "cpu" }],
    });

    const dataA = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const dataB = Float32Array.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
    const tensorA = new ort.Tensor("float32", dataA, [3, 4]);
    const tensorB = new ort.Tensor("float32", dataB, [4, 3]);

    const feeds = { a: tensorA, b: tensorB };
    const results = await session.run(feeds);

    const dataC = results.c.data;
    console.log("Inference result:", dataC);
  } catch (error) {
    console.error("Inference error:", error);
  }
}

runInference();
