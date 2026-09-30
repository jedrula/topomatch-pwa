<template>
  <div class="walk2-view">
    <canvas ref="canvasEl" class="walk2-canvas"></canvas>
    <div v-if="captureFov && camIntr" class="walk2-capframe"
         :style="{ aspectRatio: `${camIntr.width} / ${camIntr.height}` }"></div>

    <div v-if="!isTouch" class="walk2-hud" :class="{ collapsed: !hudOpen }">
      <div class="hud-head">
        <span class="hud-title">Walk</span>
        <code class="hud-id">{{ splatId }}</code>
        <span class="tag">SOG</span>
        <span v-if="sizeInfo" class="hud-size">{{ sizeInfo.split(' (')[0] }}</span>
        <button class="hud-toggle" :title="hudOpen ? 'hide panel' : 'show panel'" @click="hudOpen = !hudOpen">
          {{ hudOpen ? '–' : '+' }}</button>
      </div>

      <template v-if="hudOpen">
        <div class="hud-keys"><kbd>WASD</kbd> move <kbd>Shift</kbd> sprint <kbd>Space</kbd>/<kbd>C</kbd> up/down <kbd>Esc</kbd> release</div>

        <section class="hud-sec">
          <h4>Move</h4>
          <label class="hud-slider"><span>Look</span>
            <input type="range" min="0.02" max="0.5" step="0.01" v-model.number="sens" /><em>{{ sens.toFixed(2) }}</em></label>
          <label class="hud-slider"><span>Speed</span>
            <input type="range" min="0.2" max="6" step="0.1" v-model.number="speed" /><em>{{ speed.toFixed(1) }}</em></label>
        </section>

        <section class="hud-sec">
          <h4>Carpet <small title="carpet-walk keeps you where the capture camera actually went -- no wall clipping">ⓘ</small></h4>
          <div class="hud-chips">
            <label class="chip" :class="{ on: carpetWalk }"><input type="checkbox" v-model="carpetWalk" />Stay on path</label>
            <label class="chip" :class="{ on: showCarpet }"><input type="checkbox" v-model="showCarpet" />Show path</label>
            <label class="chip" :class="{ on: carpetVideo, off: !videoReady }" :title="videoReady ? 'replay the capture' : 'not available'">
              <input type="checkbox" v-model="carpetVideo" :disabled="!videoReady" />Replay</label>
          </div>
          <label v-if="carpetWalk" class="hud-slider"><span>Radius</span>
            <input type="range" min="0.1" max="6" step="0.05" v-model.number="radius" /><em>{{ radius.toFixed(2) }}</em></label>
          <div v-if="carpetVideo && videoReady" class="walk2-transport">
            <button @click="tourStep(-1)" title="previous photograph">⏮</button>
            <button class="play" @click="playing = !playing">{{ playing ? '⏸' : '▶' }}</button>
            <button @click="tourStep(1)" title="next photograph">⏭</button>
            <button v-for="r in RATES" :key="r" :class="{ on: rate === r }" @click="rate = r">{{ r }}×</button>
            <span class="walk2-count">{{ videoInfo }}</span>
          </div>
          <input v-if="carpetVideo && videoReady" class="walk2-scrub" type="range" min="0"
                 :max="Math.max(tourTotal - 1, 0)" :value="tourIdx" @input="tourSeek(+$event.target.value)" />
        </section>

        <section class="hud-sec">
          <h4>View</h4>
          <div class="hud-chips">
            <label class="chip" :class="{ on: showCams }" title="capture cameras; orange = they see what you look at; click one to open it in Compare">
              <input type="checkbox" v-model="showCams" />Cameras<b v-if="showCams" class="badge" title="cameras that see what you are looking at">{{ seeCount }}</b></label>
            <label class="chip" :class="{ on: captureFov, off: !camIntr }"
                   :title="camIntr ? `view through the capture lens: ${camIntr.vfov_deg.toFixed(1)}° vertical, ${camIntr.width}×${camIntr.height}` : 'no intrinsics for this splat'">
              <input type="checkbox" v-model="captureFov" :disabled="!camIntr" />Capture lens</label>
            <label class="chip" :class="{ on: showSky }"><input type="checkbox" v-model="showSky" />Sky</label>
          </div>
          <span v-if="loopLabel" class="walk2-loop">{{ loopLabel }}</span>
        </section>

        <div class="hud-foot">
          <span v-if="distInfo">{{ distInfo }}</span>
          <span v-if="upLabel">up {{ upLabel }}</span>
        </div>
      </template>
    </div>

    <!-- Flag a POOR view (Andrzej 2026-09-30): saved with camera + screenshot, reopenable, analysed by
         experiments/smallarea/analyze_flags.py. The camera here is in the COLMAP frame (see applyCamera). -->
    <div class="walk2-flags">
      <button class="walk2-flag-btn" :disabled="flagging" @click="flagOpen = !flagOpen">
        {{ flagging ? 'Flagging…' : '⚑ Flag view' }}</button>
      <select v-if="flags.length" class="walk2-flag-list" @change="openFlag($event.target.value); $event.target.value = ''">
        <option value="">⚑ {{ flags.length }} flagged</option>
        <option v-for="f in flags" :key="f.id" :value="f.id">#{{ f.id }} {{ f.note || '(no note)' }}</option>
      </select>
      <div v-if="flagOpen" class="walk2-flag-panel">
        <input v-model="flagNote" class="walk2-flag-note" placeholder="What looks wrong? (optional)"
               @keydown.stop @keyup.stop @keyup.enter="flagView" />
        <button :disabled="flagging" @click="flagView">Save flag</button>
        <button @click="flagOpen = false">Cancel</button>
      </div>
      <span v-if="flagMsg" class="walk2-flag-msg">{{ flagMsg }}</span>
      <div v-if="shownFlag" class="walk2-flag-shown">
        <div>⚑ #{{ shownFlag.id }} — {{ shownFlag.note || '(no note)' }} <button @click="shownFlag = null">×</button></div>
        <img v-if="shownFlagImg" :src="shownFlagImg" alt="what was flagged" />
      </div>
    </div>

    <CaptureJudgeReport v-if="judgeOpen" :job-id="splatId" @close="judgeOpen = false" />

    <!-- What am I looking at? The job's note (PRE / POST), from GET .../note -->
    <div v-if="jobNote && noteShown" class="walk2-note-box" :class="{ open: noteOpen }">
      <div class="nb-head"><b>Note</b>
        <button v-if="noteLong" @click="noteOpen = !noteOpen">{{ noteOpen ? 'less' : 'more' }}</button>
        <button title="hide" @click="noteShown = false">×</button></div>
      <div class="nb-body"><p v-for="(l, i) in noteLines" :key="i"><em v-if="l.tag" :class="l.tag">{{ l.tag }}</em>{{ l.text }}</p></div>
    </div>

    <div class="walk2-status" :class="{ err: !!error }">
      {{ error || status }}<span v-if="!error && progressLabel"> — {{ progressLabel }}</span>
      <div v-if="!error && loading" class="walk2-progress">
        <div class="walk2-progress-fill" :style="{ width: progressPct + '%' }"></div>
      </div>
    </div>

    <pre v-if="debug" class="walk2-debug">{{ dbg }}</pre>

    <div v-if="showHint" class="walk2-hint">
      {{ isTouch ? 'drag to look · stick to walk' : 'click to look around' }}
      <span class="walk2-build">build {{ buildStamp }}</span>
    </div>

    <!-- Touch layer -->
    <div v-if="isTouch" class="walk2-touch">
      <div ref="stickEl" class="walk2-stick">
        <div class="walk2-stick-knob"
             :style="{ transform: `translate(${stickKnob.x}px, ${stickKnob.y}px)` }"></div>
      </div>
      <div class="walk2-vbtns">
        <button @touchstart.passive="touchUp = true" @touchend="touchUp = false"
                @touchcancel="touchUp = false">▲</button>
        <button @touchstart.passive="touchDown = true" @touchend="touchDown = false"
                @touchcancel="touchDown = false">▼</button>
      </div>
      <div v-if="atEdge" class="walk2-edge">edge of captured area</div>
    </div>
    <!-- Top-right: a hamburger menu for navigation, with the flag controls stacked BELOW it (they used to
         sit on top of the old "walk v1" link). -->
    <button class="walk2-menu-btn walk2-star-btn" :class="{ on: starred }" :disabled="starBusy"
            :title="starred == null ? 'Star state not loaded yet' : starred ? 'Starred — click to unstar' : 'Star this run'"
            @click="toggleStar">{{ starred ? '★' : starred == null ? '☆?' : '☆' }}</button>
    <div v-if="!isTouch" class="walk2-menu" @keydown.esc="menuOpen = false">
      <button class="walk2-menu-btn" :class="{ open: menuOpen }" aria-label="menu" @click="menuOpen = !menuOpen">☰</button>
      <nav v-if="menuOpen" class="walk2-menu-list" @click="menuOpen = false">
        <RouterLink :to="{ name: 'splat-viewer', params: { splatId } }">Splat viewer</RouterLink>
        <RouterLink :to="{ name: 'splat-walk', params: { splatId } }">Walk v1 (.ply)</RouterLink>
        <a href="#" title="post-SfM judge of every photo: texture, links to neighbours, duplicates" @click.prevent="openJudge">
          Judge capture</a>
        <a href="#" title="opens Compare with every capture camera that sees part of your current view" @click.prevent="compareSeen">
          Compare what I see</a>
        <RouterLink :to="{ name: 'splat-compare', params: { jobId: splatId } }">Compare (all frames)</RouterLink>
        <hr />
        <RouterLink :to="{ name: 'splat-history' }">← History</RouterLink>
      </nav>
    </div>
    <RouterLink v-else :to="{ name: 'splat-history' }" class="walk2-back-btn"
                aria-label="back to history">←</RouterLink>
  </div>
