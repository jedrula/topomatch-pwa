import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions()

/**
 * Unified Hold Detection Service
 * Handles both AI-detected and manual holds in a single document structure
 */
export const holdDetectionService = {
  /**
   * Save complete hold detection results (AI + manual)
   */
  async saveHoldDetection(locationId, imageId, detectionData) {    
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    
    const unifiedDoc = {
      imageId,
      detectionResults: {
        aiHolds: detectionData.aiHolds || [],
        manualHolds: detectionData.manualHolds || [],
        metadata: {
          detectionSource: this.determineDetectionSource(detectionData),
          contributors: detectionData.contributors || [],
          ...(detectionData.viewBox && { viewBox: detectionData.viewBox }),
          ...(detectionData.imageUrl && { imageUrl: detectionData.imageUrl }),
          ...(detectionData.imageDimensions && { imageDimensions: detectionData.imageDimensions }),
          ...(detectionData.aiHolds?.length && { detectedAt: detectionData.detectedAt || serverTimestamp() }),
          ...(detectionData.manualHolds?.length && { lastManualUpdate: serverTimestamp() }),
          ...(detectionData.modelVersion && { modelVersion: detectionData.modelVersion })
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }

    await setDoc(docRef, unifiedDoc, { merge: true })
    return docRef.id
  },

  /**
   * Add a single manual hold to existing detection
   */
  async addManualHold(locationId, imageId, holdData, userId) {
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    const docSnap = await getDoc(docRef)
    
    let existingData = {}
    if (docSnap.exists()) {
      existingData = docSnap.data()
    }

    const newHold = {
      ...holdData,
      id: holdData.id || `manual_${Date.now()}`,
      source: 'manual-drawn',
      addedAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp()
      createdBy: userId
    }

    const updatedManualHolds = [...(existingData.detectionResults?.manualHolds || []), newHold]
    const updatedContributors = Array.from(new Set([
      ...(existingData.detectionResults?.metadata?.contributors || []),
      userId
    ]))

    await updateDoc(docRef, {
      'detectionResults.manualHolds': updatedManualHolds,
      'detectionResults.metadata.contributors': updatedContributors,
      'detectionResults.metadata.lastManualUpdate': serverTimestamp(),
      'detectionResults.metadata.detectionSource': this.determineDetectionSource({
        aiHolds: existingData.detectionResults?.aiHolds || [],
        manualHolds: updatedManualHolds
      }),
      updatedAt: serverTimestamp()
    })

    return newHold.id
  },

  /**
   * Save manual holds only (bulk operation)
   */
  async saveManualHolds(locationId, imageId, manualHolds, imageUrl) {
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    const docSnap = await getDoc(docRef)
    
    let existingData = {}
    if (docSnap.exists()) {
      existingData = docSnap.data()
    }

    // Prepare update data
    const updateData = {
      'detectionResults.manualHolds': manualHolds,
      'detectionResults.metadata.lastManualUpdate': serverTimestamp(),
      'detectionResults.metadata.detectionSource': this.determineDetectionSource({
        aiHolds: existingData.detectionResults?.aiHolds || [],
        manualHolds: manualHolds
      }),
      updatedAt: serverTimestamp()
    }

    // Only add imageUrl to metadata if it's provided and not already set
    if (imageUrl && !existingData.detectionResults?.metadata?.imageUrl) {
      updateData['detectionResults.metadata.imageUrl'] = imageUrl
    }

    // If this is a new document, we need to set the basic structure
    if (!docSnap.exists()) {
      const newDoc = {
        imageId,
        detectionResults: {
          aiHolds: [],
          manualHolds: manualHolds,
          metadata: {
            detectionSource: 'manual-only',
            lastManualUpdate: serverTimestamp(),
            ...(imageUrl && { imageUrl })
          }
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      await setDoc(docRef, newDoc)
    } else {
      await updateDoc(docRef, updateData)
    }

  },

  /**
   * Update AI detection results
   */
  async updateAIDetection(locationId, imageId, aiHolds, metadata) {
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    
    await updateDoc(docRef, {
      'detectionResults.aiHolds': aiHolds,
      'detectionResults.metadata.detectedAt': serverTimestamp(),
      'detectionResults.metadata.modelVersion': metadata.modelVersion,
      'detectionResults.metadata.detectionSource': this.determineDetectionSource({
        aiHolds,
        manualHolds: metadata.existingManualHolds || []
      }),
      updatedAt: serverTimestamp()
    })
  },

  /**
   * Remove a specific hold (AI or manual)
   */
  async removeHold(locationId, imageId, holdId) {
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) return

    const data = docSnap.data()
    const aiHolds = data.detectionResults?.aiHolds || []
    const manualHolds = data.detectionResults?.manualHolds || []
    
    const updatedAIHolds = aiHolds.filter(hold => hold.id !== holdId)
    const updatedManualHolds = manualHolds.filter(hold => hold.id !== holdId)

    await updateDoc(docRef, {
      'detectionResults.aiHolds': updatedAIHolds,
      'detectionResults.manualHolds': updatedManualHolds,
      'detectionResults.metadata.detectionSource': this.determineDetectionSource({
        aiHolds: updatedAIHolds,
        manualHolds: updatedManualHolds
      }),
      updatedAt: serverTimestamp()
    })
  },

  /**
   * Get unified hold detection for an image
   */
  async getHoldDetection(locationId, imageId) {
    const docRef = doc(db, 'locations', locationId, 'holdDetections', imageId)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    }
  },

  /**
   * Get all holds (AI + manual) combined
   */
  async getAllHolds(locationId, imageId) {
    const detection = await this.getHoldDetection(locationId, imageId)
    if (!detection) return []

    return [
      ...(detection.detectionResults.aiHolds || []),
      ...(detection.detectionResults.manualHolds || [])
    ]
  },

  /**
   * Get viewBox for specific image
   */
  async getViewBox(locationId, imageId) {
    const detection = await this.getHoldDetection(locationId, imageId)
    return detection?.detectionResults?.metadata?.viewBox || null
  },

  /**
   * Determine detection source based on available holds
   */
  determineDetectionSource(data) {
    const hasAI = data.aiHolds?.length > 0
    const hasManual = data.manualHolds?.length > 0
    
    if (hasAI && hasManual) return 'mixed'
    if (hasAI) return 'ai-model'
    if (hasManual) return 'manual-only'
    return 'empty'
  },

  /**
   * Trigger AI detection via Firebase Function
   */
  async runAIDetection(locationId, imageId, imageUrl, options = {}) {
    const detectHolds = httpsCallable(functions, 'detectHolds')
    
    try {
      const result = await detectHolds({
        locationId,
        imageId,
        imageUrl,
        ...options
      })
      
      return result.data
    } catch (error) {
      console.error('AI detection failed:', error)
      throw error
    }
  }
}
