import "./assets/main.css";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";

const app = createApp(App);

console.log("a change2");

app.use(router);

app.mount("#app");
