import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase.js';
import { ref, reactive } from 'vue';

class ConfigService {
  constructor() {
    this.config = reactive({
      holdDetectionServer: {
        apiUrl: 'https://6d2401b5f155.ngrok-free.app', // Default fallback
        lastUpdated: null,
        updatedBy: null
      }
    });
    
    this.loading = ref(false);
    this.error = ref(null);
    
    // Auto-load config on service initialization
    this.loadConfig();
  }

  // Get the configuration document reference
  getConfigRef() {
    return doc(db, 'app-config', 'settings');
  }

  // Load configuration from Firestore
  async loadConfig() {
    try {
      this.loading.value = true;
      this.error.value = null;
      
      const configRef = this.getConfigRef();
      const configSnap = await getDoc(configRef);
      
      if (configSnap.exists()) {
        const data = configSnap.data();
        
        // Merge with defaults, preserving structure
        if (data.holdDetectionServer) {
          Object.assign(this.config.holdDetectionServer, data.holdDetectionServer);
        }
        
      } else {
        console.log('⚠️ Config document does not exist, using defaults');
        // Don't try to save if we can't read (permission issue)
        // Admins can manually create the config document
      }
    } catch (error) {
      console.warn('⚠️ Could not load configuration, using defaults:', error.code || error.message);
      // Don't set this.error - just use defaults silently
      // This allows the app to continue working even if config is not accessible
    } finally {
      this.loading.value = false;
    }
  }

  // Save configuration to Firestore
  async saveConfig(updatedBy = null) {
    try {
      this.loading.value = true;
      this.error.value = null;
      
      const configRef = this.getConfigRef();
      const configData = {
        holdDetectionServer: {
          ...this.config.holdDetectionServer,
          lastUpdated: new Date().toISOString(),
          updatedBy: updatedBy
        },
        lastModified: new Date().toISOString()
      };
      
      await setDoc(configRef, configData, { merge: true });
      
      // Update local config with the new metadata
      this.config.holdDetectionServer.lastUpdated = configData.holdDetectionServer.lastUpdated;
      this.config.holdDetectionServer.updatedBy = configData.holdDetectionServer.updatedBy;
      
      return true;
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
      this.error.value = error.message;
      throw error;
    } finally {
      this.loading.value = false;
    }
  }

  // Update hold detection server URL
  async updateHoldDetectionServerUrl(newUrl, updatedBy = null) {
    try {
      // Basic URL validation
      if (!newUrl || typeof newUrl !== 'string') {
        throw new Error('Invalid URL provided');
      }
      
      // Remove trailing slash for consistency
      newUrl = newUrl.replace(/\/+$/, '');
      
      // Update local config
      this.config.holdDetectionServer.apiUrl = newUrl;
      
      // Save to Firestore
      await this.saveConfig(updatedBy);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating hold detection server URL:', error);
      throw error;
    }
  }

  // Get current hold detection server URL
  getHoldDetectionServerUrl() {
    return this.config.holdDetectionServer.apiUrl;
  }

  // Set up real-time listener for configuration changes
  setupConfigListener(callback = null) {
    const configRef = this.getConfigRef();
    
    return onSnapshot(configRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        
        // Update local config with server data
        if (data.holdDetectionServer) {
          Object.assign(this.config.holdDetectionServer, data.holdDetectionServer);
        }
        
        
        // Call optional callback
        if (callback && typeof callback === 'function') {
          callback(this.config);
        }
      }
    }, (error) => {
      console.error('❌ Configuration listener error:', error);
      this.error.value = error.message;
    });
  }

  // Get configuration metadata
  getConfigMetadata() {
    return {
      lastUpdated: this.config.holdDetectionServer.lastUpdated,
      updatedBy: this.config.holdDetectionServer.updatedBy,
      currentUrl: this.config.holdDetectionServer.apiUrl
    };
  }
}

// Export singleton instance
export const configService = new ConfigService();
