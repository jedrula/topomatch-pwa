<template>
  <div class="cost-wrap">
    <div v-if="pts.length < 2" class="cost-empty">
      Not enough finished runs yet — this needs at least two with a recorded training time.
    </div>

    <template v-else>
      <figure class="chart">
        <figcaption>
          Training time by iteration count
          <span class="unit">{{ pts.length }} runs</span>
        </figcaption>
        <svg :viewBox="`0 0 ${W} ${H}`" role="img"
             aria-label="Scatter plot of training time against iteration count">
          <line v-for="g in grid" :key="'g' + g.v" class="grid"
                :x1="M.l" :x2="W - M.r" :y1="g.y" :y2="g.y" />
          <text v-for="g in grid" :key="'gt' + g.v" class="tick"
                :x="M.l - 8" :y="g.y + 4" text-anchor="end">{{ g.label }}</text>
          <text v-for="t in xticks" :key="'x' + t.v" class="tick"
                :x="t.x" :y="H - M.b + 18" text-anchor="middle">{{ t.label }}</text>

          <!-- Rate line through the origin. Brush trains ONE IMAGE PER ITERATION, so cost
               tracks iterations rather than dataset size, and a single slope predicts a run. -->
          <line class="fit" :x1="X(0)" :y1="Y(0)" :x2="X(xMax)" :y2="Y(rate * xMax)" />
          <text class="fit-label" :x="X(xMax) - 4" :y="Y(rate * xMax) - 8" text-anchor="end">
            ≈ {{ (rate * 1000).toFixed(0) }} s per 1k iters
          </text>

          <circle v-for="p in pts" :key="p.id" :cx="X(p.iters)" :cy="Y(p.secs)" :r="p.r"
                  :fill="p.color" class="dot"
                  @mouseenter="hover = p" @mouseleave="hover = null" />

          <text class="axis" :x="(M.l + W - M.r) / 2" :y="H - 2" text-anchor="middle">iterations</text>
        </svg>
      </figure>

      <div v-if="hover" class="cost-tip">
        <b>{{ hover.scene }}</b>
        <span>{{ hover.iters.toLocaleString() }} iters · {{ fmtTime(hover.secs) }}</span>
        <span>{{ hover.frames }} frames · {{ hover.trainer }}</span>
        <span class="tip-rate">{{ (hover.secs / hover.iters * 1000).toFixed(0) }} s per 1k iters</span>
      </div>
      <div v-else class="cost-note">
        Hover a point for the run. Brush trains one image per iteration, so time scales with
        <b>iterations</b>, not dataset size — the slope moves with resolution and splat count.
      </div>

      <table class="cost-table">
        <thead><tr><th>iterations</th><th>runs</th><th>median time</th><th>s per 1k</th></tr></thead>
        <tbody>
          <tr v-for="b in byIters" :key="b.iters">
            <td>{{ b.iters.toLocaleString() }}</td>
            <td>{{ b.n }}</td>
            <td>{{ fmtTime(b.median) }}</td>
            <td>{{ (b.median / b.iters * 1000).toFixed(0) }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<script setup>
/*
 * What a run costs, so "should I train longer?" has a number attached.
 *
 * Every finished pod records params.iters and pipeline_stats.train_s; this plots one against
 * the other. The line through the origin is the median rate, which predicts a run because
 * Brush trains one image per iteration — cost follows the iteration count, not how many photos
 * the scene has. Point size shows the dataset anyway, so a run that breaks that rule is visible
 * rather than hidden.
 */
import { ref, computed } from 'vue';

const props = defineProps({
  jobs: { type: Array, default: () => [] },
});

const W = 900, H = 300;
const M = { l: 56, r: 20, t: 14, b: 34 };
const hover = ref(null);

const COLORS = { brush: '#6FC8B0', gsplat: '#E0A062', instantsplat: '#8FA8E0', pgsr: '#C98FD0' };

const pts = computed(() => props.jobs
  .filter(j => j.status === 'done' && j.pipeline_stats?.train_s > 0 && j.params?.iters > 0)
  .map(j => {
    const frames = j.pipeline_stats.total_frames || 0;
    return {
      id: j.job_id,
      scene: j.scene || j.job_id,
      iters: j.params.iters,
      secs: j.pipeline_stats.train_s,
      frames,
      trainer: j.params.trainer || 'brush',
      // area ∝ frames, so a big dataset reads as a big dot without dwarfing the small ones
      r: 4 + Math.sqrt(Math.min(frames, 900)) / 6,
      color: COLORS[j.params.trainer] || '#8a9a95',
    };
  }));

const xMax = computed(() => Math.max(...pts.value.map(p => p.iters), 1000) * 1.05);
const yMax = computed(() => niceTop(Math.max(...pts.value.map(p => p.secs), 1) * 1.08));

function niceTop(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  for (const m of [1, 1.5, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

const X = v => M.l + (v / xMax.value) * (W - M.l - M.r);
const Y = v => H - M.b - (v / yMax.value) * (H - M.t - M.b);

// Median rather than a least-squares fit: one OOM-retry or a run that shared the GPU would
// drag a mean badly, and the point of the line is to predict a normal run.
const rate = computed(() => {
  const rs = pts.value.map(p => p.secs / p.iters).sort((a, b) => a - b);
  return rs[Math.floor(rs.length / 2)] || 0;
});

const grid = computed(() => [0, 1, 2, 3, 4].map(k => {
  const v = yMax.value * k / 4;
  return { v, y: Y(v), label: fmtTime(v) };
}));

const xticks = computed(() => {
  const step = xMax.value <= 12000 ? 2000 : 5000;
  const out = [];
  for (let v = 0; v <= xMax.value; v += step) out.push({ v, x: X(v), label: v / 1000 + 'k' });
  return out;
});

const byIters = computed(() => {
  const m = new Map();
  for (const p of pts.value) {
    if (!m.has(p.iters)) m.set(p.iters, []);
    m.get(p.iters).push(p.secs);
  }
  return [...m.entries()]
    .map(([iters, arr]) => {
      const s = [...arr].sort((a, b) => a - b);
      return { iters, n: s.length, median: s[Math.floor(s.length / 2)] };
    })
    .sort((a, b) => a.iters - b.iters);
});

function fmtTime(s) {
  if (s < 90) return `${Math.round(s)}s`;
  const m = s / 60;
  return m < 90 ? `${m.toFixed(m < 10 ? 1 : 0)}m` : `${(m / 60).toFixed(1)}h`;
}
</script>

<style scoped>
.cost-wrap { margin-top: 10px; }
.cost-empty { color: #777; font-size: .85rem; padding: 10px 0; }
.chart { margin: 0 0 8px; }
figcaption {
  font-size: .74rem; letter-spacing: .08em; text-transform: uppercase; color: #8a9a95;
  margin-bottom: 4px; display: flex; justify-content: space-between;
}
.unit { text-transform: none; letter-spacing: 0; color: #667; }
svg { width: 100%; height: auto; overflow: visible; }
.grid { stroke: #2b3a36; stroke-width: 1; }
.tick { fill: #8a9a95; font-size: 11px; font-variant-numeric: tabular-nums; }
.axis { fill: #667; font-size: 11px; }
.fit { stroke: #6FC8B0; stroke-width: 1.5; stroke-dasharray: 5 4; opacity: .65; }
.fit-label { fill: #6FC8B0; font-size: 11px; opacity: .9; }
.dot { opacity: .85; cursor: pointer; transition: opacity .12s; }
.dot:hover { opacity: 1; stroke: #fff; stroke-width: 1.5; }
.cost-tip, .cost-note {
  font-size: .78rem; color: #bbb; display: flex; flex-wrap: wrap; gap: 4px 14px;
  min-height: 2.6em; align-items: center;
}
.cost-tip b { color: #e9eeeb; }
.tip-rate { color: #6FC8B0; font-variant-numeric: tabular-nums; }
.cost-note { color: #8a9a95; display: block; line-height: 1.5; }
.cost-note b { color: #cfe; }
.cost-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: .78rem; }
.cost-table th {
  text-align: left; color: #8a9a95; font-weight: 600; font-size: .66rem;
  letter-spacing: .1em; text-transform: uppercase; padding: 4px 8px 4px 0;
  border-bottom: 1px solid #2b3a36;
}
.cost-table td {
  padding: 4px 8px 4px 0; color: #cfd8d4; font-variant-numeric: tabular-nums;
  border-bottom: 1px solid #1d2825;
}
</style>
