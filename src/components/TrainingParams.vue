<template>
  <div class="params">
    <div v-if="p.sfm !== 'onthefly'" class="param-row">
      <label>iters</label>
      <input type="number" v-model.number="p.iters" min="100" max="30000" step="100" />
    </div>

    <div class="param-row">
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

    <div v-if="!p.selectedVastInstance" class="param-row">
      <label>sfm</label>
      <div class="toggle-group">
        <button v-for="s in ['mast3r','fast3r','colmap_sift','glomap_sift','glomap_aliked','glomap_disk','glomap_superpoint','glomap_loftr','colmap_aliked','fastmap','realityscan','onthefly']"
          :key="s" :class="{ active: p.sfm === s }" @click="p.sfm = s">{{ s }}</button>
      </div>
    </div>

    <div v-if="!p.selectedVastInstance && p.sfm !== 'onthefly'" class="param-row">
      <label>trainer</label>
      <div class="toggle-group">
        <button v-for="t in ['instantsplat','pgsr','splatfacto','gsplat','2dgs','brush']"
          :key="t" :class="{ active: p.trainer === t }" @click="p.trainer = t">{{ t }}</button>
      </div>
    </div>

    <div v-if="!p.selectedVastInstance && p.trainer === 'gsplat' && p.sfm !== 'onthefly'" class="param-row">
      <label>MCMC</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.mcmc" />
        <span class="toggle-label">{{ p.mcmc ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="!p.selectedVastInstance && (p.trainer === 'gsplat' || p.trainer === '2dgs') && p.sfm !== 'onthefly'" class="param-row">
      <label>live viewer</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.viewer" />
        <span class="toggle-label">{{ p.viewer ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="!p.selectedVastInstance && p.trainer === 'gsplat' && p.sfm !== 'onthefly'" class="param-row">
      <label>post-process</label>
      <div class="toggle-group">
        <button v-for="pp in ['none','bilateral_grid','ppisp']" :key="pp"
          :class="{ active: p.postProcessing === pp }" @click="setPostProcessing(pp)">{{ pp }}</button>
      </div>
    </div>

    <div v-if="!p.selectedVastInstance && p.trainer === 'gsplat' && p.postProcessing === 'bilateral_grid' && p.sfm !== 'onthefly'" class="param-row">
      <label>bilagrid fused</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.bilateralGridFused" />
        <span class="toggle-label">{{ p.bilateralGridFused ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="!p.selectedVastInstance && p.trainer === 'gsplat' && p.sfm !== 'onthefly'" class="param-row">
      <label>random bkgd</label>
      <label class="toggle">
        <input type="checkbox" v-model="p.randomBkgd" />
        <span class="toggle-label">{{ p.randomBkgd ? 'on' : 'off' }}</span>
      </label>
    </div>

    <div v-if="!p.selectedVastInstance && (p.trainer === 'gsplat' || p.trainer === '2dgs') && p.sfm !== 'onthefly'" class="param-row">
      <label>ssim λ</label>
      <input type="number" v-model.number="p.ssimLambda" min="0" max="0.5" step="0.05" />
    </div>

    <div v-if="!p.selectedVastInstance && p.sfm === 'onthefly'" class="param-row">
      <label>trainer</label>
      <span style="opacity:0.5;font-size:0.85em">combined with sfm (no separate trainer)</span>
    </div>

    <div v-if="p.selectedVastInstance" class="param-row">
      <label>pipeline</label>
      <span class="vast-pipeline-label">MegaSaM + PGSR</span>
    </div>

    <div class="param-row">
      <label>scene name</label>
      <input type="text" v-model="p.sceneName" placeholder="auto from filename" />
    </div>

    <template v-if="!p.selectedVastInstance">
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
      <div class="param-row" v-if="p.sfm === 'colmap_sift' || p.sfm === 'glomap_sift' || p.sfm === 'fastmap'">
        <label>matcher</label>
        <div class="toggle-group">
          <button v-for="m in ['auto','sequential','exhaustive','vocab_tree']" :key="m"
            :class="{ active: p.colmapMatcher === m }" @click="p.colmapMatcher = m">{{ m }}</button>
        </div>
      </div>
      <div class="param-row" v-if="p.sfm === 'glomap_sift'">
        <label>VGC</label>
        <label class="toggle">
          <input type="checkbox" v-model="p.viewGraphCalibrator" />
          <span class="toggle-label">{{ p.viewGraphCalibrator ? 'on' : 'off' }}</span>
        </label>
        <span class="param-note" style="margin-left:4px">view_graph_calibrator — fixes missing focal length priors before global mapping</span>
      </div>
    </template>

    <div v-if="vastInstances.length" class="param-row">
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
const props = defineProps({
  modelValue:   { type: Object, required: true },
  vastInstances: { type: Array, default: () => [] },
});

// Direct alias — the parent passes a reactive() object so mutations propagate up automatically
const p = props.modelValue;

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
