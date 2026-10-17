<template>
  <div class="test-page">
    <div class="header">
      <h1>Splat regression tests</h1>
      <button class="btn" :disabled="loading" @click="load">Refresh</button>
    </div>

    <p v-if="error" class="err">{{ error }}</p>
    <p v-if="!data && loading" class="muted">Loading…</p>

    <template v-if="data">
      <!-- Conclusion first: the Jest-style summary of the selected run -->
      <div class="summary mono">
        <div>
          <b>Tests:</b>&nbsp;<span v-if="counts.fail" class="c-fail">{{ counts.fail }} failed, </span><span
            v-if="counts.running" class="c-run">{{ counts.running }} running, </span><span
            v-if="counts.pass" class="c-pass">{{ counts.pass }} passed, </span><span
            v-if="counts.skip" class="c-skip">{{ counts.skip }} skipped, </span>{{ cases.length }} total
        </div>
        <div class="muted">
          Time: {{ fmtMin(totalMinutes) }} · pipeline {{ runPipeline || data.pipeline_now }}
          <span v-if="runPipeline && runPipeline !== data.pipeline_now"> (now {{ data.pipeline_now }})</span>
        </div>
      </div>

      <div class="controls">
        <label class="sel">
          Run
          <select v-model="selectedRun">
            <option value="">latest of each test</option>
            <option v-for="r in data.runs" :key="r.run_id" :value="r.run_id">{{ r.run_id }} ({{ r.datasets.length }})</option>
          </select>
        </label>
        <button class="btn primary" :disabled="busy || running" @click="startRun('all')">Run all</button>
        <button class="btn" :disabled="busy || running || !failedNames.length" @click="startRun(failedNames)">
          Run failed{{ failedNames.length ? ` (${failedNames.length})` : '' }}
        </button>
      </div>

      <!-- The run that is going now -->
      <div v-if="running" class="live">
        <div>
          <span class="badge running">RUNNING</span>
          <b class="mono">{{ status.current || 'between tests' }}</b>
          <span class="muted"> · run {{ status.run_id }} · {{ status.done.length }}/{{ status.datasets.length }} done
            <template v-if="status.current_started"> · {{ elapsed(status.current_started) }} on this test</template></span>
          <a v-if="status.training_job" :href="historyLink(status.training_job)" class="link"> · job {{ status.training_job }}</a>
        </div>
        <pre class="log mono">{{ (status.log_tail || []).join('\n') }}</pre>
      </div>

      <!-- Test cases -->
      <div class="cases">
        <div v-for="c in cases" :key="c.ds.name" class="case" :class="c.state">
          <div class="case-head" @click="toggle(c.ds.name)">
            <span class="badge" :class="c.state">{{ c.label }}</span>
            <span class="name mono">{{ c.ds.name }}</span>
            <span class="title muted">{{ c.ds.title }}</span>
            <button class="btn small" :disabled="busy || running" @click.stop="startRun([c.ds.name])">Run</button>
          </div>
          <div v-if="c.snap" class="nums mono">
            <span>cf {{ f2(c.snap.psnr_cf) }}<i>{{ base(c, 'psnr_cf', f2) }}</i></span>
            <span>LPIPS {{ f3(c.snap.lpips) }}<i>{{ base(c, 'lpips', f3) }}</i></span>
            <span>placed {{ c.snap.placed ?? '–' }}/{{ c.snap.of ?? '–' }}<i>{{ base(c, 'placed') }}</i></span>
            <span>exam {{ c.snap.exam_placed ?? '–' }}/{{ c.snap.exam_views ?? '–' }}<i>{{ base(c, 'exam_placed') }}</i></span>
            <a v-if="c.snap.training_job" :href="historyLink(c.snap.training_job)" class="link">job {{ c.snap.training_job }}</a>
          </div>
          <div v-else class="nums muted mono">{{ c.note }}</div>
          <div v-for="w in c.why" :key="w" class="why mono">✕ {{ w }}</div>

          <div v-if="open[c.ds.name]" class="detail">
            <p class="what">{{ c.ds.what_it_tests }}</p>
            <p class="muted small-text">
              {{ c.ds.photos }} photos, {{ c.ds.exam }} exam ({{ c.ds.exam_kind }}) · {{ c.ds.source?.phone }} · {{ c.ds.source?.kind }} ·
              {{ c.ds.source?.light }} · {{ (c.ds.bytes / 1e6).toFixed(0) }} MB<span v-if="c.ds.lidar"> · LiDAR</span>
              <br>{{ c.ds.why_added }}
              <br>Baseline: <span class="mono">{{ c.ds.baseline?.run_id || 'none yet (the first good run becomes it)' }}</span>
              <span v-if="c.ds.baseline"> — {{ c.ds.baseline.by }}</span>
            </p>

            <!-- Snapshots: the 3 fixed views, real photo | this run | baseline -->
            <div v-if="viewSnap(c)" class="views">
              <div class="views-head muted small-text">
                Snapshot <span class="mono">{{ viewSnap(c).run_id }}</span> — photo · this run (colour-matched) · baseline
                <span class="mono">{{ c.ds.baseline?.run_id }}</span>
              </div>
              <div v-for="v in c.ds.views" :key="v" class="view-row">
                <figure v-for="img in viewImages(c, v)" :key="img.label">
                  <img v-if="img.src" :src="img.src" loading="lazy" @click="zoom = img.src">
                  <div v-else class="noimg">not placed</div>
                  <figcaption>{{ img.label }}</figcaption>
                </figure>
              </div>
            </div>

            <table class="hist mono">
              <thead><tr><th></th><th>run</th><th>pipeline</th><th>cf</th><th>LPIPS</th><th>placed</th><th>exam</th><th>job</th><th></th></tr></thead>
              <tbody>
                <tr v-for="r in c.ds.runs" :key="r.run_id" :class="{ sel: viewSnap(c)?.run_id === r.run_id }" @click="pick(c.ds.name, r.run_id)">
                  <td><span class="badge tiny" :class="verdictClass(r.verdict)">{{ verdictLabel(r.verdict) }}</span></td>
                  <td>{{ r.run_id }}<div class="muted">{{ (r.started || '').slice(0, 16).replace('T', ' ') }}</div></td>
                  <td>{{ r.versions?.pipeline }}<div v-if="r.versions?.repo_commit" class="muted">{{ r.versions.repo_commit.slice(0, 7) }}</div></td>
                  <td>{{ f2(r.psnr_cf) }}</td>
                  <td>{{ f3(r.lpips) }}</td>
                  <td>{{ r.placed ?? '–' }}/{{ r.of ?? '–' }}</td>
                  <td>{{ r.exam_placed ?? '–' }}/{{ r.exam_views ?? '–' }}</td>
                  <td><a v-if="r.training_job" :href="historyLink(r.training_job)" class="link" @click.stop>{{ r.training_job }}</a></td>
                  <td>
                    <button v-if="r.status === 'ok' && r.verdict !== 'baseline'" class="btn tiny-btn" :disabled="busy"
                            @click.stop="accept(c.ds.name, r.run_id)">Accept as baseline</button>
                    <a v-if="r.kind !== 'reference'" class="link" @click.stop="showLog(r)">log</a>
                  </td>
                </tr>
              </tbody>
            </table>
            <pre v-if="logFor && logFor.ds === c.ds.name" class="log mono">{{ logFor.lines.join('\n') }}</pre>
          </div>
        </div>
      </div>

      <details class="rules">
        <summary>When a test fails</summary>
        <ul class="mono"><li v-for="r in data.rules" :key="r">{{ r }}</li></ul>
        <p class="muted small-text">Each test is a frozen dataset run through the standard recipe on the GPU box
          (~/workdir/regression). Nightly at 02:30 when the box is idle. The baseline is the accepted snapshot.</p>
      </details>
    </template>

    <div v-if="zoom" class="zoom" @click="zoom = ''"><img :src="zoom"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { getGateway } from '../config/gateway.js';

