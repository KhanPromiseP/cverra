import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/client/services/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@reactive-resume/ui";
import { 
  BookmarkSimple, 
  Crown, 
  Heart, 
  Clock, 
  ChartLine, 
  Star,
  Eye,
  BookOpen,
  Trophy,
  Calendar
} from "@phosphor-icons/react";

// Components
import { RecommendationsTab } from "../../../components/profile/RecommendationsTab";
import { SavedArticlesTab } from "../../../components/profile/SavedArticlesTab";
import { PremiumArticlesTab } from "../../../components/profile/PremiumArticlesTab";
import { ReadingStats } from "../../../components/profile/ReadingStats";
import { ReadingProfile } from "../../../components/profile/ReadingProfile";
import { AchievementBadges } from "../../../components/profile/AchievementBadges";
import { RecentActivity } from "../../../components/profile/RecentActivity";

// API
import { articleApi, type Article } from "@/client/services/articleApi";
import { apiClient } from "@/client/services/api-client";

interface UserProfileStats {
  totalArticlesRead: number;
  totalReadingTime: number;
  averageReadingTime: number;
  favoriteCategory: string;
  readingStreak: number;
  weeklyGoal: number;
  weeklyProgress: number;
  savedArticlesCount: number;
  likedArticlesCount: number;
}

interface ReadingProfile {
  preferredCategories: string[];
  readingLevel: string;
  preferredReadingTime: number;
  interests: string[];
}

export default function UserProfilePage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("recommendations");

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/articles/user/profile-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/profile-stats');
      return response.data;
    },
  });

  // Fetch reading profile
  const { data: readingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['/user/reading-profile'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/reading-profile');
      return response.data;
    },
  });

  // Fetch saved articles
    const { data: savedArticles, refetch: refetchSaved } = useQuery({
        queryKey: ['/articles/user/saved'],
        queryFn: async () => {
            const response = await apiClient.get('/articles/user/saved');
            return response.data.data || []; // Note: accessing .data.data
        },
    });

  // Fetch premium articles
    const { data: premiumArticles, refetch: refetchPremium } = useQuery({
        queryKey: ['/articles/user/premium-access'],
        queryFn: async () => {
            const response = await apiClient.get('/articles/user/premium-access');
            return response.data.data || []; // Note: accessing .data.data
        },
    });

  if (statsLoading || profileLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          My Reading Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your saved articles, reading preferences, and track your reading journey
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReadingStats />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Left Column - Profile & Achievements */}
        <div className="lg:col-span-1 space-y-6">
          <ReadingProfile 
            profile={readingProfile}
            onUpdate={() => {}}
          />
          
          <AchievementBadges />
          
          <RecentActivity />
        </div>

        {/* Right Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Star size={18} />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-2">
                <BookmarkSimple size={18} />
                Saved
                {savedArticles?.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {savedArticles.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex items-center gap-2">
                <Crown size={18} />
                Premium Access
                {premiumArticles?.length > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                    {premiumArticles.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-6">
              <RecommendationsTab />
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <SavedArticlesTab 
                articles={savedArticles}
                onRefresh={refetchSaved}
              />
            </TabsContent>

            <TabsContent value="premium" className="space-y-6">
              <PremiumArticlesTab 
                articles={premiumArticles}
                onRefresh={refetchPremium}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}