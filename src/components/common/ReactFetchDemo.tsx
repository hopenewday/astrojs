import React, { useState, useEffect } from 'react';

/**
 * Interface for post data
 */
interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

/**
 * Props interface for the ReactFetchDemo component
 */
interface ReactFetchDemoProps {
  /** Number of posts to fetch */
  postLimit?: number;
  /** Whether to show loading skeleton */
  showSkeleton?: boolean;
}

/**
 * A React component demonstrating data fetching within Astro.js
 */
export default function ReactFetchDemo({ 
  postLimit = 3, 
  showSkeleton = true 
}: ReactFetchDemoProps) {
  // State for posts data
  const [posts, setPosts] = useState<Post[]>([]);
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Error state
  const [error, setError] = useState<string | null>(null);
  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Effect for fetching data
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=${postLimit}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setPosts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [postLimit, refreshKey]);

  // Function to refresh data
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="react-fetch-demo p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">React Fetch Demo</h2>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center gap-1"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div id="fetch-demo-loader" className="w-5 h-5"></div>
              <span>Loading...</span>
            </div>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
      
      <p className="mb-4">
        This component demonstrates fetching data from an external API using React within Astro.js.
      </p>
      
      {error && (
        <div className="p-3 mb-4 bg-red-100 border border-red-300 text-red-700 rounded">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {isLoading && showSkeleton ? (
          // Loading skeleton
          Array.from({ length: postLimit }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))
        ) : (
          // Actual content
          posts.map(post => (
            <div key={post.id} className="p-3 border rounded hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
              <p className="text-gray-700">{post.body.substring(0, 100)}...</p>
            </div>
          ))
        )}
        
        {!isLoading && posts.length === 0 && !error && (
          <p className="text-gray-500 italic">No posts found.</p>
        )}
      </div>
      
      <p className="mt-4 text-sm text-gray-500">
        This component demonstrates fetching and displaying data from an external API using React hooks within Astro.js
      </p>
    </div>
  );
}