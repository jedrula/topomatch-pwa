<!--
  The thumbnail wall for a pod's frames.

  Extracted so it exists ONCE: the history card shows it inline for a quick
  look, and the dedicated frames page shows it as a tab. It was inline-only
  markup in SplatHistoryView until the frames page needed the same thing.

  Cells are ~100 px but the frames behind them are up to 12 MP, so a 785-frame
  pod would pull gigabytes to draw the grid -- hence the server's 320 px
  per-frame thumbnail, with the full image left to whatever opens on click.
-->
<template>
  <div>
    <div v-if="hasMasks" class="fg-mask-row">
      <label class="fg-mask-label">
        <input type="checkbox" :checked="maskOn" @change="$emit('toggle-mask')" />
        Apply mask
      </label>
    </div>
    <div v-if="frames.length" class="fg-grid">
      <div
        v-for="fn in frames"
        :key="fn"
        class="fg-cell"
        :class="{ sel: fn === selected }"
        @click="$emit('pick', fn)"
      >
        <img :src="thumbUrl(fn)" class="fg-thumb" :alt="fn" loading="lazy" decoding="async" />
        <img v-if="maskOn" :src="maskUrl(fn)" class="fg-mask" :alt="'mask-' + fn" loading="lazy" />
      </div>
    </div>
    <p v-else class="fg-empty">No images available.</p>
  </div>
</template>

<script setup>
defineProps({
  frames: { type: Array, default: () => [] },
  thumbUrl: { type: Function, required: true },
  maskUrl: { type: Function, default: () => '' },
  hasMasks: { type: Boolean, default: false },
  maskOn: { type: Boolean, default: false },
  selected: { type: String, default: '' },
});
defineEmits(['pick', 'toggle-mask']);
</script>

<style scoped>
.fg-mask-row { margin-bottom: 6px; }
.fg-mask-label { font-size: 12px; color: #9aa3b5; display: flex; align-items: center; gap: 6px; }
.fg-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 4px; }
.fg-cell { position: relative; aspect-ratio: 4/3; cursor: pointer; border-radius: 4px;
  overflow: hidden; outline: 2px solid transparent; }
.fg-cell.sel { outline-color: #6ea8ff; }
.fg-thumb, .fg-mask { width: 100%; height: 100%; object-fit: cover; display: block; }
.fg-mask { position: absolute; inset: 0; opacity: .55; mix-blend-mode: screen; }
.fg-empty { font-size: 12px; color: #7b8496; padding: 8px 0; }
</style>
