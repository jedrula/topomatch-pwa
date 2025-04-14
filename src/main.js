import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { pipeline } from "@huggingface/transformers";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");

async function runInference() {
  try {
    const pipe = await pipeline("sentiment-analysis");
    const out = await pipe("I love transformers!");
    console.log("Inference result:", out);
  } catch (error) {
    console.error("Inference error:", error);
  }
}

runInference();
