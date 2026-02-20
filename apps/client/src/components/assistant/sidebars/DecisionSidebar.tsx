// components/assistant/sidebars/DecisionSidebar.tsx
import React, { useState, useEffect } from 'react';
import { Scale, CheckCircle, Clock, AlertCircle, Loader2, Plus } from 'lucide-react';

interface DecisionSidebarProps {
  userId: string;
  getAuthHeaders: () => Record<string, string>;
}

export const DecisionSidebar: React.FC<DecisionSidebarProps> = ({ 
  userId, 
  getAuthHeaders 
}) => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/decisions', { headers });
      const data = await response.json();
      setDecisions(data.data || []);
    } catch (error) {
      console.error('Failed to fetch decisions:', error);
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

  const pendingDecisions = decisions.filter(d => !d.chosenOption);
  const decidedDecisions = decisions.filter(d => d.chosenOption);
  const successRate = decidedDecisions.length > 0
    ? Math.round((decidedDecisions.filter(d => d.satisfaction && d.satisfaction >= 7).length / decidedDecisions.length) * 100)
    : 0;

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Scale className="w-5 h-5 text-violet-500" />
        <h3 className="font-semibold">Decision Journal</h3>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{decisions.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{pendingDecisions.length}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
      </div>
      
      {/* Success Rate */}
      {decidedDecisions.length > 0 && (
        <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg mb-4">
          <div className="text-sm font-medium text-green-700 dark:text-green-300">{successRate}%</div>
          <div className="text-xs text-muted-foreground">Satisfaction rate</div>
        </div>
      )}
      
      {/* Pending Decisions */}
      {pendingDecisions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Pending ({pendingDecisions.length})
          </h4>
          <div className="space-y-2">
            {pendingDecisions.slice(0, 3).map(decision => (
              <div key={decision.id} className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-medium line-clamp-1">{decision.context}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(decision.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Action Button */}
      <button 
        onClick={() => {/* Navigate to new decision */}}
        className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center justify-center gap-2 mt-2"
      >
        <Plus className="w-4 h-4" />
        New Decision Analysis
      </button>
    </>
  );
};