import { t, Trans } from "@lingui/macro";
import { useState, useEffect } from 'react';
import { BarChart3, Clock, FileText, Edit, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { useCoverLetterStore } from "../../../../../stores/cover-letter";

interface StatisticsSectionProps {
  disabled?: boolean;
}

interface WritingMetrics {
  score: number;
  grade: string;
  suggestions: string[];
  readability: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export const StatisticsSection = ({ disabled = false }: StatisticsSectionProps) => {
  const { coverLetter } = useCoverLetterStore();
  const [timeSpent, setTimeSpent] = useState<string>(t`0 min`);
  const [writingMetrics, setWritingMetrics] = useState<WritingMetrics | null>(null);

  // Calculate real statistics from cover letter content
  const stats = {
    wordCount: coverLetter?.content?.blocks?.reduce((count: number, block: any) => {
      if (!block.content) return count;
      const text = typeof block.content === 'string' 
        ? block.content.replace(/<[^>]*>/g, '') 
        : String(block.content);
      return count + text.split(/\s+/).filter((word: string) => word.length > 0).length;
    }, 0) || 0,

    characterCount: coverLetter?.content?.blocks?.reduce((count: number, block: any) => {
      if (!block.content) return count;
      const text = typeof block.content === 'string' 
        ? block.content.replace(/<[^>]*>/g, '') 
        : String(block.content);
      return count + text.length;
    }, 0) || 0,

    blockCount: coverLetter?.content?.blocks?.length || 0,

    filledBlocks: coverLetter?.content?.blocks?.filter((block: any) => 
      block.content && block.content.toString().trim().length > 0
    ).length || 0,

    lastEdited: coverLetter?.updatedAt ? 
      new Date(coverLetter.updatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : t`Never`,

    created: coverLetter?.createdAt ? 
      new Date(coverLetter.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : t`Unknown`
  };

  // Calculate time spent based on creation and updates
  useEffect(() => {
    if (coverLetter?.createdAt) {
      const created = new Date(coverLetter.createdAt).getTime();
      const updated = coverLetter.updatedAt ? new Date(coverLetter.updatedAt).getTime() : Date.now();
      const minutes = Math.max(1, Math.round((updated - created) / (1000 * 60)));
      
      if (minutes < 60) {
        setTimeSpent(t`${minutes} min`);
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        setTimeSpent(remainingMinutes > 0 ? t`${hours}h ${remainingMinutes}m` : t`${hours}h`);
      }
    }
  }, [coverLetter]);

  // Analyze writing quality
  useEffect(() => {
    if (!coverLetter?.content?.blocks || stats.wordCount === 0) {
      setWritingMetrics(null);
      return;
    }

    const allContent = coverLetter.content.blocks
      .map((block: any) => block.content || '')
      .join(' ')
      .replace(/<[^>]*>/g, '');

    // Calculate basic writing metrics
    const sentences = allContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = allContent.split(/\s+/).filter(w => w.length > 0);
    const paragraphs = coverLetter.content.blocks.filter((block: any) => 
      block.content && block.content.toString().trim().length > 0
    ).length;

    // Calculate average sentence length
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

    // Calculate score based on various factors
    let score = 50; // Base score

    // Word count scoring (ideal: 250-400 words for cover letters)
    if (stats.wordCount >= 200 && stats.wordCount <= 450) score += 20;
    else if (stats.wordCount >= 150 && stats.wordCount <= 500) score += 10;
    else if (stats.wordCount < 100) score -= 15;
    else if (stats.wordCount > 600) score -= 10;

    // Sentence length scoring (ideal: 15-20 words per sentence)
    if (avgSentenceLength >= 12 && avgSentenceLength <= 22) score += 15;
    else if (avgSentenceLength > 25) score -= 10;
    else if (avgSentenceLength < 8) score -= 5;

    // Paragraph count scoring (ideal: 3-5 paragraphs)
    if (paragraphs >= 3 && paragraphs <= 5) score += 15;
    else if (paragraphs < 2) score -= 10;
    else if (paragraphs > 6) score -= 5;

    // Cap score between 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine grade
    const getGrade = (score: number): string => {
      if (score >= 90) return t`A+`;
      if (score >= 80) return t`A`;
      if (score >= 70) return t`B`;
      if (score >= 60) return t`C`;
      return t`D`;
    };

    const getReadability = (score: number): WritingMetrics['readability'] => {
      if (score >= 80) return 'Excellent';
      if (score >= 65) return 'Good';
      if (score >= 50) return 'Fair';
      return 'Poor';
    };

    // Generate suggestions
    const suggestions: string[] = [];
    if (stats.wordCount < 150) {
      suggestions.push(t`Consider adding more detail to strengthen your letter`);
    } else if (stats.wordCount > 500) {
      suggestions.push(t`Try to be more concise - aim for 250-400 words`);
    }

    if (avgSentenceLength > 25) {
      suggestions.push(t`Break up long sentences for better readability`);
    } else if (avgSentenceLength < 10) {
      suggestions.push(t`Combine some short sentences for better flow`);
    }

    if (paragraphs < 3) {
      suggestions.push(t`Add more paragraphs to structure your content better`);
    }

    if (suggestions.length === 0 && score > 70) {
      suggestions.push(t`Great job! Your cover letter looks well-structured`);
    }

    setWritingMetrics({
      score,
      grade: getGrade(score),
      suggestions,
      readability: getReadability(score)
    });
  }, [coverLetter, stats.wordCount]);

  const getScoreColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 dark:text-green-400';
      case 'A': return 'text-green-500 dark:text-green-300';
      case 'B': return 'text-blue-500 dark:text-blue-300';
      case 'C': return 'text-yellow-500 dark:text-yellow-300';
      default: return 'text-red-500 dark:text-red-300';
    }
  };

  const getReadabilityColor = (readability: string) => {
    switch (readability) {
      case 'Excellent': return 'text-green-600 dark:text-green-400';
      case 'Good': return 'text-blue-500 dark:text-blue-300';
      case 'Fair': return 'text-yellow-500 dark:text-yellow-300';
      case 'Poor': return 'text-red-500 dark:text-red-300';
      default: return 'text-gray-500 dark:text-gray-300';
    }
  };

  const hasCoverLetter = coverLetter && coverLetter.content?.blocks;
  const hasContent = stats.wordCount > 0;

  return (
    <section id="statistics">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
          <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Statistics`}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t`Real-time writing analytics`}</p>
        </div>
      </div>

      {!hasCoverLetter ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t`Create a cover letter to see statistics`}</p>
        </div>
      ) : !hasContent ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t`Add content to see writing statistics`}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center border border-blue-200 dark:border-blue-800">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{stats.wordCount}</div>
              <div className="text-xs text-blue-700 dark:text-blue-300">{t`Words`}</div>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center border border-green-200 dark:border-green-800">
              <Edit className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-900 dark:text-green-100">
                {stats.filledBlocks}/{stats.blockCount}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">{t`Blocks Used`}</div>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center border border-purple-200 dark:border-purple-800">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-purple-900 dark:text-purple-100">{timeSpent}</div>
              <div className="text-xs text-purple-700 dark:text-purple-300">{t`Time Spent`}</div>
            </div>

            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center border border-orange-200 dark:border-orange-800">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
              <div className={`text-lg font-bold ${writingMetrics ? getScoreColor(writingMetrics.grade) : 'text-orange-600 dark:text-orange-400'}`}>
                {writingMetrics?.grade || '--'}
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300">{t`Score`}</div>
            </div>
          </div>

          {/* Writing Quality Analysis */}
          {writingMetrics && (
            <div className="p-4 bg-gradient-to-r from-gray-50 to-teal-50 dark:from-gray-800 dark:to-teal-900/20 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                {t`Writing Analysis`}
              </h4>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t`Overall Score:`}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {writingMetrics.score}/100
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t`Readability:`}</span>
                  <span className={`text-sm font-semibold ${getReadabilityColor(writingMetrics.readability)}`}>
                    {writingMetrics.readability}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t`Characters:`}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {stats.characterCount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Suggestions */}
              {writingMetrics.suggestions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{t`Suggestions`}</span>
                  </div>
                  <ul className="space-y-1">
                    {writingMetrics.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle className="w-3 h-3 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Timeline Information */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <div className="flex justify-between items-center">
                <span>{t`Last edited:`}</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.lastEdited}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>{t`Created:`}</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.created}</span>
              </div>
              {coverLetter?.content?.lastSaved && (
                <div className="flex justify-between items-center">
                  <span>{t`Auto-saved:`}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{t`Active`}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};