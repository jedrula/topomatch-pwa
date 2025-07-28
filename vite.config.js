import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { VitePWA } from "vite-plugin-pwa";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ["**/*.onnx"],
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
  },
  build: {
    target: "esnext",
    polyfillModulePreload: false,
  },
  worker: {
    format: "es",
  },
  // base: process.env.NODE_ENV === "production" ? "/topomatch-pwa/" : "/",
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Offline Vue PWA",
        short_name: "VuePWA",
        description: "A Progressive Web App built with Vue.js",
        theme_color: "#ffffff",
        icons: [
          {
            src: "favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 70 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === "document",
            handler: "NetworkFirst",
          },
          {
            urlPattern: ({ request }) =>
              request.destination === "script" || request.destination === "style",
            handler: "StaleWhileRevalidate",
          },
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
          },
          {
            urlPattern: /.*\.onnx$/,
            handler: "CacheFirst",
            options: {
              cacheName: "onnx-model-cache",
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30, // Cache for 30 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "./assets",
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.mjs",
          dest: "./assets",
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.wasm",
          dest: "./public", // for dev:
        },
        {
          src: "node_modules/onnxruntime-web/dist/*.mjs",
          dest: "./public", // for dev:
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    cors: true,
    mimeTypes: {
      "application/wasm": ["wasm"],
    },
    headers: {
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
    proxy: {
      "/api/storage": {
        target: "http://localhost:9199",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/storage/, ""),
      },
    },
  },
});
