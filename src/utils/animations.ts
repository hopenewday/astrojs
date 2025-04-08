/**
 * Animation Utilities
 * 
 * This utility provides reusable animation functions using GSAP
 * for complex UI interactions, scroll-triggered animations, and page transitions.
 * 
 * Performance-intensive calculations are offloaded to web workers when possible.
 */

// Import GSAP and its plugins
// These will be loaded dynamically to avoid issues with SSR
let gsap: any;
let ScrollTrigger: any;
let Observer: any;

// Import worker integration for offloading calculations
import { calculatePathWithWorker, calculatePhysicsWithWorker } from './animationWorkerIntegration';

// Flag to track initialization status
let isInitialized = false;

/**
 * Initialize GSAP and its plugins
 * This should be called client-side only
 */
export async function initAnimations() {
  if (typeof window === 'undefined' || isInitialized) return;
  
  try {
    // Dynamically import GSAP and plugins
    const gsapModule = await import('gsap');
    gsap = gsapModule.gsap;
    
    // Import ScrollTrigger plugin
    const scrollTriggerModule = await import('gsap/ScrollTrigger');
    ScrollTrigger = scrollTriggerModule.ScrollTrigger;
    
    // Import Observer plugin
    const observerModule = await import('gsap/Observer');
    Observer = observerModule.Observer;
    
    // Register plugins
    gsap.registerPlugin(ScrollTrigger, Observer);
    
    // Set initialization flag
    isInitialized = true;
    
    // Configure default settings
    gsap.config({
      autoSleep: 60,
      force3D: true,
      nullTargetWarn: false,
    });
    
    // Initialize ScrollTrigger with defaults
    ScrollTrigger.config({
      // Tolerance in pixels for inaccuracy in intersections
      tolerance: 0,
      // Limit the number of times the update is triggered per second
      limitCallbacks: true,
    });
    
    // Set up match media for responsive animations
    setupResponsiveAnimations();
    
    console.log('GSAP animation system initialized');
  } catch (error) {
    console.error('Failed to initialize GSAP:', error);
  }
}

/**
 * Set up responsive animations using GSAP's matchMedia
 */
function setupResponsiveAnimations() {
  if (!gsap || !ScrollTrigger) return;
  
  // Create responsive contexts
  const mm = gsap.matchMedia();
  
  // Desktop animations (min-width: 1024px)
  mm.add('(min-width: 1024px)', () => {
    // Desktop-specific animations can be initialized here
    // These will be automatically cleaned up when the media query doesn't match
  });
  
  // Tablet animations (min-width: 768px) and (max-width: 1023px)
  mm.add('(min-width: 768px) and (max-width: 1023px)', () => {
    // Tablet-specific animations
  });
  
  // Mobile animations (max-width: 767px)
  mm.add('(max-width: 767px)', () => {
    // Mobile-specific animations
  });
}

/**
 * Create a fade-in animation for elements as they enter the viewport
 * @param selector CSS selector for target elements
 * @param options Animation options
 */
export function createFadeInAnimation(selector: string, options: {
  duration?: number;
  delay?: number;
  stagger?: number;
  threshold?: number; // 0-1, percentage of element visible to trigger
  from?: 'bottom' | 'top' | 'left' | 'right' | 'none';
  distance?: number; // pixels to animate from
} = {}) {
  if (!gsap || !ScrollTrigger) {
    console.warn('GSAP not initialized. Call initAnimations() first.');
    return;
  }
  
  const {
    duration = 0.8,
    delay = 0,
    stagger = 0.1,
    threshold = 0.2,
    from = 'bottom',
    distance = 50,
  } = options;
  
  // Set up the animation properties
  const animProps: any = {
    opacity: 0,
    duration,
    delay,
  };
  
  // Add transform based on the 'from' direction
  if (from !== 'none') {
    switch (from) {
      case 'bottom':
        animProps.y = distance;
        break;
      case 'top':
        animProps.y = -distance;
        break;
      case 'left':
        animProps.x = -distance;
        break;
      case 'right':
        animProps.x = distance;
        break;
    }
  }
  
  // Get all elements matching the selector
  const elements = document.querySelectorAll(selector);
  
  // Create a timeline for each element
  elements.forEach((element, index) => {
    // Create a timeline that's paused initially
    const tl = gsap.timeline({
      paused: true,
      defaults: {
        ease: 'power2.out',
      },
    });
    
    // Add the animation to the timeline
    tl.fromTo(
      element,
      animProps,
      {
        opacity: 1,
        x: 0,
        y: 0,
        delay: stagger * index,
        clearProps: 'all', // Clean up after animation completes
      }
    );
    
    // Create a ScrollTrigger for this element
    ScrollTrigger.create({
      trigger: element,
      start: `top ${(1 - threshold) * 100}%`, // e.g., "top 80%"
      onEnter: () => tl.play(),
      once: true, // Only trigger once
    });
  });
}

