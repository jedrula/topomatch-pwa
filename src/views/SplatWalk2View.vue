<template>
  <div class="walk2-view">
    <canvas ref="canvasEl" class="walk2-canvas"></canvas>

    <div class="walk2-hud">
      <div><b>Walk / Fly v2</b> — <code>{{ splatId }}</code> <span class="tag">SOG</span></div>
      <div><b>WASD</b> move · <b>Shift</b> sprint · <b>Space/C</b> up/down · <b>Esc</b> release</div>
      <div class="walk2-note">carpet-walk keeps you where the camera actually went — no wall clipping</div>
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
        r <input type="range" min="0.1" max="6" step="0.05" v-model.number="radius"
                 :disabled="!carpetWalk" />
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

    <div v-if="showHint" class="walk2-hint">click to look around</div>
    <RouterLink :to="{ name: 'splat-walk', params: { splatId } }" class="walk2-back">← walk v1 (.ply)</RouterLink>
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
const speed = ref(1.5);
const sizeInfo = ref('');
const sens = ref(0.14);
const upLabel = ref('');
// carpet-walk: confine the viewer to within `radius` of a camera centre. See the clamp below.
const carpetWalk = ref(true);
const radius = ref(0.6);
const distInfo = ref('');
let reclamp = () => {};

let app = null;
let splatEntity = null;
let objectUrl = null;
let cleanupFns = [];

onMounted(async () => {
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
    // Returns the outward unit normal when it had to pull the camera back, else null, so the
    // caller can also kill the outward velocity — otherwise holding W into a wall builds up
    // speed that releases as a lurch the moment you turn away.
    const clampToCarpet = () => {
      if (!nCam) return null;
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
        (carpetWalk.value ? 'walking' : 'free-fly');
      return null;
    };
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
    const onClick = () => canvas.requestPointerLock?.();
    const onMove = (e) => {
      if (document.pointerLockElement !== canvas) return;
      // Raw deltas, no smoothing or acceleration — 1:1 is what makes an FPS feel direct.
      yaw -= e.movementX * sens.value;
      pitch = Math.max(-89, Math.min(89, pitch - e.movementY * sens.value));
      applyCamera();
    };
    const onLockChange = () => { showHint.value = document.pointerLockElement !== canvas; };
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
      if (keys.Space) want.add(up);
      if (keys.KeyC || keys.ControlLeft) want.sub(up);
      if (want.lengthSq() > 1e-8) {
        want.normalize().mulScalar(speed.value * (keys.ShiftLeft || keys.ShiftRight ? 3 : 1));
        vel.add(want.sub(vel).mulScalar(Math.min(1, ACCEL * step / Math.max(speed.value, 0.001))));
      } else {
        vel.mulScalar(Math.max(0, 1 - DAMP * step));
      }
      if (vel.lengthSq() > 1e-9) {
        pos.add(vel.clone().mulScalar(step));
        const n = clampToCarpet();
        if (n) {
          const outward = vel.dot(n);
          if (outward > 0) vel.sub(n.mulScalar(outward));
        }
        applyCamera();
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
.walk2-view { position: fixed; inset: 0; background: #0b0b0f; overflow: hidden; }
.walk2-canvas { width: 100%; height: 100%; display: block; }
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