</template>

<script setup>
// Walk/Fly v2 — standalone POC on PlayCanvas + SOG.
//
// Why a second viewer rather than changing SplatWalkView: the mkkellogg viewer we use
// everywhere else cannot load any compressed format we can actually produce. It accepts
// SPZ v1-v2 only (`header.version > 2` is a hard reject in deserializePackedGaussians)
// while @playcanvas/splat-transform writes v3/v4, and it has no .ksplat encoder in the
// npm package. So the download stays a 150-250 MB .ply there.
//
// PlayCanvas reads SOG, which is the compression win without the quality loss:
//   149.4 MB .ply -> 10.9 MB .sog (13.7x) on a 632,862-splat export, ALL 45 f_rest
//   spherical-harmonic coefficients retained (shN_centroids + shN_labels in the zip).
//   Measured fidelity, nearest-neighbour matched because SOG REORDERS the splats:
//   position 0.176 mm median, colour DC 0.11% of range, scale 0.13%, opacity 0.89%,
//   SH 3.1-3.6%, rotation 0.685 deg median.
//
// ORIENTATION is settled empirically (Chrome, 2026-08-11) rather than derived — see the
// camera block below for the three things that were tried and what each did.
import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getGateway } from '../config/gateway.js';
import CaptureJudgeReport from '../components/CaptureJudgeReport.vue';

const route = useRoute();
const splatId = route.params.splatId;
const router = useRouter();
const canvasEl = ref(null);
const status = ref('loading…');
const error = ref('');
const loading = ref(true);
const progressPct = ref(0);
const progressLabel = ref('');
const showHint = ref(false);
const speed = ref(1.5);
const sizeInfo = ref('');
const sens = ref(0.14);
const upLabel = ref('');
// carpet-walk: confine the viewer to within `radius` of a camera centre. See the clamp below.
const carpetWalk = ref(true);
// Back to 0.6 m. It was raised to 1.5 while chasing a stick bug on the theory that a tight
// clamp was pinning the camera; the real cause was the hit-test, so the loosening was
// unnecessary and it let the viewer drift close enough to walls to look wrong. 0.6 is also
// what walk v1 shipped with.
const radius = ref(0.6);
// Draw where the capture actually went. The clamp below has always been invisible: you could
// be held at the edge of the captured area with nothing on screen saying where that edge is,
// which reads as broken controls rather than as a boundary.
const showCarpet = ref(false);
// Capture cameras as frustums; clicking one opens /splat/:id/compare?frame=<key> for that frame.
const showCams = ref(false);
const hudOpen = ref(true);
const menuOpen = ref(false);
const jobNote = ref('');
// Star, same marker as /history (PUT .../star). null = not known yet (GET .../{job} failed or pending).
const starred = ref(null);
const starBusy = ref(false);
let starBase = '';
async function toggleStar() {
  if (!starBase) return;
  const next = !starred.value;
  starBusy.value = true;
  try {
    const r = await fetch(`${starBase}/star`, { method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                               body: JSON.stringify({ starred: next }) });
    if (!r.ok) throw new Error(`star ${r.status}`);
    starred.value = next;
  } catch (e) {
    console.warn('[walk2] star failed', e);      // keep the old state: a star that did not persist must not show
  } finally {
    starBusy.value = false;
  }
}
const noteShown = ref(true);
const noteOpen = ref(false);
const noteLines = computed(() => jobNote.value.split('\n').filter(Boolean).map((l) => {
  const m = l.match(/^(PRE|POST):\s*(.*)$/);
  return m ? { tag: m[1], text: m[2] } : { tag: '', text: l };
}));
const noteLong = computed(() => jobNote.value.length > 220 || noteLines.value.length > 2);
const seeCount = ref(0);
// "capture FOV": view with the capture camera's own vertical FOV and see its frame (4:3 guide).
const captureFov = ref(false);
const camIntr = ref(null);      // {width, height, fx, fy, vfov_deg, hfov_deg} from /intrinsics
const VIEW_FOV = 65;
// Drawn sky instead of captured sky: free, and it costs no geometry.
const showSky = ref(true);
const loopLabel = ref('');
// Retrace the capture: walk the path the camera walked, looking roughly where it looked.
// The speed slider drives it, so the same control means the same thing in both modes.
const carpetVideo = ref(false);
const videoReady = ref(false);
const videoInfo = ref('');
// Transport for the pose tour. The tour visits every photograph in capture order:
// glide to the next pose, then sit on it long enough to actually look at it.
const playing = ref(true);
const rate = ref(1);
const RATES = [0.5, 1, 2, 4, 8];
const tourIdx = ref(0);
const tourTotal = ref(0);
let tourSeek = () => {};
let tourStep = () => {};
const distInfo = ref('');
let reclamp = () => {};
// Touch controls. isTouch gates the whole on-screen layer: on a desktop it would just be
// clutter over the canvas, and the keyboard path is strictly better there.
const buildStamp = __BUILD_STAMP__;
const debug = ref(false);
const dbg = ref('');
// Set while the clamp is actively holding the camera back, so being pinned is visible instead
// of looking like dead controls.
const atEdge = ref(false);
const isTouch = ref(false);
const stickEl = ref(null);
const stickRef = ref(null);
const stickKnob = ref({ x: 0, y: 0 });
const touchUp = ref(false);
const touchDown = ref(false);

let app = null;
let splatEntity = null;
let flagCam = null;             // {get, set} into the camera state below, for flagging
let camPick = null;             // {pick, open}: click-a-camera -> Compare

const flagOpen = ref(false);
const flagNote = ref('');
const flagging = ref(false);
const flagMsg = ref('');
const flags = ref([]);
const shownFlag = ref(null);
const shownFlagImg = ref('');

async function flagsUrl(suffix = '') {
  return `${await getGateway()}/topowall/api/v1/video-to-splat/${splatId}/flags${suffix}`;
}

async function loadFlags() {
  try {
    const res = await fetch(await flagsUrl());
    if (res.ok) flags.value = await res.json();
  } catch (err) { console.warn('[flags] could not load:', err); }
}

// PlayCanvas does not preserve the drawing buffer, so the screenshot is taken at frame end.
function grabFrame() {
  return new Promise((resolve) => {
    if (!app) return resolve(null);
    app.once('frameend', () => {
      try { resolve(canvasEl.value.toDataURL('image/jpeg', 0.9)); } catch { resolve(null); }
    });
    app.renderNextFrame = true;
  });
}

