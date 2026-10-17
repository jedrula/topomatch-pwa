<template>
<div class="judge" @keydown.stop @keyup.stop @keydown.esc="emit('close')">
    <div class="judge-inner">
      <button class="judge-close" @click="emit('close')">×</button>
      <div v-if="judging" class="judge-busy">Judging every photo…</div>
      <div v-else-if="judgeErr" class="judge-err">{{ judgeErr }}</div>
      <template v-else-if="judge">
        <div class="judge-card" :class="judge.summary.verdict">
          <div class="judge-light"></div>
          <div>
            <div class="judge-sentence">{{ judge.summary.sentence }}</div>
            <div class="judge-chips">
              <span class="jchip ok">{{ judge.summary.usable }} usable</span>
              <span v-for="(n, f) in judge.summary.flags" :key="f" class="jchip" :class="flagClass(f)">{{ n }} {{ FLAG_LABEL[f] }}</span>
              <span class="jchip muted">{{ judge.summary.registered }}/{{ judge.summary.frames }} placed by SfM</span>
              <span class="jchip muted">median {{ judge.summary.median_inliers_consecutive }} matches to next photo</span>
            </div>
          </div>
          <button class="judge-rerun" @click="runJudge">Re-run</button>
        </div>

        <h3>The chain, in capture order <small>— border = photo status · bar = matches to the next photo</small></h3>
        <div class="judge-strip">
          <template v-for="(fr, k) in judge.frames" :key="fr.name">
            <img :src="thumbUrl(fr.name)" :class="['jthumb', frameClass(fr), { sel: judgeSel === fr }]"
                 :title="fr.name" loading="lazy" @click="judgeSel = fr" />
            <div v-if="k + 1 < judge.frames.length" class="jlink" :class="linkClass(fr.inliers_next)"
                 :title="`${fr.inliers_next ?? 0} matches to the next photo`"></div>
          </template>
        </div>

        <div class="judge-row">
          <div class="judge-map">
            <h3>Where the photos were taken <small>— top-down</small></h3>
            <svg :viewBox="mapBox" class="jsvg">
              <g v-for="fr in judge.frames.filter(f => f.map)" :key="fr.name" @click="judgeSel = fr" style="cursor:pointer">
                <line :x1="fr.map[0]" :y1="-fr.map[1]" :x2="fr.map[0] + fr.heading[0] * mapScale * 0.06"
                      :y2="-fr.map[1] - fr.heading[1] * mapScale * 0.06" :class="['jhead', frameClass(fr)]" />
                <circle :cx="fr.map[0]" :cy="-fr.map[1]" :r="mapScale * (judgeSel === fr ? 0.02 : 0.012)" :class="['jdot', frameClass(fr)]" />
              </g>
            </svg>
            <div class="jlegend"><span class="jdotk ok"></span>fine <span class="jdotk warn"></span>doubtful <span class="jdotk bad"></span>problem
              <span v-if="judge.frames.some(f => !f.registered)"> · {{ judge.frames.filter(f => !f.registered).length }} unplaced photos have no position</span></div>
          </div>
          <div class="judge-detail">
            <h3>{{ judgeSel ? judgeSel.name : 'Click a photo' }}</h3>
            <template v-if="judgeSel">
              <img :src="thumbUrl(judgeSel.name)" class="jbig" />
              <ul v-if="judgeSel.reasons.length" class="jreasons"><li v-for="r in judgeSel.reasons" :key="r">{{ r }}</li></ul>
              <div v-else class="jfine">No problems with this photo.</div>
              <table class="jtab">
                <tr><td>features</td><td>{{ judgeSel.keypoints }} ({{ Math.round(judgeSel.grid_cover * 100) }}% of the frame)</td></tr>
                <tr><td>matches prev / next</td><td>{{ judgeSel.inliers_prev ?? '–' }} / {{ judgeSel.inliers_next ?? '–' }}</td></tr>
                <tr><td>strong links</td><td>{{ judgeSel.strong_links }}</td></tr>
                <tr><td>placed by SfM</td><td>{{ judgeSel.registered ? `yes, ${judgeSel.reproj_px} px error` : 'no' }}</td></tr>
                <tr><td>parallax</td><td>{{ judgeSel.parallax_deg }}°</td></tr>
                <tr v-if="judgeSel.duplicate_of"><td>duplicate of</td><td>{{ judgeSel.duplicate_of }}</td></tr>
              </table>
            </template>
          </div>
        </div>

        <h3 v-if="judge.frames.some(f => f.flags.length)">Problem photos</h3>
        <div class="judge-grid">
          <div v-for="fr in judge.frames.filter(f => f.flags.length)" :key="fr.name" class="jcard" :class="frameClass(fr)" @click="judgeSel = fr">
            <img :src="thumbUrl(fr.name)" loading="lazy" />
            <div class="jcard-flags"><span v-for="f in fr.flags" :key="f" class="jchip" :class="flagClass(f)">{{ FLAG_LABEL[f] }}</span></div>
            <div class="jcard-why">{{ fr.reasons[0] }}</div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
