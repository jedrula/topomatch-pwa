<template>
  <div class="splat-playground">
    <div v-if="!loaded" class="picker">
      <h2>Splat Viewer</h2>
      <p>Pick a <code>.splat</code> file from disk to view it.</p>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onFile" hidden />
      </label>
    </div>

    <div v-if="error" class="error">{{ error }}</div>

    <div ref="container" class="canvas-container" />

    <button v-if="loaded" class="reset-btn" @click="reset">← pick another</button>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';

const container = ref(null);
const loaded = ref(false);
const error = ref('');
let viewer = null;

async function onFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  error.value = '';

  try {
    const { Viewer } = await import('@mkkellogg/gaussian-splats-3d');

    const objectUrl = URL.createObjectURL(file);

    viewer = new Viewer({
      rootElement: container.value,
      cameraUp: [0, -1, 0],
      initialCameraPosition: [0, 0, -3],
      initialCameraLookAt: [0, 0, 0],
    });

    await viewer.addSplatScene(objectUrl, {
      splatAlphaRemovalThreshold: 5,
      format: 0, // SceneFormat.Splat — needed because blob: URLs have no extension
    });
    loaded.value = true;
    viewer.start();
  } catch (err) {
    error.value = 'Failed to load splat: ' + err.message;
  }
}

function reset() {
  if (viewer) {
    viewer.stop?.();
    viewer.dispose?.();
    viewer = null;
  }
  loaded.value = false;
  error.value = '';
}

onBeforeUnmount(reset);
</script>

<style scoped>
.splat-playground {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #111;
  overflow: hidden;
}

.picker {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #ccc;
  z-index: 10;
}

.picker h2 { font-size: 1.4rem; color: #fff; }
.picker p  { font-size: 0.9rem; color: #888; }
.picker code { background: #222; padding: 2px 6px; border-radius: 4px; }

.pick-btn {
  padding: 12px 28px;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.pick-btn:hover { background: #1d4ed8; }

.canvas-container {
  width: 100%;
  height: 100%;
}

.error {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 20;
  font-size: 0.85rem;
}

.reset-btn {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  padding: 8px 14px;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: 1px solid #444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
}
.reset-btn:hover { background: rgba(0,0,0,0.8); }
</style>
