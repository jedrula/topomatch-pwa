<template>
  <div class="examples-page">
    <header class="head">
      <h3>Example splats</h3>
      <p class="hint">
        Reference splats served from the GPU box. Click one to open it in the viewer.
      </p>
    </header>

    <p v-if="loading" class="status">Loading examples…</p>
    <p v-else-if="error" class="status err">{{ error }}</p>
    <p v-else-if="!examples.length" class="status">
      No examples found. Drop a <code>&lt;name&gt;.splat</code> (and optionally a
      matching <code>&lt;name&gt;.json</code>) into <code>topowall-splat/examples/</code>.
    </p>

    <!-- Metric caveat: worth stating up front, because PSNR here is misleading. -->
    <p v-if="examples.length && anyMetrics" class="caveat">
      <strong>Pick .spz or .ply to judge quality.</strong> The <code>.splat</code> format
      stores DC colour only and throws away all 45 spherical-harmonic coefficients, so it
      renders flat and dull regardless of how good the splat is. <code>.spz</code> keeps
      full SH at roughly 1/13th of PLY's size.
      <br />
      Also: across the 1,290 scenes these come from, <strong>r(PSNR, LPIPS) = −0.29</strong>,
      so the two metrics substantially disagree. Lower LPIPS is the better guide to how a
      splat actually looks.
    </p>

    <ul class="grid">
      <li v-for="ex in examples" :key="ex.name" :class="{ busy: busy?.startsWith(ex.name) }">
        <div class="card">
          <span class="title">{{ ex.title }}</span>
          <span v-if="ex.meta?.subtitle" class="sub">{{ ex.meta.subtitle }}</span>

          <span class="metrics" v-if="hasMetrics(ex)">
            <span v-if="ex.meta?.psnr != null" class="m">
              PSNR <b>{{ ex.meta.psnr.toFixed(2) }}</b>
            </span>
            <span v-if="ex.meta?.lpips != null" class="m" :class="lpipsClass(ex.meta.lpips)">
              LPIPS <b>{{ ex.meta.lpips.toFixed(3) }}</b>
            </span>
            <span v-if="ex.meta?.ssim != null" class="m">
              SSIM <b>{{ ex.meta.ssim.toFixed(3) }}</b>
            </span>
          </span>

          <span class="stats">
            <template v-if="ex.gaussians">{{ ex.gaussians.toLocaleString() }} gaussians</template>
            <template v-else>size varies by format</template>
          </span>

          <span v-if="ex.meta?.description" class="desc">{{ ex.meta.description }}</span>
          <span v-if="ex.meta?.source" class="src">{{ ex.meta.source }}</span>

          <div class="formats">
            <button
              v-for="f in ex.formats"
              :key="f.ext"
              class="fmt"
              :class="{ primary: f.ext === ex.default_ext, flat: !f.has_sh }"
              :disabled="!!busy"
              :title="f.has_sh ? 'Full spherical harmonics — view-dependent appearance' : 'DC colour only — spherical harmonics discarded, looks flat'"
              @click="open(ex, f)"
            >
              .{{ f.ext }}
              <span class="fmt-size">{{ (f.bytes / 1048576).toFixed(0) }} MB</span>
              <span v-if="!f.has_sh" class="fmt-warn">no SH</span>
            </button>
          </div>

          <span v-if="busy?.startsWith(ex.name)" class="progress">Downloading… {{ progress }}%</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getGateway } from '../config/gateway.js';
import { useSplatStore } from '../stores/splatStore.js';

const router     = useRouter();
const splatStore = useSplatStore();

const examples = ref([]);
const loading  = ref(true);
const error    = ref('');
const busy     = ref(null);
const progress = ref(0);

const anyMetrics = computed(() => examples.value.some(hasMetrics));

function hasMetrics(ex) {
  return ex.meta?.psnr != null || ex.meta?.lpips != null || ex.meta?.ssim != null;
}

