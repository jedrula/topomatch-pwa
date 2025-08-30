import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Minimal Hold Detection Store (Client-side)
 * Kept for compatibility, but most functionality moved to server-side
 */
export const useHoldDetectionStore = defineStore('holdDetection', () => {
  // Basic state for compatibility
  const isLoading = ref(false)
  const loadingMessage = ref('')
  const detectionResults = ref(null)
  const errorString = ref(null)
  const sessionReady = ref(false)
  
  // Stub implementations for compatibility
  const sessionTime = ref(null)
  const samSessionTime = ref(null)
  const currentlyProcessingImage = ref(null)
  const samSessionReady = ref(false)
  
  // Workers (stubbed)
  const holdDetectionWorker = ref(null)
  const samWorker = ref(null)
  
  // Computed properties
  const isReady = computed(() => sessionReady.value && !isLoading.value)
  const hasResults = computed(() => detectionResults.value !== null)
  
  // Actions (minimal implementations)
  const initializeSession = async () => {
    console.warn('Client-side hold detection is deprecated. Use server-side detection instead.')
    sessionReady.value = false
    return { success: false, message: 'Client-side detection disabled' }
  }
  
  const processImage = async (imageUrl) => {
    console.warn('Client-side hold detection is deprecated. Use server-side detection instead.')
    return { success: false, message: 'Client-side detection disabled' }
  }
  
  const clearResults = () => {
    detectionResults.value = null
    errorString.value = null
    loadingMessage.value = ''
    isLoading.value = false
  }
  
  const resetSession = () => {
    sessionReady.value = false
    clearResults()
  }
  
  return {
    // State
    isLoading,
    loadingMessage,
    detectionResults,
    errorString,
    sessionReady,
    sessionTime,
    samSessionTime,
    currentlyProcessingImage,
    samSessionReady,
    holdDetectionWorker,
    samWorker,
    
    // Computed
    isReady,
    hasResults,
    
    // Actions
    initializeSession,
    processImage,
    clearResults,
    resetSession
  }
})
