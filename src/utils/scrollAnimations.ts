/**
 * Scroll Animation Utilities
 * 
 * This utility provides functions to easily implement scroll-triggered animations
 * for content sections across the site using the core animation utilities.
 */

import { initAnimations, createScrollAnimation } from './animations';

/**
 * Initialize scroll animations for content sections
 * This function should be called on the client-side to set up all scroll animations
 */
export async function initContentSectionAnimations() {
  if (typeof window === 'undefined') return;
  
  try {
    // Initialize the animation system first
    await initAnimations();
    
    // Apply animations to different content section types
    setupHeroSectionAnimations();
    setupArticleSectionAnimations();
    setupFeatureSectionAnimations();
    setupGallerySectionAnimations();
    setupTestimonialSectionAnimations();
    
    console.log('Content section scroll animations initialized');
  } catch (error) {
    console.error('Failed to initialize content section animations:', error);
  }
}

/**
 * Set up animations for hero sections
 */
function setupHeroSectionAnimations() {
  // Animate hero section elements
  const heroSections = document.querySelectorAll('.hero-section');
  
  heroSections.forEach(section => {
    // Animate the heading
    const heading = section.querySelector('h1, h2');
    if (heading) {
      createScrollAnimation(heading, {
        animationType: 'fade',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      });
    }
    
    // Animate the description
    const description = section.querySelector('p');
    if (description) {
      createScrollAnimation(description, {
        animationType: 'slide',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      });
    }
    
    // Animate the hero image or media
    const media = section.querySelector('img, video, .media-container');
    if (media) {
      createScrollAnimation(media, {
        animationType: 'scale',
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse'
      });
    }
  });
}

/**
 * Set up animations for article content sections
 */
export function setupArticleSectionAnimations() {
  // Animate article headings
  const articleHeadings = document.querySelectorAll('article h2, article h3');
  articleHeadings.forEach((heading, index) => {
    createScrollAnimation(heading, {
      animationType: 'fade',
      start: 'top 85%',
      toggleActions: 'play none none none',
      scrub: false
    });
  });
  
  // Animate article images
  const articleImages = document.querySelectorAll('article figure, article img');
  articleImages.forEach(image => {
    createScrollAnimation(image, {
      animationType: 'scale',
      start: 'top 80%',
      toggleActions: 'play none none none',
      scrub: false
    });
  });
  
  // Animate blockquotes
  const blockquotes = document.querySelectorAll('article blockquote');
  blockquotes.forEach(quote => {
    createScrollAnimation(quote, {
      animationType: 'slide',
      start: 'top 80%',
      toggleActions: 'play none none none',
      scrub: false
    });
  });
}

/**
 * Set up animations for feature sections (like benefits, services, etc.)
 */
function setupFeatureSectionAnimations() {
  // Get all feature sections or cards
  const featureItems = document.querySelectorAll('.feature-item, .card, .grid > div');
  
  // Apply staggered animation to feature items
  featureItems.forEach((item, index) => {
    createScrollAnimation(item, {
      animationType: 'fade',
      start: 'top 85%',
      toggleActions: 'play none none none',
      scrub: false
    });
  });
}

/**
 * Set up animations for image galleries or media grids
 */
function setupGallerySectionAnimations() {
  // Get gallery containers
  const galleries = document.querySelectorAll('.gallery, .image-grid');
  
  galleries.forEach(gallery => {
    // Get all images in the gallery
    const images = gallery.querySelectorAll('img, .gallery-item');
    
    // Apply staggered animations to gallery items
    images.forEach((image, index) => {
      createScrollAnimation(image, {
        animationType: 'scale',
        start: 'top 85%',
        toggleActions: 'play none none none',
        scrub: false
      });
    });
  });
}

/**
 * Set up animations for testimonial sections
 */
function setupTestimonialSectionAnimations() {
  // Get testimonial containers
  const testimonials = document.querySelectorAll('.testimonial, .review');
  
  testimonials.forEach(testimonial => {
    createScrollAnimation(testimonial, {
      animationType: 'fade',
      start: 'top 80%',
      toggleActions: 'play none none none',
      scrub: false
    });
  });
}

/**
 * Apply scroll animations to any element with data attributes
 * This allows for declarative animation setup in HTML
 */
export function initDataAttributeAnimations() {
  if (typeof window === 'undefined') return;
  
  // Find all elements with the data-scroll-animation attribute
  const animatedElements = document.querySelectorAll('[data-scroll-animation]');
  
  animatedElements.forEach(element => {
    const type = element.getAttribute('data-animation-type') || 'fade';
    const start = element.getAttribute('data-animation-start') || 'top 80%';
    const toggleActions = element.getAttribute('data-animation-toggle') || 'play none none none';
    const scrub = element.getAttribute('data-animation-scrub') === 'true';
    
    // Create the scroll animation based on data attributes
    createScrollAnimation(element, {
      animationType: type as 'fade' | 'slide' | 'scale' | 'rotate',
      start,
      toggleActions,
      scrub
    });
  });
}

/**
 * Apply scroll animations to a specific container's children
 * @param container The container element or selector
 * @param options Animation options
 */
export function animateChildrenOnScroll(
  container: string | Element,
  options: {
    childSelector?: string;
    animationType?: 'fade' | 'slide' | 'scale' | 'rotate';
    staggerDelay?: number;
    start?: string;
    scrub?: boolean;
  } = {}
) {
  if (typeof window === 'undefined') return;
  
  const {
    childSelector = '*',
    animationType = 'fade',
    staggerDelay = 0.1,
    start = 'top 80%',
    scrub = false
  } = options;
  
  // Get the container element
  const containerElement = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
    
  if (!containerElement) return;
  
  // Get all children matching the selector
  const children = containerElement.querySelectorAll(childSelector);
  
  // Apply animations with staggered delay
  children.forEach((child, index) => {
    createScrollAnimation(child, {
      animationType,
      start,
      scrub,
      toggleActions: 'play none none none'
    });
  });
}