const data = ref(null);
const loading = ref(false);
const busy = ref(false);
const error = ref('');
const selectedRun = ref('');
const open = ref({});
const picked = ref({});        // dataset -> run_id whose snapshot is shown
const logFor = ref(null);
const zoom = ref('');
let gateway = '';
let timer = null;

const api = path => `${gateway}/topowall/api/v1/regression${path}`;
const status = computed(() => data.value?.status || {});
const running = computed(() => !!status.value.running);

async function load() {
  loading.value = true;
  try {
    gateway = gateway || await getGateway();
    const r = await fetch(api(''));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    data.value = await r.json();
    error.value = '';
  } catch (e) {
    error.value = `Could not load the tests: ${e.message}`;
  } finally {
    loading.value = false;
    schedule();
  }
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(load, running.value ? 10000 : 60000);
}

async function post(path, body) {
  busy.value = true;
  try {
    const r = await fetch(api(path), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.detail || `HTTP ${r.status}`);
    return j;
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
    await load();
  }
}

const startRun = datasets => post('/run', { datasets });
async function accept(dataset, runId) {
  if (!confirm(`Accept ${runId} as the baseline for ${dataset}? Later runs are judged against it.`)) return;
  await post('/baseline', { dataset, run_id: runId });
}

async function showLog(r) {
  if (logFor.value && logFor.value.ds === r.dataset && logFor.value.run === r.run_id) { logFor.value = null; return; }
  const res = await fetch(api(`/log?run_id=${encodeURIComponent(r.run_id)}&dataset=${encodeURIComponent(r.dataset)}&lines=120`));
  const j = await res.json();
  logFor.value = { ds: r.dataset, run: r.run_id, lines: j.lines?.length ? j.lines : ['(no log)'] };
}

