/**
 * Animation Integration Utilities
 * 
 * This utility provides functions to easily integrate animations across the site.
 * It serves as a bridge between the core animation utilities and the site components,
 * making it easy to apply consistent animations throughout the application.
 */

import { initAnimations, createFadeInAnimation, createScrollAnimation, createPageTransition } from './animations';
import { initContentSectionAnimations, animateChildrenOnScroll } from './scrollAnimations';

/**
 * Initialize all animations across the site
 * This should be called once when the site loads
 */
export async function initSiteAnimations() {
  if (typeof window === 'undefined') return;
  
  try {
    // Initialize the core animation system
    await initAnimations();
    
    // Initialize content section animations
    initContentSectionAnimations();
    
    // Apply animations to common site elements
    applyHeaderAnimations();
    applyHeroAnimations();
    applyCardAnimations();
    applyFormAnimations();
    applyFooterAnimations();
    
    console.log('Site-wide animations initialized');
  } catch (error) {
    console.error('Failed to initialize site animations:', error);
  }
}

/**
 * Apply animations to the site header
 */
export function applyHeaderAnimations() {
  // Animate the header container
  createFadeInAnimation('.header-container', {
    duration: 0.8,
    delay: 0.2,
    from: 'top',
    distance: 20
  });
  
  // Animate the navigation items with a staggered effect
  createFadeInAnimation('.nav-item', {
    duration: 0.5,
    delay: 0.4,
    stagger: 0.1,
    from: 'top',
    distance: 10
  });
  
  // Animate the search bar
  createFadeInAnimation('.search-container', {
    duration: 0.5,
    delay: 0.6,
    from: 'right',
    distance: 20
  });
}

/**
 * Apply animations to hero sections
 */
export function applyHeroAnimations() {
  // Animate the hero heading
  createScrollAnimation('.hero-section h1, .hero-section h2', {
    animationType: 'fade',
    start: 'top 80%',
    toggleActions: 'play none none reverse'
  });
  
  // Animate the hero description
  createScrollAnimation('.hero-section p', {
    animationType: 'slide',
    start: 'top 80%',
    toggleActions: 'play none none reverse'
  });
  
  // Animate the hero image or media
  createScrollAnimation('.hero-section img, .hero-section video, .hero-section .media-container', {
    animationType: 'scale',
    start: 'top 80%',
    toggleActions: 'play none none reverse'
  });
  
  // Animate the hero buttons
  createScrollAnimation('.hero-section .button, .hero-section button, .hero-section .cta', {
    animationType: 'fade',
    start: 'top 80%',
    toggleActions: 'play none none reverse'
  });
}

/**
 * Apply animations to card elements
 */
