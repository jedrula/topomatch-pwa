// src/utils/platform.js
export const isNative = () =>
  typeof window !== 'undefined' &&
  !!window.Capacitor &&
  window.Capacitor.isNativePlatform();
