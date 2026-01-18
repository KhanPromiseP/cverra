import { t, Trans } from "@lingui/macro";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/client/services/user";
import { apiClient } from "@/client/services/api-client";
import { 
  BookOpenIcon, 
  TrophyIcon, 
  FireIcon,
  ClockIcon,
  UserPlusIcon,
  ShareIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  CalendarIcon,
  StarIcon,
  TagIcon,
  LightBulbIcon,
  ChartBarIcon,
  SparklesIcon,
  PencilIcon,
  BookmarkIcon,
  UserIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  BoltIcon,
  EyeIcon,
  HeartIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  BookmarkSquareIcon,
  AdjustmentsHorizontalIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  BeakerIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  MusicalNoteIcon,
  FilmIcon,
  MapIcon
} from "@heroicons/react/24/outline";
import { 
  TrophyIcon as TrophySolid,
  FireIcon as FireSolid,
  StarIcon as StarSolid,
  CheckCircleIcon as CheckCircleSolid
} from "@heroicons/react/24/solid";

// Define types
interface PublicProfileResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      name: string;
      username: string;
      picture?: string;
      createdAt: string;
      bio: string;
      title?: string;
      location?: string;
      website?: string;
    };
    stats?: {
      totalArticlesRead: number;
      totalReadingTime: number;
      averageReadingTime: number;
      favoriteCategory: string;
      readingStreak: number;
      weeklyGoal: number;
      weeklyProgress: number;
      savedArticlesCount: number;
      likedArticlesCount: number;
      articleCompletionRate?: number;
      totalAchievements: number;
      unlockedAchievements: number;
    };
    readingProfile?: {
      preferredCategories?: string[];
      readingLevel?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
      preferredReadingTime?: number;
      interests?: string[];
      readingStyle?: string;
      readingGoal?: string;
    };
    achievements?: {
      achievements: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        badgeColor: string;
        progress: number;
        totalRequired: number;
        unlocked: boolean;
        unlockedAt?: string;
        rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
        category: 'READING' | 'ENGAGEMENT' | 'MILESTONE' | 'COMMUNITY' | 'PREMIUM';
        points: number;
        order: number;
      }>;
      unlockedCount: number;
      totalPoints: number;
      nextMilestone?: string;
      rank?: string;
      globalRank?: number;
    };
    articles: Array<{
      id: string;
      title: string;
      slug: string;
      excerpt: string;
      category?: {
        name: string;
        color: string;
        icon: string;
      };
      author?: {
        name: string;
        username: string;
      };
      readingTime?: number;
      coverImage?: string;
      publishedAt: string;
      tags?: string[];
      viewCount?: number;
      likeCount?: number;
      commentCount?: number;
      userReaction?: 'LIKED' | 'SAVED' | 'READ';
    }>;
    topCategories: Array<{
      name: string;
      color: string;
      count: number;
      icon: string;
    }>;
    isAuthor: boolean;
    meta: {
      totalArticles: number;
      hasMoreArticles: boolean;
    };
    readingInsights?: {
      monthlyProgress: Array<{ month: string; count: number }>;
      peakReadingTimes: string[];
      mostProductiveDay: string;
    };
  };
}

