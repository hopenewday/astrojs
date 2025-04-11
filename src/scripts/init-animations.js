/**
 * Animation Initialization Script
 * 
 * This script initializes animations across the site by integrating
 * the animations.ts and scrollAnimations.ts utilities.
 * 
 * It's designed to be included in the BaseLayout component to ensure
 * animations are consistently applied across all pages.
 */

import { initAnimations } from '../utils/animations';
import { 
  initContentSectionAnimations, 
  setupArticleSectionAnimations,
  setupFeatureSectionAnimations,
  setupHeroSectionAnimations,
  initDataAttributeAnimations,
  animateChildrenOnScroll 
} from '../utils/scrollAnimations';

// Initialize animations when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize the core animation system
  await initAnimations();
  
  // Initialize content section animations
  initContentSectionAnimations();
  
  // Initialize animations based on data attributes
  initDataAttributeAnimations();
  
  // Apply specific animations to common components
  applyComponentAnimations();
  
  console.log('Site-wide animations initialized');
});

/**
 * Apply animations to specific components across the site
 */
function applyComponentAnimations() {
  // Animate header elements
  animateHeaderElements();
  
  // Animate article cards in grids
  animateArticleCards();
  
  // Animate comments section when it becomes visible
  animateCommentsSection();
  
  // Animate related articles section
  animateRelatedArticles();
  
  // Animate sidebar elements
  animateSidebarElements();
}

/**
 * Animate header elements for a smooth entrance
 */
function animateHeaderElements() {
  // Animate the site logo
  animateChildrenOnScroll('.header-container', {
    childSelector: '.logo',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 90%'
  });
  
  // Animate the navigation items with a staggered effect
  animateChildrenOnScroll('.nav-list', {
    childSelector: '.nav-item',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 90%'
  });
}

/**
 * Animate article cards in grid layouts
 */
function animateArticleCards() {
  // Animate article cards in the main grid
  animateChildrenOnScroll('.articles-grid', {
    childSelector: '.article-card',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 85%'
  });
  
  // Animate the hero section
  animateChildrenOnScroll('.hero-section', {
    childSelector: '.hero-content > *',
    animationType: 'fade',
    staggerDelay: 0.1,
    start: 'top 80%'
  });
}

/**
 * Animate the comments section when it becomes visible
 */
function animateCommentsSection() {
  animateChildrenOnScroll('.comments-container', {
    childSelector: 'h2, #cusdis_thread, .comments-notice',
    animationType: 'fade',
    staggerDelay: 0.2,
    start: 'top 80%'
  });
}

/**
 * Animate related articles section
 */
function animateRelatedArticles() {
  // Animate the section title
  animateChildrenOnScroll('.related-articles', {
    childSelector: '.related-title',
    animationType: 'fade',
    start: 'top 85%'
  });
  
  // Animate each related article with a staggered effect
  animateChildrenOnScroll('.related-grid', {
    childSelector: '.related-article',
    animationType: 'fade',
    staggerDelay: 0.15,
    start: 'top 85%'
  });
}

/**
 * Animate sidebar elements
 */
function animateSidebarElements() {
  animateChildrenOnScroll('.sidebar-ad-container', {
    childSelector: '*',
    animationType: 'fade',
    start: 'top 80%'
  });
}