<template>
  <div class="video-strip">
    <div class="strip-header">
      <span class="strip-name">{{ strip.name }}</span>
      <button class="remove-btn" @click="$emit('remove')" title="Remove video">✕</button>
    </div>

    <!-- Frame thumbnails + trimmer overlay -->
    <div class="strip-frames" ref="framesEl">
      <img v-for="(src, fi) in strip.frames" :key="fi" :src="src" class="frame-thumb" />
      <div v-if="!strip.frames.length" v-for="j in 10" :key="'ph'+j" class="frame-placeholder" />

      <div class="trimmer-overlay">
        <div class="trim-dark" :style="{ left: 0, width: startPct + '%' }" />
        <div class="trim-dark" :style="{ right: 0, width: (100 - endPct) + '%' }" />
        <div class="trim-bracket" :style="{ left: startPct + '%', width: (endPct - startPct) + '%' }" />
        <div class="trim-handle trim-handle-left"  :style="{ left: startPct + '%' }" @mousedown.prevent="startDrag('start')" />
        <div class="trim-handle trim-handle-right" :style="{ left: endPct   + '%' }" @mousedown.prevent="startDrag('end')" />
      </div>
    </div>

    <!-- Trim times -->
    <div class="trim-times">
      <span class="time-field">start <span class="time-val">{{ formatTime(strip.startTime) }}</span></span>
      <span class="time-field">end <span class="time-val">{{ formatTime(strip.endTime ?? strip.videoDuration) }}</span></span>
      <span class="time-field total">duration <span class="time-val">{{ formatTime((strip.endTime ?? strip.videoDuration) - strip.startTime) }}</span></span>
    </div>

    <!-- Scoring progress -->
    <div v-if="strip.scoring" class="extraction-progress">
      <div class="prog-row">
        <span class="prog-label">Extracting &amp; scoring frames</span>
        <span class="prog-method">MediaBunny</span>
        <span class="prog-count">{{ strip.scoredFrames.length }}/{{ strip.keyframeCount || '?' }}</span>
      </div>
      <div class="prog-track"><div class="prog-fill" :style="{ width: progressPct + '%' }" /></div>
    </div>

    <!-- Bar chart + frame preview (once scoring has begun) -->
    <template v-if="strip.scoredFrames.length">
      <div class="analysis-header">
        <span class="analysis-title">Frame Analysis</span>
        <span class="analysis-sub">
          {{ strip.scoredFrames.length }}{{ strip.keyframeCount ? ` / ${strip.keyframeCount}` : '' }} frames
          · {{ selectedSet.size }} selected
        </span>
      </div>

      <div class="barchart-wrap" @click="onChartClick">
        <svg
          class="barchart-svg"
          :viewBox="`0 0 ${strip.scoredFrames.length} 100`"
          preserveAspectRatio="none"
        >
          <rect
            v-for="(frame, idx) in strip.scoredFrames"
            :key="idx"
            :x="idx"
            :y="100 - scorePercent(frame.score)"
            width="0.85"
            :height="Math.max(scorePercent(frame.score), 1)"
            :fill="previewFrame?.index === idx ? '#f59e0b' : selectedSet.has(idx) ? '#3b82f6' : '#374151'"
          />
        </svg>
      </div>

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
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { batchedSelectMain, formatTime } from '../utils/frameScoringUtils.js';

const props = defineProps({
  strip:       { type: Object, required: true },
  batchSize:   { type: Number, required: true },
  batchBuffer: { type: Number, required: true },
});

const emit = defineEmits(['remove', 'trim']);

const framesEl    = ref(null);
const previewFrame = ref(null);

const startPct = computed(() =>
  props.strip.videoDuration > 0 ? (props.strip.startTime / props.strip.videoDuration) * 100 : 0
);
const endPct = computed(() => {
  const end = props.strip.endTime ?? props.strip.videoDuration;
  return props.strip.videoDuration > 0 ? (end / props.strip.videoDuration) * 100 : 100;
});

const maxScore = computed(() => {
  const scores = props.strip.scoredFrames.map(f => f.score);
  return scores.length ? Math.max(...scores) : 1;
});
function scorePercent(score) {
  return Math.round(((score ?? 0) / Math.max(maxScore.value, 1)) * 100);
}
function normalizedScore(score) {
  return Math.round(((score ?? 0) / Math.max(maxScore.value, 0.001)) * 100);
}

const selectedSet = computed(() =>
  new Set(batchedSelectMain(props.strip.scoredFrames, props.batchSize, props.batchBuffer).map(f => f.index))
);

const progressPct = computed(() => {
  if (!props.strip.keyframeCount) return 0;
  return Math.min(100, Math.round((props.strip.scoredFrames.length / props.strip.keyframeCount) * 100));
});

