<template>
  <div class="filter-bar">
    <input
      v-model="query"
      class="scene-search"
      type="search"
      placeholder="Search scene names…"
      spellcheck="false"
    />

    <button
      class="starred-chip"
      :class="{ on: starredOnly }"
      :title="starredOnly ? 'Showing starred only' : 'Show starred only'"
      @click="starredOnly = !starredOnly"
    >{{ starredOnly ? '★' : '☆' }} starred</button>

    <div class="filter-groups">
      <!-- Status chips -->
      <div class="filter-group">
        <span class="filter-label">Status</span>
        <div class="chip-row">
          <button
            v-for="s in STATUS_OPTIONS"
            :key="s.value"
            class="status-chip"
            :class="[`chip-${s.value}`, { active: activeStatuses.has(s.value) }]"
            @click="toggle('statuses', s.value)"
          >{{ s.label }}</button>
        </div>
      </div>

      <!-- Trainer chips (only when >1 distinct value present) -->
      <div v-if="trainerOptions.length > 1" class="filter-group">
        <span class="filter-label">Trainer</span>
        <div class="chip-row">
          <button
            v-for="t in trainerOptions"
            :key="t"
            class="plain-chip"
            :class="{ active: activeTrainers.has(t) }"
            @click="toggle('trainers', t)"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Max iters slider -->
      <div class="filter-group psnr-group">
        <label class="filter-label psnr-label">
          <input type="checkbox" class="psnr-check" v-model="itersEnabled" />
          Max iters
        </label>
        <div class="psnr-controls" :class="{ disabled: !itersEnabled }">
          <input
            type="range"
            :min="itersMin"
            :max="itersDataMax"
            :step="itersStep"
            v-model.number="itersValue"
            :disabled="!itersEnabled"
            class="psnr-slider"
          />
          <span class="psnr-value" style="color:#93c5fd">{{ formatIters(itersValue) }}</span>
        </div>
      </div>

      <!-- Source chips (only when >1 distinct value present) -->
      <div v-if="sourceOptions.length > 1" class="filter-group">
        <span class="filter-label">Source</span>
        <div class="chip-row">
          <button
            v-for="s in sourceOptions"
            :key="s"
            class="plain-chip"
            :class="{ active: activeSources.has(s) }"
            @click="toggle('sources', s)"
          >{{ s }}</button>
        </div>
      </div>

      <!-- PSNR slider -->
      <div class="filter-group psnr-group">
        <label class="filter-label psnr-label">
          <input type="checkbox" class="psnr-check" v-model="psnrEnabled" />
          Min PSNR
        </label>
        <div class="psnr-controls" :class="{ disabled: !psnrEnabled }">
          <input
            type="range"
            :min="PSNR_MIN"
            :max="PSNR_MAX"
            step="0.5"
            v-model.number="psnrValue"
            :disabled="!psnrEnabled"
            class="psnr-slider"
          />
          <span class="psnr-value" :class="psnrColorClass">{{ psnrValue.toFixed(1) }} dB</span>
        </div>
      </div>
    </div>

    <!-- Summary & actions -->
    <div class="filter-meta">
      <span v-if="isActive" class="match-count">{{ matchCount }} / {{ totalCount }} jobs</span>
      <button v-if="isActive" class="reset-btn" @click="reset">Clear filters</button>
      <span class="hint" title="Backend filtering may be added in the future for better performance with large datasets">
        client-side filters
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  jobs:       { type: Array,  default: () => [] },
  totalCount: { type: Number, default: 0 },
  matchCount: { type: Number, default: 0 },
});

const emit = defineEmits(['update:modelValue']);

const PSNR_MIN = 15;
const PSNR_MAX = 35;

const STATUS_OPTIONS = [
  { value: 'done',      label: 'Done' },
  { value: 'running',   label: 'Running' },
  { value: 'queued',    label: 'Queued' },
  { value: 'error',     label: 'Error' },
  { value: 'cancelled', label: 'Cancelled' },
];

const query          = ref('');
const activeStatuses = ref(new Set());
const activeTrainers = ref(new Set());
const activeSources  = ref(new Set());
const starredOnly    = ref(false);
const psnrEnabled    = ref(false);
const psnrValue      = ref(22);
const itersEnabled   = ref(false);
const itersValue     = ref(30000);

const trainerOptions = computed(() =>
  [...new Set(props.jobs.map(j => j.params?.trainer).filter(Boolean))].sort()
);

const sourceOptions = computed(() =>
  [...new Set(props.jobs.map(j => j.params?.source).filter(Boolean))].sort()
);

const itersDataMax = computed(() =>
  props.jobs.reduce((max, j) => Math.max(max, j.params?.iters ?? 0), 0) || 30000
);
const itersMin  = 0;
const itersStep = computed(() => itersDataMax.value <= 10000 ? 100 : 500);

// Keep slider default at data max so enabling it is a no-op until user drags
watch(itersDataMax, v => { if (!itersEnabled.value) itersValue.value = v; }, { immediate: true });

function formatIters(n) {
  if (n >= 1000) return (n % 1000 === 0 ? n / 1000 : (n / 1000).toFixed(1)) + 'k';
  return String(n);
}

const psnrColorClass = computed(() => {
  if (psnrValue.value >= 24) return 'psnr-good';
  if (psnrValue.value >= 21) return 'psnr-ok';
  return 'psnr-poor';
});

