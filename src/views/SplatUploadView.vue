<template>
  <div class="picker">
    <!-- Load existing .splat file -->
    <section class="section narrow">
      <h3>Load .splat file</h3>
      <label class="pick-btn">
        Choose .splat file
        <input type="file" accept=".splat" @change="onSplatFile" hidden />
      </label>
    </section>

    <div class="divider">or</div>

    <!-- Create from video -->
    <section class="section wide">
      <h3>Create from video</h3>

      <label class="pick-btn secondary" :class="{ loading: videoLoading }">
        {{ videoLoading ? 'Downloading video…' : 'Choose video(s)' }}
        <input type="file" accept=".mp4,.mov,.MOV,.MP4" multiple @change="onVideoFile" :disabled="videoLoading" hidden />
      </label>

      <template v-if="videoFiles.length">
        <!-- Mode selector above strips -->
        <div class="mode-row">
          <span class="mode-label">Mode</span>
          <div class="toggle-group">
            <button :class="{ active: paramMode === 'nframes' }" @click="paramMode = 'nframes'">n-frames + duration</button>
            <button :class="{ active: paramMode === 'fps' }" @click="paramMode = 'fps'">fps</button>
          </div>
        </div>

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
              <template v-if="paramMode === 'nframes'">
                <label class="param-input">n-frames
                  <input type="number" v-model.number="strip.nFrames" min="2" max="20" />
                </label>
              </template>
              <template v-else>
                <label class="param-input">fps
                  <input type="number" v-model.number="strip.fps" min="0.1" max="5" step="0.1" />
                </label>
              </template>
              <div class="trim-times">
                <span class="time-field">start <span class="time-val">{{ formatTime(strip.startTime) }}</span></span>
                <span class="time-field">end <span class="time-val">{{ formatTime(strip.endTime ?? strip.videoDuration) }}</span></span>
                <span class="time-field total">duration <span class="time-val">{{ formatTime((strip.endTime ?? strip.videoDuration) - strip.startTime) }}</span></span>
              </div>
            </div>
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

        <!-- ── Extraction pipeline ─────────────────────────────────────── -->
        <!-- TODO CHECK: user reported something wrong in the UI (screenshot at 09:32:55 not readable).
             Verify after loading a real video:
             1. Old "preview-strip" frame row is gone (deleted — should not appear below the film strip)
             2. The 4-step pipeline panel shows below the shared params (idle: all dimmed, ~N frames hint)
             3. After clicking Process Video → steps light up in sequence as scoring/selecting/uploading runs
             4. Batch grid shows correct winner (★ green border) vs rejected (28% opacity) per batch row
             5. Upload progress bar appears and fills during XHR upload to /images-to-splat
        -->
        <div class="pipeline-panel">
          <!-- Step row -->
          <div class="pipeline-steps">
            <div class="pipeline-step" :class="{ done: phaseNum >= 2 }">
              <div class="step-circle" :class="{ done: phaseNum >= 2 }">{{ phaseNum >= 2 ? '✓' : '1' }}</div>
              <div class="step-body">
                <span class="step-name">Keyframes</span>
                <span class="step-status">{{ step1Status }}</span>
              </div>
            </div>
            <div class="step-arrow">›</div>
            <div class="pipeline-step" :class="{ active: phaseNum === 2, done: phaseNum >= 3 }">
              <div class="step-circle" :class="{ done: phaseNum >= 3 }">{{ phaseNum >= 3 ? '✓' : '2' }}</div>
              <div class="step-body">
                <span class="step-name">Sharpness</span>
                <span class="step-status">{{ step2Status }}</span>
              </div>
            </div>
            <div class="step-arrow">›</div>
            <div class="pipeline-step" :class="{ active: phaseNum === 3 && !awaitingConfirmation, done: phaseNum >= 4 || awaitingConfirmation }">
              <div class="step-circle" :class="{ done: phaseNum >= 4 || awaitingConfirmation }">{{ phaseNum >= 4 || awaitingConfirmation ? '✓' : '3' }}</div>
              <div class="step-body">
                <span class="step-name">Selection</span>
                <span class="step-status">{{ step3Status }}</span>
              </div>
            </div>
            <div class="step-arrow">›</div>
            <div class="pipeline-step" :class="{ active: phaseNum === 4 }">
              <div class="step-circle">4</div>
              <div class="step-body">
                <span class="step-name">Upload</span>
                <span class="step-status">{{ step4Status }}</span>
              </div>
            </div>
          </div>

          <!-- Upload progress bar -->
          <div v-if="phaseNum === 4 && extractionViz.uploadTotal > 0" class="upload-bar-wrap">
            <div class="upload-bar" :style="{ width: (extractionViz.uploadLoaded / extractionViz.uploadTotal * 100) + '%' }" />
          </div>

          <!-- Frame grid — flat during scoring, batches after selection -->
          <template v-if="extractionViz.batches.length">
            <!-- Batch view: one row per batch, winner highlighted -->
            <div class="batch-grid">
              <div v-for="(batch, bi) in extractionViz.batches" :key="bi" class="batch-row">
                <span class="batch-num">{{ bi + 1 }}</span>
                <div class="batch-frames">
                  <div
                    v-for="idx in range(batch.start, batch.end)"
                    :key="idx"
                    class="frame-card"
                    :class="{ winner: idx === batch.winner, rejected: idx !== batch.winner }"
                  >
                    <img :src="extractionViz.scoredFrames[idx]?.thumbUrl" class="frame-card-img" />
                    <div class="score-fill" :style="{ width: scorePercent(extractionViz.scoredFrames[idx]?.score) + '%' }" />
                    <span v-if="idx === batch.winner" class="winner-badge">★</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="extractionViz.scoredFrames.length">
            <!-- Flat view: frames appear as they are scored -->
            <div class="flat-frame-grid">
              <div v-for="(frame, idx) in extractionViz.scoredFrames" :key="idx" class="frame-card">
                <img :src="frame.thumbUrl" class="frame-card-img" />
                <div class="score-fill" :style="{ width: scorePercent(frame.score) + '%' }" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="pipeline-idle-hint">
              {{ videoLoading ? 'Loading video…' : `~${estimatedFrameCount} frames will be extracted in-browser` }}
            </div>
          </template>

          <!-- Confirm button (shown after selection, before upload) -->
          <button
            v-if="awaitingConfirmation"
            class="process-btn confirm-btn"
            @click="confirmUpload"
          >
            Upload {{ extractionViz.selectedIndices.length }} frames
          </button>

          <!-- Process button -->
          <button
            v-else
            class="process-btn"
            :disabled="videoLoading || phaseNum > 0"
            @click="startJob"
          >
            {{ phaseNum === 2 ? `Scoring… ${extractionViz.scoredFrames.length}/${extractionViz.keyframeCount}`
              : phaseNum === 3 ? 'Selecting best frames…'
              : phaseNum === 4 ? 'Uploading…'
              : videoLoading ? 'Preparing…'
              : videoFiles.length > 1 ? `Process ${videoFiles.length} Videos` : 'Process Video' }}
          </button>
        </div>
      </template>
    </section>

    <div v-if="error" class="error">{{ error }}</div>

    <div class="divider">or</div>

    <!-- Create from photos -->
    <section class="section wide">
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
const paramMode = ref('fps');
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
const pendingFrameBlobs = ref([]);

