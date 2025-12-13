import { useQuery } from "@tanstack/react-query";
import { 
  BookOpen, 
  Clock, 
  Eye, 
  TrendingUp,
  Calendar,
  Target
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@reactive-resume/ui";
import { apiClient } from "@/client/services/api-client";

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

export function ReadingStats() {
  const { data: stats } = useQuery({
    queryKey: ['/articles/user/reading/stats'],
    queryFn: async () => {
      const response = await apiClient.get('/articles/user/reading/stats');
      return response.data;
    },
  });

  return (
    <>
      <StatCard
        title="Articles Read"
        value={stats?.totalArticlesRead || 0}
        icon={BookOpen}
        color="text-blue-500"
        subtitle="Total articles completed"
      />
      
      <StatCard
        title="Total Reading Time"
        value={`${Math.round((stats?.totalReadingTime || 0) / 60)}h`}
        icon={Clock}
        color="text-green-500"
        subtitle="Time spent reading"
      />
      
      <StatCard
        title="Reading Streak"
        value={`${stats?.readingStreak || 0} days`}
        icon={Calendar}
        color="text-amber-500"
        subtitle="Current streak"
      />
      
      <StatCard
        title="Weekly Goal"
        value={`${stats?.weeklyProgress || 0}/${stats?.weeklyGoal || 5}`}
        icon={Target}
        color="text-purple-500"
        subtitle="Articles this week"
      />
    </>
  );
}