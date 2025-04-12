import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: {
    name: string;
    slug: string;
  };
  author: {
    name: string;
    slug: string;
    avatar?: string;
  };
  publishDate: Date;
  trending?: boolean;
  featured?: boolean;
  videoUrl?: string;
  content?: string;
}

interface LazyMagazineGridProps {
  articles: Article[];
  featuredArticle?: Article;
  initialLoadCount?: number;
  batchSize?: number;
  showAds?: boolean;
  className?: string;
}

/**
 * LazyMagazineGrid - A Preact component for displaying articles in a magazine-style grid
 * with lazy loading and virtualization for optimal performance.
 * 
 * This component is designed to work with Astro's hybrid rendering approach and uses
 * progressive enhancement to provide a great experience even before hydration.
 */
const LazyMagazineGrid = ({
  articles,
  featuredArticle = articles.find(article => article.featured) || articles[0],
  initialLoadCount = 6,
  batchSize = 6,
  showAds = true,
  className = ''
}: LazyMagazineGridProps) => {
  // Filter out the featured article from the regular articles list
  const regularArticles = articles.filter(article => article.id !== featuredArticle?.id);
  
  // State for lazy loading
  const [visibleCount, setVisibleCount] = useState(initialLoadCount);
  const [isLoading, setIsLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Function to determine if we should show an ad after a specific index
  const shouldShowAd = (index: number) => showAds && (index + 1) % 5 === 0;
  
  // Function to get category color class
  const getCategoryColorClass = (categorySlug: string) => {
    const categories: Record<string, string> = {
      tech: 'bg-tech text-white',
      culture: 'bg-culture text-white',
      science: 'bg-science text-white',
      business: 'bg-business text-white',
      politics: 'bg-politics text-white'
    };
    
    return categories[categorySlug] || 'bg-gray-700 text-white';
  };
  
  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };
  
  // Calculate reading time
  const calculateReadingTime = (text?: string) => {
    if (!text) return 3; // Default reading time
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };
  
  // Intersection Observer for infinite scrolling
  useEffect(() => {
    if (!loaderRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && visibleCount < regularArticles.length) {
          setIsLoading(true);
          
          // Simulate network delay for smoother UX
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + batchSize, regularArticles.length));
            setIsLoading(false);
          }, 500);
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, visibleCount, regularArticles.length, batchSize]);
  
  return (
    <div className={`magazine-grid ${className}`}>
      {/* Featured Article */}
      {featuredArticle && (
        <div className="featured-article mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div className="relative aspect-[4/3] md:aspect-auto">
              <img
                src={featuredArticle.image}
                alt={featuredArticle.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColorClass(featuredArticle.category.slug)}`}>
                {featuredArticle.category.name}
              </div>
            </div>
            
            <div className="p-6 md:p-8 flex flex-col justify-center">
              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                {formatDate(featuredArticle.publishDate)} • {calculateReadingTime(featuredArticle.content)} min read
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                <a href={`/article/${featuredArticle.slug}`} className="hover:text-primary transition-colors">
                  {featuredArticle.title}
                </a>
              </h2>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">{featuredArticle.excerpt}</p>
              
              <div className="flex items-center">
                {featuredArticle.author.avatar && (
                  <img
                    src={featuredArticle.author.avatar}
                    alt={featuredArticle.author.name}
                    className="w-10 h-10 rounded-full mr-3 object-cover"
                    width="40"
                    height="40"
                    loading="eager"
                  />
                )}
                <div>
                  <div className="font-medium">{featuredArticle.author.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Author</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Regular Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {regularArticles.slice(0, visibleCount).map((article, index) => (
          <div key={article.id}>
            <div className="article-card rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
              <a href={`/article/${article.slug}`} className="block">
                <div className="relative aspect-[16/9]">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getCategoryColorClass(article.category.slug)}`}>
                    {article.category.name}
                  </div>
                  
                  {article.trending && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                      Trending
                    </div>
                  )}
                </div>
                
                <div className="p-5">
                  <h3 className="text-xl font-bold mb-2 transition-colors hover:text-primary">{article.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{article.excerpt}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{article.author.name}</span>
                    <span>{formatDate(article.publishDate)}</span>
                  </div>
                </div>
              </a>
            </div>
            
            {/* Ad placement */}
            {shouldShowAd(index) && (
              <div className="ad-container mt-8 mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                <div className="text-xs text-gray-500 uppercase mb-2">Advertisement</div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <span className="text-gray-400">Ad Space</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Load More Indicator */}
      {visibleCount < regularArticles.length && (
        <div ref={loaderRef} className="load-more-container mt-12 text-center">
          {isLoading ? (
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
            </div>
          ) : (
            <button 
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => {
                  setVisibleCount(prev => Math.min(prev + batchSize, regularArticles.length));
                  setIsLoading(false);
                }, 500);
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LazyMagazineGrid;