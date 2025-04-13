import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { InferenceSession, Tensor } from "onnxruntime-web";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

async function runInference() {
  try {
    const session = await InferenceSession.create("/model.onnx");

    const dataA = Float32Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const dataB = Float32Array.from([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]);
    const tensorA = new Tensor("float32", dataA, [3, 4]);
    const tensorB = new Tensor("float32", dataB, [4, 3]);

    const feeds = { a: tensorA, b: tensorB };
    const results = await session.run(feeds);

    const dataC = results.c.data;
    console.log("Inference result:", dataC);
  } catch (error) {
    console.error("Inference error:", error);
  }
}

runInference();
