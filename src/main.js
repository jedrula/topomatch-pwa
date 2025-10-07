import './assets/main.css';
import 'floating-vue/dist/style.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';

import FloatingVue from 'floating-vue';

import App from './App.vue';
import router from './router';

// import * as ort from "onnxruntime-web/dist/ort-web.min.js";

// import wasm from "onnxruntime-web/dist/ort-wasm.wasm?url";
// import wasmThreaded from "onnxruntime-web/dist/ort-wasm-threaded.wasm?url";
// import wasmSimd from "onnxruntime-web/dist/ort-wasm-simd.wasm?url";
// import wasmSimdThreaded from "onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url";

// ort.env.wasm.wasmPaths = {
//   "ort-wasm.wasm": wasm,
//   "ort-wasm-threaded.wasm": wasmThreaded,
//   "ort-wasm-simd.wasm": wasmSimd,
//   "ort-wasm-simd-threaded.wasm": wasmSimdThreaded,
// };

const pinia = createPinia();
const app = createApp(App);

app.use(router);
app.use(FloatingVue);
app.use(pinia);

// Eagerly initialize inference store to start loading AI models immediately
import { useInferenceStore } from './stores/inferenceStore';
useInferenceStore(); // This will trigger the session creation immediately

app.mount('#app');