/**
 * Create a parallax scrolling effect
 * @param selector CSS selector for target elements
 * @param options Parallax options
 */
export function createParallaxEffect(selector: string, options: {
  speed?: number; // Parallax speed factor (1 = normal, 0.5 = half speed)
  direction?: 'vertical' | 'horizontal';
} = {}) {
  if (!gsap || !ScrollTrigger) {
    console.warn('GSAP not initialized. Call initAnimations() first.');
    return;
  }
  
  const {
    speed = 0.5,
    direction = 'vertical',
  } = options;
  
  // Get all elements matching the selector
  const elements = document.querySelectorAll(selector);
  
  elements.forEach((element) => {
    // Create the parallax effect
    gsap.to(element, {
      [direction === 'vertical' ? 'y' : 'x']: () => {
        // Calculate the distance to move based on scroll position
        return direction === 'vertical'
          ? ScrollTrigger.maxScroll(window) * speed * -1
          : ScrollTrigger.maxScroll(window) * speed;
      },
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true, // Smooth scrubbing effect
        invalidateOnRefresh: true, // Recalculate on window resize
      },
    });
  });
}

/**
 * Create a scroll-triggered animation sequence
 * @param selector Element selector or element reference
 * @param options Animation options
 */
export function createScrollAnimation(selector: string | Element, options: {
  start?: string;
  end?: string;
  markers?: boolean;
  toggleActions?: string;
  animationType?: 'fade' | 'slide' | 'scale' | 'rotate';
  pin?: boolean; // Pin the container during animation
  scrub?: boolean | number; // Scrub the animation to the scroll position
} = {}): ScrollTrigger | null {
  if (!isInitialized) {
    console.warn('GSAP not initialized. Call initAnimations() first.');
    return null;
  }
  
  const {
    start = 'top bottom',
    end = 'bottom top',
    markers = false,
    toggleActions = 'play none none reverse',
    animationType = 'fade',
    pin = false,
    scrub = false
  } = options;
  
  const element = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!element) return null;
  
  // Create a timeline for the scroll animation
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: element,
      start,
      end,
      markers,
      toggleActions,
      pin,
      scrub,
      anticipatePin: 1, // Improves pin performance
    }
  });
  
  // Use web worker for complex animation calculations when possible
  try {
    // Pre-calculate animation values in a web worker
    // This is especially beneficial for complex animations with many keyframes
    if (animationType === 'slide' || animationType === 'rotate') {
      // For animations that might involve physics or complex paths
      calculatePhysicsWithWorker(['x', 'y', 'rotation', 'opacity'], {
        from: { x: 0, y: 50, rotation: -5, opacity: 0 },
        to: { x: 0, y: 0, rotation: 0, opacity: 1 },
        stiffness: 100,
        damping: 20,
        steps: 60
      }).then(frames => {
        // Use pre-calculated values for smoother animations
        // This is just a placeholder - in a real implementation, we would use these values
        console.log('Pre-calculated animation frames:', frames.length);
      }).catch(error => {
        console.warn('Failed to pre-calculate animation, using standard GSAP animation:', error);
      });
    }
  } catch (error) {
    console.warn('Worker calculation failed, falling back to standard animation:', error);
  }
  
  // Add animations based on the type
  switch (animationType) {
    case 'fade':
      tl.fromTo(element, { opacity: 0 }, { opacity: 1, duration: 1 });
      break;
    case 'slide':
      tl.fromTo(element, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 });
      break;
    case 'scale':
      tl.fromTo(element, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 });
      break;
    case 'rotate':
      tl.fromTo(element, { rotation: -5, opacity: 0 }, { rotation: 0, opacity: 1, duration: 1 });
      break;
  }
  
  return tl.scrollTrigger;
}

/**
 * Create a smooth page transition effect
 * @param options Transition options
 */
