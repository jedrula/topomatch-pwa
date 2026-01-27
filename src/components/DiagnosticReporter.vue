<template>
  <div v-if="show" class="diagnostic-reporter">
    <div class="overlay" @click="close"></div>
    <div class="dialog">
      <h3>Report Problem</h3>
      <p class="subtitle">Help us fix this issue</p>
      
      <textarea 
        v-model="userComment"
        placeholder="What were you trying to do? (optional)"
        rows="3"
      ></textarea>
      
      <div class="info">
        <small>Will send: device info, recent logs, upload details</small>
      </div>
      
      <div class="actions">
        <button @click="close" class="btn-secondary">Cancel</button>
        <button @click="send" :disabled="sending" class="btn-primary">
          {{ sending ? 'Sending...' : 'Send Report' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { diagnostics } from '../services/diagnostics.js';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../services/firebase.js';

const props = defineProps({
  show: Boolean,
  context: Object
});

const emit = defineEmits(['close', 'sent']);

const userComment = ref('');
const sending = ref(false);

const close = () => emit('close');

const send = async () => {
  sending.value = true;
  
  try {
    const report = await diagnostics.createReport({
      ...props.context,
      userComment: userComment.value || null
    });
    
    // Save to Firestore
    await addDoc(collection(db, 'diagnosticReports'), report);
    
    emit('sent');
    close();
  } catch (error) {
    console.error('Failed to send report:', error);
    alert('Failed to send report. Please try again.');
  } finally {
    sending.value = false;
  }
};
</script>

<style scoped>
.diagnostic-reporter {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.dialog {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 90%;
  width: 400px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
}

.subtitle {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
}

.info {
  margin-bottom: 16px;
}

.info small {
  color: #666;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

button {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-primary {
  background: #007aff;
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