// Post-SfM capture judge, as a visual report (Andrzej 2026-09-30: "the user that triggered the judge should
// be given a highly visual answer"). Opened from /history (⚖ Judge) and from walk2's menu. Data: POST/GET
// /api/v1/video-to-splat/:id/judge (topowall-splat capture_judge.py).
import { ref, computed, onMounted } from 'vue';
import { getGateway } from '../config/gateway.js';

const props = defineProps({ jobId: { type: String, required: true } });
const emit = defineEmits(['close']);

const judging = ref(false);
const judgeErr = ref('');
const judge = ref(null);
const judgeSel = ref(null);
const gwBase = ref('');
const FLAG_LABEL = { UNREGISTERED: 'not placed', BLANK: 'no texture', WEAK_LINK: 'weak link', DUPLICATE: 'duplicate', LOW_PARALLAX: 'low parallax' };
const BAD = new Set(['UNREGISTERED', 'WEAK_LINK']);
const flagClass = (f) => (BAD.has(f) ? 'bad' : 'warn');
const frameClass = (fr) => (fr.flags.some((f) => BAD.has(f)) ? 'bad' : fr.flags.length ? 'warn' : 'ok');
const linkClass = (n) => (n == null ? '' : n >= 300 ? 'ok' : n >= 150 ? 'warn' : 'bad');
const thumbUrl = (name) => `${gwBase.value}/topowall/api/v1/video-to-splat/${props.jobId}/images/${encodeURIComponent(name)}?thumb=1`;
const mapExt = () => {
  const pts = (judge.value?.frames || []).filter((f) => f.map).map((f) => f.map);
  if (!pts.length) return [-1, -1, 2, 2];
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => -p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 0.1;
  return [x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad];
};
const mapBox = computed(() => mapExt().join(' '));
const mapScale = computed(() => Math.max(mapExt()[2], mapExt()[3]));

async function runJudge() {
  judging.value = true; judgeErr.value = '';
  try {
    const res = await fetch(`${gwBase.value}/topowall/api/v1/video-to-splat/${props.jobId}/judge`, { method: 'POST' });
    const body = await res.json();
    if (!res.ok) throw new Error(body.detail || `HTTP ${res.status}`);
    judge.value = body; judgeSel.value = body.frames.find((f) => f.flags.length) || null;
  } catch (err) { judgeErr.value = 'Judge failed: ' + err.message; } finally { judging.value = false; }
}

async function load() {
  gwBase.value = await getGateway();
  const res = await fetch(`${gwBase.value}/topowall/api/v1/video-to-splat/${props.jobId}/judge`);
  if (res.ok) { judge.value = await res.json(); judgeSel.value = judge.value.frames.find((f) => f.flags.length) || null; }
  else await runJudge();
}
onMounted(load);
</script>

<style scoped>
/* capture judge report */
.judge { position: fixed; inset: 0; z-index: 80; background: rgba(8, 10, 14, 0.94); overflow-y: auto; color: #e5e7eb;
  font: 13px system-ui, -apple-system, sans-serif; }