// ── Extraction pipeline visualization ─────────────────────────────────────────
const extractionViz = ref({
  phase: null,          // null | 'scoring' | 'selecting' | 'uploading'
  keyframeCount: 0,
  scoredFrames: [],     // [{ index, timeS, score, thumbUrl }]
  selectedIndices: [],  // number[] — set during/after 'selecting'
  batches: [],          // [{ start, end, winner }]
  uploadLoaded: 0,
  uploadTotal: 0,
});

function resetExtractionViz() {
  for (const f of extractionViz.value.scoredFrames) {
    if (f.thumbUrl) URL.revokeObjectURL(f.thumbUrl);
  }
  extractionViz.value = {
    phase: null, keyframeCount: 0, scoredFrames: [],
    selectedIndices: [], batches: [], uploadLoaded: 0, uploadTotal: 0,
  };
  awaitingConfirmation.value = false;
  pendingFrameBlobs.value = [];
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
    return s + (paramMode.value === 'nframes'
      ? Math.max(1, strip.nFrames)
      : Math.max(1, Math.round(strip.fps * dur)));
  }, 0)
);

const maxScore = computed(() => {
  const scores = extractionViz.value.scoredFrames.map(f => f.score);
  return scores.length ? Math.max(...scores) : 1;
});

function scorePercent(score) {
  return Math.round(((score ?? 0) / Math.max(maxScore.value, 1)) * 100);
}

function range(start, end) {
  return Array.from({ length: end - start + 1 }, (_, k) => start + k);
}

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
  const v = extractionViz.value;
  if (phaseNum.value < 3) return '—';
  if (phaseNum.value === 3) return 'Selecting…';
  return `${v.selectedIndices.length} of ${v.scoredFrames.length} selected`;
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
  return { name, frames: [], videoDuration: 0, startTime: 0, endTime: null, fps: 0.5, nFrames: 3 };
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
}

async function startJob() {
  if (!videoFiles.value.length) return;
  error.value = '';
  resetExtractionViz();

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
    return;
  }

  const allFrameBlobs = [];
  extractionViz.value.phase = 'scoring';

  try {
    let indexOffset = 0;
    for (let si = 0; si < videoFiles.value.length; si++) {
      const file = videoFiles.value[si];
      const strip = videoStrips.value[si];
      const end = strip.endTime ?? strip.videoDuration;
      const dur = Math.max(0, end - strip.startTime);
      const nFrames = paramMode.value === 'nframes'
        ? Math.max(1, strip.nFrames)
        : Math.max(1, Math.round(strip.fps * dur));

      const frames = await extractWithWorker(file, nFrames, strip.startTime, strip.endTime, indexOffset);
      indexOffset = extractionViz.value.scoredFrames.length;
      allFrameBlobs.push(...frames);
    }
  } catch (err) {
    error.value = 'Frame extraction failed: ' + err.message;
    extractionViz.value.phase = null;
    return;
  }

  // Pause here — let the user review the frame grid before uploading
  pendingFrameBlobs.value = allFrameBlobs;
  awaitingConfirmation.value = true;
}

