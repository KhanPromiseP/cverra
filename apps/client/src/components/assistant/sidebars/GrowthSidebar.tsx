// components/assistant/sidebars/GrowthSidebar.tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Calendar, Target, Loader2, Download } from 'lucide-react';

interface GrowthSidebarProps {
  userId: string;
  getAuthHeaders: () => Record<string, string>;
}

export const GrowthSidebar: React.FC<GrowthSidebarProps> = ({ 
  userId, 
  getAuthHeaders 
}) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/analytics/growth?timeframe=3m', { headers });
      const data = await response.json();
      setAnalytics(data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold">Growth Analytics</h3>
      </div>
      
      {/* Key Metrics */}
      <div className="space-y-3 mb-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Conversations</span>
            <span className="font-medium">{analytics?.totalConversations || 0}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(100, (analytics?.totalConversations || 0) / 2)}%` }} 
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Goals completed</span>
            <span className="font-medium">{analytics?.completedGoals || 0}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(100, (analytics?.completedGoals || 0) * 10)}%` }} 
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Learning hours</span>
            <span className="font-medium">{analytics?.totalHours || 0}h</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${Math.min(100, (analytics?.totalHours || 0) * 2)}%` }} 
            />
          </div>
        </div>
      </div>
      
      {/* Achievements */}
      {analytics?.achievements > 0 && (
        <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg mb-4 flex items-center gap-3">
          <Award className="w-8 h-8 text-orange-500" />
          <div>
            <div className="text-lg font-bold text-orange-600">{analytics.achievements}</div>
            <div className="text-xs">achievements unlocked</div>
          </div>
        </div>
      )}
      
      {/* Growth Rate */}
      {analytics?.growth && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="text-sm font-medium mb-1">Growth rate</div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-lg font-bold text-blue-600">+{analytics.growth.conversations || 0}%</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">vs last period</div>
        </div>
      )}
      
      {/* Export Button */}
      <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center justify-center gap-2 mt-2">
        <Download className="w-4 h-4" />
        Export Report
      </button>
    </>
  );
};