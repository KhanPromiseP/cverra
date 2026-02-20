// components/assistant/sidebars/LifeDashboardSidebar.tsx
import React, { useState, useEffect } from 'react';
import { Heart, Calendar, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';

interface LifeDashboardSidebarProps {
  userId: string;
  getAuthHeaders: () => Record<string, string>;
}

export const LifeDashboardSidebar: React.FC<LifeDashboardSidebarProps> = ({ 
  userId, 
  getAuthHeaders 
}) => {
  const [emotionalData, setEmotionalData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      
      // Fetch emotional summary
      const emotionalRes = await fetch('/api/assistant/emotional/summary?days=7', { headers });
      const emotionalData = await emotionalRes.json();
      setEmotionalData(emotionalData.data);

      // Fetch goals
      const goalsRes = await fetch('/api/assistant/goals', { headers });
      const goalsData = await goalsRes.json();
      setGoals(goalsData.data || []);
    } catch (error) {
      console.error('Failed to fetch life dashboard data:', error);
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

  // Calculate active goals progress
  const activeGoals = goals.filter(g => g.status === 'ACTIVE');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
  const progressPercentage = activeGoals.length > 0 
    ? Math.round((activeGoals.filter(g => g.progress > 0).length / activeGoals.length) * 100)
    : 0;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-rose-500" />
        <h3 className="font-semibold">Life Dashboard</h3>
      </div>
      
      {/* Emotional Snapshot */}
      <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-800">
        <h4 className="text-sm font-medium text-rose-700 dark:text-rose-300 mb-2">
          This Week's Emotions
        </h4>
        {emotionalData ? (
          <>
            <div className="flex items-center gap-2 text-sm mb-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span className="capitalize">{emotionalData.primaryEmotion?.toLowerCase() || 'Neutral'}</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Fatigue days</span>
                <span className="font-medium">{emotionalData.fatigueDays || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Motivated days</span>
                <span className="font-medium">{emotionalData.motivationDays || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Volatility</span>
                <span className="font-medium">{Math.round((emotionalData.emotionalVolatility || 0) * 100)}%</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">No emotional data yet</p>
        )}
      </div>
      
      {/* Goal Progress */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Goal Progress</h4>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Active goals</span>
              <span>{activeGoals.length}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full" 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span>Completed</span>
            <span className="font-medium">{completedGoals}</span>
          </div>
        </div>
      </div>
      
      {/* Recent Highlights */}
      {emotionalData?.dominantStates?.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Top Emotions</h4>
          <div className="space-y-1">
            {emotionalData.dominantStates.slice(0, 3).map((state: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ 
                    backgroundColor: 
                      state.state === 'POSITIVE' ? '#10b981' :
                      state.state === 'NEGATIVE' ? '#ef4444' :
                      state.state === 'NEUTRAL' ? '#6b7280' : '#f59e0b'
                  }} 
                />
                <span className="capitalize">{state.state.toLowerCase()}</span>
                <span className="text-muted-foreground ml-auto">
                  {Math.round((state.count / emotionalData.totalSnapshots) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};