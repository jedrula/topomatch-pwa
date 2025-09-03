<template>
  <div v-if="show" class="mobile-debug-console" @click="toggleExpanded">
    <div class="console-header">
      <span>Debug Console ({{ logs.length }})</span>
      <button @click.stop="clear" class="clear-btn">Clear</button>
      <button @click.stop="close" class="close-btn">×</button>
    </div>
    <div v-if="expanded" class="console-body">
      <div v-for="(log, index) in logs" :key="index" :class="['log-entry', log.type]">
        <span class="timestamp">{{ log.timestamp }}</span>
        <span class="message">{{ log.message }}</span>
        <div v-if="log.data" class="log-data">{{ log.data }}</div>
      </div>
    </div>
  </div>
  <!-- Floating toggle button when console is hidden -->
  <button v-if="!show" @click="show = true" class="debug-toggle">
    🐛 {{ logs.length }}
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const show = ref(false);
const expanded = ref(false);
const logs = ref([]);

const addLog = (type, message, data = null) => {
  logs.value.unshift({
    type,
    message,
    data: data ? JSON.stringify(data, null, 2) : null,
    timestamp: new Date().toLocaleTimeString()
  });
  
  // Keep only last 100 logs
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100);
  }
};

const clear = () => {
  logs.value = [];
};

const close = () => {
  show.value = false;
  expanded.value = false;
};

const toggleExpanded = () => {
  expanded.value = !expanded.value;
};

// Intercept console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

onMounted(() => {
  // Override console methods
  console.log = (...args) => {
    originalConsole.log(...args);
    addLog('log', args.join(' '));
  };
  
  console.error = (...args) => {
    originalConsole.error(...args);
    addLog('error', args.join(' '));
  };
  
  console.warn = (...args) => {
    originalConsole.warn(...args);
    addLog('warn', args.join(' '));
  };
  
  console.info = (...args) => {
    originalConsole.info(...args);
    addLog('info', args.join(' '));
  };

  // Capture unhandled errors
  window.addEventListener('error', (event) => {
    addLog('error', `${event.error?.name}: ${event.error?.message}`, {
      filename: event.filename,
      lineno: event.lineno,
      stack: event.error?.stack
    });
  });

  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    addLog('error', `Unhandled Promise Rejection: ${event.reason}`, {
      reason: event.reason,
      stack: event.reason?.stack
    });
  });

  // Intercept fetch requests for network monitoring
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0];
    const options = args[1] || {};
    
    addLog('info', `🌐 Fetch: ${url}`, { method: options.method || 'GET' });
    
    try {
      const response = await originalFetch(...args);
      addLog('info', `✅ Fetch Success: ${url} (${response.status})`);
      return response;
    } catch (error) {
      addLog('error', `❌ Fetch Failed: ${url}`, { error: error.message });
      throw error;
    }
  };
});

onUnmounted(() => {
  // Restore original console methods
  Object.assign(console, originalConsole);
});
</script>

<style scoped>
.mobile-debug-console {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  z-index: 9999;
  border-top: 2px solid #333;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1a1a1a;
  border-bottom: 1px solid #333;
}

.clear-btn, .close-btn {
  background: #333;
  color: #fff;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
}

.close-btn {
  background: #ff4444;
  margin-left: 8px;
}

.console-body {
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px;
}

.log-entry {
  margin-bottom: 4px;
  padding: 4px;
  border-left: 3px solid #666;
}

.log-entry.error {
  border-left-color: #ff4444;
  color: #ffaaaa;
}

.log-entry.warn {
  border-left-color: #ffaa00;
  color: #ffffaa;
}

.log-entry.info {
  border-left-color: #4444ff;
  color: #aaaaff;
}

.timestamp {
  color: #888;
  margin-right: 8px;
}

.log-data {
  margin-top: 4px;
  padding: 4px;
  background: #222;
  border-radius: 3px;
  white-space: pre-wrap;
  font-size: 10px;
  max-height: 100px;
  overflow-y: auto;
}

.debug-toggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  font-size: 16px;
  cursor: pointer;
  z-index: 9998;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}
</style>
