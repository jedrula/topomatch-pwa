<template>
  <div class="walk2-view">
    <canvas ref="canvasEl" class="walk2-canvas"></canvas>

    <div v-if="!isTouch" class="walk2-hud">
      <div><b>Walk / Fly v2</b> — <code>{{ splatId }}</code> <span class="tag">SOG</span></div>
      <div><b>WASD</b> move · <b>Shift</b> sprint · <b>Space/C</b> up/down · <b>Esc</b> release</div>
      <div><b>[</b> / <b>]</b> step to the previous / next capture pose
        <span v-if="camCount">— {{ camIndex + 1 }} / {{ camCount }}</span></div>
      <div class="walk2-note">carpet-walk keeps you inside a tube around the capture path — outside it the splat is floaters, not scene</div>
      <div>
        look <input type="range" min="0.02" max="0.5" step="0.01" v-model.number="sens" />
        {{ sens.toFixed(2) }}
      </div>
      <div>
        speed <input type="range" min="0.2" max="6" step="0.1" v-model.number="speed" />
        {{ speed.toFixed(1) }}
      </div>
      <div>
        <label><input type="checkbox" v-model="carpetWalk" /> carpet-walk</label>
        r <input type="range" :min="radiusMax / 48" :max="radiusMax" :step="radiusMax / 200"
                 v-model.number="radius" :disabled="!carpetWalk" />
        {{ radius.toFixed(2) }}
      </div>
      <div v-if="distInfo" class="walk2-dist">{{ distInfo }}</div>
      <div v-if="upLabel" class="walk2-up">up {{ upLabel }}</div>
      <div v-if="sizeInfo" class="walk2-size">{{ sizeInfo }}</div>
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
        <!-- Same capture-pose stepping the [ and ] keys do. There is no keyboard on a phone,
             and this is the movement most likely to land on a good view. -->
        <button @touchstart.passive="stepCam(-1)">‹</button>
        <button @touchstart.passive="stepCam(1)">›</button>
      </div>
      <div v-if="atEdge" class="walk2-edge">edge of captured area</div>
    </div>
    <RouterLink v-if="!isTouch" :to="{ name: 'splat-walk', params: { splatId } }"
                class="walk2-back">← walk v1 (.ply)</RouterLink>
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
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const splatId = route.params.splatId;
const canvasEl = ref(null);
const status = ref('loading…');
const error = ref('');
const loading = ref(true);
const progressPct = ref(0);
const progressLabel = ref('');
const showHint = ref(false);
// Both of these are SET FROM THE CARPET once it loads (see applyScale). Scene units are
// arbitrary — a splat trained from COLMAP has no metric scale — so a hardcoded 1.5 m/s is a
// stroll in one capture and a rocket in the next.
const speed = ref(1.5);
const sizeInfo = ref('');
const sens = ref(0.14);
const upLabel = ref('');
// carpet-walk: confine the viewer to a TUBE around the flight path. See the clamp below.
const carpetWalk = ref(true);
// Was a hardcoded 0.6 in scene units, which only ever suited room-scale phone captures. The
// server now derives a radius from the capture's own extent and this is overwritten by it.
const radius = ref(0.6);
const radiusMax = ref(6);
// Which capture pose the viewer last stepped to, shown so "where the drone was" is a place
// you can name and return to rather than a vague region.
const camIndex = ref(0);
const camCount = ref(0);
let stepCam = () => {};
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
    const res = await fetch(`${base}/sog`);
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
    // carpet.world_up is trustworthy only when /carpet MEASURED it, which it reports as
    // up_confident (up_source 'arkit_traj'): gravity comes from the capture's own ARKit
    // trajectory, which is gravity-aligned by construction. The frames all agree — the brush
    // PLY sits in the COLMAP frame the carpet is derived in (splat->COLMAP nearest-neighbour
    // median 0.027 vs 0.90 if x,y were negated) and the SOG preserves it — so for those pods
    // an override would only ever be a way to make this wrong.
    //
    // Without a trajectory there is nothing to measure and /carpet guesses from the sensor
    // axis. That guess gets the axis right but can be a full 180 deg out on the SIGN, so
    // those pods DO need the flip — label it as a guess rather than presenting it as settled.
    const applyCamera = () => {
      camera.setPosition(pos);
      camera.lookAt(pos.clone().add(currentDir()), UP);
    };
    const upGuessed = carpet?.world_up && carpet.up_confident === false;
    // 'para' (portrait phone) gets the axis right but can be a full 180 deg out on the SIGN,
    // so it is the one that may need flipping. 'perp' (gimbal / levelled camera) resolves its
    // own sign from the point cloud, so calling it "may be flipped" would be misleading.
    upLabel.value = `(${UP.x.toFixed(2)}, ${UP.y.toFixed(2)}, ${UP.z.toFixed(2)})`
      + (carpet?.up_model ? ` ${carpet.up_source}` : '')
      + (upGuessed && carpet?.up_model === 'para' ? ' — sign may be flipped' : '')
      + (carpet?.traj_from ? ` via ${carpet.traj_from}` : '');

    // ---- carpet-walk: confinement to the captured volume ----
    // The flight path is the only place we KNOW the scene was observed from, and outside the
    // observed cone a 3DGS reconstruction is not merely unseen — it is a halo of stretched
    // gaussians encoding the background as it looked from the capture, so free flight out
    // there looks broken even when training views are sharp.
    //
    // v1 confined the camera to a sphere around the nearest camera CENTRE. That fails in two
    // ways this scene shows plainly:
    //   * a capture with a cut in it splits into disconnected blobs — the drone pod breaks
    //     into 87 + 65 cameras at ANY radius below 5 scene units, so whichever half you spawn
    //     in is the only half you can ever reach;
    //   * between sparse samples the volume is lumpy, and you get held back by geometry that
    //     is really just the gap between two spheres.
    // Clamping to the nearest point on the ordered POLYLINE instead gives one connected tube,
    // which is what "move more or less where the drone went" actually means.
    const CN = carpet?.centers?.length ? Float32Array.from(carpet.centers.flat()) : null;
    const nCam = CN ? (CN.length / 3) | 0 : 0;
    const walk = carpet?.walk || null;
    const isCut = new Uint8Array(Math.max(nCam - 1, 0));
    for (const i of (walk?.cuts || [])) if (i >= 0 && i < isCut.length) isCut[i] = 1;
    // Scene units are arbitrary, so every distance the controls speak in has to be derived
    // from the capture rather than assumed. `span` is the extent of the camera CORE (the
    // server drops mis-posed outliers first — one camera a thousand units out would otherwise
    // set the speed for the whole scene).
    if (walk?.tube_radius) {
      radius.value = walk.tube_radius;
      radiusMax.value = walk.tube_radius * 8;
    }
    if (walk?.span) {
      // Crossing the whole capture in about ten seconds reads as walking pace whatever the
      // scene's scale turns out to be.
      speed.value = Math.min(6, Math.max(0.2, walk.span / 10));
    }
    // Height along UP below which the camera would be underground. Without it, descending
    // simply buries you in the terrain — the tube alone does not stop it, because the drone
    // flew close enough to the ground that its own tube reaches through the floor.
    // The standoff must never rise above the LOWEST pose the capture actually occupied — the
    // drone flew there, so it is walkable by definition, and a floor above it makes stepping
    // to that pose and then touching W lurch the camera upwards.
    const floorH = walk && Number.isFinite(walk.floor)
      ? walk.floor + Math.min(0.02 * (walk.span || 1),
                              Math.max(0, walk.cam_height_min ?? 0))
      : null;

    // Nearest point on the path, as a polyline. Brute force over a few hundred segments is
    // nothing next to rendering a million gaussians, and it keeps the clamp exact.
    const _n = { d: 0, x: 0, y: 0, z: 0 };
    const nearestOnPath = (p) => {
      let bd = Infinity, bx = 0, by = 0, bz = 0;
      if (nCam === 1) {
        bx = CN[0]; by = CN[1]; bz = CN[2];
        bd = (p.x - bx) ** 2 + (p.y - by) ** 2 + (p.z - bz) ** 2;
      }
      for (let i = 0; i < nCam - 1; i++) {
        // Segments the capture never flew (a cut between two separate shots) are NOT part of
        // the walkable tube. Including them is what let the camera drift into un-observed
        // space and render as floaters; travel across a cut is by pose-step instead.
        if (isCut[i]) continue;
        const ax = CN[i * 3], ay = CN[i * 3 + 1], az = CN[i * 3 + 2];
        const ex = CN[i * 3 + 3] - ax, ey = CN[i * 3 + 4] - ay, ez = CN[i * 3 + 5] - az;
        const L2 = ex * ex + ey * ey + ez * ez;
        let t = L2 > 1e-12 ? ((p.x - ax) * ex + (p.y - ay) * ey + (p.z - az) * ez) / L2 : 0;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const cx = ax + ex * t, cy = ay + ey * t, cz = az + ez * t;
        const d2 = (p.x - cx) ** 2 + (p.y - cy) ** 2 + (p.z - cz) ** 2;
        if (d2 < bd) { bd = d2; bx = cx; by = cy; bz = cz; }
      }
      if (!Number.isFinite(bd)) {
        // Every segment was a cut (a capture of two lone stills, say), so the polyline has no
        // walkable length at all. Fall back to the nearest CENTRE, which always exists —
        // otherwise the clamp below divides by an infinite distance and parks the camera at
        // the origin.
        for (let i = 0; i < nCam; i++) {
          const d2 = (p.x - CN[i * 3]) ** 2 + (p.y - CN[i * 3 + 1]) ** 2
                   + (p.z - CN[i * 3 + 2]) ** 2;
          if (d2 < bd) { bd = d2; bx = CN[i * 3]; by = CN[i * 3 + 1]; bz = CN[i * 3 + 2]; }
        }
      }
      _n.d = Math.sqrt(bd); _n.x = bx; _n.y = by; _n.z = bz;
      return _n;
    };
    // Returns the outward unit normal when it had to pull the camera back, else null, so the
    // caller can also kill the outward velocity — otherwise holding W into a wall builds up
    // speed that releases as a lurch the moment you turn away.
    const clampToCarpet = () => {
      let pushed = null;
      if (nCam) {
        const nc = nearestOnPath(pos);
        const r = radius.value;
        if (carpetWalk.value && nc.d > r) {
          const ox = pos.x - nc.x, oy = pos.y - nc.y, oz = pos.z - nc.z;
          const k = r / (nc.d || 1);
          pos.set(nc.x + ox * k, nc.y + oy * k, nc.z + oz * k);
          pushed = new pc.Vec3(ox, oy, oz).normalize();
          distInfo.value = `dist to path ${r.toFixed(2)} (r ${r.toFixed(2)}) · clamped`;
        } else {
          distInfo.value = `dist to path ${nc.d.toFixed(2)} (r ${r.toFixed(2)}) · ` +
            (carpetWalk.value ? 'walking' : 'free-fly');
        }
      }
      // Floor last, so it wins: being pushed back into the tube must never push you under the
      // ground. Applied even in free-fly — sinking through the terrain is never what was
      // wanted, and it is the one confinement with no downside.
      if (floorH !== null) {
        const h = pos.dot(UP);
        if (h < floorH) {
          pos.add(UP.clone().mulScalar(floorH - h));
          if (!pushed) pushed = UP.clone();
        }
      }
      return pushed;
    };
    // Enabling the mode (or shrinking r) while parked outside must take effect at once, not
    // silently wait for the next keypress.
    reclamp = () => { clampToCarpet(); applyCamera(); };
    clampToCarpet();
    applyCamera();

    const vel = new pc.Vec3();

    // ---- step between capture poses ----
    // The tube lets you move around WITHIN the captured volume; this puts you exactly ON a
    // capture pose, position and heading together. It is the one movement guaranteed to show
    // the reconstruction at its best, it is how you cross a cut (the tube deliberately does
    // not bridge un-flown space), and on this drone capture it is the most direct reading of
    // "move where the drone was".
    const FW = carpet?.forwards?.length ? carpet.forwards : null;
    camIndex.value = carpet?.start_index ?? 0;
    // Recover yaw/pitch from a direction, inverting currentDir(): with refFwd perpendicular to
    // UP, d = f*cos(pitch) + UP*sin(pitch) where f is refFwd yawed about UP.
    const faceDir = (d) => {
      const dv = new pc.Vec3(...d).normalize();
      const s_ = dv.dot(UP);
      pitch = Math.max(-89, Math.min(89, (Math.asin(Math.max(-1, Math.min(1, s_))) * 180) / Math.PI));
      const flat = dv.clone().sub(UP.clone().mulScalar(s_));
      if (flat.lengthSq() < 1e-8) return;
      flat.normalize();
      const cross = new pc.Vec3().cross(refFwd, flat);
      yaw = (Math.atan2(cross.dot(UP), refFwd.dot(flat)) * 180) / Math.PI;
    };
    stepCam = (d) => gotoCam(camIndex.value + d);
    camCount.value = nCam;
    const gotoCam = (i) => {
      if (!nCam) return;
      const n = ((i % nCam) + nCam) % nCam;
      camIndex.value = n;
      pos.set(CN[n * 3], CN[n * 3 + 1], CN[n * 3 + 2]);
      if (FW) faceDir(FW[n]);
      vel.set(0, 0, 0);
      applyCamera();
    };

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
      if (e.code === 'BracketLeft') gotoCam(camIndex.value - 1);
      if (e.code === 'BracketRight') gotoCam(camIndex.value + 1);
      if (['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','Space','KeyC',
           'BracketLeft','BracketRight'].includes(e.code)) e.preventDefault();
    };
    const onKeyUp = (e) => { keys[e.code] = false; };
    const onClick = () => canvas.requestPointerLock?.();
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      // Raw deltas, no smoothing or acceleration — 1:1 is what makes an FPS feel direct.
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
    const onTouchStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
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
      if (e.cancelable && !e.target.closest?.('.walk2-vbtns')) e.preventDefault();
    };
    const onTouchMove = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
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
          yaw -= (t.clientX - lookTouch.x) * sens.value * 3;
          pitch = Math.max(-89, Math.min(89, pitch - (t.clientY - lookTouch.y) * sens.value * 3));
          lookTouch.x = t.clientX; lookTouch.y = t.clientY;
          applyCamera();
        }
      }
      if (e.cancelable) e.preventDefault();
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
    const ACCEL = 34;      // m/s^2 — reaches full speed in ~1/8 s
    const DAMP = 11;       // 1/s   — coasts a short distance after release
    const onUpdate = (dt) => {
      const step = Math.min(dt, 0.05);   // a stalled tab must not teleport the camera
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
</style>
