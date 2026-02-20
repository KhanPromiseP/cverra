// components/assistant/LifeDashboard-Simple.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Download,
  TrendingUp,
  Heart,
  Target,
  Brain,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  DownloadCloud,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAssistant } from '../../hooks/useAssistant';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const LifeDashboard: React.FC = () => {
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [emotionalData, setEmotionalData] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'image' | 'json'>('pdf');

  const { getAuthHeaders } = useAssistant();

  useEffect(() => {
    loadDashboardData();
  }, [selectedWeek]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      
      const summaryRes = await fetch('/api/assistant/dashboard/weekly-summary', { headers });
      const summaryData = await summaryRes.json();
      setWeeklySummary(summaryData.data);

      const emotionalRes = await fetch('/api/assistant/emotional/summary?days=30', { headers });
      const emotionalData = await emotionalRes.json();
      setEmotionalData(emotionalData.data);

      const goalsRes = await fetch('/api/assistant/goals', { headers });
      const goalsData = await goalsRes.json();
      setGoals(goalsData.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    switch (exportFormat) {
      case 'pdf':
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`life-dashboard-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        break;

      case 'image':
        const imageCanvas = await html2canvas(element);
        const link = document.createElement('a');
        link.download = `dashboard-${format(new Date(), 'yyyy-MM-dd')}.png`;
        link.href = imageCanvas.toDataURL();
        link.click();
        break;

      case 'json':
        const dataStr = JSON.stringify(weeklySummary, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
        a.click();
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-xl"></div>
        <div className="h-48 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Life Dashboard</h2>
          <p className="text-muted-foreground">
            {weeklySummary?.weekStartDate && weeklySummary?.weekEndDate && (
              <>Week of {format(new Date(weeklySummary.weekStartDate), 'MMM d')} - {format(new Date(weeklySummary.weekEndDate), 'MMM d, yyyy')}</>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as any)}
            className="px-3 py-2 bg-secondary rounded-lg text-sm border border-border"
          >
            <option value="pdf">PDF</option>
            <option value="image">Image</option>
            <option value="json">JSON</option>
          </select>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2"
          >
            <DownloadCloud className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div id="dashboard-content" className="space-y-6">
        {/* Week Picker */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['current', ...Array.from({ length: 4 }, (_, i) => `week-${i + 1}`)].map((week) => (
            <button
              key={week}
              onClick={() => setSelectedWeek(week)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                selectedWeek === week
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary hover:bg-secondary/80'
              }`}
            >
              {week === 'current' ? 'This Week' : `Week ${week.split('-')[1]}`}
            </button>
          ))}
        </div>

        {/* Weekly Summary Card */}
        {weeklySummary && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold">Weekly Reflection</h3>
            </div>
            
            <p className="text-lg leading-relaxed mb-6">{weeklySummary.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Highlights
                </h4>
                <ul className="space-y-2">
                  {weeklySummary.highlights?.map((highlight: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">•</span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg">
                <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Challenges
                </h4>
                <ul className="space-y-2">
                  {weeklySummary.challenges?.map((challenge: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-amber-500">•</span>
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Emotional Trends */}
        {emotionalData && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-semibold">Emotional Journey</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {emotionalData.fatigueDays}
                </div>
                <div className="text-xs text-muted-foreground">Fatigue Days</div>
              </div>
              <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {emotionalData.motivationDays}
                </div>
                <div className="text-xs text-muted-foreground">Motivated Days</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(emotionalData.emotionalVolatility * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Emotional Volatility</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};