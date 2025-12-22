// // components/articles/ArticleFeed.tsx
// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { 
//   Card, 
//   Row, 
//   Col, 
//   Typography, 
//   Button, 
//   Input, 
//   Select, 
//   Avatar,
//   Skeleton,
//   Empty,
//   Tabs,
//   Divider,
//   Tooltip,
//   notification,
//   Dropdown,
//   Menu,
//   FloatButton,
//   Badge,
//   Tag,
//   Space,
//   Progress
// } from 'antd';
// import { 
//   SearchOutlined, 
//   FilterOutlined,
//   FireOutlined,
//   StarOutlined,
//   ClockCircleOutlined,
//   EyeOutlined,
//   HeartOutlined,
//   CommentOutlined,
//   CrownOutlined,
//   GlobalOutlined,
//   HistoryOutlined,
//   HeartFilled,
//   BookOutlined,
//   BookFilled,
//   MoreOutlined,
//   RocketOutlined,
//   BulbOutlined,
//   ReadOutlined,
//   ArrowUpOutlined,
//   CompassOutlined,
//   ArrowRightOutlined,
//   ThunderboltOutlined,
//   CoffeeOutlined,
//   CheckCircleOutlined,
//   LockOutlined,
//   UnlockOutlined
// } from '@ant-design/icons';
// import { useNavigate } from 'react-router-dom';
// import articleApi, { Article, FilterParams, ArticleListDto  } from '../../services/articleApi';

// // import { useAuthStore } from '@/client/stores/auth';
// import { useAuthStore, checkPremiumStatus } from '@/client/stores/auth';

// import './ArticleFeed.css';
// import ArticleCard from './ArticleCard';

// const { Title, Text, Paragraph } = Typography;
// const { Search } = Input;
// const { Option } = Select;

// interface ArticleFeedProps {
//   showPersonalization?: boolean;
//   initialTab?: 'featured' | 'recent' | 'trending' | 'short' | 'premium' | 'all';
//   hideFilters?: boolean;
// }

// interface FiltersState {
//   category: string;
//   tag: string;
//   sort: 'recent' | 'popular' | 'trending' | 'reading_time';
//   search: string;
//   language?: string;
//   readingTime?: 'short' | 'medium' | 'long';
// }

// const ArticleFeed: React.FC<ArticleFeedProps> = ({ 
//   showPersonalization = true,
//   initialTab = 'featured',
//   hideFilters = false
// }) => {
//   // Use a conditional hook call or wrap in try-catch
//   let navigate: ReturnType<typeof useNavigate> | ((path: string) => void);
  
//   try {
//     // Try to use the hook, but provide a fallback if Router context is not available
//     navigate = useNavigate();
//   } catch (error) {
//     // Fallback navigation function
//     console.warn('Router context not available, using fallback navigation');
//     navigate = (path: string) => {
//       // Use window.location for navigation when router is not available
//       window.location.href = path;
//     };
//   }

//   const [activeTab, setActiveTab] = useState<string>(initialTab);
//   const [articles, setArticles] = useState<Article[]>([]);
//   const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
//   const [shortArticles, setShortArticles] = useState<Article[]>([]);
//   const [premiumArticles, setPremiumArticles] = useState<Article[]>([]);
//   const [categories, setCategories] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [loadingCategories, setLoadingCategories] = useState(false);

  
//   const [totalUsers, setTotalUsers] = useState(0);
//   const [filters, setFilters] = useState<FiltersState>({
//     category: '',
//     tag: '',
//     sort: 'recent',
//     search: '',
//   });
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const [totalArticles, setTotalArticles] = useState(0);
//   const [userHasPremium, setUserHasPremium] = useState(false);
//   const observerRef = useRef<IntersectionObserver | null>(null);
//   const loadMoreRef = useRef<HTMLDivElement>(null);
  
//   const { user } = useAuthStore();



//   const handleTabChange = (key: string) => {
//     // Validate that the key is one of the allowed values
//     const validKeys = ['featured', 'recent', 'trending', 'short', 'premium', 'all'];
//     if (validKeys.includes(key as any)) {
//       setActiveTab(key as typeof activeTab);
//     }
//   };


//   // Fetch categories
//   const fetchCategories = async () => {
//     try {
//       setLoadingCategories(true);
//       const response = await articleApi.getCategories();
//       setCategories(response.data || []);
//     } catch (error) {
//       console.error('Failed to load categories:', error);
//     } finally {
//       setLoadingCategories(false);
//     }
//   };

//   // Fetch analytics data to get user count
// const fetchAnalyticsData = async () => {
//   try {
//     // Use the same endpoint as AdminAnalytics component
//     const response = await articleApi.getAnalytics('30d'); // Default to 30 days
//     if (response.data) {
//       // Sum up user growth data to get total users
//       const userCount = response.data.userGrowth?.reduce(
//         (sum: number, day: any) => sum + (day._count?._all || 0), 
//         0
//       ) || 0;
//       setTotalUsers(userCount);
//     }
//   } catch (error) {
//     console.error('Failed to fetch analytics:', error);
//     // Fallback: set a reasonable default
//     setTotalUsers(14000);
//   }
// };

//   // Check user premium status
//   const checkPremiumStatus = async () => {
//     if (user) {
//       try {
//         // You'll need to implement this in your auth store or API
//         setUserHasPremium(user.subscription?.status === 'ACTIVE' || false);
//       } catch (error) {
//         console.error('Failed to check premium status:', error);
//       }
//     }
//   };


  

//   // Add a function to handle "View All" navigation
//   const handleViewAll = (variant: 'featured' | 'short' | 'premium' | 'all') => {
//     switch (variant) {
//       case 'featured':
//         setActiveTab('featured');
//         break;
//       case 'short':
//         setActiveTab('short');
//         break;
//       case 'premium':
//         setActiveTab('premium');
//         break;
//       default:
//         setActiveTab('all');
//     }
    
//     // Reset filters when switching to a specific view
//     const baseFilters: FiltersState = {
//       category: '',
//       tag: '',
//       sort: 'recent',
//       search: '',
//     };

//     // Apply specific filters based on the variant
//     switch (variant) {
//       case 'featured':
//         setFilters({ ...baseFilters });
//         break;
//       case 'short':
//         setFilters({ 
//           ...baseFilters, 
//           readingTime: 'short',
//           sort: 'reading_time' 
//         });
//         break;
//       case 'premium':
//         setFilters({ 
//           ...baseFilters, 
//           // Note: accessType filter will be applied in fetchArticles
//         });
//         break;
//       default:
//         setFilters(baseFilters);
//     }
    
//     // Scroll to the main content area
//     setTimeout(() => {
//       document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
//     }, 100);
//   };
  
// const fetchArticles = useCallback(async (reset = false) => {
//   if (loading) return;
  
//   const currentPage = reset ? 1 : page;
  
//   setLoading(true);
//   try {
//     const params: FilterParams = {
//       page: currentPage,
//       limit: 12,
//       ...filters,
//     };

//     // Adjust params based on active tab
//     switch (activeTab) {
//       case 'featured':
//         params.featured = true;
//         break;
//       case 'trending':
//         params.trending = true;
//         params.sort = 'trending';
//         break;
//       case 'short':
//         // Don't rely on server filtering for reading time
//         params.sort = 'reading_time';
//         // Increase limit since we'll filter client-side
//         params.limit = 24; // Get more articles to account for client-side filtering
//         break;
//       case 'premium':
//         params.accessType = 'PREMIUM';
//         break;
//       case 'recent':
//         params.sort = 'recent';
//         break;
//     }

//     // Clean up empty params
//     Object.keys(params).forEach(key => {
//       if (params[key as keyof FilterParams] === '' || params[key as keyof FilterParams] === undefined) {
//         delete params[key as keyof FilterParams];
//       }
//     });

//     const response = await articleApi.getArticles(params);

//     // Handle response structure
//     let newArticles: Article[] = [];
//     let newTotal = 0;
//     let newHasMore = false;

//     if (response.data) {
//       // Handle direct array
//       if (Array.isArray(response.data)) {
//         newArticles = response.data;
//         newTotal = response.data.length;
//         newHasMore = false;
//       } 
//       // Handle ArticleListDto format (articles property)
//       else if (response.data.articles && Array.isArray(response.data.articles)) {
//         newArticles = response.data.articles;
//         newTotal = response.data.total || response.data.articles.length;
//         newHasMore = response.data.hasMore || false;
//       } 
//       // Handle PaginatedResponse format (data property)
//       else if (response.data.articles && Array.isArray(response.data.articles)) {
//         newArticles = response.data.articles;
//         newTotal = response.data.total;
//         newHasMore = response.data.hasMore || false;
//       }
//     }

//     // CLIENT-SIDE FILTERING for Short Reads (<= 10 minutes)
//     if (activeTab === 'short') {
//       newArticles = newArticles.filter(article => {
//         const readingTime = article.readingTime || 5;
//         return readingTime <= 10; // Changed from 5 to 10 minutes
//       });
      
//       // IMPORTANT: Keep hasMore true if we got some articles
//       // This allows pagination to continue
//       newHasMore = newArticles.length > 0 && currentPage < 3; // Limit to 3 pages max
      
