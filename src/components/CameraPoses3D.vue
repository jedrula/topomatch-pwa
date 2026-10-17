<!--
  Every camera that solved, drawn as a frustum inside the sparse cloud it built.

  The 2D plan view answered "where did the drone go". It cannot answer "what
  was this camera looking at", because that is a direction in three dimensions
  and an aerial capture spends most of its information in pitch. So: real 3D,
  the SfM point cloud for context, and a frustum per camera pointing the way it
  actually pointed.

  Performance note, because 400 cameras is enough to matter. Every frustum is
  baked into ONE LineSegments buffer and every centre into ONE Points buffer,
  rather than 400 Object3Ds -- three.js spends its frame budget on draw calls,
  and picking against a Points cloud is a single raycast with a threshold
  instead of 400 intersection tests.
-->
<template>
  <div class="cp3">
    <div class="cp3-bar">
      <span class="cp3-n">{{ count }} cameras</span>
      <label class="cp3-opt"><input type="checkbox" v-model="showCloud" /> point cloud</label>
      <label class="cp3-opt"><input type="checkbox" v-model="showPath" /> flight path</label>
      <label class="cp3-opt"><input type="checkbox" v-model="showFrustums" /> frustums</label>
      <span class="cp3-hint">drag to orbit · scroll to zoom · click a camera</span>
      <button class="cp3-btn" @click="frame">reset view</button>
    </div>
    <div ref="host" class="cp3-host"></div>
    <p v-if="msg" class="cp3-msg">{{ msg }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  carpet: { type: Object, default: null },
  cloudUrl: { type: String, default: '' },
  selected: { type: String, default: '' },   // filename
});
const emit = defineEmits(['select']);

const host = ref(null);
const msg = ref('');
const showCloud = ref(true);
const showPath = ref(true);
const showFrustums = ref(true);
const count = computed(() => props.carpet?.centers?.length || 0);

let THREE, scene, camera, renderer, controls, raf;
let cloudObj = null, pathObj = null, frustumObj = null, pointsObj = null, markerObj = null;
let centers = [], names = [];

function dispose(o) {
  if (!o) return;
  scene?.remove(o);
  o.geometry?.dispose?.();
  if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
  else o.material?.dispose?.();
}

async function init() {
  if (!host.value || !props.carpet?.centers?.length) return;
  const [T, { OrbitControls }, { PLYLoader }] = await Promise.all([
    import('three'),
    import('three/examples/jsm/controls/OrbitControls.js'),
    import('three/examples/jsm/loaders/PLYLoader.js'),
  ]);
  THREE = T;
  const w = host.value.clientWidth || 800, h = 460;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1115);
  camera = new THREE.PerspectiveCamera(50, w / h, 0.05, 20000);
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  host.value.innerHTML = '';
  host.value.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  build(THREE);
  frame();

  renderer.domElement.addEventListener('click', onClick);
  const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
  loop();

  if (props.cloudUrl) loadCloud(PLYLoader);
}

function loadCloud(PLYLoader) {
  msg.value = 'loading point cloud…';
  new PLYLoader().load(props.cloudUrl, g => {
    g.computeBoundingBox();
    const m = new THREE.PointsMaterial({ size: 0.06, vertexColors: !!g.getAttribute('color'),
                                         sizeAttenuation: true });
    if (!g.getAttribute('color')) m.color = new THREE.Color(0x6b7688);
    cloudObj = new THREE.Points(g, m);
    cloudObj.visible = showCloud.value;
    scene.add(cloudObj);
    msg.value = '';
    frame();
  }, undefined, () => { msg.value = 'point cloud unavailable for this job'; });
}

