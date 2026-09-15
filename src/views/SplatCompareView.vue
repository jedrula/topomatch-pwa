<template>
  <div class="cmpv">
    <header class="cmpv-head">
      <RouterLink :to="{ name: 'splat-history' }" class="back">← history</RouterLink>
      <h1>Splat vs photo<span class="jid">{{ jobId }}</span></h1>
      <p class="lede">
        Each panel renders the splat from the pose it solved for one real photo, at that photo's
        size, so they line up pixel for pixel. If the photo is sharp and the render is not, the
        detail was lost in training. If the photo is soft too, it was lost in the capture.
      </p>
    </header>

    <div v-if="framesError" class="msg err">{{ framesError }}</div>

    <section v-else class="picker">
      <div class="picker-row">
        <span class="lbl">Frames</span>
        <span class="hint">
          {{ frames.length }} solved · {{ renderedCount }} already rendered.
          Rendering runs on the same GPU as training, so pick a few rather than all.
        </span>
      </div>
      <div class="chips">
        <button
          v-for="f in frames"
          :key="f.key"
          class="chip"
          :class="{ on: selected.has(f.key), ready: f.rendered }"
          @click="toggle(f.key)"
          :title="f.rendered ? 'already rendered — instant' : 'not rendered yet — needs the GPU'"
        >{{ f.key }}<span v-if="f.rendered" class="tick">•</span></button>
      </div>
      <div class="picker-actions">
        <button class="go" :disabled="!selected.size || busy" @click="renderSelected">
          {{ busy ? `Rendering ${done}/${selected.size}…` : `Compare ${selected.size || ''} frame${selected.size === 1 ? '' : 's'}` }}
        </button>
        <button class="ghost" :disabled="busy" @click="pickSpread">Pick 4 spread out</button>
        <button class="ghost" :disabled="busy || !panels.length" @click="panels = []">Clear results</button>
      </div>
    </section>

    <p v-if="busy" class="msg">
      Rendering one frame at a time so this never competes with a training run for the card.
      Frames marked • are cached and come back instantly.
    </p>
    <p v-if="renderError" class="msg err">{{ renderError }}</p>

    <div class="panels">
      <article v-for="p in panels" :key="p.view" class="panel">
        <h2>frame {{ p.view }}<span v-if="p.cached" class="cached">cached</span></h2>
        <SplatCompare :job-id="jobId" :view="p.view" />
      </article>
    </div>
  </div>
</template>

<script setup>
/*
 * A page rather than an inline block, for two reasons that are not about layout.
 *
 * Rendering a comparison runs gsplat on the SAME GPU as training, so a card that auto-rendered
 * the moment it was expanded put a browser tab in competition with a run. Here nothing renders
 * until you choose frames and press the button, and frames already rendered are marked so the
 * cheap ones are obvious.
 *
 * And one photo is not evidence. Two frames of the same model have disagreed on which of two
 * arms was better (0428: full frame favoured one, the zoom crop the other), so the page is
 * built to show several at once.
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import SplatCompare from '../components/SplatCompare.vue';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const jobId = route.params.jobId;

const frames = ref([]);
const framesError = ref('');
const renderError = ref('');
const selected = ref(new Set());
const panels = ref([]);
const busy = ref(false);
const done = ref(0);

const renderedCount = computed(() => frames.value.filter(f => f.rendered).length);

function toggle(k) {
  const s = new Set(selected.value);
  s.has(k) ? s.delete(k) : s.add(k);
  selected.value = s;
}

// Spread across the capture rather than four neighbours, which would all show the same wall.
function pickSpread() {
  const n = frames.value.length;
  if (!n) return;
  const idx = [0, 1, 2, 3].map(i => Math.floor((i + 0.5) * n / 4));
  selected.value = new Set(idx.map(i => frames.value[i].key));
}

async function load() {
  try {
    const gw = await getGateway();
    const res = await fetch(`${gw}/topowall/api/v1/video-to-splat/${jobId}/compare-frames`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { framesError.value = body.detail || `Could not list frames (${res.status})`; return; }
    frames.value = body.frames || [];
  } catch (e) {
    framesError.value = String(e);
  }
}
onMounted(load);

async function renderSelected() {
  busy.value = true; done.value = 0; renderError.value = '';
  const gw = await getGateway();
  const out = [];
  // Strictly one at a time. Firing these in parallel would put several gsplat renders on an
  // 8 GB card at once, which is how five training runs were lost to GPU contention before.
  for (const view of [...selected.value]) {
    try {
      const res = await fetch(`${gw}/topowall/api/v1/video-to-splat/${jobId}/compare-view`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { renderError.value = body.detail || `frame ${view} failed (${res.status})`; continue; }
      out.push({ view, cached: !!body.cached });
      const f = frames.value.find(x => x.key === view);
      if (f) f.rendered = true;
    } catch (e) {
      renderError.value = String(e);
    }
    done.value += 1;
  }
  panels.value = out;
  busy.value = false;
}
</script>

<style scoped>
.cmpv { max-width: 1180px; margin: 0 auto; padding: 20px 16px 60px; color: #e9eeeb; }
.back { color: #6FC8B0; text-decoration: none; font-size: .8rem; }
.cmpv-head h1 { font-size: 1.25rem; margin: 8px 0 4px; display: flex; align-items: baseline; gap: 10px; }
.jid { font-size: .8rem; color: #8a9a95; font-family: ui-monospace, monospace; }
.lede { color: #9fb0aa; font-size: .85rem; line-height: 1.6; margin: 0 0 18px; max-width: 70ch; }

.picker { border: 1px solid #2b3a36; border-radius: 4px; padding: 12px 14px; margin-bottom: 16px; }
.picker-row { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; margin-bottom: 8px; }
.lbl { font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: #8a9a95; }
.hint { font-size: .76rem; color: #8a9a95; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; max-height: 132px; overflow-y: auto; }
.chip {
  border: 1px solid #2b3a36; background: #151d1b; color: #9fb0aa; border-radius: 3px;
  font-size: .72rem; padding: 3px 7px; cursor: pointer; font-variant-numeric: tabular-nums;
}
.chip.ready { border-color: #3d5a52; color: #cfe; }
.chip.on { background: #6FC8B0; color: #0d1412; border-color: #6FC8B0; font-weight: 600; }
.tick { margin-left: 3px; }
.picker-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.go {
  background: #6FC8B0; color: #0d1412; border: 0; border-radius: 3px; font-weight: 600;
  font-size: .8rem; padding: 6px 14px; cursor: pointer;
}
.go:disabled { opacity: .45; cursor: default; }
.ghost {
  background: transparent; color: #9fb0aa; border: 1px solid #2b3a36; border-radius: 3px;
  font-size: .8rem; padding: 6px 12px; cursor: pointer;
}
.ghost:disabled { opacity: .45; cursor: default; }
.msg { font-size: .82rem; color: #9fb0aa; margin: 10px 0; line-height: 1.6; }
.msg.err { color: #f87171; }
.panels { display: flex; flex-direction: column; gap: 26px; }
.panel h2 {
  font-size: .78rem; letter-spacing: .1em; text-transform: uppercase; color: #8a9a95;
  margin: 0 0 2px; display: flex; gap: 10px; align-items: baseline;
}
.cached { color: #6FC8B0; letter-spacing: 0; text-transform: none; font-size: .72rem; }
@media (max-width: 600px) { .cmpv { padding: 14px 12px 40px; } }
</style>