async function flagView() {
  if (!flagCam || flagging.value) return;
  flagging.value = true; flagMsg.value = '';
  try {
    // format is the viewer's numeric scene format on the server; walk2's frame is in camera.frame ('colmap').
    const body = { camera: { ...flagCam.get(), viewer: 'walk2-sog' }, note: flagNote.value, format: null, image: await grabFrame() };
    const res = await fetch(await flagsUrl(), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rec = await res.json();
    flags.value = [...flags.value, rec];
    flagMsg.value = `Flag #${rec.id} saved`; flagNote.value = '';
    setTimeout(() => { flagOpen.value = false; flagMsg.value = ''; }, 1500);
  } catch (err) {
    flagMsg.value = 'Flag failed: ' + err.message;
  } finally { flagging.value = false; }
}

// ---- capture judge report (component shared with /history) ----
const judgeOpen = ref(false);
function openJudge() {
  menuOpen.value = false; judgeOpen.value = true;
  if (document.pointerLockElement) document.exitPointerLock?.();
}

async function compareSeen() {
  menuOpen.value = false;
  if (!camPick) return;
  const keys = (await camPick.keys(camPick.seen())).slice(0, 12);     // Compare renders each one: keep it snappy
  if (document.pointerLockElement) document.exitPointerLock?.();
  router.push({ name: 'splat-compare', params: { jobId: splatId }, query: keys.length ? { frames: keys.join(',') } : {} });
}

async function openFlag(id) {
  const f = flags.value.find((x) => String(x.id) === String(id));
  if (!f || !flagCam) return;
  flagCam.set(f.camera);
  shownFlag.value = f;
  shownFlagImg.value = f.image ? await flagsUrl(`/${f.id}/image`) : '';
}
let objectUrl = null;
let cleanupFns = [];

onMounted(async () => {
  // ?touch=1 forces the layer on: it makes the mobile control scheme testable on a desktop
  // (and reviewable without a phone), which is otherwise only reachable via device emulation.
  debug.value = new URLSearchParams(location.search).has('debug');
  isTouch.value = window.matchMedia?.('(pointer: coarse)').matches
    || navigator.maxTouchPoints > 0
    || new URLSearchParams(location.search).has('touch');
  try {
    const gateway = await getGateway();
    const base = `${gateway}/topowall/api/v1/video-to-splat/${splatId}`;

    // carpet is optional here — it only seeds a sensible start pose
    let carpet = null;
    try {
      const r = await fetch(`${base}/carpet`);
      if (r.ok) carpet = await r.json();
    } catch { /* fly from the origin instead */ }

    // First request for a splat runs k-means over the SH palette (~70 s for 600k
    // splats) then caches, so this can be slow once and instant thereafter.
    status.value = 'downloading splat (.sog)…';
    // The server converts .ply -> .sog INSIDE this request the first time (k-means, ~70 s per 600k splats) and
    // only then starts sending, so a silent wait means "converting", not "stuck". Say so after 3 s, with a clock.
    const t0 = performance.now();
    const prepTimer = setInterval(() => {
      const s = Math.round((performance.now() - t0) / 1000);
      if (s >= 3) {
        status.value = 'preparing the web version of this splat — the first open converts it (usually 1–2 min)';
        progressLabel.value = `${s} s`;
      }
    }, 1000);
    let res;
    try { res = await fetch(`${base}/sog`); } finally { clearInterval(prepTimer); }
    status.value = 'downloading splat (.sog)…';
    progressLabel.value = '';
    if (!res.ok) throw new Error(`sog ${res.status} — ${(await res.text()).slice(0, 200)}`);
    const total = Number(res.headers.get('Content-Length')) || 0;
    let bytes;
    if (res.body && total) {
      const reader = res.body.getReader();
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        progressPct.value = Math.round((received / total) * 100);
        progressLabel.value = `${(received / 1e6).toFixed(1)} / ${(total / 1e6).toFixed(1)} MB`;
      }
      bytes = new Blob(chunks);
    } else {
      progressLabel.value = 'downloading…';
      bytes = await res.blob();
    }
    sizeInfo.value = `${(bytes.size / 1e6).toFixed(1)} MB SOG (vs ~150 MB .ply)`;
    objectUrl = URL.createObjectURL(bytes);
    progressPct.value = 100;

    const pc = await import('playcanvas');
    status.value = 'processing splat…';

    app = new pc.Application(canvasEl.value, {
      graphicsDeviceOptions: { antialias: false, alpha: false },
    });
    app.setCanvasFillMode(pc.FILLMODE_NONE);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    const resize = () => {
      const r = canvasEl.value.getBoundingClientRect();
      app.resizeCanvas(r.width, r.height);
    };
    resize();
    window.addEventListener('resize', resize);
    cleanupFns.push(() => window.removeEventListener('resize', resize));

    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.05, 0.05, 0.07),
      farClip: 500,
      fov: 65,
    });
    app.root.addChild(camera);

    // A splat only contains what a camera saw, and every aerial pose we fly points DOWN, so
    // the upper hemisphere is empty and looking up is black: measured 18.8% black at +45 deg
    // and 44.5% at +80 on the drone capture. Capturing it instead is not free -- adding 80
    // upward frames filled the dome but folded the reconstruction from 99.6% to 71.3% of
    // cameras in one consistent block, because sky sits at infinity and carries no parallax.
    // So the background is drawn, not reconstructed. Horizon colour below, sky above, chosen
    // to sit behind the splat rather than compete with it.
    const skyTex = (() => {
      const c = document.createElement('canvas');
      c.width = 4; c.height = 256;
      const g = c.getContext('2d').createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.00, '#7fa6d0');     // zenith
      g.addColorStop(0.55, '#b9cbdd');
      g.addColorStop(0.80, '#cfd6da');     // haze at the horizon
      g.addColorStop(1.00, '#5d6068');     // below the horizon, ground-ish
      const ctx = c.getContext('2d');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
      const t = new pc.Texture(app.graphicsDevice, { width: 4, height: 256, mipmaps: false });
      t.setSource(c);
      t.addressU = pc.ADDRESS_CLAMP_TO_EDGE;
      t.addressV = pc.ADDRESS_CLAMP_TO_EDGE;
      return t;
    })();

    const sky = new pc.Entity('sky');
    sky.addComponent('render', { type: 'sphere' });
    sky.setLocalScale(-900, -900, -900);      // inverted: we are inside it
    const skyMat = new pc.StandardMaterial();
    skyMat.useLighting = false;
    skyMat.emissiveMap = skyTex;
    skyMat.emissive = new pc.Color(1, 1, 1);
    skyMat.diffuse = new pc.Color(0, 0, 0);
    skyMat.depthWrite = false;
    skyMat.cull = pc.CULLFACE_NONE;
    skyMat.update();
    sky.render.material = skyMat;
    app.root.addChild(sky);
    watch(showSky, (on) => { sky.enabled = on; }, { immediate: true });

    // The blob URL carries no extension, but SogBundleParser dispatches on
    // `context.ext === 'sog'`, so the filename has to say so explicitly.
    const asset = new pc.Asset(`splat-${splatId}`, 'gsplat', {
      url: objectUrl,
      filename: `${splatId}.sog`,
    });
    const ready = new Promise((resolve, reject) => {
      asset.once('load', resolve);
      asset.once('error', (e) => reject(new Error(`gsplat asset failed: ${e}`)));
    });
    app.assets.add(asset);
    app.assets.load(asset);
    await ready;

    // No entity transform — see the camera block below for why rotating the splat is
    // the wrong lever here.
    splatEntity = new pc.Entity('splat');
    splatEntity.addComponent('gsplat', { asset });
    app.root.addChild(splatEntity);

    app.start();
    loading.value = false;
    progressLabel.value = '';
    status.value = 'ready — click to look around';
    showHint.value = true;

    // ---- camera ----
    // Orientation comes from carpet.world_up, NOT a hardcoded roll. The earlier version
    // pinned ROLL=180 because a lookAt(target, world_up) attempt appeared to render black —
    // but that black was a BACKGROUNDED-TAB artefact (requestAnimationFrame is fully
    // suspended when document.hidden, and PlayCanvas drives its loop from rAF), not a real
    // failure. The hardcode happened to suit glomap scenes, whose estimated up is ~-Y, and
    // it renders ARKit pose-prior scenes UPSIDE DOWN — those are in ARKit's world, which is
    // gravity-aligned, so /carpet reports up = exactly (0,1,0) for them.
    //
    // yaw turns about UP; pitch about the current right vector; both applied via
    // lookAt(target, UP), which is orientation-agnostic.
    const UP = carpet?.world_up
      ? new pc.Vec3(...carpet.world_up).normalize()
      : new pc.Vec3(0, 1, 0);
    const pos = carpet?.start_pos
      ? new pc.Vec3(...carpet.start_pos)
      : new pc.Vec3(0, 1.5, 4);
    let refFwd = carpet?.start_fwd
      ? new pc.Vec3(...carpet.start_fwd).normalize()
      : new pc.Vec3(0, 0, -1);
    refFwd = refFwd.sub(UP.clone().mulScalar(refFwd.dot(UP)));
    if (refFwd.lengthSq() < 1e-6) refFwd = new pc.Vec3(1, 0, 0);
    refFwd.normalize();

    let yaw = 0;
    let pitch = 0;
    const _q = new pc.Quat();
    const rotAbout = (v, axis, deg) =>
      _q.setFromAxisAngle(axis, deg).transformVector(v, new pc.Vec3());
    const currentDir = () => {
      const f = rotAbout(refFwd, UP, yaw);
      const right = new pc.Vec3().cross(f, UP).normalize();
      return rotAbout(f, right, pitch).normalize();
    };
    // carpet.world_up is now trustworthy, so there is no up/flipped toggle: /carpet derives
    // gravity from the capture's own ARKit trajectory (which is gravity-aligned by
    // construction) and reports which branch it used. The frames all agree — the brush PLY
    // sits in the COLMAP frame the carpet is derived in (splat->COLMAP nearest-neighbour
    // median 0.027 vs 0.90 if x,y were negated) and the SOG preserves it — so an override
    // would only ever be a way to make this wrong.
    const applyCamera = () => {
      camera.setPosition(pos);
      camera.lookAt(pos.clone().add(currentDir()), UP);
    };
    upLabel.value = `(${UP.x.toFixed(2)}, ${UP.y.toFixed(2)}, ${UP.z.toFixed(2)})`;
    flagCam = {
      get: () => {
        const d = currentDir();
        return {
          frame: 'colmap', position: [pos.x, pos.y, pos.z], forward: [d.x, d.y, d.z], up: [UP.x, UP.y, UP.z],
          yaw, pitch, fov_deg: camera.camera.fov,
          width: canvasEl.value?.width, height: canvasEl.value?.height,
        };
      },
      set: (c) => {
        pos.set(c.position[0], c.position[1], c.position[2]);
        yaw = c.yaw; pitch = c.pitch;
        applyCamera();
      },
    };
    loadFlags();
    fetch(`${base}/note`).then((r) => (r.ok ? r.json() : null)).then((d) => { jobNote.value = d?.note || ''; }).catch(() => {});
    starBase = base;
    fetch(base).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && 'starred' in d) starred.value = d.starred; }).catch(() => {});

    // ---- carpet-walk: poor man's collision (ported from walk v1) ----
    // The camera centres are the only positions we KNOW were physically occupied, so
    // confining the viewer to within `radius` of the nearest one keeps it out of walls and
    // out of the unobserved space behind them — where the splat has no real geometry to show
    // anyway, only stretched gaussians and floaters. Cheaper and more robust than meshing the
    // scene to collide against, which is why v1 had it.
    const CN = carpet?.centers?.length ? Float32Array.from(carpet.centers.flat()) : null;
    const nCam = CN ? (CN.length / 3) | 0 : 0;
    const nearestCarpet = (p) => {
      let bd = Infinity, bx = 0, by = 0, bz = 0;
      for (let i = 0; i < nCam; i++) {
        const cx = CN[i * 3], cy = CN[i * 3 + 1], cz = CN[i * 3 + 2];
        const dx = p.x - cx, dy = p.y - cy, dz = p.z - cz;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < bd) { bd = d2; bx = cx; by = cy; bz = cz; }
      }
      return { d: Math.sqrt(bd), x: bx, y: by, z: bz };
    };
    // ---- what the server found about the shape of this capture ----
    // Reported, not acted on. Opening the middle of an outward-facing ring was tried and
    // withdrawn: the middle of such a ring is behind every camera, so it is unobserved by
    // construction and measures empty whether or not something is standing in it. The only
    // thing that makes a place walkable is having observed it, and the strongest observation
    // is the camera having stood there — which is exactly what the clamp below already allows.
    const loop = carpet?.loop;
    if (loop?.closed) {
      const seen = loop.interior_observed_fraction;
      loopLabel.value = `loop: ${loop.facing}` +
        (seen == null ? '' : `, middle ${Math.round(seen * 100)}% seen`);
    }

    // ---- height: the band the camera was actually carried at ----
    // A ball around a camera centre lets you rise to the ceiling as long as you stay near it,
    // and nobody was ever up there. floor and the camera-height percentiles are measured from
    // the trajectory, so this costs no new assumption — it only removes freedom the evidence
    // never supported.
    const wv = carpet?.walk;
    const HEAD_ROOM = 0.4;
    const band = wv && wv.floor != null && wv.cam_height_max != null
      ? { lo: wv.floor + Math.max(0, (wv.cam_height_min ?? 0)) - HEAD_ROOM,
          hi: wv.floor + wv.cam_height_max + HEAD_ROOM }
      : null;

    // Returns the outward unit normal when it had to pull the camera back, else null, so the
    // caller can also kill the outward velocity — otherwise holding W into a wall builds up
    // speed that releases as a lurch the moment you turn away.
    const clampToCarpet = () => {
      if (!nCam) return null;
      // Height first, so the horizontal clamp below measures from a position that is already
      // at a plausible eye level rather than from somewhere near the ceiling.
      let vertical = null;
      if (carpetWalk.value && band) {
        const h = pos.dot(UP);
        if (h > band.hi) {
          pos.add(UP.clone().mulScalar(band.hi - h));
          vertical = UP.clone();
        } else if (h < band.lo) {
          pos.add(UP.clone().mulScalar(band.lo - h));
          vertical = UP.clone().mulScalar(-1);
        }
      }
      const nc = nearestCarpet(pos);
      const r = radius.value;
      if (carpetWalk.value && nc.d > r) {
        const ox = pos.x - nc.x, oy = pos.y - nc.y, oz = pos.z - nc.z;
        const k = r / (nc.d || 1);
        pos.set(nc.x + ox * k, nc.y + oy * k, nc.z + oz * k);
        distInfo.value = `dist to carpet ${r.toFixed(2)} (r ${r.toFixed(2)}) · clamped`;
        return new pc.Vec3(ox, oy, oz).normalize();
      }
      distInfo.value = `dist to carpet ${nc.d.toFixed(2)} (r ${r.toFixed(2)}) · ` +
        (vertical ? 'held at eye height' : (carpetWalk.value ? 'walking' : 'free-fly'));
      return vertical;
    };
    // ---- drawing the carpet ----
    // Immediate mode: PlayCanvas keeps no state for these, so they are re-issued every frame
    // and cost nothing when the checkbox is off. Depth-tested, so the path is occluded by the
    // splat like any other geometry rather than floating in front of the walls.
    const PATH_COL = new pc.Color(0.29, 0.87, 0.5);
    const SHADOW_COL = new pc.Color(0.29, 0.87, 0.5, 0.35);
    const EDGE_COL = new pc.Color(1.0, 0.65, 0.2);
    const LOOP_COL = new pc.Color(0.55, 0.95, 0.65);
    const floorOf = (v) => {
      const f = carpet?.walk?.floor;
      return f == null ? null : v.clone().add(UP.clone().mulScalar(f - v.dot(UP)));
    };
    // ---- capture cameras: frustums you can click to open that frame in Compare ----
    const CF = carpet?.forwards?.length ? carpet.forwards : null;
    const CAM_COL = new pc.Color(0.2, 0.75, 1.0);
    const FS = 0.11;                                        // frustum depth in scene units
    const SEE_COL = new pc.Color(1.0, 0.6, 0.1);            // cameras that see what you are looking at
    const camCorners = (i) => {
      const c = new pc.Vec3(CN[i * 3], CN[i * 3 + 1], CN[i * 3 + 2]);
      const f = new pc.Vec3(...CF[i]).normalize();
      let r = new pc.Vec3().cross(f, UP);
      if (r.lengthSq() < 1e-8) r = new pc.Vec3(1, 0, 0);
      r.normalize();
      const u = new pc.Vec3().cross(r, f).normalize();
      const m = c.clone().add(f.clone().mulScalar(FS));
      const q = (a, b) => m.clone().add(r.clone().mulScalar(a * FS * 0.62)).add(u.clone().mulScalar(b * FS * 0.46));
      return [c, q(-1, -1), q(1, -1), q(1, 1), q(-1, 1)];
    };
    // A capture camera "sees what you see" when the point you are looking at -- probed at 2/4/8/16 m
    // along your view ray, since there is no scene depth here -- lies inside its field of view for at
    // least two of those depths. Half-angles come from the pod's real intrinsics (/intrinsics).
    const seesMine = (i, dir) => {
      const c = new pc.Vec3(CN[i * 3], CN[i * 3 + 1], CN[i * 3 + 2]);
      const f = new pc.Vec3(...CF[i]).normalize();
      let r = new pc.Vec3().cross(f, UP); if (r.lengthSq() < 1e-8) r = new pc.Vec3(1, 0, 0); r.normalize();
      const u = new pc.Vec3().cross(r, f).normalize();
      const th = Math.tan((camIntr.value?.hfov_deg ?? 0) * Math.PI / 360);
      const tv = Math.tan((camIntr.value?.vfov_deg ?? 0) * Math.PI / 360);
      if (!th || !tv) return false;
      let hits = 0;
      for (const d of [2, 4, 8, 16]) {
        const q = pos.clone().add(dir.clone().mulScalar(d)).sub(c);
        const z = q.dot(f);
        if (z <= 0.1) continue;
        if (Math.abs(q.dot(r)) <= z * th && Math.abs(q.dot(u)) <= z * tv) hits++;
      }
      return hits >= 2;
    };
    const drawCams = () => {
      if (!showCams.value || !nCam || !CF) return;
      const dir = currentDir();
      let nSee = 0;
      for (let i = 0; i < nCam; i++) {
        const col = seesMine(i, dir) ? (nSee++, SEE_COL) : CAM_COL;
        const [c, a, b, d, e] = camCorners(i);
        for (const k of [a, b, d, e]) app.drawLine(c, k, col, true);
        app.drawLine(a, b, col, true); app.drawLine(b, d, col, true);
        app.drawLine(d, e, col, true); app.drawLine(e, a, col, true);
      }
      seeCount.value = nSee;
    };
    const pickCam = (sx, sy) => {
      const cp = camera.getPosition(), cf = camera.forward;
      let best = -1, bd = 24 * 24;
      const sc = new pc.Vec3(), w = new pc.Vec3();
      for (let i = 0; i < nCam; i++) {
        w.set(CN[i * 3], CN[i * 3 + 1], CN[i * 3 + 2]);
        if (w.clone().sub(cp).dot(cf) <= 0.05) continue;    // behind the viewer
        camera.camera.worldToScreen(w, sc);
        const d2 = (sc.x - sx) ** 2 + (sc.y - sy) ** 2;
        if (d2 < bd) { bd = d2; best = i; }
      }
      return best;
    };
    let compareKeys = null;
    const openCompare = async (i) => {
      const name = carpet?.names?.[i];
      if (!name) return;
      if (!compareKeys) {
        try {
          const r = await fetch(`${base}/compare-frames`);
          compareKeys = r.ok ? Object.fromEntries(((await r.json()).frames || []).map((f) => [f.name, f.key])) : {};
        } catch { compareKeys = {}; }
      }
      const key = compareKeys[name] ?? (name.match(/_(\d{4})\.[A-Za-z]+$/) || [])[1];
      if (!key) { console.warn('[cams] no compare key for', name); return; }
      if (document.pointerLockElement) document.exitPointerLock?.();
      window.open(router.resolve({ path: `/splat/${splatId}/compare`, query: { frame: key } }).href, '_blank');
    };
    // Every capture camera that sees ANY part of the current view: probe a 5x4 grid of rays across the
    // screen at 2/4/8/16 m and count, per camera, the probe points inside its field of view.
    const seenCams = () => {
      if (!nCam || !CF || !camIntr.value) return [];
      const vf = camera.camera.fov * Math.PI / 180, asp = (canvasEl.value?.width || 16) / (canvasEl.value?.height || 9);
      const f0 = currentDir();
      let r0 = new pc.Vec3().cross(f0, UP); if (r0.lengthSq() < 1e-8) r0 = new pc.Vec3(1, 0, 0); r0.normalize();
      const u0 = new pc.Vec3().cross(r0, f0).normalize();
      const P = [];
      for (let gx = 0; gx < 5; gx++) for (let gy = 0; gy < 4; gy++) {
        const sx = (gx / 4 - 0.5) * 2 * Math.tan(vf / 2) * asp, sy = (gy / 3 - 0.5) * 2 * Math.tan(vf / 2);
        const d = f0.clone().add(r0.clone().mulScalar(sx)).add(u0.clone().mulScalar(sy)).normalize();
        for (const t of [2, 4, 8, 16]) P.push(pos.clone().add(d.clone().mulScalar(t)));
      }
      const th = Math.tan(camIntr.value.hfov_deg * Math.PI / 360), tv = Math.tan(camIntr.value.vfov_deg * Math.PI / 360);
      const out = [];
      for (let i = 0; i < nCam; i++) {
        const c = new pc.Vec3(CN[i * 3], CN[i * 3 + 1], CN[i * 3 + 2]), f = new pc.Vec3(...CF[i]).normalize();
        let r = new pc.Vec3().cross(f, UP); if (r.lengthSq() < 1e-8) r = new pc.Vec3(1, 0, 0); r.normalize();
        const u = new pc.Vec3().cross(r, f).normalize();
        let k = 0;
        for (const p of P) {
          const q = p.clone().sub(c), z = q.dot(f);
          if (z > 0.1 && Math.abs(q.dot(r)) <= z * th && Math.abs(q.dot(u)) <= z * tv) k++;
        }
        if (k >= 3) out.push([i, k]);
      }
      return out.sort((a, b) => b[1] - a[1]).map(([i]) => i);
    };
    const compareKeysFor = async (idx) => {
      if (!compareKeys) {
        try {
          const r = await fetch(`${base}/compare-frames`);
          compareKeys = r.ok ? Object.fromEntries(((await r.json()).frames || []).map((f) => [f.name, f.key])) : {};
        } catch { compareKeys = {}; }
      }
      return idx.map((i) => carpet?.names?.[i]).filter(Boolean)
        .map((n) => compareKeys[n] ?? (n.match(/_(\d{4})\.[A-Za-z]+$/) || [])[1]).filter(Boolean);
    };
    camPick = { pick: pickCam, open: openCompare, seen: seenCams, keys: compareKeysFor };
    try {
      const ri = await fetch(`${base}/intrinsics`);
      if (ri.ok) camIntr.value = await ri.json();
    } catch (err) { console.warn('[intrinsics]', err); }
    watch(captureFov, (on) => { camera.camera.fov = on && camIntr.value ? camIntr.value.vfov_deg : VIEW_FOV; });

    const drawCarpet = () => {
      if (!showCarpet.value || !nCam) return;
      const a = new pc.Vec3(), b = new pc.Vec3();
      for (let i = 0; i < nCam - 1; i++) {
        a.set(CN[i * 3], CN[i * 3 + 1], CN[i * 3 + 2]);
        b.set(CN[(i + 1) * 3], CN[(i + 1) * 3 + 1], CN[(i + 1) * 3 + 2]);
        app.drawLine(a, b, PATH_COL, true);
        // A shadow on the floor: the path itself hangs at eye height, and a line in mid-air
        // is very hard to place relative to the ground you are standing on.
        const fa = floorOf(a), fb = floorOf(b);
        if (fa && fb) app.drawLine(fa, fb, SHADOW_COL, true);
      }
      // The ball you are actually confined to, drawn where you are rather than everywhere:
      // one circle you can read beats 113 you cannot.
      if (carpetWalk.value) {
        const nc = nearestCarpet(pos);
        const c = new pc.Vec3(nc.x, nc.y, nc.z);
        let ax = new pc.Vec3(1, 0, 0).sub(UP.clone().mulScalar(UP.x));
        if (ax.length() < 1e-3) ax = new pc.Vec3(0, 1, 0).sub(UP.clone().mulScalar(UP.y));
        ax.normalize();
        const bx = new pc.Vec3().cross(UP, ax).normalize();
        const r = radius.value;
        const N = 32;
        for (let i = 0; i < N; i++) {
          const t0 = (i / N) * Math.PI * 2, t1 = ((i + 1) / N) * Math.PI * 2;
          const p0 = c.clone()
            .add(ax.clone().mulScalar(Math.cos(t0) * r))
            .add(bx.clone().mulScalar(Math.sin(t0) * r));
          const p1 = c.clone()
            .add(ax.clone().mulScalar(Math.cos(t1) * r))
            .add(bx.clone().mulScalar(Math.sin(t1) * r));
          app.drawLine(p0, p1, EDGE_COL, true);
        }
      }
      const poly = loop?.interior_walkable ? loop.interior_polygon : null;
      if (poly && poly.length >= 3) {
        for (let i = 0; i < poly.length; i++) {
          const q = poly[i], w = poly[(i + 1) % poly.length];
          app.drawLine(new pc.Vec3(q[0], q[1], q[2]), new pc.Vec3(w[0], w[1], w[2]),
                       LOOP_COL, true);
        }
      }
    };

    // ---- carpet video: retrace the capture ----
    //
    // The path and the viewing directions are both recorded, so the tour needs no invention —
    // it is playback, not a generated fly-through. Two things have to be handled or it is
    // unwatchable:
    //
    //   jitter  A handheld capture wanders by centimetres between frames and the forwards
    //           wobble with every step. Both are smoothed with a moving average, taken WITHIN
    //           runs so a smoothing window never straddles a cut and drags the camera through
    //           un-walked space.
    //   cuts    Where recording stopped and restarted, the operator did not walk the gap.
    //           Flying it would show space nobody photographed, so the gap is taken instantly:
    //           a cut in the capture becomes a cut in the video.
    // The tour visits the photographs themselves, in capture order: every camera pose is a
    // stop, not a point on a smoothed path. Poses are therefore taken RAW — the whole point
    // is to sit on the exact pose a photograph was taken from, so averaging neighbours in
    // would put the camera where no photograph was ever taken.
    const tour = [];
    (() => {
      const cs = carpet?.centers, fs = carpet?.forwards;
      if (!Array.isArray(cs) || !Array.isArray(fs) || cs.length < 2 || fs.length !== cs.length) return;
      const raw = cs.map((c, i) => ({
        p: new pc.Vec3(c[0], c[1], c[2]),
        f: new pc.Vec3(fs[i][0], fs[i][1], fs[i][2]).normalize(),
      }));
      // A cut is where recording stopped and restarted: nobody walked that gap, so gliding it
      // would fly through un-photographed space. Cuts are taken instantly, like a video cut.
      const stepLen = raw.slice(1).map((q, i) => q.p.distance(raw[i].p)).sort((a, b) => a - b);
      const med = stepLen[Math.floor(stepLen.length / 2)] || 0;
      // Capture order, exactly as shot. An earlier version re-ordered the poses into a
      // walkable path, which made a scattered capture LOOK fine and hid the defect: if
      // consecutive photographs teleport, the plan teleports, and that is the thing worth
      // seeing. Overlap between neighbours belongs in the planner, not in the viewer.
      const order = raw.map((_, i) => i);
      for (let n = 0; n < order.length; n++) {
        const a = raw[order[n]], b = raw[order[(n + 1) % order.length]];
        tour.push({ p: a.p, f: a.f, cutAfter: med > 0 && a.p.distance(b.p) > 10 * med });
      }
      videoReady.value = tour.length >= 2;
      tourTotal.value = tour.length;
    })();

    const MOVE_S = 1.0;    // glide between consecutive poses
    const HOLD_S = 0.5;    // dwell on each photograph
    let phase = 'hold';    // 'hold' on tour[tourIdx], or 'move' from it to the next
    let phaseT = 0;

    // World direction -> the yaw/pitch this camera is actually steered with, so leaving the
    // video hands control back pointing where the video left off rather than snapping.
    const dirToAngles = (d) => {
      const dn = d.clone().normalize();
      const vert = Math.max(-1, Math.min(1, dn.dot(UP)));
      const h = dn.clone().sub(UP.clone().mulScalar(vert));
      const p = (Math.asin(vert) * 180) / Math.PI;
      if (h.lengthSq() < 1e-8) return { yaw, pitch: p };
      h.normalize();
      const cross = new pc.Vec3().cross(refFwd, h);
      return { yaw: (Math.atan2(cross.dot(UP), refFwd.dot(h)) * 180) / Math.PI, pitch: p };
    };

    const ease = (t) => t * t * (3 - 2 * t);   // smoothstep: leaves and arrives gently

    const poseAngles = new Array(1024);
    const anglesAt = (i) => (poseAngles[i] ||= dirToAngles(tour[i].f));

    const applyTour = () => {
      const i = tourIdx.value, j = (i + 1) % tour.length;
      const t = phase === 'move' && !tour[i].cutAfter ? ease(Math.min(1, phaseT / MOVE_S)) : 0;
      const a = tour[i], b = tour[j];
      pos.set(a.p.x + (b.p.x - a.p.x) * t,
              a.p.y + (b.p.y - a.p.y) * t,
              a.p.z + (b.p.z - a.p.z) * t);
      const ga = anglesAt(i), gb = anglesAt(j);
      // Take the short way round so passing +-180 does not spin the camera.
      yaw = ga.yaw + (((gb.yaw - ga.yaw + 540) % 360) - 180) * t;
      pitch = ga.pitch + (gb.pitch - ga.pitch) * t;
      // The poses are inside the carpet by construction; run the clamp anyway so the tour
      // obeys exactly the rule the walker does.
      clampToCarpet();
      applyCamera();
      videoInfo.value = `${tourIdx.value + 1} / ${tour.length}`;
    };

    const advanceVideo = (step) => {
      if (!videoReady.value || tour.length < 2) return;
      if (playing.value) {
        phaseT += step * rate.value;
        for (;;) {
          const dur = phase === 'hold' ? HOLD_S
                    : (tour[tourIdx.value].cutAfter ? 0 : MOVE_S);
          if (phaseT < dur) break;
          phaseT -= dur;
          if (phase === 'hold') {
            phase = 'move';
          } else {
            phase = 'hold';
            tourIdx.value = (tourIdx.value + 1) % tour.length;
          }
        }
      }
      applyTour();
    };

    // Transport, driven from the template. Seeking or stepping always lands ON a pose
    // rather than mid-glide, so the frame counter and what you see never disagree.
    tourSeek = (i) => {
      if (!tour.length) return;
      tourIdx.value = ((i % tour.length) + tour.length) % tour.length;
      phase = 'hold'; phaseT = 0;
      if (carpetVideo.value) applyTour();
    };
    tourStep = (d) => { playing.value = false; tourSeek(tourIdx.value + d); };

    // Enabling the mode (or shrinking r) while parked outside must take effect at once, not
    // silently wait for the next keypress.
    reclamp = () => { clampToCarpet(); applyCamera(); };
    clampToCarpet();
    applyCamera();

    // POC debug handle — lets me inspect/drive the camera from the console without a
    // rebuild cycle (the engine is a bundled module, so `pc` is not global).
    window.__walk2 = {
      app, camera, splatEntity, pc,
      state: () => {
        const mi = splatEntity.gsplat?.instance?.meshInstance;
        return {
          camPos: [camera.getPosition().x, camera.getPosition().y, camera.getPosition().z],
          camFwd: [camera.forward.x, camera.forward.y, camera.forward.z],
          UP: [UP.x, UP.y, UP.z],
          yaw, pitch,
          aabb: mi?.aabb
            ? { c: [mi.aabb.center.x, mi.aabb.center.y, mi.aabb.center.z],
                h: [mi.aabb.halfExtents.x, mi.aabb.halfExtents.y, mi.aabb.halfExtents.z] }
            : null,
        };
      },
    };

    // ---- pointer-lock look + WASD fly ----
    const canvas = canvasEl.value;
    const keys = {};
    const onKeyDown = (e) => {
      keys[e.code] = true;
      if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space','KeyC'].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    const onClick = (e) => {
      // With cameras shown, a click ON a camera opens it in Compare (screen centre when the pointer
      // is locked, the mouse position otherwise); anywhere else it grabs the mouse as before.
      if (showCams.value && camPick) {
        const rect = canvas.getBoundingClientRect();
        const locked = document.pointerLockElement === canvas;
        const i = camPick.pick(locked ? rect.width / 2 : e.clientX - rect.left, locked ? rect.height / 2 : e.clientY - rect.top);
        if (i >= 0) { camPick.open(i); return; }
      }
      canvas.requestPointerLock?.();
    };
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      // Raw deltas, no smoothing or acceleration — 1:1 is what makes an FPS feel direct.
      carpetVideo.value = false;
      yaw -= e.movementX * sens.value;
      pitch = Math.max(-89, Math.min(89, pitch - e.movementY * sens.value));
      applyCamera();
    };
    const onLockChange = () => { showHint.value = document.pointerLockElement !== canvas; };

    // ---- touch: look by dragging, move with the on-screen stick ----
    // Pointer lock does not exist on mobile, and there are no keys, so the desktop path gives
    // a viewer you can neither turn nor walk. Split by SCREEN REGION rather than by gesture
    // count: a drag starting inside the stick moves, anything else looks. Region beats
    // finger-counting because it stays unambiguous when a second finger lands mid-drag.
    const lookTouch = { id: null, x: 0, y: 0 };
    const stick = { id: null, cx: 0, cy: 0, x: 0, y: 0 };   // x/y in [-1,1]
    const STICK_R = 58;                                     // px, matches the CSS radius

    let lastGrab = 'none';
    const inStick = (t) => {
      const el = stickEl.value;
      if (!el) { lastGrab = 'stickEl NULL'; return false; }
      const r = el.getBoundingClientRect();
      // Grab area is deliberately LARGER than the drawn circle, and open towards the screen
      // corner. A thumb lands imprecisely and its contact patch is centimetres wide, so a
      // hit-test on the visible 116 px circle rejects touches that plainly meant the stick —
      // and a rejected touch silently becomes a look-drag, which is exactly the reported
      // symptom of "look works, walking does nothing".
      const PAD = 44;
      const hit = t.clientX <= r.right + PAD && t.clientY >= r.top - PAD
               && t.clientX >= 0 && t.clientY <= window.innerHeight;
      lastGrab = hit ? 'stick' : `look (grab x<=${(r.right + PAD).toFixed(0)} ` +
                                 `y>=${(r.top - PAD).toFixed(0)}  touch=` +
                                 `${t.clientX.toFixed(0)},${t.clientY.toFixed(0)})`;
      return hit;
    };
    // These listeners sit on the whole view, not the canvas, so every tap on the overlay
    // chrome bubbles through here too. Such a touch is UI, not camera input: claiming it
    // would start a phantom look-drag, and preventDefault() on it cancels the synthesized
    // click, which is what silently broke the back link. Tested per touch rather than on
    // e.target because a Touch carries its own start element, so a thumb on the stick and a
    // thumb on a button in the same event are classified independently.
    const onChrome = (t) => !!t.target?.closest?.('.walk2-vbtns, .walk2-back-btn, .walk2-back');
    const onTouchStart = (e) => {
      let forCamera = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (onChrome(t)) continue;
        forCamera = true;
        if (stick.id === null && inStick(t)) {
          const r = stickEl.value.getBoundingClientRect();
          stick.id = t.identifier;
          stick.cx = r.left + r.width / 2;
          stick.cy = r.top + r.height / 2;
          stick.x = 0; stick.y = 0;
        } else if (lookTouch.id === null) {
          lookTouch.id = t.identifier;
          lookTouch.x = t.clientX;
          lookTouch.y = t.clientY;
          showHint.value = false;
        }
      }
      if (e.cancelable && forCamera) e.preventDefault();
    };
    const onTouchMove = (e) => {
      let forCamera = false;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === stick.id || t.identifier === lookTouch.id) forCamera = true;
        if (t.identifier === stick.id) {
          // Clamp to the ring so the stick is analogue but bounded, like a thumbstick.
          const dx = (t.clientX - stick.cx) / STICK_R;
          const dy = (t.clientY - stick.cy) / STICK_R;
          const m = Math.hypot(dx, dy) || 1;
          const k = Math.min(1, m) / m;
          stick.x = dx * k; stick.y = dy * k;
          stickKnob.value = { x: stick.x * STICK_R, y: stick.y * STICK_R };
        } else if (t.identifier === lookTouch.id) {
          // Touch look wants ~3x the mouse sensitivity: a thumb swipe covers far less
          // distance than a mouse drag, so 1:1 leaves you unable to turn around.
          carpetVideo.value = false;
          yaw -= (t.clientX - lookTouch.x) * sens.value * 3;
          pitch = Math.max(-89, Math.min(89, pitch - (t.clientY - lookTouch.y) * sens.value * 3));
          lookTouch.x = t.clientX; lookTouch.y = t.clientY;
          applyCamera();
        }
      }
      if (e.cancelable && forCamera) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === stick.id) {
          stick.id = null; stick.x = 0; stick.y = 0;
          stickKnob.value = { x: 0, y: 0 };
        }
        if (t.identifier === lookTouch.id) lookTouch.id = null;
      }
    };
    // Non-passive: these must be able to preventDefault, or the page pans and rubber-bands
    // under the drag instead of the camera turning.
    const noGesture = (e) => { if (e.cancelable) e.preventDefault(); };
    for (const ev of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
      canvas.addEventListener(ev, noGesture, { passive: false });
    }
    cleanupFns.push(() => {
      for (const ev of ['gesturestart', 'gesturechange', 'gestureend', 'dblclick']) {
        canvas.removeEventListener(ev, noGesture);
      }
    });

    const topts = { passive: false };
    const touchRoot = canvas.parentElement || canvas;
    touchRoot.addEventListener('touchstart', onTouchStart, topts);
    touchRoot.addEventListener('touchmove', onTouchMove, topts);
    touchRoot.addEventListener('touchend', onTouchEnd);
    touchRoot.addEventListener('touchcancel', onTouchEnd);
    stickRef.value = stick;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    canvas.addEventListener('click', onClick);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('pointerlockchange', onLockChange);
    cleanupFns.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('click', onClick);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('pointerlockchange', onLockChange);
      touchRoot.removeEventListener('touchstart', onTouchStart);
      touchRoot.removeEventListener('touchmove', onTouchMove);
      touchRoot.removeEventListener('touchend', onTouchEnd);
      touchRoot.removeEventListener('touchcancel', onTouchEnd);
    });

    // The gsplat sorter only runs when the camera transform changes AFTER the splat is
    // ready. Setting the pose once at load leaves it unsorted and the canvas renders
    // BLACK, with a provably correct camera — re-applying the IDENTICAL position and
    // angles from the console was enough to make the scene appear, which is how this was
    // pinned down. So re-assert the pose for the first few frames to kick the sort.
    // FPS movement, not free-flight. Two things make it feel like a game rather than a
    // debug camera:
    //  1. W/S travel along the view direction PROJECTED ONTO THE GROUND PLANE, so looking up
    //     no longer lifts you off the floor — that was the main thing making it feel wrong.
    //     Vertical is explicit (Space / C), which is also how you get a drone view.
    //  2. Velocity is accelerated and damped rather than applied per-key-press, so starting,
    //     stopping and strafing carry a little momentum instead of snapping.
    const vel = new pc.Vec3();
    const ACCEL = 34;      // m/s^2 — reaches full speed in ~1/8 s
    const DAMP = 11;       // 1/s   — coasts a short distance after release
    const onUpdate = (dt) => {
      sky.setPosition(camera.getPosition());   // always centred on the viewer
      const step = Math.min(dt, 0.05);   // a stalled tab must not teleport the camera
      if (carpetVideo.value) {
        // Touching a movement control takes the wheel — no need to find the checkbox again.
        const st0 = stickRef.value;
        const wants = keys.KeyW || keys.KeyA || keys.KeyS || keys.KeyD || keys.Space ||
          keys.KeyC || keys.ControlLeft || touchUp.value || touchDown.value ||
          (st0 && (st0.x || st0.y));
        if (wants) carpetVideo.value = false;
        else { advanceVideo(step); return; }
      }
      const up = UP;
      const d = currentDir();
      // ground-plane basis
      let fwd = d.clone().sub(up.clone().mulScalar(d.dot(up)));
      if (fwd.lengthSq() < 1e-8) fwd = new pc.Vec3().cross(up, new pc.Vec3(1, 0, 0));
      fwd.normalize();
      const right = new pc.Vec3().cross(fwd, up).normalize();

      const want = new pc.Vec3();
      if (keys.KeyW) want.add(fwd);
      if (keys.KeyS) want.sub(fwd);
      if (keys.KeyD) want.add(right);
      if (keys.KeyA) want.sub(right);
      if (keys.Space || touchUp.value) want.add(up);
      if (keys.KeyC || keys.ControlLeft || touchDown.value) want.sub(up);
      // Analogue stick, added before normalise so a half-pushed stick still walks slowly
      // once the vector is scaled by its own length below.
      const st = stickRef.value;
      if (st && (st.x || st.y)) {
        want.add(fwd.clone().mulScalar(-st.y));
        want.add(right.clone().mulScalar(st.x));
      }
      if (want.lengthSq() > 1e-8) {
        const stMag = st ? Math.min(1, Math.hypot(st.x, st.y)) : 0;
        const analogue = stMag > 0 ? Math.max(0.15, stMag) : 1;
        want.normalize().mulScalar(speed.value * analogue *
                                  (keys.ShiftLeft || keys.ShiftRight ? 3 : 1));
        vel.add(want.sub(vel).mulScalar(Math.min(1, ACCEL * step / Math.max(speed.value, 0.001))));
      } else {
        vel.mulScalar(Math.max(0, 1 - DAMP * step));
      }
      if (vel.lengthSq() > 1e-9) {
        pos.add(vel.clone().mulScalar(step));
        const n = clampToCarpet();
        atEdge.value = !!n;
        if (n) {
          const outward = vel.dot(n);
          if (outward > 0) vel.sub(n.mulScalar(outward));
        }
        applyCamera();
      } else if (atEdge.value && !want.lengthSq()) {
        atEdge.value = false;
      }
      drawCarpet();
      drawCams();
      if (debug.value) {
        const st2 = stickRef.value || { id: null, x: 0, y: 0 };
        dbg.value =
          `build ${buildStamp}\n` +
          `isTouch ${isTouch.value}  stickEl ${stickEl.value ? 'ok' : 'NULL'}\n` +
          `lastTouch ${lastGrab}\n` +
          `stick id=${st2.id} x=${st2.x.toFixed(2)} y=${st2.y.toFixed(2)}\n` +
          `vel ${vel.length().toFixed(3)} m/s  speed ${speed.value}\n` +
          `carpetWalk ${carpetWalk.value} r=${radius.value}  atEdge ${atEdge.value}\n` +
          `${distInfo.value}`;
      }
    };
    app.on('update', onUpdate);
    cleanupFns.push(() => app.off('update', onUpdate));
  } catch (e) {
    error.value = e?.message || String(e);
    loading.value = false;
  }
});

