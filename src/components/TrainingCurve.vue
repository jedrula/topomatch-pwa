<template>
  <div class="curve-wrap">
    <div v-if="!anyData" class="curve-empty">No eval points in the log yet — Brush reports one every 1000 iterations.</div>

    <template v-else>
      <div class="curve-legend">
        <span v-for="s in plotted" :key="s.label" class="legend-item">
          <span class="legend-dot" :style="{ background: s.color }"></span>{{ s.label }}
        </span>
      </div>

      <figure class="chart">
        <figcaption>Eval PSNR by iteration<span class="unit">dB</span></figcaption>
        <svg :viewBox="`0 0 ${W} ${H1}`" role="img" aria-label="Eval PSNR by iteration">
          <line v-for="g in psnr.grid" :key="'pg' + g.v" class="grid" :x1="M.l" :x2="W - M.r" :y1="g.y" :y2="g.y" />
          <text v-for="g in psnr.grid" :key="'pt' + g.v" class="tick" :x="M.l - 8" :y="g.y + 4" text-anchor="end">{{ g.label }}</text>
          <text v-for="t in psnr.xticks" :key="'px' + t.v" class="tick" :x="t.x" :y="H1 - M.b + 18" text-anchor="middle">{{ t.label }}</text>
          <path v-for="s in psnr.lines" :key="'pl' + s.label" :d="s.d" fill="none" :stroke="s.color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <circle v-for="s in psnr.lines" :key="'pe' + s.label" :cx="s.ex" :cy="s.ey" r="3.5" :fill="s.color" class="endcap" />
          <text v-for="l in psnr.labels" :key="'pn' + l.label" class="endlabel" :x="l.x" :y="l.y" :fill="l.color">{{ l.label }}</text>
          <line v-if="crossX(psnr) != null" class="crosshair" :x1="crossX(psnr)" :x2="crossX(psnr)" :y1="M.t" :y2="H1 - M.b" />
          <rect :x="M.l" :y="M.t" :width="W - M.l - M.r" :height="H1 - M.t - M.b" fill="transparent"
                @mousemove="onMove($event, psnr)" @mouseleave="hover = null" />
        </svg>
      </figure>

      <figure class="chart">
        <figcaption>Splats by iteration<span class="unit">count</span></figcaption>
        <svg :viewBox="`0 0 ${W} ${H2}`" role="img" aria-label="Splat count by iteration">
          <line v-for="g in spl.grid" :key="'sg' + g.v" class="grid" :x1="M.l" :x2="W - M.r" :y1="g.y" :y2="g.y" />
          <text v-for="g in spl.grid" :key="'st' + g.v" class="tick" :x="M.l - 8" :y="g.y + 4" text-anchor="end">{{ g.label }}</text>
          <text v-for="t in spl.xticks" :key="'sx' + t.v" class="tick" :x="t.x" :y="H2 - M.b + 18" text-anchor="middle">{{ t.label }}</text>
          <path v-for="s in spl.lines" :key="'sl' + s.label" :d="s.d" fill="none" :stroke="s.color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
          <circle v-for="s in spl.lines" :key="'se' + s.label" :cx="s.ex" :cy="s.ey" r="3.5" :fill="s.color" class="endcap" />
          <text v-for="l in spl.labels" :key="'sn' + l.label" class="endlabel" :x="l.x" :y="l.y" :fill="l.color">{{ l.label }}</text>
          <line v-if="crossX(spl) != null" class="crosshair" :x1="crossX(spl)" :x2="crossX(spl)" :y1="M.t" :y2="H2 - M.b" />
          <rect :x="M.l" :y="M.t" :width="W - M.l - M.r" :height="H2 - M.t - M.b" fill="transparent"
                @mousemove="onMove($event, spl)" @mouseleave="hover = null" />
        </svg>
      </figure>

      <div v-if="hover" class="curve-tip" :style="{ left: hover.px + 'px', top: hover.py + 'px' }">
        <div class="tip-head">iter {{ hover.iter }}</div>
        <div v-for="r in hover.rows" :key="r.label" class="tip-row">
          <span class="legend-dot" :style="{ background: r.color }"></span>
          <span class="tip-name">{{ r.label }}</span>
          <b>{{ r.psnr != null ? r.psnr.toFixed(2) + ' dB' : '—' }}</b>
          <span class="tip-splats">{{ r.splats != null ? fmtSplats(r.splats) : '' }}</span>
        </div>
      </div>

      <table class="curve-table">
        <thead>
          <tr><th>run</th><th>iters</th><th>PSNR</th><th>SSIM</th><th>splats</th><th>growth froze</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in plotted" :key="'r' + s.label">
            <td class="tname"><span class="legend-dot" :style="{ background: s.color }"></span>{{ s.label }}</td>
            <td>{{ s.lastIter ?? '—' }}</td>
            <td>{{ s.lastPsnr != null ? s.lastPsnr.toFixed(2) : '—' }}</td>
            <td>{{ s.lastSsim != null ? s.lastSsim.toFixed(3) : '—' }}</td>
            <td>{{ s.lastSplats != null ? s.lastSplats.toLocaleString() : '—' }}</td>
            <td>{{ s.frozeAt != null ? s.frozeAt.toLocaleString() : 'still growing' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="curve-foot">
        PSNR here is Brush&rsquo;s own eval split at that run&rsquo;s training resolution, so it compares
        iterations within a run — not runs trained at different resolutions.
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

// Categorical slots, dark-surface steps, in fixed order — the order is what keeps adjacent
// pairs distinguishable under colour-vision deficiency, so assign by index and never cycle.
const PALETTE = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

const props = defineProps({
  // [{ label, eval: [{ i, psnr, ssim }], splats: [{ i, n }] }]
  series: { type: Array, required: true },
});

const W = 900, H1 = 300, H2 = 210;
const M = { l: 50, r: 104, t: 12, b: 28 };
const hover = ref(null);

const plotted = computed(() => props.series.slice(0, 8).map((s, i) => {
  const ev = s.eval ?? [], sp = s.splats ?? [];
  const lastEv = ev[ev.length - 1], lastSp = sp[sp.length - 1];
  // Growth stops when the splat count stops changing — read it off the trace rather than
  // trusting the requested --growth-stop, which is a fraction of a run that may have been cut short.
  let frozeAt = null;
  for (let k = sp.length - 1; k > 0; k--) {
    if (sp[k].n !== sp[k - 1].n) { frozeAt = sp[k].i; break; }
  }
  return {
    label: s.label, color: PALETTE[i % PALETTE.length], eval: ev, splats: sp,
    lastIter: lastEv?.i ?? null, lastPsnr: lastEv?.psnr ?? null, lastSsim: lastEv?.ssim ?? null,
    lastSplats: lastSp?.n ?? null, frozeAt,
  };
}));

const anyData = computed(() => plotted.value.some(s => s.eval.length || s.splats.length));

function niceTop(v) {
  const p = Math.pow(10, Math.floor(Math.log10(v || 1)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * p) return m * p;
  return 10 * p;
}

function build(key, xk, yk, H, fromZero, fmt) {
  const rows = plotted.value.map(s => ({ ...s, pts: (s[key] ?? []).map(p => [p[xk], p[yk]]) }))
                            .filter(s => s.pts.length);
  if (!rows.length) return { grid: [], xticks: [], lines: [], labels: [], x1: 0 };
  const all = rows.flatMap(s => s.pts);
  const x1 = Math.max(...all.map(p => p[0]), 1000);
  let y0, y1;
  if (fromZero) { y0 = 0; y1 = niceTop(Math.max(...all.map(p => p[1])) * 1.05) || 1; }
  else {
    y0 = Math.min(...all.map(p => p[1])); y1 = Math.max(...all.map(p => p[1]));
    const pad = (y1 - y0) * 0.12 || 1; y0 -= pad; y1 += pad;
  }
  const X = v => M.l + (v / x1) * (W - M.l - M.r);
  const Y = v => H - M.b - ((v - y0) / (y1 - y0 || 1)) * (H - M.t - M.b);
  const grid = [0, 1, 2, 3, 4].map(k => { const v = y0 + (y1 - y0) * k / 4; return { v, y: Y(v), label: fmt(v) }; });
  const step = x1 <= 8000 ? 1000 : 2000;
  const xticks = [];
  for (let v = 0; v <= x1 + 1; v += step) xticks.push({ v, x: X(v), label: v / 1000 + 'k' });
  const lines = rows.map(s => {
    const last = s.pts[s.pts.length - 1];
    return {
      label: s.label, color: s.color,
      d: s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(' '),
      ex: X(last[0]), ey: Y(last[1]),
    };
  });
  // Direct labels are the relief for legend-only identity; nudge them apart so they stay legible.
  const labels = lines.map(s => ({ label: s.label, color: s.color, x: s.ex + 9, y: s.ey + 4 }))
                      .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) if (labels[i].y - labels[i - 1].y < 13) labels[i].y = labels[i - 1].y + 13;
  return { grid, xticks, lines, labels, x1 };
}

function fmtSplats(n) {
  return n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n);
}

const psnr = computed(() => build('eval', 'i', 'psnr', H1, false, v => v.toFixed(1)));
const spl = computed(() => build('splats', 'i', 'n', H2, true,
  v => (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0))));

