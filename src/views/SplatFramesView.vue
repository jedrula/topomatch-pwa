<!--
  A pod's photographs, on their own page with their own URL.

  Two ways of looking at the same set, because they answer different questions:
  the grid says what was photographed, the 3D poses say from where and pointing
  which way. Selecting in one selects in the other -- it is one selection, not
  two pages.

  The point of the page is the last step: from a chosen frame, go straight to
  the splat rendered from that same solved pose. That comparison already exists
  at /splat/:jobId/compare; this just gives it a way in that starts from a
  camera in space rather than a list of filenames.
-->
<template>
  <div class="fv">
    <header class="fv-head">
      <RouterLink :to="{ name: 'splat-history' }" class="back">← history</RouterLink>
      <h1>Frames<span class="jid">{{ jobId }}</span></h1>
      <p class="lede">
        Every photograph in this pod, and where its camera stood. Click a camera in 3D or a
        thumbnail in the grid to see the original; then open it side by side with the splat
        rendered from that same pose.
      </p>
    </header>

    <nav class="fv-tabs">
      <RouterLink class="tab" :class="{on: tab==='poses'}" :to="{query:{...$route.query, tab:'poses'}}">◎ camera poses</RouterLink>
      <RouterLink class="tab" :class="{on: tab==='grid'}" :to="{query:{...$route.query, tab:'grid'}}">▦ grid</RouterLink>
      <span class="fv-count" v-if="frames.length">{{ frames.length }} frames</span>
    </nav>

    <div class="fv-body">
      <section class="fv-main">
        <CameraPoses3D
          v-if="tab==='poses'"
          :carpet="carpet"
          :cloud-url="cloudUrl"
          :selected="picked"
          @select="onPick"
        />
        <FrameGrid
          v-else
          :frames="frames"
          :thumb-url="thumbUrl"
          :mask-url="maskUrl"
          :has-masks="hasMasks"
          :mask-on="maskOn"
          :selected="picked"
          @pick="onPick"
          @toggle-mask="maskOn = !maskOn"
        />
        <p v-if="err" class="fv-err">{{ err }}</p>
      </section>

      <aside class="fv-side" v-if="picked">
        <div class="fv-side-head">
          <strong>{{ picked }}</strong>
          <button class="x" @click="picked=''">×</button>
        </div>
        <img :src="imageUrl(picked)" class="fv-full" :alt="picked" />
        <p v-if="!compareKey" class="fv-note">
          No solved pose for this frame, so there is nothing to render a comparison from.
        </p>
      </aside>
    </div>

    <!-- The reconstruction, inline. Cached frames appear with no click at all;
         uncached ones ask first, because rendering runs gsplat on the same GPU
         as training. -->
    <section v-if="picked && compareKey" class="fv-cmp-wrap">
      <SplatCompare v-if="cmpReady" :key="compareKey" :job-id="jobId" :view="compareKey" />
      <div v-else class="fv-cmp-ask">
        <button class="fv-cmp-btn" :disabled="cmpBusy" @click="renderNow">
          {{ cmpBusy ? 'rendering…' : 'render the reconstruction for this frame' }}
        </button>
        <span class="fv-cmp-note">
          Not rendered yet. This runs gsplat on the same GPU as training, so it is not done
          automatically — frames already rendered appear here instantly.
        </span>
      </div>
      <p v-if="cmpErr" class="fv-err">{{ cmpErr }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { getGateway } from '../config/gateway.js';
import CameraPoses3D from '../components/CameraPoses3D.vue';
import FrameGrid from '../components/FrameGrid.vue';
import SplatCompare from '../components/SplatCompare.vue';
import { renderCompareView } from '../composables/useCompareRender.js';

const route = useRoute();
const router = useRouter();
const jobId = route.params.jobId;

const frames = ref([]);
const carpet = ref(null);
const cmpFrames = ref([]);
const picked = ref(String(route.query.f || ''));
const hasMasks = ref(false);
const maskOn = ref(false);
const err = ref('');
let gw = '';

const tab = computed(() => (route.query.tab === 'grid' ? 'grid' : 'poses'));
const cloudUrl = computed(() => (gw ? `${gw}/topowall/api/v1/video-to-splat/${jobId}/pointcloud` : ''));

// compare-frames keys the same photographs by their numeric suffix; map the
// carpet's filename onto that key so a camera in 3D can reach the comparison.
const compareKey = computed(() => {
  const hit = cmpFrames.value.find(f => f.name === picked.value);
  return hit ? hit.key : '';
});
// Already-rendered frames are free to show, so they appear with no click.
const cmpEntry = computed(() => cmpFrames.value.find(f => f.name === picked.value) || null);
const cmpReady = ref(false);
const cmpBusy = ref(false);
const cmpErr = ref('');

watch([picked, cmpFrames], () => {
  cmpErr.value = '';
  cmpReady.value = !!cmpEntry.value?.rendered;
});

async function renderNow() {
  if (!compareKey.value || cmpBusy.value) return;
  cmpBusy.value = true; cmpErr.value = '';
  try {
    await renderCompareView(jobId, compareKey.value);
    if (cmpEntry.value) cmpEntry.value.rendered = true;
    cmpReady.value = true;
  } catch (e) {
    cmpErr.value = String(e.message || e);
  } finally {
    cmpBusy.value = false;
  }
}

function thumbUrl(fn) { return `${gw}/topowall/api/v1/video-to-splat/${jobId}/images/${fn}?w=320`; }
function imageUrl(fn) { return `${gw}/topowall/api/v1/video-to-splat/${jobId}/images/${fn}`; }
function maskUrl(fn) { return `${gw}/topowall/api/v1/video-to-splat/${jobId}/masks/${fn}`; }

function onPick(fn) {
  picked.value = fn;
  router.replace({ query: { ...route.query, f: fn } });
}

async function load() {
  try {
    gw = await getGateway();
    const base = `${gw}/topowall/api/v1/video-to-splat/${jobId}`;
    const [imgs, cp, cf] = await Promise.all([
      fetch(`${base}/images`).then(r => r.ok ? r.json() : { images: [] }).catch(() => ({ images: [] })),
      fetch(`${base}/carpet`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${base}/compare-frames`).then(r => r.ok ? r.json() : { frames: [] }).catch(() => ({ frames: [] })),
    ]);
    frames.value = imgs.images ?? [];
    hasMasks.value = !!imgs.has_masks;
    carpet.value = cp;
    cmpFrames.value = cf.frames ?? [];
    if (!cp) err.value = 'No camera poses for this job (no COLMAP sparse yet).';
  } catch (e) {
    err.value = String(e);
  }
}
onMounted(load);
watch(() => route.query.f, v => { picked.value = String(v || ''); });
</script>

<style scoped>
.fv { max-width: 1400px; margin: 0 auto; padding: 16px; color: #cfd6e4; }
.fv-head .back { font-size: 13px; color: #8fa3d0; text-decoration: none; }
.fv-head h1 { font-size: 20px; margin: 6px 0 4px; }
.jid { font-size: 12px; color: #7b8496; margin-left: 10px; font-weight: 400; }
.lede { font-size: 13px; color: #9aa3b5; max-width: 70ch; margin: 0 0 12px; }
.fv-tabs { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.tab { font-size: 12px; padding: 5px 12px; border-radius: 7px; text-decoration: none;
  border: 1px solid #39404f; background: #191d25; color: #cfd6e4; }
.tab.on { background: #2b3444; border-color: #5a6478; color: #fff; }
.fv-count { font-size: 12px; color: #7b8496; margin-left: auto; }
.fv-body { display: grid; grid-template-columns: 1fr; gap: 14px; }
@media (min-width: 1000px) { .fv-body { grid-template-columns: 1fr 340px; } }
.fv-side { border: 1px solid #2a3140; border-radius: 10px; padding: 10px; background: #12161e;
  align-self: start; }
.fv-side-head { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 8px; }
.fv-side-head strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.x { margin-left: auto; background: none; border: none; color: #8a93a6; font-size: 18px;
  cursor: pointer; line-height: 1; }
.fv-full { width: 100%; border-radius: 6px; display: block; }
.fv-cmp-wrap { margin-top: 16px; border-top: 1px solid #2a3140; padding-top: 14px; }
.fv-cmp-ask { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.fv-cmp-btn { font-size: 12px; padding: 7px 14px; border-radius: 7px; cursor: pointer;
  background: #2b3444; border: 1px solid #5a6478; color: #fff; }
.fv-cmp-btn:disabled { opacity: .6; cursor: default; }
.fv-cmp-note { font-size: 12px; color: #7b8496; max-width: 60ch; }
.fv-note { font-size: 12px; color: #7b8496; margin-top: 8px; }
.fv-err { font-size: 12px; color: #d98080; margin-top: 8px; }
</style>
