<template>
  <div class="admin-panel" v-if="userStore.isAdmin">
    <h3>Admin Management</h3>
    
    <!-- Initialize First Admin Section -->
    <div class="section" v-if="showInitializeSection">
      <h4>Initialize First Admin</h4>
      <p>No admin users exist yet. Set up the first admin:</p>
      <div class="form-group">
        <input 
          v-model="initializeEmail" 
          type="email" 
          placeholder="Admin email address"
          :disabled="loading"
        />
        <button @click="initializeFirstAdmin" :disabled="loading || !initializeEmail">
          Initialize Admin
        </button>
      </div>
    </div>

    <!-- Admin Role Management -->
    <div class="section">
      <h4>Manage Admin Roles</h4>
      <div class="form-group">
        <input 
          v-model="targetUid" 
          type="text" 
          placeholder="User UID"
          :disabled="loading"
        />
        <button @click="grantAdmin" :disabled="loading || !targetUid">
          Grant Admin
        </button>
        <button @click="revokeAdmin" :disabled="loading || !targetUid">
          Revoke Admin
        </button>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
  
  <div v-else-if="userStore.user" class="no-access">
    You don't have admin privileges.
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore.js';
import { adminService } from '../services/adminService.js';

export default {
  name: 'AdminPanel',
  setup() {
    const userStore = useUserStore();
    const loading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const initializeEmail = ref('');
    const targetUid = ref('');
    const showInitializeSection = ref(false);

    const clearMessage = () => {
      setTimeout(() => {
        message.value = '';
        messageType.value = '';
      }, 5000);
    };

    const showMessage = (text, type = 'info') => {
      message.value = text;
      messageType.value = type;
      clearMessage();
    };

    const initializeFirstAdmin = async () => {
      if (!initializeEmail.value) return;
      
      loading.value = true;
      try {
        await adminService.initializeFirstAdmin(initializeEmail.value);
        showMessage('First admin initialized successfully!', 'success');
        initializeEmail.value = '';
        showInitializeSection.value = false;
        
        // Refresh user claims to reflect the change
        await userStore.refreshUserClaims();
      } catch (error) {
        showMessage(`Error: ${error.message}`, 'error');
      } finally {
        loading.value = false;
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

    onMounted(() => {
      // For now, show the initialize section - in production you'd check if any admins exist
      showInitializeSection.value = true;
    });

    return {
      userStore,
      loading,
      message,
      messageType,
      initializeEmail,
      targetUid,
      showInitializeSection,
      initializeFirstAdmin,
      grantAdmin,
      revokeAdmin
    };
  }
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

h3, h4 {
  margin-top: 0;
  color: #333;
}

h3 {
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}
</style>
