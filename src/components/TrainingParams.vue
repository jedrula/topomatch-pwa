<template>
  <div class="params">
    <div v-if="p.sfm !== 'onthefly'" class="param-row">
      <label>iters</label>
      <input type="number" v-model.number="p.iters" min="100" max="30000" step="100" />
    </div>

    <div v-if="sfmVisible" class="param-row">
      <label>image size</label>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div class="toggle-group">
          <button v-for="s in [256, 512]" :key="s" :class="{ active: p.imageSize === s }" @click="p.imageSize = s">
            {{ s }}px<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ s === 256 ? '40+ frames' : '≤14 frames' }}</span>
          </button>
        </div>
        <small class="param-note">long-edge resize for SfM pose estimation — only used by MASt3R; ignored by Fast3R, COLMAP, GLOMAP variants, FastMap</small>
      </div>
    </div>

    <div v-if="sfmVisible && sfmFeatureCapVisible" class="param-row">
      <label>sfm feature size</label>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div class="toggle-group">
          <button v-for="s in sfmImageSizes" :key="s" :class="{ active: p.sfmImageSize === s }" @click="p.sfmImageSize = s">
            {{ s }}px<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ sfmImageSizeTag(s) }}</span>
          </button>
        </div>
        <small v-if="p.sfm === 'glomap_loma'" class="param-note">LoMa on the local 8 GB GPU: 1024px is the max — 1600 runs out of memory even in bf16.</small>
        <small class="param-note">COLMAP feature-extraction long-edge cap — the resolution keypoints are actually detected at. 1600 is the long-standing default; 1920 matches our native upload size, so no downscale before SIFT. Applies to the SIFT/COLMAP paths only.</small>
      </div>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'brush'" class="param-row">
      <label>growth stop</label>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div class="toggle-group">
          <button :class="{ active: p.growthStop === 'half' }" @click="p.growthStop = 'half'">
            50%<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">iter {{ Math.floor((p.iters || 0) / 2) }}</span>
          </button>
          <button :class="{ active: p.growthStop === 'brush' }" @click="p.growthStop = 'brush'">
            15000<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ (p.iters || 0) <= 15000 ? 'never stops' : 'brush default' }}</span>
          </button>
        </div>
        <small class="param-note">
          When Brush stops adding splats and just refines the ones it has. Every 3DGS implementation
          intends 50% of training (reference 3DGS, gsplat, splatfacto all stop at 15000 of 30000) —
          but they encode it as an absolute number, so at
          {{ p.iters || 0 }} iters the 15000 setting means growth <strong>never stops</strong> and the run gets
          no refinement phase at all.
        </small>
      </div>
    </div>

    <div v-if="sfmVisible" class="param-row">
      <label>sfm</label>
      <div class="toggle-group">
        <button v-for="s in ['mast3r','fast3r','colmap_sift','glomap_sift','glomap_loma','glomap_aliked','glomap_disk','glomap_superpoint','glomap_loftr','colmap_aliked','fastmap','realityscan','onthefly']"
          :key="s" :class="{ active: p.sfm === s }" @click="p.sfm = s">{{ s }}</button>
      </div>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.sfm !== 'onthefly'" class="param-row">
      <label>trainer</label>
      <div class="toggle-group">
        <button v-for="t in ['instantsplat','pgsr','splatfacto','gsplat','2dgs','brush']"
          :key="t" :class="{ active: p.trainer === t }" @click="p.trainer = t">{{ t }}</button>
      </div>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'brush'" class="param-row">
      <label>brush extra</label>
      <input type="text" v-model="p.brushExtraArgs"
        placeholder="e.g. --opac-loss-weight 1e-7 --mean-noise-weight 80"
        style="font-family:monospace;font-size:0.78rem" />
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'gsplat'" class="param-row">
      <label>MCMC</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.mcmc" />
        <span class="toggle-label">{{ p.mcmc ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && (p.trainer === 'gsplat' || p.trainer === '2dgs')" class="param-row">
      <label>live viewer</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.viewer" />
        <span class="toggle-label">{{ p.viewer ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'gsplat'" class="param-row">
      <label>post-process</label>
      <div class="toggle-group">
        <button v-for="pp in ['none','bilateral_grid','ppisp']" :key="pp"
          :class="{ active: p.postProcessing === pp }" @click="setPostProcessing(pp)">{{ pp }}</button>
      </div>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'gsplat' && p.postProcessing === 'bilateral_grid'" class="param-row">
      <label>bilagrid fused</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.bilateralGridFused" />
        <span class="toggle-label">{{ p.bilateralGridFused ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && p.trainer === 'gsplat'" class="param-row">
      <label>random bkgd</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.randomBkgd" />
        <span class="toggle-label">{{ p.randomBkgd ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="(isFork || !p.selectedVastInstance) && (p.trainer === 'gsplat' || p.trainer === '2dgs')" class="param-row">
      <label>ssim λ</label>
      <input type="number" v-model.number="p.ssimLambda" min="0" max="0.5" step="0.05" />
    </div>

    <div v-if="sfmVisible && p.sfm === 'onthefly'" class="param-row">
      <label>trainer</label>
      <span style="opacity:0.5;font-size:0.85em">combined with sfm (no separate trainer)</span>
    </div>

    <div v-if="!isFork && p.selectedVastInstance" class="param-row">
      <label>pipeline</label>
      <span class="vast-pipeline-label">MegaSaM + PGSR</span>
    </div>

    <div class="param-row">
      <label>scene name</label>
      <input type="text" v-model="p.sceneName" placeholder="auto from filename" />
    </div>

    <template v-if="sfmVisible">
      <div class="param-row">
        <label>early stop</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.earlyStop" />
          <span class="toggle-label">{{ p.earlyStop ? 'on' : 'off' }}</span>
        </label>
      </div>
      <div class="param-row">
        <label>sparse pairs</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.sparsePairs" />
          <span class="toggle-label">{{ p.sparsePairs ? 'on' : 'off' }}</span>
        </label>
      </div>
      <div class="param-row">
        <label>sparse GA</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.sparseGa" />
          <span class="toggle-label">{{ p.sparseGa ? 'on' : 'off' }}</span>
        </label>
      </div>
      <div class="param-row" v-if="p.sfm === 'fast3r'">
        <label>COLMAP BA</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.colmapBa" />
          <span class="toggle-label">{{ p.colmapBa ? 'on' : 'off' }}</span>
        </label>
      </div>
      <div class="param-row" v-if="p.sfm === 'colmap_sift' || p.sfm === 'glomap_sift' || p.sfm === 'glomap_loma' || p.sfm === 'fastmap'">
        <label>matcher</label>
        <div class="toggle-group">
          <button v-for="m in matchers" :key="m"
            :class="{ active: p.colmapMatcher === m }" @click="p.colmapMatcher = m">{{ m }}</button>
        </div>
      </div>
      <div class="param-row" v-if="p.sfm === 'glomap_loma'">
        <label>loma features</label>
        <div style="display:flex;flex-direction:column;gap:4px">
          <div class="toggle-group">
            <button v-for="n in [2048, 4096, 8192]" :key="n" :class="{ active: p.lomaMaxFeatures === n }" @click="p.lomaMaxFeatures = n">
              {{ n }}<span v-if="n === 2048" style="font-size:0.75rem;opacity:0.7;margin-left:4px">default</span>
            </button>
          </div>
          <small class="param-note">LoMa keypoints per image. At 2048 it seeds ~58% fewer SfM points than SIFT, and the splat ends up with ~27% fewer gaussians (4f280a9e, 2026-09-29). Matching time grows with this.</small>
        </div>
      </div>
      <div class="param-row" v-if="p.sfm === 'glomap_sift' || p.sfm === 'glomap_loma'">
        <label>VGC</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.viewGraphCalibrator" />
          <span class="toggle-label">{{ p.viewGraphCalibrator ? 'on' : 'off' }}</span>
        </label>
        <span class="param-note" style="margin-left:4px">view_graph_calibrator — fixes missing focal length priors before global mapping</span>
      </div>
    </template>

    <div v-if="!isFork && vastInstances.length > 0" class="param-row">
      <label>run on</label>
      <select v-model="p.selectedVastInstance" class="vast-select">
        <option value="">Local GPU</option>
        <option v-for="inst in vastInstances" :key="inst.id" :value="inst.id">
          {{ inst.id }}{{ inst.gpu_name ? ` — ${inst.num_gpus}× ${inst.gpu_name}` : '' }}{{ inst.dph_total != null ? ` ($${inst.dph_total.toFixed(3)}/hr)` : '' }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  modelValue:    { type: Object, required: true },
  vastInstances: { type: Array, default: () => [] },
  // 'fork' mode hides all SfM-related controls (sfm selector, image size, matchers, etc.)
  mode:          { type: String, default: 'full' },
});

// Direct alias — the parent passes a reactive() object so mutations propagate up automatically
const p = props.modelValue;

const isFork = props.mode === 'fork';
// SfM-related controls are hidden in fork mode and when a vast instance is selected
const sfmVisible = computed(() => !isFork && !p.selectedVastInstance);
// The feature cap reaches COLMAP only on the SIFT/COLMAP feature-extraction paths
// (video_to_splat.sh call sites: colmap_sift, glomap_sift, fastmap). The hloc
// variants and the neural SfMs size their own inputs, so showing it there would lie.
const sfmFeatureCapVisible = computed(() => ['colmap_sift', 'glomap_sift', 'glomap_loma', 'fastmap'].includes(p.sfm));
const sfmImageSizes = computed(() => (p.sfm === 'glomap_loma' ? [1024, 1600] : [1600, 1920]));
function sfmImageSizeTag(s) {
  if (p.sfm === 'glomap_loma') return s === 1024 ? '8 GB max' : 'needs >8 GB';
  return s === 1600 ? 'default' : 'native';
}
// The faiss vocab tree is SIFT-only (128-d); the pipeline hard-errors on it with LoMa's 256-d
// descriptors, and its auto matcher picks exhaustive there instead.
const matchers = computed(() => (p.sfm === 'glomap_loma'
  ? ['auto', 'sequential', 'exhaustive']
  : ['auto', 'sequential', 'exhaustive', 'vocab_tree']));
// Switching into LoMa moves the visible settings to ones that can run on the local card; the
// buttons show it, so nothing changes behind the user's back.
watch(() => p.sfm, (sfm, prev) => {
  if (sfm === 'glomap_loma') {
    if (p.sfmImageSize > 1024) p.sfmImageSize = 1024;
    if (p.colmapMatcher === 'vocab_tree') p.colmapMatcher = 'auto';
  } else if (prev === 'glomap_loma' && p.sfmImageSize === 1024) {
    p.sfmImageSize = 1600;
  }
});

function setPostProcessing(pp) {
  p.postProcessing = pp;
  if (pp === 'ppisp') p.mcmc = true;
}
</script>

<style scoped>
.params {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.param-row { display: flex; align-items: center; gap: 12px; }
.param-row > label {
  width: 130px;
  font-size: 0.85rem;
  color: #9ca3af;
  text-align: right;
  flex-shrink: 0;
}
.param-row input[type="number"],
.param-row input[type="text"] {
  flex: 1;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  padding: 6px 10px;
  font-size: 0.9rem;
}

.toggle-group { display: flex; gap: 4px; flex-wrap: wrap; }
.toggle-group button {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #374151;
  background: #1f2937;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.8rem;
}
.toggle-group button.active { background: #2563eb; color: #fff; border-color: #2563eb; }

.toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle input[type="checkbox"] { accent-color: #2563eb; width: 16px; height: 16px; cursor: pointer; }
.toggle-label { font-size: 0.85rem; color: #9ca3af; }

.param-note { font-size: 0.72rem; color: #6b7280; }

.vast-select {
  background: #1f2937; color: #e5e7eb;
  border: 1px solid #374151; border-radius: 6px;
  padding: 4px 8px; font-size: 0.85rem; cursor: pointer;
}
.vast-pipeline-label {
  font-size: 0.85rem; color: #a5b4fc;
  background: #312e81; padding: 3px 10px;
  border-radius: 6px; border: 1px solid #4338ca;
}
</style>
