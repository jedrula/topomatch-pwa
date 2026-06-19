<template>
  <div class="hold-assign-view">
    <!-- Header -->
    <header class="header">
      <RouterLink
        class="back-btn"
        :to="{ name: 'splat-viewer', params: { splatId: route.params.splatId } }"
      >← Viewer</RouterLink>
      <span v-if="cleanupMode" class="mode-hint cleanup-hint">
        Cleanup — {{ cleanupView === 'excluded' ? 'click a dot to restore it' : 'click a dot to exclude it' }}
      </span>
      <span v-else-if="activeProblem" class="mode-hint">
        Click holds to assign/remove from
        <b :style="{ color: activeProblem.color }">{{ activeProblem.name }}</b>
      </span>
      <span v-else-if="holds.length" class="mode-hint warn">
        Create or select a problem first →
      </span>
    </header>

    <div class="body">
      <!-- 3D Viewer -->
      <div
        class="viewer-wrap"
        :style="{ cursor: cleanupMode ? 'pointer' : activeProblem ? 'crosshair' : 'default' }"
      >
        <div v-if="loading" class="loading-overlay">
          <div class="loading-text">Loading splat… {{ loadProgress }}%</div>
          <div class="load-bar"><div class="load-fill" :style="{ width: loadProgress + '%' }" /></div>
        </div>
        <div v-if="loadError" class="load-error">{{ loadError }}</div>
        <div ref="container" class="canvas-container" />
        <canvas
          ref="overlayCanvas"
          class="overlay-canvas"
          style="pointer-events: none"
        />
        <div v-if="!loading && !holds.length && !loadError" class="no-holds-hint">
          No holds detected yet — open the Viewer and run <b>Segment</b> first
        </div>
      </div>

      <!-- Right panel -->
      <aside class="panel">

        <!-- ── Cleanup mode ── -->
        <template v-if="cleanupMode">
          <div class="panel-section">
            <div class="panel-hdr">
              <h3 class="panel-title">Filter Holds</h3>
              <button class="done-btn" @click="exitCleanupMode">Done</button>
            </div>
            <div class="stats-row">
              <span class="stat-excluded">{{ blacklistedCount }} excluded</span>
              &nbsp;·&nbsp;
              {{ holds.length - blacklistedCount }} kept
              &nbsp;·&nbsp;
              {{ holds.length }} total
            </div>
          </div>

          <div class="cleanup-body">
            <div class="view-toggle">
              <button
                class="toggle-btn"
                :class="{ active: cleanupView === 'excluded' }"
                @click="cleanupView = 'excluded'"
              >Excluded ({{ blacklistedCount }})</button>
              <button
                class="toggle-btn"
                :class="{ active: cleanupView === 'included' }"
                @click="cleanupView = 'included'"
              >Kept ({{ holds.length - blacklistedCount }})</button>
            </div>
            <p class="cleanup-tip">
              {{ cleanupView === 'excluded'
                ? 'These holds are filtered out. Click a dot to restore it.'
                : 'These holds are active. Click a dot to exclude it.' }}
            </p>
            <div class="cleanup-actions">
              <button class="action-btn danger" @click="resetBlacklist">Reset all</button>
            </div>
          </div>
        </template>

        <!-- ── Normal mode ── -->
        <template v-else>
          <div class="panel-section">
            <div class="panel-hdr">
              <h3 class="panel-title">Boulder Problems</h3>
              <button class="new-btn" @click="createProblem">+ New</button>
            </div>
            <div class="stats-row">
              {{ assignedHoldCount }}/{{ holds.length - blacklistedCount }} holds assigned
              <span v-if="holds.length === 0" class="stat-warn"> · No holds loaded</span>
              <span v-else-if="blacklistedCount" class="stat-filtered"> · {{ blacklistedCount }} filtered</span>
            </div>
          </div>

          <!-- Problem list with inline accordion holds -->
          <div class="problems-list">
            <div v-if="!problems.length" class="empty-msg">
              No problems yet. Click "+ New" to start.
            </div>
            <template v-for="p in problems" :key="p.id">
              <div
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
              <div v-if="activeProblemId === p.id" class="accordion-holds" :style="{ borderLeftColor: p.color }">
                <div v-if="!holdsForProblem(p.id).length" class="empty-holds">
                  Click colored dots in the viewer to assign holds
                </div>
                <div
                  v-for="h in holdsForProblem(p.id)"
                  :key="h.id"
                  class="h-row"
                >
                  <div class="h-swatch" :style="{ background: h.color }" />
                  <span class="h-label">Hold {{ h.id + 1 }}</span>
                  <button class="h-remove" @click.stop="unassignHold(h.id)" title="Remove from problem">×</button>
                </div>
              </div>
            </template>
          </div>

          <!-- Footer -->
          <div class="panel-footer">
            <button
              class="filter-btn"
              :disabled="!holds.length"
              @click="enterCleanupMode"
              title="Filter out non-hold objects"
            >Filter Holds{{ blacklistedCount ? ` (${blacklistedCount})` : '' }}</button>
            <button class="save-btn" disabled title="Firestore save coming in next iteration">
              💾 Save (coming soon)
            </button>
          </div>
        </template>

      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
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
let nextProblemNum = 1;

