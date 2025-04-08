/**
 * Client-side script for ReactFetchDemo component
 * Initializes Lottie animations for loading states
 */

import { initLottieAnimation } from '../../utils/animations';

// Initialize loading animation when the component is mounted
export function initReactFetchDemoAnimations() {
  const loaderElements = document.querySelectorAll('#fetch-demo-loader');
  
  loaderElements.forEach(async (element) => {
    if (element) {
      try {
        // Initialize the Lottie animation with a simple spinner
        await initLottieAnimation(
          element.id,
          'https://assets9.lottiefiles.com/packages/lf20_b88nh30c.json',
          {
            loop: true,
            autoplay: true,
            renderer: 'svg',
            speed: 1
          }
        );
      } catch (error) {
        console.error('Failed to initialize fetch demo loading animation:', error);
      }
    }
  });
}

// Run the initialization when the DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReactFetchDemoAnimations);
  } else {
    initReactFetchDemoAnimations();
  }
}