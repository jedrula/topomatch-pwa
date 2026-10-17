import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';

// Read version from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    // Build-time clock stamp. __APP_VERSION__ comes from package.json and does not change
    // between deploys, so it cannot answer "is the bundle in front of me the one I just
    // shipped" — which has now cost three debugging cycles to stale service-worker caches.
    __BUILD_STAMP__: JSON.stringify(
      new Date().toISOString().slice(5, 16).replace('T', ' ')
    ),
  },
  assetsInclude: ['**/*.onnx'],
  optimizeDeps: {
    exclude: [
      'onnxruntime-web',
      // Note: NOT excluding @techstark/opencv-js - let Vite optimize it (matches TechStark's example)
    ],
  },
  build: {
    target: 'esnext',
    polyfillModulePreload: false,
    rollupOptions: {
      external: [
        '/poseDetectionWorker.combined.js',
        '/holdDetectionWorker.combined.js', 
        '/inferenceWorker.combined.js'
      ],
      output: {
        manualChunks: {
          // Split OpenCV into separate chunk for better caching (8 MB)
          'opencv': ['@techstark/opencv-js'],
        }
      }
    }
  },
  worker: {
    format: 'es', // Use ES modules for workers (supports { type: 'module' })
  },
  // base: process.env.NODE_ENV === "production" ? "/topomatch-pwa/" : "/",
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // Show prompt when update is available
      workbox: {
        maximumFileSizeToCacheInBytes: 70 * 1024 * 1024,
        navigateFallback: null, // Disable since we have rewrites in firebase.json
        cleanupOutdatedCaches: true, // Auto-cleanup old caches on update
        clientsClaim: true, // Take control immediately on activation
        // skipWaiting removed - only skip when user accepts update
        // Import Firebase messaging for push notifications
        importScripts: ['/firebase-messaging-sw.js'],
        globIgnores: [
          // Note: Removed opencv*.js exclusion - now that Vite optimizes it properly, we can cache it
        ],
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
            // OpenCV.js and WASM files - CacheFirst for performance
            urlPattern: /opencv.*\.(js|wasm|data)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'opencv-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [200],
              },
            },
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
            // ⚡ MEMORY OPTIMIZATION: Cache ONLY images, NOT videos
            urlPattern: ({ url, request }) => {
              if (url.hostname !== 'firebasestorage.googleapis.com') return false;
              
              // EXCLUDE videos from cache (they're huge!)
              const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
              const isVideo = videoExtensions.some(ext => url.pathname.toLowerCase().includes(ext));
              if (isVideo) {
                console.log('🚫 NOT caching video:', url.pathname.substring(0, 100));
                return false;
              }
              
              // Cache images only
              return true;
            },
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              fetchOptions: {
                mode: 'cors',
                credentials: 'omit',
              },
              expiration: {
                maxEntries: 50,  // Increased since we're only caching images now
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days for images
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
    host: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/ios/**',
        '**/backups/**',
        '**/playwright-report/**',
        '**/test-data/**',
        '**/firebase-emulator-data/**',
        '**/capacitor-plugin-ios-video-editor/**',
        '**/.vite/**',
        '**/coverage/**',
        '**/__pycache__/**',
      ],
    },
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
