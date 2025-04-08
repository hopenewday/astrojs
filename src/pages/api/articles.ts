/**
 * API endpoint for fetching articles
 * Supports pagination and filtering
 */
import type { APIRoute } from 'astro';

// Sample data for demonstration - in a real app, this would come from a database or CMS
const allArticles = [
  {
    id: "1",
    title: "The Future of Artificial Intelligence in 2023",
    slug: "future-of-ai-2023",
    excerpt: "Exploring the latest advancements in AI and what they mean for society, business, and everyday life.",
    image: "/images/tech/ai-future.jpg",
    category: {
      name: "Tech",
      slug: "tech"
    },
    author: {
      name: "Alex Johnson",
      slug: "alex-johnson",
      avatar: "/images/authors/alex-johnson.jpg"
    },
    publishDate: new Date("2023-06-15").toISOString(),
    trending: true,
    featured: true
  },
  {
    id: "2",
    title: "Modern Web Development Frameworks Compared",
    slug: "web-frameworks-compared",
    excerpt: "An in-depth analysis of the most popular web development frameworks in 2023, including React, Vue, and Svelte.",
    image: "/images/tech/web-dev.jpg",
    category: {
      name: "Tech",
      slug: "tech"
    },
    author: {
      name: "Sarah Chen",
      slug: "sarah-chen",
      avatar: "/images/authors/sarah-chen.jpg"
    },
    publishDate: new Date("2023-06-10").toISOString()
  },
  {
    id: "3",
    title: "The Renaissance of Indie Filmmaking",
    slug: "indie-film-renaissance",
    excerpt: "How digital technology and streaming platforms are giving independent filmmakers unprecedented opportunities.",
    image: "/images/culture/indie-film.jpg",
    category: {
      name: "Culture",
      slug: "culture"
    },
    author: {
      name: "Michael Rivera",
      slug: "michael-rivera",
      avatar: "/images/authors/michael-rivera.jpg"
    },
    publishDate: new Date("2023-06-05").toISOString()
  },
  {
    id: "4",
    title: "Climate Change: The Latest Research",
    slug: "climate-change-research",
    excerpt: "A summary of the most recent scientific findings on climate change and their implications for global policy.",
    image: "/images/science/climate.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. Emily Wong",
      slug: "emily-wong",
      avatar: "/images/authors/emily-wong.jpg"
    },
    publishDate: new Date("2023-06-01").toISOString(),
    trending: true
  },
  {
    id: "5",
    title: "The Global Economy in a Post-Pandemic World",
    slug: "post-pandemic-economy",
    excerpt: "Analyzing the long-term economic impacts of the pandemic and strategies for sustainable recovery.",
    image: "/images/business/economy.jpg",
    category: {
      name: "Business",
      slug: "business"
    },
    author: {
      name: "Robert Kiyosaki",
      slug: "robert-kiyosaki",
      avatar: "/images/authors/robert-kiyosaki.jpg"
    },
    publishDate: new Date("2023-05-28").toISOString()
  },
  {
    id: "6",
    title: "Quantum Computing Explained for Non-Scientists",
    slug: "quantum-computing-explained",
    excerpt: "Breaking down the complex principles of quantum computing into understandable concepts for the general public.",
    image: "/images/tech/quantum.jpg",
    category: {
      name: "Tech",
      slug: "tech"
    },
    author: {
      name: "Dr. Richard Feynman",
      slug: "richard-feynman",
      avatar: "/images/authors/richard-feynman.jpg"
    },
    publishDate: new Date("2023-05-25").toISOString()
  },
  // Additional articles for pagination testing
  {
    id: "7",
    title: "The Art of Sustainable Architecture",
    slug: "sustainable-architecture",
    excerpt: "How architects are incorporating eco-friendly principles into modern building design.",
    image: "/images/culture/architecture.jpg",
    category: {
      name: "Culture",
      slug: "culture"
    },
    author: {
      name: "Emma Rodriguez",
      slug: "emma-rodriguez",
      avatar: "/images/authors/emma-rodriguez.jpg"
    },
    publishDate: new Date("2023-05-22").toISOString()
  },
  {
    id: "8",
    title: "Advances in Renewable Energy Technology",
    slug: "renewable-energy-advances",
    excerpt: "The latest breakthroughs in solar, wind, and other renewable energy sources.",
    image: "/images/science/renewable-energy.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. Emily Wong",
      slug: "emily-wong",
      avatar: "/images/authors/emily-wong.jpg"
    },
    publishDate: new Date("2023-05-20").toISOString()
  },
  {
    id: "9",
    title: "The Psychology of Decision Making",
    slug: "psychology-decision-making",
    excerpt: "Understanding the cognitive biases that influence our everyday choices.",
    image: "/images/science/psychology.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. James Peterson",
      slug: "james-peterson",
      avatar: "/images/authors/james-peterson.jpg"
    },
    publishDate: new Date("2023-05-18").toISOString()
  },
  {
    id: "10",
    title: "Cryptocurrency Market Trends",
    slug: "crypto-market-trends",
    excerpt: "Analyzing the current state of cryptocurrency markets and future projections.",
    image: "/images/business/crypto.jpg",
    category: {
      name: "Business",
      slug: "business"
    },
    author: {
      name: "Robert Kiyosaki",
      slug: "robert-kiyosaki",
      avatar: "/images/authors/robert-kiyosaki.jpg"
    },
    publishDate: new Date("2023-05-15").toISOString(),
    trending: true
  },
  {
    id: "11",
    title: "The Evolution of Mobile UI Design",
    slug: "mobile-ui-evolution",
    excerpt: "Tracing the history and future of user interface design for mobile devices.",
    image: "/images/tech/mobile-ui.jpg",
    category: {
      name: "Tech",
      slug: "tech"
    },
    author: {
      name: "Sarah Chen",
      slug: "sarah-chen",
      avatar: "/images/authors/sarah-chen.jpg"
    },
    publishDate: new Date("2023-05-12").toISOString()
  },
  {
    id: "12",
    title: "The Future of Remote Work",
    slug: "future-remote-work",
    excerpt: "How companies are adapting to long-term remote and hybrid work models.",
    image: "/images/business/remote-work.jpg",
    category: {
      name: "Business",
      slug: "business"
    },
    author: {
      name: "Alex Johnson",
      slug: "alex-johnson",
      avatar: "/images/authors/alex-johnson.jpg"
    },
    publishDate: new Date("2023-05-10").toISOString()
  },
  {
    id: "13",
    title: "Exploring Deep Sea Ecosystems",
    slug: "deep-sea-ecosystems",
    excerpt: "New discoveries from the unexplored depths of our oceans.",
    image: "/images/science/deep-sea.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. Emily Wong",
      slug: "emily-wong",
      avatar: "/images/authors/emily-wong.jpg"
    },
    publishDate: new Date("2023-05-08").toISOString()
  },
  {
    id: "14",
    title: "The Rise of Sustainable Fashion",
    slug: "sustainable-fashion",
    excerpt: "How the fashion industry is embracing eco-friendly practices and materials.",
    image: "/images/culture/sustainable-fashion.jpg",
    category: {
      name: "Culture",
      slug: "culture"
    },
    author: {
      name: "Emma Rodriguez",
      slug: "emma-rodriguez",
      avatar: "/images/authors/emma-rodriguez.jpg"
    },
    publishDate: new Date("2023-05-05").toISOString()
  },
  {
    id: "15",
    title: "Advancements in Space Exploration",
    slug: "space-exploration-advancements",
    excerpt: "Recent milestones in our journey to understand and explore the cosmos.",
    image: "/images/science/space.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. Richard Feynman",
      slug: "richard-feynman",
      avatar: "/images/authors/richard-feynman.jpg"
    },
    publishDate: new Date("2023-05-03").toISOString(),
    trending: true
  },
  {
    id: "16",
    title: "The Impact of Social Media on Mental Health",
    slug: "social-media-mental-health",
    excerpt: "Examining the psychological effects of social media usage and strategies for digital wellbeing.",
    image: "/images/culture/social-media.jpg",
    category: {
      name: "Culture",
      slug: "culture"
    },
    author: {
      name: "Dr. James Peterson",
      slug: "james-peterson",
      avatar: "/images/authors/james-peterson.jpg"
    },
    publishDate: new Date("2023-05-01").toISOString()
  },
  {
    id: "17",
    title: "Blockchain Beyond Cryptocurrency",
    slug: "blockchain-beyond-crypto",
    excerpt: "Exploring the diverse applications of blockchain technology across industries.",
    image: "/images/tech/blockchain.jpg",
    category: {
      name: "Tech",
      slug: "tech"
    },
    author: {
      name: "Alex Johnson",
      slug: "alex-johnson",
      avatar: "/images/authors/alex-johnson.jpg"
    },
    publishDate: new Date("2023-04-28").toISOString()
  },
  {
    id: "18",
    title: "The Science of Productivity",
    slug: "science-of-productivity",
    excerpt: "Research-backed methods to enhance focus, efficiency, and work satisfaction.",
    image: "/images/science/productivity.jpg",
    category: {
      name: "Science",
      slug: "science"
    },
    author: {
      name: "Dr. Emily Wong",
      slug: "emily-wong",
      avatar: "/images/authors/emily-wong.jpg"
    },
    publishDate: new Date("2023-04-25").toISOString()
  }
];

export const GET: APIRoute = async ({ request }) => {
  // Get URL parameters
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '6');
  const category = url.searchParams.get('category');
  
  // Apply filters
  let filteredArticles = [...allArticles];
  
  if (category) {
    filteredArticles = filteredArticles.filter(article => 
      article.category.slug === category
    );
  }
  
  // Sort by publish date (newest first)
  filteredArticles.sort((a, b) => 
    new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
  
  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);
  
  // Prepare response
  const response = {
    articles: paginatedArticles,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(filteredArticles.length / limit),
      totalArticles: filteredArticles.length
    },
    hasMore: endIndex < filteredArticles.length
  };
  
  // Add artificial delay to simulate network latency (remove in production)
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};