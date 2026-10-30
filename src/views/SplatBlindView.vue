<template>
  <div class="blv">
    <header class="blv-head">
      <RouterLink :to="{ name: 'splat-history' }" class="back">← history</RouterLink>
      <h1>Blind A/B</h1>
      <p class="lede">
        Two versions of the same scan, as short clips from the same path. Which one would you rather show a customer?
        Sides are shuffled every time; which is which stays hidden until you reveal the tally.
      </p>
    </header>

    <section v-if="!started" class="start">
      <label class="name">Your name <input id="blv-voter" v-model="voter" placeholder="optional" maxlength="60" /></label>
      <p class="hint">{{ views.length }} viewpoints, each shown more than once in random order. About 10 s a vote.</p>
      <button class="go" :disabled="!views.length" @click="begin">Start</button>
    </section>

    <section v-else class="trial">
      <p class="progress">Vote {{ count + 1 }} · viewpoint {{ trial?.view }}</p>
      <p v-if="error" class="msg err">{{ error }}</p>
      <p v-else-if="loading" class="msg">Rendering this viewpoint (first time only, ~20 s)…</p>
      <div v-else-if="trial" class="pair">
        <figure>
          <video :key="trial.leftUrl" :src="trial.leftUrl" autoplay loop muted playsinline></video>
          <figcaption>Left</figcaption>
        </figure>
        <figure>
          <video :key="trial.rightUrl" :src="trial.rightUrl" autoplay loop muted playsinline></video>
          <figcaption>Right</figcaption>
        </figure>
      </div>
      <div class="buttons">
        <button :disabled="!ready" @click="vote('left')">Left looks better <kbd>←</kbd></button>
        <button :disabled="!ready" class="same" @click="vote('same')">Can't tell <kbd>↓</kbd></button>
        <button :disabled="!ready" @click="vote('right')">Right looks better <kbd>→</kbd></button>
      </div>
    </section>

    <section class="tally">
      <button class="reveal" @click="loadTally">{{ tally ? 'Refresh tally' : 'Reveal the tally' }}</button>
      <div v-if="tally">
        <p class="verdict">{{ tally.verdict }}</p>
        <p>{{ tally.votes }} votes: {{ jobId }} {{ tally.wins[jobId] }} · {{ otherId }} {{ tally.wins[otherId] }} · can't tell {{ tally.same }}.
          <span v-if="tally.share != null">{{ jobId }} preferred in {{ Math.round(tally.share * 100) }}% of decided votes
            (95% interval {{ Math.round(tally.ci95[0] * 100) }}–{{ Math.round(tally.ci95[1] * 100) }}%).</span></p>
        <p class="hint">"No difference" needs the interval inside 40–60%; "better" needs it clear of 50%. About 30 decided
          votes find a 3-in-4 preference, about 85 a 65% one.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
/*
 * Blind A/B between two splat jobs of the same scan (2026-10-27, "I care what my customers will say"): human 2AFC
 * on short clips (the server's blind-clip: stepped back from a photo, sweeping sideways), sides randomised per trial,
 * votes stored on the box (blind-vote), tally with a 95% interval (blind-tally).
 * Route: /splat/:jobId/blind/:otherId?frames=0037,0064,0089&from=0.15,15
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { getGateway } from '../config/gateway.js';

const route = useRoute();
const jobId = route.params.jobId;
const otherId = route.params.otherId;
const offset = String(route.query.from || '0.15,15');
const views = String(route.query.frames || '').split(',').filter(v => /^\d{4}$/.test(v));
const gw = ref('');
const voter = ref('');
try { voter.value = localStorage.getItem('blindVoter') || ''; } catch { /* storage blocked: no default name */ }
const started = ref(false);
const loading = ref(false);
const error = ref('');
const trial = ref(null);
const count = ref(0);
const tally = ref(null);
const ready = computed(() => !!trial.value && !loading.value && !error.value);
let queue = [];
const cache = new Map();

