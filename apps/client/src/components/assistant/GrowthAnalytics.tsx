// components/assistant/GrowthAnalytics.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Calendar,
  Target,
  Brain,
  Clock,
  Award,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  Filter,
  Sparkles,
  Lightbulb,
  Heart,
  Scale,
  Network,
  BookOpen,
  Briefcase,
  Zap,
  AlertCircle,
  CheckCircle2,
  Activity,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import {
  Line,
  Bar,
  Radar,
  Pie,
  Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler,
} from 'chart.js';
import { useAssistant } from '../../hooks/useAssistant';
import { format, subMonths, eachMonthOfInterval, differenceInDays } from 'date-fns';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { toast } from 'sonner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement,
  Filler
);

interface AnalyticsData {
  // User Info
  user?: {
    name?: string;
    memberSince?: string;
    tier?: string;
  };
  
  // Summary Stats
  totalConversations?: number;
  totalMessages?: number;
  completedGoals?: number;
  totalMemories?: number;
  totalDecisions?: number;
  totalBrainItems?: number;
  activeDays?: number;
  currentStreak?: number;
  longestStreak?: number;
  
  // Growth Metrics
  growth?: {
    conversations?: number;
    messages?: number;
    goals?: number;
  };
  
  // Time Series Data
  conversationsByMonth?: number[];
  messagesByMonth?: number[];
  months?: string[];
  
  // Topic Distribution
  topTopics?: Array<{ topic: string; count: number; percentage: number }>;
  
  // Goal Progress
  goalProgress?: Array<{
    id: string;
    description: string;
    progress: number;
    category: string;
    daysActive: number;
    stalled: boolean;
  }>;
  
  // Emotional Trends
  emotionalTrends?: {
    dominant?: string;
    distribution?: Record<string, number>;
    volatility?: number;
    fatigueDays?: number;
    motivationDays?: number;
  };
  
  // Learning Path
  learningPath?: Array<{
    skill: string;
    currentLevel: number;
    targetLevel: number;
    confidence: number;
    priority: string;
  }>;
  
  // Insights
  insights?: Array<{
    type: 'success' | 'warning' | 'info' | 'achievement';
    message: string;
    action?: string;
  }>;
  
  // Achievements
  achievements?: number;
  percentile?: number;
  totalHours?: number;
  engagement?: {
    avgSession?: string;
  };
  
  // Topic Distribution (alternative format)
  topicDistribution?: number[];
  skillLabels?: string[];
  currentSkills?: number[];
  targetSkills?: number[];
}

