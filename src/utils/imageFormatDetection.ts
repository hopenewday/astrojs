/**
 * Image Format Detection Utility
 * 
 * This utility provides client-side detection of image format support,
 * particularly focusing on modern formats like AVIF and WebP.
 */

/**
 * Detect if the browser supports AVIF format
 * @returns Promise that resolves to true if AVIF is supported
 */
export async function detectAvifSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if we've already tested and cached the result
  const cachedResult = localStorage.getItem('avif-support');
  if (cachedResult !== null) {
    return cachedResult === 'true';
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Cache the result for future checks
      localStorage.setItem('avif-support', 'true');
      resolve(true);
    };
    img.onerror = () => {
      // Cache the result for future checks
      localStorage.setItem('avif-support', 'false');
      resolve(false);
    };
    // This is a tiny AVIF image
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Detect if the browser supports WebP format
 * @returns Promise that resolves to true if WebP is supported
 */
export async function detectWebPSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  // Check if we've already tested and cached the result
  const cachedResult = localStorage.getItem('webp-support');
  if (cachedResult !== null) {
    return cachedResult === 'true';
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Cache the result for future checks
      localStorage.setItem('webp-support', 'true');
      resolve(true);
    };
    img.onerror = () => {
      // Cache the result for future checks
      localStorage.setItem('webp-support', 'false');
      resolve(false);
    };
    // This is a tiny WebP image
    img.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
  });
}

/**
 * Get the best supported image format for the current browser
 * @returns Promise that resolves to the best supported format ('avif', 'webp', or 'jpg')
 */
export async function getBestSupportedFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  try {
    // Try to use the web worker for format detection
    const { detectImageFormatWithWorker } = await import('./imageWorkerIntegration');
    return await detectImageFormatWithWorker();
  } catch (workerError) {
    console.warn('Failed to use worker for format detection, falling back to main thread:', workerError);
    
    // Fall back to main thread implementation if worker fails
    // Check AVIF support first as it's the most efficient format
    if (await detectAvifSupport()) {
      return 'avif';
    }
    
    // Fall back to WebP if AVIF is not supported
    if (await detectWebPSupport()) {
      return 'webp';
    }
    
    // Fall back to JPEG if neither AVIF nor WebP is supported
    return 'jpg';
  }
}

/**
 * Initialize format detection on page load and store results
 * This can be called early in the page lifecycle to have results ready
 * when images need to be loaded
 */
export function initFormatDetection(): void {
  if (typeof window === 'undefined') return;
  
  // Only run detection if we haven't already cached the results
  if (localStorage.getItem('format-detection-initialized') !== 'true') {
    // Run detections in parallel
    Promise.all([
      detectAvifSupport(),
      detectWebPSupport()
    ]).then(() => {
      localStorage.setItem('format-detection-initialized', 'true');
    });
  }
}