// Every viewpoint three times, shuffled, so no viewpoint dominates and repeats show consistency.
function shuffled() {
  const q = [...views, ...views, ...views];
  for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
  return q;
}

async function clips(view) {
  if (cache.has(view)) return cache.get(view);
  const p = fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/blind-clip`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ other: otherId, view, offset }),
  }).then(async (r) => {
    const b = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(b.detail || `Render failed (${r.status})`);
    return b.clips;
  });
  cache.set(view, p);
  p.catch(() => cache.delete(view));
  return p;
}

async function next() {
  error.value = '';
  if (!queue.length) queue = shuffled();
  const view = queue.shift();
  loading.value = !cache.has(view);
  try {
    const c = await clips(view);
    const swap = Math.random() < 0.5;
    const left = swap ? otherId : jobId;
    const right = swap ? jobId : otherId;
    trial.value = { view, left, leftUrl: gw.value + '/topowall' + c[left], rightUrl: gw.value + '/topowall' + c[right] };
    if (queue.length) clips(queue[0]).catch(() => {});      // render the next one meanwhile
  } catch (e) {
    error.value = String(e.message || e);
  } finally {
    loading.value = false;
  }
}

async function vote(choice) {
  if (!ready.value) return;
  const t = trial.value;
  trial.value = null;
  try { localStorage.setItem('blindVoter', voter.value); } catch { /* fine without it */ }
  const r = await fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/blind-vote`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ other: otherId, view: t.view, offset, left: t.left, choice, voter: voter.value }),
  });
  if (!r.ok) { error.value = `Vote not saved (${r.status}) - try again`; trial.value = t; return; }
  count.value += 1;
  if (tally.value) loadTally();
  next();
}

async function loadTally() {
  const r = await fetch(`${gw.value}/topowall/api/v1/video-to-splat/${jobId}/blind-tally?other=${otherId}`);
  tally.value = r.ok ? await r.json() : null;
}

function begin() { started.value = true; next(); }
function onKey(e) {
  if (!started.value) return;
  if (e.key === 'ArrowLeft') vote('left');
  else if (e.key === 'ArrowRight') vote('right');
  else if (e.key === 'ArrowDown') vote('same');
}
onMounted(async () => { gw.value = await getGateway(); window.addEventListener('keydown', onKey); });
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.blv { max-width: 1280px; margin: 0 auto; padding: 20px 16px 60px; color: #e9eeeb; display: flex; flex-direction: column; gap: 18px; }
.back { color: #6FC8B0; text-decoration: none; font-size: .8rem; }
.blv-head h1 { margin: 6px 0 4px; font-size: 1.4rem; }
.lede, .hint { color: #9fb0aa; font-size: .85rem; max-width: 70ch; margin: 0; }
.start { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
.name input { margin-left: 8px; background: #151d1b; border: 1px solid #2b3a36; color: #e9eeeb; padding: 6px 8px; border-radius: 4px; }
.go, .buttons button, .reveal { background: #1f2c29; border: 1px solid #2b3a36; color: #e9eeeb; border-radius: 6px; padding: 10px 16px; font-size: .95rem; cursor: pointer; }
.go { background: #2a5b4f; border-color: #6FC8B0; }
button:disabled { opacity: .4; cursor: default; }
.progress { color: #9fb0aa; font-size: .8rem; margin: 0; font-variant-numeric: tabular-nums; }
.pair { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap: 10px; }
.pair figure { margin: 0; display: flex; flex-direction: column; gap: 4px; }
.pair video { width: 100%; height: auto; max-height: 70vh; object-fit: contain; background: #000; border: 1px solid #2b3a36; border-radius: 4px; }
.pair figcaption { text-align: center; color: #9fb0aa; font-size: .8rem; }
.buttons { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
.buttons .same { background: #151d1b; }
kbd { font-size: .7rem; color: #9fb0aa; margin-left: 6px; }
.msg { color: #9fb0aa; margin: 0; }
.err { color: #e98a8a; }
.tally { border-top: 1px solid #2b3a36; padding-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.verdict { font-size: 1.1rem; margin: 0; }
</style>