let viewer = null;
let THREE = null;
let rafId = null;
let holdClickHandler = null;

// World-space click radius in scene units.
const WORLD_CLICK_RADIUS = 0.15;

const PROBLEM_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

// ── Cleanup / blacklist state ──────────────────────────────────────────────────
// blacklisted is a plain Set (non-reactive — accessed directly in RAF drawHolds).
// blacklistedCount mirrors its size reactively for the template.
const cleanupMode = ref(false);
const cleanupView = ref('excluded'); // 'excluded' | 'included'
let blacklisted = new Set();
const blacklistedCount = ref(0);

function blacklistSet(id, exclude) {
  if (exclude) blacklisted.add(id);
  else blacklisted.delete(id);
  blacklistedCount.value = blacklisted.size;
}

function enterCleanupMode() {
  activeProblemId.value = null;
  cleanupView.value = 'excluded';
  cleanupMode.value = true;
}

function exitCleanupMode() {
  cleanupMode.value = false;
  const splatId = route.params.splatId;
  try {
    localStorage.setItem(
      `topomatch-hold-blacklist-${splatId}`,
      JSON.stringify([...blacklisted])
    );
  } catch {}
}

function resetBlacklist() {
  blacklisted = new Set();
  blacklistedCount.value = 0;
}

// ── Computed ──────────────────────────────────────────────────────────────────

const activeProblem = computed(() =>
  problems.value.find(p => p.id === activeProblemId.value) ?? null
);

const assignedHoldCount = computed(() =>
  holds.value.filter(h => h.problemId !== null && !blacklisted.has(h.id)).length
);

function holdsForProblem(pid) {
  return holds.value.filter(h => h.problemId === pid && !blacklisted.has(h.id));
}

// ── Problem management ────────────────────────────────────────────────────────

function createProblem() {
  const id = `p-${Date.now()}`;
  const color = PROBLEM_COLORS[(nextProblemNum - 1) % PROBLEM_COLORS.length];
  problems.value.push({ id, name: `Problem ${nextProblemNum}`, color });
  nextProblemNum++;
  activeProblemId.value = id;
}

function setActiveProblm(pid) {
  activeProblemId.value = activeProblemId.value === pid ? null : pid;
}

