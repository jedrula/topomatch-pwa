<template>
  <div class="hold-assign-view">
    <!-- Header -->
    <header class="header">
      <RouterLink
        class="back-btn"
        :to="{ name: 'splat-viewer', params: { splatId: route.params.splatId } }"
      >← Viewer</RouterLink>
      <button
        class="mode-btn"
        :class="assignMode ? 'is-assigning' : 'is-navigating'"
        @click="toggleAssignMode"
      >
        {{ assignMode ? '🎯 Assigning' : '🔄 Navigate' }}
      </button>
      <span v-if="assignMode && activeProblem" class="mode-hint">
        Click holds to assign/remove from
        <b :style="{ color: activeProblem.color }">{{ activeProblem.name }}</b>
      </span>
      <span v-else-if="assignMode" class="mode-hint warn">
        Create or select a problem first →
      </span>
    </header>

    <div class="body">
      <!-- 3D Viewer -->
      <div class="viewer-wrap">
        <div v-if="loading" class="loading-overlay">
          <div class="loading-text">Loading splat… {{ loadProgress }}%</div>
          <div class="load-bar"><div class="load-fill" :style="{ width: loadProgress + '%' }" /></div>
        </div>
        <div v-if="loadError" class="load-error">{{ loadError }}</div>
        <div ref="container" class="canvas-container" />
        <canvas
          ref="overlayCanvas"
          class="overlay-canvas"
          :style="{ pointerEvents: assignMode ? 'auto' : 'none', cursor: assignMode ? 'crosshair' : 'default' }"
          @mousedown="onMouseDown"
          @mouseup="onMouseUp"
        />
        <div v-if="!loading && !holds.length && !loadError" class="no-holds-hint">
          No holds detected yet — open the Viewer and run <b>Segment</b> first
        </div>
      </div>

      <!-- Right panel -->
      <aside class="panel">
        <div class="panel-section">
          <div class="panel-hdr">
            <h3 class="panel-title">Boulder Problems</h3>
            <button class="new-btn" @click="createProblem">+ New</button>
          </div>
          <div class="stats-row">
            {{ assignedHoldCount }}/{{ holds.length }} holds assigned
            <span v-if="holds.length === 0" class="stat-warn"> · No holds loaded</span>
          </div>
        </div>

        <!-- Problem list -->
        <div class="problems-list">
          <div v-if="!problems.length" class="empty-msg">
            No problems yet. Click "+ New" to start.
          </div>
          <div
            v-for="p in problems"
            :key="p.id"
            class="problem-row"
            :class="{ 'is-active': activeProblemId === p.id }"
            @click="setActiveProblm(p.id)"
          >
            <div class="p-swatch" :style="{ background: p.color }" />
            <div class="p-meta">
              <span class="p-name">{{ p.name }}</span>
              <span class="p-count">{{ holdsForProblem(p.id).length }} holds</span>
            </div>
            <button class="p-delete" @click.stop="deleteProblem(p.id)" title="Delete problem">×</button>
          </div>
        </div>

        <!-- Active problem hold list -->
        <div v-if="activeProblem" class="active-section">
          <div class="active-hdr">
            <div class="p-swatch" :style="{ background: activeProblem.color }" />
            <span class="active-name">{{ activeProblem.name }}</span>
          </div>
          <div class="active-holds">
            <div v-if="!holdsForProblem(activeProblem.id).length" class="empty-holds">
              <span v-if="assignMode">Click colored hold dots in the viewer to assign them here</span>
              <span v-else>Switch to <b>Assign mode</b> and click hold dots to add them</span>
            </div>
            <div
              v-for="h in holdsForProblem(activeProblem.id)"
              :key="h.id"
              class="h-row"
            >
              <div class="h-swatch" :style="{ background: h.color }" />
              <span class="h-label">Hold {{ h.id + 1 }}</span>
              <button class="h-remove" @click="unassignHold(h.id)" title="Remove from problem">×</button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="panel-footer">
          <button class="save-btn" disabled title="Firestore save coming in next iteration">
            💾 Save (coming soon)
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const container = ref(null);
const overlayCanvas = ref(null);
const loading = ref(true);
const loadProgress = ref(0);
const loadError = ref('');

