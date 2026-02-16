// ArticleDrafts.tsx - Complete corrected version with proper auth integration
import { t } from "@lingui/macro";
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Input, 
  Select, 
  Tag, 
  Badge,
  Dropdown, 
  Modal, 
  message,
  Tooltip,
  Avatar,
  Popconfirm,
  Drawer,
  Alert,
  Row,
  Col,
  Statistic,
  Empty,
  Typography,
  List,
  Form,
  Spin,
} from 'antd';
import { 
  SearchOutlined, 
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
  WarningOutlined,
  ArrowLeftOutlined,
  SendOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  CheckSquareOutlined,
  AuditOutlined,
  LoadingOutlined,
  UserOutlined,
  CrownOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import ArticleAdminNavbar from '../ArticleAdminSidebar';

// Import your auth hooks and stores
import { useUser } from '@/client/services/user'; 
import { useAuthStore } from '@/client/stores/auth';

// Import the article service functions
import { 
  getDrafts,
  submitDraftForReview,
  updateDraftStatus,
  deleteDraft as deleteDraftApi,
  getDraftValidationMessages,
  addValidationMessage,
  markValidationMessageResolved,
  type DraftParams,
  type AddValidationMessageData,
  type UpdateDraftStatusData
} from '@/client/services/article.service';

dayjs.extend(relativeTime);

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

interface DraftArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: any;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION' | 'PUBLISHED' | 'ARCHIVED';
  category: {
    id: string;
    name: string;
    color?: string;
  };
  author: {
    name: string;
    picture?: string;
    id: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedForReviewAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  validationMessages?: ValidationMessage[];
  estimatedReadingTime?: number;
  wordCount: number;
  imagesCount: number;
  tags: string[];
  targetLanguages?: string[];
  autoTranslate?: boolean;
  accessType?: 'FREE' | 'PREMIUM';
  coinPrice?: number;
  hasUnresolvedMessages?: boolean;
}

interface ValidationMessage {
  id: string;
  message: string;
  type: 'ERROR' | 'WARNING' | 'SUGGESTION' | 'REJECTION';
  section?: string;
  lineNumber?: number;
  createdBy: {
    name: string;
    id: string;
    role: string;
    picture?: string;
  };
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    name: string;
    id: string;
  };
}

interface ValidationStats {
  total: number;
  errors: number;
  warnings: number;
  suggestions: number;
  unresolved: number;
}

const ArticleDrafts: React.FC = () => {
  const navigate = useNavigate();
  
  // Use your auth hooks
  const { user, loading: userLoading, isAuthenticated, error: userError } = useUser();
  const { setUser } = useAuthStore();
  
  const [drafts, setDrafts] = useState<DraftArticle[]>([]);
  const [filteredDrafts, setFilteredDrafts] = useState<DraftArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    category: '',
    author: '',
  });
  
  // User state derived from auth hook
  const userRole = user?.role || 'ADMIN';
  const currentUserId = user?.id || '';
  const userName = user?.name || 'User';
  
  // Validation message states
  const [selectedDraft, setSelectedDraft] = useState<DraftArticle | null>(null);
  const [validationDrawerVisible, setValidationDrawerVisible] = useState(false);
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const [validationLoading, setValidationLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'ERROR' | 'WARNING' | 'SUGGESTION' | 'REJECTION'>('SUGGESTION');
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    total: 0,
    errors: 0,
    warnings: 0,
    suggestions: 0,
    unresolved: 0,
  });

  // Approval/Rejection modal states
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  // Auth state
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    console.log('🔐 ArticleDrafts auth state:', {
      user,
      isAuthenticated,
      userLoading,
      userError,
      userId: currentUserId,
      userRole,
      userName
    });

    if (userError) {
      console.error('❌ User fetch error:', userError);
      message.error('Authentication error. Please log in again.');
      navigate('/auth/login', { 
        state: { from: window.location.pathname } 
      });
      return;
    }

    if (!userLoading) {
      setAuthChecked(true);
      
      if (!isAuthenticated) {
        console.log('⚠️ User not authenticated, redirecting to login');
        message.error('Please log in to access article drafts');
        navigate('/auth/login', { 
          state: { 
            from: window.location.pathname,
            reason: 'Authentication required'
          } 
        });
        return;
      }
      
      console.log('✅ User authenticated, fetching drafts...');
      fetchDrafts();
    }
  }, [user, userLoading, isAuthenticated, userError, navigate]);

  // Fetch drafts when filters or pagination change
  useEffect(() => {
    if (!isAuthenticated) return;
    
    fetchDrafts();
  }, [pagination.current, filters, isAuthenticated]);

  // Apply filters to drafts