const rarityConfig = {
  COMMON: { 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    bgColor: 'bg-gray-50 dark:bg-gray-900/50',
    borderColor: 'border-gray-200 dark:border-gray-800',
    iconColor: 'text-gray-500 dark:text-gray-400'
  },
  RARE: { 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-500 dark:text-blue-400'
  },
  EPIC: { 
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    iconColor: 'text-purple-500 dark:text-purple-400'
  },
  LEGENDARY: { 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-500 dark:text-yellow-400'
  }
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Technology': <BoltIcon className="w-5 h-5" />,
  'Science': <BeakerIcon className="w-5 h-5" />,
  'Business': <BriefcaseIcon className="w-5 h-5" />,
  'Health': <HeartIcon className="w-5 h-5" />,
  'Education': <AcademicCapIcon className="w-5 h-5" />,
  'Entertainment': <FilmIcon className="w-5 h-5" />,
  'Music': <MusicalNoteIcon className="w-5 h-5" />,
  'Finance': <CurrencyDollarIcon className="w-5 h-5" />,
  'Travel': <MapIcon className="w-5 h-5" />,
  'Design': <AdjustmentsHorizontalIcon className="w-5 h-5" />,
  'Programming': <DevicePhoneMobileIcon className="w-5 h-5" />,
  'default': <BookOpenIcon className="w-5 h-5" />
};

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, loading: userLoading } = useUser();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'achievements' | 'articles' | 'interests'>('achievements');

  // Check if it's the user's own profile
  useEffect(() => {
    if (!userLoading && currentUser && username === currentUser.username) {
      setIsOwnProfile(true);
    } else {
      setIsOwnProfile(false);
    }
  }, [currentUser, username, userLoading]);

  // Fetch public profile data
  const { 
    data: profileData, 
    isLoading, 
    error 
  } = useQuery<PublicProfileResponse>({
    queryKey: [`/user/${username}/public-profile`],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/user/${username}/public-profile`);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('User not found');
        }
        throw error;
      }
    },
    enabled: !!username,
    retry: 1,
  });

  // Format total reading time - shows hours when > 60 minutes
  const formatTotalReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return t`${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? t`${hours}h ${remainingMinutes}m` : t`${hours}h`;
  };

  // Format average reading time - always shows minutes
  const formatAverageReadingTime = (minutes: number) => {
    return t`${minutes}m`;
  };

  // Format article reading time - always shows minutes
  const formatArticleReadingTime = (minutes: number) => {
    return t`${minutes}m`;
  };

  const handleJoinClick = (source: string) => {
    if (isOwnProfile) {
      navigate('/dashboard/profile');
    } else {
      navigate(`/auth/register?ref=${username}&source=${source}`);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${username}`;
    const title = profileData?.data.user 
      ? t`${profileData.data.user.name}'s Knowledge Profile`
      : t`Knowledge Profile`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: t`Check out ${profileData?.data.user.name}'s reading achievements on Inlirah!`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert(t`Link copied to clipboard!`);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'book': <BookOpenIcon className="w-6 h-6" />,
      'trophy': <TrophyIcon className="w-6 h-6" />,
      'fire': <FireIcon className="w-6 h-6" />,
      'star': <StarIcon className="w-6 h-6" />,
      'clock': <ClockIcon className="w-6 h-6" />,
      'rocket': <RocketLaunchIcon className="w-6 h-6" />,
      'bolt': <BoltIcon className="w-6 h-6" />,
      'eye': <EyeIcon className="w-6 h-6" />,
      'heart': <HeartIcon className="w-6 h-6" />,
      'users': <UsersIcon className="w-6 h-6" />,
      'shield': <ShieldCheckIcon className="w-6 h-6" />,
      'check': <CheckCircleIcon className="w-6 h-6" />,
      'document': <DocumentTextIcon className="w-6 h-6" />
    };
    return iconMap[iconName.toLowerCase()] || <TrophyIcon className="w-6 h-6" />;
  };

  const getCategoryIcon = (categoryName: string) => {
    return categoryIcons[categoryName] || categoryIcons.default;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-2/3 space-y-6">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/3 space-y-4">
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="container max-w-md mx-auto px-4 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center">
            <UserIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t`Profile Not Found`}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t`The profile @${username} doesn't exist or hasn't been set up yet.`}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/articles')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {t`Browse Articles`}
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
            >
              {t`Go Home`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData?.data) return null;

  const { user, stats, readingProfile, achievements, articles, topCategories, isAuthor, readingInsights } = profileData.data;
  const unlockedAchievements = achievements?.achievements?.filter(a => a.unlocked) || [];
  const lockedAchievements = achievements?.achievements?.filter(a => !a.unlocked) || [];


  // Calculate missing fields for display
const getDisplayData = () => {
  if (!profileData?.data) return { stats: null, achievements: null };
  
  const { stats, achievements, articles } = profileData.data;
  
  // Calculate stats with defaults
  const calculatedStats = stats ? {
    ...stats,
    articleCompletionRate: stats.articleCompletionRate !== undefined 
      ? stats.articleCompletionRate 
      : (stats.totalArticlesRead && articles.length > 0 
          ? Math.round((stats.totalArticlesRead / articles.length) * 100) 
          : 0),
    totalAchievements: stats.totalAchievements || 50,
    unlockedAchievements: stats.unlockedAchievements || (achievements?.unlockedCount || 0),
  } : null;
  
  // Calculate achievements with defaults
  const calculatedAchievements = achievements ? {
    ...achievements,
    nextMilestone: achievements.nextMilestone || 
      (achievements.achievements?.find(a => !a.unlocked && a.progress > 0)?.title || t`Earn your first`),
    rank: achievements.rank || t`Beginner`,
    globalRank: achievements.globalRank || 9999,
  } : null;
  
  return { stats: calculatedStats, achievements: calculatedAchievements };
};

// Get display data
const displayData = getDisplayData();
const displayStats = displayData.stats;
const displayAchievements = displayData.achievements;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Back Button for Owner */}
      {isOwnProfile && (
        <div className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="container max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/dashboard/profile')}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                {t`Back to Your Profile`}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t`This is how others see your profile`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5"></div>
        <div className="container max-w-7xl mx-auto px-4 py-8 relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
            {/* User Info */}
            <div className="flex items-start gap-6">
              <div className="relative">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white dark:border-gray-800 shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl border-4 border-white dark:border-gray-800 shadow-xl">
                    {user.name.charAt(0)}
                  </div>
                )}
                {achievements?.unlockedCount !== undefined && (
                  <div className="absolute -bottom-2 -right-2 bg-background text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    🏆 {achievements.unlockedCount}
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.name}
                  </h1>
                  {isAuthor && (
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold rounded-full">
                      <PencilIcon className="w-3 h-3 inline mr-1" />
                      {t`Author`}
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  @{user.username}
                </p>
                <p className="text-gray-700 dark:text-gray-300 max-w-2xl mb-4">
                  {user.bio || t`Knowledge seeker and lifelong learner`}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    {t`Joined ${formatDate(user.createdAt)}`}
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapIcon className="w-4 h-4" />
                      {user.location}
                    </div>
                  )}
                  {user.website && (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <GlobeAltIcon className="w-4 h-4" />
                      {t`Website`}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                {t`Share`}
              </button>
              <button
                onClick={() => handleJoinClick('header')}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                <UserPlusIcon className="w-4 h-4" />
                {isOwnProfile ? t`Edit Profile` : t`Join Free`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpenIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalArticlesRead || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t`Articles Mastered`}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <ClockIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats ? formatTotalReadingTime(stats.totalReadingTime) : '0m'}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t`Reading Time`}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <FireIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.readingStreak || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t`Day Streak`}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <TrophyIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {achievements?.unlockedCount || 0}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t`Achievements`}</p>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="mb-6">
  <div className="flex flex-wrap sm:flex-nowrap border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
    <button
      onClick={() => setActiveTab('achievements')}
      className={`flex-1 min-w-0 px-3 sm:px-4 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
        activeTab === 'achievements'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-center justify-center sm:justify-start gap-2">
        <TrophyIcon className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">{t`Achievements`}</span>
        <span className="sm:hidden">{t`Achieve`}</span>
        {achievements?.unlockedCount && (
          <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded-full flex-shrink-0">
            {achievements.unlockedCount}
          </span>
        )}
      </div>
      {activeTab === 'achievements' && (
        <div className="absolute bottom-0 left-2 right-2 sm:left-0 sm:right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
      )}
    </button>
    
    <button
      onClick={() => setActiveTab('articles')}
      className={`flex-1 min-w-0 px-3 sm:px-4 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
        activeTab === 'articles'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-center justify-center sm:justify-start gap-2">
        <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">
          {isAuthor ? t`Published Articles` : t`Reading History`}
        </span>
        <span className="sm:hidden">
          {isAuthor ? t`Articles` : t`History`}
        </span>
        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs rounded-full flex-shrink-0">
          {articles.length}
        </span>
      </div>
      {activeTab === 'articles' && (
        <div className="absolute bottom-0 left-2 right-2 sm:left-0 sm:right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
      )}
    </button>
    
    <button
      onClick={() => setActiveTab('interests')}
      className={`flex-1 min-w-0 px-3 sm:px-4 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${
        activeTab === 'interests'
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-center justify-center sm:justify-start gap-2">
        <TagIcon className="w-4 h-4 flex-shrink-0" />
        <span className="hidden sm:inline">{t`Interests`}</span>
        <span className="sm:hidden">{t`Interests`}</span>
        <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 text-xs rounded-full flex-shrink-0">
          {topCategories.length}
        </span>
      </div>
      {activeTab === 'interests' && (
        <div className="absolute bottom-0 left-2 right-2 sm:left-0 sm:right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></div>
      )}
    </button>
  </div>
</div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'achievements' && (
              <div className="space-y-6">
                {/* Achievements Header */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t`Knowledge Achievements`}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {isAuthor 
                          ? t`${articles.length} articles published • ${stats?.totalArticlesRead || 0} total reads`
                          : t`${articles.length} articles read • ${formatTotalReadingTime(stats?.totalReadingTime || 0)} spent`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinClick('achievements_header')}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                    >
                      {isOwnProfile ? t`Earn More` : t`Start Earning`}
                    </button>
                  </div>
                </div>

                {/* Unlocked Achievements */}
                {unlockedAchievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                      {t`Unlocked Achievements`} ({unlockedAchievements.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {unlockedAchievements.map((achievement) => (
                        <div
                          key={achievement.id}
                          className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div 
                              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${achievement.badgeColor}20` }}
                            >
                              <div style={{ color: achievement.badgeColor }}>
                                {getAchievementIcon(achievement.icon)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {achievement.title}
                                </h4>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  rarityConfig[achievement.rarity].color
                                }`}>
                                  {achievement.rarity}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {achievement.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TrophyIcon className="w-4 h-4 text-yellow-500" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {achievement.points} {t`points`}
                                  </span>
                                </div>
                                {achievement.unlockedAt && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(achievement.unlockedAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* In Progress Achievements */}
                {lockedAchievements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-blue-500" />
                      {t`In Progress`} ({lockedAchievements.length})
                    </h3>
                    <div className="space-y-4">
                      {lockedAchievements.map((achievement) => {
                        const progressPercent = Math.round((achievement.progress / achievement.totalRequired) * 100);
                        return (
                          <div
                            key={achievement.id}
                            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 opacity-70"
                                style={{ backgroundColor: `${achievement.badgeColor}10` }}
                              >
                                <div style={{ color: achievement.badgeColor, opacity: 0.7 }}>
                                  {getAchievementIcon(achievement.icon)}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white opacity-90">
                                    {achievement.title}
                                  </h4>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    rarityConfig[achievement.rarity].color
                                  } opacity-70`}>
                                    {achievement.rarity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 opacity-80">
                                  {achievement.description}
                                </p>
                                
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                      {t`Progress: ${achievement.progress}/${achievement.totalRequired}`}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {progressPercent}%
                                    </span>
                                  </div>
                                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{ 
                                        width: `${progressPercent}%`,
                                        backgroundColor: achievement.badgeColor
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {unlockedAchievements.length === 0 && lockedAchievements.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <TrophyIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t`No Achievements Yet`}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {isOwnProfile 
                        ? t`Start reading articles to earn your first achievement!` 
                        : t`Join to start earning achievements and track your progress`}
                    </p>
                    <button
                      onClick={() => handleJoinClick('no_achievements')}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all"
                    >
                      {isOwnProfile ? t`Browse Articles` : t`Join to Start Earning`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'articles' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {isAuthor ? t`Published Articles` : t`Reading Journey`}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {isAuthor 
                          ? t`${articles.length} articles published • ${stats?.totalArticlesRead || 0} total reads`
                          : t`${articles.length} articles read • ${stats?.totalReadingTime || 0} minutes spent`}
                      </p>
                    </div>
                    <button
                      onClick={() => isAuthor ? window.open('/dashboard/article-admin/articles/new', '_blank') : handleJoinClick('articles_header')}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      {isAuthor ? t`Write New Article` : t`Start Reading`}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {articles.length > 0 ? (
                    articles.map((article) => (
                      <div
                        key={article.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group cursor-pointer"
                        onClick={() => window.open(`/dashboard/articles/${article.slug}`, '_blank')}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {article.coverImage && (
                            <div className="md:w-32 md:h-32 rounded-lg overflow-hidden flex-shrink-0">
                              <img 
                                src={article.coverImage} 
                                alt={article.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                                {article.title}
                              </h3>
                              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                {formatArticleReadingTime(article.readingTime || 5)}
                              </span>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                              {article.excerpt}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {article.category && (
                                <span 
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                                  style={{ 
                                    backgroundColor: `${article.category.color}20`,
                                    color: article.category.color
                                  }}
                                >
                                  {getCategoryIcon(article.category.name)}
                                  {article.category.name}
                                </span>
                              )}
                              {article.userReaction && (
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                                  article.userReaction === 'LIKED' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                }`}>
                                  {article.userReaction === 'LIKED' ? (
                                    <>
                                      <HeartIcon className="w-3 h-3" />
                                      {t`Liked`}
                                    </>
                                  ) : (
                                    <>
                                      <BookmarkIcon className="w-3 h-3" />
                                      {t`Saved`}
                                    </>
                                  )}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-4">
                                {article.viewCount && (
                                  <span className="flex items-center gap-1">
                                    <EyeIcon className="w-4 h-4" />
                                    {article.viewCount.toLocaleString()} {t`views`}
                                  </span>
                                )}
                                {article.likeCount && (
                                  <span className="flex items-center gap-1">
                                    <HeartIcon className="w-4 h-4" />
                                    {article.likeCount.toLocaleString()} {t`likes`}
                                  </span>
                                )}
                                {article.commentCount && (
                                  <span className="flex items-center gap-1">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                                    {article.commentCount} {t`comments`}
                                  </span>
                                )}
                              </div>
                              <span>
                                {formatDate(article.publishedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {isAuthor ? t`No Articles Published` : t`No Articles Read`}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {isAuthor 
                          ? t`Start sharing your knowledge with the community` 
                          : t`Begin your reading journey to see articles here`}
                      </p>
                      <button
                        onClick={() => navigate(isAuthor ? '/dashboard/article-admin/articles/new' : '/dashboard/articles')}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
                      >
                        {isAuthor ? t`Write First Article` : t`Browse Articles`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'interests' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t`Knowledge Interests`}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {topCategories.length} {t`categories`} • {stats?.favoriteCategory && t`Most active in ${stats.favoriteCategory}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoinClick('interests_header')}
                      className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                    >
                      {isOwnProfile ? t`Explore More` : t`Discover Topics`}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topCategories.map((category) => (
                    <div
                      key={category.name}
                      className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
                      onClick={() => window.open(`/dashboard/articles/all?cat=${category.name.toLowerCase()}`, '_blank')}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20`, color: category.color }}
                        >
                          {getCategoryIcon(category.name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {category.name}
                            </h3>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {category.count} {t`articles`}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full"
                              style={{ 
                                width: `${Math.min((category.count / Math.max(...topCategories.map(c => c.count))) * 100, 100)}%`,
                                backgroundColor: category.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {readingProfile?.readingLevel && (
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <AcademicCapIcon className="w-5 h-5 text-blue-600" />
                      {t`Reading Profile`}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t`Reading Level`}</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{readingProfile.readingLevel}</div>
                      </div>
                      {readingProfile.preferredReadingTime && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t`Preferred Time`}</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{readingProfile.preferredReadingTime} min</div>
                        </div>
                      )}
                      {readingProfile.readingGoal && (
                        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t`Reading Goal`}</div>
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{readingProfile.readingGoal}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join CTA Card */}
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <RocketLaunchIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">
                  {isOwnProfile ? t`Share Your Journey` : t`Start Your Journey`}
                </h3>
                <p className="text-blue-100 mb-6">
                  {isOwnProfile 
                    ? t`Inspire others with your knowledge growth` 
                    : t`Join thousands learning on Inlirah`}
                </p>
                <button
                  onClick={() => handleJoinClick('sidebar_cta')}
                  className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all mb-3"
                >
                  {isOwnProfile ? t`Share Profile` : t`Join Free →`}
                </button>
                
                <p className="text-sm text-blue-200">
                  {isOwnProfile 
                    ? t`Inform the world • Inlirah for all` 
                    : t`No credit card • learn on Inlirah`}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
<div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
    {t`Quick Stats`}
  </h3>
  <div className="space-y-3">
    {/* Completion Rate */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Completion Rate`}</span>
      <span className={`font-medium ${displayStats?.articleCompletionRate !== undefined ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
        {displayStats?.articleCompletionRate !== undefined ? `${displayStats.articleCompletionRate}%` : t`Calculating...`}
      </span>
    </div>
    
    {/* Avg Read Time */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Avg Read Time`}</span>
      <span className={`font-medium ${stats?.averageReadingTime ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
        {stats?.averageReadingTime ? formatAverageReadingTime(stats.averageReadingTime) : t`Start reading`}
      </span>
    </div>
    
    {/* Weekly Goal */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Weekly Goal`}</span>
      <span className={`font-medium ${stats?.weeklyGoal ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
        {stats?.weeklyGoal ? `${stats.weeklyProgress || 0}/${stats.weeklyGoal}` : t`Set a goal`}
      </span>
    </div>
    
    {/* Next Milestone */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Next Milestone`}</span>
      <span className={`font-medium ${displayAchievements?.nextMilestone ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
        {displayAchievements?.nextMilestone || t`Not yet`}
      </span>
    </div>
    
    {/* Liked Articles */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Liked Articles`}</span>
      <span className="font-medium text-gray-900 dark:text-white">
        {stats?.likedArticlesCount || 0}
      </span>
    </div>
    
    {/* Saved Articles */}
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t`Saved Articles`}</span>
      <span className="font-medium text-gray-900 dark:text-white">
        {stats?.savedArticlesCount || 0}
      </span>
    </div>
  </div>
</div>

{/* Reading Insights */}
<div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
    {t`Reading Insights`}
  </h3>
  
  {readingInsights ? (
    <div className="space-y-4">
      {/* Peak Reading Times */}
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t`Peak Reading Times`}</div>
        <div className="flex flex-wrap gap-2">
          {readingInsights.peakReadingTimes && readingInsights.peakReadingTimes.length > 0 ? (
            readingInsights.peakReadingTimes.map((time, index) => (
              <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm rounded-full">
                {time}
              </span>
            ))
          ) : (
            <div className="w-full text-center py-2">
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                {t`Read more to discover your peak times`}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Most Productive Day */}
      <div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t`Most Productive Day`}</div>
        <div className={`font-medium ${readingInsights.mostProductiveDay ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 italic'}`}>
          {readingInsights.mostProductiveDay || t`Keep reading to find out`}
        </div>
      </div>
      
      {/* Monthly Progress Summary */}
      {readingInsights.monthlyProgress && readingInsights.monthlyProgress.length > 0 && (
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t`Monthly Activity`}</div>
          <div className="text-sm text-gray-900 dark:text-white">
            {t`Active for ${readingInsights.monthlyProgress.length} months`}
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="text-center py-4">
  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
    <ChartBarIcon className="w-6 h-6 text-gray-400" />
  </div>
  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
    {t`Insights not yet available`}
  </p>
  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
    {isOwnProfile 
      ? t`Start reading to track your habits` 
      : t`Join to track your own reading insights`}
  </p>
</div>
  )}
</div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {isOwnProfile 
                ? t`Share Your Knowledge Journey` 
                : t`Ready to Build Your Knowledge Profile?`}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              {isOwnProfile 
                ? t`Your progress inspires others. Share your profile and grow the learning community.` 
                : t`Join Inlirah today and start tracking your reading journey.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => handleJoinClick('bottom_cta')}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                {isOwnProfile ? t`Share Profile` : t`Join Free Today`}
              </button>
              <button
                onClick={() => navigate('/dashboard/articles')}
                className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold rounded-xl border border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
              >
                {t`Browse Articles`}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>
    
  );
}