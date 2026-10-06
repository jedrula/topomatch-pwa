<template>
  <div class="vsv">
    <header class="vsv-head">
      <RouterLink :to="{ name: 'splat-history' }" class="back">← history</RouterLink>
      <h1>Splat vs splat<span class="jid">{{ jobId }} · {{ otherId }}</span></h1>
      <p class="lede">
        Both splats rendered from the pose each one solved for the same real photo, at the photo's
        size, so all three line up pixel for pixel and only the models differ. A job whose SfM
        fitted the lens is rendered back through that lens, so it lands on the original photo too.
      </p>
    </header>
    <div v-if="framesError" class="msg err">{{ framesError }}</div>
    <section v-else class="picker">
      <div class="picker-row">
        <span class="lbl">Frame</span>
        <span class="hint">{{ frames.length }} photos. Each render runs on the training GPU — one at a time.</span>
      </div>
      <div class="chips">
        <button v-for="f in frames" :key="f.key" class="chip" :class="{ on: view === f.key }"
                :disabled="busy" @click="pick(f.key)">{{ f.key }}</button>
      </div>
    </section>

    <p v-if="busy" class="msg">Rendering both splats for frame {{ view }}…</p>
    <p v-if="error" class="msg err">{{ error }}</p>

    <section v-if="data && !busy" class="stage-wrap">
      <div class="controls">
        <label>Left <select v-model="left"><option v-for="l in layers" :key="l" :value="l">{{ name(l) }}</option></select></label>
        <label>Right <select v-model="right"><option v-for="l in layers" :key="l" :value="l">{{ name(l) }}</option></select></label>
        <label class="grow">Wipe <input v-model.number="wipe" type="range" min="0" max="100" /></label>
        <label><input v-model="showCrop" type="checkbox" /> busiest crop</label>
      </div>
      <div class="stage">
        <img :src="src(right)" :alt="name(right)" />
        <img class="over" :src="src(left)" :alt="name(left)" :style="{ clipPath: `inset(0 ${100 - wipe}% 0 0)` }" />
        <div class="bar" :style="{ left: `${wipe}%` }"></div>
        <span class="tag l">{{ name(left) }}</span><span class="tag r">{{ name(right) }}</span>
      </div>
      <table class="nums">
        <thead><tr><th></th><th>splats</th><th>detail kept</th><th>detail kept, crop</th></tr></thead>
        <tbody>
          <tr v-for="l in layers" :key="l">
            <td>{{ name(l) }}</td>
            <td>{{ l === 'photo' ? '—' : splats(l) }}</td>
            <td>{{ pct(l) }}</td>
            <td>{{ pct(l, true) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
/*
 * Two jobs, one photo. The server's compare-view already renders extra pods (`also`) at each
 * one's own solved pose for the same photo, and renders a lens-fitted pod back through its lens
 * (compare_views.py), so this page only has to ask for both and wipe between any two layers.
 * Route: /splat/:jobId/vs/:otherId[?frame=0008]
 */
import { ref, computed, onMounted } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const jobId = route.params.jobId;
const otherId = route.params.otherId;
const frames = ref([]);
const framesError = ref('');
const view = ref(String(route.query.frame || ''));
const data = ref(null);
const busy = ref(false);
const error = ref('');
const gw = ref('');
const left = ref('this');
const right = ref('');
const wipe = ref(50);
const showCrop = ref(false);

const layers = computed(() => (data.value ? ['photo', ...data.value.arms] : []));
const otherLabel = otherId.slice(0, 6);
const name = (l) => (l === 'this' ? jobId : l === otherLabel ? otherId : l);
const src = (l) => `${gw.value}/topowall/api/v1/video-to-splat/${jobId}/compare/${data.value.view}/${l}${showCrop.value ? '_crop' : ''}.jpg?v=${data.value.rev}-${data.value.stamp}`;
function pct(l, crop) {
  const d = crop ? data.value?.detail_crop : data.value?.detail;
  if (!d || !d.photo || d[l] == null) return '—';
  return `${((100 * d[l]) / d.photo).toFixed(0)}%`;
}
const splats = (l) => {
  const n = data.value?.splats?.[l];
  return n ? `${(n / 1e6).toFixed(2)}M` : '—';
};

async function load() {
  gw.value = await getGateway();
  const res = await fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/compare-frames`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) { framesError.value = body.detail || `Could not list frames (${res.status})`; return; }
  frames.value = body.frames || [];
  if (view.value) pick(view.value);
}
onMounted(load);

async function pick(k) {
  view.value = k; busy.value = true; error.value = '';
  try {
    const res = await fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/compare-view`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view: k, also: [otherId] }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { error.value = body.detail || `Render failed (${res.status})`; return; }
    if (!body.arms.includes(otherLabel)) error.value = `${otherId} did not solve this photo — only ${jobId} is shown.`;
    // splat counts come from the manifest the renders were written with
    const m = await fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/compare/${body.view}/manifest.json?t=${Date.now()}`)
      .then(r => (r.ok ? r.json() : null)).catch(() => null);
    body.splats = Object.fromEntries((m?.arms || []).map(a => [a.label, a.splats]));
    body.stamp = Date.now();       // a re-render with `also` keeps the same rev; never show a stale arm
    data.value = body;
    left.value = 'this';
    right.value = body.arms.includes(otherLabel) ? otherLabel : 'photo';
  } catch (e) {
    error.value = String(e);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.vsv { max-width: 1180px; margin: 0 auto; padding: 20px 16px 60px; color: #e9eeeb; }
.back { color: #6FC8B0; text-decoration: none; font-size: .8rem; }
.vsv-head h1 { font-size: 1.25rem; margin: 8px 0 4px; display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.jid { font-size: .8rem; color: #8a9a95; font-family: ui-monospace, monospace; }
.lede { color: #9fb0aa; font-size: .85rem; line-height: 1.6; margin: 0 0 18px; max-width: 70ch; }
.picker { border: 1px solid #2b3a36; border-radius: 4px; padding: 12px 14px; margin-bottom: 16px; }
.picker-row { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: baseline; margin-bottom: 8px; }
.lbl { font-size: .64rem; letter-spacing: .12em; text-transform: uppercase; color: #8a9a95; }
.hint { font-size: .76rem; color: #8a9a95; }
.chips { display: flex; flex-wrap: wrap; gap: 4px; max-height: 132px; overflow-y: auto; }
.chip { border: 1px solid #2b3a36; background: #151d1b; color: #9fb0aa; border-radius: 3px; font-size: .72rem; padding: 3px 7px; cursor: pointer; font-variant-numeric: tabular-nums; }
.chip.on { background: #6FC8B0; color: #0d1412; border-color: #6FC8B0; font-weight: 600; }
.chip:disabled { opacity: .5; cursor: default; }
.msg { font-size: .82rem; color: #9fb0aa; margin: 10px 0; }
.msg.err { color: #f87171; }
.controls { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; font-size: .8rem; color: #9fb0aa; margin-bottom: 8px; }
.controls select { background: #151d1b; color: #e9eeeb; border: 1px solid #2b3a36; border-radius: 3px; padding: 3px 6px; margin-left: 4px; }
.controls .grow { flex: 1 1 200px; display: flex; gap: 8px; align-items: center; }
.controls .grow input { flex: 1; }
.stage { position: relative; line-height: 0; border: 1px solid #2b3a36; }
.stage img { width: 100%; height: auto; display: block; }
.stage .over { position: absolute; inset: 0; }
.bar { position: absolute; top: 0; bottom: 0; width: 2px; background: #6FC8B0; transform: translateX(-1px); pointer-events: none; }
.tag { position: absolute; top: 8px; font: 600 .7rem ui-monospace, monospace; background: rgba(13,20,18,.75); padding: 3px 6px; border-radius: 3px; line-height: 1.2; }
.tag.l { left: 8px; } .tag.r { right: 8px; }
.nums { margin-top: 10px; border-collapse: collapse; font-size: .8rem; font-variant-numeric: tabular-nums; }
.nums th, .nums td { text-align: left; padding: 4px 14px 4px 0; border-bottom: 1px solid #2b3a36; }
.nums th { color: #8a9a95; font-weight: 600; font-size: .68rem; text-transform: uppercase; letter-spacing: .08em; }
@media (max-width: 600px) { .vsv { padding: 14px 12px 40px; } }
</style>