//       // For short articles, we need to track filtered total differently
//       // If this is the first page, reset the filtered articles
//       if (currentPage === 1) {
//         // Keep total from original response for UI display
//         // But we'll show filtered count
//         console.log(`Filtered short articles: ${newArticles.length} out of ${response.data?.total || 0}`);
//       }
//     }

//     if (reset || currentPage === 1) {
//       setArticles(newArticles);
//     } else {
//       setArticles(prev => [...prev, ...newArticles]);
//     }
    
//     // For short tab, we need to adjust the total count logic
//     if (activeTab === 'short' && currentPage === 1) {
//       // We don't know the total filtered articles, so estimate
//       setTotalArticles(newArticles.length * 3); // Estimate there are more
//     } else {
//       setTotalArticles(newTotal);
//     }
    
//     setHasMore(newHasMore);
    
//     if (reset) {
//       setPage(1);
//     }
//   } catch (error: any) {
//     console.error('Failed to load articles:', error);
//     notification.error({
//       message: 'Error',
//       description: error.response?.data?.message || 'Failed to load articles. Please try again.',
//     });
//   } finally {
//     setLoading(false);
//   }
// }, [activeTab, filters, page, loading, user, showPersonalization]);

//   // Fetch specialized article sets
// const fetchSpecializedArticles = async () => {
//   try {
//     // Fetch featured articles
//     const featuredResponse = await articleApi.getArticles({ featured: true, limit: 4 });
//     const featuredList = featuredResponse.data as ArticleListDto;
//     if (featuredList?.articles) {
//       setFeaturedArticles(featuredList.articles);
//     }

//     // Fetch ALL articles and filter client-side for short reads
//     const shortResponse = await articleApi.getArticles({ 
//       limit: 20, // Get more to filter client-side
//       sort: 'reading_time' 
//     });
    
//     const shortList = shortResponse.data as ArticleListDto;
//     if (shortList?.articles) {
//       // Client-side filtering: ONLY keep articles with readingTime <= 10 (changed from 5 to 10)
//       const actualShortArticles = shortList.articles.filter(article => {
//         const readingTime = article.readingTime || 5; // Default to 5 if not provided
//         return readingTime <= 10; // Changed to 10 minutes max
//       }).slice(0, 4); // Take only first 4 after filtering
      
//       setShortArticles(actualShortArticles);
//     }

//     // Fetch premium articles
//     const premiumResponse = await articleApi.getArticles({ accessType: 'PREMIUM', limit: 4 });
//     const premiumList = premiumResponse.data as ArticleListDto;
//     if (premiumList?.articles) {
//       setPremiumArticles(premiumList.articles);
//     }
//   } catch (error) {
//     console.error('Failed to load specialized articles:', error);
//   }
// };


//   useEffect(() => {
//     fetchArticles(true);
//     fetchCategories();
//     checkPremiumStatus();
//     fetchSpecializedArticles();
//     fetchAnalyticsData();
//   }, [activeTab, filters]);

//   useEffect(() => {
//     if (page > 1) {
//       fetchArticles(false);
//     }
//   }, [page]);

//   useEffect(() => {
//     // Setup intersection observer for infinite scroll
//     if (observerRef.current) {
//       observerRef.current.disconnect();
//     }

//     observerRef.current = new IntersectionObserver(
//       (entries) => {
//         if (entries[0].isIntersecting && hasMore && !loading) {
//           setPage(prev => prev + 1);
//         }
//       },
//       { threshold: 0.5 }
//     );

//     if (loadMoreRef.current) {
//       observerRef.current.observe(loadMoreRef.current);
//     }

//     return () => {
//       if (observerRef.current) {
//         observerRef.current.disconnect();
//       }
//     };
//   }, [hasMore, loading]);

//   const handleFilterChange = (key: keyof FiltersState, value: string) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const handleSearch = (value: string) => {
//     setFilters(prev => ({ ...prev, search: value }));
//   };

//   const handleLikeArticle = async (articleId: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     try {
//       const response = await articleApi.likeArticle(articleId);
      
//       if (response.data?.liked) {
//         updateArticleState(articleId, {
//           likeCount: (prev: number) => prev + 1,
//           isLiked: true,
//         });
        
//         notification.success({
//           message: 'Success',
//           description: 'Article liked!',
//         });
//       }
//     } catch (error: any) {
//       notification.error({
//         message: 'Error',
//         description: error.response?.data?.message || 'Failed to like article',
//       });
//     }
//   };

//   const handleSaveArticle = async (articleId: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     try {
//       const response = await articleApi.saveArticle(articleId);
      
//       if (response.data?.saved) {
//         updateArticleState(articleId, {
//           isSaved: true,
//         });
        
//         notification.success({
//           message: 'Success',
//           description: 'Article saved!',
//         });
//       }
//     } catch (error: any) {
//       notification.error({
//         message: 'Error',
//         description: error.response?.data?.message || 'Failed to save article',
//       });
//     }
//   };

//   const updateArticleState = (articleId: string, updates: any) => {
//     const updateFunction = (articles: Article[]) =>
//       articles.map(article => {
//         if (article.id === articleId) {
//           const articleAny = article as any; // type assertion
//           return {
//             ...article,
//             ...Object.keys(updates).reduce((acc, key) => {
//               const update = updates[key];
//               acc[key] = typeof update === 'function' ? update(articleAny[key]) : update;
//               return acc;
//             }, {} as any),
//           };
//         }
//         return article;
//       });

//     setArticles(updateFunction);
//     setFeaturedArticles(updateFunction);
//     setShortArticles(updateFunction);
//     setPremiumArticles(updateFunction);
//   };

//   const renderArticleCard = (article: Article, variant: 'default' | 'featured' | 'short' | 'premium' = 'default') => {
//     const cardVariant = variant === 'featured' ? 'featured' : 'default';
  
//     return (
//       <Col 
//         xs={24} 
//         sm={variant === 'featured' ? 24 : 12} 
//         lg={variant === 'featured' ? 24 : 8} 
//         xl={variant === 'featured' ? 24 : 6} 
//         key={article.id}
//       >
//         <ArticleCard
//           article={article}
//           variant={cardVariant}
//           onLike={async (articleId) => {
//             try {
//               const response = await articleApi.likeArticle(articleId);
//               if (response.data?.liked) {
//                 updateArticleState(articleId, {
//                   likeCount: (prev: number) => prev + 1,
//                   isLiked: true,
//                 });
//               }
//             } catch (error: any) {
//               notification.error({
//                 message: 'Error',
//                 description: error.response?.data?.message || 'Failed to like article',
//               });
//             }
//           }}
//           onSave={async (articleId) => {
//             try {
//               const response = await articleApi.saveArticle(articleId);
//               if (response.data?.saved) {
//                 updateArticleState(articleId, {
//                   isSaved: true,
//                 });
//               }
//             } catch (error: any) {
//               notification.error({
//                 message: 'Error',
//                 description: error.response?.data?.message || 'Failed to save article',
//               });
//             }
//           }}
//           onShare={(articleId) => {
//             // Implement share functionality
//             console.log('Share article:', articleId);
//           }}
//           onReport={(articleId) => {
//             // Implement report functionality
//             console.log('Report article:', articleId);
//           }}
//         />
//       </Col>
//     );
//   };

//   const tabs = [
//     {
//       key: 'featured',
//       label: (
//         <div className="flex items-center gap-2">
//           <StarOutlined />
//           <span>Featured</span>
//         </div>
//       ),
//       condition: true,
//     },
//     {
//       key: 'recent',
//       label: (
//         <div className="flex items-center gap-2">
//           <HistoryOutlined />
//           <span>Recent</span>
//         </div>
//       ),
//       condition: true,
//     },
//     {
//       key: 'trending',
//       label: (
//         <div className="flex items-center gap-2">
//           <FireOutlined />
//           <span>Trending</span>
//         </div>
//       ),
//       condition: true,
//     },
//     {
//       key: 'short',
//       label: (
//         <div className="flex items-center gap-2">
//           <CoffeeOutlined />
//           <span>Quick Reads</span>
//         </div>
//       ),
//       condition: true,
//     },
//     {
//       key: 'premium',
//       label: (
//         <div className="flex items-center gap-2">
//           <CrownOutlined />
//           <span>Premium</span>
//         </div>
//       ),
//       condition: true,
//     },
//     {
//       key: 'all',
//       label: (
//         <div className="flex items-center gap-2">
//           <CompassOutlined />
//           <span>Explore All</span>
//         </div>
//       ),
//       condition: true,
//     },
//   ].filter(tab => tab.condition);

//   const renderSection = (title: string, articles: Article[], variant: 'featured' | 'short' | 'premium' = 'featured') => (
//     articles.length > 0 && (
//       <div className="mb-12">
//         <div className="flex justify-between items-center mb-6">
//           <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
//             {title}
//           </Title>
//           <Button 
//             type="primary"
//             ghost
//             className="text-primary dark:text-blue-400 border-primary dark:border-blue-400 hover:bg-primary/10"
//             icon={<ArrowRightOutlined />}
//             onClick={() => handleViewAll(variant)}
//           >
//             View All
//           </Button>
//         </div>
//         <Row gutter={[24, 24]}>
//           {articles.map(article => renderArticleCard(article, variant === 'featured' ? 'featured' : 'default'))}
//         </Row>
//       </div>
//     )
//   );