function nearest(pts, key, iter, tol) {
  if (!pts.length) return null;
  let best = pts[0];
  for (const p of pts) if (Math.abs(p.i - iter) < Math.abs(best.i - iter)) best = p;
  return Math.abs(best.i - iter) <= tol ? best[key] : null;
}

// Both charts share one iteration axis, so one hover drives both crosshairs and the tooltip
// reports both measures — reading PSNR and splat count at the same iteration is the whole
// point when the question is "did growth stopping cost me quality".
function onMove(ev, chart) {
  const svg = ev.currentTarget.ownerSVGElement;
  const r = svg.getBoundingClientRect();
  const sx = ((ev.clientX - r.left) / r.width) * W;
  const iter = ((sx - M.l) / (W - M.l - M.r)) * chart.x1;
  const tol = chart.x1 * 0.09;
  const rows = [];
  for (const s of plotted.value) {
    const psnrV = nearest(s.eval, 'psnr', iter, tol);
    const splatV = nearest(s.splats, 'n', iter, tol);
    if (psnrV != null || splatV != null) rows.push({ label: s.label, color: s.color, psnr: psnrV, splats: splatV });
  }
  if (!rows.length) { hover.value = null; return; }
  hover.value = { iter: Math.round(iter / 100) * 100, rows, px: ev.clientX + 14, py: ev.clientY - 8 };
}

