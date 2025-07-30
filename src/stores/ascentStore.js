import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ascentService } from "@/services/ascentService";
import { useUserStore } from "@/stores/userStore";

export const useAscentStore = defineStore("ascent", () => {
  // State
  const ascents = ref([]); // All ascents for current boulder problem
  const userAscents = ref([]); // Current user's ascents for current boulder problem
  const ascentStats = ref(null); // Statistics for current boulder problem
  const isLoading = ref(false);
  const error = ref(null);
  const currentLocationId = ref(null);
  const currentProblemId = ref(null);

  // Boulder problem grades (V-Scale) for grade selection
  const grades = [
    "VB",
    "V0",
    "V1",
    "V2",
    "V3",
    "V4",
    "V5",
    "V6",
    "V7",
    "V8",
    "V9",
    "V10",
    "V11",
    "V12",
    "V13",
    "V14",
    "V15",
    "V16",
    "V17",
  ];

  // Attempt types
  const attemptTypes = [
    { value: "flash", label: "Flash (1st attempt)", description: "Sent on first try" },
    { value: "second", label: "2nd attempt", description: "Sent on second try" },
    { value: "multiple", label: "3rd+ attempts", description: "Sent after multiple attempts" },
  ];

  // Computed
  const hasUserSent = computed(() => {
    return userAscents.value.length > 0;
  });

  const latestUserAscent = computed(() => {
    if (userAscents.value.length === 0) return null;
    return userAscents.value[0]; // Already sorted by creation date desc
  });

  const userSentCount = computed(() => {
    return userAscents.value.length;
  });

  // Actions
  const initializeForProblem = (locationId, problemId) => {
    currentLocationId.value = locationId;
    currentProblemId.value = problemId;
    // Reset state when switching to a new problem
    ascents.value = [];
    userAscents.value = [];
    ascentStats.value = null;
    error.value = null;
  };

  const loadAscents = async (locationId, problemId) => {
    if (!locationId || !problemId) return;

    isLoading.value = true;
    error.value = null;

    try {
      // Load all ascents for the problem
      const allAscents = await ascentService.getBoulderAscents(locationId, problemId);
      ascents.value = allAscents;

      // Load current user's ascents for this problem
      const userStore = useUserStore();
      if (userStore.isLoggedIn) {
        const currentUserAscents = await ascentService.getUserBoulderAscents(locationId, problemId);
        userAscents.value = currentUserAscents;
      }

      // Load statistics
      const stats = await ascentService.getBoulderAscentStats(locationId, problemId);
      ascentStats.value = stats;
    } catch (err) {
      console.error("Error loading ascents:", err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  const logAscent = async (ascentData) => {
    if (!currentLocationId.value || !currentProblemId.value) {
      throw new Error("Location and problem must be set");
    }

    isLoading.value = true;
    error.value = null;

    try {
      const ascentId = await ascentService.logAscent(
        currentLocationId.value,
        currentProblemId.value,
        ascentData
      );

      // Reload ascents to get the updated data
      await loadAscents(currentLocationId.value, currentProblemId.value);

      return ascentId;
    } catch (err) {
      console.error("Error logging ascent:", err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateAscent = async (ascentId, updates) => {
    if (!currentLocationId.value || !currentProblemId.value) {
      throw new Error("Location and problem must be set");
    }

    isLoading.value = true;
    error.value = null;

    try {
      await ascentService.updateAscent(
        currentLocationId.value,
        currentProblemId.value,
        ascentId,
        updates
      );

      // Reload ascents to get the updated data
      await loadAscents(currentLocationId.value, currentProblemId.value);
    } catch (err) {
      console.error("Error updating ascent:", err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAscent = async (ascentId) => {
    if (!currentLocationId.value || !currentProblemId.value) {
      throw new Error("Location and problem must be set");
    }

    isLoading.value = true;
    error.value = null;

    try {
      await ascentService.deleteAscent(currentLocationId.value, currentProblemId.value, ascentId);

      // Reload ascents to get the updated data
      await loadAscents(currentLocationId.value, currentProblemId.value);
    } catch (err) {
      console.error("Error deleting ascent:", err);
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearAscents = () => {
    ascents.value = [];
    userAscents.value = [];
    ascentStats.value = null;
    error.value = null;
    currentLocationId.value = null;
    currentProblemId.value = null;
  };

  // Helper methods
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  };

  const getAttemptTypeLabel = (attemptType) => {
    const type = attemptTypes.find((t) => t.value === attemptType);
    return type ? type.label : attemptType;
  };

  const getAttemptTypeDescription = (attemptType) => {
    const type = attemptTypes.find((t) => t.value === attemptType);
    return type ? type.description : "";
  };

  return {
    // State
    ascents,
    userAscents,
    ascentStats,
    isLoading,
    error,
    currentLocationId,
    currentProblemId,
    grades,
    attemptTypes,

    // Computed
    hasUserSent,
    latestUserAscent,
    userSentCount,

    // Actions
    initializeForProblem,
    loadAscents,
    logAscent,
    updateAscent,
    deleteAscent,
    clearAscents,

    // Helpers
    formatDate,
    formatDateTime,
    getAttemptTypeLabel,
    getAttemptTypeDescription,
  };
});