// One test case per dataset, in the selected run (or each dataset's latest snapshot)
const cases = computed(() => {
  if (!data.value) return [];
  const st = status.value;
  return data.value.datasets.map(ds => {
    const snap = selectedRun.value
      ? ds.runs.find(r => r.run_id === selectedRun.value)
      : ds.runs.find(r => r.kind !== 'reference');
    const isRunning = st.running && st.current === ds.name && (!selectedRun.value || selectedRun.value === st.run_id);
    const queued = st.running && st.datasets?.includes(ds.name) && !st.done?.includes(ds.name) && !isRunning
      && (!selectedRun.value || selectedRun.value === st.run_id);
    let state, label, why = [], note = '';
    if (isRunning) { state = 'running'; label = 'RUNNING'; }
    else if (queued) { state = 'skip'; label = 'QUEUED'; }
    else if (!snap) {
      state = 'skip'; label = 'SKIPPED';
      note = selectedRun.value ? 'not in this run'
        : ds.baseline ? `not run yet — baseline from reference job ${ds.baseline.training_job}` : 'not run yet, no baseline';
    } else if (snap.verdict === 'fail') { state = 'fail'; label = 'FAIL'; why = snap.why || []; }
    else { state = 'pass'; label = snap.verdict === 'new' ? 'PASS·NEW' : 'PASS'; }
    return { ds, snap: isRunning || queued ? null : snap, state, label, why, note: note || (isRunning ? 'running now' : queued ? 'waiting for its turn' : '') };
  });
});

const counts = computed(() => {
  const c = { pass: 0, fail: 0, running: 0, skip: 0 };
  cases.value.forEach(x => { c[x.state]++; });
  return c;
});
const failedNames = computed(() => cases.value.filter(c => c.state === 'fail').map(c => c.ds.name));
const totalMinutes = computed(() => cases.value.reduce((s, c) => s + (c.snap?.minutes || 0), 0));
const runPipeline = computed(() => {
  const ps = [...new Set(cases.value.map(c => c.snap?.versions?.pipeline).filter(p => p && p !== 'pre-suite'))];
  return ps.join(', ');
});

function toggle(name) { open.value = { ...open.value, [name]: !open.value[name] }; }
function pick(name, runId) { picked.value = { ...picked.value, [name]: runId }; }
function viewSnap(c) {
  const id = picked.value[c.ds.name];
  return (id && c.ds.runs.find(r => r.run_id === id)) || c.snap || c.ds.runs[0];
}
function img(ds, runId, file) { return `${api('')}/snapshot/${ds}/${runId}/${file}`; }
function viewImages(c, v) {
  const s = viewSnap(c); const stem = v.replace(/\.jpg$/i, '');
  const has = (snap, f) => snap?.images?.includes(f);
  const b = c.ds.baseline && c.ds.runs.find(r => r.run_id === c.ds.baseline.run_id);
  const photoSnap = has(s, `${stem}_photo.jpg`) ? s : b;
  return [
    { label: `photo ${stem}`, src: has(photoSnap, `${stem}_photo.jpg`) ? img(c.ds.name, photoSnap.run_id, `${stem}_photo.jpg`) : '' },
    { label: `run ${s.run_id}`, src: has(s, `${stem}_render_cf.jpg`) ? img(c.ds.name, s.run_id, `${stem}_render_cf.jpg`) : '' },
    { label: `baseline ${b?.run_id || '–'}`, src: has(b, `${stem}_render_cf.jpg`) ? img(c.ds.name, b.run_id, `${stem}_render_cf.jpg`) : '' },
  ];
}