//   return (
//     <div className="p-4 md:p-6 space-y-6 dark:bg-gray-900 max-w-8xl mx-auto">
//       {/* Enhanced Hero Section */}
//       <div className="relative mb-12 rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-700 shadow-2xl dark:from-indigo-800 dark:via-blue-700 dark:to-indigo-900">
//         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent"></div>
//         <div className="relative z-10 px-6 py-16 md:px-12 text-center">
//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm bg-white/10 mb-8 border border-blue">
//             <BookOutlined className="text-white" />
//             <span className="text-white font-medium">Welcome to Cverra Articles</span>
//           </div>
          
//           <h1 className="text-3xl md:text-6xl font-bold text-white mb-6 leading-tight">
//             Discover Knowledge That Transforms
//           </h1>

//           <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto">
//             Join {totalUsers.toLocaleString()}+ professionals learning with us. 
//             Explore insights, strategies, and stories that shape tomorrow's leaders.
//           </p>
          
//           <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
//             <Button
//               size="large"
//               type="primary"
//               className="h-12 px-8 bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-semibold text-lg shadow-lg hover:scale-105 flex items-center justify-center gap-3"
//               onClick={() => {
//                 handleViewAll('all');
//               }}
//             >
//               <ReadOutlined />
//               Start Reading Now
//             </Button>
//             {!userHasPremium && (
//               <Button
//                 size="large"
//                 className="h-12 px-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:scale-105 flex items-center justify-center gap-3"
//                 onClick={() => handleViewAll('premium')}
//               >
//                 <CrownOutlined />
//                 Explore Premium
//               </Button>
//             )}
//           </div>
          
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
//             {[
//               { icon: <RocketOutlined />, value: `${totalArticles}+`, label: 'Articles', color: 'text-blue-300' },
//               { icon: <FireOutlined />, value: '24/7', label: 'Fresh Content', color: 'text-red-300' },
//               { icon: <StarOutlined />, value: '98%', label: 'Satisfaction', color: 'text-yellow-300' },
//               { icon: <GlobalOutlined />, value: '10+', label: 'Languages', color: 'text-green-300' }
//             ].map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
//                 <div className="flex items-center justify-center gap-2 text-white/80">
//                   {stat.icon}
//                   <span>{stat.label}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Main content area with ID for scrolling */}
//       <div id="main-content">
//         {/* Category Tabs */}
//         <div className="mb-8">
//           <Title level={3} className="mb-4 text-xl font-semibold text-foreground dark:text-white">
//             Browse by Category
//           </Title>
//           <div className="flex flex-wrap gap-2">
//             {loadingCategories ? (
//               Array.from({ length: 6 }).map((_, i) => (
//                 <Skeleton.Button key={i} active size="large" style={{ width: 100 }} />
//               ))
//             ) : (
//               <>
//                 <Button
//                   type={filters.category === '' ? 'primary' : 'default'}
//                   className={`${
//                     filters.category === '' 
//                       ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0' 
//                       : 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
//                   }`}
//                   onClick={() => handleFilterChange('category', '')}
//                 >
//                   All Topics
//                 </Button>
//                 {categories.map(category => (
//                   <Button
//                     key={category.id}
//                     type={filters.category === category.slug ? 'primary' : 'default'}
//                     className={`${
//                       filters.category === category.slug 
//                         ? 'bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0' 
//                         : 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
//                     }`}
//                     onClick={() => handleFilterChange('category', category.slug)}
//                   >
//                     {category.name}
//                   </Button>
//                 ))}
//               </>
//             )}
//           </div>
//         </div>

//         {/* Featured Articles Section */}
//         {renderSection('Featured Articles', featuredArticles, 'featured')}

//         {/* Quick Reads Section */}
//         {renderSection('Quick Reads (Under 10 min)', shortArticles, 'short')}

//         {/* Premium Articles Section */}
//         {userHasPremium && renderSection('Your Premium Content', premiumArticles, 'premium')}
//         {!userHasPremium && premiumArticles.length > 0 && (
//           <div className="mb-12">
//             <div className="flex justify-between items-center mb-6">
//               <div>
//                 <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
//                   Premium Articles
//                 </Title>
//                 <Text className="text-muted-foreground dark:text-gray-400">
//                   Unlock exclusive content with premium access
//                 </Text>
//               </div>
//               <Button 
//                 type="primary"
//                 ghost
//                 className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-600 hover:bg-purple-600/10"
//                 icon={<ArrowRightOutlined />}
//                 onClick={() => handleViewAll('premium')}
//               >
//                 Explore Premium
//               </Button>
//             </div>
//             <Row gutter={[24, 24]}>
//               {premiumArticles.map(article => renderArticleCard(article))}
//             </Row>
//           </div>
//         )}

//         {/* Main Content Tabs - Only show when there are articles or active tab is selected */}
//         {(articles.length > 0 || activeTab !== 'featured') && (
//           <>
//             <div className="flex items-center justify-between mb-6">
//               <Title level={2} className="text-2xl font-bold text-foreground dark:text-white">
//                 {activeTab === 'featured' ? 'Featured Articles' :
//                  activeTab === 'recent' ? 'Recent Articles' :
//                  activeTab === 'trending' ? 'Trending Articles' :
//                  activeTab === 'short' ? 'Quick Reads' :
//                  activeTab === 'premium' ? 'Premium Articles' :
//                  'All Articles'}
//               </Title>
//               <div className="flex items-center gap-2">
//                 <Text className="text-sm text-muted-foreground dark:text-gray-400">
//                   {articles.length} articles
//                 </Text>
//               </div>
//             </div>

//             <Tabs 
//               activeKey={activeTab} 
//               onChange={setActiveTab}
//               className="mb-8 dark:[&_.ant-tabs-tab]:text-gray-300 dark:[&_.ant-tabs-tab-active]:text-white"
//               items={tabs.map(tab => ({
//                 key: tab.key,
//                 label: tab.label,
//               }))}
//             />
//           </>
//         )}

//         {/* Filters */}
//         {!hideFilters && (
//           <div className="bg-card dark:bg-gray-800 text-card-foreground dark:text-gray-200 p-6 rounded-xl border dark:border-gray-700 shadow-sm mb-6">
//             <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
//               <div className="flex-1 w-full lg:w-auto">
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <Search
//                     placeholder="Search articles..."
//                     allowClear
//                     enterButton={<SearchOutlined />}
//                     onSearch={handleSearch}
//                     className="w-full sm:w-64 dark:[&_input]:bg-gray-700 dark:[&_input]:text-white dark:[&_input]:border-gray-600"
//                     size="large"
//                     addonAfter={null} 
//                   />
                  
//                   <Select
//                     placeholder="Category"
//                     allowClear
//                     className="w-full sm:w-40 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
//                     size="large"
//                     onChange={(value) => handleFilterChange('category', value)}
//                     value={filters.category || undefined}
//                     popupClassName="dark:bg-gray-800 dark:text-white"
//                   >
//                     {categories.map(category => (
//                       <Option key={category.id} value={category.slug}>
//                         {category.name}
//                       </Option>
//                     ))}
//                   </Select>
                  
//                   <Select
//                     placeholder="Sort by"
//                     className="w-full sm:w-44 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
//                     size="large"
//                     onChange={(value) => handleFilterChange('sort', value)}
//                     value={filters.sort}
//                     popupClassName="dark:bg-gray-800 dark:text-white"
//                   >
//                     <Option value="recent">Most Recent</Option>
//                     <Option value="popular">Most Popular</Option>
//                     <Option value="trending">Trending</Option>
//                     <Option value="reading_time">Reading Time</Option>
//                   </Select>
                  
//                   <Select
//                     placeholder="Reading Time"
//                     className="w-full sm:w-40 dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:text-white dark:[&_.ant-select-selector]:border-gray-600"
//                     size="large"
//                     onChange={(value) => handleFilterChange('readingTime', value)}
//                     value={filters.readingTime}
//                     popupClassName="dark:bg-gray-800 dark:text-white"
//                     allowClear
//                   >
//                     <Option value="short">Quick Reads (Under 10 min)</Option> {/* Changed */}
//                     <Option value="medium">Medium (10-20 min)</Option> {/* Update these too if needed */}
//                     <Option value="long">Long Reads (20+ min)</Option>
//                   </Select>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Results summary */}
//         {articles.length > 0 && (
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
//             <div className="flex items-center gap-4">
//               <p className="text-sm text-muted-foreground dark:text-gray-400">
//                 Showing {articles.length} of {totalArticles} articles
//               </p>
//               {filters.readingTime && (
//                 <Badge 
//                   count={filters.readingTime === 'short' ? 'Quick Reads' : 
//                          filters.readingTime === 'medium' ? 'Medium Reads' : 'Long Reads'}
//                   className="dark:bg-blue-600"
//                 />
//               )}
//               {filters.category && categories.find(c => c.slug === filters.category) && (
//                 <Badge 
//                   count={categories.find(c => c.slug === filters.category)?.name}
//                   className="dark:bg-indigo-600"
//                 />
//               )}
//             </div>
//             {filters.search && (
//               <p className="text-sm text-foreground dark:text-gray-300">
//                 Search results for: <span className="font-semibold">"{filters.search}"</span>
//               </p>
//             )}
//           </div>
//         )}

