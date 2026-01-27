/**
 * Lightweight Diagnostic Reporting
 * Ring-buffer logs + device info for debugging production issues
 */

class DiagnosticsService {
  constructor() {
    this.logBuffer = [];
    this.maxLogs = 200; // Keep last 200 log entries
    this._isNative = null; // Cached once on first use
    this._platform = null; // Cached once on first use
    
    // 🚨 RATE LIMITING: Prevent infinite loop spam
    this.reportLimits = {
      maxPerHour: 5,          // Max 5 reports per hour
      maxPerDay: 20,          // Max 20 reports per day
      cooldownMs: 60000,      // 1 minute between reports
      circuitBreakerLimit: 10 // Stop completely after 10 reports in 5 minutes
    };
    
    // Track sent reports (persisted in localStorage)
    this.loadReportHistory();
    
    // Error deduplication (don't send same error twice in 10 minutes)
    this.recentErrors = new Map(); // Map<errorHash, timestamp>
    
    this.setupGlobalHandlers();
  }
  
  /**
   * Lazy-load and cache platform info (only load Capacitor once)
   */
  async initPlatformInfo() {
    if (this._isNative === null) {
      const { Capacitor } = await import('@capacitor/core');
      this._isNative = Capacitor.isNativePlatform();
      this._platform = Capacitor.getPlatform();
    }
  }
  
  /**
   * Load report history from localStorage
   */
  loadReportHistory() {
    try {
      const stored = localStorage.getItem('diagnostics_report_history');
      if (stored) {
        const history = JSON.parse(stored);
        this.reportHistory = history.reports || [];
        this.circuitBreakerTripped = history.circuitBreakerTripped || false;
        
        // Clean old entries (older than 24 hours)
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.reportHistory = this.reportHistory.filter(t => t > oneDayAgo);
      } else {
        this.reportHistory = [];
        this.circuitBreakerTripped = false;
      }
    } catch (e) {
      console.warn('Failed to load report history:', e);
      this.reportHistory = [];
      this.circuitBreakerTripped = false;
    }
  }
  
  /**
   * Save report history to localStorage
   */
  saveReportHistory() {
    try {
      localStorage.setItem('diagnostics_report_history', JSON.stringify({
        reports: this.reportHistory,
        circuitBreakerTripped: this.circuitBreakerTripped
      }));
    } catch (e) {
      console.warn('Failed to save report history:', e);
    }
  }
  