export const GrowthAnalytics: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '3m' | '6m' | '1y'>('3m');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    goals: true,
    learning: false,
    emotional: true,
    insights: true,
  });

  const { getAuthHeaders, userTier } = useAssistant();

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/assistant/analytics/growth?timeframe=${timeframe}`, { headers });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No data yet - show empty state with defaults
          setAnalytics({});
          return;
        }
        throw new Error(`Failed to load analytics: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        setAnalytics({});
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setError('Unable to load analytics. Please try again later.');
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [timeframe, getAuthHeaders]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExport = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`/api/assistant/analytics/export?timeframe=${timeframe}`, { headers });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `growth-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      
      toast.success('Analytics exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export analytics');
    }
  };

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  // Get user name from multiple possible sources
  const userName = analytics?.user?.name || 
                  (typeof window !== 'undefined' ? 
                    (localStorage.getItem('userName') || 
                     sessionStorage.getItem('userName') || 
                     'there') : 
                    'there');

  const memberSince = analytics?.user?.memberSince 
    ? format(new Date(analytics.user.memberSince), 'MMMM yyyy')
    : 'recently';

  if (error || (!analytics || Object.keys(analytics).length === 0)) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 flex items-center justify-center">
            <Activity className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No Analytics Yet</h3>
          <p className="text-muted-foreground mb-6">
            Start using the assistant to see your growth analytics. Track conversations, goals, and progress over time.
          </p>
          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Chart data - use real data with fallbacks to empty arrays
  const months = analytics.months || [];
  
  const conversationData = {
    labels: months.length > 0 ? months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Conversations',
        data: analytics.conversationsByMonth || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Messages',
        data: analytics.messagesByMonth || [],
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  // Topic data
  const topicLabels = analytics.topTopics?.map(t => t.topic) || 
                     analytics.skillLabels || 
                     ['Career', 'Learning', 'Personal', 'Content', 'Decisions'];
  
  const topicCounts = analytics.topTopics?.map(t => t.count) || 
                      analytics.topicDistribution || 
                      [];

  const topicData = {
    labels: topicLabels,
    datasets: [
      {
        data: topicCounts,
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Skill data
  const skillLabels = analytics.skillLabels || [];
  const currentSkills = analytics.currentSkills || [];
  const targetSkills = analytics.targetSkills || [];

  const skillData = {
    labels: skillLabels,
    datasets: [
      {
        label: 'Current',
        data: currentSkills,
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        borderColor: 'rgb(99, 102, 241)',
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
      },
      {
        label: 'Target',
        data: targetSkills,
        backgroundColor: 'rgba(236, 72, 153, 0.2)',
        borderColor: 'rgb(236, 72, 153)',
        pointBackgroundColor: 'rgb(236, 72, 153)',
        pointBorderColor: '#fff',
      },
    ],
  };

  // Emotional data
  const emotionalData = analytics.emotionalTrends?.distribution 
    ? {
        labels: Object.keys(analytics.emotionalTrends.distribution),
        datasets: [
          {
            data: Object.values(analytics.emotionalTrends.distribution),
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(156, 163, 175, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(59, 130, 246, 0.8)',
            ],
          },
        ],
      }
    : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          boxWidth: 6,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header with User Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl md:text-3xl font-bold">Growth Analytics</h2>
            {(analytics.user?.tier === 'PREMIUM' || userTier === 'PREMIUM') && (
              <span className="px-2 py-1 text-xs bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full flex items-center gap-1">
                <Award className="w-3 h-3" />
                Premium
              </span>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-1">
            <User className="w-4 h-4" />
            Hello, <span className="font-medium text-foreground">{userName}</span>! 
            You've been with us since <span className="font-medium text-foreground">{memberSince}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <button 
            onClick={handleExport}
            className="p-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            title="Export analytics"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Streak Card */}
      {(analytics.currentStreak || 0) > 0 && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-purple-100 mb-1">Current Streak</p>
              <div className="flex items-end gap-4">
                <div>
                  <span className="text-4xl font-bold">{analytics.currentStreak || 0}</span>
                  <span className="text-xl ml-1">days</span>
                </div>
                {(analytics.longestStreak || 0) > 0 && (
                  <div className="text-purple-200">
                    <span className="text-sm">Longest: </span>
                    <span className="font-semibold">{analytics.longestStreak} days</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.activeDays || 0}</div>
                <div className="text-xs text-purple-200">Active Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{analytics.totalMessages || 0}</div>
                <div className="text-xs text-purple-200">Messages</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              (analytics.growth?.conversations || 0) > 0 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-gray-500/10 text-gray-600'
            }`}>
              +{analytics.growth?.conversations || 0}% 
            </span>
          </div>
          <div className="text-2xl font-bold">{analytics.totalConversations || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Conversations</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${
              (analytics.growth?.goals || 0) > 0 
                ? 'bg-green-500/10 text-green-600' 
                : 'bg-gray-500/10 text-gray-600'
            }`}>
              +{analytics.growth?.goals || 0}%
            </span>
          </div>
          <div className="text-2xl font-bold">{analytics.completedGoals || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Goals Completed</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <Heart className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">
              {analytics.totalMemories || 0}
            </span>
          </div>
          <div className="text-2xl font-bold">{analytics.totalMemories || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Memories</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition">
          <div className="flex items-center justify-between mb-2">
            <Scale className="w-5 h-5 text-indigo-500" />
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">
              {analytics.totalBrainItems || 0}
            </span>
          </div>
          <div className="text-2xl font-bold">{analytics.totalBrainItems || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Brain Items</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trend */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Activity Trend
          </h3>
          <div className="h-64">
            {(analytics.conversationsByMonth?.length || 0) > 0 ? (
              <Line data={conversationData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No activity data yet
              </div>
            )}
          </div>
        </div>

        {/* Topic Distribution */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            Topics You Discuss Most
          </h3>
          <div className="h-64">
            {(topicCounts.length > 0 && topicCounts.some(c => c > 0)) ? (
              <Doughnut data={topicData} options={{
                ...chartOptions,
                cutout: '60%',
              }} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No topic data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skill Radar - Only show if data exists */}
      {skillLabels.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Skills Progress
          </h3>
          <div className="h-80">
            <Radar data={skillData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <div className="space-y-4">
        {/* Goals Progress Section */}
        {(analytics.goalProgress?.length || 0) > 0 && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('goals')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-emerald-500" />
                <h3 className="font-semibold">Goal Progress</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded-full">
                  {analytics.goalProgress?.filter(g => !g.stalled).length || 0} Active
                </span>
              </div>
              {expandedSections.goals ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.goals && (
              <div className="p-6 pt-0 space-y-4">
                {analytics.goalProgress?.map(goal => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{goal.description}</span>
                        {goal.stalled && (
                          <span className="text-xs px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full">
                            Stalled
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.stalled 
                            ? 'bg-amber-500' 
                            : goal.progress > 80 
                              ? 'bg-green-500' 
                              : 'bg-primary'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emotional Trends Section */}
        {analytics.emotionalTrends && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection('emotional')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-semibold">Emotional Journey</h3>
                <span className="text-xs bg-rose-500/10 text-rose-600 px-2 py-1 rounded-full">
                  {analytics.emotionalTrends?.dominant || 'Balanced'}
                </span>
              </div>
              {expandedSections.emotional ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            {expandedSections.emotional && (
              <div className="p-6 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {emotionalData && (
                    <div className="h-48">
                      <Doughnut data={emotionalData} options={{
                        cutout: '60%',
                        plugins: { legend: { position: 'bottom' } }
                      }} />
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Volatility:</span>
                      <span className="font-medium">{analytics.emotionalTrends?.volatility || 0}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fatigue Days:</span>
                      <span className="font-medium">{analytics.emotionalTrends?.fatigueDays || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Motivated Days:</span>
                      <span className="font-medium">{analytics.emotionalTrends?.motivationDays || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Insights Section */}
      {(analytics.insights?.length || 0) > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('insights')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition"
          >
            <div className="flex items-center gap-3">
              <Lightbulb className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold">Personalized Insights</h3>
            </div>
            {expandedSections.insights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.insights && (
            <div className="p-6 pt-0 space-y-4">
              {analytics.insights?.map((insight, i) => (
                <div key={i} className={`p-4 rounded-lg border ${
                  insight.type === 'success' ? 'bg-green-500/5 border-green-200 dark:border-green-800' :
                  insight.type === 'warning' ? 'bg-amber-500/5 border-amber-200 dark:border-amber-800' :
                  insight.type === 'achievement' ? 'bg-purple-500/5 border-purple-200 dark:border-purple-800' :
                  'bg-blue-500/5 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start gap-3">
                    {insight.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                    {insight.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
                    {insight.type === 'achievement' && <Award className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />}
                    {insight.type === 'info' && <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <p className="text-sm">{insight.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};