// x is per-chart: the two traces do not necessarily end on the same iteration.
function crossX(chart) {
  if (!hover.value || !chart.x1) return null;
  return M.l + (hover.value.iter / chart.x1) * (W - M.l - M.r);
}
</script>

<style scoped>
.curve-wrap { margin-top: 10px; }
.curve-empty { color: #777; font-size: 0.85rem; padding: 10px 0; }

.curve-legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-bottom: 6px; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 0.78rem; color: #bbb; }
.legend-dot { width: 9px; height: 9px; border-radius: 50%; flex: none; display: inline-block; }

.chart { margin: 0 0 14px; }
.chart figcaption {
  font-size: 0.78rem; color: #999; margin-bottom: 2px;
  display: flex; justify-content: space-between;
}
.chart .unit { color: #666; }
svg { display: block; width: 100%; height: auto; overflow: visible; }
.grid { stroke: #2b2b2b; stroke-width: 1; }
.tick { fill: #777; font-size: 11px; }
.endlabel { font-size: 11px; font-weight: 600; }
.endcap { stroke: #111; stroke-width: 2; }
.crosshair { stroke: #777; stroke-width: 1; opacity: 0.6; }

.curve-tip {
  position: fixed; z-index: 40; pointer-events: none;
  background: #1c1c1c; border: 1px solid #3a3a3a; border-radius: 8px;
  padding: 7px 9px; font-size: 0.76rem; color: #ddd;
  box-shadow: 0 6px 20px rgba(0,0,0,0.5); font-variant-numeric: tabular-nums;
}
.tip-head { color: #999; margin-bottom: 3px; }
.tip-row { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
.tip-name { flex: 1; }
.tip-splats { color: #8b8a84; min-width: 42px; text-align: right; }

.curve-table {
  width: 100%; border-collapse: collapse; font-size: 0.78rem;
  font-variant-numeric: tabular-nums; margin-top: 4px;
}
.curve-table th, .curve-table td {
  text-align: right; padding: 4px 8px; border-bottom: 1px solid #262626; white-space: nowrap;
}
.curve-table th { color: #888; font-weight: 600; }
.curve-table th:first-child, .curve-table td:first-child { text-align: left; }
.curve-table .tname { display: flex; align-items: center; gap: 7px; }
.curve-foot { color: #666; font-size: 0.72rem; margin: 8px 0 0; }
</style>
