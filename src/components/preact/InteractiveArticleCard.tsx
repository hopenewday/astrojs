import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';

interface Author {
  name: string;
  slug: string;
  avatar?: string;
}

interface Category {
  name: string;
  slug: string;
}

interface ArticleCardProps {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  category: Category;
  author: Author;
  publishDate: Date;
  trending?: boolean;
  featured?: boolean;
  videoUrl?: string;
  readingTime?: number;
  className?: string;
  priority?: boolean;
  animationDelay?: number;
}

/**
 * InteractiveArticleCard - A Preact component for displaying article cards with interactive features
 * 
 * This component is designed to work with Astro's hybrid rendering approach and uses client directives
 * for hydration. It provides hover effects, lazy loading, and animation capabilities optimized for
 * magazine layouts.
 */
const InteractiveArticleCard = ({
  id,
  title,
  slug,
  excerpt,
  image,
  category,
  author,
  publishDate,
  trending = false,
  featured = false,
  videoUrl,
  readingTime,
  className = '',
  priority = false,
  animationDelay = 0
}: ArticleCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Format date for display
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(publishDate));
  
  // Calculate reading time if not provided
  const displayReadingTime = readingTime || Math.ceil(excerpt.split(' ').length / 200);
  
  // Intersection Observer for revealing animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  // Generate category-specific theme class
  const getCategoryThemeClass = (categorySlug: string) => {
    const themes: Record<string, string> = {
      tech: 'bg-tech text-white',
      culture: 'bg-culture text-white',
      science: 'bg-science text-white',
      business: 'bg-business text-white',
      politics: 'bg-politics text-white'
    };
    
    return themes[categorySlug] || 'bg-gray-700 text-white';
  };
  
  return (
    <div
      ref={cardRef}
      className={`article-card relative overflow-hidden rounded-lg shadow-md transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${isHovered ? 'shadow-xl scale-[1.02]' : ''} ${className}`}
      style={{ transitionDelay: `${animationDelay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a href={`/article/${slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={image}
            alt={title}
            width="800"
            height="450"
            loading={priority ? "eager" : "lazy"}
            className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
            style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
          />
          
          {/* Category Badge */}
          <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium ${getCategoryThemeClass(category.slug)}`}>
            {category.name}
          </div>
          
          {/* Trending Badge */}
          {trending && (
            <div className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              Trending
            </div>
          )}
          
          {/* Video Indicator */}
          {videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 className="text-xl font-bold mb-2 transition-colors hover:text-primary">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{excerpt}</p>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              {author.avatar && (
                <img
                  src={author.avatar}
                  alt={author.name}
                  className="w-8 h-8 rounded-full mr-2 object-cover"
                  width="32"
                  height="32"
                  loading="lazy"
                />
              )}
              <span>{author.name}</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span>{formattedDate}</span>
              <span>{displayReadingTime} min read</span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default InteractiveArticleCard;