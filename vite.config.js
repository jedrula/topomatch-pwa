import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.onnx'],
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
  build: {
    target: 'esnext',
    polyfillModulePreload: false,
    rollupOptions: {
      external: [
        '/poseDetectionWorker.combined.js',
        '/holdDetectionWorker.combined.js', 
        '/inferenceWorker.combined.js'
      ]
    }
  },
  worker: {
    format: 'iife',
  },
  // base: process.env.NODE_ENV === "production" ? "/topomatch-pwa/" : "/",
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Auto-update in background, users see changes after 1-2 refreshes
      workbox: {
        maximumFileSizeToCacheInBytes: 70 * 1024 * 1024,
        navigateFallback: null, // Disable since we have rewrites in firebase.json
        cleanupOutdatedCaches: true, // Auto-cleanup old caches on update
        clientsClaim: true, // Take control immediately on activation
        skipWaiting: true, // Activate new service worker immediately
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'script' || request.destination === 'style',
            handler: 'StaleWhileRevalidate',
          },
          {
            // Cache images EXCEPT Firebase Storage URLs
            urlPattern: ({ request, url }) => 
              request.destination === 'image' && 
              !url.hostname.includes('firebasestorage.googleapis.com'),
            handler: 'CacheFirst',
          },
          {
            // Firebase Storage images - NetworkFirst with CORS
            // ⚡ MEMORY OPTIMIZATION: Reduced cache limits to prevent 500+ MB accumulation
            urlPattern: ({ url}) => 
              url.hostname === 'firebasestorage.googleapis.com',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              fetchOptions: {
                mode: 'cors',
                credentials: 'omit',
              },
              expiration: {
                maxEntries: 20,  // Reduced from 100 (20 recent videos/images max)
                maxAgeSeconds: 60 * 60 * 24 * 2, // 2 days instead of 7
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /.*\.onnx$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-model-cache',
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
      manifest: {
        name: 'TopoMatch',
        short_name: 'TopoMatch',
        description: 'Climbing route and boulder problem tracker',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon',
          },
        ],
      },
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './assets',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.mjs',
          dest: './assets',
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.wasm',
          dest: './public', // for dev:
        },
        {
          src: 'node_modules/onnxruntime-web/dist/*.mjs',
          dest: './public', // for dev:
        },
        {
          src: 'playgrounds/*.html',
          dest: './playgrounds',
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    cors: true,
    mimeTypes: {
      'application/wasm': ['wasm'],
    },
    headers: {
      // Enable Cross-Origin Isolation in dev mode for multi-threading testing
      // Using 'credentialless' instead of 'require-corp' to allow Firebase emulators
      // which don't send Cross-Origin-Resource-Policy headers
      // This still enables SharedArrayBuffer but is more permissive
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
    proxy: {
      // Firebase Storage emulator with CORS headers
      '/v0/b': {
        target: 'http://localhost:9199',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Add CORS headers to Firebase Storage emulator responses
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization';
            proxyRes.headers['cross-origin-resource-policy'] = 'cross-origin';
          });
        },
      },
      // Firestore emulator with CORS headers
      '/google.firestore': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        configure: (proxy, options) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = '*';
            proxyRes.headers['cross-origin-resource-policy'] = 'cross-origin';
          });
        },
      },
      '/api/storage': {
        target: 'http://localhost:9199',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/storage/, ''),
      },
    },
  },
});
