import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

interface ScrollAnimationProps {
  children: preact.ComponentChildren;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out' | 'none';
  duration?: number;
  delay?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  rootMargin?: string;
  easing?: string;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

/**
 * ScrollAnimation - A Preact component for scroll-triggered animations
 * 
 * This component is designed to work with Astro's hybrid rendering approach and uses
 * the Intersection Observer API for performance. It provides various animation effects
 * that trigger when elements enter the viewport.
 */
const ScrollAnimation = ({
  children,
  animation = 'fade-up',
  duration = 0.6,
  delay = 0,
  threshold = 0.1,
  once = true,
  className = '',
  rootMargin = '0px',
  easing = 'cubic-bezier(0.25, 0.1, 0.25, 1.0)',
  staggerChildren = false,
  staggerDelay = 0.1
}: ScrollAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Initialize animation on mount
  useEffect(() => {
    setIsInitialized(true);
    
    // Skip animation if disabled
    if (animation === 'none') {
      setIsVisible(true);
      return;
    }
    
    // Create intersection observer
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );
    
    // Observe container element
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [animation, once, rootMargin, threshold]);
  
  // Apply staggered animation to children if enabled
  useEffect(() => {
    if (!staggerChildren || !isVisible || !containerRef.current) return;
    
    const childElements = containerRef.current.children;
    
    Array.from(childElements).forEach((child, index) => {
      const staggeredDelay = delay + (index * staggerDelay);
      
      (child as HTMLElement).style.transitionDelay = `${staggeredDelay}s`;
      (child as HTMLElement).style.transitionDuration = `${duration}s`;
      (child as HTMLElement).style.transitionTimingFunction = easing;
      
      // Add visible class with slight delay to ensure transition works
      setTimeout(() => {
        (child as HTMLElement).classList.add('is-visible');
      }, 10);
    });
  }, [isVisible, staggerChildren, staggerDelay, delay, duration, easing]);
  
  // Get animation CSS classes
  const getAnimationClasses = () => {
    if (animation === 'none') return '';
    
    const baseClasses = 'transition-all';
    const durationClass = `duration-${Math.round(duration * 1000)}`;
    
    const animationClasses: Record<string, string> = {
      'fade-up': 'translate-y-8 opacity-0',
      'fade-down': 'translate-y-[-2rem] opacity-0',
      'fade-left': 'translate-x-[-2rem] opacity-0',
      'fade-right': 'translate-x-8 opacity-0',
      'zoom-in': 'scale-95 opacity-0',
      'zoom-out': 'scale-105 opacity-0'
    };
    
    return `${baseClasses} ${durationClass} ${isVisible ? '' : animationClasses[animation] || ''}`;
  };
  
  // Generate inline styles for animation
  const getAnimationStyles = () => {
    const styles: Record<string, string> = {
      transitionDelay: `${delay}s`,
      transitionTimingFunction: easing
    };
    
    return styles;
  };
  
  return (
    <div
      ref={containerRef}
      className={`scroll-animation ${className} ${getAnimationClasses()} ${isVisible ? 'is-visible' : ''}`}
      style={getAnimationStyles()}
      data-animation={animation}
      data-initialized={isInitialized}
    >
      {children}
    </div>
  );
};

export default ScrollAnimation;