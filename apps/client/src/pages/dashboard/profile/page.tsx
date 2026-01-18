import { t, Trans } from "@lingui/macro";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/client/services/user";
import { useNavigate } from "react-router";
import { ReadingStats } from "../../../components/profile/ReadingStats";
import { ReadingProfile } from "../../../components/profile/ReadingProfile";
import { AchievementBadges } from "../../../components/profile/AchievementBadges";
import { RecentActivity } from "../../../components/profile/RecentActivity";
import { apiClient } from "@/client/services/api-client";
import { 
  EyeIcon, 
  ShareIcon,
  ArrowTopRightOnSquareIcon,
  UserIcon
} from "@heroicons/react/24/outline";

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
  nextMilestone?: {
    name: string;
    target: number;
    progress: number;
  };
}

// Define types for categories
interface DatabaseCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  articleCount?: number;
}

// Define reading profile data type
interface ReadingProfileData {
  preferredCategories?: string[];
  readingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  preferredReadingTime?: number;
  interests?: string[];
  notifyNewArticles?: boolean;
  notifyTrending?: boolean;
  notifyPersonalized?: boolean;
  digestFrequency?: 'daily' | 'weekly' | 'none';
}

export default function UserProfilePage() {
  const { user } = useUser();
  const navigate = useNavigate();

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserProfileStats>({
    queryKey: ['/articles/user/reading-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/reading-stats');
      return response.data?.data || response.data;
    },
  });

  // Fetch reading profile
  const { 
    data: readingProfile, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = useQuery<ReadingProfileData>({
    queryKey: ['/articles/user/reading-profile'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/articles/user/reading-profile');
        console.log('📊 Reading profile response:', response.data);
        
        // Handle different response formats
        if (response.data?.success) {
          return response.data.data || null;
        }
        return response.data || null;
      } catch (error) {
        console.error('Failed to fetch reading profile:', error);
        return null;
      }
    },
  });

  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: categoriesLoading,
    error: categoriesError 
  } = useQuery<DatabaseCategory[]>({
    queryKey: ['/articles/categories/all'],
    queryFn: async () => {
      try {
        console.log('📊 Fetching categories from /articles/categories/all...');
        const response = await apiClient.get('/articles/categories/all');
        console.log('📊 Categories response:', response.data);
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
          return response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
        
        console.warn('📊 Unexpected categories response format:', response.data);
        return [];
      } catch (error: any) {
        console.error('❌ Failed to fetch categories:', error.message);
        
        // If /categories/all doesn't work, try /categories
        if (error.response?.status === 404) {
          console.log('⚠️ Trying /articles/categories endpoint...');
          try {
            const fallbackResponse = await apiClient.get('/articles/categories');
            if (Array.isArray(fallbackResponse.data)) {
              return fallbackResponse.data;
            }
          } catch (fallbackError) {
            console.error('❌ Both endpoints failed:', fallbackError);
          }
        }
        
        return [];
      }
    },
    retry: 2,
  });

  // Handle profile update
  const handleUpdateProfile = async (updatedData: ReadingProfileData) => {
    try {
      console.log('💾 Updating profile with data:', updatedData);
      
      const response = await apiClient.put('/articles/user/reading-profile', updatedData);
      
      console.log('✅ Update response:', response.data);
      
      // Refetch the profile to update UI
      await refetchProfile();
      
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      throw error;
    }
  };

  // Get public profile URL
  const getPublicProfileUrl = () => {
    if (!user?.username) return '';
    return `${window.location.origin}/profile/${user.username}`;
  };

  // Handle view public profile - navigates to the actual public profile page
  const handleViewPublicProfile = () => {
    if (user?.username) {
      navigate(`/profile/${user.username}`);
    }
  };

  // Handle share profile
  const handleShareProfile = () => {
    const url = getPublicProfileUrl();
    if (url) {
      navigator.clipboard.writeText(url);
      alert(t`Public profile link copied to clipboard!`);
    }
  };

  const isLoading = statsLoading || profileLoading;

  if (isLoading) {
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
      {/* Header with Public Profile Controls */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t`My Reading Profile`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t`Manage your saved articles, reading preferences, and track your reading journey`}
            </p>
          </div>
          
          {/* Public Profile Controls */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleViewPublicProfile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              {t`View Public Profile`}
            </button>
            
            <button
              onClick={handleShareProfile}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800/50 transition-colors"
            >
              <ShareIcon className="w-4 h-4" />
              {t`Share Profile`}
            </button>
          </div>
        </div>
        
        {/* Public Profile URL Display */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm">
              <span className="text-gray-500 dark:text-gray-400">{t`Your public profile URL:`}</span>
              <div className="mt-1 font-mono text-blue-600 dark:text-blue-400 break-all">
                {getPublicProfileUrl()}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleViewPublicProfile}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <EyeIcon className="w-3 h-3" />
                {t`View`}
              </button>
              <button
                onClick={() => window.open(getPublicProfileUrl(), '_blank')}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                {t`Open New Tab`}
              </button>
              <button
                onClick={handleShareProfile}
                className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <ShareIcon className="w-3 h-3" />
                {t`Copy`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReadingStats stats={userStats} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
        {/* Left Column - Profile & Achievements */}
        <div className="lg:col-span-1 space-y-6">
          <ReadingProfile 
            profile={readingProfile || null}
            categories={categories}
            onUpdate={handleUpdateProfile}
            isLoading={profileLoading}
            isLoadingCategories={categoriesLoading}
          />
          
          <AchievementBadges />
          
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}