useEffect(() => {
  if (!isAuthenticated) return;
  
  console.log('🔍 Applying filters:', {
    draftsCount: drafts.length,
    filters: filters,
    userRole: userRole
  });
  
  let result = [...drafts];
  
  if (filters.status) {
    console.log('📊 Filtering by status:', filters.status);
    result = result.filter(draft => draft.status === filters.status);
  }
  
  if (filters.search) {
    console.log('📊 Filtering by search:', filters.search);
    const searchLower = filters.search.toLowerCase();
    result = result.filter(draft => 
      draft.title.toLowerCase().includes(searchLower) ||
      draft.excerpt.toLowerCase().includes(searchLower) ||
      (draft.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.category) {
    console.log('📊 Filtering by category:', filters.category);
    result = result.filter(draft => draft.category?.name === filters.category);
  }
  
  if (filters.author && userRole === 'SUPER_ADMIN') {
    console.log('📊 Filtering by author:', filters.author);
    result = result.filter(draft => draft.author.id === filters.author);
  }
  
  console.log('✅ Filtered result:', result.length, 'items');
  setFilteredDrafts(result);
}, [drafts, filters, userRole, isAuthenticated]);

  // Updated fetchDrafts function - clean version
const fetchDrafts = async () => {
  if (!isAuthenticated || !currentUserId) {
    console.log('⚠️ fetchDrafts called but user not authenticated or missing ID');
    return;
  }

  console.log('🔄 Fetching drafts for user:', {
    userId: currentUserId,
    userRole,
    userName,
    isAuthenticated
  });

  setLoading(true);
  try {
    const params: DraftParams = {
      page: pagination.current,
      limit: pagination.pageSize,
    };
    
    if (filters.status && filters.status !== '') {
      params.status = filters.status;
    }
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    
    // If admin, only fetch their drafts
    if (userRole === 'ADMIN') {
      params.authorId = currentUserId;
    }
    
    console.log('📤 Fetching drafts with params:', params);
    
    // IMPORTANT: Add a timestamp to prevent caching
    const timestamp = Date.now();
    const freshParams = { ...params, _t: timestamp };
    
    const response = await getDrafts(freshParams);
    
    // Log the exact response structure
    console.log('📥 Raw API response:', JSON.stringify(response, null, 2));
    console.log('📊 Response keys:', Object.keys(response || {}));
    
    // Extract data safely
    let draftsData = [];
    let totalCount = 0;
    
    if (response && typeof response === 'object') {
      // Check various possible response structures
      if (Array.isArray(response)) {
        draftsData = response;
        totalCount = response.length;
      } else if ('drafts' in response) {
        draftsData = response.drafts || [];
        totalCount = response.total || draftsData.length;
     
      }
    }
    
    console.log('📈 Extracted data:', {
      draftsCount: draftsData.length,
      total: totalCount,
      firstDraft: draftsData[0] || 'none'
    });
    
    // Transform drafts
    const draftsWithDetails: DraftArticle[] = draftsData.map((draft: any) => ({
      id: draft.id || '',
      title: draft.title || '',
      slug: draft.slug || '',
      excerpt: draft.excerpt || '',
      content: draft.content || '',
      status: draft.status || 'DRAFT',
      category: draft.category || { id: '', name: '', color: '' },
      author: draft.author || { id: '', name: '', picture: '' },
      createdAt: draft.createdAt || new Date().toISOString(),
      updatedAt: draft.updatedAt || new Date().toISOString(),
      submittedForReviewAt: draft.submittedForReviewAt,
      reviewedAt: draft.reviewedAt,
      reviewerId: draft.reviewerId,
      validationMessages: draft.validationMessages || [],
      wordCount: draft.wordCount || 0,
      estimatedReadingTime: draft.estimatedReadingTime || 0,
      imagesCount: draft.imagesCount || 0,
      tags: draft.tags || [],
      targetLanguages: draft.targetLanguages || [],
      autoTranslate: draft.autoTranslate || false,
      accessType: draft.accessType || 'FREE',
      coinPrice: draft.coinPrice || 0,
      hasUnresolvedMessages: draft.hasUnresolvedMessages || false,
    }));
    
    console.log('✅ Setting drafts:', draftsWithDetails.length, 'items');
    console.log('🎯 First draft title:', draftsWithDetails[0]?.title);
    
    setDrafts(draftsWithDetails);
    setPagination(prev => ({
      ...prev,
      total: totalCount,
    }));
    
    if (draftsWithDetails.length === 0) {
      message.info(t`No drafts found. Create your first draft!`);
    } else {
      message.success(t`Loaded ${draftsWithDetails.length} draft(s)`);
    }
    
  } catch (error: any) {
    console.error('❌ Failed to load drafts:', error);
    
    // Handle authentication errors
    if (error?.response?.status === 401 || 
        error?.message?.includes('Authentication') || 
        error?.message?.includes('Unauthorized')) {
      
      console.log('🔐 Authentication error, clearing user state');
      setUser(null);
      message.error('Session expired. Please log in again.');
      navigate('/auth/login', { 
        state: { from: window.location.pathname, reason: 'Session expired' } 
      });
      return;
    }
    
    message.error(t`Failed to load drafts: ${error.message || 'Unknown error'}`);
    setDrafts([]);
  } finally {
    setLoading(false);
  }
};

  const handleEditDraft = (draft: DraftArticle) => {
    if (!isAuthenticated) {
      message.error('Please log in to edit drafts');
      return;
    }
    navigate(`/dashboard/article-admin/articles/edit/${draft.slug}`);
  };

  const handleDeleteDraft = async (id: string) => {
    if (!isAuthenticated) {
      message.error('Please log in to delete drafts');
      return;
    }
    
    try {
      await deleteDraftApi(id);
      message.success(t`Draft deleted successfully`);
      fetchDrafts();
    } catch (error: any) {
      console.error('Delete error:', error);
      
      // Handle auth errors
      if (error?.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        navigate('/auth/login');
        return;
      }
      
      message.error(error.message || t`Failed to delete draft`);
    }
  };

  const handleSubmitForReview = async (draft: DraftArticle) => {
    if (!isAuthenticated) {
      message.error('Please log in to submit drafts for review');
      return;
    }
    
    Modal.confirm({
      title: t`Submit for Review`,
      content: t`Submit "${draft.title}" for review by the editorial team?`,
      onOk: async () => {
        try {
          await submitDraftForReview(draft.id);
          message.success(t`Draft submitted for review`);
          fetchDrafts();
        } catch (error: any) {
          console.error('Submit error:', error);
          
          // Handle auth errors
          if (error?.response?.status === 401) {
            message.error('Session expired. Please log in again.');
            navigate('/auth/login');
            return;
          }
          
          message.error(error.message || t`Failed to submit for review`);
        }
      },
    });
  };

  const handleViewValidations = async (draft: DraftArticle) => {
  if (!isAuthenticated) {
    message.error('Please log in to view validation messages');
    return;
  }
  
  console.log('Opening validation messages for draft:', {
    draftId: draft.id,
    existingMessagesCount: draft.validationMessages?.length || 0
  });
  
  setSelectedDraft(draft);
  
  // Use the messages already in the draft data
  const messages = draft.validationMessages || [];
  console.log('Using existing messages:', messages);
  
  setValidationMessages(messages as ValidationMessage[]);
  
  const stats: ValidationStats = {
    total: messages.length,
    errors: messages.filter((m: any) => m.type === 'ERROR').length,
    warnings: messages.filter((m: any) => m.type === 'WARNING').length,
    suggestions: messages.filter((m: any) => m.type === 'SUGGESTION').length,
    unresolved: messages.filter((m: any) => !m.resolved).length,
  };
  
  setValidationStats(stats);
  setValidationDrawerVisible(true);
};

  const handleAddValidationMessage = async () => {
    if (!newMessage.trim() || !selectedDraft) return;
    if (!isAuthenticated) {
      message.error('Please log in to add validation messages');
      return;
    }
    
    try {
      const data: AddValidationMessageData = {
        message: newMessage,
        type: messageType,
      };
      
      await addValidationMessage(selectedDraft.id, data);
      
      message.success(t`Validation message added`);
      setNewMessage('');
      
      // Refresh messages
      const messages = await getDraftValidationMessages(selectedDraft.id);
      setValidationMessages(messages as ValidationMessage[]);
      
      // Update stats
      const stats: ValidationStats = {
        total: messages.length,
        errors: messages.filter((m: any) => m.type === 'ERROR').length,
        warnings: messages.filter((m: any) => m.type === 'WARNING').length,
        suggestions: messages.filter((m: any) => m.type === 'SUGGESTION').length,
        unresolved: messages.filter((m: any) => !m.resolved).length,
      };
      setValidationStats(stats);
      
    } catch (error: any) {
      console.error('Error adding message:', error);
      
      // Handle auth errors
      if (error?.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        return;
      }
      
      message.error(t`Failed to add validation message: ${error.message}`);
    }
  };

  const handleMarkMessageResolved = async (messageId: string) => {
    if (!isAuthenticated) {
      message.error('Please log in to resolve messages');
      return;
    }
    
    try {
      await markValidationMessageResolved(messageId);
      message.success(t`Message marked as resolved`);
      
      if (selectedDraft) {
        const messages = await getDraftValidationMessages(selectedDraft.id);
        setValidationMessages(messages as ValidationMessage[]);
        
        // Update stats
        const stats: ValidationStats = {
          total: messages.length,
          errors: messages.filter((m: any) => m.type === 'ERROR').length,
          warnings: messages.filter((m: any) => m.type === 'WARNING').length,
          suggestions: messages.filter((m: any) => m.type === 'SUGGESTION').length,
          unresolved: messages.filter((m: any) => !m.resolved).length,
        };
        setValidationStats(stats);
      }
    } catch (error: any) {
      
      // Handle auth errors
      if (error?.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        return;
      }
      
      message.error(t`Failed to update message: ${error.message}`);
    }
  };

  const handleDraftAction = (draft: DraftArticle, action: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION') => {
    if (!isAuthenticated) {
      message.error('Please log in to perform this action');
      return;
    }
    
    setSelectedDraft(draft);
    setSelectedAction(action);
    setActionMessage('');
    setActionModalVisible(true);
  };

  const processDraftAction = async () => {
    if (!selectedDraft || !selectedAction || !isAuthenticated) return;
    
    setProcessingAction(true);
    try {
      let status: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
      
      switch (selectedAction) {
        case 'APPROVE':
          status = 'APPROVED';
          break;
        case 'REJECT':
          status = 'REJECTED';
          break;
        case 'REQUEST_REVISION':
          status = 'NEEDS_REVISION';
          break;
        default:
          throw new Error('Invalid action');
      }
      
      const data: UpdateDraftStatusData = {
        status,
        message: actionMessage,
      };
      
      await updateDraftStatus(selectedDraft.id, data);
      
      message.success(t`Draft ${selectedAction.toLowerCase()}d successfully`);
      setActionModalVisible(false);
      setSelectedAction(null);
      setActionMessage('');
      fetchDrafts();
      
    } catch (error: any) {
      console.error('Action error:', error);
      
      // Handle auth errors
      if (error?.response?.status === 401) {
        message.error('Session expired. Please log in again.');
        setActionModalVisible(false);
        navigate('/auth/login');
        return;
      }
      
      message.error(error.message || t`Failed to process action`);
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusBadge = (status: DraftArticle['status']) => {
    const config: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
      DRAFT: { 
        color: 'default', 
        text: t`Draft`, 
        icon: <FileTextOutlined /> 
      },
      UNDER_REVIEW: { 
        color: 'processing', 
        text: t`Under Review`, 
        icon: <ClockCircleOutlined /> 
      },
      APPROVED: { 
        color: 'success', 
        text: t`Approved`, 
        icon: <CheckCircleOutlined /> 
      },
      REJECTED: { 
        color: 'error', 
        text: t`Rejected`, 
        icon: <CloseCircleOutlined /> 
      },
      NEEDS_REVISION: { 
        color: 'warning', 
        text: t`Needs Revision`, 
        icon: <WarningOutlined /> 
      },
      PUBLISHED: { 
        color: 'green', 
        text: t`Published`, 
        icon: <GlobalOutlined /> 
      },
      ARCHIVED: { 
        color: 'default', 
        text: t`Archived`, 
        icon: <HistoryOutlined /> 
      },
    };
    
    const cfg = config[status] || { color: 'default', text: status, icon: null };
    
    return (
      <Badge
        status={cfg.color as any}
        text={
          <Space size={4}>
            {cfg.icon}
            <span>{cfg.text}</span>
          </Space>
        }
        className={`
          ${cfg.color === 'success' ? 'dark:bg-green-900 dark:text-green-200' : ''}
          ${cfg.color === 'error' ? 'dark:bg-red-900 dark:text-red-200' : ''}
          ${cfg.color === 'warning' ? 'dark:bg-yellow-900 dark:text-yellow-200' : ''}
          ${cfg.color === 'processing' ? 'dark:bg-blue-900 dark:text-blue-200' : ''}
          ${cfg.color === 'green' ? 'dark:bg-green-900 dark:text-green-200' : ''}
        `}
      />
    );
  };

  const getMessageTypeColor = (type: ValidationMessage['type']) => {
    switch (type) {
      case 'ERROR': return 'red';
      case 'WARNING': return 'orange';
      case 'SUGGESTION': return 'blue';
      case 'REJECTION': return 'purple';
      default: return 'default';
    }
  };

  // Dropdown menu for SUPER_ADMIN actions
  const getDropdownMenu = (record: DraftArticle) => {
    const items = [
      {
        key: 'publish',
        icon: <GlobalOutlined />,
        label: t`Publish Article`,
        onClick: () => handlePublishDraft(record),
        className: 'text-purple-600 dark:text-purple-400',
      },
      {
        key: 'approve',
        icon: <CheckCircleOutlined />,
        label: t`Approve & Publish`,
        onClick: () => handleDraftAction(record, 'APPROVE'),
      },
      {
        key: 'request_revision',
        icon: <WarningOutlined />,
        label: t`Request Revision`,
        onClick: () => handleDraftAction(record, 'REQUEST_REVISION'),
      },
      {
        key: 'reject',
        icon: <CloseCircleOutlined />,
        label: t`Reject`,
        onClick: () => handleDraftAction(record, 'REJECT'),
      },
    ];
    
    return items;
  };


  const handlePublishDraft = async (draft: DraftArticle) => {
  if (!isAuthenticated) {
    message.error('Please log in to publish articles');
    return;
  }
  
  if (userRole !== 'SUPER_ADMIN') {
    message.error('Only super admins can publish articles');
    return;
  }
  
  Modal.confirm({
    title: t`Publish Article`,
    content: (
      <div>
        <p>{t`Publish "${draft.title}" to make it live?`}</p>
        <Alert
          message={t`Notification will be sent to:`}
          description={
            <div className="mt-2 flex items-center gap-2">
              <Avatar size="small" src={draft.author.picture} className="bg-blue-500">
                {draft.author.name?.charAt(0)}
              </Avatar>
              <span className="font-medium">{draft.author.name}</span>
              <Tag color="blue">{t`Admin`}</Tag>
            </div>
          }
          type="info"
          showIcon
          className="mt-4 dark:bg-blue-900/30 dark:border-blue-800"
        />
      </div>
    ),
    okText: t`Publish Now`,
    cancelText: t`Cancel`,
    okButtonProps: {
      className: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 border-0'
    },
    onOk: async () => {
      try {
        // Update draft status to PUBLISHED
        const data: UpdateDraftStatusData = {
          status: 'PUBLISHED',
          message: `Article has been published by super admin ${userName}`,
        };
        
        await updateDraftStatus(draft.id, data);
        
        // Send notification to the admin author
        try {
          await addValidationMessage(draft.id, {
            message: `✅ Your article "${draft.title}" has been published by super admin ${userName}. It is now live on the platform.`,
            type: 'SUGGESTION',
          });
        } catch (notificationError) {
          console.warn('Could not send notification, but article was published:', notificationError);
        }
        
        // Show success message with details
        message.success({
          content: (
            <div>
              <div className="font-medium mb-2">✅ {t`Article Published!`}</div>
              <div className="text-sm">
                {t`Status changed to PUBLISHED`}
                <br />
                {t`Notification sent to:`} <Tag color="blue">{draft.author.name}</Tag>
              </div>
            </div>
          ),
          duration: 5,
        });
        
        // Refresh the drafts list
        fetchDrafts();
        
      } catch (error: any) {
        console.error('Publish error:', error);
        
        // Handle auth errors
        if (error?.response?.status === 401) {
          message.error('Session expired. Please log in again.');
          navigate('/auth/login');
          return;
        }
        
        message.error(error.message || t`Failed to publish article`);
      }
    },
  });
};
  

  const columns = [
    {
      title: t`Article`,
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text: string, record: DraftArticle) => (
        <div className="dark:text-white">
          <div className="font-medium mb-1 dark:text-gray-100">
            <a 
              onClick={() => handleEditDraft(record)}
              className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              {text}
            </a>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {record.excerpt?.substring(0, 120) || t`No excerpt`}...
          </div>
          <div className="space-x-1">
            {record.category?.name && (
              <Tag color={record.category?.color || 'blue'} className="dark:bg-opacity-20">
                {record.category?.name}
              </Tag>
            )}
            {(record.tags || []).slice(0, 2).map((tag: string) => (
              <Tag key={tag} className="dark:bg-gray-700 dark:text-gray-300">{tag}</Tag>
            ))}
            {(record.tags || []).length > 2 && (
              <Tag className="dark:bg-gray-700 dark:text-gray-300">+{(record.tags || []).length - 2}</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t`Author`,
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: any) => (
        <Space>
          <Avatar size="small" src={author?.picture} className="bg-blue-500 dark:bg-blue-600">
            {author?.name?.charAt(0) || 'U'}
          </Avatar>
          <span className="dark:text-gray-300">{author?.name || t`Unknown`}</span>
        </Space>
      ),
    },
    {
      title: t`Status`,
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record: DraftArticle) => (
        <Space direction="vertical" size={4}>
          {getStatusBadge(status as DraftArticle['status'])}
          {record.submittedForReviewAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {dayjs(record.submittedForReviewAt).fromNow()}
            </div>
          )}
        </Space>
      ),
    },
    {
      title: t`Details`,
      key: 'details',
      width: 150,
      render: (_: any, record: DraftArticle) => (
        <Space direction="vertical" size={2} className="text-sm dark:text-gray-400">
          <div>📝 {record.wordCount || 0} {t`words`}</div>
          <div>⏱️ {record.estimatedReadingTime || 0} {t`min read`}</div>
          <div>🖼️ {record.imagesCount || 0} {t`images`}</div>
          {record.accessType === 'PREMIUM' && (
            <div>👑 {record.coinPrice || 0} {t`coins`}</div>
          )}
        </Space>
      ),
    },
    {
      title: t`Validation`,
      key: 'validation',
      width: 140,
      render: (_: any, record: DraftArticle) => {
        const messages = record.validationMessages || [];
        const unresolved = messages.filter((m: any) => !m.resolved).length;
        const hasRejection = messages.some((m: any) => m.type === 'REJECTION');
        
        return (
          <Space direction="vertical" size={4}>
            <Button
              type="text"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleViewValidations(record)}
              className={`
                ${unresolved > 0 ? 'text-orange-600 dark:text-orange-400' : 
                  hasRejection ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'}
              `}
            >
              {unresolved > 0 ? `${unresolved} ${t`issues`}` : t`Review`}
            </Button>
            {hasRejection && (
              <Tag color="red" className="dark:bg-red-900 dark:text-red-200">
                {t`Rejected`}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: t`Updated`,
      key: 'updated',
      width: 120,
      render: (_: any, record: DraftArticle) => (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {dayjs(record.updatedAt).format('MMM D')}
        </div>
      ),
    },
    {
  title: t`Actions`,
  key: 'actions',
  width: 200, // Increased from 180 to accommodate the publish button
  render: (_: any, record: DraftArticle) => {
    const isOwner = record.author.id === currentUserId;
    const canSubmit = isOwner && (record.status === 'DRAFT' || record.status === 'NEEDS_REVISION');
    const canReview = userRole === 'SUPER_ADMIN' && record.status === 'UNDER_REVIEW';
    const canEdit = isOwner && (record.status === 'DRAFT' || record.status === 'NEEDS_REVISION' || record.status === 'REJECTED');
    const canPublish = userRole === 'SUPER_ADMIN' && (record.status === 'APPROVED' || record.status === 'DRAFT' || record.status === 'UNDER_REVIEW');
    
    return (
      <Space>
        <Tooltip title={t`Edit`}>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEditDraft(record)}
            disabled={!canEdit}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          />
        </Tooltip>
        
        {canSubmit && (
          <Tooltip title={t`Submit for Review`}>
            <Button
              type="text"
              icon={<SendOutlined />}
              onClick={() => handleSubmitForReview(record)}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
            />
          </Tooltip>
        )}
        
        {/* PUBLISH BUTTON - ONLY FOR SUPER_ADMIN */}
        {canPublish && (
          <Tooltip title={t`Publish Article`}>
            <Button
              type="primary"
              size="small"
              icon={<GlobalOutlined />}
              onClick={() => handlePublishDraft(record)}
              className="
                bg-purple-600 
                hover:bg-purple-700 
                dark:bg-purple-500 
                dark:hover:bg-purple-600
                border-0
                text-white
              "
            >
              {t`Publish`}
            </Button>
          </Tooltip>
        )}
        
        {canReview && (
          <Dropdown
            menu={{
              items: getDropdownMenu(record),
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            />
          </Dropdown>
        )}
        
        {canEdit && (
          <Tooltip title={t`Delete`}>
            <Popconfirm
              title={t`Delete Draft`}
              description={t`Are you sure you want to delete this draft?`}
              onConfirm={() => handleDeleteDraft(record.id)}
              okText={t`Yes`}
              cancelText={t`No`}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                className="hover:text-red-600 dark:hover:text-red-400"
              />
            </Popconfirm>
          </Tooltip>
        )}
      </Space>
    );
  },
},
  ];

  const getCategoryOptions = () => {
    const categories = [...new Set(drafts.map(draft => draft.category?.name).filter(Boolean))];
    return categories.map(cat => ({
      label: cat,
      value: cat,
    }));
  };

  const getAuthorOptions = () => {
    if (userRole !== 'SUPER_ADMIN') return [];
    const authors = [...new Set(drafts.map(draft => draft.author.id))];
    return authors.map(authorId => {
      const draft = drafts.find(d => d.author.id === authorId);
      return {
        label: draft?.author.name || 'Unknown',
        value: authorId,
      };
    });
  };

  // Show loading state while checking auth
  if (userLoading && !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <Title level={4} className="dark:text-white mt-6">
            {t`Loading...`}
          </Title>
          <Text type="secondary" className="dark:text-gray-400">
            {t`Checking authentication`}
          </Text>
        </div>
      </div>
    );
  }

  // Show authentication checked but not authenticated
  if (authChecked && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md w-full mx-4 shadow-lg border-0">
          <div className="text-center py-8">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
                <LoginOutlined className="text-2xl text-red-600 dark:text-red-300" />
              </div>
              <Title level={3} className="dark:text-white mb-2">
                {t`Authentication Required`}
              </Title>
              <Text type="secondary" className="dark:text-gray-400">
                {t`Please log in to access the article drafts.`}
              </Text>
            </div>
            
            <div className="space-y-3">
              <Button 
                type="primary" 
                size="large" 
                block
                onClick={() => navigate('/auth/login', { 
                  state: { from: window.location.pathname } 
                })}
                icon={<LoginOutlined />}
                className="h-12"
              >
                {t`Log In`}
              </Button>
              
              <Button 
                type="default" 
                size="large" 
                block
                onClick={() => navigate('/')}
                className="h-12"
              >
                {t`Go to Homepage`}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching drafts
  if (loading && drafts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingOutlined spin className="text-2xl text-blue-500 dark:text-blue-400" />
          <div className="mt-4 text-gray-600 dark:text-gray-400">{t`Loading drafts...`}</div>
        </div>
      </div>
    );
  }

  return (
    <>
     {/* Article Admin Navbar */}
      <ArticleAdminNavbar 
        currentPath={window.location.pathname}
        title={userRole === 'SUPER_ADMIN' ? t`Super Admin Dashboard` : t`Article Dashboard`}
      />

      {/* Header Card */}
      <Card className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 dark:text-white">
              <Button 
                type="text"
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate(-1)}
                className="
                  !text-gray-600 
                  hover:!text-blue-600 
                  dark:!text-gray-200 
                  dark:hover:!text-blue-300
                  hover:!bg-gray-100 
                  dark:hover:!bg-gray-700
                  !transition-colors 
                  !duration-200
                  rounded
                "
              >
                {t`Back`}
              </Button>
              <div>
                <div className="font-semibold text-lg">
                  {t`Article Drafts`}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {userRole === 'SUPER_ADMIN' 
                    ? t`Review and manage all article drafts` 
                    : t`View and manage your article drafts`
                  }
                  <div className="mt-1 flex items-center gap-2">
                    <Tag color="green" className="dark:bg-green-900 dark:text-green-200">
                      {t`User:`} {userName}
                    </Tag>
                    <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200">
                      {t`Role:`} {userRole}
                    </Tag>
                    <Tag color="orange" className="dark:bg-orange-900 dark:text-orange-200">
                      {t`Status:`} {isAuthenticated ? t`Authenticated` : t`Not Authenticated`}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                {pagination.total} {t`total`}
              </Tag>
              <Tag color="green" className="dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                {filteredDrafts.length} {t`filtered`}
              </Tag>
              {userRole === 'SUPER_ADMIN' && (
                <Tag icon={<CrownOutlined />} color="purple" className="dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700">
                  {t`Review Mode`}
                </Tag>
              )}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Search
              placeholder={t`Search drafts...`}
              onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
              className="w-full dark:[&_.ant-input]:bg-gray-700 dark:[&_.ant-input]:border-gray-600 dark:[&_.ant-input]:text-white"
              allowClear
              suffix={<SearchOutlined />}
            />
            
            <Select
              placeholder={t`Status`}
              allowClear
              className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              popupClassName="dark:bg-gray-800 dark:border-gray-700"
              value={filters.status}
            >
              <Option value="">{t`All Statuses`}</Option>
              <Option value="DRAFT">{t`Draft`}</Option>
              <Option value="UNDER_REVIEW">{t`Under Review`}</Option>
              <Option value="APPROVED">{t`Approved`}</Option>
              <Option value="PUBLISHED">{t`Published`}</Option> 
              <Option value="REJECTED">{t`Rejected`}</Option>
              <Option value="NEEDS_REVISION">{t`Needs Revision`}</Option>
            </Select>
            
            <Select
              placeholder={t`Category`}
              allowClear
              className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              popupClassName="dark:bg-gray-800 dark:border-gray-700"
              options={getCategoryOptions()}
            />
            
            {userRole === 'SUPER_ADMIN' && (
              <Select
                placeholder={t`Author`}
                allowClear
                className="w-full dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
                onChange={(value) => setFilters(prev => ({ ...prev, author: value }))}
                popupClassName="dark:bg-gray-800 dark:border-gray-700"
                options={getAuthorOptions()}
              />
            )}
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      {userRole === 'SUPER_ADMIN' && (
        <Card className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title={t`Total Drafts`}
                value={drafts.length}
                prefix={<FileTextOutlined />}
                className="dark:[&_.ant-statistic-title]:text-gray-300 dark:[&_.ant-statistic-content]:text-gray-200"
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t`Under Review`}
                value={drafts.filter(d => d.status === 'UNDER_REVIEW').length}
                prefix={<ClockCircleOutlined />}
                className="
                  [&_.ant-statistic-content]:text-blue-600 
                  dark:[&_.ant-statistic-title]:text-gray-300 
                  dark:[&_.ant-statistic-content]:text-blue-400
                "
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t`Needs Revision`}
                value={drafts.filter(d => d.status === 'NEEDS_REVISION').length}
                prefix={<WarningOutlined />}
                className="
                  [&_.ant-statistic-content]:text-yellow-600 
                  dark:[&_.ant-statistic-title]:text-gray-300 
                  dark:[&_.ant-statistic-content]:text-yellow-400
                "
              />
            </Col>
            <Col span={6}>
              <Statistic
                title={t`Rejected`}
                value={drafts.filter(d => d.status === 'REJECTED').length}
                prefix={<CloseCircleOutlined />}
                className="
                  [&_.ant-statistic-content]:text-red-600 
                  dark:[&_.ant-statistic-title]:text-gray-300 
                  dark:[&_.ant-statistic-content]:text-red-400
                "
              />
            </Col>
          </Row>
        </Card>
      )}

      
<Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
  <Table
    columns={columns}
    dataSource={filteredDrafts}
    rowKey="id"
    loading={loading}
    pagination={{
      ...pagination,
      className: "dark:[&_.ant-pagination-item]:bg-gray-800 dark:[&_.ant-pagination-item]:border-gray-600 dark:[&_.ant-pagination-item_a]:text-gray-300",
      responsive: true,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total, range) => 
        t`${range[0]}-${range[1]} of ${total} drafts`,
      onChange: (page, pageSize) => {
        setPagination({ current: page, pageSize, total: pagination.total });
      },
    }}
    scroll={{ x: 'max-content' }}
    className="
      [&_.ant-table-thead]:bg-gray-50 
      dark:[&_.ant-table-thead]:bg-gray-800 
      [&_.ant-table-cell]:dark:bg-gray-800 
      [&_.ant-table-cell]:dark:text-gray-200
      [&_.ant-table-tbody_>_tr:hover]:dark:bg-gray-700
      [&_.ant-table-tbody_>_tr:hover_.ant-table-cell]:dark:bg-gray-700
    "
    locale={{
      emptyText: (
        <Empty
          description={
            <span className="dark:text-gray-400">
              {t`No drafts found`}
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )
    }}
  />
</Card>

      {/* Validation Messages Drawer */}
      <Drawer
        title={
          <Space className="dark:text-white">
            <AuditOutlined />
            <span>
              {t`Validation Messages`} - "{selectedDraft?.title}"
            </span>
          </Space>
        }
        placement="right"
        width={600}
        onClose={() => setValidationDrawerVisible(false)}
        open={validationDrawerVisible}
        extra={
          <Space>
            <Button 
              onClick={() => setValidationDrawerVisible(false)}
              className="dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              {t`Close`}
            </Button>
          </Space>
        }
        className="dark:bg-gray-800 [&_.ant-drawer-header]:dark:bg-gray-800 [&_.ant-drawer-header]:dark:border-gray-700 [&_.ant-drawer-body]:dark:bg-gray-800"
      >
        {validationLoading ? (
          <div className="text-center py-12">
            <LoadingOutlined spin className="text-2xl text-blue-500 dark:text-blue-400" />
            <div className="mt-4 text-gray-600 dark:text-gray-400">{t`Loading validation messages...`}</div>
          </div>
        ) : (
          <>
            {/* Validation Stats */}
            <Card size="small" className="mb-6 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title={t`Total`}
                    value={validationStats.total}
                    className="dark:text-gray-300 [&_.ant-statistic-content]:dark:text-gray-300"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Errors`}
                    value={validationStats.errors}
                    className="[&_.ant-statistic-content]:text-red-600 dark:[&_.ant-statistic-content]:text-red-400"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Warnings`}
                    value={validationStats.warnings}
                    className="[&_.ant-statistic-content]:text-yellow-600 dark:[&_.ant-statistic-content]:text-yellow-400"
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={t`Unresolved`}
                    value={validationStats.unresolved}
                    className="[&_.ant-statistic-content]:text-orange-600 dark:[&_.ant-statistic-content]:text-orange-400"
                  />
                </Col>
              </Row>
            </Card>

            {/* Add New Message (SUPER_ADMIN only) */}
            {userRole === 'SUPER_ADMIN' && (
              <Card size="small" className="mb-6 dark:bg-gray-700 dark:border-gray-600">
                <Title level={5} className="dark:text-white mb-4">{t`Add Validation Message`}</Title>
                <Space direction="vertical" className="w-full">
                  <Select
                    value={messageType}
                    onChange={(value) => setMessageType(value)}
                    className="w-full dark:[&_.ant-select-selector]:bg-gray-800"
                    popupClassName="dark:bg-gray-800"
                  >
                    <Option value="SUGGESTION">{t`Suggestion`}</Option>
                    <Option value="WARNING">{t`Warning`}</Option>
                    <Option value="ERROR">{t`Error`}</Option>
                    <Option value="REJECTION">{t`Rejection`}</Option>
                  </Select>
                  <Input.TextArea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={t`Enter validation message...`}
                    rows={3}
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                  <Button
                    type="primary"
                    onClick={handleAddValidationMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
                  >
                    {t`Add Message`}
                  </Button>
                </Space>
              </Card>
            )}

            {/* Messages List */}
            <Title level={5} className="dark:text-white mb-4">{t`All Messages`}</Title>
            {validationMessages.length === 0 ? (
              <Empty
                description={t`No validation messages`}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="dark:text-gray-400"
              />
            ) : (
              <List
                dataSource={validationMessages}
                className="dark:text-gray-300"
                renderItem={(msg: ValidationMessage) => (
                  <List.Item
                    key={msg.id}
                    className="border-b border-gray-200 dark:border-gray-700 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    actions={
                      (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && !msg.resolved ? [
                        <Button
                          key="resolve"
                          type="text"
                          size="small"
                          icon={<CheckSquareOutlined />}
                          onClick={() => handleMarkMessageResolved(msg.id)}
                          className="text-green-600 dark:text-green-400"
                        >
                          {t`Mark Resolved`}
                        </Button>
                      ] : []
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar size="small" src={msg.createdBy.picture} icon={<UserOutlined />}>
                          {msg.createdBy.name.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <Tag color={getMessageTypeColor(msg.type)} className="dark:bg-opacity-20">
                            {msg.type}
                          </Tag>
                          <span className="dark:text-white">{msg.createdBy.name}</span>
                          <Tag color={msg.createdBy.role === 'SUPER_ADMIN' ? 'purple' : 'blue'}>
                            {msg.createdBy.role}
                          </Tag>
                          {msg.resolved && (
                            <Tag color="green" className="dark:bg-green-900 dark:text-green-200">
                              {t`Resolved`}
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <Paragraph className="dark:text-gray-300 mb-2">
                            {msg.message}
                          </Paragraph>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {dayjs(msg.createdAt).format('MMM D, YYYY h:mm A')}
                            {msg.section && ` • ${t`Section:`} ${msg.section}`}
                            {msg.lineNumber && ` • ${t`Line:`} ${msg.lineNumber}`}
                          </div>
                          {msg.resolved && msg.resolvedBy && (
                            <div className="text-xs text-green-600 dark:text-green-400">
                              {t`Resolved by ${msg.resolvedBy.name} on ${dayjs(msg.resolvedAt).format('MMM D, YYYY')}`}
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </>
        )}
      </Drawer>

      {/* Action Modal (Approve/Reject/Request Revision) */}
      <Modal
        title={
          <Space>
            {selectedAction === 'APPROVE' && <CheckCircleOutlined className="text-green-500" />}
            {selectedAction === 'REJECT' && <CloseCircleOutlined className="text-red-500" />}
            {selectedAction === 'REQUEST_REVISION' && <WarningOutlined className="text-yellow-500" />}
            <span className="dark:text-white">
              {selectedAction === 'APPROVE' ? t`Approve Draft` :
               selectedAction === 'REJECT' ? t`Reject Draft` :
               t`Request Revision`}
            </span>
          </Space>
        }
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          setSelectedAction(null);
          setActionMessage('');
        }}
        onOk={processDraftAction}
        confirmLoading={processingAction}
        okText={
          selectedAction === 'APPROVE' ? t`Approve & Publish` :
          selectedAction === 'REJECT' ? t`Reject Draft` :
          t`Request Revision`
        }
        okButtonProps={{
          className: selectedAction === 'APPROVE' 
            ? 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 border-0'
            : selectedAction === 'REJECT'
            ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 border-0'
            : 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 border-0'
        }}
        cancelText={t`Cancel`}
        width={500}
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-header]:bg-gray-800 dark:[&_.ant-modal-header]:border-gray-700"
      >
        <div className="mb-4">
          <Alert
            message={t`Article:`}
            description={
              <Text strong className="dark:text-white">
                "{selectedDraft?.title}"
              </Text>
            }
            type="info"
            showIcon
            className="dark:bg-blue-900/50 dark:border-blue-800"
          />
        </div>
        
        <Form layout="vertical">
          <Form.Item
            label={
              <span className="dark:text-gray-300">
                {selectedAction === 'APPROVE' ? t`Approval Notes (Optional)` :
                 selectedAction === 'REJECT' ? t`Rejection Reason` :
                 t`Revision Instructions`}
              </span>
            }
            extra={
              <span className="dark:text-gray-400">
                {selectedAction === 'APPROVE' ? t`Add optional notes for the author` :
                 selectedAction === 'REJECT' ? t`Explain why this draft is being rejected` :
                 t`Provide clear instructions for required revisions`}
              </span>
            }
          >
            <Input.TextArea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              rows={4}
              placeholder={
                selectedAction === 'APPROVE' ? t`Great work! This article is ready for publication...` :
                selectedAction === 'REJECT' ? t`This draft needs significant improvement. Issues include...` :
                t`Please revise the introduction section and add more examples...`
              }
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required={selectedAction !== 'APPROVE'}
            />
          </Form.Item>
          
          {selectedAction === 'REJECT' && (
            <Alert
              message={t`Warning`}
              description={t`Rejected drafts will be sent back to the author with your feedback. The author can resubmit after making changes.`}
              type="warning"
              showIcon
              className="dark:bg-yellow-900/50 dark:border-yellow-800"
            />
          )}
          
          {selectedAction === 'REQUEST_REVISION' && (
            <Alert
              message={t`Note`}
              description={t`The draft status will change to "Needs Revision". The author will receive your instructions and can make the requested changes.`}
              type="info"
              showIcon
              className="dark:bg-blue-900/50 dark:border-blue-800"
            />
          )}
        </Form>
      </Modal>
    </>
  );
};

export default ArticleDrafts;