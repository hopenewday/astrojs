/**
 * CDN Health Monitor
 * 
 * This utility provides a health monitoring service for the CDN failover system.
 * It periodically checks the status of ImageKit and updates the global status.
 * When ImageKit is unavailable, the system automatically routes to Tebi S3 storage.
 */

import { checkImageKitStatus } from './cdnFailover';

interface HealthMonitorConfig {
  checkInterval: number; // milliseconds
  maxBackoff: number;    // maximum backoff time in milliseconds
  retryCount: number;    // number of retries before considering a service down
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

// Default configuration
const defaultConfig: HealthMonitorConfig = {
  checkInterval: 60000,  // Check every minute by default
  maxBackoff: 3600000,   // Maximum backoff of 1 hour
  retryCount: 3,         // Retry 3 times before considering a service down
  logLevel: 'warn',      // Default log level
};

// Health monitor state
let monitorState = {
  isRunning: false,
  intervalId: null as number | null,
  lastCheck: 0,
  consecutiveFailures: 0,
  config: { ...defaultConfig },
  metrics: {
    totalChecks: 0,
    successfulChecks: 0,
    failedChecks: 0,
    lastStatus: true,
    uptime: 100, // percentage
    lastStatusChange: Date.now(),
  },
};

/**
 * Log a message with the appropriate level
 */
function log(level: 'error' | 'warn' | 'info' | 'debug', message: string, data?: any): void {
  if (['error', 'warn'].includes(level) || 
      (level === 'info' && ['info', 'debug'].includes(monitorState.config.logLevel)) ||
      (level === 'debug' && monitorState.config.logLevel === 'debug')) {
    
    const logMessage = `[CDN Health Monitor] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, data || '');
        break;
      case 'warn':
        console.warn(logMessage, data || '');
        break;
      case 'info':
        console.info(logMessage, data || '');
        break;
      case 'debug':
        console.debug(logMessage, data || '');
        break;
    }
  }
}

/**
 * Calculate the current backoff time based on consecutive failures
 */
function calculateBackoff(): number {
  const { checkInterval, maxBackoff } = monitorState.config;
  const backoff = Math.min(
    maxBackoff,
    checkInterval * Math.pow(2, monitorState.consecutiveFailures)
  );
  
  // Add jitter to prevent thundering herd problem
  return Math.floor(backoff * (0.75 + Math.random() * 0.5));
}

/**
 * Perform a health check on the CDN services
 */
async function performHealthCheck(): Promise<void> {
  monitorState.lastCheck = Date.now();
  monitorState.metrics.totalChecks++;
  
  try {
    // Check ImageKit status
    const isAvailable = await checkImageKitStatus();
    
    // Update metrics
    if (isAvailable) {
      monitorState.consecutiveFailures = 0;
      monitorState.metrics.successfulChecks++;
      
      // Log status change if it was previously down
      if (!monitorState.metrics.lastStatus) {
        const downtime = Date.now() - monitorState.metrics.lastStatusChange;
        log('info', `ImageKit is back online after ${Math.floor(downtime / 1000)}s downtime`);
        monitorState.metrics.lastStatus = true;
        monitorState.metrics.lastStatusChange = Date.now();
      }
    } else {
      monitorState.consecutiveFailures++;
      monitorState.metrics.failedChecks++;
      
      // Log status change if it was previously up
      if (monitorState.metrics.lastStatus) {
        log('warn', `ImageKit is down, failing over to Tebi S3 storage`);
        monitorState.metrics.lastStatus = false;
        monitorState.metrics.lastStatusChange = Date.now();
      }
    }
    
    // Calculate uptime percentage
    monitorState.metrics.uptime = Math.round(
      (monitorState.metrics.successfulChecks / monitorState.metrics.totalChecks) * 100
    );
    
    // Adjust check interval based on consecutive failures
    if (monitorState.consecutiveFailures > 0) {
      const backoff = calculateBackoff();
      log('info', `Adjusting check interval due to failures: ${backoff}ms`);
      
      // Restart the interval with the new backoff
      if (monitorState.intervalId !== null) {
        clearInterval(monitorState.intervalId);
      }
      
      monitorState.intervalId = setInterval(performHealthCheck, backoff) as unknown as number;
    }
    
  } catch (error) {
    monitorState.consecutiveFailures++;
    monitorState.metrics.failedChecks++;
    log('error', 'Health check failed with error:', error);
  }
}

/**
 * Start the health monitor service
 */
export function startHealthMonitor(config?: Partial<HealthMonitorConfig>): void {
  // Update configuration with any provided options
  monitorState.config = { ...defaultConfig, ...config };
  
  // Don't start if already running
  if (monitorState.isRunning) {
    log('warn', 'Health monitor is already running');
    return;
  }
  
  log('info', 'Starting CDN health monitor', monitorState.config);
  
  // Perform an initial health check
  performHealthCheck();
  
  // Set up the interval for regular checks
  monitorState.intervalId = setInterval(
    performHealthCheck, 
    monitorState.config.checkInterval
  ) as unknown as number;
  
  monitorState.isRunning = true;
}

/**
 * Stop the health monitor service
 */
export function stopHealthMonitor(): void {
  if (!monitorState.isRunning) {
    log('warn', 'Health monitor is not running');
    return;
  }
  
  log('info', 'Stopping CDN health monitor');
  
  if (monitorState.intervalId !== null) {
    clearInterval(monitorState.intervalId);
    monitorState.intervalId = null;
  }
  
  monitorState.isRunning = false;
}

/**
 * Get the current health monitor metrics
 */
export function getHealthMetrics() {
  return {
    ...monitorState.metrics,
    isRunning: monitorState.isRunning,
    lastCheck: new Date(monitorState.lastCheck).toISOString(),
    consecutiveFailures: monitorState.consecutiveFailures,
    config: { ...monitorState.config },
  };
}