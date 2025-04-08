/**
 * Animation Worker Integration
 * 
 * This utility integrates the web worker infrastructure with animation calculations
 * to offload CPU-intensive animation tasks from the main thread.
 */

import { createWorker, WorkerManager } from './webWorker';

// Create a singleton worker instance
let workerInstance: WorkerManager | null = null;

/**
 * Get the worker instance, creating it if it doesn't exist
 */
export function getAnimationWorker(): WorkerManager {
  if (!workerInstance) {
    workerInstance = createWorker('/workers/main-worker.js');
  }
  return workerInstance;
}

/**
 * Interface for animation calculation parameters
 */
export interface AnimationCalculationParams {
  type: 'path' | 'transform' | 'physics' | 'spring';
  duration?: number;
  points?: Array<{ x: number; y: number }>;
  properties?: string[];
  from?: Record<string, number>;
  to?: Record<string, number>;
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: Record<string, number>;
  gravity?: number;
  friction?: number;
}

/**
 * Calculate animation values using the web worker
 * 
 * @param params - Animation calculation parameters
 * @returns Calculated animation values
 */
export async function calculateAnimationWithWorker(
  params: AnimationCalculationParams
): Promise<any> {
  const worker = getAnimationWorker();
  
  try {
    const result = await worker.sendMessage<
      AnimationCalculationParams,
      any
    >('animationCalculation', params);
    
    return result;
  } catch (error) {
    console.error('Failed to calculate animation with worker:', error);
    throw error;
  }
}

/**
 * Calculate a motion path using the web worker
 * 
 * @param points - Array of points defining the path
 * @param steps - Number of steps to calculate
 * @returns Array of points along the path
 */
export async function calculatePathWithWorker(
  points: Array<{ x: number; y: number }>,
  steps: number = 60
): Promise<Array<{ x: number; y: number }>> {
  return calculateAnimationWithWorker({
    type: 'path',
    points,
    duration: steps
  });
}

/**
 * Calculate physics-based animation values using the web worker
 * 
 * @param properties - Properties to animate
 * @param params - Physics parameters
 * @returns Calculated animation values
 */
export async function calculatePhysicsWithWorker(
  properties: string[],
  params: {
    from: Record<string, number>;
    to?: Record<string, number>;
    stiffness?: number;
    damping?: number;
    mass?: number;
    velocity?: Record<string, number>;
    gravity?: number;
    friction?: number;
    steps?: number;
  }
): Promise<Array<Record<string, number>>> {
  return calculateAnimationWithWorker({
    type: 'physics',
    properties,
    ...params
  });
}