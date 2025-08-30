import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { holdDetectionService } from '@/services/holdDetectionService'
import { useUserStore } from '@/stores/userStore'

/**
 * Unified Hold Detection Store
 * Manages both AI-detected and manual holds with persistent Firestore storage
 */
export const useHoldDetectionPersistenceStore = defineStore('holdDetectionPersistence', () => {
  // Reactive state
  const storedDetections = ref(new Map())
  const isLoading = ref(false)
  const error = ref(null)
  const currentLocationId = ref(null)

  // Auth store for user tracking
  const userStore = useUserStore()

  // Computed: Get complete detection data for an image
  const getDetectionForImage = computed(() => {
    return (imageId) => storedDetections.value.get(imageId) || null
  })

  // Computed: Get viewBox for an image
  const getViewBoxForImage = computed(() => {
    return (imageId) => {
      const detection = storedDetections.value.get(imageId)
      return detection?.detectionResults?.metadata?.viewBox || null
    }
  })

  // Computed: Get all holds (AI + manual) for an image
  const getHoldsForImage = computed(() => {
    return (imageId) => {
      const detection = storedDetections.value.get(imageId)
      if (!detection) return []
      
      return [
        ...(detection.detectionResults?.aiHolds || []),
        ...(detection.detectionResults?.manualHolds || [])
      ]
    }
  })

  // Computed: Get only AI-detected holds
  const getAIHoldsForImage = computed(() => {
    return (imageId) => {
      const detection = storedDetections.value.get(imageId)
      return detection?.detectionResults?.aiHolds || []
    }
  })

  // Computed: Get only manual holds
  const getManualHoldsForImage = computed(() => {
    return (imageId) => {
      const detection = storedDetections.value.get(imageId)
      return detection?.detectionResults?.manualHolds || []
    }
  })

  // Computed: Get detection metadata
  const getDetectionMetadata = computed(() => {
    return (imageId) => {
      const detection = storedDetections.value.get(imageId)
      return detection?.detectionResults?.metadata || null
    }
  })

  // Actions
  const initializeForLocation = (locationId) => {
    currentLocationId.value = locationId
    storedDetections.value.clear()
    error.value = null
  }

  const loadStoredDetection = async (imageId) => {
    if (!currentLocationId.value || !imageId) return null

    isLoading.value = true
    error.value = null

    try {
      const detectionData = await holdDetectionService.getHoldDetection(
        currentLocationId.value, 
        imageId
      )
      
      if (detectionData) {
        storedDetections.value.set(imageId, detectionData)
        console.log(`✅ Loaded unified detection for image ${imageId}`)
      }
      
      return detectionData
    } catch (err) {
      error.value = err.message
      console.error('❌ Error loading detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const saveDetectionResults = async (imageId, detectionData) => {
    if (!currentLocationId.value || !imageId) {
      throw new Error('Location and image must be set before saving detection')
    }

    isLoading.value = true
    error.value = null

    try {
      // Save using unified schema
      await holdDetectionService.saveHoldDetection(
        currentLocationId.value,
        imageId,
        detectionData
      )

      // Reload to get the saved data
      await loadStoredDetection(imageId)
      
      console.log(`✅ Saved unified detection for image ${imageId}`)
    } catch (err) {
      error.value = err.message
      console.error('❌ Error saving detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addManualHold = async (imageId, holdData) => {
    if (!currentLocationId.value || !imageId) {
      throw new Error('Location and image must be set')
    }

    if (!userStore.user?.uid) {
      throw new Error('User must be authenticated to add manual holds')
    }

    isLoading.value = true
    error.value = null

    try {
      const holdId = await holdDetectionService.addManualHold(
        currentLocationId.value,
        imageId,
        holdData,
        userStore.user.uid
      )

      // Reload to get updated data
      await loadStoredDetection(imageId)
      console.log(`✅ Added manual hold ${holdId} for image ${imageId}`)
      return holdId
    } catch (err) {
      error.value = err.message
      console.error('❌ Error adding manual hold:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateAIDetection = async (imageId, aiHolds, metadata) => {
    if (!currentLocationId.value || !imageId) {
      throw new Error('Location and image must be set')
    }

    isLoading.value = true
    error.value = null

    try {
      const existingDetection = storedDetections.value.get(imageId)
      const existingManualHolds = existingDetection?.detectionResults?.manualHolds || []

      await holdDetectionService.updateAIDetection(
        currentLocationId.value,
        imageId,
        aiHolds,
        {
          ...metadata,
          existingManualHolds
        }
      )

      // Reload to get updated data
      await loadStoredDetection(imageId)
      console.log(`✅ Updated AI detection for image ${imageId}`)
    } catch (err) {
      error.value = err.message
      console.error('❌ Error updating AI detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const removeHold = async (imageId, holdId) => {
    if (!currentLocationId.value || !imageId) {
      throw new Error('Location and image must be set')
    }

    isLoading.value = true
    error.value = null

    try {
      await holdDetectionService.removeHold(
        currentLocationId.value,
        imageId,
        holdId
      )

      // Reload to get updated data
      await loadStoredDetection(imageId)
      console.log(`✅ Removed hold ${holdId} from image ${imageId}`)
    } catch (err) {
      error.value = err.message
      console.error('❌ Error removing hold:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateStoredDetection = async (imageId, updates) => {
    // Legacy method - redirect to updateAIDetection if it contains holds
    if (updates.holds) {
      return await updateAIDetection(imageId, updates.holds, updates.metadata || {})
    }

    // For other updates, fall back to direct update
    if (!currentLocationId.value || !imageId) return

    isLoading.value = true
    error.value = null

    try {
      await holdDetectionService.updateHoldDetection?.(
        currentLocationId.value,
        imageId,
        updates
      )

      // Reload to get updated data
      await loadStoredDetection(imageId)
      console.log(`✅ Updated stored detection for image ${imageId}`)
    } catch (err) {
      error.value = err.message
      console.error('❌ Error updating stored detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteStoredDetection = async (imageId) => {
    if (!currentLocationId.value || !imageId) return

    isLoading.value = true
    error.value = null

    try {
      await holdDetectionService.deleteHoldDetection?.(currentLocationId.value, imageId)
      storedDetections.value.delete(imageId)
      console.log(`✅ Deleted stored detection for image ${imageId}`)
    } catch (err) {
      error.value = err.message
      console.error('❌ Error deleting stored detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const runAIDetection = async (imageId, imageUrl, options = {}) => {
    if (!currentLocationId.value || !imageId) {
      throw new Error('Location and image must be set')
    }

    isLoading.value = true
    error.value = null

    try {
      const result = await holdDetectionService.runAIDetection(
        currentLocationId.value,
        imageId,
        imageUrl,
        options
      )

      // Reload to get the AI detection results
      await loadStoredDetection(imageId)
      console.log(`✅ Ran AI detection for image ${imageId}`)
      return result
    } catch (err) {
      error.value = err.message
      console.error('❌ Error running AI detection:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  const hasStoredDetection = (imageId) => {
    return storedDetections.value.has(imageId)
  }

  return {
    // State
    storedDetections,
    isLoading,
    error,
    currentLocationId,

    // Computed
    getDetectionForImage,
    getViewBoxForImage,
    getHoldsForImage,
    getAIHoldsForImage,
    getManualHoldsForImage,
    getDetectionMetadata,

    // Actions
    initializeForLocation,
    loadStoredDetection,
    saveDetectionResults,
    updateStoredDetection,
    deleteStoredDetection,
    addManualHold,
    updateAIDetection,
    removeHold,
    runAIDetection,
    clearError,
    hasStoredDetection
  }
})
