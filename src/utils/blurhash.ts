/**
 * Blurhash utility for generating compact image placeholders
 * 
 * This utility provides functions for generating blurhash placeholders
 * for images, which are compact representations that can be used for
 * blur-up loading effects.
 * 
 * @see https://blurha.sh/
 */

import { encode, decode } from 'blurhash';
import { getImageWithFailover } from './cdnFailover';

// Types for blurhash options
interface BlurhashOptions {
  width?: number;
  height?: number;
  componentX?: number;
  componentY?: number;
}

/**
 * Generate a blurhash string for an image
 * 
 * @param src - The source URL of the image
 * @param options - Options for blurhash generation
 * @returns A blurhash string
 */
export async function generateBlurhash(
  src: string,
  options: BlurhashOptions = {}
): Promise<string> {
  try {
    // Try to use the web worker for blurhash generation
    try {
      // Dynamically import the worker integration to avoid circular dependencies
      const { generateBlurhashWithWorker } = await import('./imageWorkerIntegration');
      return await generateBlurhashWithWorker(src, options);
    } catch (workerError) {
      console.warn('Failed to use worker for blurhash generation, falling back to main thread:', workerError);
      
      // Fall back to main thread implementation if worker fails
      const {
        width = 32,
        height = 32,
        componentX = 4,
        componentY = 3
      } = options;
      
      // Get a small version of the image to generate the blurhash from
      const imageUrl = await getImageWithFailover(src, { width, height });
      
      // Fetch the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Convert the image to pixel data
      const pixels = await getPixelDataFromBuffer(buffer, width, height);
      
      // Generate the blurhash
      const hash = encode(pixels, width, height, componentX, componentY);
      
      return hash;
    }
  } catch (error) {
    console.error(`Failed to generate blurhash for ${src}:`, error);
    // Return a fallback hash for error cases
    return 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';
  }
}

/**
 * Convert an image buffer to pixel data
 * 
 * @param buffer - The image buffer
 * @param width - The width of the image
 * @param height - The height of the image
 * @returns A Uint8ClampedArray of pixel data (RGBA format)
 */
async function getPixelDataFromBuffer(
  buffer: Buffer,
  width: number,
  height: number
): Promise<Uint8ClampedArray> {
  // In a Node.js environment, we would use Sharp or another image processing library
  // In a browser environment, we can use the Canvas API
  
  if (typeof window !== 'undefined') {
    // Browser environment
    const img = new Image();
    const blob = new Blob([buffer]);
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData.data);
        
        // Clean up
        URL.revokeObjectURL(url);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    });
  } else {
    // Node.js environment - use a fallback approach
    // This is a simplified approach that doesn't actually process the image
    // In a real implementation, you would use Sharp or another library
    
    // Create a placeholder pixel array with the right dimensions
    const pixels = new Uint8ClampedArray(width * height * 4);
    
    // Sample some bytes from the buffer to create a representative color
    let r = 0, g = 0, b = 0;
    const sampleSize = Math.min(buffer.length, 1000);
    const step = Math.max(1, Math.floor(buffer.length / sampleSize));
    
    let samples = 0;
    for (let i = 0; i < buffer.length; i += step) {
      r += buffer[i % buffer.length];
      g += buffer[(i + 1) % buffer.length];
      b += buffer[(i + 2) % buffer.length];
      samples++;
    }
    
    r = Math.floor(r / samples) % 256;
    g = Math.floor(g / samples) % 256;
    b = Math.floor(b / samples) % 256;
    
    // Fill the pixel array with the average color
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = r;     // R
      pixels[i + 1] = g; // G
      pixels[i + 2] = b; // B
      pixels[i + 3] = 255; // A (fully opaque)
    }
    
    return pixels;
  }
}

/**
 * Generate a CSS background property from a blurhash
 * 
 * @param blurhash - The blurhash string
 * @param width - The width of the decoded image
 * @param height - The height of the decoded image
 * @returns A CSS background property value
 */
