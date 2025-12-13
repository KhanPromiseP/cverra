// components/articles/CommentsSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Avatar, 
  Typography, 
  Space, 
  Divider,
  Dropdown,
  Menu,
  Modal,
  message,
  Skeleton,
  Pagination,
  Select,
  Tooltip,
  Badge,
  Empty,
  Alert
} from 'antd';
import { 
  SendOutlined, 
  LikeOutlined, 
  LikeFilled,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  FlagOutlined,
  UserOutlined,
  SortAscendingOutlined,
  StarOutlined,
  PushpinOutlined,
  MessageOutlined,
  LoadingOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/client/stores/auth';
import articleApi, { Comment as CommentType, FilterParams } from '../../services/articleApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);

// Configure dayjs relative time thresholds
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'a few seconds',
    m: '1 minute',
    mm: '%d minutes',
    h: '1 hour',
    hh: '%d hours',
    d: '1 day',
    dd: '%d days',
    M: '1 month',
    MM: '%d months',
    y: '1 year',
    yy: '%d years'
  }
});

const { TextArea } = Input;
const { Text, Paragraph } = Typography;
const { Option } = Select;

interface CommentsSectionProps {
  articleId: string;
  comments?: CommentType[];
  onAddComment?: (content: string, parentId?: string) => Promise<boolean>;
  onLikeComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  autoFocus?: boolean;
  showHeader?: boolean;
}

interface CommentFormData {
  content: string;
  parentId?: string;
}

