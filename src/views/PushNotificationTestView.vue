<template>
  <div class="push-test-view">
    <div class="header">
      <h1>🔔 Push Notification Integration Test</h1>
      <p class="user-info" v-if="userStore.user">
        Logged in as: <strong>{{ userStore.user.email || userStore.user.uid }}</strong>
      </p>
      <p class="error" v-else>❌ Not logged in</p>
    </div>

    <div class="info">
      <strong>Instructions:</strong><br>
      1. Make sure you're logged in (check above)<br>
      2. Click "Run All Tests" to diagnose the push notification setup<br>
      3. Check which step fails to identify the issue
    </div>

    <div class="actions">
      <button @click="runAllTests" :disabled="running">{{ running ? 'Running...' : 'Run All Tests' }}</button>
      <button @click="clearResults" :disabled="running">Clear Results</button>
    </div>

    <div class="test-results">
      <div v-for="test in testResults" :key="test.name" class="test-section">
        <div class="test-name">{{ test.name }}</div>
        <div class="test-status">
          <span :class="['status', test.status]">{{ test.status.toUpperCase() }}</span>
        </div>
        <div v-if="test.message" :class="['result', test.status]">
          {{ test.message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/userStore.js';
import { db, functions } from '../services/firebase.js';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';

const userStore = useUserStore();
const running = ref(false);
const testResults = ref([]);

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

const tests = [
  { name: 'Check User Authentication', fn: testAuth },
  { name: 'Check Service Worker Registration', fn: testServiceWorker },
  { name: 'Check Notification Permission', fn: testNotificationPermission },
  { name: 'Check FCM Token Generation', fn: testFCMToken },
  { name: 'Check Firestore Token Storage', fn: testFirestoreTokenStorage },
  { name: 'Check Function Callable', fn: testFunctionCallable },
];

async function runAllTests() {
  running.value = true;
  testResults.value = [];

  for (const test of tests) {
    const result = { name: test.name, status: 'running', message: '' };
    testResults.value.push(result);

    try {
      const message = await test.fn();
      result.status = 'success';
      result.message = message;
    } catch (error) {
      result.status = 'error';
      result.message = error.message;
    }
  }

  running.value = false;
}

function clearResults() {
  testResults.value = [];
}

// Test functions
async function testAuth() {
  if (!userStore.user) {
    throw new Error('Not logged in. Please log in to the app first.');
  }
  return `✓ Logged in as: ${userStore.user.email || userStore.user.uid}`;
}

async function testServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker not supported in this browser');
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const swReg = registrations.find(reg => 
    reg.active?.scriptURL.includes('firebase-messaging-sw.js')
  );

  if (!swReg) {
    throw new Error('firebase-messaging-sw.js not registered. Check if service worker file exists in public/');
  }

  return `✓ Service worker registered at: ${swReg.active.scriptURL}\n✓ State: ${swReg.active.state}`;
}

async function testNotificationPermission() {
  const permission = Notification.permission;
  
  if (permission === 'denied') {
    throw new Error('Notification permission DENIED. Reset in browser settings: Chrome > Settings > Privacy > Site Settings > Notifications > localhost');
  }

  if (permission === 'default') {
    throw new Error('Notification permission not requested yet. The app should request it on login.');
  }

  return `✓ Notification permission: ${permission}`;
}

async function testFCMToken() {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (!token) {
      throw new Error('Failed to get FCM token. Check browser console for errors.');
    }

    const prefix = token.split(':')[0];
    return `✓ FCM token generated successfully\n✓ Token prefix: ${prefix}\n✓ Full token: ${token.substring(0, 50)}...`;
  } catch (error) {
    throw new Error(`FCM token generation failed: ${error.message}\n\nPossible causes:\n- Service worker not properly initialized\n- VAPID key mismatch\n- Firebase config incorrect`);
  }
}

async function testFirestoreTokenStorage() {
  if (!userStore.user) {
    throw new Error('Cannot test Firestore without authentication');
  }

  const messaging = getMessaging();
  const token = await getToken(messaging, { vapidKey: VAPID_KEY });
  const userId = userStore.user.uid;

  // Try to save token
  const tokenRef = doc(db, 'users', userId, 'fcmTokens', token);
  await setDoc(tokenRef, {
    token,
    createdAt: new Date(),
    lastUsed: new Date(),
    testTimestamp: Date.now(),
  }, { merge: true });

  // Read back
  const tokensSnapshot = await getDocs(collection(db, 'users', userId, 'fcmTokens'));
  const tokens = tokensSnapshot.docs.map(d => ({
    id: d.id,
    prefix: d.id.split(':')[0],
    ...d.data()
  }));

  return `✓ Token saved to Firestore\n✓ Total tokens for user: ${tokens.length}\n✓ Token prefixes: ${tokens.map(t => t.prefix).join(', ')}`;
}

async function testFunctionCallable() {
  if (!userStore.user) {
    throw new Error('Cannot test function without authentication');
  }

  try {
    const notifyNewRoutesetting = httpsCallable(functions, 'notifyNewRoutesetting');
    const result = await notifyNewRoutesetting({
      locationId: 'test-location',
      locationName: 'Test Location',
    });

    return `✓ Function callable\n✓ Response: ${JSON.stringify(result.data, null, 2)}`;
  } catch (error) {
    if (error.code === 'permission-denied') {
      return `⚠️ Function callable but permission denied (expected if not admin)\n✓ This is OK for testing - function exists and responds`;
    }
    throw error;
  }
}
</script>

<style scoped>
.push-test-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

h1 {
  color: var(--color-heading);
  margin-bottom: 10px;
}

.user-info {
  color: var(--color-text);
  font-family: monospace;
}

.user-info strong {
  color: var(--vt-c-green);
}

.error {
  color: var(--vt-c-red);
  font-weight: bold;
}

.info {
  background: var(--color-background-soft);
  padding: 15px;
  margin: 20px 0;
  border-left: 3px solid var(--color-border);
  border-radius: 4px;
}

.actions {
  margin: 20px 0;
}

button {
  background: var(--color-border-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  margin-right: 10px;
}

button:hover:not(:disabled) {
  background: var(--color-background-mute);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-section {
  margin: 20px 0;
  padding: 15px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-background-soft);
}

.test-name {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 16px;
}

.status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 3px;
  margin-right: 10px;
  font-weight: bold;
  font-size: 12px;
}

.status.pending {
  background: var(--color-background-mute);
  color: var(--color-text-muted);
}

.status.running {
  background: rgba(66, 153, 225, 0.2);
  color: #4299e1;
}

.status.success {
  background: rgba(72, 187, 120, 0.2);
  color: #48bb78;
}

.status.error {
  background: rgba(245, 101, 101, 0.2);
  color: #f56565;
}

.result {
  margin-top: 10px;
  padding: 10px;
  background: var(--color-background);
  border-left: 3px solid var(--color-border);
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 13px;
}

.result.success {
  border-left-color: #48bb78;
}

.result.error {
  border-left-color: #f56565;
}
</style>
