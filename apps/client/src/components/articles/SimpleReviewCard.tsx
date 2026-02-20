// src/components/article/SimpleReviewCard.tsx
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Avatar, 
  Typography, 
  Rate, 
  Button, 
  Tooltip, 
  Dropdown,
  Modal,
  notification,
  Input
} from 'antd';
import { 
  UserOutlined,
  LikeOutlined,
  LikeFilled,
  MoreOutlined,
  FlagOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';
import reviewApi, { Review } from '../../services/reviewApi';
import { useUser } from '@/client/services/user';

const { Text, Paragraph } = Typography;

interface SimpleReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: string, isHelpful: boolean) => Promise<void>;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onReport?: (reviewId: string, reason: string) => void;
  isOwnReview?: boolean;
}

const SimpleReviewCard: React.FC<SimpleReviewCardProps> = ({
  review,
  onHelpful,
  onEdit,
  onDelete,
  onReport,
  isOwnReview = false
}) => {
  const { user } = useUser();
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount || 0);
  const [userVoted, setUserVoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingVote, setIsCheckingVote] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');


  useEffect(() => {
  console.log('🔍 Review ownership debug:', {
    reviewId: review.id,
    reviewUserId: review.userId,
    currentUserId: user?.id,
    isOwnReview: isOwnReview,
    reviewIsOwn: review.isOwn,
    isOwnReviewProp: isOwnReview
  });
}, [review.id, review.userId, user?.id, isOwnReview, review.isOwn]);

  // Check server vote state on mount
  useEffect(() => {
    const checkVoteStatus = async () => {
      if (!user?.id || !review.id) {
        setIsCheckingVote(false);
        return;
      }

      try {
        setIsCheckingVote(true);
        
        // First check localStorage for quick UI
        const voteKey = `helpful_${user.id}_${review.id}`;
        const localVote = localStorage.getItem(voteKey) === 'true';
        
        // Then verify with server
        const serverVote = await reviewApi.hasUserVoted(review.id);
        
        console.log('🔍 Vote check:', {
          reviewId: review.id,
          localVote,
          serverVote: serverVote.voted
        });

        // If server says voted but local doesn't, trust server
        if (serverVote.voted && !localVote) {
          console.log('📝 Syncing localStorage with server - setting voted=true');
          localStorage.setItem(voteKey, 'true');
          setUserVoted(true);
        } 
        // If local says voted but server doesn't, trust server
        else if (!serverVote.voted && localVote) {
          console.log('📝 Syncing localStorage with server - setting voted=false');
          localStorage.setItem(voteKey, 'false');
          setUserVoted(false);
        }
        // If they match, use local value
        else {
          setUserVoted(localVote);
        }
      } catch (error) {
        console.error('Failed to check vote status:', error);
        // Fallback to localStorage on error
        const voteKey = `helpful_${user.id}_${review.id}`;
        setUserVoted(localStorage.getItem(voteKey) === 'true');
      } finally {
        setIsCheckingVote(false);
      }
    };

    checkVoteStatus();
  }, [user?.id, review.id]);

  // Update helpfulCount when prop changes
  useEffect(() => {
    setHelpfulCount(review.helpfulCount || 0);
  }, [review.helpfulCount]);

  const handleHelpful = async () => {
    if (!onHelpful || !user?.id || isLoading || isCheckingVote) return;

    setIsLoading(true);
    
    const newVoteState = !userVoted;
    const newCount = newVoteState ? helpfulCount + 1 : helpfulCount - 1;
    
    console.log('🎯 Vote action:', {
      reviewId: review.id,
      currentVoteState: userVoted,
      newVoteState,
      currentCount: helpfulCount,
      newCount
    });

    // Store previous state for rollback
    const previousVoteState = userVoted;
    const previousCount = helpfulCount;
    
    // Optimistic update
    setUserVoted(newVoteState);
    setHelpfulCount(newCount);

    try {
      await onHelpful(review.id, newVoteState);
      console.log('✅ onHelpful succeeded');
      
      // Save to localStorage only after successful API call
      const voteKey = `helpful_${user.id}_${review.id}`;
      localStorage.setItem(voteKey, String(newVoteState));
      
    } catch (error: any) {
      console.error('❌ onHelpful failed:', error);
      
      // Revert on error
      setUserVoted(previousVoteState);
      setHelpfulCount(previousCount);
      
      // Show appropriate error message
      if (error.response?.status === 409) {
        notification.error({
          message: t`Already voted`,
          description: t`You have already ${previousVoteState ? 'unvoted' : 'voted'} on this review`,
          duration: 3
        });
      } else {
        notification.error({
          message: t`Failed to register vote`,
          duration: 2
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: t`Delete Review`,
      content: t`Are you sure you want to delete this review? This action cannot be undone.`,
      okText: t`Delete`,
      okType: 'danger',
      cancelText: t`Cancel`,
      onOk: async () => {
        if (onDelete) {
          await onDelete(review.id);
        }
      }
    });
  };

  const handleReport = () => {
    if (reportReason.trim()) {
      onReport?.(review.id, reportReason);
      setShowReportModal(false);
      setReportReason('');
      notification.success({
        message: t`Report Submitted`,
        description: t`Thank you for helping maintain quality.`,
        duration: 4
      });
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return t`Just now`;
    if (seconds < 3600) return t`${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return t`${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return t`${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const menuItems = isOwnReview 
  ? [
      {
        key: 'edit',
        label: t`Edit Review`,
        icon: <EditOutlined />,
        onClick: () => onEdit?.(review)
      },
      {
        key: 'delete',
        label: t`Delete Review`,
        icon: <DeleteOutlined />,
        danger: true,  // This makes it red
        onClick: handleDelete  // This calls the delete function
      }
    ]
  : [
      {
        key: 'report',
        label: t`Report Review`,
        icon: <FlagOutlined />,
        onClick: () => setShowReportModal(true)
      }
    ];

  // Show loading state while checking vote
  if (isCheckingVote) {
    return (
      <Card className="simple-review-card" bordered={false}>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Avatar size={48} className="bg-gray-200" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="simple-review-card" bordered={false}>
        <div className="flex gap-4">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar 
              size={48}
              src={review.user?.picture}
              icon={!review.user?.picture && <UserOutlined />}
              className="border-2 border-gray-200"
            >
              {review.user?.name?.charAt(0)}
            </Avatar>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Text strong className="text-base">
                    {review.user?.name || t`Anonymous`}
                  </Text>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>{getTimeAgo(review.createdAt)}</span>
                  {review.updatedAt !== review.createdAt && (
                    <Tooltip title={t`Edited ${getTimeAgo(review.updatedAt)}`}>
                      <span className="italic">({t`edited`})</span>
                    </Tooltip>
                  )}
                </div>
              </div>

              {/* Actions Menu */}
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} className="hover:bg-gray-100" />
              </Dropdown>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <Rate disabled defaultValue={review.rating} allowHalf className="text-sm" />
              <Text className="text-sm font-medium">{review.rating.toFixed(1)}</Text>
            </div>

            {/* Insight Text */}
            <Paragraph className="text-gray-800 mb-4 leading-relaxed bg-gray-50 p-4 rounded-lg">
              {review.insightText}
            </Paragraph>

            {/* Helpful Button */}
            <div className="flex items-center">
              <Button
                type="text"
                icon={userVoted ? <LikeFilled className="text-blue-500" /> : <LikeOutlined />}
                onClick={handleHelpful}
                loading={isLoading}
                disabled={isCheckingVote}
                className={`flex items-center gap-1 ${userVoted ? 'text-blue-500' : ''}`}
              >
                <span>{helpfulCount}</span>
                <span>{t`Helpful`}</span>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Modal */}
      <Modal
        title={t`Report Review`}
        open={showReportModal}
        onCancel={() => setShowReportModal(false)}
        onOk={handleReport}
        okText={t`Submit Report`}
        okButtonProps={{ disabled: !reportReason.trim() }}
      >
        <p className="mb-2 text-gray-600">
          {t`Please tell us why you're reporting this review:`}
        </p>
        <Input.TextArea
          rows={4}
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
          placeholder={t`Spam, offensive content, low quality, etc.`}
        />
      </Modal>

      <style>{`
        .simple-review-card {
          transition: all 0.2s ease;
          border: 1px solid #f0f0f0;
          margin-bottom: 16px;
        }
        .simple-review-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #d9d9d9;
        }
        .simple-review-card .ant-rate {
          color: #faad14;
        }
      `}</style>
    </>
  );
};

export default SimpleReviewCard;