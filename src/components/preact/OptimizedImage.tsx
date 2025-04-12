import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  sizes?: string;
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  blurhash?: boolean;
  priority?: boolean;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  objectPosition?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage - A Preact component for optimized image loading
 * 
 * This component is designed to work with Astro's hybrid rendering approach and uses
 * progressive enhancement for optimal performance. It provides blur-up loading,
 * responsive images, and format detection.
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  decoding = 'async',
  sizes = '100vw',
  quality = 80,
  format = 'auto',
  blurhash = true,
  priority = false,
  objectFit = 'cover',
  objectPosition = 'center',
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [supportsAvif, setSupportsAvif] = useState(false);
  const [supportsWebp, setSupportsWebp] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Detect image format support on mount
  useEffect(() => {
    // Check for AVIF support
    const checkAvif = new Image();
    checkAvif.onload = () => setSupportsAvif(true);
    checkAvif.onerror = () => setSupportsAvif(false);
    checkAvif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
    
    // Check for WebP support
    const checkWebp = new Image();
    checkWebp.onload = () => setSupportsWebp(true);
    checkWebp.onerror = () => setSupportsWebp(false);
    checkWebp.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==';
    
    // Check if image is already loaded (for SSR hydration)
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }
  }, []);
  
  // Determine the best image format based on browser support
  const getBestImageFormat = () => {
    if (format !== 'auto') return format;
    if (supportsAvif) return 'avif';
    if (supportsWebp) return 'webp';
    return 'jpg';
  };
  
  // Generate ImageKit URL with transformations
  const getOptimizedImageUrl = (imageSrc: string, imgWidth?: number, imgFormat?: string) => {
    // Check if the image is already an absolute URL
    if (imageSrc.startsWith('http')) {
      return imageSrc;
    }
    
    // For demo purposes, we'll just return the original src
    // In a real implementation, this would connect to ImageKit or another image service
    return imageSrc;
  };
  
  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!width) return undefined;
    
    const widths = [width / 2, width, width * 2].filter(w => w >= 100 && w <= 3000);
    const bestFormat = getBestImageFormat();
    
    return widths
      .map(w => `${getOptimizedImageUrl(src, Math.round(w), bestFormat)} ${Math.round(w)}w`)
      .join(', ');
  };
  
  // Handle image load event
  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };
  
  // Handle image error event
  const handleError = () => {
    setIsError(true);
    if (onError) onError();
  };
  
  return (
    <div 
      className={`optimized-image-container relative overflow-hidden ${className}`}
      style={{
        aspectRatio: width && height ? `${width} / ${height}` : 'auto',
      }}
    >
      {/* Placeholder or blur hash while loading */}
      {!isLoaded && blurhash && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={getOptimizedImageUrl(src, width, getBestImageFormat())}
        srcSet={generateSrcSet()}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding={decoding}
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          objectFit,
          objectPosition,
        }}
      />
      
      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="sr-only">Image failed to load</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;