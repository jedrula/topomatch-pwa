<template>
  <div class="picker">
    <!-- Load existing .splat file -->
    <section v-if="!videoFiles.length" class="section narrow">
      <h3>Load .splat file</h3>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onSplatFile" hidden />
      </label>
    </section>

    <div v-if="!videoFiles.length" class="divider">or</div>

    <!-- Create from video -->
    <section class="section wide">
      <h3>Create from video</h3>

      <label v-if="!videoFiles.length" class="pick-btn secondary" :class="{ loading: videoLoading }">
        {{ videoLoading ? 'Downloading video…' : 'Choose video(s)' }}
        <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="videoLoading" hidden />
      </label>

      <template v-if="videoFiles.length">
        <!-- Per-video strips -->
        <div class="video-strips">
          <div v-for="(strip, i) in videoStrips" :key="strip.name" class="strip">
            <div class="strip-label">{{ strip.name }}</div>

            <!-- Frame strip with trimmer overlay -->
            <div class="strip-frames">
              <img v-for="(src, fi) in strip.frames" :key="fi" :src="src" class="frame-thumb" />
              <div v-if="!strip.frames.length" v-for="j in 10" :key="'ph'+j" class="frame-placeholder" />

              <div class="trimmer-overlay">
                <!-- dark regions outside selection -->
                <div class="trim-dark" :style="{ left: 0, width: startPct(strip) + '%' }" />
                <div class="trim-dark" :style="{ right: 0, width: (100 - endPct(strip)) + '%' }" />
                <!-- selection bracket -->
                <div class="trim-bracket" :style="{ left: startPct(strip) + '%', width: (endPct(strip) - startPct(strip)) + '%' }" />
                <!-- handles -->
                <div class="trim-handle trim-handle-left"
                     :style="{ left: startPct(strip) + '%' }"
                     @mousedown.prevent="startTrimDrag($event, i, 'start')" />
                <div class="trim-handle trim-handle-right"
                     :style="{ left: endPct(strip) + '%' }"
                     @mousedown.prevent="startTrimDrag($event, i, 'end')" />
              </div>
            </div>

            <!-- Per-video params + trim times -->
            <div class="strip-params">
              <div class="trim-times">
                <span class="time-field">start <span class="time-val">{{ formatTime(strip.startTime) }}</span></span>
                <span class="time-field">end <span class="time-val">{{ formatTime(strip.endTime ?? strip.videoDuration) }}</span></span>
                <span class="time-field total">duration <span class="time-val">{{ formatTime((strip.endTime ?? strip.videoDuration) - strip.startTime) }}</span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Extraction pipeline (right under the strip) ───────────── -->
        <div class="pipeline-panel">

          <!-- Progress bars: shown while worker is running -->
          <template v-if="(phaseNum === 2 || phaseNum === 3) && !awaitingConfirmation">
            <div class="extraction-progress">
              <div class="prog-row">
                <span class="prog-label">Extracting Frames</span>
                <span class="prog-method">MediaBunny</span>
                <span class="prog-count">{{ extractionViz.scoredFrames.length }}/{{ extractionViz.keyframeCount || '?' }}</span>
              </div>
              <div class="prog-track"><div class="prog-fill" :style="{ width: progressPct + '%' }" /></div>
              <div class="prog-row prog-row-gap">
                <span class="prog-label">Calculating Sharpness</span>
                <span class="prog-count">{{ extractionViz.scoredFrames.length }}/{{ extractionViz.keyframeCount || '?' }}</span>
              </div>
              <div class="prog-track"><div class="prog-fill prog-fill-blue" :style="{ width: progressPct + '%' }" /></div>
            </div>
          </template>

          <!-- Upload progress -->
          <template v-if="phaseNum === 4">
            <div class="extraction-progress">
              <div class="prog-row">
                <span class="prog-label">Uploading</span>
                <span class="prog-count">{{ step4Status }}</span>
              </div>
              <div class="prog-track" v-if="extractionViz.uploadTotal > 0">
                <div class="prog-fill prog-fill-blue" :style="{ width: (extractionViz.uploadLoaded / extractionViz.uploadTotal * 100) + '%' }" />
              </div>
            </div>
          </template>

          <!-- Frame bar chart + minimap + preview -->
          <template v-if="extractionViz.scoredFrames.length">
            <div class="analysis-header">
              <span class="analysis-title">Frame Analysis</span>
              <span class="analysis-sub">
                {{ extractionViz.scoredFrames.length }}{{ extractionViz.keyframeCount ? ` / ${extractionViz.keyframeCount}` : '' }} frames
              </span>
            </div>

            <div class="barchart-wrap" @click="onChartClick">
              <svg
                class="barchart-svg"
                :viewBox="`0 0 ${extractionViz.scoredFrames.length} 100`"
                preserveAspectRatio="none"
              >
                <rect
                  v-for="(frame, idx) in extractionViz.scoredFrames"
                  :key="idx"
                  :x="idx"
                  :y="100 - scorePercent(frame.score)"
                  width="0.85"
                  :height="Math.max(scorePercent(frame.score), 1)"
                  :fill="previewFrame?.index === idx ? '#f59e0b' : selectedSet.has(idx) ? '#3b82f6' : (phaseNum >= 3 ? '#374151' : '#4b5563')"
                />
              </svg>
            </div>

            <!-- Frame preview on click -->
            <div v-if="previewFrame" class="frame-preview">
              <img :src="previewFrame.thumbUrl" class="preview-thumb" />
              <div class="preview-info">
                <span class="preview-time">{{ formatTime(previewFrame.timeS) }}</span>
                <span class="preview-score">sharpness {{ normalizedScore(previewFrame.score) }}/100</span>
                <span class="preview-badge" :class="selectedSet.has(previewFrame.index) ? 'preview-sel' : 'preview-rej'">
                  {{ selectedSet.has(previewFrame.index) ? 'selected' : 'rejected' }}
                </span>
              </div>
              <button class="preview-close" @click.stop="previewFrame = null">✕</button>
            </div>

            <!-- Batch selection controls -->
            <div class="batch-controls">
              <label class="batch-ctrl">
                <span>Batch size</span>
                <input type="number" v-model.number="batchSize" min="1" max="50" />
                <span class="batch-hint">frames per group</span>
              </label>
              <label class="batch-ctrl">
                <span>Buffer</span>
                <input type="number" v-model.number="batchBuffer" min="0" max="20" />
                <span class="batch-hint">frames to skip between groups</span>
              </label>
            </div>

            <div v-if="awaitingConfirmation" class="confirm-stats">
              <span class="conf-n">{{ liveSelection.length }}</span>
              <span class="conf-label"> frames selected of {{ extractionViz.scoredFrames.length }} total</span>
            </div>
          </template>

          <!-- Idle hint (brief — auto-trigger fires shortly after video loads) -->
          <div v-else-if="phaseNum === 0" class="pipeline-idle-hint">
            {{ videoLoading ? 'Loading video…' : 'Preparing extraction…' }}
          </div>

        </div>

        <!-- Shared params -->
        <div class="params">
          <div class="param-row">
            <label>iters</label>
            <input type="number" v-model.number="iters" min="100" max="5000" step="100" />
          </div>
          <div class="param-row">
            <label>image size</label>
            <!-- NOTE: only affects MASt3R (engine=mast3r). Fast3R always runs at 512px
                 internally regardless of this setting — size=224 square-crops inputs
                 which breaks camera geometry for non-square images. -->
            <div style="display:flex;flex-direction:column;gap:4px">
              <div class="toggle-group">
                <button v-for="s in [256, 512]" :key="s" :class="{ active: imageSize === s }" @click="imageSize = s">
                  {{ s }}px<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ s === 256 ? '40+ frames' : '≤14 frames' }}</span>
                </button>
              </div>
              <small class="param-note">long-edge resize for SfM pose estimation — only used by MASt3R; ignored by Fast3R, COLMAP, GLOMAP variants, FastMap</small>
            </div>
          </div>
          <div v-if="!selectedVastInstance" class="param-row">
            <label>sfm</label>
            <div class="toggle-group">
              <button v-for="s in ['mast3r', 'fast3r', 'colmap_sift', 'glomap_sift', 'glomap_aliked', 'glomap_disk', 'glomap_superpoint', 'glomap_loftr', 'colmap_aliked', 'fastmap', 'realityscan', 'onthefly']" :key="s" :class="{ active: sfm === s }" @click="sfm = s">{{ s }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && sfm !== 'onthefly'" class="param-row">
            <label>trainer</label>
            <div class="toggle-group">
              <button v-for="t in ['instantsplat', 'pgsr', 'splatfacto', 'gsplat', '2dgs', 'brush']" :key="t" :class="{ active: trainer === t }" @click="trainer = t">{{ t }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>MCMC</label>
            <label class="toggle">
              <input type="checkbox" v-model="mcmc" />
              <span class="toggle-label">{{ mcmc ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && (trainer === 'gsplat' || trainer === '2dgs') && sfm !== 'onthefly'" class="param-row">
            <label>live viewer</label>
            <label class="toggle">
              <input type="checkbox" v-model="viewer" />
              <span class="toggle-label">{{ viewer ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>post-process</label>
            <div class="toggle-group">
              <button v-for="pp in ['none', 'bilateral_grid', 'ppisp']" :key="pp"
                :class="{ active: postProcessing === pp }" @click="postProcessing = pp">{{ pp }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && postProcessing === 'bilateral_grid' && sfm !== 'onthefly'" class="param-row">
            <label>bilagrid fused</label>
            <label class="toggle">
              <input type="checkbox" v-model="bilateralGridFused" />
              <span class="toggle-label">{{ bilateralGridFused ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>random bkgd</label>
            <label class="toggle">
              <input type="checkbox" v-model="randomBkgd" />
              <span class="toggle-label">{{ randomBkgd ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && (trainer === 'gsplat' || trainer === '2dgs') && sfm !== 'onthefly'" class="param-row">
            <label>ssim λ</label>
            <input type="number" v-model.number="ssimLambda" min="0" max="0.5" step="0.05" />
          </div>
          <div v-if="!selectedVastInstance && sfm === 'onthefly'" class="param-row">
            <label>trainer</label>
            <span style="opacity:0.5;font-size:0.85em">combined with sfm (no separate trainer)</span>
          </div>
          <div v-if="selectedVastInstance" class="param-row">
            <label>pipeline</label>
            <span class="vast-pipeline-label">MegaSaM + PGSR</span>
          </div>
          <div class="param-row">
            <label>scene name</label>
            <input type="text" v-model="sceneName" placeholder="auto from filename" />
          </div>
          <template v-if="!selectedVastInstance">
          <div class="param-row">
            <label>early stop</label>
            <label class="toggle">
              <input type="checkbox" v-model="earlyStop" />
              <span class="toggle-label">{{ earlyStop ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row">
            <label>sparse pairs</label>
            <label class="toggle">
              <input type="checkbox" v-model="sparsePairs" />
              <span class="toggle-label">{{ sparsePairs ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row">
            <label>sparse GA</label>
            <label class="toggle">
              <input type="checkbox" v-model="sparseGa" />
              <span class="toggle-label">{{ sparseGa ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row" v-if="sfm === 'fast3r'">
            <label>COLMAP BA</label>
            <label class="toggle">
              <input type="checkbox" v-model="colmapBa" />
              <span class="toggle-label">{{ colmapBa ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row" v-if="sfm === 'colmap_sift' || sfm === 'glomap_sift' || sfm === 'fastmap'">
            <label>matcher</label>
            <div class="toggle-group">
              <button v-for="m in ['auto', 'sequential', 'exhaustive', 'vocab_tree']" :key="m"
                :class="{ active: colmapMatcher === m }" @click="colmapMatcher = m">{{ m }}</button>
            </div>
          </div>
          </template>
          <div class="param-row" v-if="vastInstances.length">
            <label>run on</label>
            <select v-model="selectedVastInstance" class="vast-select">
              <option value="">Local GPU</option>
              <option v-for="inst in vastInstances" :key="inst.id" :value="inst.id">
                {{ inst.id }}{{ inst.gpu_name ? ` — ${inst.num_gpus}× ${inst.gpu_name}` : '' }}{{ inst.dph_total != null ? ` ($${inst.dph_total.toFixed(3)}/hr)` : '' }}
              </option>
            </select>
          </div>
        </div>

      </template>
    </section>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!videoFiles.length" class="divider">or</div>

    <!-- Create from photos -->
    <section v-if="!videoFiles.length" class="section wide">
      <h3>Create from photos</h3>

      <label class="pick-btn secondary">
        Choose photos
        <input type="file" accept="image/*" multiple @change="onPhotoFile" hidden />
      </label>

      <!-- Rerun banner: images are on the server, no re-upload needed -->
      <template v-if="rerunJobId && rerunImageCount > 0">
        <div class="rerun-banner">
          ↩ Reusing {{ rerunImageCount }} image{{ rerunImageCount !== 1 ? 's' : '' }} from previous job
          <button class="rerun-clear" @click="rerunJobId = null">✕ Pick new images</button>
        </div>
      </template>

      <template v-if="photoFiles.length || rerunJobId">
        <div class="photo-grid">
          <div v-for="(p, i) in photoFiles" :key="i" class="photo-item">
            <img :src="p.url" class="photo-thumb" />
            <span class="photo-name">{{ p.name }}</span>
            <button class="photo-remove" @click="removePhoto(i)">✕</button>
          </div>
        </div>

        <!-- Shared params (reuse same model values as video) -->
        <div class="params">
          <div v-if="sfm !== 'onthefly'" class="param-row">
            <label>iters</label>
            <input type="number" v-model.number="iters" min="100" max="5000" step="100" />
          </div>
          <div class="param-row">
            <label>image size</label>
            <!-- NOTE: only affects MASt3R (engine=mast3r). Fast3R always runs at 512px
                 internally regardless of this setting — size=224 square-crops inputs
                 which breaks camera geometry for non-square images. -->
            <div style="display:flex;flex-direction:column;gap:4px">
              <div class="toggle-group">
                <button v-for="s in [256, 512]" :key="s" :class="{ active: imageSize === s }" @click="imageSize = s">
                  {{ s }}px<span style="font-size:0.75rem;opacity:0.7;margin-left:4px">{{ s === 256 ? '40+ frames' : '≤14 frames' }}</span>
                </button>
              </div>
              <small class="param-note">long-edge resize for SfM pose estimation — only used by MASt3R; ignored by Fast3R, COLMAP, GLOMAP variants, FastMap</small>
            </div>
          </div>
          <div v-if="!selectedVastInstance" class="param-row">
            <label>sfm</label>
            <div class="toggle-group">
              <button v-for="s in ['mast3r', 'fast3r', 'colmap_sift', 'glomap_sift', 'glomap_aliked', 'glomap_disk', 'glomap_superpoint', 'glomap_loftr', 'colmap_aliked', 'fastmap', 'realityscan', 'onthefly']" :key="s" :class="{ active: sfm === s }" @click="sfm = s">{{ s }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && sfm !== 'onthefly'" class="param-row">
            <label>trainer</label>
            <div class="toggle-group">
              <button v-for="t in ['instantsplat', 'pgsr', 'splatfacto', 'gsplat', '2dgs', 'brush']" :key="t" :class="{ active: trainer === t }" @click="trainer = t">{{ t }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>MCMC</label>
            <label class="toggle">
              <input type="checkbox" v-model="mcmc" />
              <span class="toggle-label">{{ mcmc ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && (trainer === 'gsplat' || trainer === '2dgs') && sfm !== 'onthefly'" class="param-row">
            <label>live viewer</label>
            <label class="toggle">
              <input type="checkbox" v-model="viewer" />
              <span class="toggle-label">{{ viewer ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>post-process</label>
            <div class="toggle-group">
              <button v-for="pp in ['none', 'bilateral_grid', 'ppisp']" :key="pp"
                :class="{ active: postProcessing === pp }" @click="postProcessing = pp">{{ pp }}</button>
            </div>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && postProcessing === 'bilateral_grid' && sfm !== 'onthefly'" class="param-row">
            <label>bilagrid fused</label>
            <label class="toggle">
              <input type="checkbox" v-model="bilateralGridFused" />
              <span class="toggle-label">{{ bilateralGridFused ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && trainer === 'gsplat' && sfm !== 'onthefly'" class="param-row">
            <label>random bkgd</label>
            <label class="toggle">
              <input type="checkbox" v-model="randomBkgd" />
              <span class="toggle-label">{{ randomBkgd ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div v-if="!selectedVastInstance && (trainer === 'gsplat' || trainer === '2dgs') && sfm !== 'onthefly'" class="param-row">
            <label>ssim λ</label>
            <input type="number" v-model.number="ssimLambda" min="0" max="0.5" step="0.05" />
          </div>
          <div v-if="!selectedVastInstance && sfm === 'onthefly'" class="param-row">
            <label>trainer</label>
            <span style="opacity:0.5;font-size:0.85em">combined with sfm (no separate trainer)</span>
          </div>
          <div v-if="selectedVastInstance" class="param-row">
            <label>pipeline</label>
            <span class="vast-pipeline-label">MegaSaM + PGSR</span>
          </div>
          <div class="param-row">
            <label>scene name</label>
            <input type="text" v-model="sceneName" placeholder="auto from first filename" />
          </div>
          <div class="param-row">
            <label>early stop</label>
            <label class="toggle">
              <input type="checkbox" v-model="earlyStop" />
              <span class="toggle-label">{{ earlyStop ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row">
            <label>sparse pairs</label>
            <label class="toggle">
              <input type="checkbox" v-model="sparsePairs" />
              <span class="toggle-label">{{ sparsePairs ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row">
            <label>sparse GA</label>
            <label class="toggle">
              <input type="checkbox" v-model="sparseGa" />
              <span class="toggle-label">{{ sparseGa ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row" v-if="!selectedVastInstance && sfm === 'fast3r'">
            <label>COLMAP BA</label>
            <label class="toggle">
              <input type="checkbox" v-model="colmapBa" />
              <span class="toggle-label">{{ colmapBa ? 'on' : 'off' }}</span>
            </label>
          </div>
          <div class="param-row" v-if="!selectedVastInstance && (sfm === 'colmap_sift' || sfm === 'glomap_sift' || sfm === 'fastmap')">
            <label>matcher</label>
            <div class="toggle-group">
              <button v-for="m in ['auto', 'sequential', 'exhaustive', 'vocab_tree']" :key="m"
                :class="{ active: colmapMatcher === m }" @click="colmapMatcher = m">{{ m }}</button>
            </div>
          </div>
          <div class="param-row" v-if="vastInstances.length">
            <label>run on</label>
            <select v-model="selectedVastInstance" class="vast-select">
              <option value="">Local GPU</option>
              <option v-for="inst in vastInstances" :key="inst.id" :value="inst.id">
                {{ inst.id }}{{ inst.gpu_name ? ` — ${inst.num_gpus}× ${inst.gpu_name}` : '' }}{{ inst.dph_total != null ? ` ($${inst.dph_total.toFixed(3)}/hr)` : '' }}
              </option>
            </select>
          </div>
          <button v-if="rerunJobId" class="process-btn" :disabled="processingPhotos" @click="startRerun">
            {{ processingPhotos ? 'Submitting…' : `Re-run with ${rerunImageCount} image${rerunImageCount !== 1 ? 's' : ''}` }}
          </button>
          <button v-else class="process-btn" :disabled="processingPhotos" @click="startPhotoJob">
            {{ processingPhotos ? 'Submitting…' : `Process ${photoFiles.length} Photo${photoFiles.length !== 1 ? 's' : ''}` }}
          </button>
          <div class="process-hint">{{ rerunJobId ? rerunImageCount : photoFiles.length }} image{{ (rerunJobId ? rerunImageCount : photoFiles.length) !== 1 ? 's' : '' }} — no blur check, straight to pipeline</div>
        </div>
      </template>
    </section>

    <button
      v-if="awaitingConfirmation"
      class="process-btn create-model-btn"
      @click="confirmUpload"
    >
      Create model from {{ liveSelection.length }} frames
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSplatStore } from '../stores/splatStore.js';
import { getGateway } from '../config/gateway.js';

const router = useRouter();
const splatStore = useSplatStore();

const error = ref('');

async function onSplatFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  error.value = '';
  const splatId = crypto.randomUUID();
  splatStore.storeBlob(splatId, URL.createObjectURL(file));
  router.push({ name: 'splat-viewer', params: { splatId } });
}

const videoFiles = ref([]);
const videoStrips = ref([]);
const iters = ref(5000);
const imageSize = ref(256);
const sceneName = ref('');
const earlyStop = ref(false);
const sparsePairs = ref(false);
const sparseGa = ref(false);
const colmapBa = ref(false);
const colmapMatcher = ref('exhaustive');

const sfm = ref('glomap_sift');
const trainer = ref('brush');
const mcmc = ref(true);
const viewer = ref(false);
const postProcessing = ref('none');
const bilateralGridFused = ref(false);
const randomBkgd = ref(false);
const ssimLambda = ref(0.2);

watch(postProcessing, (v) => { if (v === 'ppisp') mcmc.value = true; });

const sharedParams = computed(() => ({
  iters: iters.value,
  image_size: imageSize.value,
  early_stop: earlyStop.value,
  sparse_pairs: sparsePairs.value,
  sparse_ga: sparseGa.value,
  sfm: selectedVastInstance.value ? 'megasam' : sfm.value,
  trainer: selectedVastInstance.value ? 'pgsr' : trainer.value,
  mcmc: mcmc.value,
  viewer: viewer.value,
  post_processing: postProcessing.value,
  bilateral_grid_fused: bilateralGridFused.value,
  random_bkgd: randomBkgd.value,
  ssim_lambda: ssimLambda.value,
  colmap_ba: colmapBa.value,
  colmap_matcher: colmapMatcher.value !== 'auto' ? colmapMatcher.value : '',
}));

function appendSharedParams(form) {
  const p = sharedParams.value;
  form.append('iters', p.iters);
  form.append('image_size', p.image_size);
  form.append('early_stop', p.early_stop);
  form.append('sparse_pairs', p.sparse_pairs);
  form.append('sparse_ga', p.sparse_ga);
  form.append('sfm', p.sfm);
  form.append('trainer', p.trainer);
  form.append('mcmc', p.trainer === 'gsplat' ? p.mcmc : false);
  form.append('viewer', (p.trainer === 'gsplat' || p.trainer === '2dgs') ? p.viewer : false);
  if (p.trainer === 'gsplat') {
    form.append('post_processing', p.post_processing);
    form.append('bilateral_grid_fused', p.bilateral_grid_fused);
    form.append('random_bkgd', p.random_bkgd);
    form.append('ssim_lambda', p.ssim_lambda);
  } else if (p.trainer === '2dgs') {
    form.append('ssim_lambda', p.ssim_lambda);
  }
  form.append('colmap_ba', p.colmap_ba);
  if (p.colmap_matcher) form.append('colmap_matcher', p.colmap_matcher);
}
const processing = ref(false);
const videoLoading = ref(false);
const awaitingConfirmation = ref(false);
const previewFrame = ref(null);
const activeWorkers = [];
const EXTRACTION_FPS = 10;
const batchSize = ref(5);
const batchBuffer = ref(2);

// ── Extraction pipeline visualization ─────────────────────────────────────────
const extractionViz = ref({
  phase: null,        // null | 'scoring' | 'uploading'
  keyframeCount: 0,
  scoredFrames: [],   // [{ index, timeS, score, thumbUrl, fileIdx }]
  uploadLoaded: 0,
  uploadTotal: 0,
});

function resetExtractionViz() {
  for (const f of extractionViz.value.scoredFrames) {
    if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
  }
  extractionViz.value = {
    phase: null, keyframeCount: 0, scoredFrames: [], uploadLoaded: 0, uploadTotal: 0,
  };
  awaitingConfirmation.value = false;
}

onUnmounted(() => {
  for (const f of extractionViz.value.scoredFrames) {
    if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
  }
});

const phaseNum = computed(() => {
  const p = extractionViz.value.phase;
  return p === 'scoring' ? 2 : p === 'selecting' ? 3 : p === 'uploading' ? 4 : 0;
});

const estimatedFrameCount = computed(() =>
  videoStrips.value.reduce((s, strip) => {
    const dur = Math.max(0, (strip.endTime ?? strip.videoDuration) - strip.startTime);
    const total = Math.round(dur * EXTRACTION_FPS);
    return s + Math.ceil(total / Math.max(1, batchSize.value + batchBuffer.value));
  }, 0)
);

const maxScore = computed(() => {
  const scores = extractionViz.value.scoredFrames.map(f => f.score);
  return scores.length ? Math.max(...scores) : 1;
});

function scorePercent(score) {
  return Math.round(((score ?? 0) / Math.max(maxScore.value, 1)) * 100);
}

function normalizedScore(score) {
  return Math.round(((score ?? 0) / Math.max(maxScore.value, 0.001)) * 100);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, k) => start + k);
}

function batchedSelectMain(frames, bs, bb) {
  if (!frames.length) return [];
  bs = Math.max(1, bs);
  bb = Math.max(0, bb);
  const stride = bs + bb;
  const selected = [];
  for (let i = 0; i < frames.length; i += stride) {
    const end = Math.min(i + bs, frames.length);
    let bestJ = 0;
    for (let j = 1; j < end - i; j++) {
      if (frames[i + j].score > frames[i + bestJ].score) bestJ = j;
    }
    selected.push(frames[i + bestJ]);
  }
  return selected;
}

const liveSelection = computed(() =>
  batchedSelectMain(extractionViz.value.scoredFrames, batchSize.value, batchBuffer.value)
);

const selectedSet = computed(() => new Set(liveSelection.value.map(f => f.index)));

function onChartClick(e) {
  const frames = extractionViz.value.scoredFrames;
  if (!frames.length) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const idx = Math.max(0, Math.min(Math.floor(((e.clientX - rect.left) / rect.width) * frames.length), frames.length - 1));
  const frame = frames[idx];
  if (!frame) return;
  previewFrame.value = previewFrame.value?.index === idx ? null : { ...frame, index: idx };
}

const progressPct = computed(() => {
  const v = extractionViz.value;
  if (!v.keyframeCount) return 0;
  return Math.min(100, Math.round((v.scoredFrames.length / v.keyframeCount) * 100));
});


const step1Status = computed(() => {
  const v = extractionViz.value;
  if (!v.phase) return `~${estimatedFrameCount.value} I-frames`;
  return `${v.keyframeCount || '?'} I-frames`;
});
const step2Status = computed(() => {
  const v = extractionViz.value;
  if (!v.phase) return 'score each frame for sharpness';
  if (phaseNum.value === 2) return `${v.scoredFrames.length} / ${v.keyframeCount}`;
  return `${v.scoredFrames.length} frames scored`;
});
const step3Status = computed(() => {
  const total = extractionViz.value.scoredFrames.length;
  if (!total) return '—';
  return `${liveSelection.value.length} of ${total} selected`;
});
const step4Status = computed(() => {
  const v = extractionViz.value;
  if (phaseNum.value < 4) return '—';
  if (!v.uploadTotal) return 'Uploading…';
  return `${Math.round((v.uploadLoaded / v.uploadTotal) * 100)}% (${(v.uploadLoaded / 1e6).toFixed(1)} MB)`;
});

// ── Vast.ai ───────────────────────────────────────────────────────────────────
const vastInstances = ref([]);
const selectedVastInstance = ref('');

function makeStrip(name) {
  return { name, frames: [], videoDuration: 0, startTime: 0, endTime: null };
}

function startPct(strip) {
  return strip.videoDuration > 0 ? (strip.startTime / strip.videoDuration) * 100 : 0;
}
function endPct(strip) {
  const end = strip.endTime ?? strip.videoDuration;
  return strip.videoDuration > 0 ? (end / strip.videoDuration) * 100 : 100;
}
function formatTime(s) {
  if (s == null || isNaN(s)) return '—';
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1);
  return m > 0 ? `${m}:${sec.padStart(4, '0')}` : `${sec}s`;
}

// Trim drag
function startTrimDrag(e, stripIndex, handle) {
  const framesEl = e.currentTarget.closest('.strip-frames');
  const rect = framesEl.getBoundingClientRect();

  const onMove = (me) => {
    const fraction = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
    const strip = videoStrips.value[stripIndex];
    const time = fraction * strip.videoDuration;
    if (handle === 'start') {
      strip.startTime = Math.min(time, (strip.endTime ?? strip.videoDuration) - 0.1);
    } else {
      strip.endTime = Math.max(time, strip.startTime + 0.1);
      if (strip.endTime >= strip.videoDuration - 0.05) strip.endTime = null;
    }
  };

  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.body.style.userSelect = '';
  };

  document.body.style.userSelect = 'none';
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
}

async function extractFrames(file, count = 10) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    video.addEventListener('loadedmetadata', async () => {
      const THUMB_H = 120;
      const scale = THUMB_H / (video.videoHeight || THUMB_H);
      const canvas = document.createElement('canvas');
      canvas.height = THUMB_H;
      canvas.width = Math.round((video.videoWidth || 160) * scale);
      const ctx = canvas.getContext('2d');
      const frames = [];
      const videoDuration = isFinite(video.duration) ? video.duration : 0;

      for (let i = 0; i < count; i++) {
        const t = videoDuration > 0 ? (videoDuration * i) / (count - 1) : 0;
        await new Promise((res) => {
          video.currentTime = t;
          video.addEventListener('seeked', res, { once: true });
        });
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.7));
      }

      URL.revokeObjectURL(url);
      resolve({ frames, videoDuration });
    });

    video.addEventListener('error', () => { URL.revokeObjectURL(url); resolve({ frames: [], videoDuration: 0 }); });
  });
}

async function onVideoFile(e) {
  videoFiles.value = Array.from(e.target.files);
  videoStrips.value = videoFiles.value.map((f) => makeStrip(f.name));
  await Promise.all(
    videoFiles.value.map(async (f, i) => {
      const { frames, videoDuration } = await extractFrames(f);
      videoStrips.value[i] = { ...videoStrips.value[i], frames, videoDuration };
    })
  );
  startJob();
}

async function startJob() {
  if (!videoFiles.value.length) return;
  while (activeWorkers.length) activeWorkers.pop().terminate();
  error.value = '';
  previewFrame.value = null;
  resetExtractionViz();

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    return;
  }

  extractionViz.value.phase = 'scoring';

  try {
    let indexOffset = 0;
    for (let si = 0; si < videoFiles.value.length; si++) {
      const file = videoFiles.value[si];
      const strip = videoStrips.value[si];
      await scoreWithWorker(file, EXTRACTION_FPS, strip.startTime, strip.endTime, si, indexOffset);
      indexOffset = extractionViz.value.scoredFrames.length;
    }
  } catch (err) {
    error.value = 'Frame extraction failed: ' + err.message;
    extractionViz.value.phase = null;
    return;
  }

  awaitingConfirmation.value = true;
}

async function confirmUpload() {
  awaitingConfirmation.value = false;

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    return;
  }

  // Decode selected frames at full resolution using the current (live) selection
  const selected = liveSelection.value;
  let allFrameBlobs;
  try {
    const perFile = await Promise.all(
      videoFiles.value.map((file, si) => {
        const timestamps = selected.filter(f => f.fileIdx === si).map(f => f.timeS);
        const scores = Object.fromEntries(selected.filter(f => f.fileIdx === si).map(f => [f.timeS, f.score]));
        return timestamps.length ? decodeWithWorker(file, timestamps, scores) : Promise.resolve([]);
      })
    );
    allFrameBlobs = perFile.flat();
  } catch (err) {
    error.value = 'Frame decode failed: ' + err.message;
    return;
  }

  const form = new FormData();
  allFrameBlobs.forEach((f, i) => {
    form.append('images', new File([f.fullBlob], `frame_${String(i).padStart(5, '0')}.jpg`, { type: 'image/jpeg' }));
  });
  appendSharedParams(form);
  if (sceneName.value) form.append('scene', sceneName.value);
  if (selectedVastInstance.value) form.append('vast_instance_id', selectedVastInstance.value);

  extractionViz.value.phase = 'uploading';

  let jobId;
  try {
    jobId = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${gateway}/topowall/api/v1/images-to-splat`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          extractionViz.value.uploadLoaded = e.loaded;
          extractionViz.value.uploadTotal = e.total;
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText).job_id); }
          catch { reject(new Error('Invalid server response')); }
        } else {
          reject(new Error(`Server error ${xhr.status}: ${xhr.responseText.slice(0, 200)}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(form);
    });
  } catch (err) {
    error.value = 'Upload failed: ' + err.message;
    extractionViz.value.phase = null;
    return;
  }

  router.push({ name: 'splat-viewer', params: { splatId: jobId } });
}

function makeWorker() {
  return new Worker(new URL('../workers/frameExtractor.worker.js', import.meta.url), { type: 'module' });
}

function scoreWithWorker(file, fps, startTime, endTime, fileIdx, indexOffset = 0) {
  return new Promise((resolve, reject) => {
    const worker = makeWorker();
    activeWorkers.push(worker);
    const cleanup = () => {
      const i = activeWorkers.indexOf(worker);
      if (i !== -1) activeWorkers.splice(i, 1);
      worker.terminate();
    };
    worker.onmessage = ({ data }) => {
      const viz = extractionViz.value;
      if (data.type === 'total') {
        viz.keyframeCount += data.count;
      } else if (data.type === 'frame-scored') {
        const thumbUrl = URL.createObjectURL(data.thumbBlob);
        viz.scoredFrames.push({ index: data.index + indexOffset, timeS: data.timeS, score: data.score, thumbUrl, fileIdx });
      } else if (data.type === 'done') {
        cleanup();
        resolve();
      } else if (data.type === 'error') {
        cleanup();
        reject(new Error(data.message));
      }
    };
    worker.onerror = (e) => { cleanup(); reject(new Error(e.message)); };
    worker.postMessage({ file, extractionFps: fps, startTime: startTime || 0, endTime: endTime ?? Infinity });
  });
}

function decodeWithWorker(file, timestamps, scores = {}) {
  return new Promise((resolve, reject) => {
    const worker = makeWorker();
    activeWorkers.push(worker);
    const cleanup = () => {
      const i = activeWorkers.indexOf(worker);
      if (i !== -1) activeWorkers.splice(i, 1);
      worker.terminate();
    };
    worker.onmessage = ({ data }) => {
      if (data.type === 'done') { cleanup(); resolve(data.frames); }
      else if (data.type === 'error') { cleanup(); reject(new Error(data.message)); }
    };
    worker.onerror = (e) => { cleanup(); reject(new Error(e.message)); };
    worker.postMessage({ mode: 'decode', file, timestamps, scores });
  });
}

// ── Photos ────────────────────────────────────────────────────────────────────
const photoFiles = ref([]);  // [{ name, url, file }]
const processingPhotos = ref(false);
const rerunJobId = ref(null);       // set when rerunning an image job server-side
const rerunImageCount = ref(0);

async function startRerun() {
  if (!rerunJobId.value) return;
  error.value = '';
  processingPhotos.value = true;
  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    processingPhotos.value = false;
    return;
  }
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerunJobId.value}/rerun`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...sharedParams.value,
        scene: sceneName.value || undefined,
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Server error ${res.status}: ${detail}`);
    }
    const { job_id: jobId } = await res.json();
    router.push({ name: 'splat-viewer', params: { splatId: jobId } });
  } catch (err) {
    error.value = 'Failed to start rerun: ' + err.message;
  } finally {
    processingPhotos.value = false;
  }
}

function onPhotoFile(e) {
  const incoming = Array.from(e.target.files).map((f) => ({
    name: f.name,
    url: URL.createObjectURL(f),
    file: f,
  }));
  photoFiles.value = [...photoFiles.value, ...incoming];
  e.target.value = '';
}

function removePhoto(i) {
  URL.revokeObjectURL(photoFiles.value[i].url);
  photoFiles.value.splice(i, 1);
}

async function startPhotoJob() {
  if (!photoFiles.value.length) return;
  error.value = '';
  processingPhotos.value = true;

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    processingPhotos.value = false;
    return;
  }

  const form = new FormData();
  for (const p of photoFiles.value) form.append('images', p.file);
  appendSharedParams(form);
  if (sceneName.value) form.append('scene', sceneName.value);

  if (selectedVastInstance.value) form.append('vast_instance_id', selectedVastInstance.value);

  let jobId;
  try {
    const res = await fetch(`${gateway}/topowall/api/v1/images-to-splat`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Server error ${res.status}: ${detail}`);
    }
    ({ job_id: jobId } = await res.json());
  } catch (err) {
    error.value = 'Failed to start job: ' + err.message;
    processingPhotos.value = false;
    return;
  }

  processingPhotos.value = false;
  router.push({ name: 'splat-viewer', params: { splatId: jobId } });
}

onMounted(async () => {
  // Fetch vast.ai instances in background
  try {
    const gw = await getGateway();
    const r = await fetch(`${gw}/topowall/api/v1/vast/instances`);
    if (r.ok) {
      const { instances } = await r.json();
      vastInstances.value = instances || [];
    }
  } catch { /* vast unavailable — skip */ }

  const rerunRaw = sessionStorage.getItem('splat-rerun');
  if (!rerunRaw) return;
  sessionStorage.removeItem('splat-rerun');
  const rerun = JSON.parse(rerunRaw);

  const p = rerun.params;
  if (p) {
    iters.value = p.iters ?? 1000;
    imageSize.value = p.image_size ?? 256;
    earlyStop.value = p.early_stop === true || p.early_stop === 'true';
    sparsePairs.value = p.sparse_pairs === true || p.sparse_pairs === 'true';
    sparseGa.value = p.sparse_ga === true || p.sparse_ga === 'true';
    colmapBa.value = p.colmap_ba === true || p.colmap_ba === 'true';
    colmapMatcher.value = p.colmap_matcher || 'auto';
    sfm.value = p.sfm ?? (p.engine === 'pgsr' ? 'mast3r' : p.engine) ?? 'mast3r';
    trainer.value = p.trainer ?? (p.engine === 'pgsr' ? 'pgsr' : 'instantsplat') ?? 'instantsplat';
    mcmc.value = p.mcmc === true || p.mcmc === 'true';
    viewer.value = p.viewer !== false && p.viewer !== 'false';
    postProcessing.value = p.post_processing || 'none';
    bilateralGridFused.value = !!p.bilateral_grid_fused;
    randomBkgd.value = !!p.random_bkgd;
    ssimLambda.value = p.ssim_lambda != null ? parseFloat(p.ssim_lambda) : 0.2;
  }
  if (rerun.scene) sceneName.value = rerun.scene;

  if (rerun.storedVideos?.length && rerun.jobId) {
    videoLoading.value = true;
    try {
      const gateway = await getGateway();
      const files = await Promise.all(
        rerun.storedVideos.map(async (v) => {
          const res = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerun.jobId}/video/${v.stored}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          return new File([blob], v.filename || v.stored, { type: blob.type || 'video/mp4' });
        })
      );
      videoFiles.value = files;
      videoStrips.value = files.map((f, idx) => {
        const strip = makeStrip(f.name);
        return strip;
      });
      await Promise.all(
        files.map(async (f, i) => {
          const { frames, videoDuration } = await extractFrames(f);
          videoStrips.value[i] = { ...videoStrips.value[i], frames, videoDuration };
        })
      );
    } catch {
      // video fetch failed — user can pick manually
    } finally {
      videoLoading.value = false;
    }
  }

  if (rerun.inputSource === 'images' && rerun.jobId) {
    // Don't fetch blobs — server copies files internally via /rerun endpoint.
    // Just record the source jobId and image count so the UI can show a banner.
    rerunJobId.value = rerun.jobId;
    const p = rerun.params;
    rerunImageCount.value = (p?.filenames?.length) || 0;
    // If count unknown, fetch the list just for the count (no blobs needed)
    if (!rerunImageCount.value) {
      try {
        const gateway = await getGateway();
        const listRes = await fetch(`${gateway}/topowall/api/v1/video-to-splat/${rerun.jobId}/images`);
        if (listRes.ok) {
          const { images: filenames } = await listRes.json();
          rerunImageCount.value = filenames.length;
        }
      } catch { /* silent */ }
    }
  }
});
</script>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 32px;
  gap: 12px;
  color: #ccc;
  overflow-y: auto;
  min-height: calc(100vh - 45px);
}

.section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.section.narrow { max-width: 480px; }
.section.wide { max-width: 1200px; }

.section h3 { font-size: 0.85rem; color: #666; text-transform: uppercase; letter-spacing: 0.08em; }

.divider { color: #444; font-size: 0.8rem; margin: 4px 0; }

.pick-btn {
  padding: 12px 28px;
  background: #2563eb;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.pick-btn:hover { background: #1d4ed8; }
.pick-btn.secondary { background: #374151; }
.pick-btn.secondary:hover { background: #4b5563; }
.pick-btn.loading { opacity: 0.65; cursor: wait; }

/* Mode selector */
.mode-row { display: flex; align-items: center; gap: 12px; }
.mode-label { font-size: 0.85rem; color: #9ca3af; }

.toggle-group { display: flex; gap: 4px; }
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

/* Video strips */
.video-strips { width: 100%; display: flex; flex-direction: column; gap: 20px; }

.strip { display: flex; flex-direction: column; gap: 6px; }

.strip-label { font-size: 0.8rem; color: #9ca3af; padding-left: 2px; }

/* Frame strip — fills full width, no scroll */
.strip-frames {
  display: flex;
  width: 100%;
  height: 120px;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}
.frame-thumb {
  flex: 1;
  min-width: 0;
  height: 100%;
  object-fit: cover;
  display: block;
}
.frame-placeholder {
  flex: 1;
  min-width: 0;
  height: 100%;
  background: #1f2937;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

/* Trimmer overlay */
.trimmer-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.trim-dark {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
}
.trim-bracket {
  position: absolute;
  top: 0;
  bottom: 0;
  border: 2px solid rgba(255, 255, 255, 0.5);
  box-sizing: border-box;
  pointer-events: none;
}
.trim-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 3px;
  cursor: ew-resize;
  pointer-events: all;
  opacity: 0.85;
  transition: opacity 0.1s;
}
.trim-handle:hover { opacity: 1; }

/* Per-video params row */
.strip-params {
  display: flex;
  align-items: center;
  gap: 24px;
}
.param-input {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #9ca3af;
}
.param-input input[type="number"] {
  width: 80px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  padding: 4px 8px;
  font-size: 0.85rem;
}
.vast-select {
  background: #1f2937;
  color: #e5e7eb;
  border: 1px solid #374151;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.vast-pipeline-label {
  font-size: 0.85rem;
  color: #a5b4fc;
  background: #312e81;
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid #4338ca;
}
.trim-times {
  display: flex;
  gap: 16px;
  margin-left: auto;
}
.time-field {
  font-size: 0.75rem;
  color: #6b7280;
}
.time-val {
  color: #d1d5db;
  font-variant-numeric: tabular-nums;
  margin-left: 4px;
}
.time-field.total .time-val { color: #60a5fa; }

/* Shared params */
.params { width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }

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

.toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle input[type="checkbox"] { accent-color: #2563eb; width: 16px; height: 16px; cursor: pointer; }
.toggle-label { font-size: 0.85rem; color: #9ca3af; }
.param-note { font-size: 0.72rem; color: #6b7280; }

.process-btn {
  margin-top: 8px;
  padding: 12px;
  background: #16a34a;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  transition: background 0.2s;
}
.process-btn:hover:not(:disabled) { background: #15803d; }
.process-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.confirm-btn { background: #1d4ed8; }
.confirm-btn:hover { background: #1e40af; }
.create-model-btn { background: #1d4ed8; width: 100%; margin-top: 24px; font-size: 1rem; padding: 14px; }
.create-model-btn:hover { background: #1e40af; }
.process-hint { font-size: 0.75rem; color: #6b7280; text-align: center; margin-top: -4px; }

.error {
  background: #7f1d1d;
  color: #fca5a5;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.85rem;
  max-width: 80%;
  text-align: center;
}

/* Photo grid */
.rerun-banner {
  width: 100%;
  padding: 10px 14px;
  background: #1a2a1a;
  border: 1px solid #3a6a3a;
  border-radius: 8px;
  color: #7ec87e;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.rerun-clear {
  background: none;
  border: 1px solid #3a6a3a;
  color: #7ec87e;
  border-radius: 5px;
  padding: 3px 8px;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
}
.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
}
.photo-item {
  position: relative;
  width: 120px;
  flex-shrink: 0;
}
.photo-thumb {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #374151;
  display: block;
}
.photo-name {
  display: block;
  font-size: 0.65rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 3px;
}
.photo-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.photo-remove:hover { background: #dc2626; }

/* ── Extraction pipeline panel ───────────────────────────────────────────────── */
.pipeline-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Idle hint */
.pipeline-idle-hint {
  font-size: 0.78rem;
  color: #4b5563;
  text-align: center;
  padding: 8px 0;
}

/* Progress bars */
.extraction-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.prog-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
}
.prog-row-gap { margin-top: 8px; }
.prog-label { flex: 1; color: #d1d5db; }
.prog-method {
  font-size: 0.68rem;
  padding: 2px 7px;
  background: #1e3a8a;
  color: #93c5fd;
  border-radius: 999px;
  white-space: nowrap;
}
.prog-count {
  font-size: 0.75rem;
  color: #6b7280;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.prog-track {
  height: 5px;
  background: #1e293b;
  border-radius: 3px;
  overflow: hidden;
}
.prog-fill {
  height: 100%;
  background: #e2e8f0;
  border-radius: 3px;
  transition: width 0.2s ease;
}
.prog-fill-blue { background: #3b82f6; }

/* Frame analysis header */
.analysis-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.analysis-title {
  font-size: 0.88rem;
  font-weight: 600;
  color: #d1d5db;
}
.analysis-sub {
  font-size: 0.72rem;
  color: #6b7280;
}

/* Bar chart */
.barchart-wrap {
  width: 100%;
  height: 110px;
  border-radius: 6px;
  overflow: hidden;
  background: #0f172a;
}
.barchart-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Minimap */
.minimap-wrap {
  width: 100%;
  height: 32px;
  background: #0f172a;
  border-radius: 4px;
  overflow: hidden;
}
.minimap-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Confirmation stats */
.confirm-stats {
  font-size: 0.82rem;
  color: #9ca3af;
  text-align: center;
}
.conf-n {
  font-weight: 700;
  color: #60a5fa;
}

/* Batch selection controls */
.batch-controls {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.batch-ctrl {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: default;
}
.batch-ctrl input[type="number"] {
  width: 56px;
  background: #1e293b;
  border: 1px solid #374151;
  border-radius: 5px;
  color: #e2e8f0;
  padding: 3px 6px;
  font-size: 0.85rem;
  text-align: center;
}
.batch-hint {
  font-size: 0.7rem;
  color: #4b5563;
}

/* Frame preview (click on bar chart) */
.barchart-wrap { cursor: pointer; }
.frame-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: #1e293b;
  border-radius: 6px;
  border: 1px solid #334155;
  position: relative;
}
.preview-thumb {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
  image-rendering: auto;
}
.preview-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preview-time { font-size: 0.82rem; color: #94a3b8; font-variant-numeric: tabular-nums; }
.preview-score { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }
.preview-badge {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 999px;
  width: fit-content;
}
.preview-sel { background: #1e3a8a; color: #93c5fd; }
.preview-rej { background: #292524; color: #a8a29e; }
.preview-close {
  position: absolute;
  top: 6px; right: 8px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px 4px;
}
.preview-close:hover { color: #e5e7eb; }

/* Confirm + re-extract row */
.confirm-actions {
  display: flex;
  gap: 8px;
  align-items: stretch;
}
.confirm-actions .process-btn { flex: 1; margin-top: 0; }
.reextract-btn {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #374151;
  border-radius: 8px;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.85rem;
  white-space: nowrap;
  transition: border-color 0.2s, color 0.2s;
  margin-top: 8px;
}
.reextract-btn:hover { border-color: #6b7280; color: #d1d5db; }
.confirm-actions .reextract-btn { margin-top: 0; }
</style>
