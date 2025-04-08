import React, { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Props interface for the ReactHooksDemo component
 */
interface ReactHooksDemoProps {
  /** Initial data to display */
  initialData?: string[];
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
}

/**
 * A React component demonstrating various hooks usage within Astro.js
 */
export default function ReactHooksDemo({ 
  initialData = ['React', 'Hooks', 'Demo'], 
  refreshInterval = 3000 
}: ReactHooksDemoProps) {
  // State hooks
  const [items, setItems] = useState<string[]>(initialData);
  const [newItem, setNewItem] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Effect hook for simulating data refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdated(new Date());
    }, refreshInterval);

    // Cleanup on unmount
    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Callback hook for adding a new item
  const addItem = useCallback(() => {
    if (newItem.trim() === '') return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setItems(prev => [...prev, newItem]);
      setNewItem('');
      setIsLoading(false);
    }, 500);
  }, [newItem]);

  // Callback hook for removing an item
  const removeItem = useCallback((index: number) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setItems(prev => prev.filter((_, i) => i !== index));
      setIsLoading(false);
    }, 500);
  }, []);

  // Memo hook for derived data
  const stats = useMemo(() => {
    return {
      count: items.length,
      averageLength: items.length > 0 
        ? Math.round(items.reduce((sum, item) => sum + item.length, 0) / items.length) 
        : 0,
      longestItem: items.length > 0 
        ? items.reduce((longest, item) => item.length > longest.length ? item : longest, '') 
        : ''
    };
  }, [items]);

  return (
    <div className="react-hooks-demo p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-xl font-bold mb-2">React Hooks Demo</h2>
      
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add new item"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={addItem}
            disabled={isLoading || newItem.trim() === ''}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Items</h3>
        {items.length === 0 ? (
          <p className="text-gray-500 italic">No items added yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{item}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={isLoading}
                  aria-label={`Remove ${item}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="bg-gray-50 p-3 rounded">
        <h3 className="text-lg font-semibold mb-2">Stats (useMemo)</h3>
        <ul className="text-sm">
          <li>Total items: <span className="font-medium">{stats.count}</span></li>
          <li>Average length: <span className="font-medium">{stats.averageLength} characters</span></li>
          {stats.longestItem && (
            <li>Longest item: <span className="font-medium">{stats.longestItem}</span></li>
          )}
        </ul>
      </div>
      
      <p className="mt-4 text-sm text-gray-500">
        This component demonstrates using various React hooks (useState, useEffect, useCallback, useMemo) within Astro.js
      </p>
    </div>
  );
}