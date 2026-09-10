<template>
  <div class="pc-viewer-wrap">
    <div ref="canvasWrap" class="pc-canvas-wrap">
      <div v-if="loading" class="pc-overlay">Loading point cloud…</div>
      <div v-if="error" class="pc-overlay pc-error">{{ error }}</div>
    </div>
    <div class="pc-info" v-if="pointCount">{{ pointCount.toLocaleString() }} points</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({ url: { type: String, required: true } });

const canvasWrap = ref(null);
const loading = ref(true);
const error = ref('');
const pointCount = ref(0);

let renderer, scene, camera, controls, animId;

async function init() {
  loading.value = true;
  error.value = '';

  const [THREE, { PLYLoader }, { OrbitControls }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/loaders/PLYLoader.js'),
    import('three/examples/jsm/controls/OrbitControls.js'),
  ]);

  const el = canvasWrap.value;
  if (!el) return;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.setClearColor(0x111111);
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.01, 1000);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const loader = new PLYLoader();
  let geometry;
  try {
    geometry = await new Promise((resolve, reject) =>
      loader.load(props.url, resolve, undefined, reject)
    );
  } catch (e) {
    error.value = 'Failed to load point cloud';
    loading.value = false;
    return;
  }

  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);

  geometry.translate(-center.x, -center.y, -center.z);

  const hasColors = geometry.attributes.color !== undefined;
  const material = new THREE.PointsMaterial({
    size: maxDim * 0.003,
    vertexColors: hasColors,
    color: hasColors ? undefined : 0x88aaff,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  camera.position.set(0, 0, maxDim * 1.5);
  controls.update();

  pointCount.value = geometry.attributes.position.count;
  loading.value = false;

  const animate = () => {
    animId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const ro = new ResizeObserver(() => {
    if (!el) return;
    camera.aspect = el.clientWidth / el.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(el.clientWidth, el.clientHeight);
  });
  ro.observe(el);
}

onMounted(init);

watch(() => props.url, init);

onBeforeUnmount(() => {
  cancelAnimationFrame(animId);
  renderer?.dispose();
  controls?.dispose();
});
</script>

<style scoped>
.pc-viewer-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pc-canvas-wrap {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
}
.pc-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 0.9rem;
}
.pc-error { color: #f87171; }
.pc-info {
  color: #6b7280;
  font-size: 0.75rem;
  text-align: right;
  padding-right: 4px;
}
</style>
