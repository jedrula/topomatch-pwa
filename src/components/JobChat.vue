<template>
  <div class="jc">
    <button class="jc-toggle" :class="{ 'jc-has-open': openCount, 'jc-needs-you': needsYou }" @click="open = !open">
      💬 {{ messages.length || '' }}
      <span v-if="needsYou" class="jc-chip jc-chip-you">needs you</span>
      <span v-else-if="openCount" class="jc-chip">{{ openCount }} open</span>
    </button>
    <div v-if="open" class="jc-body">
      <div v-for="m in messages" :key="m.id" class="jc-msg" :class="`jc-${m.author} jc-kind-${m.kind || 'message'}`">
        <div class="jc-meta">
          <span class="jc-who">{{ m.author === 'claude' ? (m.kind === 'suggestion' ? 'Claude · suggestion' : 'Claude') : 'You' }}</span>
          <span class="jc-time">{{ fmt(m.createdAt) }}</span>
          <span v-if="m.status && m.status !== 'info'" class="jc-status" :class="`jc-st-${m.status}`">{{ m.status.replace('_', ' ') }}</span>
        </div>
        <div class="jc-text">{{ m.text }}</div>
        <div v-if="m.actions?.length" class="jc-actions">
          <button v-for="a in m.actions" :key="a.id" class="jc-action"
                  :class="{ 'jc-chosen': m.chosen === a.id, 'jc-not-chosen': m.chosen && m.chosen !== a.id }"
                  :disabled="!!m.chosen || sending" :title="a.detail || a.label" @click="choose(m, a)">
            {{ m.chosen === a.id ? '✓ ' : '▶ ' }}{{ a.label }}
          </button>
        </div>
      </div>
      <div v-if="pendingAck" class="jc-msg jc-system">
        <div class="jc-text">{{ pendingAck }}</div>
      </div>
      <div class="jc-input">
        <textarea v-model="draft" rows="2" :placeholder="placeholder"
                  @keydown.enter.exact.prevent="send" @keydown.esc="open = false"></textarea>
        <button class="jc-send" :disabled="!draft.trim() || sending" @click="send">Send</button>
      </div>
      <div v-if="error" class="jc-error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup>
// Async chat with the agent about one job (or '_general'). Admin-only: Firestore rules enforce it (jobChat).
// The agent reads open messages at each check-in, first checking them against what has happened since
// (stale / already resolved requests are closed with a reason), and replies here.
import { ref, computed } from 'vue';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';

const props = defineProps({
  jobId: { type: String, required: true },
  messages: { type: Array, default: () => [] },      // ascending by createdAt
  agent: { type: Object, default: null },            // jobChatMeta/agent: { nextCheckAt, lastCheckAt }
  startOpen: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Ask, challenge, or ask for a run… (Enter to send)' },
});
const open = ref(props.startOpen);
const draft = ref('');
const sending = ref(false);
const error = ref('');

const openCount = computed(() => props.messages.filter(m => m.author === 'admin' && m.status === 'open').length);
const needsYou = computed(() => props.messages.some(m => m.status === 'needs_you'));