// Holds: [{id, color, center: THREE.Vector3, problemId: null}]
const holds = ref([]);

// Problems: [{id, name, color}]
const problems = ref([]);
const activeProblemId = ref(null);
const assignMode = ref(false);
let nextProblemNum = 1;

let viewer = null;
let THREE = null;
let rafId = null;
// For click-vs-drag disambiguation
let mdPos = null;
let mdTime = null;

const PROBLEM_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

// ── Computed ──────────────────────────────────────────────────────────────────

const activeProblem = computed(() =>
  problems.value.find(p => p.id === activeProblemId.value) ?? null
);

const assignedHoldCount = computed(() =>
  holds.value.filter(h => h.problemId !== null).length
);

function holdsForProblem(pid) {
  return holds.value.filter(h => h.problemId === pid);
}

// ── Problem management ────────────────────────────────────────────────────────

function createProblem() {
  const id = `p-${Date.now()}`;
  const color = PROBLEM_COLORS[(nextProblemNum - 1) % PROBLEM_COLORS.length];
  problems.value.push({ id, name: `Problem ${nextProblemNum}`, color });
  nextProblemNum++;
  activeProblemId.value = id;
  assignMode.value = true;
}

function setActiveProblm(pid) {
  activeProblemId.value = activeProblemId.value === pid ? null : pid;
}

function deleteProblem(pid) {
  // Unassign all its holds
  for (const h of holds.value) {
    if (h.problemId === pid) h.problemId = null;
  }
  problems.value = problems.value.filter(p => p.id !== pid);
  if (activeProblemId.value === pid) activeProblemId.value = null;
}

function unassignHold(holdId) {
  const h = holds.value.find(h => h.id === holdId);
  if (h) h.problemId = null;
}

// ── Mode toggle ───────────────────────────────────────────────────────────────

function toggleAssignMode() {
  assignMode.value = !assignMode.value;
  if (!assignMode.value && activeProblem.value === null && problems.value.length) {
    // Re-enable navigation
  }
}

// Disable orbit controls in assign mode so dragging doesn't orbit
watch(assignMode, (active) => {
  if (viewer?.controls) viewer.controls.enabled = !active;
});

// ── Splat viewer ──────────────────────────────────────────────────────────────

async function fetchInitialCamera(splatId, gateway) {
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/initial-camera`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function loadHolds(splatId, gateway) {
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/holds`);
    if (!res.ok) return;
    const { holds: raw } = await res.json();
    if (!raw?.length) return;
    holds.value = raw
      .filter(h => Array.isArray(h.center) && h.center.length === 3)
      .map((h, i) => ({
        id: i,
        color: h.color ?? '#ffffff',
        center: new THREE.Vector3(h.center[0], h.center[1], h.center[2]),
        problemId: null,
      }));
  } catch {
    // non-fatal — viewer works without holds
  }
}

// Draw hold dots on the overlay canvas, locked to 3D world positions
function drawHolds() {
  const c = overlayCanvas.value;
  if (!c || !viewer || !THREE) {
    rafId = requestAnimationFrame(drawHolds);
    return;
  }

  const cam = viewer.camera;
  const W = c.width;
  const H = c.height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const tmp = new THREE.Vector3();

  for (const hold of holds.value) {
    tmp.copy(hold.center).project(cam);
    if (tmp.z < -1 || tmp.z > 1) continue;

    const sx = ((tmp.x + 1) / 2) * W;
    const sy = ((-tmp.y + 1) / 2) * H;
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;

    const problem = hold.problemId !== null
      ? problems.value.find(p => p.id === hold.problemId)
      : null;
    const isActiveProblem = problem && problem.id === activeProblemId.value;

    let fillColor, strokeColor, r;
    if (isActiveProblem) {
      fillColor = problem.color + 'ee';
      strokeColor = '#ffffff';
      r = 13;
    } else if (problem) {
      fillColor = problem.color + 'cc';
      strokeColor = problem.color;
      r = 10;
    } else {
      // Unassigned: show hold's own color (from segmentation) faintly
      fillColor = (hold.color ?? '#ffffff') + '66';
      strokeColor = (hold.color ?? '#aaaaaa') + 'aa';
      r = 8;
    }

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isActiveProblem ? 2.5 : 1.5;
    ctx.stroke();
  }

  rafId = requestAnimationFrame(drawHolds);
}

