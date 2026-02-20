// src/components/article/SimpleReviewSummary.tsx
import React from 'react';
import { Card, Typography, Rate, Progress, Space, Tooltip, Tag } from 'antd';
import { 
  StarOutlined, 
  CheckCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';
import { ReviewSummary } from '../../services/reviewApi';

const { Title, Text } = Typography;

interface SimpleReviewSummaryProps {
  summary: ReviewSummary;
  className?: string;
}

const SimpleReviewSummary: React.FC<SimpleReviewSummaryProps> = ({ summary, className = '' }) => {
  const { i18n } = useLingui();

  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return '#52c41a';
    if (rating >= 4) return '#52c41a';
    if (rating >= 3) return '#faad14';
    if (rating >= 2) return '#fa8c16';
    return '#f5222d';
  };

  const getRatingDescription = (rating: number): string => {
    if (rating >= 4.5) return t`Outstanding`;
    if (rating >= 4) return t`Very Good`;
    if (rating >= 3) return t`Good`;
    if (rating >= 2) return t`Fair`;
    return t`Poor`;
  };

  return (
    <Card className={`simple-review-summary ${className}`} bordered={false}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Rating Score */}
        <div className="flex-shrink-0 flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold"
            style={{ 
              background: `conic-gradient(${getRatingColor(summary.averageRating)} ${(summary.averageRating / 5) * 100}%, #f0f0f0 0)`,
            }}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: getRatingColor(summary.averageRating) }}>
                  {summary.averageRating.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
          <div>
            <Rate disabled defaultValue={summary.averageRating} allowHalf className="text-sm" />
            <Text type="secondary" className="text-xs block mt-1">
              {getRatingDescription(summary.averageRating)}
            </Text>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{summary.totalReviews}</div>
            <Text type="secondary" className="text-xs">{t`Verified Reviews`}</Text>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalReviews > 0 
                ? Math.round((summary.ratingDistribution[5] + summary.ratingDistribution[4]) / summary.totalReviews * 100)
                : 0}%
            </div>
            <Text type="secondary" className="text-xs">{t`Recommend`}</Text>
          </div>
        </div>

        {/* Trust Badge */}
        {summary.totalReviews >= 5 && (
          <Tooltip title={t`This article has been reviewed by multiple professionals`}>
            <Tag color="blue" icon={<CheckCircleOutlined />} className="px-3 py-1">
              {t`Community Trusted`}
            </Tag>
          </Tooltip>
        )}
      </div>

      {/* Rating Distribution - Collapsible on mobile */}
      {summary.totalReviews > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <Text strong className="text-sm">{t`Rating Distribution`}</Text>
            <Text type="secondary" className="text-xs">{summary.totalReviews} {t`reviews`}</Text>
          </div>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = summary.ratingDistribution[star as keyof typeof summary.ratingDistribution] || 0;
              const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-2">
                  <div className="w-8 text-xs text-gray-600">{star} ★</div>
                  <div className="flex-1">
                    <Progress 
                      percent={percentage} 
                      size="small" 
                      showInfo={false}
                      strokeColor={star >= 4 ? '#52c41a' : star >= 3 ? '#faad14' : '#f5222d'}
                    />
                  </div>
                  <div className="w-8 text-right text-xs text-gray-600">{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        .simple-review-summary .ant-progress {
          margin: 0;
        }
        .simple-review-summary .ant-progress-inner {
          background-color: #f0f0f0;
        }
      `}</style>
    </Card>
  );
};

export default SimpleReviewSummary;