function onChartClick(e) {
  const frames = props.strip.scoredFrames;
  if (!frames.length) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const idx = Math.max(0, Math.min(
    Math.floor(((e.clientX - rect.left) / rect.width) * frames.length),
    frames.length - 1
  ));
  const frame = frames[idx];
  if (!frame) return;
  previewFrame.value = previewFrame.value?.index === idx ? null : { ...frame, index: idx };
}

function startDrag(handle) {
  const el = framesEl.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();

  const onMove = (e) => {
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    emit('trim', { handle, time: fraction * props.strip.videoDuration });
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
</script>

<style scoped>
.video-strip {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e293b;
}
.video-strip:last-of-type { border-bottom: none; padding-bottom: 0; }

.strip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}
.strip-name { font-size: 0.8rem; color: #9ca3af; }
.remove-btn {
  background: none; border: none; color: #4b5563; cursor: pointer;
  font-size: 0.85rem; padding: 2px 6px; border-radius: 4px;
  transition: color 0.15s, background 0.15s;
}
.remove-btn:hover { color: #f87171; background: rgba(248,113,113,0.1); }

/* Frame strip */
.strip-frames {
  display: flex; width: 100%; height: 120px;
  position: relative; border-radius: 6px; overflow: hidden;
}
.frame-thumb  { flex: 1; min-width: 0; height: 100%; object-fit: cover; display: block; }
.frame-placeholder { flex: 1; min-width: 0; height: 100%; background: #1f2937; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

/* Trimmer */
.trimmer-overlay { position: absolute; inset: 0; pointer-events: none; }
.trim-dark   { position: absolute; top: 0; bottom: 0; background: rgba(0,0,0,0.6); }
.trim-bracket {
  position: absolute; top: 0; bottom: 0;
  border: 2px solid rgba(255,255,255,0.5); box-sizing: border-box; pointer-events: none;
}
.trim-handle {
  position: absolute; top: 0; bottom: 0; width: 10px;
  transform: translateX(-50%); background: #fff; border-radius: 3px;
  cursor: ew-resize; pointer-events: all; opacity: 0.85; transition: opacity 0.1s;
}
.trim-handle:hover { opacity: 1; }

/* Trim times */
.trim-times { display: flex; gap: 16px; justify-content: flex-end; }
.time-field { font-size: 0.75rem; color: #6b7280; }
.time-val { color: #d1d5db; font-variant-numeric: tabular-nums; margin-left: 4px; }
.time-field.total .time-val { color: #60a5fa; }

/* Scoring progress */
.extraction-progress { width: 100%; display: flex; flex-direction: column; gap: 5px; }
.prog-row { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; }
.prog-label { flex: 1; color: #d1d5db; }
.prog-method { font-size: 0.68rem; padding: 2px 7px; background: #1e3a8a; color: #93c5fd; border-radius: 999px; white-space: nowrap; }
.prog-count { font-size: 0.75rem; color: #6b7280; font-variant-numeric: tabular-nums; white-space: nowrap; }
.prog-track { height: 5px; background: #1e293b; border-radius: 3px; overflow: hidden; }
.prog-fill { height: 100%; background: #e2e8f0; border-radius: 3px; transition: width 0.2s ease; }

/* Analysis */
.analysis-header { display: flex; align-items: baseline; gap: 8px; margin-top: 4px; }
.analysis-title { font-size: 0.88rem; font-weight: 600; color: #d1d5db; }
.analysis-sub { font-size: 0.72rem; color: #6b7280; }

/* Bar chart */
.barchart-wrap { width: 100%; height: 110px; border-radius: 6px; overflow: hidden; background: #0f172a; cursor: pointer; }
.barchart-svg { width: 100%; height: 100%; display: block; }

/* Frame preview */
.frame-preview {
  display: flex; align-items: center; gap: 12px; padding: 8px 10px;
  background: #1e293b; border-radius: 6px; border: 1px solid #334155; position: relative;
}
.preview-thumb { width: 96px; height: 96px; object-fit: cover; border-radius: 4px; flex-shrink: 0; }
.preview-info { display: flex; flex-direction: column; gap: 4px; }
.preview-time  { font-size: 0.82rem; color: #94a3b8; font-variant-numeric: tabular-nums; }
.preview-score { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; }
.preview-badge { font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; width: fit-content; }
.preview-sel   { background: #1e3a8a; color: #93c5fd; }
.preview-rej   { background: #292524; color: #a8a29e; }
.preview-close {
  position: absolute; top: 6px; right: 8px;
  background: none; border: none; color: #6b7280; cursor: pointer; font-size: 0.8rem; padding: 2px 4px;
}
.preview-close:hover { color: #e5e7eb; }
</style>
