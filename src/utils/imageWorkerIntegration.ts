/**
 * Image Worker Integration
 * 
 * This utility provides integration with web workers for CPU-intensive
 * image processing operations, keeping the main thread responsive.
 */

// Types for worker operations
interface WorkerRequest {
  id: string;
  type: string;
  payload: any;
}

interface WorkerResponse {
  id: string;
  result?: any;
  error?: string;
  processed?: boolean;
}

interface BlurhashOptions {
  width?: number;
  height?: number;
  componentX?: number;
  componentY?: number;
}

interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  aspectRatio?: string;
  crop?: 'maintain_ratio' | 'force' | 'at_least' | 'at_max';
  focus?: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
}

/**
 * Generate a unique ID for worker requests
 * @returns A unique ID string
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Create a worker instance or return an existing one
 * @returns A web worker instance
 */
function getWorker(): Worker {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('Web workers are only available in browser environments');
  }
  
  // Check if the browser supports web workers
  if (!window.Worker) {
    throw new Error('Web workers are not supported in this browser');
  }
  
  // Create a new worker
  return new Worker('/workers/main-worker.js');
}

/**
 * Send a request to the worker and wait for a response
 * @param type - The type of operation to perform
 * @param payload - The operation payload
 * @returns The worker response
 */
async function sendWorkerRequest(type: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      // Get a worker instance
      const worker = getWorker();
      
      // Generate a unique ID for this request
      const id = generateRequestId();
      
      // Set up the message handler
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        
        // Check if this is the response we're waiting for
        if (response.id === id) {
          // Clean up the worker
          worker.terminate();
          
          // Check for errors
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.result);
          }
        }
      };
      
      // Handle worker errors
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      // Send the request to the worker
      const request: WorkerRequest = { id, type, payload };
      worker.postMessage(request);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate a blurhash for an image using a web worker
 * @param src - The source URL of the image
 * @param options - Options for blurhash generation
 * @returns A blurhash string
 */
export async function generateBlurhashWithWorker(
  src: string,
  options: BlurhashOptions = {}
): Promise<string> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('generateBlurhash', {
      src,
      ...options
    });
    
    return result;
  } catch (error) {
    console.error('Failed to generate blurhash with worker:', error);
    throw error;
  }
}

/**
 * Decode a blurhash to pixel data using a web worker
 * @param blurhash - The blurhash string to decode
 * @param width - The width of the output image
 * @param height - The height of the output image
 * @returns A Uint8ClampedArray of pixel data
 */
export async function decodeBlurhashWithWorker(
  blurhash: string,
  width: number = 32,
  height: number = 32
): Promise<Uint8ClampedArray> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('decodeBlurhash', {
      blurhash,
      width,
      height
    });
    
    return new Uint8ClampedArray(result);
  } catch (error) {
    console.error('Failed to decode blurhash with worker:', error);
    throw error;
  }
}

/**
 * Process an image using a web worker
 * @param src - The source URL of the image
 * @param operation - The operation to perform (resize, crop, etc.)
 * @param options - Options for the operation
 * @returns The processed image data
 */
export async function processImageWithWorker(
  src: string,
  operation: string,
  options: ImageProcessingOptions = {}
): Promise<{ processed: boolean; data?: Uint8Array; result?: string }> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('processImage', {
      src,
      operation,
      options
    });
    
    // Check if the worker successfully processed the image
    if (result && result.processed) {
      return {
        processed: true,
        data: result.data,
        result: result.url
      };
    }
    
    // If the worker didn't process the image, return a failure
    return { processed: false };
  } catch (error) {
    console.error('Failed to process image with worker:', error);
    return { processed: false };
  }
}

/**
 * Detect image format support using a web worker
 * @returns An object indicating which formats are supported
 */
export async function detectImageFormatWithWorker(): Promise<{
  webp: boolean;
  avif: boolean;
  jpeg2000: boolean;
}> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('detectFormats', {});
    
    return result;
  } catch (error) {
    console.error('Failed to detect image formats with worker:', error);
    // Return conservative defaults
    return {
      webp: true,  // Most browsers support WebP now
      avif: false, // Be conservative about AVIF
      jpeg2000: false
    };
  }
}

/**
 * Calculate physics-based animation values using a web worker
 * @param properties - The properties to animate
 * @param params - Parameters for the physics simulation
 * @param duration - Animation duration in seconds
 * @param steps - Number of steps to calculate
 * @returns Calculated animation values for each property
 */
export async function calculatePhysicsWithWorker(
  properties: string[],
  params: Record<string, any>,
  duration: number = 1,
  steps: number = 60
): Promise<Record<string, number[]>> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('calculatePhysics', {
      properties,
      params,
      duration,
      steps
    });
    
    return result;
  } catch (error) {
    console.error('Failed to calculate physics with worker:', error);
    throw error;
  }
}

/**
 * Calculate points along an SVG path using a web worker
 * @param path - The SVG path string
 * @param points - Number of points to calculate
 * @returns An array of points along the path
 */
export async function calculatePathWithWorker(
  path: string,
  points: number = 100
): Promise<Array<{ x: number; y: number }>> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('calculatePath', {
      path,
      points
    });
    
    return result;
  } catch (error) {
    console.error('Failed to calculate path with worker:', error);
    throw error;
  }
}

/**
 * Transform data using a web worker
 * @param data - The data to transform
 * @param transformation - The transformation to apply
 * @param options - Options for the transformation
 * @returns The transformed data
 */
export async function transformDataWithWorker<T, R>(
  data: T[],
  transformation: 'filter' | 'map' | 'sort',
  options: Record<string, any>
): Promise<R[]> {
  try {
    // Send the request to the worker
    const result = await sendWorkerRequest('transformData', {
      data,
      transformation,
      options
    });
    
    return result;
  } catch (error) {
    console.error(`Failed to ${transformation} data with worker:`, error);
    throw error;
  }
}