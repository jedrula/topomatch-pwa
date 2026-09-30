<script setup>
/*
 * Splat vs photo, from the same camera.
 *
 * A splat viewer can never answer "was this already blurry in the photo?", because you are
 * never looking from exactly where the camera stood. This renders the model from the pose it
 * solved for one real input photo, at that photo's size, so the two line up pixel for pixel.
 * Anything you see differ is a real difference.
 *
 * Three modes, because they catch different things: wipe for where it differs, split for an
 * overall impression, blink for small differences the eye only notices as change.
 */
import { ref, computed, onBeforeUnmount, watch } from 'vue';

import { getGateway } from '../config/gateway.js';

const props = defineProps({
  jobId: { type: String, required: true },
  // Which photo to compare against. Omitted = let the server pick the most detailed frame,
  // which is the right default for a single glance but useless for judging a model: two frames
  // of the same pair have disagreed on which was better. The compare PAGE passes this.
  view: { type: String, default: null },
});

// Resolve the gateway here rather than accept it as a prop: in SplatHistoryView `gateway` exists
// only as a local inside async functions, so the template was handing this component `undefined`
// and every request went to "undefined/topowall/...".
const gateway = ref('');

const loading = ref(true);
const error = ref('');
const data = ref(null);
const mode = ref('wipe');
const left = ref('photo');
const right = ref('this');
const wipe = ref(50);
const blinkOn = ref(true);
let blinkTimer = null;

const layers = computed(() => (data.value ? ['photo', ...data.value.arms] : ['photo']));
const base = computed(() =>
  `${gateway.value}/topowall/api/v1/video-to-splat/${props.jobId}/compare/${data.value?.view}`);
const src = (layer, crop) => `${base.value}/${layer}${crop ? '_crop' : ''}.jpg`;

// share of the photo's gradient energy this render kept — the "capture or synthesis" number
function pct(layer, crop) {
  const d = crop ? data.value?.detail_crop : data.value?.detail;
  if (!d || !d.photo) return null;
  return (100 * d[layer]) / d.photo;
}

const verdict = computed(() => {
  if (!data.value?.arms?.length) return null;
  const best = data.value.arms.reduce((b, a) => (pct(a) > pct(b) ? a : b), data.value.arms[0]);
  const v = pct(best);
  if (v == null) return null;
  if (v >= 60) return { tone: 'ok', text: `Keeps ${v.toFixed(0)}% of the photo's detail. Little lost in synthesis — if it still looks soft, look at the capture.` };
  if (v >= 25) return { tone: 'warn', text: `Keeps ${v.toFixed(0)}% of the photo's detail. The photo holds detail the splat does not.` };
  return { tone: 'warn', text: `Keeps only ${v.toFixed(0)}% of the photo's detail. Most of what the camera saw did not survive into the splat.` };
});

function stopBlink() {
  if (blinkTimer) { clearInterval(blinkTimer); blinkTimer = null; }
  blinkOn.value = true;
}
watch(mode, (m) => {
  stopBlink();
  if (m === 'blink') blinkTimer = setInterval(() => { blinkOn.value = !blinkOn.value; }, 700);
});
onBeforeUnmount(stopBlink);

async function load() {
  loading.value = true; error.value = '';
  try {
    gateway.value = await getGateway();
    const res = await fetch(
      `${gateway.value}/topowall/api/v1/video-to-splat/${props.jobId}/compare-view`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(props.view ? { view: props.view } : {}),
      },
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { error.value = body.detail || `Request failed (${res.status})`; return; }
    data.value = body;
    right.value = body.arms?.[0] ?? 'photo';
  } catch (e) {
    error.value = String(e);
  } finally {
    loading.value = false;
  }
}
load();

const overStyle = computed(() => {
  if (mode.value === 'blink') return { clipPath: 'none', opacity: blinkOn.value ? 1 : 0 };
  const p = mode.value === 'split' ? 50 : wipe.value;
  return { clipPath: `inset(0 ${100 - p}% 0 0)`, opacity: 1 };
});
</script>

