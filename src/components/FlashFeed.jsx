import React, { useState, useEffect, useRef } from 'react';
import { getSmartImageSrc } from '../utils/cdnFailover';
import './FlashFeed.css';

/**
 * FlashFeed Component - A mobile-only, full-screen post scrolling experience
 * 
 * @param {Object} props - Component props
 * @param {Array} props.articles - Array of article objects to display
 */
const FlashFeed = ({ articles }) => {
  const [loadedImages, setLoadedImages] = useState({});
  const [visiblePosts, setVisiblePosts] = useState({});
  const postRefs = useRef([]);

  // Preload images for better performance
  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = articles.map(async (article) => {
        try {
          // Use the CDN failover system to get optimized images
          const imageUrl = await getSmartImageSrc(article.image, {
            width: window.innerWidth,
            height: window.innerHeight,
            quality: 80,
            format: 'auto'
          });
          
          return { id: article.id, url: imageUrl };
        } catch (error) {
          console.error(`Failed to load image for article ${article.id}:`, error);
          // Return a placeholder if image loading fails
          return { id: article.id, url: '/images/placeholder.svg' };
        }
      });

      const loadedImageResults = await Promise.all(imagePromises);
      const imageMap = {};
      loadedImageResults.forEach(result => {
        imageMap[result.id] = result.url;
      });

      setLoadedImages(imageMap);
    };

    preloadImages();
  }, [articles]);

  // Set up intersection observer to detect which posts are visible
  useEffect(() => {
    if (!postRefs.current.length) return;

    const observerOptions = {
      root: null, // Use the viewport
      rootMargin: '0px',
      threshold: 0.5 // Post is considered visible when 50% is in view
    };

    const handleIntersection = (entries) => {
      const updatedVisibility = { ...visiblePosts };
      
      entries.forEach(entry => {
        const id = entry.target.dataset.id;
        updatedVisibility[id] = entry.isIntersecting;
      });
      
      setVisiblePosts(updatedVisibility);
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    
    postRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      postRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [postRefs.current.length]);

  // Handle back button to return to homepage
  const handleBackClick = () => {
    window.location.href = '/';
  };

  return (
    <div className="flash-feed">
      <button className="flash-back-button" onClick={handleBackClick}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      
      {articles.map((article, index) => {
        const backgroundImage = loadedImages[article.id] || '/images/placeholder.svg';
        const isVisible = visiblePosts[article.id];
        
        return (
          <div 
            key={article.id}
            ref={el => postRefs.current[index] = el}
            data-id={article.id}
            className={`flash-post ${isVisible ? 'visible' : ''}`}
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8)), url(${backgroundImage})` }}
          >
            <div className="flash-post-content">
              <div className="flash-post-category">{article.category.name}</div>
              <h2 className="flash-post-title">{article.title}</h2>
              <p className="flash-post-excerpt">{article.excerpt}</p>
              
              <div className="flash-post-meta">
                <div className="flash-post-author">
                  <span className="author-name">{article.author.name}</span>
                </div>
                <div className="flash-post-date">
                  {article.publishDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              <a href={`/article/${article.slug}`} className="flash-post-link">
                Read Full Article
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FlashFeed;