const CommentsSection: React.FC<CommentsSectionProps> = ({
  articleId,
  comments: initialComments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onReportComment,
  autoFocus = false,
  showHeader = true,
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentType[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'oldest'>('recent');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  const fetchComments = useCallback(async () => {
    if (initialComments) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await articleApi.getComments(articleId, {
        page,
        limit: pageSize,
        sort: sortBy,
        parentOnly: true,
      } as FilterParams);
      
      if (response.success && response.data) {
        setComments(response.data.data || []);
        setTotal(response.data.total || 0);
      } else {
        throw new Error(response.message || 'Failed to load comments');
      }
    } catch (error: any) {
      console.error('Failed to load comments:', error);
      setError(error.response?.data?.message || 'Failed to load comments. Please try again.');
      message.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [articleId, page, sortBy, initialComments]);

  useEffect(() => {
    if (!initialComments) {
      fetchComments();
    }
  }, [fetchComments, initialComments]);

  useEffect(() => {
    if (initialComments) {
      setComments(initialComments);
      setTotal(initialComments.length);
    }
  }, [initialComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    
    if (!user) {
      message.error('Please login to comment');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    const content = newComment.trim();
    const parentId = replyTo || undefined;

    try {
      let success = false;
      
      if (onAddComment) {
        // Use parent component's handler if provided
        success = await onAddComment(content, parentId);
      } else {
        // Use local API call
        const response = await articleApi.addComment(articleId, { content, parentId });
        success = response.success;
        
        if (success && response.data) {
          const comment = response.data;
          
          if (parentId) {
            // Add reply to parent comment
            setComments(prev => prev.map(c => 
              c.id === parentId 
                ? { 
                    ...c, 
                    replies: [comment, ...(c.replies || [])],
                    replyCount: (c.replyCount || 0) + 1 
                  }
                : c
            ));
          } else {
            // Add new top-level comment
            setComments(prev => [comment, ...prev]);
            setTotal(prev => prev + 1);
          }
        }
      }

      if (success) {
        message.success('Comment added successfully');
        setNewComment('');
        setReplyTo(null);
        setReplyContent('');
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      setError(error.response?.data?.message || 'Failed to add comment. Please try again.');
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (commentId: string) => {
    if (!replyContent.trim()) return;
    
    if (!user) {
      message.error('Please login to reply');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await articleApi.addComment(articleId, { 
        content: replyContent.trim(), 
        parentId: commentId 
      });
      
      if (response.success && response.data) {
        const reply = response.data;
        
        // Update comments with new reply
        setComments(prev => prev.map(c => 
          c.id === commentId 
            ? { 
                ...c, 
                replies: [reply, ...(c.replies || [])],
                replyCount: (c.replyCount || 0) + 1 
              }
            : c
        ));
        
        message.success('Reply added');
        setReplyTo(null);
        setReplyContent('');
      } else {
        throw new Error(response.message || 'Failed to add reply');
      }
    } catch (error: any) {
      console.error('Failed to add reply:', error);
      setError(error.response?.data?.message || 'Failed to add reply. Please try again.');
      message.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      message.error('Please login to like comments');
      return;
    }

    if (onLikeComment) {
      // Use parent component's handler if provided
      onLikeComment(commentId);
      return;
    }

    try {
      const response = await articleApi.likeComment(commentId);
      
      if (response.success) {
        // Update comment likes locally
        const updateCommentLikes = (comments: CommentType[]): CommentType[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
                isLiked: !comment.isLiked,
              };
            }
            if (comment.replies?.length) {
              return {
                ...comment,
                replies: updateCommentLikes(comment.replies),
              };
            }
            return comment;
          });
        };

        setComments(updateCommentLikes(comments));
      }
    } catch (error: any) {
      console.error('Failed to like comment:', error);
      message.error(error.response?.data?.message || 'Failed to like comment');
    }
  };

  const handleEdit = (comment: CommentType) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await articleApi.updateComment(commentId, { content: editContent.trim() });
      
      if (response.success && response.data) {
        const updateCommentContent = (comments: CommentType[]): CommentType[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return response.data;
            }
            if (comment.replies?.length) {
              return {
                ...comment,
                replies: updateCommentContent(comment.replies),
              };
            }
            return comment;
          });
        };

        setComments(updateCommentContent(comments));
        setEditingId(null);
        message.success('Comment updated');
      }
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      message.error(error.response?.data?.message || 'Failed to update comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (onDeleteComment) {
      // Use parent component's handler if provided
      onDeleteComment(commentId);
      return;
    }

    Modal.confirm({
      title: 'Delete Comment',
      content: 'Are you sure you want to delete this comment? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await articleApi.deleteComment(commentId);
          
          if (response.success) {
            // Remove comment from state
            const removeComment = (comments: CommentType[]): CommentType[] => {
              return comments
                .filter(comment => comment.id !== commentId)
                .map(comment => ({
                  ...comment,
                  replies: comment.replies ? removeComment(comment.replies) : [],
                }));
            };

            setComments(removeComment(comments));
            setTotal(prev => Math.max(0, prev - 1));
            message.success('Comment deleted');
          }
        } catch (error: any) {
          console.error('Failed to delete comment:', error);
          message.error(error.response?.data?.message || 'Failed to delete comment');
        }
      },
    });
  };

  const handleReport = async (commentId: string) => {
    if (onReportComment) {
      // Use parent component's handler if provided
      onReportComment(commentId);
      return;
    }

    Modal.confirm({
      title: 'Report Comment',
      content: (
        <div>
          <p>Please select a reason for reporting:</p>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select reason"
            defaultValue="inappropriate"
            options={[
              { value: 'spam', label: 'Spam or misleading' },
              { value: 'harassment', label: 'Harassment or hate speech' },
              { value: 'inappropriate', label: 'Inappropriate content' },
              { value: 'copyright', label: 'Copyright violation' },
              { value: 'other', label: 'Other reason' },
            ]}
          />
        </div>
      ),
      onOk: async (reason: string) => {
        try {
          const response = await articleApi.reportComment(commentId, reason);
          
          if (response.success) {
            message.success('Comment reported. Thank you for helping maintain our community.');
          }
        } catch (error: any) {
          console.error('Failed to report comment:', error);
          message.error(error.response?.data?.message || 'Failed to report comment');
        }
      },
    });
  };

  const renderComment = (comment: CommentType, isReply = false) => {
    const isOwnComment = user?.id === comment.author?.id;
    const hasReplies = comment.replies && comment.replies.length > 0;
    const isEditing = editingId === comment.id;

    const commentMenuItems = [
      isOwnComment && {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Edit',
        onClick: () => handleEdit(comment),
      },
      isOwnComment && {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: 'Delete',
        danger: true,
        onClick: () => handleDelete(comment.id),
      },
      !isOwnComment && {
        key: 'report',
        icon: <FlagOutlined />,
        label: 'Report',
        danger: true,
        onClick: () => handleReport(comment.id),
      },
    ].filter(Boolean);

    return (
      <div 
        key={comment.id} 
        style={{ 
          marginBottom: 20,
          marginLeft: isReply ? 48 : 0,
          position: 'relative',
        }}
      >
        {/* Reply connector line */}
        {isReply && (
          <div style={{
            position: 'absolute',
            left: -36,
            top: 40,
            bottom: -20,
            width: 2,
            backgroundColor: '#f0f0f0',
          }} />
        )}

        <div style={{ display: 'flex', gap: 12, position: 'relative' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar 
              src={comment.author?.picture} 
              size={isReply ? 32 : 40}
              style={{ 
                backgroundColor: comment.author?.isVerified ? '#1890ff' : '#d9d9d9',
                cursor: 'pointer'
              }}
              onClick={() => window.open(`/profile/${comment.author?.username}`, '_blank')}
            >
              {comment.author?.name?.charAt(0)}
            </Avatar>
            {comment.author?.isVerified && (
              <Badge
                dot
                color="#1890ff"
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0,
                  border: '2px solid white',
                  borderRadius: '50%'
                }}
              />
            )}
          </div>
          
          {/* Comment Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Comment Header */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              marginBottom: 8,
              gap: 8
            }}>
              <Space wrap>
                <Text 
                  strong 
                  style={{ 
                    fontSize: isReply ? '14px' : '15px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(`/profile/${comment.author?.username}`, '_blank')}
                >
                  {comment.author?.name}
                </Text>
                
                {/* Badges */}
                {comment.isFeatured && (
                  <Tooltip title="Featured comment">
                    <Badge 
                      count={<StarOutlined style={{ color: '#faad14', fontSize: '10px' }} />}
                      style={{ 
                        backgroundColor: '#fffbe6',
                        padding: '0 4px',
                        borderRadius: '2px'
                      }}
                    />
                  </Tooltip>
                )}
                
                {comment.isPinned && (
                  <Tooltip title="Pinned comment">
                    <Badge 
                      count={<PushpinOutlined style={{ color: '#52c41a', fontSize: '10px' }} />}
                      style={{ 
                        backgroundColor: '#f6ffed',
                        padding: '0 4px',
                        borderRadius: '2px'
                      }}
                    />
                  </Tooltip>
                )}
              </Space>
              
              {/* Timestamp and Actions */}
              <Space size={4}>
                <Tooltip title={dayjs(comment.createdAt).format('MMM D, YYYY h:mm A')}>
                  <Text type="secondary" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {dayjs(comment.createdAt).fromNow()}
                    {comment.updatedAt !== comment.createdAt && ' • Edited'}
                  </Text>
                </Tooltip>
                
                {commentMenuItems.length > 0 && (
                  <Dropdown 
                    menu={{ items: commentMenuItems }} 
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<MoreOutlined />} 
                      style={{ marginLeft: 4 }}
                    />
                  </Dropdown>
                )}
              </Space>
            </div>

            {/* Comment Body */}
            {isEditing ? (
              <div style={{ marginBottom: 12 }}>
                <TextArea
                  autoFocus
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  style={{ marginBottom: 8 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleSaveEdit(comment.id);
                    }
                    if (e.key === 'Escape') {
                      setEditingId(null);
                    }
                  }}
                />
                <Space>
                  <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleSaveEdit(comment.id)}
                    loading={submitting}
                  >
                    Save
                  </Button>
                  <Button 
                    size="small"
                    onClick={() => setEditingId(null)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </Space>
              </div>
            ) : (
              <Paragraph 
                style={{ 
                  margin: 0, 
                  marginBottom: 12,
                  fontSize: isReply ? '14px' : '15px',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {comment.content}
              </Paragraph>
            )}

            {/* Comment Actions */}
            <Space size="middle" style={{ marginBottom: hasReplies ? 16 : 0 }}>
              <Button
                type="text"
                size="small"
                icon={comment.isLiked ? 
                  <LikeFilled style={{ color: '#1890ff' }} /> : 
                  <LikeOutlined />
                }
                onClick={() => handleLike(comment.id)}
                style={{ 
                  padding: '0 8px',
                  height: 'auto',
                  minWidth: 60
                }}
              >
                <span style={{ marginLeft: 4, fontSize: '12px' }}>
                  {comment.likesCount > 0 && comment.likesCount}
                </span>
              </Button>
              
              {!isReply && (
                <Button
                  type="text"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => {
                    setReplyTo(replyTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                  style={{ padding: '0 8px' }}
                >
                  <span style={{ marginLeft: 4, fontSize: '12px' }}>
                    Reply
                  </span>
                </Button>
              )}
            </Space>

            {/* Reply Input */}
            {replyTo === comment.id && (
              <div style={{ marginBottom: 16 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder={`Reply to ${comment.author?.name}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onPressEnter={() => handleReply(comment.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setReplyTo(null);
                        setReplyContent('');
                      }
                    }}
                    autoFocus
                  />
                  <Button 
                    type="primary" 
                    icon={submitting ? <LoadingOutlined /> : <SendOutlined />}
                    onClick={() => handleReply(comment.id)}
                    loading={submitting}
                    disabled={!replyContent.trim()}
                  />
                </Space.Compact>
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setReplyTo(null);
                    setReplyContent('');
                  }}
                  style={{ marginTop: 8 }}
                >
                  Cancel
                </Button>
              </div>
            )}

            {/* Replies */}
            {hasReplies && (
              <div style={{ 
                marginTop: 16,
                paddingLeft: 36,
                borderLeft: '2px solid #f0f0f0'
              }}>
                {comment.replies?.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Sort comments based on selected option
  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return (b.likesCount || 0) - (a.likesCount || 0);
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Separate pinned comments
  const pinnedComments = sortedComments.filter(comment => comment.isPinned);
  const regularComments = sortedComments.filter(comment => !comment.isPinned);

  return (
    <Card
      title={
        showHeader && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Text strong style={{ fontSize: '18px' }}>
                Comments
              </Text>
              {total > 0 && (
                <Badge 
                  count={total} 
                  style={{ 
                    backgroundColor: '#1890ff',
                    fontSize: '12px'
                  }} 
                />
              )}
            </Space>
            
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 150 }}
              size="middle"
              suffixIcon={<SortAscendingOutlined />}
            >
              <Option value="recent">Most Recent</Option>
              <Option value="popular">Most Popular</Option>
              <Option value="oldest">Oldest First</Option>
            </Select>
          </div>
        )
      }
      bordered={false}
      style={{ 
        background: 'transparent',
        boxShadow: 'none'
      }}
    >
      {/* Error Alert */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Comment Input */}
      {user ? (
        <div style={{ marginBottom: 32 }}>
          <Space align="start" style={{ width: '100%' }}>
            <Avatar 
              src={user.picture} 
              size="large"
              style={{ flexShrink: 0 }}
            >
              {user.name.charAt(0)}
            </Avatar>
            <div style={{ flex: 1 }}>
              <TextArea
                placeholder="Share your thoughts..."
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                autoFocus={autoFocus}
                style={{ marginBottom: 12 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && !submitting) {
                    handleSubmit();
                  }
                }}
                maxLength={2000}
                showCount
              />
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Press Ctrl+Enter to submit
                </Text>
                <Button
                  type="primary"
                  icon={submitting ? <LoadingOutlined /> : <SendOutlined />}
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!newComment.trim()}
                >
                  Comment
                </Button>
              </Space>
            </div>
          </Space>
        </div>
      ) : (
        <div style={{ 
          marginBottom: 32, 
          padding: 16, 
          background: 'linear-gradient(135deg, #f6ffed 0%, #e6f7ff 100%)',
          border: '1px solid #91d5ff',
          borderRadius: 8,
          textAlign: 'center',
        }}>
          <Space direction="vertical" size={8}>
            <UserOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Text type="secondary">
              Please <a href="/login" style={{ fontWeight: 500 }}>login</a> to join the discussion
            </Text>
          </Space>
        </div>
      )}

      {showHeader && <Divider />}

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center' }}>
          <Skeleton active paragraph={{ rows: 3 }} />
          <Skeleton active paragraph={{ rows: 2 }} style={{ marginTop: 24 }} />
          <Skeleton active paragraph={{ rows: 1 }} style={{ marginTop: 24 }} />
        </div>
      ) : sortedComments.length === 0 ? (
        <Empty
          image={<UserOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />}
          description={
            <Space direction="vertical" size={8}>
              <Text type="secondary">No comments yet</Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                Be the first to share your thoughts!
              </Text>
            </Space>
          }
          style={{ padding: '48px 0' }}
        />
      ) : (
        <>
          {/* Pinned Comments */}
          {pinnedComments.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <Space style={{ marginBottom: 16 }}>
                <PushpinOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ fontSize: '16px' }}>
                  Pinned Comments
                </Text>
              </Space>
              {pinnedComments.map(comment => renderComment(comment))}
              <Divider />
            </div>
          )}

          {/* Regular Comments */}
          {regularComments.length > 0 && (
            <div>
              {regularComments.map(comment => renderComment(comment))}
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && !initialComments && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: 32,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0'
            }}>
              <Pagination
                current={page}
                total={total}
                pageSize={pageSize}
                onChange={(newPage) => {
                  setPage(newPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  `${range[0]}-${range[1]} of ${total} comments`
                }
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
};


export default CommentsSection;