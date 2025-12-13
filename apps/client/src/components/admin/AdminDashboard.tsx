import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import api from '@/client/api/axios';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  userStatistics: {
    totalUsers: number;
    newUsersThisMonth: number;
    byRole: Array<{ role: string; _count: { _all: number } }>;
    monthlyGrowth: any;
  };
  financialStatistics: {
    monthlyRevenue: number;
    monthlyTransactions: number;
    subscriptionStats: Array<{ status: string; _count: { _all: number } }>;
    topPlans: Array<any>;
  };
  usageStatistics: {
    totalUsage: number;
    byAction: Array<{ action: string; _count: { _all: number }; _sum: { cost: number } }>;
    totalCost: number;
  };
  contentStatistics: {
    totalResumes: number;
    resumesByVisibility: Array<{ visibility: string; _count: { _all: number } }>;
    totalCoverLetters: number;
    coverLettersByVisibility: Array<{ visibility: string; _count: { _all: number } }>;
  };
  platformHealth: {
    activeSubscriptions: number;
    successRate: number;
    averageRevenuePerUser: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon: Icon, iconColor, trend }) => (
  <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <div className={`p-3 rounded-xl ${iconColor} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="ml-4 flex-1">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex items-baseline justify-between mt-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <span className={`text-sm font-semibold flex items-center gap-1 ${
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <ArrowTrendingUpIcon className={`h-4 w-4 ${trend.isPositive ? '' : 'rotate-180'}`} />
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          )}
        </div>
        {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    setExporting(true);
    try {
      const response = await api.get('/admin/dashboard/export', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard-report-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      toast.error('Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const refreshData = () => {
    setLoading(true);
    fetchDashboardStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="text-destructive text-lg mb-2">Failed to load dashboard</div>
          <button
            onClick={refreshData}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and analytics</p>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <ClockIcon className="h-4 w-4" />
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportReport}
            disabled={exporting}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={stats.userStatistics.totalUsers.toLocaleString()}
          subtitle={`+${stats.userStatistics.newUsersThisMonth} this month`}
          icon={UsersIcon}
          iconColor="bg-blue-500"
          trend={{ value: 12, isPositive: true }}
        />
        
        <MetricCard
          title="Monthly Revenue"
          value={`$${stats.financialStatistics.monthlyRevenue.toFixed(2)}`}
          subtitle={`${stats.financialStatistics.monthlyTransactions} transactions`}
          icon={CurrencyDollarIcon}
          iconColor="bg-green-500"
          trend={{ value: 8, isPositive: true }}
        />
        
        <MetricCard
          title="Active Subscriptions"
          value={stats.platformHealth.activeSubscriptions.toLocaleString()}
          subtitle={`${stats.financialStatistics.subscriptionStats.find(s => s.status === 'ACTIVE')?._count._all || 0} active`}
          icon={UserGroupIcon}
          iconColor="bg-purple-500"
          trend={{ value: 15, isPositive: true }}
        />
        
        <MetricCard
          title="Success Rate"
          value={`${stats.platformHealth.successRate.toFixed(1)}%`}
          subtitle={`ARPU: $${stats.platformHealth.averageRevenuePerUser.toFixed(2)}`}
          icon={ArrowTrendingUpIcon}
          iconColor="bg-orange-500"
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Content & Usage Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Overview */}
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Content Overview</h3>
            <DocumentTextIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <DocumentTextIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="font-medium text-foreground">Total Resumes</span>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                {stats.contentStatistics.totalResumes.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <EnvelopeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-foreground">Total Cover Letters</span>
              </div>
              <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                {stats.contentStatistics.totalCoverLetters.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Usage Statistics</h3>
            <ChartBarIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {stats.usageStatistics.byAction.map((action) => (
              <div key={action.action} className="flex justify-between items-center p-3 bg-muted/50 hover:bg-muted/80 rounded-lg transition-colors">
                <span className="font-medium text-foreground capitalize">
                  {action.action.replace(/_/g, ' ').toLowerCase()}
                </span>
                <div className="flex gap-4 text-sm">
                  <span className="font-semibold text-foreground">{action._count._all}</span>
                  <span className="text-muted-foreground font-medium">${action._sum.cost || 0}</span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-4 mt-3 border-t border-border">
              <span className="font-semibold text-foreground">Total</span>
              <div className="flex gap-4 text-sm">
                <span className="font-bold text-foreground">{stats.usageStatistics.totalUsage}</span>
                <span className="font-bold text-foreground">${stats.usageStatistics.totalCost}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Distribution & Top Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution */}
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-6">User Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.userStatistics.byRole.map((roleStat) => (
              <div key={roleStat.role} className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {roleStat._count._all.toLocaleString()}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300 capitalize mt-2">
                  {roleStat.role.toLowerCase()} Users
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Subscription Plans */}
        <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-6">Top Subscription Plans</h3>
          <div className="space-y-3">
            {stats.financialStatistics.topPlans.map((plan, index) => (
              <div key={plan.id} className="flex justify-between items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-xl flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{plan.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ${Number(plan.price).toFixed(2)}/{plan.interval.toLowerCase()} • {plan.coins.toLocaleString()} coins
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-purple-600 dark:text-purple-400">
                    {plan._count.subscriptions} subscribers
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Health */}
      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-6">Platform Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {stats.platformHealth.activeSubscriptions.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-green-700 dark:text-green-300 mt-2">Active Subscriptions</div>
          </div>
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {stats.platformHealth.successRate.toFixed(1)}%
            </div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mt-2">Payment Success Rate</div>
          </div>
          <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
            <CurrencyDollarIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              ${stats.platformHealth.averageRevenuePerUser.toFixed(2)}
            </div>
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mt-2">Avg Revenue Per User</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card text-card-foreground p-6 rounded-xl border shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-colors">
            <UsersIcon className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-foreground">Manage Users</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-colors">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-foreground">View Payments</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-colors">
            <EyeIcon className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium text-foreground">View Analytics</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 bg-muted/50 hover:bg-muted rounded-xl border border-border transition-colors">
            <DocumentTextIcon className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-medium text-foreground">Content Review</span>
          </button>
        </div>
      </div>
    </div>
  );
};