const toDate = (t) => (t?.toDate ? t.toDate() : t ? new Date(t) : null);
const hhmm = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function fmt(t) {
  const d = toDate(t);
  if (!d) return 'sending…';
  const today = new Date().toDateString() === d.toDateString();
  return today ? hhmm(d) : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Immediate answer without the agent: when the newest message is yours and still open, say when it will be read.
const pendingAck = computed(() => {
  const last = props.messages[props.messages.length - 1];
  if (!last || last.author !== 'admin' || last.status !== 'open') return '';
  const next = toDate(props.agent?.nextCheckAt);
  const seen = toDate(props.agent?.lastCheckAt);
  if (!next) return 'Received. Claude has not published a check-in time — it will be read at the next session.';
  const mins = Math.round((next - Date.now()) / 60000);
  if (mins >= 0) return `Received. Claude checks in at ~${hhmm(next)} (in ${mins} min).`;
  return `Received. Claude's check-in was due at ${hhmm(next)}${seen ? ` (last seen ${hhmm(seen)})` : ''} — it may be busy or offline; it will be read at the next session.`;
});

// A suggestion's button: posts "▶ label" as an open request tied to the suggestion (the agent runs it at its next
// check-in, after checking it is not stale) and records the choice so the other options grey out.
async function choose(m, a) {
  sending.value = true; error.value = '';
  try {
    await addDoc(collection(db, 'jobChat'), {
      jobId: props.jobId, author: 'admin', text: `▶ ${a.label}`, kind: 'message', status: 'open',
      action: a.id, replyTo: m.id, createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'jobChat', m.id), { chosen: a.id });
  } catch (e) {
    error.value = `Not sent: ${e.code || e.message}`;
  } finally {
    sending.value = false;
  }
}

async function send() {
  const text = draft.value.trim();
  if (!text || sending.value) return;
  sending.value = true; error.value = '';
  try {
    await addDoc(collection(db, 'jobChat'), {
      jobId: props.jobId, author: 'admin', text, kind: 'message', status: 'open', createdAt: serverTimestamp(),
    });
    draft.value = '';
  } catch (e) {
    error.value = `Not sent: ${e.code || e.message}`;          // e.g. permission-denied = not an admin token
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
.jc { margin-top: 4px; }
.jc-toggle { font-size: 12px; color: #9ca3af; background: none; border: 1px solid #2a3547; border-radius: 6px; padding: 2px 8px; cursor: pointer; }
.jc-toggle:hover { border-color: #4b5563; color: #d1d5db; }
.jc-has-open { color: #93c5fd; border-color: #1e40af; }
.jc-needs-you { color: #fbbf24; border-color: #92400e; }
.jc-chip { margin-left: 4px; font-size: 11px; padding: 0 5px; border-radius: 8px; background: #1e3a8a; color: #bfdbfe; }
.jc-chip-you { background: #78350f; color: #fde68a; }
.jc-body { margin-top: 6px; border: 1px solid #2a3547; border-radius: 8px; padding: 8px; background: #0f1520; display: flex; flex-direction: column; gap: 6px; }
.jc-msg { padding: 6px 8px; border-radius: 6px; max-width: 92%; }
.jc-admin { align-self: flex-end; background: #1e3a5f; }
.jc-claude { align-self: flex-start; background: #1a2230; border: 1px solid #2a3547; }
.jc-kind-suggestion { border-color: #065f46; background: #0f241c; }
.jc-system { align-self: center; background: none; color: #6b7280; font-size: 12px; font-style: italic; max-width: 100%; text-align: center; }
.jc-meta { display: flex; gap: 6px; align-items: baseline; font-size: 11px; color: #6b7280; margin-bottom: 2px; }
.jc-who { color: #9ca3af; font-weight: 600; }
.jc-status { padding: 0 5px; border-radius: 8px; background: #1f2937; }
.jc-st-open { color: #93c5fd; }
.jc-st-answered, .jc-st-resolved { color: #6ee7b7; }
.jc-st-stale { color: #9ca3af; text-decoration: line-through; }
.jc-st-needs_you { color: #fde68a; background: #78350f; }
.jc-text { font-size: 13px; color: #e5e7eb; white-space: pre-wrap; overflow-wrap: anywhere; }
.jc-input { display: flex; gap: 6px; align-items: flex-end; }
.jc-input textarea { flex: 1; min-width: 0; resize: vertical; font-size: 13px; background: #111827; color: #e5e7eb; border: 1px solid #2a3547; border-radius: 6px; padding: 6px; }
.jc-input textarea:focus { outline: none; border-color: #60a5fa; }
.jc-send { font-size: 12px; background: #1d4ed8; color: white; border: none; border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.jc-send:disabled { opacity: 0.4; cursor: default; }
.jc-error { color: #fca5a5; font-size: 12px; }
.jc-actions { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
.jc-action { font-size: 12px; background: #064e3b; color: #d1fae5; border: 1px solid #047857; border-radius: 14px; padding: 4px 10px; cursor: pointer; }
.jc-action:hover:not(:disabled) { background: #065f46; }
.jc-action:disabled { cursor: default; }
.jc-chosen { background: #047857; border-color: #6ee7b7; }
.jc-not-chosen { opacity: 0.35; }
</style>