function base(c, key, fmt = x => x) {
  const b = c.ds.baseline;
  if (!b || b.run_id === c.snap?.run_id || b[key] == null) return '';
  return ` (${fmt(b[key])})`;
}
const verdictClass = v => ({ pass: 'pass', new: 'pass', fail: 'fail', baseline: 'base' }[v] || 'skip');
const verdictLabel = v => ({ pass: 'PASS', new: 'NEW', fail: 'FAIL', baseline: 'BASE' }[v] || v);
const f2 = x => (x == null ? '–' : Number(x).toFixed(2));
const f3 = x => (x == null ? '–' : Number(x).toFixed(3));
const fmtMin = m => (!m ? '–' : m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${Math.round(m)} min`);
function elapsed(iso) { return fmtMin((Date.now() - new Date(iso).getTime()) / 60000); }
const historyLink = job => `/playground/splat/history?q=${job}`;

onMounted(load);
onUnmounted(() => clearTimeout(timer));
</script>

<style scoped>
.test-page { min-height: 100vh; background: #111; color: #ccc; padding: 20px 16px 40px; max-width: 900px; margin: 0 auto; box-sizing: border-box; }
.header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.header h1 { font-size: 1.25rem; color: #fff; flex: 1; margin: 0; }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
.muted { color: #777; }
.small-text { font-size: 0.8rem; line-height: 1.45; }
.err { color: #f87171; }
.btn { padding: 6px 12px; background: rgba(255,255,255,0.07); color: #ccc; border: 1px solid #333; border-radius: 6px; cursor: pointer; font-size: 0.85rem; }
.btn:hover:not(:disabled) { background: rgba(255,255,255,0.13); }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn.primary { border-color: #2f6f4f; color: #cfe; }
.btn.small { padding: 3px 10px; font-size: 0.78rem; margin-left: auto; }
.tiny-btn { padding: 2px 6px; font-size: 0.7rem; }
.summary { background: #181818; border: 1px solid #2a2a2a; border-radius: 8px; padding: 10px 12px; font-size: 0.9rem; line-height: 1.6; margin-bottom: 12px; }
.c-fail { color: #f87171; } .c-pass { color: #4ade80; } .c-run { color: #facc15; } .c-skip { color: #888; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
.sel { display: flex; gap: 6px; align-items: center; font-size: 0.85rem; flex: 1; min-width: 200px; }
.sel select { background: #1a1a1a; color: #ccc; border: 1px solid #333; border-radius: 6px; padding: 5px; max-width: 100%; }
.live { border: 1px solid #5a4a12; background: #17150c; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px; font-size: 0.85rem; }
.log { background: #0b0b0b; border: 1px solid #222; border-radius: 6px; padding: 8px; font-size: 0.72rem; line-height: 1.35; max-height: 260px; overflow: auto; white-space: pre-wrap; word-break: break-all; margin: 8px 0 0; color: #aaa; }
.cases { display: flex; flex-direction: column; gap: 6px; }
.case { background: #171717; border: 1px solid #262626; border-radius: 8px; padding: 8px 10px; }
.case.fail { border-color: #5b2323; }
.case-head { display: flex; align-items: center; gap: 8px; cursor: pointer; flex-wrap: wrap; }
.name { color: #eee; font-size: 0.88rem; }
.title { font-size: 0.8rem; }
.badge { display: inline-block; min-width: 62px; text-align: center; font: 700 0.72rem ui-monospace, Menlo, monospace; padding: 2px 6px; border-radius: 4px; color: #111; }
.badge.pass { background: #4ade80; } .badge.fail { background: #f87171; } .badge.running { background: #facc15; }
.badge.skip { background: #555; color: #ddd; } .badge.base { background: #3b5b8a; color: #e6eefc; }
.badge.tiny { min-width: 40px; font-size: 0.62rem; padding: 1px 4px; }
.nums { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 0.78rem; margin: 6px 0 0 70px; }
.nums i { color: #666; font-style: normal; }
.why { color: #f87171; font-size: 0.78rem; margin: 4px 0 0 70px; }
.link { color: #7aa7e0; text-decoration: none; cursor: pointer; margin-left: 4px; }
.detail { margin-top: 10px; border-top: 1px solid #262626; padding-top: 8px; }
.what { font-size: 0.85rem; margin: 0 0 6px; color: #bbb; }
.views { margin: 8px 0; max-width: 720px; }
.view-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; margin-top: 4px; }
.view-row figure { margin: 0; }
.view-row img { width: 100%; display: block; border-radius: 3px; cursor: zoom-in; background: #000; }
.view-row figcaption { font-size: 0.65rem; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.noimg { aspect-ratio: 4 / 3; background: #0c0c0c; border: 1px dashed #333; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #666; border-radius: 3px; }
.hist { width: 100%; border-collapse: collapse; font-size: 0.72rem; margin-top: 8px; display: block; overflow-x: auto; }
.hist th { text-align: left; color: #666; font-weight: normal; padding: 3px 6px; }
.hist td { padding: 4px 6px; border-top: 1px solid #222; vertical-align: top; white-space: nowrap; }
.hist tr { cursor: pointer; }
.hist tr.sel td { background: #1f2430; }
.rules { margin-top: 18px; font-size: 0.82rem; }
.rules summary { cursor: pointer; color: #999; }
.rules ul { padding-left: 18px; font-size: 0.78rem; }
.zoom { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.zoom img { max-width: 100%; max-height: 100%; }
@media (max-width: 560px) {
  .nums, .why { margin-left: 0; }
  .title { flex-basis: 100%; order: 3; }
}
</style>
