/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Category-specific colors
        tech: {
          light: '#93c5fd', // blue-300
          DEFAULT: '#3b82f6', // blue-500
          dark: '#1d4ed8', // blue-700
        },
        culture: {
          light: '#c4b5fd', // purple-300
          DEFAULT: '#8b5cf6', // purple-500
          dark: '#6d28d9', // purple-700
        },
        science: {
          light: '#86efac', // green-300
          DEFAULT: '#22c55e', // green-500
          dark: '#15803d', // green-700
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '70ch',
            color: 'var(--color-text)',
            a: {
              color: 'var(--color-primary)',
              '&:hover': {
                color: 'var(--color-primary-dark)',
              },
            },
            h1: {
              color: 'var(--color-text)',
            },
            h2: {
              color: 'var(--color-text)',
            },
            h3: {
              color: 'var(--color-text)',
            },
            h4: {
              color: 'var(--color-text)',
            },
            blockquote: {
              borderLeftColor: 'var(--color-primary)',
              color: 'var(--color-text-light)',
            },
            'ul > li::before': {
              backgroundColor: 'var(--color-text-light)',
            },
            'ol > li::before': {
              color: 'var(--color-text-light)',
            },
            hr: {
              borderColor: 'var(--color-border)',
            },
            figcaption: {
              color: 'var(--color-text-light)',
            },
            strong: {
              color: 'var(--color-text)',
            },
            pre: {
              backgroundColor: 'var(--color-code-bg)',
            },
            code: {
              color: 'var(--color-code)',
              backgroundColor: 'var(--color-code-bg)',
              padding: '0.25rem 0.5rem',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
          },
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Merriweather', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '16/9': '16 / 9',
        '21/9': '21 / 9',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-in',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },