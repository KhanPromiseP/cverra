import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@reactive-resume/ui";
import { Sparkle, ArrowsClockwise, ThumbsUp, ThumbsDown } from "@phosphor-icons/react";
import { ArticleCard } from "@/client/components/articles/ArticleCard";
import { apiClient } from "@/client/services/api-client";

interface Recommendation {
  id: string;
  article: any;
  score: number;
  reason: string;
  source: string;
}

export function RecommendationsTab() {
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['/articles/recommendations/personalized', excludedIds],
    queryFn: async () => {
      const response = await apiClient.get('/articles/recommendations/personalized', {
        params: { 
          limit: 6,
          excludeIds: excludedIds.join(',')
        }
      });
      return response.data;
    },
  });

  const handleFeedback = async (articleId: string, feedback: 'liked' | 'not_interested') => {
    try {
      await apiClient.post('/articles/recommendations/feedback', {
        articleId,
        feedback
      });
      
      if (feedback === 'not_interested') {
        setExcludedIds(prev => [...prev, articleId]);
      }
      
      refetch();
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!recommendations?.length) {
    return (
      <div className="text-center py-12">
        <Sparkle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No recommendations yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Start reading articles to get personalized recommendations
        </p>
        <Button onClick={handleRefresh}>
          <ArrowsClockwise className="mr-2" size={18} />
          Refresh Recommendations
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Personalized For You
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Based on your reading history and preferences
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <ArrowsClockwise className="mr-2" size={16} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec: any) => (
          <div key={rec.id} className="relative group">
            <ArticleCard article={rec} />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-green-500/20 hover:bg-green-500/30"
                onClick={() => handleFeedback(rec.id, 'liked')}
              >
                <ThumbsUp size={14} className="text-green-500" />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 bg-red-500/20 hover:bg-red-500/30"
                onClick={() => handleFeedback(rec.id, 'not_interested')}
              >
                <ThumbsDown size={14} className="text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        💡 Tell us what you like to improve recommendations
      </div>
    </div>
  );
}