export function blurhashToCssGradient(blurhash: string, width = 32, height = 32): string {
  try {
    // Decode the blurhash to pixels
    const pixels = decode(blurhash, width, height);
    
    // Create a canvas to convert pixels to a data URL
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Create an ImageData object from the pixels
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // The decoded pixels are in RGB format, we need to convert to RGBA
    for (let i = 0; i < pixels.length / 3; i++) {
      data[i * 4 + 0] = pixels[i * 3 + 0]; // R
      data[i * 4 + 1] = pixels[i * 3 + 1]; // G
      data[i * 4 + 2] = pixels[i * 3 + 2]; // B
      data[i * 4 + 3] = 255; // A (fully opaque)
    }
    
    // Put the image data on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to a data URL and use as a background image
    const dataURL = canvas.toDataURL('image/png');
    return `url(${dataURL})`;
  } catch (error) {
    console.error(`Failed to convert blurhash to CSS gradient:`, error);
    
    // Fallback to a gradient based on the hash
    // Extract some "entropy" from the hash to create colors
    const hashSum = blurhash.split('').reduce((sum, char) => {
      return sum + char.charCodeAt(0);
    }, 0);
    
    // Generate colors based on the hash
    const hue1 = hashSum % 360;
    const hue2 = (hue1 + 40) % 360;
    const hue3 = (hue1 + 200) % 360;
    
    // Create a linear gradient with these colors
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%), hsl(${hue3}, 80%, 40%))`;
  }
}

/**
 * Generate a data URL from a blurhash
 * 
 * @param blurhash - The blurhash string
 * @param width - The width of the decoded image
 * @param height - The height of the decoded image
 * @returns A data URL representing the blurhash
 */
export function blurhashToDataURL(blurhash: string, width = 32, height = 32): string {
  try {
    // Decode the blurhash to pixels
    const pixels = decode(blurhash, width, height);
    
    // Create a canvas to convert pixels to a data URL
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // Create an ImageData object from the pixels
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    
    // The decoded pixels are in RGB format, we need to convert to RGBA
    for (let i = 0; i < pixels.length / 3; i++) {
      data[i * 4 + 0] = pixels[i * 3 + 0]; // R
      data[i * 4 + 1] = pixels[i * 3 + 1]; // G
      data[i * 4 + 2] = pixels[i * 3 + 2]; // B
      data[i * 4 + 3] = 255; // A (fully opaque)
    }
    
    // Put the image data on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Convert to a data URL
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error(`Failed to convert blurhash to data URL:`, error);
    
    // Fallback to a simple SVG with a color derived from the hash
    const color = blurhash.substring(2, 8) || '7EC0EE';
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='${width}' height='${height}' fill='%23${color}'/%3E%3C/svg%3E`;
  }
}

/**
 * Check if blurhash is supported in the current environment
 * 
 * @returns Boolean indicating if blurhash can be used
 */
export function isBlurhashSupported(): boolean {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof document.createElement === 'function';
}

/**
 * Generate a CSS background value from a blurhash that works in both server and client environments
 * 
 * @param blurhash - The blurhash string
 * @returns A CSS background value
 */
export function getBlurhashCSS(blurhash: string): string {
  // For server-side rendering, return a simple gradient
  if (typeof window === 'undefined') {
    // Extract some "entropy" from the hash to create colors
    const hashSum = blurhash.split('').reduce((sum, char) => {
      return sum + char.charCodeAt(0);
    }, 0);
    
    // Generate colors based on the hash
    const hue1 = hashSum % 360;
    const hue2 = (hue1 + 40) % 360;
    
    // Create a linear gradient with these colors
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 60%), hsl(${hue2}, 80%, 50%))`;
  }
  
  // For client-side, use the proper blurhash conversion
  return blurhashToCssGradient(blurhash);
}