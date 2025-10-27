import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHoldDetectionPersistenceStore } from './holdDetectionPersistenceStore'
import { holdDetectionService } from '../services/holdDetectionService.js'
import { holdDetectionApiService } from '@/services/holdDetectionApiService'

/**
 * Simplified Hold Detection Server Store
 * Now uses TypeScript API service for type-safe hold detection
 * Only handles AI detection and integrates with unified persistence system
 */
export const useHoldDetectionServerStore = defineStore('holdDetectionServer', () => {
  // Core state
  const isProcessing = ref(false)
  const statusMessage = ref('Ready')
  const error = ref(null)
  const results = ref(null)
  
  // Progress tracking
  const currentStep = ref(1)
  const totalSteps = ref(4)
  const progressPercent = ref(0)
  const detailedProgress = ref(null)
  
  // API settings
  const apiHealthy = ref(false)
  
  // Manual holds state (simplified)
  const manualHolds = ref([])
  const isDrawingMode = ref(false)
  const isDeleteMode = ref(false)
  const isAdminHighlightMode = ref(false)
  
  // Compression settings (for UI compatibility)
  const compressionSettings = ref({
    enabled: true,
    maxSizeMB: 2.0,
    maxWidthOrHeight: 2048
  })
  
  // Computed
  const hasResults = computed(() => results.value !== null)
  const isReady = computed(() => !isProcessing.value && apiHealthy.value)
  
  // Processing time computed from results
  const processingTime = computed(() => {
    return results.value?.processingTime || 0
  })
  
  // Hold count computed from results
  const holdCount = computed(() => {
    return results.value?.holds?.length || 0
  })
  
  // Check if an image can be processed
  const canProcessImage = (imageUrl) => {
    return imageUrl && apiHealthy.value && !isProcessing.value
  }
  
  // Get persistence store
  const persistenceStore = useHoldDetectionPersistenceStore()
  
  // Actions
  const testApiHealth = async () => {
    try {
      statusMessage.value = 'Testing API connection...'
      
      // Use TypeScript service for health check
      const isHealthy = await holdDetectionApiService.checkApiHealth()
      
      if (isHealthy) {
        apiHealthy.value = true
        statusMessage.value = 'API is ready'
        return { success: true, data: { healthy: true } }
      } else {
        throw new Error('API health check returned false')
      }
    } catch (err) {
      apiHealthy.value = false
      error.value = err.message
      statusMessage.value = `API connection failed: ${err.message}`
      console.error('❌ API Health check failed:', err)
      return { success: false, error: err.message }
    }
  }
  
  const processImage = async (imageUrl, locationId = null, imageId = null) => {
    if (!imageUrl) {
      error.value = 'No image URL provided'
      return { success: false, error: 'No image URL provided' }
    }
    
    if (!apiHealthy.value) {
      error.value = 'API is not healthy. Please test connection first.'
      return { success: false, error: 'API is not healthy' }
    }
    
    try {
      isProcessing.value = true
      error.value = null
      results.value = null
      progressPercent.value = 0
      currentStep.value = 1
      
      // Step 1: Fetch image from Firebase Storage
      statusMessage.value = 'Fetching image from Firebase Storage...'
      progressPercent.value = 10
      
      const imageResponse = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'omit', // Don't send cookies, token is in URL
      })
      
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`)
      }
      
      // Step 2: Convert to blob for upload
      statusMessage.value = 'Preparing image for upload...'
      progressPercent.value = 25
      
      const imageBlob = await imageResponse.blob()
      
      // Convert blob to File object for TypeScript service
      const imageFile = new File([imageBlob], 'climbing_wall.jpg', { type: imageBlob.type })
      
      // Step 3: Upload using TypeScript service
      currentStep.value = 2
      statusMessage.value = 'Uploading to server...'
      progressPercent.value = 50
      
      const jobId = await holdDetectionApiService.uploadImageForProcessing(imageFile)
      
      // Step 4: Poll for results using TypeScript service
      currentStep.value = 3
      statusMessage.value = 'Processing on server...'
      progressPercent.value = 75
      
      const result = await holdDetectionApiService.pollForJobResults(
        jobId,
        (status) => {
          statusMessage.value = `Processing on server... (${status})`
          // Update detailed progress if available from status
        }
      )
      
      // TypeScript debugging and validation (development only)
      if (import.meta.env.DEV) {
        
        // Create proper HoldDetectionStatusResponse structure for validation
        const mockStatusResponse = {
          job_id: jobId,
          status: 'completed',
          progress: 'Complete',
          result: result
        }
      }
      
      // Step 5: Complete
      currentStep.value = 4
      progressPercent.value = 100
      statusMessage.value = 'Processing completed successfully!'
      
      // Store the typed result
      results.value = result
      
      // Auto-enable admin highlight mode when results are loaded
      if (result && result.holds?.length > 0) {
        setAdminHighlightMode(true)
      }
      
      return { success: true, result }
    } catch (err) {
      error.value = err.message
      statusMessage.value = `Processing failed: ${err.message}`
      console.error('❌ Processing failed:', err)
      return { success: false, error: err.message }
    } finally {
      isProcessing.value = false
    }
  }
  
  const clearResults = () => {
    results.value = null
    error.value = null
    statusMessage.value = 'Ready'
    progressPercent.value = 0
    currentStep.value = 1
  }
  
  const resetState = () => {
    clearResults()
    manualHolds.value = []
    isDrawingMode.value = false
    isDeleteMode.value = false
    isAdminHighlightMode.value = false
    detailedProgress.value = null
    isProcessing.value = false
  }
  
  const addManualHold = (hold) => {
    manualHolds.value.push(hold)
  }
  
  const removeManualHold = (holdId) => {
    const index = manualHolds.value.findIndex(h => h.id === holdId)
    if (index !== -1) {
      manualHolds.value.splice(index, 1)
    }
  }
  
  const removeAIHold = async (holdIndex, locationId, imageId) => {
    if (!results.value || !results.value.holds) return
    
    // Get the hold ID before removing it
    const holdToRemove = results.value.holds[holdIndex]
    if (!holdToRemove) return
    
    // Create copies of the arrays
    const updatedHolds = [...results.value.holds]
    const updatedSvgMarkups = results.value.svg_markups ? [...results.value.svg_markups] : []
    
    // Remove the hold at the specified index
    if (holdIndex >= 0 && holdIndex < updatedHolds.length) {
      updatedHolds.splice(holdIndex, 1)
      
      // Also remove the corresponding SVG markup
      if (updatedSvgMarkups.length > holdIndex) {
        updatedSvgMarkups.splice(holdIndex, 1)
      }
      
      // Update the results locally first
      results.value = {
        ...results.value,
        holds: updatedHolds,
        svg_markups: updatedSvgMarkups
      }
      
      // Persist the deletion to the database using the hold's ID
      try {
        if (locationId && imageId && holdToRemove.id) {
          await holdDetectionService.removeHold(locationId, imageId, holdToRemove.id)
        }
      } catch (error) {
        console.error('❌ Error removing AI hold from database:', error)
      }
      
    }
  }
  
  const clearManualHolds = () => {
    manualHolds.value = []
  }
  
  const setDrawingMode = (enabled) => {
    isDrawingMode.value = enabled
    if (enabled) {
      isDeleteMode.value = false
      isAdminHighlightMode.value = false
    }
  }
  
  const setDeleteMode = (enabled) => {
    isDeleteMode.value = enabled
    if (enabled) {
      isDrawingMode.value = false
      isAdminHighlightMode.value = false
    }
  }
  
  const setAdminHighlightMode = (enabled) => {
    isAdminHighlightMode.value = enabled
    if (enabled) {
      isDrawingMode.value = false
      isDeleteMode.value = false
    }
  }
  
  // Simplified save/load manual holds (using unified persistence)
  const loadManualHolds = async (locationId, imageId) => {
    try {
      await persistenceStore.loadStoredDetection(imageId)
      
      const detection = persistenceStore.getDetectionForImage(imageId)
      if (detection) {
        manualHolds.value = detection.detectionResults?.manualHolds || []
      }
    } catch (error) {
      console.error('Error loading manual holds:', error)
    }
  }
  
  const saveManualHolds = async (locationId, imageId, imageUrl = null) => {
    try {
      // Always save, even if empty array (to clear holds from Firestore)
      await holdDetectionService.saveManualHolds(
        locationId, 
        imageId, 
        manualHolds.value, 
        imageUrl
      )
      
      // Reload the detection data to keep the store in sync
      await persistenceStore.loadStoredDetection(imageId)
      
    } catch (error) {
      console.error('Error saving manual holds:', error)
    }
  }
  
  // Load all detection results (AI + manual) from persistence
  const loadDetectionResults = async (locationId, imageId) => {
    try {
      if (!locationId || !imageId) return false
      
      // Initialize persistence store
      persistenceStore.initializeForLocation(locationId)
      
      // Load stored detection
      const existingDetection = await persistenceStore.loadStoredDetection(imageId)
      
      if (existingDetection?.detectionResults) {
        const aiHolds = existingDetection.detectionResults.aiHolds || []
        const storedManualHolds = existingDetection.detectionResults.manualHolds || []
        
        // Load AI holds into results format (no more fallbacks - trust the schema!)
        if (aiHolds.length > 0) {
          const metadata = existingDetection.detectionResults.metadata || {}
          results.value = {
            holds: aiHolds.map(hold => ({
              id: hold.id,
              x: hold.x,
              y: hold.y,
              centerX: hold.centerX,
              centerY: hold.centerY,
              width: hold.width,
              height: hold.height,
              confidence: hold.confidence,
              type: hold.holdType,
              svgMarkup: hold.svgMarkup
            })),
            svg_markups: aiHolds.map(hold => hold.svgMarkup || ''),
            // Include timing information from metadata
            processing_time: metadata.processingTime || 0,
            yolo_results: metadata.yoloInferenceTime ? { inference_time: metadata.yoloInferenceTime } : undefined,
            sam2_results: metadata.sam2ProcessingTime ? { processing_time: metadata.sam2ProcessingTime } : undefined,
            svg_generation_time: metadata.svgGenerationTime || 0,
            metadata
          }
        }
        
        // Load manual holds
        manualHolds.value = storedManualHolds
        
        // Auto-enable admin highlight mode when detection results are loaded
        if (results.value && (results.value.holds?.length > 0 || results.value.svg_markups?.length > 0)) {
          setAdminHighlightMode(true)
        }
        
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error loading detection results:', error)
      return false
    }
  }
  
  return {
    // State
    isProcessing,
    statusMessage,
    error,
    results,
    currentStep,
    totalSteps,
    progressPercent,
    detailedProgress,
    apiHealthy,
    manualHolds,
    isDrawingMode,
    isDeleteMode,
    isAdminHighlightMode,
    compressionSettings,
    
    // Computed
    hasResults,
    isReady,
    processingTime,
    holdCount,
    canProcessImage,
    
    // Actions
    testApiHealth,
    processImage,
    clearResults,
    resetState,
    addManualHold,
    removeManualHold,
    removeAIHold,
    clearManualHolds,
    setDrawingMode,
    setDeleteMode,
    setAdminHighlightMode,
    loadManualHolds,
    saveManualHolds,
    loadDetectionResults
  }
})
