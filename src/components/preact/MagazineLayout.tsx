import { h } from 'preact';
import LazyMagazineGrid from './LazyMagazineGrid';
import ScrollAnimation from './ScrollAnimation';

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

interface MagazineLayoutProps {
  articles: Article[];
  featuredArticle?: Article;
  showAds?: boolean;
  className?: string;
  sectionTitle?: string;
  sectionDescription?: string;
}

/**
 * MagazineLayout - A Preact component for rendering a complete magazine layout
 * 
 * This component is designed to work with Astro's hybrid rendering approach and combines
 * multiple optimized components to create a high-performance magazine layout.
 */
const MagazineLayout = ({
  articles,
  featuredArticle,
  showAds = true,
  className = '',
  sectionTitle = 'Latest Articles',
  sectionDescription = 'Discover our most recent publications and stay updated with the latest trends.'
}: MagazineLayoutProps) => {
  return (
    <div className={`magazine-layout ${className}`}>
      {/* Section Header with Animation */}
      <ScrollAnimation animation="fade-up" duration={0.8} delay={0.2}>
        <div className="section-header text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{sectionTitle}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{sectionDescription}</p>
        </div>
      </ScrollAnimation>
      
      {/* Magazine Grid with Lazy Loading */}
      <ScrollAnimation animation="fade-up" duration={0.8} delay={0.4}>
        <LazyMagazineGrid 
          articles={articles}
          featuredArticle={featuredArticle}
          showAds={showAds}
        />
      </ScrollAnimation>
      
      {/* Newsletter Section */}
      <ScrollAnimation animation="fade-up" duration={0.8} delay={0.2}>
        <div className="newsletter-section my-16 p-8 bg-gray-100 rounded-lg">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Subscribe to Our Newsletter</h3>
            <p className="text-gray-600 mb-6">Stay updated with our latest articles, news, and exclusive content.</p>
            
            <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button 
                type="submit" 
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Subscribe
              </button>
            </form>
            
            <p className="text-sm text-gray-500 mt-4">We respect your privacy. Unsubscribe at any time.</p>
          </div>
        </div>
      </ScrollAnimation>
      
      {/* Topics Section */}
      <ScrollAnimation animation="fade-up" duration={0.8} delay={0.3}>
        <div className="topics-section my-16">
          <h3 className="text-2xl font-bold mb-6 text-center">Popular Topics</h3>
          
          <div className="flex flex-wrap justify-center gap-4">
            {['Technology', 'Science', 'Culture', 'Business', 'Politics', 'Health', 'Environment', 'Education'].map(topic => (
              <a 
                key={topic}
                href={`/topic/${topic.toLowerCase()}`}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                {topic}
              </a>
            ))}
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
};

export default MagazineLayout;