const isActive = computed(() =>
  query.value.trim().length > 0 ||
  activeStatuses.value.size > 0 ||
  activeTrainers.value.size > 0 ||
  activeSources.value.size  > 0 ||
  psnrEnabled.value ||
  itersEnabled.value
);

const setRefs = { statuses: activeStatuses, trainers: activeTrainers, sources: activeSources };
function toggle(key, val) {
  const ref = setRefs[key];
  const s = new Set(ref.value);
  s.has(val) ? s.delete(val) : s.add(val);
  ref.value = s;
}

function reset() {
  query.value          = '';
  activeStatuses.value = new Set();
  activeTrainers.value = new Set();
  activeSources.value  = new Set();
  psnrEnabled.value    = false;
  itersEnabled.value   = false;
  itersValue.value     = itersDataMax.value;
}

function buildFilters() {
  return {
    query:    query.value.trim() || null,
    statuses: activeStatuses.value.size > 0 ? new Set(activeStatuses.value) : null,
    trainers: activeTrainers.value.size > 0 ? new Set(activeTrainers.value) : null,
    sources:  activeSources.value.size  > 0 ? new Set(activeSources.value)  : null,
    minPsnr:  psnrEnabled.value  ? psnrValue.value  : null,
    maxIters: itersEnabled.value ? itersValue.value  : null,
    starredOnly: starredOnly.value,
  };
}

watch([query, activeStatuses, activeTrainers, activeSources, psnrEnabled, psnrValue, itersEnabled, itersValue, starredOnly], () => {
  emit('update:modelValue', buildFilters());
}, { deep: true });
</script>

<style scoped>
.filter-bar {
  max-width: 760px;
  margin: 0 auto 20px;
  background: #161b22;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scene-search {
  width: 100%;
  box-sizing: border-box;
  background: #0d1117;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 0.85rem;
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.15s;
}
.scene-search::placeholder { color: #4b5563; }
.scene-search:focus { border-color: #2563eb; }
.scene-search::-webkit-search-cancel-button { cursor: pointer; }

.filter-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: flex-start;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #4b5563;
  white-space: nowrap;
  flex-shrink: 0;
}

.chip-row {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

/* Status chips — each status has a semantic colour when active */
.status-chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.status-chip:hover:not(.active) { background: #222; color: #888; border-color: #444; }

.status-chip.chip-done.active      { background: #14532d; color: #6ee7b7; border-color: #15803d; }
.status-chip.chip-error.active     { background: #7f1d1d; color: #fca5a5; border-color: #b91c1c; }
.status-chip.chip-running.active   { background: #1e3a5f; color: #93c5fd; border-color: #1d4ed8; }
.status-chip.chip-queued.active    { background: #78350f; color: #fbbf24; border-color: #d97706; }
.status-chip.chip-cancelled.active { background: #1f2937; color: #9ca3af; border-color: #374151; }

/* Generic chips for trainer / source */
.plain-chip {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 500;
  font-family: monospace;
  border: 1px solid #333;
  background: #1a1a1a;
  color: #555;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.plain-chip:hover:not(.active) { background: #222; color: #888; border-color: #444; }
.plain-chip.active { background: #1e3050; color: #93c5fd; border-color: #2563eb; }

/* PSNR */
.psnr-group { gap: 10px; }

.psnr-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}

.psnr-check {
  accent-color: #2563eb;
  cursor: pointer;
  width: 13px;
  height: 13px;
}

.psnr-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  transition: opacity 0.15s;
}
.psnr-controls.disabled { opacity: 0.35; pointer-events: none; }

.psnr-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 130px;
  height: 4px;
  border-radius: 2px;
  background: #2a2a2a;
  outline: none;
  cursor: pointer;
}
.psnr-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid #1d4ed8;
  transition: background 0.15s;
}
.psnr-slider::-webkit-slider-thumb:hover { background: #3b82f6; }
.psnr-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2563eb;
  cursor: pointer;
  border: 2px solid #1d4ed8;
}

.psnr-value {
  font-size: 0.78rem;
  font-family: monospace;
  min-width: 52px;
  font-weight: 600;
}
.psnr-good { color: #4ade80; }
.psnr-ok   { color: #fbbf24; }
.psnr-poor { color: #f87171; }

/* Meta row */
.filter-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 6px;
  border-top: 1px solid #1f2937;
}

.match-count {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: monospace;
}

.reset-btn {
  padding: 3px 10px;
  font-size: 0.72rem;
  background: transparent;
  color: #6b7280;
  border: 1px solid #374151;
  border-radius: 5px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.reset-btn:hover { color: #9ca3af; border-color: #4b5563; }

.hint {
  font-size: 0.68rem;
  color: #374151;
  margin-left: auto;
  cursor: default;
  border-bottom: 1px dashed #374151;
}
</style>

<style scoped>
.starred-chip {
  background: #23232c; color: #cfcfe0; border: 1px solid #3a3a48;
  border-radius: 999px; padding: 3px 11px; cursor: pointer;
  font: 12px system-ui; margin-right: 8px;
}
.starred-chip:hover { border-color: #55556a; }
.starred-chip.on { background: #f0c14b; border-color: #f0c14b; color: #2a2410; font-weight: 600; }
</style>
