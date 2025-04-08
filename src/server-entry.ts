/**
 * Server Entry Point
 * 
 * This file initializes server-side services when the application starts.
 * It's responsible for starting background services like the CDN health monitor.
 */

import { startHealthMonitor } from './utils/cdnHealthMonitor';

// Start the CDN health monitor with custom configuration
startHealthMonitor({
  // Check every 2 minutes in production, more frequently in development
  checkInterval: import.meta.env.PROD ? 120000 : 30000,
  // Log level based on environment
  logLevel: import.meta.env.PROD ? 'warn' : 'debug',
});

console.info('[Server] CDN health monitoring service initialized');

// Export a dummy function to make this a valid module
export function getServerStatus() {
  return {
    status: 'running',
    services: ['cdn-health-monitor'],
    startTime: new Date().toISOString()
  };
}