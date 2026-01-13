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
