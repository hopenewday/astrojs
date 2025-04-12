import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface ThemeToggleProps {
  initialTheme?: 'light' | 'dark' | 'system';
  className?: string;
}

/**
 * ThemeToggle - A Preact component for toggling between light and dark themes
 * 
 * This component is designed to work with Astro's hybrid rendering approach and uses
 * client directives for hydration. It provides an accessible theme toggle with animations
 * and persists the user's preference.
 */
const ThemeToggle = ({
  initialTheme = 'system',
  className = ''
}: ThemeToggleProps) => {
  // Initialize with system preference, will be updated on mount
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(initialTheme);
  const [mounted, setMounted] = useState(false);
  
  // Get the actual theme (light/dark) based on preference or system
  const getAppliedTheme = (): 'light' | 'dark' => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme changes to document and persist to localStorage
  useEffect(() => {
    if (!mounted) return;
    
    const appliedTheme = getAppliedTheme();
    document.documentElement.setAttribute('data-theme', appliedTheme);
    localStorage.setItem('theme', theme);
    
    // Dispatch custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: appliedTheme } }));
  }, [theme, mounted]);

  // Listen for system preference changes
  useEffect(() => {
    if (!mounted) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (theme === 'system') {
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('theme-change', { detail: { theme: newTheme } }));
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const currentAppliedTheme = getAppliedTheme();
    setTheme(currentAppliedTheme === 'dark' ? 'light' : 'dark');
  };

  // Handle system preference option
  const setSystemTheme = () => {
    setTheme('system');
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;

  const appliedTheme = getAppliedTheme();
  const isDark = appliedTheme === 'dark';

  return (
    <div className={`theme-toggle-container ${className}`}>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-button p-2 rounded-full transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      >
        {/* Sun icon for dark mode */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-5 h-5 transition-opacity ${isDark ? 'opacity-100' : 'opacity-0 absolute'}`}
        >
          <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
        </svg>
        
        {/* Moon icon for light mode */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`w-5 h-5 transition-opacity ${isDark ? 'opacity-0 absolute' : 'opacity-100'}`}
        >
          <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
        </svg>
      </button>
      
      {/* System preference option */}
      <button
        type="button"
        onClick={setSystemTheme}
        className={`ml-2 text-xs px-2 py-1 rounded ${theme === 'system' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800 opacity-70'}`}
        aria-label="Use system theme preference"
        title="Use system theme preference"
      >
        System
      </button>
    </div>
  );
};

export default ThemeToggle;