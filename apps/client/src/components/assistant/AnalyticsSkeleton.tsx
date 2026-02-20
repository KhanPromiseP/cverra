
import React from 'react';

export const AnalyticsSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-muted rounded-lg mb-2"></div>
          <div className="h-4 w-64 bg-muted rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-muted rounded-lg"></div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="w-5 h-5 bg-muted rounded-full"></div>
              <div className="w-12 h-4 bg-muted rounded-full"></div>
            </div>
            <div className="h-8 w-16 bg-muted rounded-lg mb-1"></div>
            <div className="h-3 w-20 bg-muted rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* First Chart */}
        <div className="bg-card border border-border rounded-lg p-4 h-80">
          <div className="h-6 w-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-64 bg-muted/50 rounded-lg"></div>
        </div>

        {/* Second Chart */}
        <div className="bg-card border border-border rounded-lg p-4 h-80">
          <div className="h-6 w-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-64 bg-muted/50 rounded-lg"></div>
        </div>

        {/* Third Chart (full width) */}
        <div className="bg-card border border-border rounded-lg p-4 h-80 lg:col-span-2">
          <div className="h-6 w-32 bg-muted rounded-lg mb-4"></div>
          <div className="h-64 bg-muted/50 rounded-lg"></div>
        </div>
      </div>

      {/* Insights Skeleton */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-muted rounded-full"></div>
          <div className="h-6 w-32 bg-muted rounded-lg"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-5 h-5 bg-muted rounded-full flex-shrink-0"></div>
              <div className="flex-1 h-4 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};