function deleteProblem(pid) {
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
    window.__holds = holds.value; // tmp debug
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
  const dpr = window.devicePixelRatio || 1;
  const isCleanup = cleanupMode.value;
  const viewExcluded = cleanupView.value === 'excluded';

  for (const hold of holds.value) {
    const isBlacklisted = blacklisted.has(hold.id);

    // Visibility filter
    if (isCleanup) {
      if (viewExcluded && !isBlacklisted) continue;
      if (!viewExcluded && isBlacklisted) continue;
    } else {
      if (isBlacklisted) continue;
    }

    tmp.copy(hold.center).project(cam);
    if (tmp.z < -1 || tmp.z > 1) continue;

    const sx = ((tmp.x + 1) / 2) * W;
    const sy = ((-tmp.y + 1) / 2) * H;
    if (sx < -30 || sx > W + 30 || sy < -30 || sy > H + 30) continue;

    if (isCleanup) {
      // Excluded dots: gray fill + red border
      // Included dots: their color + green border
      const r = 8;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      if (viewExcluded) {
        ctx.fillStyle = '#33333388';
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.stroke();
        // × mark
        const m = 4 * dpr;
        ctx.beginPath();
        ctx.moveTo(sx - m, sy - m); ctx.lineTo(sx + m, sy + m);
        ctx.moveTo(sx + m, sy - m); ctx.lineTo(sx - m, sy + m);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5 * dpr;
        ctx.stroke();
      } else {
        ctx.fillStyle = (hold.color ?? '#ffffff') + '99';
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      // ID label
      ctx.font = `bold ${9 * dpr}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(String(hold.id), sx + (r + 2) * dpr, sy + 3 * dpr);
      continue;
    }

    // Normal mode rendering
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
      fillColor = (hold.color ?? '#ffffff') + '66';
      strokeColor = (hold.color ?? '#aaaaaa') + 'aa';
      r = 8;
    }

    // World-space click ring (debug)
    if (activeProblemId.value !== null && cam.isPerspectiveCamera) {
      const worldDist = cam.position.distanceTo(hold.center);
      const fovRad = cam.fov * Math.PI / 180;
      const screenR = WORLD_CLICK_RADIUS * (H / 2) / (Math.tan(fovRad / 2) * worldDist);
      ctx.beginPath();
      ctx.arc(sx, sy, screenR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,0,0.4)';
      ctx.lineWidth = 1 * dpr;
      ctx.setLineDash([4 * dpr, 4 * dpr]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = isActiveProblem ? 2.5 : 1.5;
    ctx.stroke();

    // ID label
    ctx.font = `bold ${9 * dpr}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillText(String(hold.id), sx + (r + 2) * dpr, sy + 3 * dpr);
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
  window.__viewer = viewer; // tmp debug

  holdClickHandler = buildHoldClickHandler();
  renderer.domElement.addEventListener('pointerdown', holdClickHandler.onPointerDown, { capture: true });
  renderer.domElement.addEventListener('pointerup', holdClickHandler.onPointerUp, { capture: true });

  const oc = overlayCanvas.value;
  if (oc) {
    oc.width = renderer.domElement.width;
    oc.height = renderer.domElement.height;
  }

  await loadHolds(splatId, gateway);

  // Restore persisted blacklist
  try {
    const saved = localStorage.getItem(`topomatch-hold-blacklist-${splatId}`);
    if (saved) {
      const ids = JSON.parse(saved);
      blacklisted = new Set(ids);
      blacklistedCount.value = blacklisted.size;
    }
  } catch {}

  drawHolds();
}

// ── Click interaction ──────────────────────────────────────────────────────────
// Detect hold at pointerdown (camera matches what user sees); apply on pointerup
// only if it was a clean tap (no drag, <400ms).

function buildHoldClickHandler() {
  let downPos = null;
  let downTime = null;
  let pendingHold = null;

  function findNearestHold(clientX, clientY, canvasEl) {
    if (!holds.value.length || !viewer?.camera) return null;
    if (!cleanupMode.value && !activeProblem.value) return null;

    const rect = canvasEl.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const cam = viewer.camera;
    const isPerspective = cam.isPerspectiveCamera;
    const fovRad = isPerspective ? cam.fov * Math.PI / 180 : 0;
    const tmp = new THREE.Vector3();
    let nearest = null;
    let nearestDist = Infinity;
    const isCleanup = cleanupMode.value;
    const viewExcluded = cleanupView.value === 'excluded';

    for (const hold of holds.value) {
      // Only consider currently visible holds
      const isBlacklisted = blacklisted.has(hold.id);
      if (isCleanup) {
        if (viewExcluded && !isBlacklisted) continue;
        if (!viewExcluded && isBlacklisted) continue;
      } else {
        if (isBlacklisted) continue;
      }

      tmp.copy(hold.center).project(cam);
      if (tmp.z < -1 || tmp.z > 1) continue;
      const sx = (tmp.x + 1) / 2 * rect.width;
      const sy = (-tmp.y + 1) / 2 * rect.height;
      const d = Math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2);

      const threshold = isCleanup
        ? 24
        : isPerspective
          ? WORLD_CLICK_RADIUS * (rect.height / 2) / (Math.tan(fovRad / 2) * cam.position.distanceTo(hold.center))
          : 40;

      if (d < threshold && d < nearestDist) { nearestDist = d; nearest = hold; }
    }
    return nearest;
  }

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    downPos = { x: e.clientX, y: e.clientY };
    downTime = Date.now();
    pendingHold = findNearestHold(e.clientX, e.clientY, e.target);
  };

  const onPointerUp = (e) => {
    if (e.button !== 0 || !downPos) return;
    const nearest = pendingHold;
    pendingHold = null;
    const dx = e.clientX - downPos.x;
    const dy = e.clientY - downPos.y;
    const elapsed = Date.now() - downTime;
    downPos = null;

    if (Math.sqrt(dx * dx + dy * dy) > 8 || elapsed > 400) return;
    if (!nearest) return;

    // Suppress viewer's focus jump for clean clicks on holds
    const focusHandler = viewer.mouseUpListener;
    if (focusHandler) {
      e.target.removeEventListener('pointerup', focusHandler, false);
      setTimeout(() => { viewer?.mouseUpListener && e.target.addEventListener('pointerup', viewer.mouseUpListener, false); }, 0);
    }

    if (cleanupMode.value) {
      blacklistSet(nearest.id, !blacklisted.has(nearest.id));
      return;
    }

    if (!activeProblem.value) return;
    if (nearest.problemId === activeProblem.value.id) {
      nearest.problemId = null;
    } else {
      nearest.problemId = activeProblem.value.id;
    }
  };

  return { onPointerDown, onPointerUp };
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
  if (holdClickHandler) {
    const canvas = container.value?.querySelector('canvas');
    canvas?.removeEventListener('pointerdown', holdClickHandler.onPointerDown, { capture: true });
    canvas?.removeEventListener('pointerup', holdClickHandler.onPointerUp, { capture: true });
  }
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

.mode-hint {
  font-size: 0.78rem;
  color: #9ca3af;
}
.mode-hint b { font-weight: 600; }
.mode-hint.warn { color: #f59e0b; }
.mode-hint.cleanup-hint { color: #60a5fa; }

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

.done-btn {
  padding: 3px 12px;
  background: #1e3a5f;
  color: #93c5fd;
  border: 1px solid #1d4ed8;
  border-radius: 5px;
  font-size: 0.78rem;
  cursor: pointer;
}
.done-btn:hover { background: #1d4ed8; color: #fff; }

.stats-row {
  font-size: 0.73rem;
  color: #6b7280;
}
.stat-warn { color: #f59e0b; }
.stat-filtered { color: #6b7280; }
.stat-excluded { color: #f87171; font-weight: 500; }

/* ── Cleanup mode body ── */
.cleanup-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.view-toggle {
  display: flex;
  gap: 0;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #2a2a2a;
}

.toggle-btn {
  flex: 1;
  padding: 6px 8px;
  background: #1a1a1a;
  color: #6b7280;
  border: none;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
  text-align: center;
}
.toggle-btn:first-child { border-right: 1px solid #2a2a2a; }
.toggle-btn.active { background: #1e3a5f; color: #93c5fd; font-weight: 600; }
.toggle-btn:not(.active):hover { background: #222; color: #9ca3af; }

.cleanup-tip {
  font-size: 0.72rem;
  color: #6b7280;
  line-height: 1.4;
  margin: 0;
}

.cleanup-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.action-btn {
  width: 100%;
  padding: 7px 10px;
  background: #1a1a1a;
  color: #9ca3af;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  font-size: 0.78rem;
  cursor: pointer;
  text-align: left;
}
.action-btn:hover { background: #222; color: #e5e7eb; }
.action-btn.danger { color: #f87171; }
.action-btn.danger:hover { background: #2d1212; border-color: #7f1d1d; color: #fca5a5; }

/* ── Problem list ── */
.problems-list {
  overflow-y: auto;
  flex: 1;
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

/* ── Accordion holds ── */
.accordion-holds {
  border-left: 3px solid #555;
  background: #0a0a14;
  padding: 4px 0 6px;
  margin-bottom: 2px;
}

.empty-holds {
  padding: 8px 14px;
  font-size: 0.73rem;
  color: #4b5563;
  font-style: italic;
  line-height: 1.4;
}

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
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-btn {
  width: 100%;
  padding: 8px;
  background: #1a1a2e;
  color: #818cf8;
  border: 1px solid #3730a3;
  border-radius: 6px;
  font-size: 0.82rem;
  cursor: pointer;
}
.filter-btn:hover { background: #1e1b4b; color: #a5b4fc; }
.filter-btn:disabled { opacity: 0.4; cursor: not-allowed; }

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
