// components/home/KnowledgeHubSection.tsx
import React, { useState, useEffect } from 'react';
import { t } from "@lingui/macro";
import { useLingui } from "@lingui/react"; // Add Lingui hook
import { 
  ArrowRight, 
  BookOpen, 
  Brain, 
  ChartLineUp, 
  Coffee, 
  Crown, 
  Fire, 
  Globe, 
  Lightning, 
  Star, 
  Target, 
  TrendUp 
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Badge, Card, Button } from "@reactive-resume/ui";
import { useNavigate } from 'react-router';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  articleCount?: number;
  color?: string;
  isTranslated?: boolean;
  translationLanguage?: string;
}

interface Collection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  tag: string;
  link: string;
  type: 'featured' | 'trending' | 'short' | 'premium';
}

export const KnowledgeHubSection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  
  // Use Lingui for language management
  const { i18n } = useLingui();
  const currentLanguage = i18n.locale.split('-')[0]; // Get language code (en/fr)

  // Simplified icon mapping
  const categoryIconMap: Record<string, React.ComponentType<any>> = {
    'career': ChartLineUp,
    'technology': Lightning,
    'business': Target,
    'leadership': Crown,
    'productivity': Coffee,
    'marketing': Globe,
    'design': Star,
    'finance': TrendUp,
    'skills': Brain,
    'trends': Fire,
    'default': BookOpen,
  };

  // Collection definitions - using t() macro for translations
  const collectionDefinitions: Omit<Collection, 'icon'>[] = [
    {
      id: 'featured',
      title: t`Featured Articles`,
      description: t`Handpicked excellence. Our editors curate the most valuable insights.`,
      color: "from-amber-500 to-orange-500",
      tag: t`Editor's Choice`,
      link: "/dashboard/articles/all?tab=featured",
      type: 'featured'
    },
    {
      id: 'trending',
      title: t`Trending Insights`,
      description: t`What the community is learning right now. Stay ahead of the curve.`,
      color: "from-purple-500 to-pink-500",
      tag: t`Hot Now`,
      link: "/dashboard/articles/all?tab=trending",
      type: 'trending'
    },
    {
      id: 'short',
      title: t`Quick Reads`,
      description: t`Powerful insights under 10 minutes. Perfect for busy professionals.`,
      color: "from-blue-500 to-cyan-500",
      tag: t`Under 10 min`,
      link: "/dashboard/articles/all?tab=short&time=short",
      type: 'short'
    },
    {
      id: 'premium',
      title: t`Premium Content`,
      description: t`Exclusive deep dives from industry leaders and subject matter experts.`,
      color: "from-violet-500 to-purple-500",
      tag: t`Exclusive`,
      link: "/dashboard/articles/all?access=premium",
      type: 'premium'
    }
  ];

  // Map collection type to icon
  const collectionIconMap: Record<string, React.ComponentType<any>> = {
    'featured': Star,
    'trending': TrendUp,
    'short': Coffee,
    'premium': Crown,
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      console.log('📡 Fetching categories in language:', currentLanguage);
      
      const response = await axios.get('/api/articles/categories/all', {
        params: {
          language: currentLanguage
        }
      });
      
      if (response.data && response.data.success) {
        const categoriesData = response.data.data || [];
        
        const processedCategories = categoriesData.map((cat: any) => ({
          id: cat?.id || `cat-${Date.now()}`,
          name: cat?.name || t`Unnamed Category`,
          slug: cat?.slug || 'uncategorized',
          description: cat?.description || '',
          articleCount: cat?.articleCount || cat?._count?.articles || 0,
          color: cat?.color || getRandomColor(),
          isTranslated: cat?.isTranslated || false,
          translationLanguage: cat?.translationLanguage || 'en',
        }));
        
        // Sort by article count and limit to 8
        const sortedCategories = processedCategories
          .sort((a: any, b: any) => (b.articleCount || 0) - (a.articleCount || 0))
          .slice(0, 8);
        
        setCategories(sortedCategories);
      } else {
        setCategories([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch categories:', error.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate random colors
  const getRandomColor = () => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', 
      '#118AB2', '#EF476F', '#073B4C', '#7209B7',
      '#FF9A3C', '#3D84B8', '#F6416C', '#00B8A9'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Fetch collection data
  const fetchCollectionData = async () => {
    try {
      setLoadingCollections(true);
      
      const collectionsWithData = await Promise.all(
        collectionDefinitions.map(async (collection) => {
          try {
            const params: any = {
              language: currentLanguage,
              limit: 1,
              page: 1
            };
            
            switch (collection.type) {
              case 'featured':
                params.featured = true;
                break;
              case 'trending':
                params.sort = 'trending';
                break;
              case 'short':
                params.readingTime = 'short';
                break;
              case 'premium':
                params.accessType = 'PREMIUM';
                break;
            }
            
            const response = await axios.get('/api/articles', { params });
            
            let articleCount = 0;
            if (response.data && response.data.data) {
              if (Array.isArray(response.data.data)) {
                articleCount = response.data.data.length;
              } else if (response.data.data.articles && Array.isArray(response.data.data.articles)) {
                articleCount = response.data.data.articles.length;
              }
            }
            
            return {
              ...collection,
              icon: collectionIconMap[collection.type] || Star,
              tag: articleCount > 0 ? `${collection.tag} • ${articleCount}` : collection.tag
            };
          } catch (error) {
            console.error(`Failed to fetch ${collection.type} articles:`, error);
            return {
              ...collection,
              icon: collectionIconMap[collection.type] || Star,
              tag: collection.tag
            };
          }
        })
      );
      
      setCollections(collectionsWithData as Collection[]);
    } catch (error) {
      console.error('Failed to fetch collection data:', error);
      const collectionsWithIcons = collectionDefinitions.map(col => ({
        ...col,
        icon: collectionIconMap[col.type] || Star,
      }));
      setCollections(collectionsWithIcons as Collection[]);
    } finally {
      setLoadingCollections(false);
    }
  };

  // Fetch data when language changes
  useEffect(() => {
    console.log('🔄 Language changed to:', currentLanguage);
    fetchCategories();
    fetchCollectionData();
  }, [currentLanguage]);

  // Simple language change function using Lingui
  const changeLanguage = (lang: 'en' | 'fr') => {
    console.log('🌐 Changing language to:', lang);
    
    // Update Lingui locale (this triggers re-render of all t() macros)
    i18n.activate(lang);
    
    // Update localStorage for persistence
    localStorage.setItem('preferred-language', lang);
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.pushState({}, '', url.toString());
  };

  // Get category icon
  const getCategoryIcon = (category: Category) => {
    const slug = category.slug.toLowerCase();
    const name = category.name.toLowerCase();
    
    if (categoryIconMap[slug]) {
      return categoryIconMap[slug];
    }
    
    // Keyword matching (works for both languages)
    if (slug.includes('career') || name.includes('carrière') || name.includes('career') || slug.includes('job')) 
      return ChartLineUp;
    if (slug.includes('tech') || name.includes('technologie') || name.includes('tech') || slug.includes('programming')) 
      return Lightning;
    if (slug.includes('business') || name.includes('entreprise') || name.includes('business') || slug.includes('entrepreneur')) 
      return Target;
    if (slug.includes('leader') || name.includes('leadership') || name.includes('leader') || slug.includes('management')) 
      return Crown;
    if (slug.includes('productivity') || name.includes('productivité') || name.includes('productivity') || slug.includes('efficiency')) 
      return Coffee;
    if (slug.includes('market') || name.includes('marketing') || name.includes('market') || slug.includes('sales')) 
      return Globe;
    if (slug.includes('design') || name.includes('design') || name.includes('conception') || slug.includes('creative')) 
      return Star;
    if (slug.includes('finance') || name.includes('finance') || name.includes('argent') || slug.includes('money')) 
      return TrendUp;
    if (slug.includes('skill') || name.includes('compétence') || name.includes('skill') || slug.includes('learn')) 
      return Brain;
    if (slug.includes('trend') || name.includes('tendance') || name.includes('trend') || slug.includes('innovation')) 
      return Fire;
    
    return BookOpen;
  };

  // Get category tag
  const getCategoryTag = (category: Category) => {
    const articleCount = category.articleCount || 0;
    if (articleCount > 0) {
      return t`${articleCount} Article${articleCount !== 1 ? 's' : ''}`;
    }
    return t`Explore`;
  };

  // Handle category click
  const handleCategoryClick = (categorySlug: string) => {
    navigate(`/dashboard/articles/all?cat=${categorySlug}&lang=${currentLanguage}`);
  };

  // Handle collection click
  const handleCollectionClick = (collection: Collection) => {
    navigate(`${collection.link}&lang=${currentLanguage}`);
  };

  const knowledgeValues = [
    {
      title: t`Depth Over Volume`,
      description: t`We prioritize quality insights. Every article must provide genuine value.`,
      icon: Brain
    },
    {
      title: t`Actionable Insights`,
      description: t`Knowledge without application is noise. We focus on practical, actionable takeaways.`,
      icon: Target
    },
    {
      title: t`Multi-Language Access`,
      description: t`Wisdom shouldn't have language barriers. We translate excellence across borders.`,
      icon: Globe
    },
    {
      title: t`Real-World Application`,
      description: t`Theory meets practice. Our content is grounded in real professional challenges.`,
      icon: Lightning
    }
  ];

  return (
    <section id="knowledge-hub" className="relative py-32 overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-900 dark:to-amber-900/20">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/3 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
       

       
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto mb-10"
        >
          <Badge 
            variant="secondary"
            className="mb-4 px-6 py-2 text-lg font-semibold uppercase tracking-wider bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full"
          >
            <BookOpen className="w-5 h-5 mr-2" weight="fill" />
            {t`Knowledge Hub`}
          </Badge>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            <span className="block text-gray-900 dark:text-white mb-2">
              {t`Articles Are Not Content`}
            </span>
            <span className="block bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              {t`They're Distilled Thinking`}
            </span>
          </h2>

          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            {t`In a world overflowing with information, we provide understanding.`}
            <br />
            {t`Where others publish content, we distill wisdom.`}
          </p>
        </motion.div>

        {/* Knowledge Categories */}
        <div className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t`Explore by Category`}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t`Dive into specialized knowledge areas tailored for professional growth`}
            </p>
          </motion.div>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category, index) => {
                const CategoryIcon = getCategoryIcon(category);
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card 
                      className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                      onClick={() => handleCategoryClick(category.slug)}
                    >
                      {/* Category Icon */}
                      <div className="w-14 h-14 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <CategoryIcon className="w-7 h-7 text-amber-600 dark:text-amber-400" weight="fill" />
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {category.name}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className="text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          >
                            {getCategoryTag(category)}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {category.description || t`Explore insights in ${category.name.toLowerCase()}`}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {t`Browse Category`}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t`No categories available at the moment.`}
              </p>
              <button 
                onClick={fetchCategories}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                {t`Retry Loading Categories`}
              </button>
            </div>
          )}
        </div>

        {/* Knowledge Collections */}
        <div className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-10"
          >
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t`Curated Collections`}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t`Handpicked articles organized for maximum learning impact`}
            </p>
          </motion.div>
          
          {loadingCollections ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {collections.map((collection, index) => {
                const CollectionIcon = collection.icon;
                
                return (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card 
                      className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-6 shadow-xl hover:shadow-3xl transition-all duration-300 hover:scale-105 cursor-pointer group"
                      onClick={() => handleCollectionClick(collection)}
                    >
                      {/* Collection Icon */}
                      <div className={`w-14 h-14 bg-gradient-to-r ${collection.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <CollectionIcon className="w-7 h-7 text-white" weight="fill" />
                      </div>

                      {/* Content */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {collection.title}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className={`text-xs font-semibold bg-gradient-to-r ${collection.color}/20 text-gray-700 dark:text-gray-300 border border-transparent`}
                          >
                            {collection.tag}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                          {collection.description}
                        </p>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {t`Explore Collection`}
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Knowledge Values */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {knowledgeValues.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-8 h-8 text-amber-600 dark:text-amber-400" weight="fill" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {value.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};