  /**
   * Check if we can send a report (rate limiting)
   */
  canSendReport(errorHash = null) {
    const now = Date.now();
    
    // 🚫 Circuit breaker tripped - no more reports until reset
    if (this.circuitBreakerTripped) {
      console.warn('🚫 Circuit breaker tripped - reports disabled. Clear localStorage to reset.');
      return { allowed: false, reason: 'Circuit breaker tripped (too many reports)' };
    }
    
    // Clean old entries
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const tenMinutesAgo = now - 10 * 60 * 1000;
    
    this.reportHistory = this.reportHistory.filter(t => t > oneDayAgo);
    
    // Clean old error deduplication entries (older than 10 minutes)
    for (const [hash, timestamp] of this.recentErrors.entries()) {
      if (timestamp < tenMinutesAgo) {
        this.recentErrors.delete(hash);
      }
    }
    
    // Check circuit breaker (10 reports in 5 minutes = infinite loop)
    const recentReports = this.reportHistory.filter(t => t > fiveMinutesAgo);
    if (recentReports.length >= this.reportLimits.circuitBreakerLimit) {
      this.circuitBreakerTripped = true;
      this.saveReportHistory();
      console.error('🚨 CIRCUIT BREAKER TRIPPED: Too many reports in 5 minutes (possible infinite loop)');
      return { allowed: false, reason: 'Too many reports (possible infinite loop detected)' };
    }
    
    // Check hourly limit
    const reportsThisHour = this.reportHistory.filter(t => t > oneHourAgo);
    if (reportsThisHour.length >= this.reportLimits.maxPerHour) {
      return { allowed: false, reason: `Hourly limit reached (${this.reportLimits.maxPerHour}/hour)` };
    }
    
    // Check daily limit
    if (this.reportHistory.length >= this.reportLimits.maxPerDay) {
      return { allowed: false, reason: `Daily limit reached (${this.reportLimits.maxPerDay}/day)` };
    }
    
    // Check cooldown (1 minute between reports)
    if (this.reportHistory.length > 0) {
      const lastReport = this.reportHistory[this.reportHistory.length - 1];
      const timeSinceLastReport = now - lastReport;
      if (timeSinceLastReport < this.reportLimits.cooldownMs) {
        const waitSeconds = Math.ceil((this.reportLimits.cooldownMs - timeSinceLastReport) / 1000);
        return { allowed: false, reason: `Cooldown active (wait ${waitSeconds}s)` };
      }
    }
    
    // Check deduplication (same error in last 10 minutes)
    if (errorHash) {
      if (this.recentErrors.has(errorHash)) {
        const lastSeen = this.recentErrors.get(errorHash);
        if (lastSeen > tenMinutesAgo) {
          return { allowed: false, reason: 'Duplicate error (already reported)' };
        }
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Record that a report was sent
   */
  recordReportSent(errorHash = null) {
    const now = Date.now();
    this.reportHistory.push(now);
    this.saveReportHistory();
    
    if (errorHash) {
      this.recentErrors.set(errorHash, now);
    }
  }
  
  /**
   * Generate hash for error (for deduplication)
   */
  hashError(error) {
    if (!error) return null;
    const str = `${error.message || ''}_${error.code || ''}_${error.stack?.substring(0, 100) || ''}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * Auto-send report to Firestore (background, no UI)
   */
  async autoSendReport(errorContext) {
    try {
      // Dynamically import to avoid circular dependencies
      const { useUserStore } = await import('../stores/userStore.js');
      
      // Only send if user is authenticated
      const userStore = useUserStore();
      if (!userStore.isLoggedIn || !userStore.user?.uid) {
        console.log('📊 Auto-report skipped: user not logged in');
        return;
      }
      
      const report = await this.createReport(errorContext);
      
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../services/firebase.js');
      
      // Add userId to report
      report.userId = userStore.user.uid;
      report.autoReported = true; // Flag as automatic report
      
      await addDoc(collection(db, 'diagnosticReports'), report);
      console.log('📊 Auto-report sent:', errorContext.error || errorContext.message);
    } catch (error) {
      // Don't throw - auto-reporting should never break the app
      console.warn('📊 Auto-report failed (silently ignored):', error.message);
    }
  }

  /**
   * Auto-capture uncaught errors (like Sentry)
   */
  setupGlobalHandlers() {
    // Uncaught exceptions
    window.addEventListener('error', (event) => {
      const errorContext = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      };
      
      this.log('error', 'Uncaught exception', errorContext);
      
      // Auto-send to Firestore (in background)
      this.autoSendReport({
        type: 'uncaught_exception',
        error: errorContext
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const errorContext = {
        reason: event.reason?.message || event.reason,
        stack: event.reason?.stack
      };
      
      this.log('error', 'Unhandled promise rejection', errorContext);
      
      // Auto-send to Firestore (in background)
      this.autoSendReport({
        type: 'unhandled_rejection',
        error: errorContext
      });
    });

    // Override console.error to capture (optional - can be noisy)
    const originalError = console.error;
    let isLoggingError = false; // Prevent infinite loop
    console.error = (...args) => {
      if (isLoggingError) {
        // Already logging - use original to prevent infinite loop
        originalError.apply(console, args);
        return;
      }
      
      try {
        isLoggingError = true;
        this.log('error', 'Console error', {
          args: args.map(a => {
            try {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            } catch (e) {
              return '[Circular or non-serializable object]';
            }
          })
        });
      } finally {
        isLoggingError = false;
      }
      
      originalError.apply(console, args);
    };
  }

  /**
   * Setup Vue-specific error handling
   * Call this in main.js: diagnostics.setupVueErrorHandler(app)
   */
  setupVueErrorHandler(app) {
    app.config.errorHandler = (err, instance, info) => {
      const errorContext = {
        message: err.message,
        stack: err.stack,
        component: instance?.$options?.name || instance?.$options?.__name || 'Unknown',
        lifecycleHook: info,
      };
      
      this.log('error', 'Vue error', errorContext);
      
      // Auto-send Vue errors (in background)
      this.autoSendReport({
        type: 'vue_error',
        error: errorContext
      });
      
      // Still throw to console for dev debugging
      console.error('Vue error:', err, info);
    };

    // Capture Vue warnings (optional - might be noisy in dev)
    if (import.meta.env.PROD) {
      app.config.warnHandler = (msg, instance, trace) => {
        this.log('warn', 'Vue warning', {
          message: msg,
          component: instance?.$options?.name || instance?.$options?.__name,
          trace
        });
      };
    }
  }

  /**
   * Add log entry to ring buffer
   */
  log(level, message, context = {}) {
    const entry = {
      time: new Date().toISOString(),
      level,
      message,
      ...context
    };
    
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxLogs) {
      this.logBuffer.shift(); // Remove oldest
    }
  }

  /**
   * Get device diagnostics
   */
  async getDeviceInfo() {
    // Initialize platform info on first call
    await this.initPlatformInfo();
    
    const info = {
      platform: this._platform,
      isNative: this._isNative,
      userAgent: navigator.userAgent,
      memoryGB: navigator.deviceMemory || null, // Safari doesn't support deviceMemory API
      connection: navigator.connection?.effectiveType || null, // Safari doesn't support Network Information API
      online: navigator.onLine,
      screen: `${window.screen.width}x${window.screen.height}`,
    };

    // Get device-specific info on native platforms
    if (this._isNative) {
      try {
        const { Device } = await import('@capacitor/device');
        const deviceInfo = await Device.getInfo();
        info.model = deviceInfo.model;
        info.osVersion = deviceInfo.osVersion;
        info.platform = deviceInfo.platform;
      } catch (e) {
        console.warn('Could not get device info:', e);
      }
    }

    return info;
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    if (!navigator.storage?.estimate) return { available: 'unknown' };
    
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usedMB: Math.round((estimate.usage || 0) / 1024 / 1024),
        quotaMB: Math.round((estimate.quota || 0) / 1024 / 1024),
        percentUsed: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
      };
    } catch (e) {
      return { available: 'error' };
    }
  }

  /**
   * Create diagnostic report (with rate limiting check)
   */
  async createReport(context = {}) {
    // Generate error hash for deduplication (if error in context)
    const errorHash = context.error ? this.hashError(context.error) : null;
    
    // Check rate limits
    const rateCheck = this.canSendReport(errorHash);
    if (!rateCheck.allowed) {
      console.warn(`📊 Diagnostic report blocked: ${rateCheck.reason}`);
      throw new Error(`Report blocked: ${rateCheck.reason}`);
    }
    
    const [deviceInfo, storageInfo] = await Promise.all([
      this.getDeviceInfo(),
      this.getStorageInfo()
    ]);

    // Record that we're sending this report
    this.recordReportSent(errorHash);

    return {
      timestamp: new Date().toISOString(),
      appVersion: __APP_VERSION__,
      device: deviceInfo,
      storage: storageInfo,
      context,
      recentLogs: this.logBuffer.slice(-50), // Last 50 logs
      rateLimitInfo: {
        reportsThisHour: this.reportHistory.filter(t => t > Date.now() - 60 * 60 * 1000).length,
        reportsToday: this.reportHistory.length
      }
    };
  }
  
  /**
   * Get current rate limit status (for UI display)
   */
  getRateLimitStatus() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const reportsThisHour = this.reportHistory.filter(t => t > oneHourAgo).length;
    const reportsToday = this.reportHistory.length;
    
    return {
      circuitBreakerTripped: this.circuitBreakerTripped,
      reportsThisHour,
      reportsToday,
      maxPerHour: this.reportLimits.maxPerHour,
      maxPerDay: this.reportLimits.maxPerDay,
      canSend: this.canSendReport().allowed
    };
  }
}

export const diagnostics = new DiagnosticsService();
