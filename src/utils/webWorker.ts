/**
 * Web Worker Utility
 * 
 * This utility provides a wrapper around Web Workers to simplify their usage
 * for intensive operations like image processing, data manipulation, and complex calculations.
 * 
 * Features:
 * - Easy creation and management of web workers
 * - Type-safe messaging between main thread and worker
 * - Error handling and automatic termination
 * - Fallback for browsers that don't support web workers
 */

// Type definitions for worker messages
export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  payload: T;
}

export interface WorkerResponse<T = any> {
  id: string;
  type: 'success' | 'error';
  payload: T;
}

// Worker manager class
export class WorkerManager {
  private worker: Worker | null = null;
  private callbacks: Map<string, (response: WorkerResponse) => void> = new Map();
  private workerUrl: string;
  private isSupported: boolean;

  /**
   * Create a new worker manager
   * @param workerScript Path to the worker script
   */
  constructor(workerScript: string) {
    this.workerUrl = workerScript;
    this.isSupported = typeof Worker !== 'undefined';
    
    if (this.isSupported) {
      this.initWorker();
    } else {
      console.warn('Web Workers are not supported in this browser. Falling back to main thread execution.');
    }
  }

  /**
   * Initialize the web worker
   */
  private initWorker(): void {
    try {
      this.worker = new Worker(this.workerUrl, { type: 'module' });
      
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const callback = this.callbacks.get(response.id);
        
        if (callback) {
          callback(response);
          this.callbacks.delete(response.id);
        }
      };

      this.worker.onerror = (error) => {
        console.error('Web Worker error:', error);
        this.handleWorkerError();
      };
    } catch (error) {
      console.error('Failed to initialize Web Worker:', error);
      this.isSupported = false;
    }
  }

  /**
   * Handle worker errors by terminating and reinitializing
   */
  private handleWorkerError(): void {
    // Terminate the current worker
    this.terminate();
    
    // Reinitialize with a new worker
    this.initWorker();
    
    // Reject all pending callbacks
    this.callbacks.forEach((callback) => {
      callback({
        id: 'error',
        type: 'error',
        payload: new Error('Worker terminated due to an error')
      });
    });
    
    this.callbacks.clear();
  }

  /**
   * Send a message to the worker and get a promise for the response
   * @param type Message type
   * @param payload Message payload
   * @returns Promise that resolves with the worker response
   */
  public sendMessage<T, R>(type: string, payload: T): Promise<R> {
    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substring(2, 11);
      
      const handleResponse = (response: WorkerResponse) => {
        if (response.type === 'success') {
          resolve(response.payload as R);
        } else {
          reject(response.payload);
        }
      };
      
      if (this.isSupported && this.worker) {
        this.callbacks.set(id, handleResponse);
        
        const message: WorkerMessage<T> = {
          id,
          type,
          payload
        };
        
        this.worker.postMessage(message);
      } else {
        // Fallback to main thread execution
        this.executeOnMainThread<T, R>(type, payload)
          .then(result => resolve(result))
          .catch(error => reject(error));
      }
    });
  }

  /**
   * Execute the operation on the main thread as a fallback
   * @param type Operation type
   * @param payload Operation payload
   * @returns Promise with the operation result
   */
  private async executeOnMainThread<T, R>(type: string, payload: T): Promise<R> {
    try {
      // Dynamically import the fallback implementation
      const { executeWorkerTask } = await import('./webWorkerFallback');
      return await executeWorkerTask<T, R>(type, payload);
    } catch (error) {
      throw new Error(`Failed to execute on main thread: ${error}`);
    }
  }

  /**
   * Terminate the worker
   */
  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Helper function to create a worker manager
export function createWorker(workerScript: string): WorkerManager {
  return new WorkerManager(workerScript);
}