async function confirmUpload() {
  const allFrameBlobs = pendingFrameBlobs.value;
  awaitingConfirmation.value = false;

  let gateway;
  try {
    gateway = await getGateway();
  } catch (err) {
    error.value = 'Gateway not configured: ' + err.message;
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

function extractWithWorker(file, nFrames, startTime, endTime, indexOffset = 0) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/frameExtractor.worker.js', import.meta.url),
      { type: 'module' },
    );

    worker.onmessage = ({ data }) => {
      const viz = extractionViz.value;
      if (data.type === 'total') {
        viz.keyframeCount += data.count;
      } else if (data.type === 'frame-scored') {
        const thumbUrl = URL.createObjectURL(data.thumbBlob);
        viz.scoredFrames.push({ index: data.index + indexOffset, timeS: data.timeS, score: data.score, thumbUrl });
      } else if (data.type === 'selection') {
        viz.phase = 'selecting';
        for (const b of data.batches) {
          viz.batches.push({ start: b.start + indexOffset, end: b.end + indexOffset, winner: b.winner + indexOffset });
        }
        for (const idx of data.selectedIndices) viz.selectedIndices.push(idx + indexOffset);
      } else if (data.type === 'done') {
        worker.terminate();
        resolve(data.frames);
      } else if (data.type === 'error') {
        worker.terminate();
        reject(new Error(data.message));
      }
    };

    worker.onerror = (e) => { worker.terminate(); reject(new Error(e.message)); };
    worker.postMessage({ file, nFrames, startTime: startTime || 0, endTime: endTime ?? Infinity });
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
    paramMode.value = p.n_frames != null ? 'nframes' : 'fps';
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
        if (p) {
          if (p.n_frames != null) strip.nFrames = (Array.isArray(p.n_frames) ? p.n_frames[idx] : p.n_frames) ?? 3;
          if (p.fps != null) strip.fps = (Array.isArray(p.fps) ? p.fps[idx] : p.fps) ?? 0.5;
        }
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

/* Step row */
.pipeline-steps {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.pipeline-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #2d3748;
  background: #1a202c;
  opacity: 0.45;
  transition: opacity 0.2s, border-color 0.2s;
  min-width: 140px;
}
.pipeline-step.active { opacity: 1; border-color: #3b82f6; background: #1e293b; }
.pipeline-step.done   { opacity: 0.75; border-color: #374151; }

.step-circle {
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid #4b5563;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 700; color: #9ca3af;
  flex-shrink: 0;
}
.step-circle.done { border-color: #22c55e; color: #22c55e; }
.pipeline-step.active .step-circle { border-color: #3b82f6; color: #60a5fa; }

.step-body { display: flex; flex-direction: column; gap: 1px; }
.step-name  { font-size: 0.78rem; font-weight: 600; color: #d1d5db; }
.step-status { font-size: 0.68rem; color: #6b7280; font-variant-numeric: tabular-nums; }
.pipeline-step.active .step-status { color: #93c5fd; }

.step-arrow { color: #374151; font-size: 1.1rem; flex-shrink: 0; padding: 0 2px; }

/* Upload progress bar */
.upload-bar-wrap {
  height: 4px;
  background: #1f2937;
  border-radius: 2px;
  overflow: hidden;
}
.upload-bar {
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.15s;
}

/* Idle hint */
.pipeline-idle-hint {
  font-size: 0.78rem;
  color: #4b5563;
  text-align: center;
  padding: 8px 0;
}

/* Batch grid (after selection) */
.batch-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}
.batch-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.batch-num {
  width: 18px;
  font-size: 0.6rem;
  color: #4b5563;
  text-align: right;
  padding-top: 4px;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.batch-frames {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

/* Flat grid (during scoring) */
.flat-frame-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  width: 100%;
}

/* Individual frame card */
.frame-card {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
  flex-shrink: 0;
  transition: opacity 0.3s, border-color 0.3s;
  background: #111827;
}
.frame-card.winner {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px #166534;
}
.frame-card.rejected {
  opacity: 0.28;
}
.frame-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Score bar at bottom of each card */
.score-fill {
  position: absolute;
  bottom: 0; left: 0;
  height: 3px;
  background: linear-gradient(to right, #dc2626, #f59e0b, #22c55e);
  border-radius: 0 0 2px 2px;
}

/* Winner star badge */
.winner-badge {
  position: absolute;
  top: 2px; right: 3px;
  font-size: 0.65rem;
  color: #22c55e;
  text-shadow: 0 0 4px #000;
  line-height: 1;
}
</style>
