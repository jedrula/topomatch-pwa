// src/utils/platform.js
export const isNative = () =>
  typeof window !== 'undefined' &&
  !!window.Capacitor &&
  window.Capacitor.isNativePlatform();

export const isUsingEmulators = () =>
  import.meta.env.VITE_USE_EMULATORS === 'true';