//         {/* Articles Grid */}
//         <Row gutter={[24, 24]}>
//           {articles.map(article => renderArticleCard(article))}
//         </Row>

//         {/* Loading Skeletons */}
//         {loading && (
//           <Row gutter={[24, 24]} className="mt-8">
//             {[1, 2, 3, 4, 5, 6].map(i => (
//               <Col xs={24} sm={12} lg={8} xl={6} key={i}>
//                 <Card className="h-full bg-card dark:bg-gray-800 border dark:border-gray-700 shadow-sm">
//                   <Skeleton 
//                     active 
//                     avatar 
//                     paragraph={{ rows: 3 }} 
//                     title={false} 
//                   />
//                 </Card>
//               </Col>
//             ))}
//           </Row>
//         )}

//         {/* Empty State */}
//         {!loading && articles.length === 0 && (
//           <div className="my-16 p-12 rounded-xl text-center bg-card dark:bg-gray-800 text-card-foreground dark:text-gray-200 border dark:border-gray-700 shadow-sm">
//             <Empty
//               image={Empty.PRESENTED_IMAGE_SIMPLE}
//               description={
//                 <div>
//                   <h3 className="text-xl font-semibold text-foreground dark:text-white mb-4">
//                     No articles found
//                   </h3>
//                   <p className="max-w-md mx-auto mb-6 text-muted-foreground dark:text-gray-400">
//                     {activeTab === 'featured' 
//                       ? 'No featured articles available at the moment. Check back soon!' 
//                       : activeTab === 'premium'
//                       ? userHasPremium 
//                         ? 'No premium articles available. Explore our other content!'
//                         : 'Upgrade to premium to access exclusive articles!'
//                       : filters.search 
//                       ? `No articles match "${filters.search}". Try different keywords or filters.`
//                       : 'No articles found. Try exploring different categories or filters.'
//                     }
//                   </p>
//                   {(filters.category || filters.tag || filters.search || filters.readingTime) && (
//                     <Button 
//                       type="primary"
//                       className="mt-4 bg-gradient-to-r from-indigo-500 to-blue-500 border-0"
//                       onClick={() => {
//                         setFilters({
//                           category: '',
//                           tag: '',
//                           sort: 'recent',
//                           search: '',
//                           readingTime: undefined,
//                         });
//                         setActiveTab('all');
//                       }}
//                     >
//                       Clear all filters
//                     </Button>
//                   )}
//                   {activeTab === 'premium' && !userHasPremium && (
//                     <Button 
//                       type="primary"
//                       className="mt-4 ml-4 bg-gradient-to-r from-purple-600 to-blue-600 border-0"
//                       onClick={() => {
//                         try {
//                           if (typeof navigate === 'function') {
//                             navigate('/dashboard/subscription');
//                           } else {
//                             window.location.href = '/dashboard/subscription';
//                           }
//                         } catch (error) {
//                           window.location.href = '/dashboard/subscription';
//                         }
//                       }}
//                     >
//                       Upgrade to Premium
//                     </Button>
//                   )}
//                 </div>
//               }
//             />
//           </div>
//         )}

//         {/* Load More Trigger - Only show if we're in a tab view */}
//         {hasMore && !loading && articles.length > 0 && (
//           <div 
//             ref={loadMoreRef} 
//             className="my-12 flex justify-center"
//           >
//             <div className="px-6 py-3 rounded-lg text-muted-foreground dark:text-gray-400 text-sm">
//               <Progress percent={Math.min((articles.length / totalArticles) * 100, 90)} showInfo={false} />
//               <p className="mt-2">Loading more articles...</p>
//             </div>
//           </div>
//         )}

//         {!hasMore && articles.length > 0 && (
//           <div className="my-12 pt-8 text-center border-t dark:border-gray-700">
//             <p className="text-lg text-muted-foreground dark:text-gray-400">
//               🎉 You've reached the end! Keep exploring our other collections.
//             </p>
//             <Button 
//               type="link" 
//               className="mt-4 text-primary dark:text-blue-400"
//               onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//             >
//               Back to top <ArrowUpOutlined />
//             </Button>
//           </div>
//         )}
//       </div>

//       {/* Floating Action Button */}
//       <FloatButton.BackTop 
//         icon={<ArrowUpOutlined />}
//         className="dark:bg-gray-700 dark:text-white"
//       />
//     </div>
//   );
// };

// export default ArticleFeed;


// components/articles/ArticleFeed.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Input, 
  Select, 
  Avatar,
  Skeleton,
  Empty,
  Tabs,
  Divider,
  Tooltip,
  notification,
  Dropdown,
  Menu,
  FloatButton,
  Badge,
  Tag,
  Space,
  Progress,
  Statistic,
  Rate,
  Carousel,
  Image,
  Alert,
  Popover,
  Grid
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  FireOutlined,
  StarOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  CommentOutlined,
  CrownOutlined,
  GlobalOutlined,
  HistoryOutlined,
  HeartFilled,
  BookOutlined,
  BookFilled,
  MoreOutlined,
  RocketOutlined,
  BulbOutlined,
  ReadOutlined,
  ArrowUpOutlined,
  CompassOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  CoffeeOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  TeamOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  EditOutlined,
  CheckOutlined,
  ThunderboltFilled,
  UserOutlined,
  CalendarOutlined,
  FolderOutlined,
  TagOutlined,
  ShareAltOutlined,
  DownloadOutlined,
  SyncOutlined,
  AimOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  SolutionOutlined,
  ApiOutlined,
  DeploymentUnitOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  ClusterOutlined,
  RightCircleOutlined,
  LeftCircleOutlined,
  PlayCircleOutlined,
  CustomerServiceOutlined,
  HighlightOutlined,
  ContainerOutlined,
  ScheduleOutlined,
  LaptopOutlined,
  SolutionOutlined as SolutionIcon,
  SlidersOutlined,
  ControlOutlined,
  PauseOutlined,
  LeftOutlined,
  RightOutlined,
  ExperimentOutlined as ExperimentIcon,
  CoffeeOutlined as CoffeeIcon
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import articleApi, { Article, FilterParams, ArticleListDto } from '../../services/articleApi';
import { useAuthStore } from '@/client/stores/auth';
import './ArticleFeed.css';
import ArticleCard from './ArticleCard';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { useBreakpoint } = Grid;

interface ArticleFeedProps {
  showPersonalization?: boolean;
  initialTab?: 'featured' | 'recent' | 'trending' | 'short' | 'premium' | 'all' | 'editors-pick';
  hideFilters?: boolean;
}

interface FiltersState {
  category: string;
  tag: string;
  sort: 'recent' | 'popular' | 'trending' | 'reading_time';
  search: string;
  language?: string;
  readingTime?: 'short' | 'medium' | 'long';
}