watch([carpetWalk, radius], () => reclamp());

onBeforeUnmount(() => {
  cleanupFns.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  cleanupFns = [];
  if (document.pointerLockElement) document.exitPointerLock?.();
  if (app) { try { app.destroy(); } catch { /* ignore */ } app = null; }
  if (objectUrl) { URL.revokeObjectURL(objectUrl); objectUrl = null; }
});
</script>

<style scoped>
.walk2-view {
  position: fixed; inset: 0; background: #0b0b0f; overflow: hidden;
  /* Nothing here is text to be selected, and a long-press selection or magnifier over the
     canvas is pure obstruction. */
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  overscroll-behavior: none;
}
.walk2-canvas {
  width: 100%; height: 100%; display: block;
  /* Every touch on the canvas is camera input, so the browser must not claim any of it for
     scrolling, pinch-zoom or double-tap zoom. */
  touch-action: none;
}
.walk2-hud {
  position: absolute; top: 12px; left: 12px; z-index: 5;
  background: rgba(0,0,0,.62); color: #e8e8ef; padding: 10px 13px;
  border-radius: 8px; font: 12px/1.55 ui-monospace, monospace; max-width: 340px;
  backdrop-filter: blur(6px);
}
.walk2-hud code { color: #8fd3ff; }
.tag { background: #1f6f43; color: #d8ffe8; padding: 1px 6px; border-radius: 4px; font-size: 10px; }
.walk2-orient { margin-top: 6px; }
.walk2-orient button {
  background: #23232c; color: #cfcfe0; border: 1px solid #3a3a48; border-radius: 4px;
  font: 11px ui-monospace, monospace; padding: 2px 7px; margin-right: 4px; cursor: pointer;
}
.walk2-orient button.on { background: #2f6fd0; color: #fff; border-color: #2f6fd0; }
.walk2-note { color: #9aa; font-size: 10.5px; }
.walk2-build { display: block; margin-top: 3px; font-size: 10px; opacity: .6; }
.walk2-debug {
  position: fixed; top: calc(10px + env(safe-area-inset-top)); right: 10px; z-index: 62;
  margin: 0; padding: 7px 9px; border-radius: 7px; max-width: 68vw;
  background: rgba(0,0,0,.72); color: #9fe89f;
  font: 10px/1.45 ui-monospace, monospace; white-space: pre-wrap;
}
.walk2-edge {
  position: fixed; left: 50%; transform: translateX(-50%);
  bottom: calc(160px + env(safe-area-inset-bottom)); z-index: 62;
  background: rgba(0,0,0,.66); color: #ffd9a0; padding: 6px 12px; border-radius: 999px;
  font: 11px system-ui; pointer-events: none;
}
/* Above the app's floating chrome (WhatsApp z-40, analysis indicator z-50): those are
   hidden on this route, but the stick must win even if something new appears. */
.walk2-touch { position: fixed; inset: 0; pointer-events: none; z-index: 60; touch-action: none; }
.walk2-back-btn {
  position: fixed; top: calc(12px + env(safe-area-inset-top)); left: 14px; z-index: 61;
  width: 42px; height: 42px; border-radius: 50%; text-decoration: none;
  display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,.55); color: #e8e8ef; font-size: 20px;
  border: 1px solid rgba(255,255,255,.2);
}
.walk2-stick {
  position: absolute; left: 18px; bottom: calc(30px + env(safe-area-inset-bottom));
  width: 116px; height: 116px;
  border-radius: 50%; background: rgba(255,255,255,.07);
  border: 1px solid rgba(255,255,255,.22); pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
}
.walk2-stick-knob {
  width: 46px; height: 46px; border-radius: 50%;
  background: rgba(255,255,255,.34); border: 1px solid rgba(255,255,255,.5);
}
.walk2-vbtns {
  position: absolute; right: 18px; bottom: calc(30px + env(safe-area-inset-bottom));
  display: flex; flex-direction: column; gap: 10px;
}
.walk2-vbtns button {
  pointer-events: auto; width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.24);
  color: #e8e8ef; font-size: 17px;
}
/* The HUD eats most of a phone screen at desktop sizing. */
@media (max-width: 760px) {
  .walk2-hud { font-size: 10.5px; max-width: 62vw; padding: 7px 9px; }
  .walk2-hud input[type=range] { width: 78px; }
}
.walk2-count { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; }
.walk2-transport { display: flex; gap: 4px; align-items: center; margin-top: 4px; flex-wrap: wrap; }
.walk2-transport button { background: rgba(0,0,0,.45); border: 1px solid #3a4250; color: #cfd6e2;
  border-radius: 4px; padding: 2px 7px; font-size: 12px; cursor: pointer; line-height: 1.4; }
.walk2-transport button.on { border-color: #6ea8ff; color: #6ea8ff; }
.walk2-transport button.play { min-width: 34px; }
.walk2-scrub { width: 100%; margin-top: 5px; accent-color: #6ea8ff; }
.walk2-loop {
  margin-left: 8px;
  opacity: 0.75;
}
.walk2-dist { color: #cfcfe0; font-size: 11px; }
.walk2-up { color: #9aa; font-size: 10.5px; }
.walk2-size { margin-top: 6px; color: #9be89b; }
.walk2-status {
  position: absolute; bottom: 14px; left: 12px; right: 12px; z-index: 5;
  background: rgba(0,0,0,.62); color: #e8e8ef; padding: 9px 13px; border-radius: 8px;
  font: 12px ui-monospace, monospace;
}
.walk2-status.err { background: rgba(120,20,20,.85); color: #ffdada; }
.walk2-progress { height: 4px; background: #2a2a33; border-radius: 2px; margin-top: 7px; overflow: hidden; }
.walk2-progress-fill { height: 100%; background: #2f6fd0; transition: width .15s linear; }
.walk2-hint {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); z-index: 4;
  color: #fff; background: rgba(0,0,0,.5); padding: 9px 15px; border-radius: 8px;
  font: 13px ui-monospace, monospace; pointer-events: none;
}
.walk2-back {
  position: absolute; top: 12px; right: 12px; z-index: 5; color: #8fd3ff;
  background: rgba(0,0,0,.62); padding: 7px 11px; border-radius: 8px;
  font: 12px ui-monospace, monospace; text-decoration: none;
}
.walk2-flags { position: absolute; top: 52px; right: 12px; z-index: 30; display: flex; flex-direction: column;
  align-items: flex-end; gap: 6px; font: 13px system-ui, sans-serif; }
.walk2-flag-btn, .walk2-flag-panel button, .walk2-flag-shown button { padding: 5px 10px; border: none; border-radius: 6px;
  cursor: pointer; background: #b45309; color: #fff; font-weight: 600; }
.walk2-flag-list { padding: 4px 8px; border-radius: 6px; background: #1f2937; color: #fbbf24; border: 1px solid #b45309; }
.walk2-flag-panel { display: flex; gap: 6px; background: rgba(17, 24, 39, 0.92); padding: 6px; border-radius: 8px; }
.walk2-flag-note { width: 260px; padding: 4px 8px; border-radius: 6px; border: 1px solid #374151; background: #111827; color: #f3f4f6; }
.walk2-flag-msg { color: #fbbf24; }
.walk2-flag-shown { max-width: 340px; background: rgba(17, 24, 39, 0.92); border: 1px solid #b45309; border-radius: 8px;
  padding: 6px; color: #fbbf24; }
.walk2-flag-shown img { width: 100%; margin-top: 6px; border-radius: 4px; }
.walk2-capframe { position: absolute; top: 0; bottom: 0; left: 50%; transform: translateX(-50%); height: 100%;
  border-left: 2px solid rgba(255, 170, 40, 0.85); border-right: 2px solid rgba(255, 170, 40, 0.85);
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.45); pointer-events: none; z-index: 5; }
/* HUD layout (2026-09-30 cleanup): sections, labelled sliders, toggle chips, muted footer. */
.walk2-hud { font: 12px/1.45 system-ui, -apple-system, sans-serif; width: 300px; max-width: 300px; padding: 10px 12px 8px; }
.walk2-hud.collapsed { width: auto; }
.hud-head { display: flex; align-items: center; gap: 6px; }
.hud-title { font-weight: 700; font-size: 13px; }
.hud-id { font: 11px ui-monospace, monospace; color: #8fd3ff; }
.hud-size { margin-left: auto; color: #8a93a3; font-size: 11px; }
.hud-toggle { background: #2a2f3a; color: #cfd6e2; border: 1px solid #3a4250; border-radius: 4px; width: 22px; height: 20px;
  line-height: 16px; cursor: pointer; padding: 0; margin-left: 4px; }
.hud-head .hud-size + .hud-toggle, .hud-head .tag + .hud-toggle { margin-left: auto; }
.hud-keys { color: #8a93a3; font-size: 11px; margin: 6px 0 2px; }
.hud-keys kbd { background: #2a2f3a; border: 1px solid #3a4250; border-radius: 3px; padding: 0 4px; font: 10px ui-monospace, monospace; color: #dfe5ee; }
.hud-sec { border-top: 1px solid rgba(255,255,255,.08); margin-top: 8px; padding-top: 6px; }
.hud-sec h4 { margin: 0 0 5px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #8a93a3; font-weight: 600; }
.hud-sec h4 small { cursor: help; text-transform: none; }
.hud-slider { display: grid; grid-template-columns: 52px 1fr 38px; align-items: center; gap: 8px; margin: 2px 0; }
.hud-slider span { color: #c3cad6; }
.hud-slider input { width: 100%; accent-color: #6ea8ff; }
.hud-slider em { font: 11px ui-monospace, monospace; font-style: normal; color: #dfe5ee; text-align: right; }
.hud-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; cursor: pointer;
  background: #232833; border: 1px solid #3a4250; color: #c3cad6; user-select: none; }
.chip input { display: none; }
.chip.on { background: #1e3a66; border-color: #6ea8ff; color: #fff; }
.chip.off { opacity: .45; cursor: not-allowed; }
.badge { background: #f59e0b; color: #111; border-radius: 999px; padding: 0 6px; font-size: 10px; font-weight: 700; }
.hud-foot { display: flex; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 5px;
  border-top: 1px solid rgba(255,255,255,.08); color: #7d8696; font: 10px ui-monospace, monospace; }
.walk2-menu { position: absolute; top: 12px; right: 12px; z-index: 40; display: flex; flex-direction: column; align-items: flex-end; }
.walk2-star-btn { position: absolute; top: 12px; right: 54px; z-index: 40; font-size: 16px; color: #d1d5db; }
.walk2-star-btn.on { color: #fbbf24; border-color: #92400e; }
.walk2-menu-btn { width: 34px; height: 32px; border-radius: 6px; border: 1px solid #3a4250; background: rgba(0,0,0,.62);
  color: #e8e8ef; font-size: 17px; cursor: pointer; backdrop-filter: blur(6px); }
.walk2-menu-btn.open { border-color: #6ea8ff; }
.walk2-menu-list { margin-top: 6px; min-width: 170px; background: rgba(17, 24, 39, 0.96); border: 1px solid #3a4250;
  border-radius: 8px; padding: 4px; display: flex; flex-direction: column; font: 13px system-ui, sans-serif; }
.walk2-menu-list a { color: #dfe5ee; text-decoration: none; padding: 6px 10px; border-radius: 5px; }
.walk2-menu-list a:hover { background: #1e3a66; }
.walk2-menu-list hr { border: none; border-top: 1px solid rgba(255,255,255,.1); margin: 3px 4px; }
.walk2-note-box { position: absolute; left: 12px; bottom: 58px; z-index: 6; max-width: 520px; background: rgba(0,0,0,.66);
  color: #dfe5ee; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 7px 10px; font: 12px/1.45 system-ui, sans-serif;
  backdrop-filter: blur(6px); }
.nb-head { display: flex; align-items: center; gap: 6px; color: #8a93a3; font-size: 11px; margin-bottom: 3px; }
.nb-head b { font-weight: 600; letter-spacing: .06em; text-transform: uppercase; font-size: 10px; margin-right: auto; }
.nb-head button { background: none; border: none; color: #8fb8ff; cursor: pointer; font-size: 11px; padding: 0 2px; }
.nb-body { max-height: 4.4em; overflow: hidden; }
.walk2-note-box.open .nb-body { max-height: 40vh; overflow-y: auto; }
.nb-body p { margin: 0 0 3px; }
.nb-body em { font-style: normal; font-weight: 700; font-size: 10px; margin-right: 6px; padding: 0 5px; border-radius: 3px;
  background: #1e3a66; color: #cfe0ff; }
.nb-body em.POST { background: #14532d; color: #c9f7d8; }
</style>