<template>
  <div class="cmp">
    <p v-if="loading" class="cmp-msg">Rendering this splat from a real camera pose…</p>
    <p v-else-if="error" class="cmp-msg cmp-err">{{ error }}</p>

    <template v-else-if="data">
      <div class="cmp-bar">
        <span class="cmp-lbl">Mode</span>
        <div class="cmp-btns">
          <button v-for="m in ['wipe', 'split', 'blink']" :key="m" type="button"
                  :aria-pressed="mode === m" @click="mode = m">{{ m }}</button>
        </div>
        <span class="cmp-lbl">Left</span>
        <div class="cmp-btns">
          <button v-for="l in layers" :key="'l' + l" type="button"
                  :aria-pressed="left === l" @click="left = l">{{ l }}</button>
        </div>
        <span class="cmp-lbl">Right</span>
        <div class="cmp-btns">
          <button v-for="l in layers" :key="'r' + l" type="button"
                  :aria-pressed="right === l" @click="right = l">{{ l }}</button>
        </div>
        <span class="cmp-view">frame {{ data.view }}</span>
      </div>

      <div class="cmp-stage">
        <img :src="src(right)" :alt="`Right layer: ${right}`" />
        <div class="cmp-over" :style="overStyle">
          <img :src="src(left)" :alt="`Left layer: ${left}`" />
        </div>
        <span class="cmp-tag cmp-l">{{ left }}</span>
        <span class="cmp-tag cmp-r">{{ right }}</span>
        <div v-if="mode !== 'blink'" class="cmp-rule"
             :style="{ left: (mode === 'split' ? 50 : wipe) + '%' }"></div>
        <input v-if="mode === 'wipe'" v-model.number="wipe" class="cmp-slider" type="range"
               min="0" max="100" step="0.5" :id="`wipe-${jobId}`"
               aria-label="Wipe between the two selected layers" />
      </div>

      <p v-if="verdict" class="cmp-verdict" :class="verdict.tone">{{ verdict.text }}</p>

      <div class="cmp-crops">
        <div v-for="l in layers" :key="'c' + l" class="cmp-crop">
          <img :src="src(l, true)" :alt="`Zoom crop, ${l}`" />
          <span class="cmp-cap">{{ l }}
            <b>{{ l === 'photo' ? '100%' : (pct(l, true) == null ? '—' : pct(l, true).toFixed(0) + '%') }}</b>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cmp { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
.cmp-msg { color: #9aa; font-size: .85rem; margin: 0; }
.cmp-err { color: #f87171; }
.cmp-bar { display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: center; }
.cmp-lbl { font-size: .62rem; letter-spacing: .12em; text-transform: uppercase; color: #8a9a95; }
.cmp-view { font-size: .7rem; color: #8a9a95; margin-left: auto; font-variant-numeric: tabular-nums; }
.cmp-btns { display: flex; border: 1px solid #2b3a36; border-radius: 3px; overflow: hidden; }
.cmp-btns button {
  border: 0; border-right: 1px solid #2b3a36; background: #151d1b; color: #8a9a95;
  font-size: .74rem; font-weight: 600; padding: 4px 10px; cursor: pointer;
}
.cmp-btns button:last-child { border-right: 0; }
.cmp-btns button[aria-pressed='true'] { background: #6FC8B0; color: #0d1412; }
.cmp-btns button:focus-visible { outline: 2px solid #6FC8B0; outline-offset: -2px; }
.cmp-stage {
  position: relative; border: 1px solid #2b3a36; border-radius: 3px; overflow: hidden;
  line-height: 0; background: #0d1412;
}
.cmp-stage img { display: block; width: 100%; height: auto; }
.cmp-over { position: absolute; inset: 0; }
.cmp-over img { width: 100%; height: 100%; object-fit: cover; }
.cmp-rule {
  position: absolute; top: 0; bottom: 0; width: 2px; background: #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, .45); pointer-events: none;
}
.cmp-slider {
  position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0;
  cursor: ew-resize; -webkit-appearance: none; appearance: none; background: transparent;
}
.cmp-slider:focus-visible { opacity: 1; outline: 2px solid #6FC8B0; outline-offset: -2px; }
.cmp-tag {
  position: absolute; bottom: 8px; z-index: 2; font-size: .68rem; font-weight: 600;
  padding: 2px 7px; border-radius: 2px; background: rgba(8, 14, 12, .78); color: #fff;
  pointer-events: none;
}
.cmp-l { left: 8px; } .cmp-r { right: 8px; }
.cmp-verdict {
  margin: 0; font-size: .82rem; border-left: 3px solid #6FC8B0; padding-left: 12px; color: #cfe;
}
.cmp-verdict.warn { border-left-color: #E08A62; }
.cmp-crops { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
.cmp-crop { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.cmp-crop img { width: 100%; border: 1px solid #2b3a36; border-radius: 2px; display: block; }
.cmp-cap {
  font-size: .68rem; color: #8a9a95; display: flex; justify-content: space-between; gap: 6px;
  font-variant-numeric: tabular-nums;
}
.cmp-cap b { color: #e9eeeb; }
</style>