.judge-inner { max-width: 1180px; margin: 0 auto; padding: 22px 26px 40px; position: relative; }
.judge-close { position: absolute; top: 14px; right: 16px; background: #1f2937; color: #e5e7eb; border: 1px solid #374151;
  border-radius: 6px; width: 32px; height: 30px; font-size: 18px; cursor: pointer; }
.judge-busy, .judge-err { padding: 60px; text-align: center; font-size: 16px; color: #9ca3af; }
.judge-err { color: #fca5a5; }
.judge-card { display: flex; align-items: center; gap: 18px; padding: 16px 18px; border-radius: 12px; background: #111827;
  border: 1px solid #374151; margin-right: 44px; }
.judge-light { width: 54px; height: 54px; border-radius: 50%; flex: none; box-shadow: 0 0 24px currentColor; }
.judge-card.green .judge-light { background: #22c55e; color: #22c55e; }
.judge-card.amber .judge-light { background: #f59e0b; color: #f59e0b; }
.judge-card.red .judge-light { background: #ef4444; color: #ef4444; }
.judge-sentence { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.judge-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.jchip { padding: 2px 9px; border-radius: 999px; font-size: 12px; background: #1f2937; border: 1px solid #374151; }
.jchip.ok { background: #14532d; border-color: #22c55e; }
.jchip.warn { background: #422006; border-color: #f59e0b; }
.jchip.bad { background: #450a0a; border-color: #ef4444; }
.jchip.muted { color: #9ca3af; }
.judge-rerun { margin-left: auto; background: #1e3a66; color: #fff; border: 1px solid #6ea8ff; border-radius: 6px; padding: 6px 12px; cursor: pointer; }
.judge h3 { margin: 22px 0 8px; font-size: 14px; }
.judge h3 small { color: #8a93a3; font-weight: 400; }
.judge-strip { display: flex; align-items: center; overflow-x: auto; padding: 6px 2px 12px; }
.jthumb { height: 58px; border-radius: 4px; border: 3px solid #22c55e; cursor: pointer; flex: none; }
.jthumb.warn { border-color: #f59e0b; } .jthumb.bad { border-color: #ef4444; } .jthumb.sel { outline: 2px solid #fff; }
.jlink { width: 10px; height: 6px; flex: none; background: #374151; }
.jlink.ok { background: #22c55e; } .jlink.warn { background: #f59e0b; } .jlink.bad { background: #ef4444; height: 3px; }
.judge-row { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
.jsvg { width: 100%; height: 360px; background: #0b1220; border: 1px solid #1f2937; border-radius: 8px; }
.jdot.ok { fill: #22c55e; } .jdot.warn { fill: #f59e0b; } .jdot.bad { fill: #ef4444; }
.jhead { stroke-width: 0.02; vector-effect: non-scaling-stroke; stroke: #6b7280; }
.jhead.ok { stroke: #22c55e; } .jhead.warn { stroke: #f59e0b; } .jhead.bad { stroke: #ef4444; }
.jlegend { color: #8a93a3; font-size: 12px; margin-top: 6px; }
.jdotk { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin: 0 4px 0 10px; }
.jdotk.ok { background: #22c55e; } .jdotk.warn { background: #f59e0b; } .jdotk.bad { background: #ef4444; }
.judge-detail .jbig { width: 100%; border-radius: 6px; }
.jreasons { color: #fca5a5; padding-left: 18px; } .jfine { color: #86efac; margin: 8px 0; }
.jtab { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 6px; }
.jtab td { padding: 3px 4px; border-bottom: 1px solid #1f2937; } .jtab td:first-child { color: #8a93a3; width: 42%; }
.judge-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
.jcard { background: #111827; border: 2px solid #374151; border-radius: 8px; overflow: hidden; cursor: pointer; }
.jcard.bad { border-color: #ef4444; } .jcard.warn { border-color: #f59e0b; }
.jcard img { width: 100%; display: block; }
.jcard-flags { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 6px 0; }
.jcard-why { padding: 4px 8px 8px; color: #cbd5e1; font-size: 11.5px; }
</style>
