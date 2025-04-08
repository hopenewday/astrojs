import { useState } from 'react';

/**
 * A simple React counter component to demonstrate React integration with Astro
 */
export default function ReactCounter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="react-counter p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-2">React Counter Component</h2>
      <p className="mb-4">Current count: <span className="font-bold">{count}</span></p>
      <div className="flex gap-2">
        <button 
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Decrease
        </button>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Increase
        </button>
        <button 
          onClick={() => setCount(initialCount)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        This component demonstrates using React within Astro.js
      </p>
    </div>
  );
}