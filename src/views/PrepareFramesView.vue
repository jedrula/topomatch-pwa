<template>
  <div class="prepare-view">

    <!-- ── Pick videos ─────────────────────────────────────────── -->
    <section class="section">
      <h3>Prepare frames + masks</h3>

      <label class="pick-btn" :class="{ disabled: uploading }">
        {{ videoFiles.length ? `${videoFiles.length} video${videoFiles.length > 1 ? 's' : ''} selected` : 'Choose video(s)' }}
        <input type="file" accept="video/*" multiple :disabled="uploading" @change="onVideoFile" hidden />
      </label>

      <div v-if="videoFiles.length" class="file-list">
        <div v-for="(f, i) in videoFiles" :key="i" class="file-row">
          <span class="file-name">{{ f.name }}</span>
          <span class="file-size">{{ (f.size / 1e6).toFixed(1) }} MB</span>
          <button class="remove-btn" @click="removeVideo(i)" :disabled="uploading">✕</button>
        </div>
        <div class="total-size">{{ (videoFiles.reduce((s,f) => s + f.size, 0) / 1e6).toFixed(0) }} MB → localhost (no Cloudflare)</div>
      </div>
    </section>

    <!-- ── Params + submit ─────────────────────────────────────── -->
    <section v-if="videoFiles.length && !uploading" class="section">
      <div class="params">
        <div class="param-row">
          <label>FPS</label>
          <div class="toggle-group">
            <button v-for="v in [2,3,5]" :key="v" :class="{ active: fps===v }" @click="fps=v">{{ v }}</button>
          </div>
        </div>
        <div class="param-row">
          <label>blur</label>
          <div class="toggle-group">
            <button :class="{ active: blurPct===10 }" @click="blurPct=10">10%</button>
            <button :class="{ active: blurPct===25 }" @click="blurPct=25">25%</button>
            <button :class="{ active: blurPct===40 }" @click="blurPct=40">40%</button>
          </div>
        </div>
        <div class="param-row">
          <label>motion</label>
          <div class="toggle-group">
            <button :class="{ active: motionThresh===0.20 }" @click="motionThresh=0.20">sparse</button>
            <button :class="{ active: motionThresh===0.08 }" @click="motionThresh=0.08">moderate</button>
            <button :class="{ active: motionThresh===0.03 }" @click="motionThresh=0.03">dense</button>
          </div>
        </div>
        <button class="process-btn" @click="upload">⬆ Upload &amp; extract frames</button>
        <div v-if="submitError" class="error">{{ submitError }}</div>
      </div>
    </section>

    <section v-if="uploading" class="section">
      <p class="hint">Uploading {{ (videoFiles.reduce((s,f) => s + f.size, 0) / 1e6).toFixed(0) }} MB to localhost…</p>
    </section>

    <!-- ── Jobs ───────────────────────────────────────────────── -->
    <section v-if="jobs.length" class="section">
      <h3>Jobs</h3>
      <div class="job-list">
        <div v-for="job in jobs" :key="job.job_id"
             class="job-card" :class="job.status" @click="selectJob(job.job_id)">
          <div class="job-header">
            <span class="job-id">{{ job.job_id }}</span>
            <span class="job-status" :class="job.status">{{ job.status }}</span>
          </div>
          <div class="job-meta">
            <span v-if="job.frame_count">{{ job.frame_count }} frames</span>
            <span v-if="job.mask_count">· {{ job.mask_count }} masks</span>
            <span v-if="job.elapsed_s">· {{ Math.round(job.elapsed_s/60) }}m {{ job.elapsed_s%60 }}s</span>
            <span v-if="job.params?.skip_masking" class="tag">frames only</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Job detail ─────────────────────────────────────────── -->
    <section v-if="selectedJobId" class="section">
      <div class="job-detail-header">
        <h3>Job {{ selectedJobId }}</h3>
        <span class="job-status" :class="selectedJob?.status">{{ selectedJob?.status }}</span>
      </div>

      <div class="log-box" ref="logBoxEl">
        <div v-for="(line, i) in logLines" :key="i" class="log-line">{{ line }}</div>
        <div v-if="!logLines.length" class="log-empty">Waiting…</div>
      </div>

      <!-- Frames-only job done → show grid + masking options -->
      <template v-if="selectedJob?.status === 'done' && selectedJob?.params?.skip_masking">
        <div class="results-row">✅ {{ selectedJob.frame_count }} frames extracted</div>

        <div v-if="serverFrames.length" style="margin-top:12px">
          <div class="hint">{{ serverFrames.length }} frames — scroll to review</div>
          <div class="thumb-grid">
            <img v-for="name in serverFrames" :key="name"
                 :src="`${gateway}/topowall/api/v1/prepare-frames/${selectedJobId}/frames/${name}`"
                 class="thumb-img" loading="lazy" />
          </div>
        </div>

        <div style="margin-top:16px">
          <div class="param-row mask-row">
            <label>masking</label>
            <div class="mask-options">
              <label class="mask-option" :class="{ active: maskMode==='sam3' }" @click="maskMode='sam3'">
                <span class="opt-title">SAM3 only</span>
                <span class="opt-desc">Wall segmentation.</span>
              </label>
              <label class="mask-option" :class="{ active: maskMode==='sam3+depth' }" @click="maskMode='sam3+depth'">
                <span class="opt-title">SAM3 + depth <small>(recommended)</small></span>
                <span class="opt-desc">DA3 depth removes background leakage.</span>
              </label>
            </div>
          </div>
          <div v-if="maskError" class="error">{{ maskError }}</div>
          <button class="process-btn" style="background:#7c3aed" :disabled="maskRunning" @click="runMasking">
            {{ maskRunning ? 'Queued…' : 'Run SAM3 masking' }}
          </button>
        </div>
      </template>

      <!-- Fully done → mask previews + train -->
      <template v-else-if="selectedJob?.status === 'done' && !selectedJob?.params?.skip_masking">
        <div class="results-row">✅ {{ selectedJob.frame_count }} frames · {{ selectedJob.mask_count }} masks</div>

        <div v-if="previews.length" style="margin-top:12px">
          <div class="hint">Mask previews</div>
          <div class="preview-grid">
            <img v-for="p in previews" :key="p"
                 :src="`${gateway}/topowall/api/v1/prepare-frames/${selectedJobId}/previews/${p}`"
                 class="preview-img" loading="lazy" />
          </div>
        </div>

        <div class="vast-section">
          <h4>Train on vast.ai</h4>
          <div v-if="trainStatus==='idle'">
            <div v-if="!vastInstances" class="hint">Loading instances…</div>
            <div v-else-if="!vastInstances.length" class="no-instances">
              <p class="hint">No running vast.ai instances found. Rent one with the commands below, then click Refresh.</p>
              <div class="step-list">
                <div class="step">
                  <span class="step-num">1</span>
                  <div class="step-body">
                    <div class="step-label">Find a GPU offer (≥20 GB VRAM, RTX 3090 or better, nerfstudio Docker image ~12 GB pull ~2 min)</div>
                    <pre class="cmd">vastai search offers "gpu_ram>=20 num_gpus=1 inet_down>500 reliability>0.97 disk_space>60 dph_total<0.55" --order "dph_total asc" --limit 8</pre>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">2</span>
                  <div class="step-body">
                    <div class="step-label">Create instance with nerfstudio image — replace OFFER_ID with a value from step 1</div>
                    <pre class="cmd">vastai create instance OFFER_ID --image "ghcr.io/nerfstudio-project/nerfstudio:latest" --disk 60 --ssh --direct</pre>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">3</span>
                  <div class="step-body">
                    <div class="step-label">Wait ~2 min for the instance to reach <em>running</em> state</div>
                    <pre class="cmd">vastai show instances-v1</pre>
                  </div>
                </div>
                <div class="step">
                  <span class="step-num">4</span>
                  <div class="step-body step-label">Click Refresh — the instance will appear in the list and you can launch training.</div>
                </div>
              </div>
              <button class="refresh-btn" @click="fetchVastInstances">↺ Refresh instances</button>
            </div>
            <div v-else class="instance-list">
              <div v-for="inst in vastInstances" :key="inst.id"
                   class="instance-row" :class="{ selected: selectedInstance===inst.id }"
                   @click="selectedInstance=inst.id">
                <span class="inst-gpu">{{ inst.gpu_name }}</span>
                <span class="inst-id">{{ inst.id }}</span>
                <span class="inst-cost">${{ inst.dph_total }}/hr</span>
              </div>
            </div>
            <button class="train-btn" :disabled="!selectedInstance" @click="launchTraining">🚀 Launch training</button>
          </div>
          <div v-else>
            <span class="job-status" :class="trainStatus">{{ trainStatus }}</span>
            <div class="log-box train-log" ref="trainLogEl">
              <div v-for="(l,i) in trainLogLines" :key="i" class="log-line">{{ l }}</div>
            </div>
            <a v-if="trainStatus==='done'"
               :href="`${gateway}/topowall/api/v1/prepare-frames/${selectedJobId}/splat`"
               class="download-btn" download>⬇ Download .splat</a>
            <button v-if="trainStatus==='error'" class="retry-btn" @click="trainStatus='idle'">↺ Retry training</button>
          </div>
        </div>
      </template>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { getGateway } from '../config/gateway.js';