export function createPageTransition(options: {
  duration?: number;
  type?: 'fade' | 'slide' | 'zoom';
  direction?: 'in' | 'out';
  easing?: string;
} = {}) {
  if (!gsap) {
    console.warn('GSAP not initialized. Call initAnimations() first.');
    return;
  }
  
  const {
    duration = 0.5,
    type = 'fade',
    direction = 'in',
    easing = 'power2.inOut',
  } = options;
  
  // Create a full-screen overlay for transitions
  let overlay = document.querySelector('.page-transition-overlay');
  
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'page-transition-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      zIndex: 9999,
      pointerEvents: 'none',
      opacity: direction === 'in' ? 1 : 0,
      visibility: 'visible',
    });
    document.body.appendChild(overlay);
  }
  
  // Create the animation based on type and direction
  const tl = gsap.timeline({
    defaults: {
      duration,
      ease: easing,
    },
    onComplete: () => {
      if (direction === 'in') {
        // If transitioning in, remove the overlay when done
        overlay.style.visibility = 'hidden';
      }
    },
  });
  
  if (type === 'fade') {
    tl.to(overlay, {
      opacity: direction === 'in' ? 0 : 1,
    });
  } else if (type === 'slide') {
    tl.fromTo(overlay, 
      { 
        xPercent: direction === 'in' ? 0 : -100,
        opacity: direction === 'in' ? 1 : 0,
      },
      {
        xPercent: direction === 'in' ? 100 : 0,
        opacity: direction === 'in' ? 0 : 1,
      }
    );
  } else if (type === 'zoom') {
    tl.fromTo(overlay,
      {
        scale: direction === 'in' ? 1 : 0.8,
        opacity: direction === 'in' ? 1 : 0,
      },
      {
        scale: direction === 'in' ? 1.2 : 1,
        opacity: direction === 'in' ? 0 : 1,
      }
    );
  }
  
  return tl;
}

/**
 * Initialize Lottie animation
 * @param containerId ID of the container element
 * @param animationPath Path to the Lottie JSON file
 * @param options Lottie options
 */
export async function initLottieAnimation(containerId: string, animationPath: string, options: {
  autoplay?: boolean;
  loop?: boolean;
  renderer?: 'svg' | 'canvas';
  speed?: number;
} = {}) {
  if (typeof window === 'undefined') return;
  
  try {
    // Dynamically import Lottie
    const lottie = (await import('lottie-web')).default;
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Lottie container #${containerId} not found`);
      return;
    }
    
    const {
      autoplay = true,
      loop = true,
      renderer = 'svg',
      speed = 1,
    } = options;
    
    // Initialize the animation
    const anim = lottie.loadAnimation({
      container,
      renderer,
      loop,
      autoplay,
      path: animationPath,
    });
    
    // Set animation speed
    anim.setSpeed(speed);
    
    return anim;
  } catch (error) {
    console.error('Failed to initialize Lottie animation:', error);
    return null;
  }
}

/**
 * Create a complex path animation using web worker calculations
 * 
 * This function offloads the complex path calculations to a web worker
 * to avoid blocking the main thread during intensive calculations.
 * 
 * @param element Element to animate
 * @param path Array of points defining the path
 * @param options Animation options
 */
export async function createPathAnimation(
  element: string | Element,
  path: Array<{ x: number; y: number }>,
  options: {
    duration?: number;
    ease?: string;
    autoRotate?: boolean;
    curviness?: number;
  } = {}
): Promise<gsap.core.Tween | null> {
  if (!isInitialized) {
    console.warn('GSAP not initialized. Call initAnimations() first.');
    return null;
  }
  
  const {
    duration = 5,
    ease = 'power1.inOut',
    autoRotate = false,
    curviness = 1.5
  } = options;
  
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) return null;
  
  try {
    // Use web worker to calculate the path points
    // This offloads the CPU-intensive calculations to a background thread
    const pathPoints = await calculatePathWithWorker(path, 100);
    
    // Create the animation with pre-calculated points
    return gsap.to(el, {
      duration,
      ease,
      motionPath: {
        path: pathPoints,
        autoRotate,
        curviness
      }
    });
  } catch (error) {
    console.warn('Failed to calculate path in worker, falling back to main thread:', error);
    
    // Fall back to standard GSAP path animation on the main thread
    return gsap.to(el, {
      duration,
      ease,
      motionPath: {
        path,
        autoRotate,
        curviness
      }
    });
  }
}

/**
 * Clean up all GSAP animations and ScrollTriggers
 * Call this when unmounting components to prevent memory leaks
 */
export function cleanupAnimations() {
  if (!isInitialized) return;
  
  // Kill all ScrollTriggers
  ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  
  // Kill all GSAP animations
  gsap.globalTimeline.clear();
}