// LPIPS bands from the distribution of the source set: Q1 0.175, median 0.206, Q3 0.249.
function lpipsClass(v) {
  if (v <= 0.175) return 'good';
  if (v >= 0.249) return 'bad';
  return '';
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall/api/v1/examples`);
    if (!res.ok) throw new Error(`server returned ${res.status}`);
    examples.value = (await res.json()).examples || [];
  } catch (e) {
    error.value = `Could not reach the examples endpoint: ${e.message}`;
  } finally {
    loading.value = false;
  }
}

async function open(ex, fmt) {
  if (busy.value) return;
  const chosen = fmt || ex.formats?.find(f => f.ext === ex.default_ext) || ex.formats?.[0];
  if (!chosen) { error.value = 'No format available for this example.'; return; }
  busy.value = `${ex.name}:${chosen.ext}`;
  progress.value = 0;
  error.value = '';
  try {
    const gateway = await getGateway();
    const res = await fetch(`${gateway}/topowall${chosen.url}`);
    if (!res.ok) throw new Error(`server returned ${res.status}`);
    // Stream: these are tens of MB, so show progress rather than appearing to hang.
    const total  = Number(res.headers.get('content-length')) || chosen.bytes || 0;
    const reader = res.body?.getReader();
    let blob;
    if (reader) {
      const chunks = []; let got = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value); got += value.length;
        if (total) progress.value = Math.round((got / total) * 100);
      }
      blob = new Blob(chunks, { type: 'application/octet-stream' });
    } else {
      blob = await res.blob();
    }
    const splatId = crypto.randomUUID();
    splatStore.storeBlob(splatId, URL.createObjectURL(blob), chosen.scene_format);
    router.push({ name: 'splat-viewer', params: { splatId } });
  } catch (e) {
    error.value = `Could not load "${ex.title}": ${e.message}`;
  } finally {
    busy.value = null;
  }
}

onMounted(load);
</script>

<style scoped>
.examples-page { padding: 1rem; max-width: 1100px; margin: 0 auto; }
.head h3 { margin: 0 0 .25rem; }
.hint { margin: 0 0 1rem; font-size: .88rem; opacity: .7; }
.status { font-size: .9rem; opacity: .8; }
.status.err { color: #d33; }
.caveat {
  font-size: .84rem; line-height: 1.45; margin: 0 0 1rem; padding: .6rem .8rem;
  border-left: 3px solid currentColor; opacity: .85;
  background: rgba(128, 128, 128, .07); border-radius: 0 6px 6px 0;
}
.grid { list-style: none; margin: 0; padding: 0; display: grid; gap: .7rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
.card {
  display: flex; flex-direction: column; gap: .28rem; width: 100%; height: 100%;
  text-align: left; padding: .8rem .9rem; cursor: pointer; font: inherit; color: inherit;
  border: 1px solid rgba(128, 128, 128, .35); border-radius: 8px;
  background: rgba(128, 128, 128, .06);
}
.card:hover:not(:disabled) { background: rgba(128, 128, 128, .14); }
.card:disabled { cursor: default; opacity: .55; }
.title { font-weight: 600; }
.sub { font-size: .84rem; opacity: .75; font-style: italic; }
.metrics { display: flex; flex-wrap: wrap; gap: .5rem; margin: .15rem 0; }
.m { font-size: .76rem; padding: .1rem .4rem; border-radius: 4px;
     background: rgba(128, 128, 128, .16); font-variant-numeric: tabular-nums; }
.m.good { background: rgba(40, 160, 80, .22); }
.m.bad  { background: rgba(200, 70, 60, .22); }
.stats { font-size: .76rem; opacity: .6; font-variant-numeric: tabular-nums; }
.desc { font-size: .8rem; opacity: .8; line-height: 1.35; }
.src { font-size: .72rem; opacity: .5; }
.formats { display: flex; flex-wrap: wrap; gap: .35rem; margin-top: .4rem; }
.fmt { display: inline-flex; align-items: baseline; gap: .3rem; cursor: pointer;
  font: inherit; font-size: .78rem; color: inherit; padding: .28rem .5rem;
  border: 1px solid rgba(128,128,128,.4); border-radius: 6px;
  background: rgba(128,128,128,.08); }
.fmt:hover:not(:disabled) { background: rgba(128,128,128,.2); }
.fmt:disabled { cursor: default; opacity: .5; }
.fmt.primary { border-color: currentColor; font-weight: 600; }
.fmt.flat { opacity: .7; }
.fmt-size { opacity: .6; font-variant-numeric: tabular-nums; }
.fmt-warn { color: #c4562e; font-weight: 600; }
.progress { font-size: .82rem; font-weight: 600; }
li.busy .card { border-color: currentColor; }
</style>
