import { useState } from "react";
import { Button, Badge } from "@reactive-resume/ui";
import { 
  Crown, 
  Lock, 
  Check, 
  Clock,
  Calendar,
  Download
} from "@phosphor-icons/react";
import { ArticleCard } from "@/client/components/articles/ArticleCard";
import { apiClient } from "@/client/services/api-client";
import { useUser } from "@/client/services/user";

// Add proper TypeScript interfaces
interface Article {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  coverImage?: string;
  category?: {
    name: string;
    color: string;
  };
  isPremium?: boolean;
  price?: number;
  slug: string;
}

interface ArticleAccess {
  id: string;
  article: Article;
  accessType: 'PURCHASED' | 'SUBSCRIPTION';
  accessUntil: string;
  purchasedAt?: string;
}

interface Subscription {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
  planId: string;
  currentPeriodEnd: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
  subscription?: Subscription;
}

interface PremiumArticlesTabProps {
  articles: ArticleAccess[];
  onRefresh: () => void;
}

export function PremiumArticlesTab({ articles = [], onRefresh }: PremiumArticlesTabProps) {
  const { user } = useUser() as { user?: User };
  const [activeFilter, setActiveFilter] = useState<'all' | 'purchased' | 'subscription'>('all');

  // Fixed filtering with proper type checking
  const filteredArticles = articles.filter(article => {
    if (!article || !article.accessType) return false;
    if (activeFilter === 'purchased') return article.accessType === 'PURCHASED';
    if (activeFilter === 'subscription') return article.accessType === 'SUBSCRIPTION';
    return true;
  });

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Invalid date:', date);
      return 'Invalid date';
    }
  };

  const getRemainingDays = (accessUntil: string) => {
    try {
      const endDate = new Date(accessUntil);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // If accessUntil is in the past, return 0
      if (endDate < today) return 0;
      
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return Math.max(0, diffDays);
    } catch (error) {
      console.error('Invalid date for remaining days calculation:', accessUntil);
      return 0;
    }
  };

  const handleDownload = async (articleId: string, articleTitle: string) => {
    try {
      const response = await apiClient.get(`/articles/${articleId}/export/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${articleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download article:', error);
      // You might want to add a toast notification here
    }
  };

  // Dark mode class detection (you might want to use a proper theme hook)
  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Premium Access ({articles.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Articles accessible through purchase or subscription
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={user?.subscription?.status === 'ACTIVE' ? 'default' : 'secondary'}
            className="dark:border-gray-600"
          >
            {user?.subscription?.status === 'ACTIVE' ? 'Active Subscription' : 'No Active Subscription'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
          className={activeFilter === 'all' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600' 
            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          }
        >
          All Premium
        </Button>
        <Button
          variant={activeFilter === 'purchased' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('purchased')}
          className={activeFilter === 'purchased' 
            ? 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600' 
            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          }
        >
          <Crown className="mr-2" size={14} />
          Purchased
        </Button>
        <Button
          variant={activeFilter === 'subscription' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('subscription')}
          className={activeFilter === 'subscription' 
            ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600' 
            : 'dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
          }
        >
          <Check className="mr-2" size={14} />
          Subscription
        </Button>
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Lock className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {activeFilter === 'all' ? 'No premium access yet' : `No ${activeFilter} articles`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {activeFilter === 'all' 
              ? "Purchase individual articles or subscribe to get access to premium content"
              : `You don't have any ${activeFilter === 'purchased' ? 'purchased' : 'subscription'} articles yet`
            }
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard/articles'}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Browse Premium Articles
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((access) => (
              <div 
                key={access.id} 
                className="flex flex-col h-full" // Added flex-col and h-full
              >
                {/* Card Container */}
                <div className="relative group flex-grow">
                  <ArticleCard article={access.article} />
                  
                  {/* Access Badge */}
                  <div className="absolute top-7 left-40 z-10">
                    <Badge 
                      variant={access.accessType === 'SUBSCRIPTION' ? 'default' : 'secondary'}
                      className={access.accessType === 'SUBSCRIPTION' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' 
                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800'
                      }
                    >
                      {access.accessType === 'SUBSCRIPTION' ? 'Subscription' : 'Purchased'}
                    </Badge>
                  </div>
                </div>
                
                {/* Access Info - Now properly spaced below the card */}
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar size={14} />
                      <span>Access until:</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDate(access.accessUntil)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock size={14} />
                      <span>Remaining:</span>
                    </div>
                    <span className={`font-medium ${
                      getRemainingDays(access.accessUntil) < 7 
                        ? 'text-amber-600 dark:text-amber-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {getRemainingDays(access.accessUntil)} days
                    </span>
                  </div>
               
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-6 rounded-lg border border-blue-200 dark:border-blue-900/50 mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Access Summary
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {articles.filter(a => a.accessType === 'SUBSCRIPTION').length}
                  </span> subscription articles • 
                  <span className="font-medium text-purple-600 dark:text-purple-400 ml-1">
                    {articles.filter(a => a.accessType === 'PURCHASED').length}
                  </span> purchased articles
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={onRefresh}
                  className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Refresh Access
                </Button>
                <Button 
                  variant="default"
                  onClick={() => window.location.href = '/dashboard/articles'}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  Browse More
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}