async function renderSplat(objectUrl, splatId, gateway) {
  const [{ Viewer }, threeModule, initialCam] = await Promise.all([
    import('@mkkellogg/gaussian-splats-3d'),
    import('three'),
    fetchInitialCamera(splatId, gateway),
  ]);
  THREE = threeModule;

  const renderer = new threeModule.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(
    container.value.clientWidth || window.innerWidth - 320,
    container.value.clientHeight || window.innerHeight - 44,
  );
  container.value.appendChild(renderer.domElement);

  viewer = new Viewer({
    renderer,
    rootElement: container.value,
    cameraUp: initialCam?.up ?? [0, -1, 0],
    initialCameraPosition: initialCam?.position ?? [0, 0, -3],
    initialCameraLookAt: initialCam?.look_at ?? [0, 0, 0],
    sharedMemoryForWorkers: false,
  });
  await viewer.addSplatScene(objectUrl, { splatAlphaRemovalThreshold: 5, format: 0 });
  loading.value = false;
  viewer.start();

  // Match overlay canvas to WebGL canvas size
  const glCanvas = renderer.domElement;
  const oc = overlayCanvas.value;
  if (oc) {
    oc.width = glCanvas.width;
    oc.height = glCanvas.height;
  }

  await loadHolds(splatId, gateway);
  drawHolds();
}

// ── Click interaction (click vs drag disambiguation) ──────────────────────────

function onMouseDown(e) {
  mdPos = { x: e.clientX, y: e.clientY };
  mdTime = Date.now();
}

