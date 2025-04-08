/**
 * Lottie Worker Integration
 * 
 * This utility integrates the web worker infrastructure with Lottie animations
 * to offload CPU-intensive animation tasks from the main thread.
 */

import { createWorker, WorkerManager } from './webWorker';

// Create a singleton worker instance
let workerInstance: WorkerManager | null = null;

/**
 * Get the worker instance, creating it if it doesn't exist
 */
export function getLottieWorker(): WorkerManager {
  if (!workerInstance) {
    workerInstance = createWorker('/workers/main-worker.js');
  }
  return workerInstance;
}

/**
 * Interface for Lottie blurhash generation parameters
 */
export interface LottieBlurhashParams {
  src: string;
  width?: number;
  height?: number;
  componentX?: number;
  componentY?: number;
}

/**
 * Generate a blurhash for a Lottie animation using the web worker
 * 
 * @param src - URL of the Lottie JSON file
 * @param options - Blurhash generation options
 * @returns Generated blurhash string
 */
export async function generateBlurhashWithWorker(
  src: string,
  options: {
    width?: number;
    height?: number;
    componentX?: number;
    componentY?: number;
  } = {}
): Promise<string> {
  const worker = getLottieWorker();
  
  try {
    const result = await worker.sendMessage<
      LottieBlurhashParams,
      string
    >('generateBlurhash', {
      src,
      width: options.width || 32,
      height: options.height || 32,
      componentX: options.componentX || 4,
      componentY: options.componentY || 3
    });
    
    return result;
  } catch (error) {
    console.error('Failed to generate Lottie blurhash with worker:', error);
    throw error;
  }
}

/**
 * Interface for Lottie optimization parameters
 */
export interface LottieOptimizationParams {
  src: string;
  quality?: number; // 0-1 quality factor
  removeMasks?: boolean;
  removeExpressions?: boolean;
  simplifyShapes?: boolean;
  removeHiddenLayers?: boolean;
}

/**
 * Optimize a Lottie animation using the web worker
 * 
 * @param src - URL of the Lottie JSON file
 * @param options - Optimization options
 * @returns Optimized Lottie JSON data
 */
export async function optimizeLottieWithWorker(
  src: string,
  options: {
    quality?: number;
    removeMasks?: boolean;
    removeExpressions?: boolean;
    simplifyShapes?: boolean;
    removeHiddenLayers?: boolean;
  } = {}
): Promise<any> {
  const worker = getLottieWorker();
  
  try {
    const result = await worker.sendMessage<
      LottieOptimizationParams,
      any
    >('optimizeLottie', {
      src,
      quality: options.quality || 0.8,
      removeMasks: options.removeMasks !== undefined ? options.removeMasks : true,
      removeExpressions: options.removeExpressions !== undefined ? options.removeExpressions : true,
      simplifyShapes: options.simplifyShapes !== undefined ? options.simplifyShapes : true,
      removeHiddenLayers: options.removeHiddenLayers !== undefined ? options.removeHiddenLayers : true
    });
    
    return result;
  } catch (error) {
    console.error('Failed to optimize Lottie with worker:', error);
    // Return null to allow fallback to non-optimized version
    return null;
  }
}