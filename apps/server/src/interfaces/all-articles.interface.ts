// interfaces/all-articles.interface.ts
export interface AllArticlesFilterState {
  // Basic filters
  category: string | string[];
  tag: string;
  sort: 'recent' | 'popular' | 'trending' | 'reading_time' | 'title_asc' | 'title_desc' | 'most_commented' | 'most_saved' | 'most_liked';
  search: string;
  readingTime?: 'short' | 'medium' | 'long' | 'any';
  
  // Advanced filters
  accessType: 'all' | 'free' | 'premium';
  featured?: boolean;
  trending?: boolean;
  authors: string[];
  languages: string[];
  tags: string[];
  categories: string[];
  
  // Display options
  viewMode: 'grid' | 'list' | 'compact';
  itemsPerPage: 12 | 24 | 36 | 48;
  showAdvancedFilters: boolean;
}

export interface ArticleStats {
  totalArticles: number;
  freeArticles: number;
  premiumArticles: number;
  featuredArticles: number;
  trendingArticles: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSaves: number;
  averageRating: number;
}

export interface FilterOptions {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    color?: string;
    description?: string;
    articleCount: number;
  }>;
  tags: Array<{
    name: string;
    count: number;
  }>;
  authors: Array<{
    id: string;
    name: string;
    picture?: string;
    articleCount: number;
  }>;
  stats: ArticleStats;
}