/**
 * Image Worker Integration
 * 
 * This utility integrates the web worker infrastructure with image processing operations
 * to offload CPU-intensive tasks from the main thread.
 */

import { createWorker, WorkerManager } from './webWorker';
import { OptimizationOptions } from './imageOptimizer';
import { ImageKitOptions } from './imageHelpers';

// Create a singleton worker instance
let workerInstance: WorkerManager | null = null;

/**
 * Get the worker instance, creating it if it doesn't exist
 */
export function getImageWorker(): WorkerManager {
  if (!workerInstance) {
    workerInstance = createWorker('/workers/main-worker.js');
  }
  return workerInstance;
}

/**
 * Generate a blurhash using the web worker
 * 
 * @param src - The source URL of the image
 * @param options - Options for blurhash generation
 * @returns A blurhash string
 */
export async function generateBlurhashWithWorker(
  src: string,
  options: { width?: number; height?: number; componentX?: number; componentY?: number } = {}
): Promise<string> {
  const worker = getImageWorker();
  
  try {
    const result = await worker.sendMessage<
      { src: string; options: typeof options },
      string
    >('generateBlurhash', { src, options });
    
    return result;
  } catch (error) {
    console.error(`Failed to generate blurhash with worker for ${src}:`, error);
    // Return a fallback hash for error cases
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
  }
}

/**
 * Process an image using the web worker
 * 
 * @param src - The source URL of the image
 * @param operation - The operation to perform (resize, crop, filter, etc.)
 * @param options - Options for the operation
 * @returns The processed image data
 */
export async function processImageWithWorker(
  src: string,
  operation: 'resize' | 'crop' | 'filter' | 'transform',
  options: OptimizationOptions
): Promise<any> {
  const worker = getImageWorker();
  
  try {
    const result = await worker.sendMessage<
      { operation: string; imageData: { src: string; options: OptimizationOptions } },
      any
    >('imageProcessing', {
      operation,
      imageData: { src, options }
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to process image with worker for ${src}:`, error);
    throw error;
  }
}

/**
 * Transform data using the web worker
 * 
 * @param data - The data to transform
 * @param transformations - The transformations to apply
 * @returns The transformed data
 */
export async function transformDataWithWorker<T, R>(
  data: T[],
  transformations: Array<{
    type: 'filter' | 'map' | 'sort' | 'group';
    predicate?: string;
    mapper?: string;
    comparator?: string;
    keySelector?: string;
  }>
): Promise<R> {
  const worker = getImageWorker();
  
  try {
    const result = await worker.sendMessage<
      { data: T[]; transformations: typeof transformations },
      R
    >('dataTransformation', { data, transformations });
    
    return result;
  } catch (error) {
    console.error('Failed to transform data with worker:', error);
    throw error;
  }
}

/**
 * Detect image format support using the web worker
 * 
 * @returns The best supported image format
 */
export async function detectImageFormatWithWorker(): Promise<'avif' | 'webp' | 'jpg'> {
  const worker = getImageWorker();
  
  try {
    const result = await worker.sendMessage<
      void,
      'avif' | 'webp' | 'jpg'
    >('detectImageFormat', undefined);
    
    return result;
  } catch (error) {
    console.error('Failed to detect image format with worker:', error);
    // Fall back to jpg as the safest option
    return 'jpg';
  }
}