function onMouseUp(e) {
  if (!mdPos) return;
  const dx = e.clientX - mdPos.x;
  const dy = e.clientY - mdPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const elapsed = Date.now() - mdTime;
  mdPos = null;

  // Only treat as a click if the pointer barely moved and was quick
  if (dist > 8 || elapsed > 400) return;
  if (!activeProblem.value) return;
  if (!holds.value.length) return;

  // Convert click position to NDC for proximity check
  const rect = overlayCanvas.value.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  const ndcX = (cx / rect.width) * 2 - 1;
  const ndcY = -((cy / rect.height) * 2 - 1);

  // 40px click radius expressed in NDC units
  const threshold = (40 / rect.width) * 2;

  const cam = viewer.camera;
  const tmp = new THREE.Vector3();
  let nearest = null;
  let nearestDist = Infinity;

  for (const hold of holds.value) {
    tmp.copy(hold.center).project(cam);
    if (tmp.z < -1 || tmp.z > 1) continue;
    const d = Math.sqrt((ndcX - tmp.x) ** 2 + (ndcY - tmp.y) ** 2);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = hold;
    }
  }

  if (!nearest || nearestDist > threshold) return;

  // Toggle: if hold belongs to active problem → remove; otherwise → assign (moves from other problems too)
  if (nearest.problemId === activeProblem.value.id) {
    nearest.problemId = null;
  } else {
    nearest.problemId = activeProblem.value.id;
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  const splatId = route.params.splatId;
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${splatId}/splat`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const total = +res.headers.get('Content-Length');
    let received = 0;
    const reader = res.body.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      loadProgress.value = total ? Math.round((received / total) * 100) : 0;
    }

    const objectUrl = URL.createObjectURL(
      new Blob(chunks, { type: 'application/octet-stream' })
    );
    await renderSplat(objectUrl, splatId, gateway);
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    loadError.value = `Failed to load splat: ${err.message}`;
    loading.value = false;
  }
});

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  viewer?.stop?.();
  viewer?.dispose?.();
  viewer = null;
});
</script>

<style scoped>
.hold-assign-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #111;
  overflow: hidden;
}

/* ── Header ── */
.header {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: #0d0d0d;
  border-bottom: 1px solid #1f1f1f;
  flex-shrink: 0;
  z-index: 10;
}

.back-btn {
  color: #9ca3af;
  font-size: 0.82rem;
  text-decoration: none;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #2a2a2a;
  white-space: nowrap;
}
.back-btn:hover { color: #fff; background: #1a1a1a; }

.mode-btn {
  padding: 4px 14px;
  border-radius: 5px;
  border: none;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.mode-btn.is-navigating {
  background: #1e1b4b;
  color: #a5b4fc;
  border: 1px solid #3730a3;
}
.mode-btn.is-navigating:hover { background: #312e81; }
.mode-btn.is-assigning {
  background: #14532d;
  color: #86efac;
  border: 1px solid #166534;
}
.mode-btn.is-assigning:hover { background: #166534; }

.mode-hint {
  font-size: 0.78rem;
  color: #9ca3af;
}
.mode-hint b { font-weight: 600; }
.mode-hint.warn { color: #f59e0b; }

/* ── Body ── */
.body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Viewer ── */
.viewer-wrap {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.overlay-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 5;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: #111;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #9ca3af;
}
.loading-text { font-size: 0.9rem; }
.load-bar {
  width: 180px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}
.load-fill {
  height: 100%;
  background: #7c3aed;
  border-radius: 2px;
  transition: width 0.15s;
}

.load-error {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #7f1d1d;
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: 8px;
  z-index: 25;
  font-size: 0.85rem;
}

.no-holds-hint {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: #fbbf24;
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 0.78rem;
  z-index: 10;
  white-space: nowrap;
  pointer-events: none;
}
.no-holds-hint b { font-weight: 600; }

/* ── Panel ── */
.panel {
  width: 300px;
  flex-shrink: 0;
  background: #0f0f0f;
  border-left: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-section {
  padding: 14px 16px 10px;
  border-bottom: 1px solid #1e1e1e;
}

.panel-hdr {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.panel-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #e5e7eb;
  margin: 0;
}

.new-btn {
  padding: 3px 12px;
  background: #166534;
  color: #86efac;
  border: 1px solid #15803d;
  border-radius: 5px;
  font-size: 0.78rem;
  cursor: pointer;
}
.new-btn:hover { background: #15803d; }

.stats-row {
  font-size: 0.73rem;
  color: #6b7280;
}
.stat-warn { color: #f59e0b; }

/* ── Problem list ── */
.problems-list {
  overflow-y: auto;
  flex-shrink: 0;
  max-height: 220px;
  border-bottom: 1px solid #1e1e1e;
}

.empty-msg {
  padding: 14px 16px;
  font-size: 0.78rem;
  color: #4b5563;
  font-style: italic;
}

.problem-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  cursor: pointer;
  transition: background 0.1s;
}
.problem-row:hover { background: #1a1a1a; }
.problem-row.is-active { background: #1e1e2e; }

.p-swatch {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.p-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.p-name {
  font-size: 0.82rem;
  color: #e5e7eb;
  font-weight: 500;
}
.p-count {
  font-size: 0.7rem;
  color: #6b7280;
}

.p-delete {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 1rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
}
.p-delete:hover { color: #f87171; }

/* ── Active problem holds ── */
.active-section {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid #1e1e1e;
}

.active-hdr {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 6px;
  border-bottom: 1px solid #1e1e1e;
}

.active-name {
  font-size: 0.8rem;
  color: #d1d5db;
  font-weight: 500;
}

.active-holds {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.empty-holds {
  padding: 12px 16px;
  font-size: 0.75rem;
  color: #4b5563;
  font-style: italic;
  line-height: 1.5;
}
.empty-holds b { font-weight: 600; color: #6b7280; }

.h-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 16px;
}
.h-row:hover { background: #1a1a1a; }

.h-swatch {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.h-label {
  flex: 1;
  font-size: 0.75rem;
  color: #9ca3af;
}

.h-remove {
  background: none;
  border: none;
  color: #4b5563;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
}
.h-remove:hover { color: #f87171; }

/* ── Footer ── */
.panel-footer {
  padding: 12px 16px;
  margin-top: auto;
  border-top: 1px solid #1e1e1e;
}

.save-btn {
  width: 100%;
  padding: 8px;
  background: #1f2937;
  color: #6b7280;
  border: 1px solid #374151;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
