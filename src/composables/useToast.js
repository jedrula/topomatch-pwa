import { ref } from 'vue';

// Global toast state (shared across all components)
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('info'); // 'info', 'success', 'error', 'warning', 'loading'
let toastTimeout = null;

/**
 * Composable for showing toast notifications
 * 
 * @returns {Object} Toast state and methods
 */
export function useToast() {
  /**
   * Show a toast notification
   * 
   * @param {string} message - The message to display
   * @param {string} type - Toast type: 'info', 'success', 'error', 'warning', 'loading'
   * @param {number} duration - Duration in ms (0 = no auto-dismiss, useful for loading states)
   */
  const show = (message, type = 'info', duration = 3000) => {
    // Clear any existing timeout
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      toastTimeout = setTimeout(() => {
        showToast.value = false;
      }, duration);
    }
  };

  /**
   * Hide the current toast
   */
  const hide = () => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }
    showToast.value = false;
  };

  /**
   * Convenience methods for different toast types
   */
  const success = (message, duration = 3000) => show(message, 'success', duration);
  const error = (message, duration = 4000) => show(message, 'error', duration);
  const warning = (message, duration = 3500) => show(message, 'warning', duration);
  const info = (message, duration = 3000) => show(message, 'info', duration);
  const loading = (message) => show(message, 'loading', 0); // No auto-dismiss for loading

  return {
    // State (read-only)
    showToast,
    toastMessage,
    toastType,
    
    // Methods
    show,
    hide,
    success,
    error,
    warning,
    info,
    loading,
  };
}
