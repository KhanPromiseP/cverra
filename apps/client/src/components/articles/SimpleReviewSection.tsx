// src/components/article/SimpleReviewSection.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Typography, 
  Button, 
  Tabs, 
  Spin, 
  Empty,
  Modal,
  notification,
  Divider,
  Badge,
  Space
} from 'antd';
import { 
  StarOutlined, 
  PlusOutlined,
  EditOutlined,
  InfoCircleOutlined,
  UpOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';
import reviewApi, { Review, ReviewSummary } from '../../services/reviewApi';
import SimpleReviewForm from './SimpleReviewForm';
import SimpleReviewCard from './SimpleReviewCard';
import SimpleReviewSummary from './SimpleReviewSummary';
import { useUser } from '@/client/services/user';
import AuthModal from '../common/AuthModal';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface SimpleReviewSectionProps {
  articleId: string;
  articleTitle?: string;
  className?: string;
  onReviewAdded?: () => void;
  onReviewUpdated?: () => void;
  onStatsUpdate?: (stats: any) => void;
}

const SimpleReviewSection: React.FC<SimpleReviewSectionProps> = ({
  articleId,
  articleTitle,
  className = '',
  onReviewAdded,
  onReviewUpdated,
  onStatsUpdate
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState('recent');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { user } = useUser();
  const { i18n } = useLingui();
  
  const initialLoadDone = useRef(false);
  const articleIdRef = useRef(articleId);

  // Initial load - only first 2 reviews
  const loadInitialReviews = async () => {
    if (!articleId) return;
    
    try {
      setLoading(true);
      
      const sortBy = activeTab === 'recent' ? 'recent' : 'helpful';
      
      const response = await reviewApi.getArticleReviews(articleId, {
        page: 1,
        limit: 2, // Only load first 2 initially
        sortBy
      });

      console.log('📊 Loaded initial reviews:', response.reviews.length);

      setReviews(response.reviews);
      setSummary(response.summary);
      setHasMore(response.meta.hasMore);
      setPage(1);
      
      onStatsUpdate?.(response.summary);
      
      // Load user review if logged in
      if (user) {
        const userResponse = await reviewApi.getUserReview(articleId);
        if (userResponse.exists && userResponse.review) {
          setUserReview(userResponse.review);
        }
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      notification.error({
        message: t`Failed to load reviews`,
        duration: 3
      });
    } finally {
      setLoading(false);
    }
  };

  // Load more reviews (pagination)
  const loadMoreReviews = async () => {
    if (!articleId || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      
      const sortBy = activeTab === 'recent' ? 'recent' : 'helpful';
      
      const response = await reviewApi.getArticleReviews(articleId, {
        page: page + 1,
        limit: 5, // Load 5 more each time
        sortBy
      });

      console.log('📊 Loaded more reviews:', response.reviews.length);

      setReviews(prev => [...prev, ...response.reviews]);
      setHasMore(response.meta.hasMore);
      setPage(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to load more reviews:', error);
      notification.error({
        message: t`Failed to load more reviews`,
        duration: 3
      });
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle "Show All" - load all remaining reviews
  const handleShowAll = async () => {
    if (!articleId || !hasMore) return;
    
    setShowAllReviews(true);
    
    // Keep loading until no more reviews
    while (hasMore) {
      await loadMoreReviews();
    }
  };

  // Handle "Show Less" - collapse back to first 2
  const handleShowLess = () => {
    setShowAllReviews(false);
    // Reload just the first 2
    loadInitialReviews();
  };

  // Initial load effect
  useEffect(() => {
    if (!articleId) return;
    
    if (!initialLoadDone.current || articleIdRef.current !== articleId) {
      articleIdRef.current = articleId;
      initialLoadDone.current = true;
      loadInitialReviews();
    }
  }, [articleId]);

  // Handle tab change
  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    
    setActiveTab(key);
    setShowAllReviews(false); // Reset show all state
    loadInitialReviews();
  };

  // Handle review submission
  const handleReviewSubmit = async (values: any) => {
    try {
      if (editingReview) {
        await reviewApi.updateReview(editingReview.id, values);
        notification.success({ message: t`Review Updated!`, duration: 3 });
        onReviewUpdated?.();
      } else {
        await reviewApi.addReview(articleId, values);
        notification.success({
          message: t`Review Submitted!`,
          description: t`Thank you for sharing your professional insight.`,
          duration: 4
        });
        onReviewAdded?.();
      }

      setShowReviewForm(false);
      setEditingReview(null);
      
      // Refresh reviews after submission
      loadInitialReviews();
      
    } catch (error: any) {
      console.error('Review submission failed:', error);
      notification.error({
        message: t`Submission Failed`,
        description: error.response?.data?.message || t`Please try again.`,
        duration: 3
      });
      throw error;
    }
  };

  // Handle helpful vote
  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      if (isHelpful) {
        await reviewApi.markHelpful(reviewId);
      } else {
        await reviewApi.unmarkHelpful(reviewId);
      }
      
      // Update local state optimistically
      setReviews(prevReviews => 
        prevReviews.map(review => 
          review.id === reviewId 
            ? { 
                ...review, 
                helpfulCount: isHelpful ? review.helpfulCount + 1 : review.helpfulCount - 1 
              }
            : review
        )
      );
      
      // Refresh stats
      const summary = await reviewApi.getReviewSummary(articleId);
      setSummary(summary);
      onStatsUpdate?.(summary);
      
    } catch (error) {
      console.error('Failed to mark helpful:', error);
      notification.error({
        message: t`Failed to register vote`,
        duration: 2
      });
      throw error;
    }
  };

  // Handle edit
  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setShowReviewForm(true);
  };

  // Handle delete
  const handleDelete = async (reviewId: string) => {
    try {
      await reviewApi.deleteReview(reviewId);
      notification.success({ message: t`Review Deleted`, duration: 2 });
      
      // Refresh reviews
      loadInitialReviews();
      setUserReview(null);
      
    } catch (error) {
      console.error('Failed to delete review:', error);
      notification.error({ message: t`Failed to delete review`, duration: 3 });
    }
  };

  // Handle report
  const handleReport = async (reviewId: string, reason: string) => {
    console.log('Report:', reviewId, reason);
    notification.info({
      message: t`Report Submitted`,
      description: t`Thank you for helping maintain quality.`,
      duration: 3
    });
  };

  // Get visible reviews based on showAll state
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2);

  return (
    <div className={`simple-review-section ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <StarOutlined className="text-yellow-500 text-xl" />
            <Title level={3} className="!mb-0">
              {t`Professional Reviews`}
            </Title>
            {summary && summary.totalReviews > 0 && (
              <Badge 
                count={summary.totalReviews} 
                style={{ backgroundColor: '#1890ff' }} 
                className="ml-2"
              />
            )}
          </div>
          {summary && summary.totalReviews > 0 && (
            <Text type="secondary" className="text-sm">
              {t`Based on ${summary.totalReviews} review${summary.totalReviews !== 1 ? 's' : ''}`}
            </Text>
          )}
        </div>

        <Button
  type={userReview ? "default" : "primary"}
  icon={userReview ? <EditOutlined /> : <PlusOutlined />}
  onClick={() => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (userReview) {
      setEditingReview(userReview);
    }
    setShowReviewForm(true);
  }}
  className={`
    min-w-[140px] font-medium shadow-sm transition-all duration-200
    ${userReview 
      ? '!border-blue-500 !text-blue-600 bg-blue-50 hover:bg-blue-100 dark:!border-blue-400 dark:!text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50' 
      : '!bg-blue-600 !text-white hover:!bg-blue-700 dark:!bg-blue-700 dark:hover:!bg-blue-800 !border-blue-600 dark:!border-blue-700'
    }
  `}
>
  {userReview ? t`Edit Your Review` : t`Write a Review`}
</Button>
      </div>

      {/* Review Summary */}
      {summary && summary.totalReviews > 0 && (
        <SimpleReviewSummary summary={summary} className="mb-8" />
      )}

      {/* Tabs */}
      {summary && summary.totalReviews > 0 && (
        <Tabs activeKey={activeTab} onChange={handleTabChange} className="mb-6">
          <TabPane tab={t`Most Recent`} key="recent" />
          <TabPane tab={t`Most Helpful`} key="helpful" />
        </Tabs>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <Paragraph className="mt-4 text-gray-500 dark:text-gray-700">
            {t`Loading reviews...`}
          </Paragraph>
        </div>
      ) : visibleReviews.length > 0 ? (
        <div className="space-y-4 text-gray-700 dark:text-gray-100">
          {visibleReviews.map(review => (
            <SimpleReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReport={handleReport}
              isOwnReview={review.isOwn || (user?.id === review.userId)}
            />
          ))}

          {/* Show More / Show Less Controls */}
          {summary && summary.totalReviews > 2 && (
            <div className="flex justify-center pt-4">
              <Space direction="vertical" align="center" size="small">
                {!showAllReviews ? (
                  <Button 
                    type="primary"
                    ghost
                    onClick={handleShowAll}
                    loading={loadingMore}
                    icon={<DownOutlined />}
                    className="min-w-[200px]"
                  >
                    {t`Show More Reviews (${summary.totalReviews - 2} more)`}
                  </Button>
                ) : (
                  <Button 
                    type="default"
                    onClick={handleShowLess}
                    icon={<UpOutlined />}
                    className="min-w-[200px]"
                  >
                    {t`Show Less`}
                  </Button>
                )}
                
                {hasMore && showAllReviews && (
                  <Button 
                    type="link"
                    onClick={loadMoreReviews}
                    loading={loadingMore}
                    size="small"
                  >
                    {t`Load even more...`}
                  </Button>
                )}
              </Space>
            </div>
          )}
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div className="space-y-4">
              <div>
                <Text strong className="text-lg block">
                  {t`No professional reviews yet`}
                </Text>
                <Text type="secondary">
                  {t`Be the first to share your professional insight`}
                </Text>
              </div>
              
              <Divider className="my-4" />
              
              <div className="bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
                <Text className="text-sm text-gray-600 block mb-2">
                  <InfoCircleOutlined className="mr-2 text-blue-500" />
                  {t`What makes a great review?`}
                </Text>
                <ul className="list-disc pl-8 text-sm text-gray-500 space-y-1">
                  <li>{t`Share specific insights you gained`}</li>
                  <li>{t`Minimum 100 characters of professional value`}</li>
                  <li>{t`Be honest and constructive`}</li>
                </ul>
              </div>

              <Button 
                type="primary" 
                onClick={() => {
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  setShowReviewForm(true);
                }}
                icon={<PlusOutlined />}
                className="mt-4"
              >
                {t`Be the First to Review`}
              </Button>
            </div>
          }
        />
      )}

      <Divider 
        className="my-4 mt-8 border-gray-300 dark:border-gray-600" 
        style={{ borderTopWidth: '2px' }}
      />

      {/* Review Form Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <StarOutlined className="text-white" />
            </div>
            <div>
              <Title level={4} className="!mb-0">
                {editingReview ? t`Edit Your Review` : t`Write a Professional Review`}
              </Title>
            </div>
          </div>
        }
        open={showReviewForm}
        onCancel={() => {
          setShowReviewForm(false);
          setEditingReview(null);
        }}
        footer={null}
        width={600}
        className="review-form-modal"
        destroyOnClose
      >
        <SimpleReviewForm
          articleId={articleId}
          articleTitle={articleTitle}
          onSubmit={handleReviewSubmit}
          onCancel={() => {
            setShowReviewForm(false);
            setEditingReview(null);
          }}
          initialValues={editingReview ? {
            rating: editingReview.rating,
            insightText: editingReview.insightText
          } : undefined}
          isEditing={!!editingReview}
        />
      </Modal>

      {/* Auth Modal */}
      <AuthModal
        visible={showAuthModal}
        onCancel={() => setShowAuthModal(false)}
        action="review"
      />

      <style>{`
        .simple-review-section .ant-tabs-tab {
          padding: 8px 16px;
        }
        .simple-review-section .ant-tabs-tab-active {
          font-weight: 500;
        }
        .review-form-modal .ant-modal-body {
          max-height: 70vh;
          overflow-y: auto;
          padding: 24px;
        }
      `}</style>
    </div>
  );
};

export default SimpleReviewSection;