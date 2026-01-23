// src/utils/platform.js
export const isNative = () =>
  typeof window !== 'undefined' &&
  !!window.Capacitor &&
  window.Capacitor.isNativePlatform();

export const isUsingEmulators = () =>
  import.meta.env.VITE_USE_EMULATORS === 'true';

export const isTouchDevice = () =>
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0);

/**
 * Detect if running on mobile device (phone/tablet)
 * Used to disable heavy AI models on mobile to prevent crashes
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  
  // Check user agent for mobile devices
  const mobileRegex = /iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i;
  return mobileRegex.test(navigator.userAgent);
};
