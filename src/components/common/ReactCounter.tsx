import { useState } from 'react';

/**
 * Props interface for the ReactCounter component
 */
interface ReactCounterProps {
  /** Initial count value */
  initialCount?: number;
  /** Optional label for the counter */
  label?: string;
  /** Optional theme color */
  theme?: 'default' | 'primary' | 'secondary' | 'dark';
}

/**
 * A React counter component with TypeScript support to demonstrate React integration with Astro
 */
export default function ReactCounter({ 
  initialCount = 0, 
  label = 'React Counter Component',
  theme = 'default' 
}: ReactCounterProps) {
  const [count, setCount] = useState(initialCount);

  // Theme-based styling
  const getThemeClasses = () => {
    switch(theme) {
      case 'primary':
        return 'bg-blue-50 border-blue-200';
      case 'secondary':
        return 'bg-purple-50 border-purple-200';
      case 'dark':
        return 'bg-gray-800 border-gray-700 text-white';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Button styling based on theme
  const getButtonClasses = (type: 'decrease' | 'increase' | 'reset') => {
    const baseClasses = 'px-4 py-2 text-white rounded transition-colors';
    
    if (theme === 'dark') {
      switch(type) {
        case 'decrease':
          return `${baseClasses} bg-red-600 hover:bg-red-700`;
        case 'increase':
          return `${baseClasses} bg-green-600 hover:bg-green-700`;
        case 'reset':
          return `${baseClasses} bg-gray-600 hover:bg-gray-700`;
      }
    } else {
      switch(type) {
        case 'decrease':
          return `${baseClasses} bg-red-500 hover:bg-red-600`;
        case 'increase':
          return `${baseClasses} bg-green-500 hover:bg-green-600`;
        case 'reset':
          return `${baseClasses} bg-gray-500 hover:bg-gray-600`;
      }
    }
  };

  return (
    <div className={`react-counter p-4 border rounded-lg shadow-sm ${getThemeClasses()}`}>
      <h2 className="text-xl font-bold mb-2">{label}</h2>
      <p className="mb-4">Current count: <span className="font-bold">{count}</span></p>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(count - 1)}
          className={getButtonClasses('decrease')}
          aria-label="Decrease count"
        >
          Decrease
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          className={getButtonClasses('increase')}
          aria-label="Increase count"
        >
          Increase
        </button>
        <button 
          onClick={() => setCount(initialCount)}
          className={getButtonClasses('reset')}
          aria-label="Reset count"
        >
          Reset
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        This component demonstrates using React with TypeScript within Astro.js
      </p>
    </div>
  );
}