const videoFiles   = ref([]);
const fps          = ref(5);
const blurPct      = ref(25);
const motionThresh = ref(0.08);
const uploading    = ref(false);
const submitError  = ref('');

const jobs          = ref([]);
const selectedJobId = ref(null);
const logLines      = ref([]);
const serverFrames  = ref([]);
const previews      = ref([]);
const logBoxEl      = ref(null);
const selectedJob   = computed(() => jobs.value.find(j => j.job_id === selectedJobId.value));

const maskMode    = ref('sam3+depth');
const maskRunning = ref(false);
const maskError   = ref('');

const vastInstances    = ref(null);
const selectedInstance = ref('');
const trainStatus      = ref('idle');
const trainLogLines    = ref([]);
const trainLogEl       = ref(null);

const gateway = ref('');
let pollInterval     = null;
let jobsPollInterval = null;
let trainPollInterval = null;

function onVideoFile(e) { videoFiles.value = [...videoFiles.value, ...Array.from(e.target.files||[])]; e.target.value=''; }
function removeVideo(i) { videoFiles.value = videoFiles.value.filter((_,idx) => idx!==i); }

async function upload() {
  submitError.value = '';
  uploading.value = true;
  const fd = new FormData();
  for (const f of videoFiles.value) fd.append('videos', f);
  fd.append('fps', fps.value);
  fd.append('blur_pct', blurPct.value);
  fd.append('motion_thresh', motionThresh.value);
  fd.append('max_frames', 400);
  fd.append('preview_every', 20);
  fd.append('skip_masking', true);
  fd.append('skip_depth', true);
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/prepare-frames`, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || res.statusText);
    videoFiles.value = [];
    selectedJobId.value = data.job_id;
    await fetchJobs();
    startPolling(data.job_id);
  } catch (e) {
    submitError.value = e.message;
  } finally {
    uploading.value = false;
  }
}

async function runMasking() {
  maskRunning.value = true;
  maskError.value = '';
  const skipDepth = maskMode.value !== 'sam3+depth';
  try {
    const res = await fetch(
      `${gateway.value}/topowall/api/v1/prepare-frames/${selectedJobId.value}/run-masking?skip_depth=${skipDepth}`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error((await res.json()).detail);
    startPolling(selectedJobId.value);
  } catch (e) { maskError.value = e.message; maskRunning.value = false; }
}

async function selectJob(jobId) {
  selectedJobId.value = jobId;
  logLines.value = []; serverFrames.value = []; previews.value = [];
  maskRunning.value = false; maskError.value = '';
  clearInterval(trainPollInterval);
  const job = jobs.value.find(j => j.job_id === jobId);
  if (job) { trainStatus.value = job.train_status || 'idle'; selectedInstance.value = job.train_instance_id || ''; }
  await fetchLogs(jobId);
  if (job?.status === 'queued' || job?.status === 'running') {
    startPolling(jobId);
  } else if (job?.status === 'done') {
    if (job.params?.skip_masking) await fetchServerFrames(jobId);
    else { await fetchPreviews(jobId); await fetchVastInstances(); }
  }
}

function startPolling(jobId) {
  clearInterval(pollInterval);
  maskRunning.value = false;
  pollInterval = setInterval(async () => {
    const done = await fetchLogs(jobId);
    await fetchJobs();
    if (done && selectedJobId.value === jobId) {
      clearInterval(pollInterval);
      const job = jobs.value.find(j => j.job_id === jobId);
      if (job?.params?.skip_masking) await fetchServerFrames(jobId);
      else { await fetchPreviews(jobId); await fetchVastInstances(); }
    }
  }, 2000);
}

async function fetchLogs(jobId) {
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/prepare-frames/${jobId}/logs`);
    if (!res.ok) return false;
    const d = await res.json();
    logLines.value = d.log_lines || [];
    await nextTick();
    if (logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
    return d.status === 'done' || d.status === 'error';
  } catch { return false; }
}

async function fetchServerFrames(jobId) {
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/prepare-frames/${jobId}/frames`);
    serverFrames.value = res.ok ? ((await res.json()).frames || []) : [];
  } catch {}
}

async function fetchPreviews(jobId) {
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/prepare-frames/${jobId}/previews`);
    previews.value = res.ok ? ((await res.json()).previews || []) : [];
  } catch {}
}

async function fetchJobs() {
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/prepare-frames/jobs`);
    jobs.value = res.ok ? ((await res.json()).jobs || []) : [];
  } catch {}
}

async function fetchVastInstances() {
  try {
    const res = await fetch(`${gateway.value}/topowall/api/v1/vast/instances`);
    vastInstances.value = res.ok ? ((await res.json()).instances || []) : [];
    if (vastInstances.value.length === 1) selectedInstance.value = vastInstances.value[0].id;
  } catch { vastInstances.value = []; }
}

async function launchTraining() {
  trainStatus.value = 'queued'; trainLogLines.value = [];
  try {
    const res = await fetch(
      `${gateway.value}/topowall/api/v1/prepare-frames/${selectedJobId.value}/train-vast`,
      { method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ instance_id: selectedInstance.value }) }
    );
    if (!res.ok) throw new Error((await res.json()).detail);
    startTrainPolling(selectedJobId.value);
  } catch (e) { trainStatus.value = 'idle'; }
}

function startTrainPolling(jobId) {
  clearInterval(trainPollInterval);
  trainPollInterval = setInterval(async () => {
    try {
      const d = await (await fetch(`${gateway.value}/topowall/api/v1/prepare-frames/${jobId}/logs`)).json();
      trainStatus.value = d.train_status || 'idle';
      const idx = (d.log_lines||[]).findIndex(l => l.includes('[vast]'));
      trainLogLines.value = idx >= 0 ? d.log_lines.slice(idx) : [];
      await nextTick();
      if (trainLogEl.value) trainLogEl.value.scrollTop = trainLogEl.value.scrollHeight;
      if (!['queued','uploading','running'].includes(trainStatus.value)) clearInterval(trainPollInterval);
    } catch {}
  }, 3000);
}

onMounted(async () => {
  gateway.value = await getGateway();
  await fetchJobs();
  const ip = jobs.value.find(j => j.status === 'queued' || j.status === 'running');
  if (ip) { selectedJobId.value = ip.job_id; startPolling(ip.job_id); }
  jobsPollInterval = setInterval(fetchJobs, 5000);
});

onUnmounted(() => {
  clearInterval(pollInterval);
  clearInterval(jobsPollInterval);
  clearInterval(trainPollInterval);
});
</script>

<style scoped>
.prepare-view { padding: 20px; max-width: 900px; margin: 0 auto; color: #e5e7eb; }
.section { background: #1a1a1a; border: 1px solid #2d2d2d; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
h3 { margin: 0 0 12px; font-size: 1rem; color: #fff; }
h4 { margin: 16px 0 8px; font-size: 0.9rem; color: #9ca3af; }
.hint { font-size: 0.82rem; color: #6b7280; margin-bottom: 8px; line-height: 1.5; }
.error { color: #ef4444; font-size: 0.85rem; margin-top: 8px; }

.pick-btn { display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.pick-btn.disabled { background: #374151; cursor: not-allowed; }
.file-list { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.file-row { display: flex; align-items: center; gap: 10px; background: #111; border-radius: 4px; padding: 6px 10px; font-size: 0.85rem; }
.file-name { flex: 1; color: #d1d5db; }
.file-size { color: #6b7280; font-size: 0.8rem; }
.total-size { font-size: 0.78rem; color: #4b5563; padding: 4px 10px; }
.remove-btn { background: none; border: none; color: #6b7280; cursor: pointer; padding: 2px 6px; }
.remove-btn:hover { color: #ef4444; }

.params { display: flex; flex-direction: column; gap: 12px; }
.param-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.param-row > label:first-child { width: 80px; flex-shrink: 0; color: #9ca3af; font-size: 0.85rem; }
.toggle-group { display: flex; gap: 4px; }
.toggle-group button { padding: 4px 12px; background: #1f2937; border: 1px solid #374151; color: #9ca3af; border-radius: 4px; cursor: pointer; font-size: 0.82rem; }
.toggle-group button.active { background: #2563eb; color: #fff; border-color: #2563eb; }

.mask-row { align-items: flex-start; }
.mask-options { display: flex; flex-direction: column; gap: 6px; flex: 1; }
.mask-option { display: flex; flex-direction: column; gap: 2px; background: #111; border: 1px solid #2d2d2d; border-radius: 6px; padding: 10px 12px; cursor: pointer; }
.mask-option.active { border-color: #2563eb; background: #172554; }
.opt-title { font-size: 0.85rem; color: #e5e7eb; font-weight: 500; }
.opt-title small { font-weight: 400; color: #6ee7b7; margin-left: 4px; }
.opt-desc { font-size: 0.75rem; color: #6b7280; }

.process-btn { margin-top: 6px; padding: 10px 24px; background: #059669; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
.process-btn:hover:not(:disabled) { background: #047857; }
.process-btn:disabled { background: #374151; cursor: not-allowed; }

.job-list { display: flex; flex-direction: column; gap: 8px; }
.job-card { background: #111; border: 1px solid #2d2d2d; border-radius: 6px; padding: 10px 14px; cursor: pointer; }
.job-card:hover { border-color: #4b5563; }
.job-card.running { border-color: #2563eb33; }
.job-card.done    { border-color: #05966933; }
.job-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.job-id { font-size: 0.82rem; color: #6b7280; font-family: monospace; }
.job-meta { font-size: 0.8rem; color: #4b5563; display: flex; gap: 6px; align-items: center; }
.tag { background: #1f2937; color: #6b7280; border-radius: 3px; padding: 1px 6px; font-size: 0.72rem; }

.job-status { font-size: 0.75rem; font-weight: 600; padding: 2px 8px; border-radius: 10px; }
.job-status.queued  { background: #1f2937; color: #9ca3af; }
.job-status.running { background: #1e3a8a; color: #93c5fd; }
.job-status.done    { background: #064e3b; color: #6ee7b7; }
.job-status.error   { background: #7f1d1d; color: #fca5a5; }

.job-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.job-detail-header h3 { margin: 0; }

.log-box { background: #0a0a0a; border: 1px solid #1f2937; border-radius: 6px; padding: 12px; height: 240px; overflow-y: auto; font-family: monospace; font-size: 0.75rem; line-height: 1.5; }
.log-line { color: #9ca3af; white-space: pre-wrap; word-break: break-all; }
.log-empty { color: #374151; }

.results-row { color: #6ee7b7; font-size: 0.9rem; margin: 12px 0; }

.thumb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 4px; max-height: 500px; overflow-y: auto; }
.thumb-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 3px; border: 1px solid #2d2d2d; }

.preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 6px; margin-top: 8px; }
.preview-img { width: 100%; border-radius: 4px; object-fit: cover; border: 1px solid #2d2d2d; }

.vast-section { margin-top: 20px; border-top: 1px solid #1f2937; padding-top: 16px; }

.no-instances { display: flex; flex-direction: column; gap: 12px; }
.step-list { display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 12px; align-items: flex-start; }
.step-num { flex-shrink: 0; width: 22px; height: 22px; background: #1f2937; border: 1px solid #374151; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; color: #9ca3af; font-weight: 600; margin-top: 2px; }
.step-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.step-label { font-size: 0.82rem; color: #9ca3af; line-height: 1.4; }
.step-label em { color: #6ee7b7; font-style: normal; }
.cmd { background: #0a0a0a; border: 1px solid #1f2937; border-radius: 4px; padding: 8px 10px; font-family: monospace; font-size: 0.73rem; color: #d1d5db; white-space: pre-wrap; word-break: break-all; margin: 0; line-height: 1.5; }
.refresh-btn { align-self: flex-start; padding: 6px 14px; background: #1f2937; border: 1px solid #374151; color: #9ca3af; border-radius: 5px; cursor: pointer; font-size: 0.82rem; }
.refresh-btn:hover { border-color: #6b7280; color: #d1d5db; }
.instance-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
.instance-row { display: flex; align-items: center; gap: 12px; background: #111; border: 1px solid #2d2d2d; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 0.82rem; }
.instance-row.selected { border-color: #2563eb; background: #172554; }
.inst-gpu { color: #d1d5db; flex: 1; }
.inst-id  { color: #6b7280; font-family: monospace; font-size: 0.78rem; }
.inst-cost { color: #6b7280; font-size: 0.78rem; }
.train-btn { padding: 9px 20px; background: #7c3aed; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.88rem; margin-top: 12px; }
.train-btn:disabled { background: #374151; cursor: not-allowed; }
.retry-btn { padding: 9px 20px; background: #374151; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 0.88rem; margin-top: 12px; }
.train-log { height: 180px; margin: 10px 0; }
.download-btn { display: inline-block; padding: 9px 20px; background: #059669; color: #fff; border-radius: 6px; text-decoration: none; font-size: 0.88rem; }
</style>
