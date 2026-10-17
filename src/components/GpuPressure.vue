<template>
  <div class="gpu-pressure">
    <div v-if="lease" class="gp-now">
      <span v-if="lease.holder" class="gp-holder">{{ lease.holder }}</span>
      <span v-else class="gp-idle">GPU idle</span>
      <span v-if="lease.holder" class="gp-dim">holding {{ heldLabel }}</span>
      <span v-for="r in renders" :key="r.label" class="gp-dim">
        {{ r.label }} {{ r.done }}/{{ r.total }}{{ r.status === 'queued' ? ' (waiting)' : '' }}
      </span>
      <span v-for="j in sfm" :key="j.job_id" class="gp-dim">
        {{ j.job_id }} · SfM {{ j.sfm_progress.stage }}
        <template v-if="j.sfm_progress.estimable && j.sfm_progress.total">
          {{ j.sfm_progress.done }}/{{ j.sfm_progress.total }}
        </template>
        <template v-else>(no estimate)</template>
        <template v-if="j.sfm_progress.component">
          · component {{ j.sfm_progress.component }} ({{ j.sfm_progress.component_images }} imgs)
        </template>
      </span>
      <span v-if="lease.waiting?.length" class="gp-dim">
        waiting: {{ lease.waiting.join(', ') }}
      </span>
    </div>

    <div class="gp-head">
      <span class="gp-title">VRAM pressure</span>
      <span v-if="peakPct !== null" class="gp-peak" :class="{ hot: peakPct > 85 }">
        peak {{ (peak / 1024).toFixed(1) }} / {{ (totalMb / 1024).toFixed(0) }} GB
        ({{ peakPct.toFixed(0) }}%)
      </span>
      <span v-if="disk" class="gp-peak" :class="{ hot: disk.free_gb < 30 }"
            :title="`Pods volume: ${disk.used_pct}% of ${disk.total_gb.toFixed(0)} GB used. Renders, pods and caches all land here.`">
        disk {{ disk.free_gb.toFixed(0) }} GB free
      </span>
      <span class="gp-range">
        <button
          v-for="r in RANGES"
          :key="r.h"
          :class="{ on: hours === r.h }"
          @click="select(r.h)"
        >{{ r.label }}</button>
      </span>
    </div>

    <svg v-if="series.length > 1" class="gp-chart" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none">
      <!-- the ceiling is the point of the chart on an 8 GB card -->
      <line :x1="0" :x2="W" :y1="y(totalMb)" :y2="y(totalMb)" class="gp-ceil" />
      <line v-for="g in grid" :key="g" :x1="0" :x2="W" :y1="y(g)" :y2="y(g)" class="gp-grid" />
      <path :d="areaPath" class="gp-area" />
      <path :d="linePath" class="gp-line" />
    </svg>
    <p v-else class="gp-empty">{{ loading ? 'reading…' : 'no samples yet' }}</p>

    <div v-if="series.length > 1" class="gp-axis">
      <span>{{ fmt(series[0][0]) }}</span>
      <span class="gp-mid">{{ everyS }}s samples · bucket peak</span>
      <span>{{ fmt(series[series.length - 1][0]) }}</span>
    </div>
  </div>
</template>

<script setup>
// VRAM over time, read from the splat server's own sampler.
//
// Buckets show the PEAK rather than the mean: on an 8 GB card the question is
// always "did that run come near the ceiling", and averaging is exactly what
// hides it. The ceiling line is drawn for the same reason.
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({ apiBase: { type: String, required: true } });

const RANGES = [
  { h: 1, label: '1h' },
  { h: 12, label: '12h' },
  { h: 24 * 7, label: '7d' },
];
const W = 600, H = 120, PAD = 6;

const series = ref([]);
const totalMb = ref(0);
const peak = ref(0);
const disk = ref(null);          // { free_gb, total_gb, used_pct } of the pods volume
const everyS = ref(30);
const hours = ref(1);
const loading = ref(true);
// A splat job sitting at "queued" with nothing running looks broken, and is not: a RENDER
// may hold the GPU, and renders never appear on this page. One lease, two queues, so both
// have to be shown or the machine looks idle while it is fully busy.
const lease = ref(null);
const renders = ref([]);
// Running jobs that report where SfM has got to.
const sfm = ref([]);
let timer = null;

const peakPct = computed(() =>
  totalMb.value ? (peak.value / totalMb.value) * 100 : null);

const top = computed(() => Math.max(totalMb.value || 1, peak.value || 1));
const y = (mb) => H - PAD - (mb / top.value) * (H - 2 * PAD);
const xs = (i) => PAD + (i / Math.max(series.value.length - 1, 1)) * (W - 2 * PAD);