export function applyCardAnimations() {
  // Animate article cards in grids
  animateChildrenOnScroll('.articles-grid, .card-grid', {
    childSelector: '.article-card, .card',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 85%'
  });
  
  // Animate feature cards
  animateChildrenOnScroll('.features-grid, .services-grid', {
    childSelector: '.feature-card, .service-card',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 85%'
  });
  
  // Add hover animations to cards
  const cards = document.querySelectorAll('.card, .article-card, .feature-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (window.gsap) {
        window.gsap.to(card, {
          y: -10,
          scale: 1.02,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (window.gsap) {
        window.gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
  });
}

/**
 * Apply animations to form elements
 */
export function applyFormAnimations() {
  // Animate form fields with a staggered effect
  animateChildrenOnScroll('form', {
    childSelector: '.form-group, .form-field, input, textarea, select, button',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 85%'
  });
  
  // Add focus animations to form fields
  const formFields = document.querySelectorAll('input, textarea, select');
  formFields.forEach(field => {
    field.addEventListener('focus', () => {
      if (window.gsap) {
        window.gsap.to(field, {
          scale: 1.02,
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5)',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
    
    field.addEventListener('blur', () => {
      if (window.gsap) {
        window.gsap.to(field, {
          scale: 1,
          boxShadow: 'none',
          duration: 0.3,
          ease: 'power2.out'
        });
      }
    });
  });
}

/**
 * Apply animations to the site footer
 */
export function applyFooterAnimations() {
  // Animate the footer sections
  createScrollAnimation('footer', {
    animationType: 'fade',
    start: 'top 90%',
    toggleActions: 'play none none none'
  });
  
  // Animate footer columns with a staggered effect
  animateChildrenOnScroll('footer', {
    childSelector: '.footer-column, .footer-section',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 90%'
  });
}

/**
 * Apply page transition effect
 * @param type - Type of transition animation
 * @param duration - Duration of the transition in seconds
 */
export function applyPageTransition(type: 'fade' | 'slide' | 'zoom' = 'fade', duration: number = 0.5) {
  createPageTransition({
    type,
    duration,
    easing: 'power2.inOut'
  });
}

/**
 * Apply animations to article content
 * @param articleSelector - Selector for the article container
 */
export function applyArticleAnimations(articleSelector: string = 'article') {
  // Animate article headings
  createScrollAnimation(`${articleSelector} h1, ${articleSelector} h2, ${articleSelector} h3`, {
    animationType: 'fade',
    start: 'top 85%',
    toggleActions: 'play none none none'
  });
  
  // Animate article images
  createScrollAnimation(`${articleSelector} img, ${articleSelector} figure`, {
    animationType: 'scale',
    start: 'top 80%',
    toggleActions: 'play none none none'
  });
  
  // Animate article paragraphs
  animateChildrenOnScroll(articleSelector, {
    childSelector: 'p',
    animationType: 'fade',
    staggerDelay: 0.05,
    start: 'top 85%'
  });
  
  // Animate blockquotes
  createScrollAnimation(`${articleSelector} blockquote`, {
    animationType: 'slide',
    start: 'top 80%',
    toggleActions: 'play none none none'
  });
}

/**
 * Apply animations to modal dialogs
 * @param modalSelector - Selector for the modal container
 */
export function applyModalAnimations(modalSelector: string = '.modal, [role="dialog"]') {
  const modals = document.querySelectorAll(modalSelector);
  
  modals.forEach(modal => {
    // Get the modal content
    const modalContent = modal.querySelector('.modal-content, .dialog-content') || modal.firstElementChild;
    
    if (!modalContent) return;
    
    // Set up the open animation
    const openModal = () => {
      if (window.gsap) {
        // Animate the backdrop
        window.gsap.to(modal, {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          duration: 0.3,
          ease: 'power2.out'
        });
        
        // Animate the modal content
        window.gsap.fromTo(modalContent, 
          { opacity: 0, y: -20, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'back.out(1.7)' }
        );
      }
    };
    
    // Set up the close animation
    const closeModal = () => {
      if (window.gsap) {
        // Animate the backdrop
        window.gsap.to(modal, {
          backgroundColor: 'rgba(0, 0, 0, 0)',
          duration: 0.3,
          ease: 'power2.in'
        });
        
        // Animate the modal content
        window.gsap.to(modalContent, {
          opacity: 0,
          y: -20,
          scale: 0.95,
          duration: 0.3,
          ease: 'power2.in',
          onComplete: () => {
            modal.style.display = 'none';
          }
        });
      }
    };
    
    // Add event listeners for modal triggers
    const modalId = modal.id;
    if (modalId) {
      const triggers = document.querySelectorAll(`[data-modal="${modalId}"], [data-toggle="${modalId}"]`);
      triggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
          modal.style.display = 'flex';
          openModal();
        });
      });
    }
    
    // Add event listeners for close buttons
    const closeButtons = modal.querySelectorAll('.modal-close, .close-button, [data-dismiss="modal"]');
    closeButtons.forEach(button => {
      button.addEventListener('click', closeModal);
    });
    
    // Close on backdrop click if it has the right class
    if (modal.classList.contains('modal-backdrop') || modal.classList.contains('modal-overlay')) {
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          closeModal();
        }
      });
    }
  });
}

/**
 * Apply animations to tabs and accordions
 */
export function applyTabAnimations() {
  // Animate tab content
  const tabButtons = document.querySelectorAll('[role="tab"], .tab-button');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Find the target panel
      const target = button.getAttribute('aria-controls') || button.getAttribute('data-target');
      if (!target) return;
      
      const panel = document.getElementById(target);
      if (!panel) return;
      
      // Animate the panel
      if (window.gsap) {
        window.gsap.fromTo(panel,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
        );
      }
    });
  });
  
  // Animate accordion content
  const accordionButtons = document.querySelectorAll('.accordion-button, .accordion-header, [data-toggle="collapse"]');
  
  accordionButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Find the target panel
      const target = button.getAttribute('aria-controls') || button.getAttribute('data-target');
      if (!target) return;
      
      const panel = document.getElementById(target);
      if (!panel) return;
      
      // Toggle the expanded state
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
      
      // Animate the panel
      if (window.gsap) {
        if (isExpanded) {
          // Collapse animation
          window.gsap.to(panel, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
              panel.style.display = 'none';
            }
          });
        } else {
          // Expand animation
          panel.style.display = 'block';
          panel.style.height = 'auto';
          const height = panel.offsetHeight;
          panel.style.height = '0px';
          panel.style.opacity = '0';
          
          window.gsap.to(panel, {
            height,
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out',
            onComplete: () => {
              panel.style.height = 'auto';
            }
          });
        }
      }
    });
  });
}

// Initialize animations when the DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initSiteAnimations);
}