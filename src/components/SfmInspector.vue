<!--
  What a reconstruction actually contains, in the app rather than in a separate tool.

  Replaces the point-cloud button. A PLY is a picture of the reconstruction; this is the
  reconstruction: how many cameras solved, how long the tracks are, and — the part that
  matters when something has gone wrong — the pairwise match graph.

  The match graph is where a fold is visible and a point cloud is not. A capture that welds
  two parts of the map together does it through pairs that carry plenty of verified inliers
  between cameras that cannot physically see the same thing, and that shows up here as a
  heavy tail of strong pairs, or as images with almost no verified partners at all.

  Parsing is cherry-picked from the colmap-treasure-chest repo (src/lib/colmap/README.md);
  the panels below are ours, because its React UI duplicated a 3D view we already had.
-->
<template>
  <div class="sfm">
    <div v-if="loading" class="sfm-msg">Loading reconstruction… {{ progress }}</div>
    <div v-else-if="error && !stats" class="sfm-msg sfm-err">{{ error }}</div>

    <template v-if="stats">
      <div class="sfm-stats">
        <div class="st"><span class="k">images</span><span class="v">{{ stats.images }}</span></div>
        <div class="st"><span class="k">points</span><span class="v">{{ stats.points.toLocaleString() }}</span></div>
        <div class="st" :class="trackClass">
          <span class="k">mean track</span><span class="v">{{ stats.meanTrack.toFixed(2) }}</span>
          <span class="n">views per point</span>
        </div>
        <div class="st"><span class="k">obs / image</span><span class="v">{{ stats.obsPerImage.toFixed(0) }}</span></div>
        <div class="st" v-if="stats.meanReproj != null">
          <span class="k">reproj</span><span class="v">{{ stats.meanReproj.toFixed(3) }}</span><span class="n">px</span>
        </div>
      </div>
      <p class="sfm-hint">
        Track length is the master variable: it is how many cameras see each point. Measured on
        our own captures, 4.3 reconstructed into a fold and 8.1 did not.
      </p>
    </template>

    <div v-if="error && stats" class="sfm-msg sfm-warn">{{ error }}</div>

    <template v-if="covis">
      <h4 class="sfm-h">Match graph — {{ covis.pairs.toLocaleString() }} verified pairs</h4>
      <div class="sfm-stats">
        <div class="st"><span class="k">median inliers</span><span class="v">{{ covis.median }}</span></div>
        <div class="st"><span class="k">p10 / p90</span><span class="v">{{ covis.p10 }} / {{ covis.p90 }}</span></div>
        <div class="st" :class="covis.weak / covis.pairs > 0.5 ? 'bad' : ''">
          <span class="k">under 150</span><span class="v">{{ (100 * covis.weak / covis.pairs).toFixed(0) }}%</span>
          <span class="n">of pairs</span>
        </div>
      </div>

      <div v-if="covis.thin.length" class="sfm-thin">
        <h5>Images with fewest verified partners</h5>
        <p class="sfm-hint">
          Where a reconstruction comes apart. On one capture, frames with 6–8 partners against
          31–58 elsewhere were the stretch GLOMAP placed 13.6 m out of position.
        </p>
        <div class="thin-row" v-for="[id, n] in covis.thin.slice(0, 12)" :key="id">
          <span class="thin-name">{{ nameOf(id) }}</span>
          <span class="thin-bar"><i :style="{ width: Math.min(100, n * 4) + '%' }" /></span>
          <span class="thin-n">{{ n }}</span>
        </div>
      </div>
    </template>
    <p v-else-if="stats && !loading" class="sfm-hint">
      No database.db in this pod, so there is no match graph to show — poses and points only.
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useColmap } from '../lib/colmap/useColmap'

const props = defineProps({
  jobId: { type: String, required: true },
  apiBase: { type: String, required: true },
})

const { images, loading, progress, error, loadPod, stats, covisibility } = useColmap()
const covis = covisibility

onMounted(() => loadPod(props.apiBase, props.jobId))

function nameOf(id) {
  return images.value.get(id)?.name || `#${id}`
}

// 4.3 folded, 6.6 and 8.1 did not — so the thresholds are where the evidence puts them,
// not round numbers.
const trackClass = computed(() => {
  const t = stats.value?.meanTrack ?? 0
  return t >= 6 ? 'good' : t >= 5 ? 'ok' : 'bad'
})
</script>

<style scoped>
.sfm { padding: 10px 12px; }
.sfm-msg { font-size: 13px; color: #9aa4b2; padding: 8px 0; }
.sfm-err { color: #f87171; }
.sfm-warn { color: #fbbf24; }
.sfm-stats { display: flex; flex-wrap: wrap; gap: 8px; margin: 6px 0 4px; }
.st {
  display: flex; flex-direction: column; gap: 1px;
  border: 1px solid #22262c; border-radius: 4px; padding: 6px 10px; min-width: 92px;
  background: #12151a;
}
.st .k { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #6b7688; }
.st .v { font-size: 17px; font-variant-numeric: tabular-nums; color: #e8eaed; }
.st .n { font-size: 10px; color: #6b7688; }
.st.good .v { color: #4ade80; }
.st.ok   .v { color: #fbbf24; }
.st.bad  .v { color: #f87171; }
.sfm-h { font-size: 13px; margin: 14px 0 6px; color: #cbd5da; }
.sfm-hint { font-size: 11px; color: #6b7688; margin: 4px 0 8px; max-width: 62ch; line-height: 1.45; }
.sfm-thin h5 { font-size: 12px; margin: 12px 0 2px; color: #cbd5da; }
.thin-row { display: flex; align-items: center; gap: 8px; font-size: 11px; margin: 2px 0; }
.thin-name { flex: 0 0 auto; max-width: 46%; overflow: hidden; text-overflow: ellipsis;
             white-space: nowrap; color: #9aa4b2; font-family: ui-monospace, monospace; }
.thin-bar { flex: 1; height: 5px; background: #1b1f25; border-radius: 3px; overflow: hidden; }
.thin-bar i { display: block; height: 100%; background: #f87171; }
.thin-n { flex: 0 0 28px; text-align: right; font-variant-numeric: tabular-nums; color: #e8eaed; }
</style>