const grid = computed(() => {
  const step = top.value > 16000 ? 8192 : 2048;
  const out = [];
  for (let v = step; v < top.value; v += step) out.push(v);
  return out;
});

const linePath = computed(() => series.value
  .map((p, i) => `${i ? 'L' : 'M'}${xs(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(''));
const areaPath = computed(() => series.value.length
  ? `${linePath.value}L${xs(series.value.length - 1).toFixed(1)},${H - PAD}L${PAD},${H - PAD}Z`
  : '');

const fmt = (t) => {
  const d = new Date(t * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return hours.value > 24
    ? `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`
    : `${p(d.getHours())}:${p(d.getMinutes())}`;
};

const heldLabel = computed(() => {
  const s = lease.value?.held_s ?? 0;
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
});

async function loadNow() {
  try {
    const [l, r] = await Promise.all([
      fetch(`${props.apiBase}/topowall/api/v1/gpu/lease`).then((x) => x.json()),
      fetch(`${props.apiBase}/topowall/api/v1/sim/worlds/block2ha/renders`)
        .then((x) => x.json()).catch(() => ({ renders: [] })),
    ]);
    lease.value = l;
    renders.value = (r.renders ?? []).slice(0, 3);
    const jl = await fetch(`${props.apiBase}/topowall/api/v1/video-to-splat/jobs`)
      .then((x) => x.json()).catch(() => ({ jobs: [] }));
    sfm.value = (jl.jobs ?? []).filter((j) => j.status === 'running' && j.sfm_progress).slice(0, 2);
  } catch {
    lease.value = null; renders.value = [];
  }
}

async function load() {
  try {
    // The PWA reaches the splat server through the gateway's /topowall/* route,
    // the same way the history page already fetches job images.
    const r = await fetch(`${props.apiBase}/topowall/api/v1/gpu/pressure?hours=${hours.value}`);
    const d = await r.json();
    series.value = d.series ?? [];
    totalMb.value = d.total_mb ?? 0;
    peak.value = d.peak_mb ?? 0;
    everyS.value = d.sample_s ?? 30;
    disk.value = d.disk ?? null;
  } catch {
    series.value = [];          // the splat server is optional; the page still works
  } finally {
    loading.value = false;
  }
}

function select(h) {
  hours.value = h;
  loading.value = true;
  load();
}

onMounted(() => {
  load();
  loadNow();
  // Poll at the sampler's own cadence for the live view, lazily for long ranges:
  // a 7-day chart does not change meaningfully every half minute.
  timer = setInterval(() => { if (hours.value <= 12) load(); loadNow(); }, 15000);
});
onUnmounted(() => clearInterval(timer));
</script>

<style scoped>
.gpu-pressure { background: #161a22; border: 1px solid #262c38; border-radius: 8px;
  padding: 10px 12px 8px; margin: 0 0 14px; }
.gp-now { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline;
  font-size: 12px; margin: 0 0 8px; padding-bottom: 7px;
  border-bottom: 1px solid #222833; }
.gp-holder { font-family: ui-monospace, monospace; color: #6ea8ff; }
.gp-idle { color: #8b94a7; }
.gp-dim { color: #8b94a7; font-family: ui-monospace, monospace; font-size: 11.5px; }
.gp-head { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin: 0 0 7px; }
.gp-title { font-size: 13px; font-weight: 600; color: #dfe5ef; }
.gp-peak { font-family: ui-monospace, monospace; font-size: 12px; color: #8b94a7;
  font-variant-numeric: tabular-nums; }
.gp-peak.hot { color: #e0655f; }
.gp-range { margin-left: auto; display: flex; gap: 4px; }
.gp-range button { background: transparent; border: 1px solid #262c38; color: #8b94a7;
  border-radius: 4px; padding: 3px 9px; font-size: 11.5px; cursor: pointer;
  font-family: ui-monospace, monospace; }
.gp-range button.on { border-color: #6ea8ff; color: #6ea8ff; }
.gp-chart { width: 100%; height: 120px; display: block; }
.gp-grid { stroke: #262c38; stroke-width: 1; }
.gp-ceil { stroke: #e0655f; stroke-width: 1; stroke-dasharray: 4 4; opacity: .65; }
.gp-line { fill: none; stroke: #6ea8ff; stroke-width: 1.6; vector-effect: non-scaling-stroke; }
.gp-area { fill: rgba(110, 168, 255, .16); stroke: none; }
.gp-axis { display: flex; justify-content: space-between; font-family: ui-monospace, monospace;
  font-size: 10.5px; color: #5c6773; margin-top: 3px; }
.gp-mid { color: #4a5563; }
.gp-empty { font-size: 12px; color: #5c6773; margin: 14px 0; text-align: center; }
</style>
