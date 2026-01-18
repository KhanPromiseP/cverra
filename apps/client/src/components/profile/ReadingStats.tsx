import { t, Trans } from "@lingui/macro";
import { 
  BookOpen, 
  Clock, 
  Calendar,
  Target,
  Trophy
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@reactive-resume/ui";

const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

export interface ReadingStatsProps {
  stats?: {
    totalArticlesRead?: number;
    totalReadingTime?: number;
    readingStreak?: number;
    weeklyProgress?: number;
    weeklyGoal?: number;
    savedArticlesCount?: number;
    likedArticlesCount?: number;
    averageReadingTime?: number;
    favoriteCategory?: string;
    nextMilestone?: {
      name: string;
      target: number;
      progress: number;
    };
  };
}

export function ReadingStats({ stats }: ReadingStatsProps) {
  // Calculate hours from minutes safely
  const totalHours = stats?.totalReadingTime 
    ? Math.round(stats.totalReadingTime / 60) 
    : 0;
  
  // Handle next milestone with safe defaults
  const nextMilestone = stats?.nextMilestone || {
    name: t`Getting Started`,
    target: 10,
    progress: stats?.totalArticlesRead || 0
  };

  // Calculate weekly goal progress percentage
  const weeklyGoalPercentage = stats?.weeklyGoal 
    ? Math.min(100, Math.round(((stats.weeklyProgress || 0) / stats.weeklyGoal) * 100))
    : 0;

  return (
    <>
      <StatCard
        title={t`Articles Read`}
        value={stats?.totalArticlesRead || 0}
        icon={BookOpen}
        color="text-blue-500"
        subtitle={t`Total articles completed`}
      />
      
      <StatCard
        title={t`Total Reading Time`}
        value={`${totalHours}h`}
        icon={Clock}
        color="text-green-500"
        subtitle={t`Time spent reading`}
      />
      
      <StatCard
        title={t`Reading Streak`}
        value={`${stats?.readingStreak || 0} ${t`days`}`}
        icon={Calendar}
        color="text-amber-500"
        subtitle={t`Current streak`}
      />
      
      <StatCard
        title={t`Weekly Goal`}
        value={`${stats?.weeklyProgress || 0}/${stats?.weeklyGoal}`}
        icon={Target}
        color="text-purple-500"
        subtitle={t`${weeklyGoalPercentage}% completed`}
      />

      {/* Optional: Next Milestone Card */}
      {stats?.nextMilestone && (
        <StatCard
          title={t`Next Milestone`}
          value={nextMilestone.name}
          icon={Trophy}
          color="text-red-500"
          subtitle={t`${nextMilestone.progress}/${nextMilestone.target} articles`}
        />
      )}

      {/* Additional stats */}
      {stats?.savedArticlesCount !== undefined && (
        <StatCard
          title={t`Saved Articles`}
          value={stats.savedArticlesCount}
          icon={BookOpen}
          color="text-indigo-500"
          subtitle={t`Articles bookmarked`}
        />
      )}

      {stats?.likedArticlesCount !== undefined && (
        <StatCard
          title={t`Liked Articles`}
          value={stats.likedArticlesCount}
          icon={Trophy}
          color="text-pink-500"
          subtitle={t`Articles you enjoyed`}
        />
      )}
    </>
  );
}