const ArticleFeed: React.FC<ArticleFeedProps> = ({ 
  showPersonalization = true,
  initialTab = 'featured',
  hideFilters = false
}) => {
  const screens = useBreakpoint();
  let navigate: ReturnType<typeof useNavigate> | ((path: string) => void);
  
  try {
    navigate = useNavigate();
  } catch (error) {
    console.warn('Router context not available, using fallback navigation');
    navigate = (path: string) => window.location.href = path;
  }

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [shortArticles, setShortArticles] = useState<Article[]>([]);
  const [premiumArticles, setPremiumArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [editorsPickArticles, setEditorsPickArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const carouselRef = useRef<any>(null);
  const [filters, setFilters] = useState<FiltersState>({
    category: '',
    tag: '',
    sort: 'recent',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalArticles, setTotalArticles] = useState(0);
  const [userHasPremium, setUserHasPremium] = useState(false);
  const [platformStats, setPlatformStats] = useState({
    totalArticles: 0,
    totalAuthors: 0,
    totalLanguages: 0,
    totalReads: 0
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const [activeCarousel, setActiveCarousel] = useState(0);

  // Special article collections
  const [specialCollections, setSpecialCollections] = useState<Array<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  articlesCount: number;
  link: string;
}>>([]);

// Add this function
const fetchSpecialCollections = async () => {
  try {
    // Get popular categories to use as collections
    const categoriesResponse = await articleApi.getCategories();
    
    if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
      // Get top 4 categories by article count
      const topCategories = categoriesResponse.data
        .filter((cat: any) => cat.articleCount > 0)
        .sort((a: any, b: any) => (b.articleCount || 0) - (a.articleCount || 0))
        .slice(0, 4);
      
      // Map to collections with appropriate icons and colors
      const collectionColors = [
        "from-blue-500 to-cyan-500",
        "from-purple-500 to-pink-500",
        "from-green-500 to-emerald-500",
        "from-amber-500 to-orange-500"
      ];
      
      const collectionIcons = [
        <RocketOutlined />,
        <TrophyOutlined />,
        <BulbOutlined />,
        <ExperimentIcon />
      ];
      
      const collections = topCategories.map((category: any, index: number) => ({
        title: category.name,
        description: category.description || `Explore ${category.name.toLowerCase()} insights`,
        icon: collectionIcons[index] || <RocketOutlined />,
        color: collectionColors[index] || "from-blue-500 to-cyan-500",
        articlesCount: category.articleCount || 0,
        link: `/dashboard/articles?category=${category.slug}`
      }));
      
      setSpecialCollections(collections);
    }
  } catch (error) {
    console.error('Failed to fetch special collections:', error);
  }
};


  const knowledgePillars = [
    {
      title: "Practical Wisdom",
      description: "Actionable insights you can apply immediately",
      icon: <SolutionIcon />,
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      title: "Research-Backed",
      description: "Evidence-based strategies, not just opinions",
      icon: <ExperimentIcon />,
      color: "text-purple-600 dark:text-purple-400"
    },
    {
      title: "Expert-Curated",
      description: "Vetted by industry leaders and subject experts",
      icon: <SafetyCertificateOutlined />,
      color: "text-green-600 dark:text-green-400"
    },
    {
      title: "Time-Optimized",
      description: "Respect your time with focused, valuable content",
      icon: <CoffeeIcon />,
      color: "text-amber-600 dark:text-amber-400"
    }
  ];

  const handleTabChange = (key: string) => {
    const validKeys = ['featured', 'recent', 'trending', 'short', 'premium', 'all', 'editors-pick'];
    if (validKeys.includes(key as any)) {
      setActiveTab(key as typeof activeTab);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await articleApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

 

  const checkPremiumStatus = async () => {
    if (user) {
      try {
        setUserHasPremium(user.subscription?.status === 'ACTIVE' || false);
      } catch (error) {
        console.error('Failed to check premium status:', error);
      }
    }
  };

  const handleViewAll = (variant: 'featured' | 'short' | 'premium' | 'all' | 'trending' | 'authors' | 'categories' | 'editors-pick' | string) => {
    if (variant === 'authors') {
      navigate('/dashboard/authors');
    } else if (variant === 'categories') {
      navigate('/dashboard/categories');
    } else if (variant.startsWith('collection-')) {
      const collectionId = variant.replace('collection-', '');
      navigate(`/dashboard/collections/${collectionId}`);
    } else {
      setActiveTab(variant as any);
      const baseFilters: FiltersState = { category: '', tag: '', sort: 'recent', search: '' };
      
      switch (variant) {
        case 'featured':
          setFilters({ ...baseFilters });
          break;
        case 'short':
          setFilters({ ...baseFilters, readingTime: 'short', sort: 'reading_time' });
          break;
        case 'premium':
          setFilters({ ...baseFilters });
          break;
        case 'trending':
          setFilters({ ...baseFilters, sort: 'trending' });
          break;
        case 'editors-pick':
          setFilters({ ...baseFilters });
          break;
        default:
          setFilters(baseFilters);
      }
    }
    
    setTimeout(() => {
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const fetchArticles = useCallback(async (reset = false) => {
    if (loading) return;
    
    const currentPage = reset ? 1 : page;
    setLoading(true);
    
    try {
      const params: FilterParams = {
        page: currentPage,
        limit: 12,
        ...filters,
      };

      switch (activeTab) {
        case 'featured': params.featured = true; break;
        case 'trending': params.trending = true; params.sort = 'trending'; break;
        case 'short': params.sort = 'reading_time'; params.limit = 16; break;
        case 'premium': params.accessType = 'PREMIUM'; break;
        case 'editors-pick': params.featured = true; params.sort = 'popular'; break;
        case 'recent': params.sort = 'recent'; break;
      }

      Object.keys(params).forEach(key => {
        if (params[key as keyof FilterParams] === '' || params[key as keyof FilterParams] === undefined) {
          delete params[key as keyof FilterParams];
        }
      });

      const response = await articleApi.getArticles(params);
      let newArticles: Article[] = [];
      let newTotal = 0;
      let newHasMore = false;

      if (response.data) {
        if (Array.isArray(response.data)) {
          newArticles = response.data;
        } else if (response.data.articles && Array.isArray(response.data.articles)) {
          newArticles = response.data.articles;
          newTotal = response.data.total || response.data.articles.length;
          newHasMore = response.data.hasMore || false;
        }
      }

      if (activeTab === 'short') {
        newArticles = newArticles.filter(article => {
          const readingTime = article.readingTime || 5;
          return readingTime <= 10;
        });
        newHasMore = newArticles.length > 0 && currentPage < 3;
      }

      if (reset || currentPage === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }
      
      setTotalArticles(newTotal);
      setHasMore(newHasMore);
      if (reset) setPage(1);
      
    } catch (error: any) {
      console.error('Failed to load articles:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to load articles.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, page, loading, user, showPersonalization]);

  const fetchSpecializedArticles = async () => {
    try {
      const [featuredRes, shortRes, premiumRes, trendingRes, editorsPickRes] = await Promise.all([
        articleApi.getArticles({ featured: true, limit: 6 }),
        articleApi.getArticles({ limit: 20, sort: 'reading_time' }),
        articleApi.getArticles({ accessType: 'PREMIUM', limit: 6 }),
        articleApi.getArticles({ trending: true, limit: 6 }),
        articleApi.getArticles({ featured: true, sort: 'popular', limit: 4 })
      ]);

      if (featuredRes.data?.articles) setFeaturedArticles(featuredRes.data.articles);
      if (premiumRes.data?.articles) setPremiumArticles(premiumRes.data.articles);
      if (trendingRes.data?.articles) setTrendingArticles(trendingRes.data.articles);
      if (editorsPickRes.data?.articles) setEditorsPickArticles(editorsPickRes.data.articles);

      if (shortRes.data?.articles) {
        const actualShortArticles = shortRes.data.articles
          .filter(article => (article.readingTime || 5) <= 10)
          .slice(0, 6);
        setShortArticles(actualShortArticles);
      }
    } catch (error) {
      console.error('Failed to load specialized articles:', error);
    }
  };

  useEffect(() => {
    fetchArticles(true);
    fetchCategories();
    checkPremiumStatus();
    fetchSpecializedArticles();

  }, [activeTab, filters]);

  useEffect(() => {
    if (page > 1) {
      fetchArticles(false);
    }
  }, [page]);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );
    if (loadMoreRef.current) observerRef.current.observe(loadMoreRef.current);
    return () => observerRef.current?.disconnect();
  }, [hasMore, loading]);

  const handleFilterChange = (key: keyof FiltersState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  // Render a featured article card (larger, more prominent)
  const renderFeaturedArticle = (article: Article, index: number) => (
    <div key={article.id} className="relative h-full">
      <Card
        hoverable
        className="h-full border-0 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-indigo-100 to-blue-100 text-gray-900"
        onClick={() => navigate(`/dashboard/article/${article.slug}`)}
        cover={
          article.coverImage ? (
            <div className="relative h-64 overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                preview={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent"></div>
              <div className="absolute top-4 left-4">
                <Badge color="blue" className="font-semibold bg-blue-200 rounded-xl px-2">
                  Featured
                </Badge>
              </div>
            </div>
          ) : null
        }
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              src={article.author?.picture} 
              size="small"
              icon={!article.author?.picture && <UserOutlined />}
            />
            <div>
              <Text className="text-gray-900 text-sm">{article.author?.name || 'Unknown'}</Text>
              <Text className="ttext-gray-900 text-xs block">
                {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric' 
                })}
              </Text>
            </div>
          </div>
          
          <Title level={4} className="!text-gray-900 !mb-3 line-clamp-2">
            {article.title}
          </Title>
          
          <Paragraph className="text-gray-800 mb-4 line-clamp-3">
            {article.excerpt || 'Discover valuable insights in this featured article...'}
          </Paragraph>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4 text-gray-600">
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                <Text className="text-sm">{article.readingTime || 5} min</Text>
              </span>
              <span className="flex items-center gap-1">
                <EyeOutlined className="text-blue-600"/>
                <Text className="text-sm">{article.viewCount || 0}</Text>
              </span>
            </div>
            <Button 
              type="primary" 
              ghost 
              size="small"
              className="border-white/30 hover:border-white/50"
            >
              Read Article
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render a regular article card
  const renderArticleCard = (article: Article, variant: 'default' | 'compact' = 'default') => {
    if (variant === 'compact') {
      return (
        <div key={article.id} className="mb-4">
          <div 
            className="flex gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group"
            onClick={() => navigate(`/dashboard/article/${article.slug}`)}
          >
            <div className="flex-shrink-0">
              {article.coverImage ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden">
                  <Image
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    preview={false}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 flex items-center justify-center">
                  <BookOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Text strong className="block text-foreground dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {article.title}
              </Text>
              <div className="flex items-center gap-3 text-sm text-muted-foreground dark:text-gray-400">
                <span>{article.author?.name?.split(' ')[0] || 'Author'}</span>
                <span>•</span>
                <span>{article.readingTime || 5} min read</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={article.id}>
        <ArticleCard article={article} variant="default" />
      </Col>
    );
  };

  const tabs = [
    { key: 'featured', label: 'Featured', icon: <StarOutlined />, condition: true },
    { key: 'trending', label: 'Trending', icon: <FireOutlined />, condition: true },
    { key: 'editors-pick', label: "Editor's Pick", icon: <HighlightOutlined />, condition: true },
    { key: 'recent', label: 'Recent', icon: <HistoryOutlined />, condition: true },
    { key: 'short', label: 'Quick Reads', icon: <CoffeeOutlined />, condition: true },
    { key: 'premium', label: 'Premium', icon: <CrownOutlined />, condition: true },
    { key: 'all', label: 'All Articles', icon: <CompassOutlined />, condition: true }
  ].filter(tab => tab.condition);

  // Render a special collection section
  const renderSpecialCollection = (collection: typeof specialCollections[0], index: number) => (
    <Card
      key={index}
      hoverable
      className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-800"
      onClick={() => window.location.href = collection.link}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${collection.color} flex items-center justify-center mb-6 mx-auto`}>
        <div className="text-2xl text-white">{collection.icon}</div>
      </div>
      
      <Title level={4} className="text-center !mb-3 text-foreground dark:text-white">
        {collection.title}
      </Title>
      
      <Paragraph className="text-center text-muted-foreground dark:text-gray-400 mb-4">
        {collection.description}
      </Paragraph>
      
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Badge 
          count={`${collection.articlesCount} articles`}
          className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 text-gray-700 dark:text-gray-300"
        />
        <Button 
          type="link" 
          className="text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
        >
          Explore
          <ArrowRightOutlined className="text-sm" />
        </Button>
      </div>
    </Card>
  );

  // Render mixed layout section
  const renderMixedLayoutSection = (title: string, articles: Article[], variant: 'trending' | 'featured' | 'editors-pick') => {
    if (articles.length === 0) return null;
    
    return (
      <div className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Title level={2} className="!mb-2 text-3xl font-bold text-foreground dark:text-white">
              {title}
            </Title>
            <Text className="text-muted-foreground dark:text-gray-400">
              Handpicked excellence from our knowledge base
            </Text>
          </div>
          <Button 
            type="primary"
            ghost
            className="border-primary text-primary dark:border-blue-400 dark:text-blue-400 hover:bg-primary/10"
            onClick={() => handleViewAll(variant)}
          >
            View All
            <ArrowRightOutlined className="ml-2" />
          </Button>
        </div>
        
        <Row gutter={[24, 24]}>
          {/* Main featured article (2/3 width) */}
          <Col xs={24} lg={16}>
            {articles[0] && renderFeaturedArticle(articles[0], 0)}
          </Col>
          
          {/* Side column with compact articles (1/3 width) */}
          <Col xs={24} lg={8}>
            <div className="space-y-4">
              {articles.slice(1, 5).map((article, index) => 
                renderArticleCard(article, 'compact')
              )}
              
              <div className="pt-4 border-t border-blue-200 dark:border-indigo-700">
                <Button 
                  block 
                  type="link" 
                  className="text-primary dark:text-blue-400 font-medium"
                  onClick={() => handleViewAll(variant)}
                >
                  View all {title.toLowerCase()}
                  <ArrowRightOutlined className="ml-2" />
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

const renderFeaturedCarousel = () => {
  if (featuredArticles.length === 0) return null;

  const handlePrevSlide = () => carouselRef.current?.prev();
  const handleNextSlide = () => carouselRef.current?.next();

  return (
    <div className="mb-12 md:mb-16">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 md:mb-8 px-4 md:px-6">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <StarOutlined className="text-white text-sm md:text-lg" />
            </div>
            <span className="text-xs md:text-sm font-semibold text-blue-600 uppercase tracking-wider">
              Featured Stories
            </span>
          </div>
          <Title level={2} className="!mb-1 md:!mb-2 text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
            Today's Spotlight
          </Title>
          <Text className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            Essential reads strategically selected for you!
          </Text>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <Button
                type="text"
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handlePrevSlide}
                disabled={activeCarousel === 0}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 flex items-center justify-center"
                size="middle"
              />
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {activeCarousel + 1}
                  <span className="mx-1 text-gray-400">/</span>
                  {featuredArticles.length}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Slide</span>
              </div>
              <Button
                type={autoplay ? "default" : "primary"}
                shape="circle"
                icon={autoplay ? <PauseOutlined /> : <RightOutlined />}
                onClick={() => setAutoplay(!autoplay)}
                className={`w-10 h-10 flex items-center justify-center ${
                  autoplay 
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                size="middle"
              />
              <Button
                type="text"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleNextSlide}
                disabled={activeCarousel === featuredArticles.length - 1}
                className="hover:bg-gray-100 dark:hover:bg-gray-800 w-10 h-10 flex items-center justify-center"
                size="middle"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Carousel */}
      <div className="relative">
        <Carousel
          ref={carouselRef}
          dots={false}
          effect="fade"
          afterChange={setActiveCarousel}
          autoplay={autoplay}
          autoplaySpeed={5000}
          className="rounded-lg md:rounded-2xl overflow-hidden shadow-md md:shadow-lg mx-2 md:mx-0"
        >
          {featuredArticles.map((article) => (
            <div key={article.id} className="relative">
              {/* Background Image with Gradient */}
              <div className="relative h-[280px] sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[600px] overflow-hidden">
                <Image
                  src={article.coverImage || 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=500&fit=crop'}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  preview={false}
                />
                
                {/* Gradient Overlay - More prominent on mobile */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
                
                {/* Content Container */}
                <div className="absolute inset-0 flex items-end p-4 sm:p-6 md:p-8 lg:p-12">
                  <div className="w-full">
                    {/* Badge - Smaller on mobile */}
                    <div className="mb-2 md:mb-3">
                      <Badge 
                        count="Featured Story"
                        color="blue"
                        className="text-xs md:text-sm font-medium px-2 md:px-3 py-0.5 md:py-1"
                        style={{ backgroundColor: 'rgba(37, 99, 235, 0.9)' }}
                      />
                    </div>
                    {/* Title - Responsive sizing */}
                    <Typography.Title 
                      level={window.innerWidth < 640 ? 5 : window.innerWidth < 768 ? 4 : 1} 
                      className="!mb-2 md:!mb-3 text-white font-bold leading-tight"
                    >
                      {article.title}
                    </Typography.Title>
                    
                    {/* Excerpt - Responsive line clamping */}
                    <Paragraph className="text-white/90 text-sm sm:text-base md:text-lg mb-3 md:mb-4 line-clamp-2 sm:line-clamp-3">
                      {article.excerpt || 'Discover valuable insights in this featured article...'}
                    </Paragraph>
                    
                    {/* Meta Information - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
                      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                        <Avatar 
                          src={article.author?.picture}
                          size={window.innerWidth < 640 ? "small" : "default"}
                          icon={!article.author?.picture && <UserOutlined />}
                          className="border border-white/30 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <Text strong className="text-white text-sm md:text-base block truncate">
                            {article.author?.name || 'Unknown Author'}
                          </Text>
                          <div className="flex items-center gap-1 md:gap-2 text-white/70 text-xs md:text-sm mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <CalendarOutlined className="text-xs" />
                              {new Date(article.publishedAt || article.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: article.publishedAt?.includes('-') ? 'numeric' : undefined 
                              })}
                            </span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1 whitespace-nowrap">
                              <ClockCircleOutlined className="text-xs" />
                              {article.readingTime || 5} min read
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 md:gap-4 sm:ml-auto">
                        <div className="flex items-center gap-1 md:gap-2 text-white/70 text-sm">
                          <EyeOutlined className="text-sm" />
                          <span className="font-medium">{(article.viewCount || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 md:gap-2 text-white/70 text-sm">
                          <HeartOutlined className="text-sm" />
                          <span className="font-medium">{(article.likeCount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Call to Action - Stack on mobile */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
                      <Button
                        type="primary"
                        size={window.innerWidth < 640 ? "middle" : "large"}
                        className="w-full sm:w-auto bg-white text-gray-900 hover:bg-gray-100 font-semibold flex-1 sm:flex-none"
                        onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                        icon={<ArrowRightOutlined />}
                      >
                        Read Article
                      </Button>
                      <Button
                        type="default"
                        size={window.innerWidth < 640 ? "middle" : "large"}
                        className="w-full sm:w-auto bg-transparent text-white border-white/30 hover:bg-white/10 font-semibold flex-1 sm:flex-none"
                        onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                        icon={<BookOutlined />}
                      >
                        Save for Later
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Slide Indicators - Improved for mobile */}
        <div className="mt-4 md:mt-6 px-2 md:px-0">
          {/* Progress Bar */}
          <div className="w-full max-w-xs sm:max-w-md mx-auto mb-3 md:mb-4">
            <Progress
              percent={((activeCarousel + 1) / featuredArticles.length) * 100}
              showInfo={false}
              strokeColor="#3b82f6"
              trailColor="#e5e7eb"
              className="dark:[&_.ant-progress-inner]:bg-gray-800 [&_.ant-progress-bg]:h-1.5"
              size="small"
            />
          </div>

          {/* Dots Navigation - Larger on mobile for touch */}
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {featuredArticles.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveCarousel(index);
                  carouselRef.current?.goTo(index);
                }}
                className={`transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  index === activeCarousel
                    ? 'w-6 h-2 md:w-8 md:h-2 bg-blue-600'
                    : 'w-2 h-2 md:w-2 md:h-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                }`}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === activeCarousel}
              />
            ))}
          </div>

          {/* Slide Counter */}
          <div className="text-center mt-2 md:mt-3 text-xs md:text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {activeCarousel + 1}
            </span>
            <span className="mx-1 md:mx-2">/</span>
            <span>{featuredArticles.length}</span>
            <span className="ml-2 text-gray-400">featured stories</span>
          </div>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="md:hidden mt-6 px-4">
        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              type="text"
              shape="circle"
              icon={<LeftOutlined className="text-base" />}
              onClick={handlePrevSlide}
              disabled={activeCarousel === 0}
              size="middle"
              className="w-9 h-9 flex items-center justify-center"
            />
            <div className="flex flex-col items-center min-w-[60px]">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {activeCarousel + 1}
                <span className="mx-1">/</span>
                {featuredArticles.length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">Slide</span>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<RightOutlined className="text-base" />}
              onClick={handleNextSlide}
              disabled={activeCarousel === featuredArticles.length - 1}
              size="middle"
              className="w-9 h-9 flex items-center justify-center"
            />
          </div>
          
          <Button
            type={autoplay ? "default" : "primary"}
            shape="circle"
            icon={autoplay ? <PauseOutlined /> : <PlayCircleOutlined />}
            onClick={() => setAutoplay(!autoplay)}
            className={`w-9 h-9 flex items-center justify-center ${
              autoplay 
                ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            size="middle"
          />
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero Section */}
<div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-transparent"></div>
  <div className="relative max-w-7xl mx-auto px-6 py-20">
    <div className="text-center mb-4">
      <Badge 
        color="blue"
        className="mb-6 px-6 py-2 text-base font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full"
      >
        <RocketOutlined className="mr-2" />
        Cverra Knowledge Hub
      </Badge>
      
      <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
        Transform Information<br/>
        <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Into Understanding
        </span>
      </h1>
      
      <p className="text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
        Join {totalUsers.toLocaleString()}+ professionals who leverage our curated knowledge 
        to stay ahead in their careers and make better decisions.
      </p>
      
      {/* Buttons Container - Fixed */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Button
          size="large"
          type="primary"
          className="h-14 px-8 bg-white text-gray-900 hover:bg-gray-100 font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[180px] sm:min-w-[200px]"
          onClick={() => handleViewAll('featured')}
        >
          <ReadOutlined className="mr-2" />
          Start Reading
        </Button>
        
        <Button
          size="large"
          type="default"
          className="h-14 px-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 font-bold rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 min-w-[180px] sm:min-w-[200px] border-0"
          onClick={() => handleViewAll('premium')}
        >
          <CrownOutlined className="mr-2" />
          Access Premium
        </Button>


        <Button
          size="large"
          type="primary"
          ghost
          className="border-2 h-14 px-8 hover:shadow-3xl border-white text-white hover:bg-white"
          icon={<CompassOutlined />}
          onClick={() => navigate('/dashboard/articles/all')}
        >
          Browse All Articles
        </Button>
      </div>
    </div>
  </div>
</div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Knowledge Pillars */}
        <div className="mb-16">
          <Title level={2} className="text-center !mb-12 text-3xl font-bold text-foreground dark:text-white">
            Why Our Knowledge Stands Out
          </Title>
          <Row gutter={[24, 24]}>
            {knowledgePillars.map((pillar, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <div className="text-center p-6">
                  <div className={`w-16 h-16 rounded-2xl ${pillar.color} bg-opacity-10 flex items-center justify-center mb-4 mx-auto`}>
                    <div className={`text-2xl ${pillar.color}`}>{pillar.icon}</div>
                  </div>
                  <Title level={4} className="!mb-3 text-foreground dark:text-white">
                    {pillar.title}
                  </Title>
                  <Paragraph className="text-muted-foreground dark:text-gray-400">
                    {pillar.description}
                  </Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>

        {/* Featured Carousel */}
        {featuredArticles.length > 0 && renderFeaturedCarousel()}

        {/* Special Collections */}
        {/* <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Title level={2} className="!mb-2 text-3xl font-bold text-foreground dark:text-white">
                Explore Collections
              </Title>
                            <Text className="text-muted-foreground dark:text-gray-400">
                Curated topic bundles for focused learning
              </Text>
            </div>
            <Button 
              type="link" 
              className="text-primary dark:text-blue-400 font-medium"
              onClick={() => navigate('/dashboard/collections')}
            >
              View all collections
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
          
          <Row gutter={[24, 24]}>
            {specialCollections.map((collection, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                {renderSpecialCollection(collection, index)}
              </Col>
            ))}
          </Row>
        </div> */}

        {/* Mixed Layout: Editor's Pick */}
        {editorsPickArticles.length > 0 && renderMixedLayoutSection("Editor's Pick", editorsPickArticles, 'editors-pick')}

        {/* Trending Now Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <FireOutlined className="text-2xl text-orange-500" />
                <Title level={2} className="!mb-0 text-3xl font-bold text-foreground dark:text-white">
                  Trending Now
                </Title>
              </div>
              <Text className="text-muted-foreground dark:text-gray-400">
                What the community is reading this week
              </Text>
            </div>
            <Button 
              type="primary"
              ghost
              className="border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              onClick={() => handleViewAll('trending')}
            >
              View all trending
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
          
          {trendingArticles.length > 0 && (
            <Row gutter={[24, 24]}>
              {trendingArticles.slice(0, 3).map((article, index) => (
                <Col xs={24} lg={8} key={article.id}>
                  <Card
                    hoverable
                    className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800"
                    onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                  >
                    <div className="relative mb-4">
                      {article.coverImage && (
                        <div className="w-full h-48 rounded-lg overflow-hidden">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            preview={false}
                          />
                        </div>
                      )}
                      <div className="absolute top-2 left-3 bg-blue-300 rounded-xl px-2">
                        <Badge 
                          color="orange" 
                          className="font-semibold px-3 py-1"
                        >
                          #{index + 1} Trending
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Avatar 
                            src={article.author?.picture}
                            size="small"
                            icon={!article.author?.picture && <UserOutlined />}
                          />
                          <Text className="text-sm text-muted-foreground dark:text-gray-400">
                            {article.author?.name?.split(' ')[0] || 'Author'}
                          </Text>
                        </div>
                        <Text className="text-sm text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                          <EyeOutlined />
                          {article.viewCount?.toLocaleString() || '0'}
                        </Text>
                      </div>
                      
                      <Title level={4} className="!mb-3 line-clamp-2 text-foreground dark:text-white">
                        {article.title}
                      </Title>
                      
                      <Paragraph className="text-muted-foreground dark:text-gray-400 mb-4 line-clamp-2">
                        {article.excerpt || 'Read this trending article to stay informed...'}
                      </Paragraph>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                        <Text className="text-sm text-muted-foreground dark:text-gray-400 flex items-center gap-1">
                          <ClockCircleOutlined />
                          {article.readingTime || 5} min read
                        </Text>
                        <Button 
                          type="link" 
                          size="small"
                          className="text-blue-600 dark:text-blue-400"
                        >
                          Read now
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>

        {/* Quick Reads Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <CoffeeOutlined className="text-2xl text-amber-500" />
             <div className="flex flex-col items-center justify-center text-center">
                <Title level={2} className="!mb-2 text-3xl font-bold text-foreground dark:text-white">
                  Quick Reads
                </Title>
                <Text className="text-muted-foreground dark:text-gray-400">
                  Powerful insights under 10 minutes
                </Text>
              </div>
            </div>
            <Button 
              type="primary"
              className="bg-gradient-to-r from-amber-500 to-orange-500 border-0 text-white hover:from-amber-600 hover:to-orange-600"
              onClick={() => handleViewAll('short')}
            >
              Browse all quick reads
              <ArrowRightOutlined className="ml-2" />
            </Button>
          </div>
          
          <Row gutter={[24, 24]}>
            {shortArticles.slice(0, 4).map((article, index) => (
              <Col xs={24} sm={12} lg={6} key={article.id}>
                <Card
                  hoverable
                  className="h-full border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800"
                  onClick={() => navigate(`/dashboard/article/${article.slug}`)}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <Badge 
                        count={`${article.readingTime || 5} min`}
                        className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      />
                      {article.isPremium && (
                        <CrownOutlined className="text-amber-500" />
                      )}
                    </div>
                    
                    <Title level={4} className="!mb-3 line-clamp-3 text-foreground dark:text-white">
                      {article.title}
                    </Title>
                    
                    <Paragraph className="text-muted-foreground dark:text-gray-400 mb-4 line-clamp-2">
                      {article.excerpt || 'Quick insight you can apply immediately...'}
                    </Paragraph>
                    
                    <div className="flex items-center justify-between">
                      <Text className="text-sm text-muted-foreground dark:text-gray-400">
                        {article.author?.name?.split(' ')[0] || 'Expert'}
                      </Text>
                      <Button 
                        type="text" 
                        size="small"
                        className="text-blue-600 dark:text-blue-400"
                      >
                        Read →
                      </Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* Main Content Area with Tabs */}
        <div className="mb-16" id="main-content">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            {/* Tab Navigation */}
            <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                  <Button
                    key={tab.key}
                    type={activeTab === tab.key ? "primary" : "text"}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      activeTab === tab.key 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                    onClick={() => handleTabChange(tab.key)}
                    icon={tab.icon}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Advanced Search */}
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                  <Search
                    placeholder="Search articles, topics, or authors..."
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    className="w-full"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                  <Select
                    placeholder="Category"
                    allowClear
                    size="middle"
                    className="min-w-[140px]"
                    onChange={(value) => handleFilterChange('category', value)}
                    value={filters.category || undefined}
                  >
                    {categories.map(category => (
                      <Option key={category.id} value={category.slug}>
                        <div className="flex items-center gap-2">
                          <FolderOutlined />
                          <span>{category.name}</span>
                        </div>
                      </Option>
                    ))}
                  </Select>
                  
                  <Select
                    placeholder="Reading Time"
                    size="middle"
                    className="min-w-[160px]"
                    onChange={(value) => handleFilterChange('readingTime', value)}
                    value={filters.readingTime}
                  >
                    <Option value="short">Quick Reads (≤10 min)</Option>
                    <Option value="medium">Medium (10-20 min)</Option>
                    <Option value="long">Deep Dives (20+ min)</Option>
                  </Select>
                  
                  <Select
                    placeholder="Sort by"
                    size="middle"
                    className="min-w-[140px]"
                    onChange={(value) => handleFilterChange('sort', value)}
                    value={filters.sort}
                  >
                    <Option value="recent">Most Recent</Option>
                    <Option value="popular">Most Popular</Option>
                    <Option value="trending">Trending Now</Option>
                    <Option value="reading_time">Reading Time</Option>
                  </Select>
                  
                  <Button
                    type="default"
                    icon={<FilterOutlined />}
                    onClick={() => {
                      // Reset filters
                      setFilters({ category: '', tag: '', sort: 'recent', search: '' });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Results Header */}
            {articles.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-xl">
                <div>
                  <Text strong className="text-lg text-foreground dark:text-white">
                    {activeTab === 'featured' ? 'Featured Articles' :
                     activeTab === 'recent' ? 'Latest Articles' :
                     activeTab === 'trending' ? 'Trending Articles' :
                     activeTab === 'short' ? 'Quick Reads' :
                     activeTab === 'premium' ? 'Premium Content' :
                     activeTab === 'editors-pick' ? "Editor's Picks" :
                     'All Articles'}
                  </Text>
                  <Text className="text-muted-foreground dark:text-gray-400 block">
                    Showing {articles.length} of {totalArticles} articles
                  </Text>
                </div>
                
                <div className="flex items-center gap-2">
                  {filters.category && (
                    <Tag
                      color="blue"
                      closable
                      onClose={() => handleFilterChange('category', '')}
                    >
                      {categories.find(c => c.slug === filters.category)?.name}
                    </Tag>
                  )}
                  
                  {filters.search && (
                    <Tag
                      color="orange"
                      closable
                      onClose={() => handleFilterChange('search', '')}
                    >
                      Search: {filters.search}
                    </Tag>
                  )}
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {articles.length > 0 ? (
              <>
                <Row gutter={[24, 24]}>
                  {articles.map(article => renderArticleCard(article))}
                </Row>
                
                {/* Load More */}
                {hasMore && !loading && (
                  <div ref={loadMoreRef} className="mt-12 text-center">
                    <Button 
                      type="dashed" 
                      size="large"
                      className="px-12"
                      loading={loading}
                      onClick={() => setPage(prev => prev + 1)}
                    >
                      Load More Articles
                    </Button>
                  </div>
                )}
              </>
            ) : (
              !loading && (
                <div className="py-16 text-center">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <div>
                        <Title level={4} className="!mb-4 text-foreground dark:text-white">
                          No articles found
                        </Title>
                        <Paragraph className="text-muted-foreground dark:text-gray-400 mb-8">
                          {filters.search 
                            ? `No results for "${filters.search}". Try different keywords.`
                            : 'No articles match your current filters. Try adjusting your criteria.'}
                        </Paragraph>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            type="primary"
                            onClick={() => {
                              setFilters({ category: '', tag: '', sort: 'recent', search: '' });
                              setActiveTab('all');
                            }}
                          >
                            Clear Filters
                          </Button>
                          <Button onClick={() => navigate('/dashboard/categories')}>
                            Browse Categories
                          </Button>
                        </div>
                      </div>
                    }
                  />
                </div>
              )
            )}

            {/* Loading State */}
            {loading && (
              <Row gutter={[24, 24]} className="mt-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                    <Card className="border-0 shadow-sm">
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        </div>

        {/* Enhanced Category Explorer */}
<div className="mb-20">
  {/* Centered Header */}
  <div className="text-center mb-12">
    <div className="inline-flex items-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
        <CompassOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
      </div>
      <Title level={2} className="!mb-0 text-3xl font-bold">
        Knowledge Topics
      </Title>
    </div>
    <Text className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
      Explore specialized domains curated by experts. Each topic is designed to help you grow.
    </Text>
  </div>

  {/* Larger Cards Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {categories.slice(0, 8).map(category => {
      const categoryColor = category.color || '#3b82f6';
      
      return (
        <Card
          key={category.id}
          hoverable
          className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          onClick={() => {
            handleFilterChange('category', category.slug);
            setActiveTab('all');
          }}
        >
          {/* Color accent using stored color */}
          <div 
            className="h-3 w-full mb-6 rounded-t-lg"
            style={{ backgroundColor: categoryColor }}
          />
          
          <div className="text-center px-4 py-2">
            {/* Icon with subtle glow */}
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-800 shadow-md"
              style={{ 
                backgroundColor: `${categoryColor}15`,
                color: categoryColor
              }}
            >
              <FolderOutlined className="text-xl" />
            </div>
            
            {/* Category name with color */}
            <Title 
              level={4} 
              className="!mb-2 text-xl font-bold"
              style={{ color: categoryColor }}
            >
              {category.name}
            </Title>
            
            {/* Brief description if available */}
            {category.description && (
              <Text className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                {category.description}
              </Text>
            )}
            
            {/* Article count with icon */}
            <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
              <FileTextOutlined />
              <span className="font-medium">
                {category.articleCount || 0} articles
              </span>
            </div>
            
            {/* Explore button */}
            <Button 
              type="link"
              className="mt-4 text-blue-600 dark:text-blue-400 font-medium"
              icon={<ArrowRightOutlined />}
            >
              Explore Topic
            </Button>
          </div>
        </Card>
      );
    })}
  </div>

  {/* Centered View All Button */}
  <div className="text-center mt-12">
    <Button 
      type="primary"
      size="large"
      className="px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl"
      onClick={() => navigate('/dashboard/categories')}
      icon={<CompassOutlined />}
    >
      View All Categories
      <Badge 
        count={categories.length}
        className="ml-3 bg-white text-blue-600"
      />
    </Button>
    <Text className="mt-4 text-gray-500 dark:text-gray-400">
      Dive deeper into {categories.length} specialized topics
    </Text>
  </div>
</div>

        {/* Premium Section (if applicable) */}
        {!userHasPremium && (
          <div className="mb-16">
            <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-2xl p-12 text-white shadow-2xl">
              <div className="text-center max-w-3xl mx-auto">
                <CrownOutlined className="text-4xl text-yellow-300 mb-6" />
                <Title level={2} className="!text-white !mb-6">
                  Unlock Premium Knowledge
                </Title>
                <Paragraph className="text-xl text-purple-100 mb-10">
                  Access exclusive insights, expert interviews, and in-depth research 
                  that can transform your career and decision-making.
                </Paragraph>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="large"
                    type="primary"
                    className="bg-white text-purple-900 hover:bg-gray-100 font-bold px-8"
                    onClick={() => navigate('/dashboard/subscription')}
                  >
                    Try Premium
                  </Button>
                  <Button
                    size="large"
                    className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
                    onClick={() => handleViewAll('premium')}
                  >
                    View Premium Samples
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Final CTA */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-white shadow-2xl">
            <Title level={2} className="!text-white !mb-6">
              Ready to Accelerate Your Learning?
            </Title>
            <Paragraph className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of professionals who use our knowledge hub to stay ahead. 
              Whether you're building expertise, leading teams, or transforming industries.
            </Paragraph>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="large"
                type="primary"
                className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-8"
                onClick={() => handleViewAll('all')}
              >
                Start Reading Free
              </Button>
              <Button
                size="large"
                className="bg-transparent text-white border-2 border-white/30 hover:border-white/50"
                onClick={() => navigate('/dashboard/profile')}
              >
                <BookOutlined className="mr-2" />
                Save Articles
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Actions */}
      <FloatButton.Group shape="circle" style={{ right: 24, bottom: 100 }}>
        <FloatButton.BackTop icon={<ArrowUpOutlined />} />
        <FloatButton 
          icon={<SearchOutlined />}
          onClick={() => document.getElementById('main-content')?.scrollIntoView()}
          tooltip="Search Articles"
        />
        <FloatButton 
          icon={<BookOutlined />}
          onClick={() => navigate('/dashboard/profile')}
          tooltip="My Library"
        />
        <FloatButton 
          icon={<CompassOutlined />}
          onClick={() => handleViewAll('all')}
          tooltip="Explore All"
        />
      </FloatButton.Group>
    </div>
  );
};

export default ArticleFeed;