function build(THREE) {
  const c = props.carpet;
  centers = c.centers; names = c.names || [];
  const fwds = c.forwards || [];
  const up = new THREE.Vector3(...(c.world_up || [0, 0, 1])).normalize();

  const hs = centers.map(p => new THREE.Vector3(...p).dot(up));
  const a0 = Math.min(...hs), a1 = Math.max(...hs), span = Math.max(a1 - a0, 1e-6);
  const col = t => {
    const s = [[0.15,0.27,0.47],[0.12,0.55,0.67],[0.35,0.75,0.55],[0.90,0.78,0.35],[0.92,0.47,0.27]];
    const x = Math.max(0, Math.min(1, t)) * (s.length - 1);
    const i = Math.min(s.length - 2, Math.floor(x)), f = x - i;
    return s[i].map((v, k) => v + (s[i+1][k] - v) * f);
  };

  // centres, for picking and for a visible dot
  const pos = new Float32Array(centers.length * 3);
  const rgb = new Float32Array(centers.length * 3);
  centers.forEach((p, i) => {
    pos.set(p, i*3);
    rgb.set(col((hs[i] - a0) / span), i*3);
  });
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
  pointsObj = new THREE.Points(pg, new THREE.PointsMaterial({ size: 9, vertexColors: true,
    sizeAttenuation: false }));
  scene.add(pointsObj);

  // one buffer for every frustum edge
  const scale = Math.max(0.6, medianSpacing() * 0.45);
  const edges = [], ecol = [];
  centers.forEach((p, i) => {
    const C = new THREE.Vector3(...p);
    const f = new THREE.Vector3(...(fwds[i] || [0, 0, 1])).normalize();
    let u = new THREE.Vector3().crossVectors(f, up);
    if (u.lengthSq() < 1e-8) u = new THREE.Vector3(1, 0, 0);
    u.normalize();
    const v = new THREE.Vector3().crossVectors(u, f).normalize();
    const d = scale, hw = d * 0.36, hh = d * 0.27;   // ~4:3, ~74 deg
    const corners = [
      C.clone().addScaledVector(f, d).addScaledVector(u,  hw).addScaledVector(v,  hh),
      C.clone().addScaledVector(f, d).addScaledVector(u, -hw).addScaledVector(v,  hh),
      C.clone().addScaledVector(f, d).addScaledVector(u, -hw).addScaledVector(v, -hh),
      C.clone().addScaledVector(f, d).addScaledVector(u,  hw).addScaledVector(v, -hh),
    ];
    const cc = col((hs[i] - a0) / span);
    const push = (a, b) => { edges.push(a.x,a.y,a.z,b.x,b.y,b.z); ecol.push(...cc, ...cc); };
    corners.forEach(k => push(C, k));
    for (let k = 0; k < 4; k++) push(corners[k], corners[(k+1)%4]);
  });
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges), 3));
  fg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ecol), 3));
  frustumObj = new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ vertexColors: true,
    transparent: true, opacity: 0.55 }));
  scene.add(frustumObj);

  // capture-order path
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(centers.flat()), 3));
  pathObj = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x8fa3d0, transparent: true,
    opacity: 0.35 }));
  scene.add(pathObj);

  const mg = new THREE.SphereGeometry(scale * 0.18, 12, 10);
  markerObj = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0xffffff }));
  markerObj.visible = false;
  scene.add(markerObj);
}

function medianSpacing() {
  if (centers.length < 2) return 1;
  const d = [];
  for (let i = 1; i < centers.length; i++) {
    const a = centers[i-1], b = centers[i];
    d.push(Math.hypot(a[0]-b[0], a[1]-b[1], a[2]-b[2]));
  }
  d.sort((x, y) => x - y);
  return d[Math.floor(d.length / 2)] || 1;
}

function frame() {
  if (!THREE || !centers.length) return;
  const box = new THREE.Box3();
  centers.forEach(p => box.expandByPoint(new THREE.Vector3(...p)));
  const c = box.getCenter(new THREE.Vector3());
  const r = Math.max(box.getSize(new THREE.Vector3()).length() * 0.6, 1);
  camera.position.copy(c).add(new THREE.Vector3(r, -r, r * 0.85));
  camera.near = r / 500; camera.far = r * 60; camera.updateProjectionMatrix();
  controls.target.copy(c); controls.update();
}

function onClick(ev) {
  if (!THREE || !pointsObj) return;
  const r = renderer.domElement.getBoundingClientRect();
  const m = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1,
                              -((ev.clientY - r.top) / r.height) * 2 + 1);
  const rc = new THREE.Raycaster();
  rc.params.Points.threshold = Math.max(medianSpacing() * 0.25, 0.05);
  rc.setFromCamera(m, camera);
  const hit = rc.intersectObject(pointsObj, false)[0];
  if (!hit) return;
  const i = hit.index;
  markerObj.position.set(...centers[i]); markerObj.visible = true;
  if (names[i]) emit('select', names[i]);
}

watch(() => props.selected, n => {
  const i = names.indexOf(n);
  if (i >= 0 && markerObj) { markerObj.position.set(...centers[i]); markerObj.visible = true; }
});
watch(showCloud, v => { if (cloudObj) cloudObj.visible = v; });
watch(showPath, v => { if (pathObj) pathObj.visible = v; });
watch(showFrustums, v => { if (frustumObj) frustumObj.visible = v; });
watch(() => props.carpet, () => { teardown(); init(); });

function teardown() {
  cancelAnimationFrame(raf);
  renderer?.domElement?.removeEventListener('click', onClick);
  [cloudObj, pathObj, frustumObj, pointsObj, markerObj].forEach(dispose);
  cloudObj = pathObj = frustumObj = pointsObj = markerObj = null;
  controls?.dispose?.(); renderer?.dispose?.();
}
onMounted(init);
onBeforeUnmount(teardown);
</script>

<style scoped>
.cp3-bar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px;
  color: #9aa3b5; margin-bottom: 6px; }
.cp3-n { font-weight: 600; color: #cfd6e4; }
.cp3-opt { display: flex; align-items: center; gap: 4px; cursor: pointer; }
.cp3-hint { opacity: .65; }
.cp3-btn { margin-left: auto; font-size: 11px; padding: 2px 8px; border-radius: 5px;
  border: 1px solid #39404f; background: #191d25; color: #cfd6e4; cursor: pointer; }
.cp3-host { width: 100%; height: 460px; border-radius: 8px; overflow: hidden; background: #0f1115; }
.cp3-host :deep(canvas) { display: block; width: 100% !important; height: 100% !important; }
.cp3-msg { font-size: 12px; color: #7b8496; margin-top: 6px; }
</style>
