import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Interface for the counter context state
 */
interface CounterContextType {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

/**
 * Props for the CounterProvider component
 */
interface CounterProviderProps {
  initialCount?: number;
  children: ReactNode;
}

// Create the counter context with a default value
const CounterContext = createContext<CounterContextType | undefined>(undefined);

/**
 * Counter Provider component that wraps child components with the counter context
 */
export function CounterProvider({ initialCount = 0, children }: CounterProviderProps) {
  const [count, setCount] = useState(initialCount);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialCount);

  const value = {
    count,
    increment,
    decrement,
    reset
  };

  return (
    <CounterContext.Provider value={value}>
      {children}
    </CounterContext.Provider>
  );
}

/**
 * Custom hook to use the counter context
 */
export function useCounter() {
  const context = useContext(CounterContext);
  if (context === undefined) {
    throw new Error('useCounter must be used within a CounterProvider');
  }
  return context;
}

/**
 * Counter Display component that uses the counter context
 */
export function CounterDisplay() {
  const { count } = useCounter();
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Counter Display</h3>
      <p>Current count: <span className="font-bold text-blue-600">{count}</span></p>
    </div>
  );
}

/**
 * Counter Controls component that uses the counter context
 */
export function CounterControls() {
  const { increment, decrement, reset } = useCounter();
  
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Counter Controls</h3>
      <div className="flex gap-2">
        <button 
          onClick={decrement}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          aria-label="Decrease count"
        >
          Decrease
        </button>
        <button 
          onClick={increment}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          aria-label="Increase count"
        >
          Increase
        </button>
        <button 
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          aria-label="Reset count"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/**
 * Main React Context Demo component that demonstrates React Context API integration with Astro
 */
export default function ReactContextDemo({ initialCount = 0 }: { initialCount?: number }) {
  return (
    <div className="react-context-demo p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-4">React Context API Demo</h2>
      <p className="mb-4">
        This component demonstrates using React Context API for state management within Astro.js.
        The counter state is shared between multiple components using React Context.
      </p>
      
      <CounterProvider initialCount={initialCount}>
        <CounterDisplay />
        <CounterControls />
      </CounterProvider>
      
      <p className="mt-4 text-sm text-gray-500">
        This pattern is useful for managing application state across components without prop drilling.
      </p>
    </div>
  );
}