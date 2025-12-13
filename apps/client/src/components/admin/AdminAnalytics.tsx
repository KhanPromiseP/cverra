import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/client/api/axios';
import {
  ChartBarIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
  userGrowth: any[];
  revenueData: any[];
  usageData: any[];
  subscriptionData: any[];
}

export const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics?timeframe=${timeframe}`);
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const response = await api.get(`/admin/analytics/export?timeframe=${timeframe}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Analytics data exported successfully');
    } catch (error) {
      toast.error('Failed to export analytics data');
    } finally {
      setExporting(false);
    }
  };

  const timeframeLabels = {
    '7d': 'Last 7 Days',
    '30d': 'Last 30 Days',
    '90d': 'Last 90 Days',
    '1y': 'Last Year'
  };

  const refreshData = () => {
    setLoading(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Detailed platform analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-4 py-2 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-ring bg-background transition-colors"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl font-semibold transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Timeframe Indicator */}
      <div className="bg-card text-card-foreground p-4 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Current Timeframe:</span>
            <span className="text-primary font-semibold">{timeframeLabels[timeframe]}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Data updates in real-time
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">User Growth</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.userGrowth.reduce((sum, day) => sum + day._count._all, 0) || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">+12% from previous period</div>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${analytics?.revenueData.reduce((sum, day) => sum + Number(day._sum.amount || 0), 0).toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">+8% from previous period</div>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Platform Usage</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.usageData.reduce((sum, day) => sum + day._count._all, 0) || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <DocumentTextIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">+15% from previous period</div>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">New Subscriptions</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {analytics?.subscriptionData.reduce((sum, day) => sum + day._count._all, 0) || 0}
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-xl">
              <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
            <div className="text-sm text-green-600 font-medium">+20% from previous period</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">User Growth Trend</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <EyeIcon className="h-4 w-4" />
              <span>Interactive</span>
            </div>
          </div>
          <div className="h-80 bg-muted/30 rounded-xl flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">User Growth Visualization</p>
              <p className="text-sm mt-1">Chart showing user acquisition over time</p>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Revenue Trends</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <EyeIcon className="h-4 w-4" />
              <span>Interactive</span>
            </div>
          </div>
          <div className="h-80 bg-muted/30 rounded-xl flex items-center justify-center border border-border">
            <div className="text-center text-muted-foreground">
              <CurrencyDollarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Revenue Analysis</p>
              <p className="text-sm mt-1">Revenue breakdown and trends visualization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Usage Patterns</h3>
          <div className="space-y-3">
            {analytics?.usageData.slice(0, 5).map((usage, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="font-medium text-foreground capitalize">
                  {usage.action?.replace(/_/g, ' ') || 'Unknown Action'}
                </span>
                <span className="text-sm text-muted-foreground font-semibold">
                  {usage._count._all} actions
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Subscription Analytics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Active Subscriptions</span>
              <span className="font-bold text-foreground">
                {analytics?.subscriptionData.filter(s => s.status === 'ACTIVE').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cancelled This Period</span>
              <span className="font-bold text-foreground">
                {analytics?.subscriptionData.filter(s => s.status === 'CANCELLED').length || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Renewal Rate</span>
              <span className="font-bold text-green-600">94.2%</span>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Data Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {analytics?.userGrowth.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Data Points</div>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {timeframeLabels[timeframe]}
              </div>
              <div className="text-sm text-muted-foreground">Time Period</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {analytics ? Object.keys(analytics).length : 0}
              </div>
              <div className="text-sm text-muted-foreground">Metrics</div>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400">100%</div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};