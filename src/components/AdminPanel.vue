<template>
  <!-- Show full admin panel to existing admins only -->
  <div class="admin-panel" v-if="userStore.isAdmin">
    <h3>Admin Management</h3>

    <!-- API Configuration -->
    <div class="section">
      <h4>API Configuration</h4>
      
      <!-- Hold Detection Server URL -->
      <div class="config-item">
        <label class="config-label">Hold Detection Server URL:</label>
        <div class="form-group">
          <input 
            v-model="holdDetectionUrl" 
            type="url" 
            placeholder="https://your-ngrok-url.ngrok-free.app"
            :disabled="configLoading"
            class="url-input"
          />
          <button 
            @click="updateHoldDetectionUrl" 
            :disabled="configLoading || !holdDetectionUrl || holdDetectionUrl === configService.getHoldDetectionServerUrl()"
            class="update-btn"
          >
            {{ configLoading ? 'Updating...' : 'Update' }}
          </button>
        </div>
        
        <!-- Current config info -->
        <div class="config-info" v-if="configMetadata.lastUpdated">
          <small class="text-muted">
            Last updated: {{ formatDate(configMetadata.lastUpdated) }}
            <span v-if="configMetadata.updatedBy"> by {{ configMetadata.updatedBy }}</span>
          </small>
        </div>
      </div>
    </div>

    <!-- Admin Role Management -->
    <div class="section">
      <h4>Manage Admin Roles</h4>
      <div class="form-group">
        <input v-model="targetUid" type="text" placeholder="User UID" :disabled="loading" />
        <button @click="grantAdmin" :disabled="loading || !targetUid">Grant Admin</button>
        <button @click="revokeAdmin" :disabled="loading || !targetUid">Revoke Admin</button>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
    
    <!-- Config Messages -->
    <div v-if="configMessage" class="message" :class="configMessageType">
      {{ configMessage }}
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '../stores/userStore.js';
import { adminService } from '../services/adminService.js';
import { configService } from '../services/configService.js';

export default {
  name: 'AdminPanel',
  setup() {
    const userStore = useUserStore();
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const targetUid = ref('');

    // Configuration state
    const configLoading = ref(false);
    const configMessage = ref('');
    const configMessageType = ref('');
    const holdDetectionUrl = ref('');
    const configUnsubscribe = ref(null);

    // Get configuration metadata
    const configMetadata = computed(() => configService.getConfigMetadata());

    const clearMessage = () => {
      setTimeout(() => {
        message.value = '';
        messageType.value = '';
      }, 5000);
    };

    const clearConfigMessage = () => {
      setTimeout(() => {
        configMessage.value = '';
        configMessageType.value = '';
      }, 5000);
    };

    const showMessage = (text, type = 'info') => {
      message.value = text;
      messageType.value = type;
      clearMessage();
    };

    const showConfigMessage = (text, type = 'info') => {
      configMessage.value = text;
      configMessageType.value = type;
      clearConfigMessage();
    };

    // Format date for display
    const formatDate = (dateString) => {
      if (!dateString) return '';
      return new Date(dateString).toLocaleString();
    };

    // Update hold detection server URL
    const updateHoldDetectionUrl = async () => {
      if (!holdDetectionUrl.value) return;

      configLoading.value = true;
      try {
        await configService.updateHoldDetectionServerUrl(
          holdDetectionUrl.value, 
          userStore.user?.email || 'Admin'
        );
        showConfigMessage('Hold Detection Server URL updated successfully!', 'success');
      } catch (error) {
        showConfigMessage(`Error updating URL: ${error.message}`, 'error');
      } finally {
        configLoading.value = false;
      }
    };

    // Initialize configuration
    const initializeConfig = async () => {
      try {
        // Load initial configuration
        await configService.loadConfig();
        
        // Set current URL in input
        holdDetectionUrl.value = configService.getHoldDetectionServerUrl();
        
        // Set up real-time listener
        configUnsubscribe.value = configService.setupConfigListener((newConfig) => {
          holdDetectionUrl.value = newConfig.holdDetectionServer.apiUrl;
        });
      } catch (error) {
        showConfigMessage(`Error loading configuration: ${error.message}`, 'error');
      }
    };

    const grantAdmin = async () => {
      if (!targetUid.value) return;

      loading.value = true;
      try {
        await adminService.setAdminRole(targetUid.value, true);
        showMessage('Admin role granted successfully!', 'success');
        targetUid.value = '';
      } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
      } finally {
        loading.value = false;
      }
    };

    const revokeAdmin = async () => {
      if (!targetUid.value) return;

      loading.value = true;
      try {
        await adminService.setAdminRole(targetUid.value, false);
        showMessage('Admin role revoked successfully!', 'success');
        targetUid.value = '';
      } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
      } finally {
        loading.value = false;
      }
    };

    // Lifecycle
    onMounted(() => {
      initializeConfig();
    });

    onUnmounted(() => {
      if (configUnsubscribe.value) {
        configUnsubscribe.value();
      }
    });

    return {
      userStore,
      loading,
      message,
      messageType,
      targetUid,
      grantAdmin,
      revokeAdmin,
      // Configuration
      configService,
      configLoading,
      configMessage,
      configMessageType,
      holdDetectionUrl,
      configMetadata,
      updateHoldDetectionUrl,
      formatDate,
    };
  },
};
</script>

<style scoped>
.admin-panel {
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: white;
}

.form-group {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

input[type="email"],
input[type="text"] {
  flex: 1;
  min-width: 200px;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  font-size: 14px;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.message {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
  font-weight: 500;
}

.message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.message.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

.no-access {
  text-align: center;
  padding: 20px;
  color: #666;
}

h3,
h4 {
  margin-top: 0;
  color: #333;
}

h3 {
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

/* Configuration specific styles */
.config-item {
  margin-bottom: 20px;
}

.config-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.url-input {
  min-width: 300px;
}

.update-btn {
  background-color: #28a745;
}

.update-btn:hover:not(:disabled) {
  background-color: #218838;
}

.config-info {
  margin-top: 8px;
}

.text-muted {
  color: #6c757d;
  font-style: italic;
}
</style>
