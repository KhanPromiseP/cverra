

import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Row, 
  Col, 
  Space, 
  Upload, 
  Switch, 
  DatePicker,
  message,
  Alert,
  Divider,
  Typography,
  Steps,
  Tabs,
  Breadcrumb,
  Spin,
  Tag,
  Tooltip,
  Badge, 
  Radio,
  Rate
} from 'antd';
import { 
  SaveOutlined, 
  SendOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  UploadOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  FireOutlined,
  StarOutlined,
  WarningOutlined,
  CrownOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  EditOutlined,
   LeftOutlined, 
  RightOutlined, 

} from '@ant-design/icons';
import dayjs from 'dayjs';
import SafeJoditWrapper from '../../../../components/article-editor/SafeJoditWrapper';
import ArticleAdminNavbar from '../ArticleAdminSidebar';

import { 
  createArticle, 
  updateArticle, 
  getArticle, 
  getCategories,
  uploadImage
} from '../../../../services/article.service';
import { RcFile } from 'antd/es/upload';
import { useNavigate } from 'react-router';

import { 
  TranslationOutlined, 
  CheckOutlined,
  SyncOutlined,
  FileTextOutlined,
  EyeInvisibleOutlined,
  LoadingOutlined,
  GlobalOutlined,
  RobotOutlined,
  UserOutlined
} from '@ant-design/icons';
import { 
  getArticleAvailableLanguages, 
  getTranslationStatus, 
  triggerArticleTranslation,
  getTranslations,
  updateTranslation,
  regenerateTranslation 
} from '../../../../services/article.service';

import { useUser } from '@/client/services/user'; 
import { useAuthStore } from '@/client/stores/auth'; 

const { TabPane } = Tabs;

// Add these interfaces
interface Translation {
  id: string;
  language: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  confidence?: number;
  needsReview: boolean;
  qualityScore?: number;
  translatedBy: 'AI' | 'HUMAN' | string;
  createdAt: string;
  updatedAt: string;
  
  // These are the correct field names from your schema:
  title: string;  // NOT translatedTitle
  excerpt?: string;  // NOT translatedExcerpt
  content?: any;  // NOT translatedContent
  
  article?: {
    id: string;
    title: string;
    slug: string;
  };

  // Check if these fields exist in your backend response
  translatedTitle?: string;
  translatedContent?: string;
  translatedExcerpt?: string;
}

interface AvailableLanguage {
  language: string;
  isOriginal: boolean;
  qualityScore: number;
  confidence: number;
}

const CONTENT_TYPES = [
  { value: 'STANDARD', label: t`Standard Article`, icon: '📝', description: t`Regular informative article` },
  { value: 'GUIDE', label: t`Comprehensive Guide`, icon: '📚', description: t`In-depth guide or manual` },
  { value: 'TUTORIAL', label: t`Step-by-Step Tutorial`, icon: '🔧', description: t`Practical how-to guide` },
  { value: 'CASE_STUDY', label: t`Case Study`, icon: '📊', description: t`Real-world analysis` },
  { value: 'RESEARCH', label: t`Research Paper`, icon: '🔬', description: t`Data-driven research` },
  { value: 'INTERVIEW', label: t`Expert Interview`, icon: '🎤', description: t`Q&A with professionals` },
];

const READING_LEVELS = [
  { value: 'BEGINNER', label: t`Beginner`, color: 'green', description: t`Introductory, easy to understand` },
  { value: 'INTERMEDIATE', label: t`Intermediate`, color: 'blue', description: t`Some prior knowledge helpful` },
  { value: 'ADVANCED', label: t`Advanced`, color: 'purple', description: t`Deep technical knowledge required` },
  { value: 'EXPERT', label: t`Expert`, color: 'red', description: t`Specialized, professional-level` },
];

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Step } = Steps;

interface Category {
  id: string;
  name: string;
  color?: string;
}

interface ArticleFormData {
  title: string;
  excerpt: string;
  content: string | any;
  categoryId: string;
  tags: string[];
  accessType: 'FREE' | 'PREMIUM';
  coinPrice?: number;
  coverImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  autoTranslate: boolean;
  targetLanguages: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';
  publishedAt?: Date;
  scheduledFor?: Date;

  // Content Flags
  isFeatured: boolean;
  isTrending: boolean;
  isEditorPick: boolean;
  isPopular: boolean;
  featuredRanking: number;
  trendingScore: number;
  
  contentType: 'STANDARD' | 'GUIDE' | 'TUTORIAL' | 'CASE_STUDY' | 'RESEARCH' | 'INTERVIEW';
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  timeToRead: number;
}


interface TranslationTabProps {
  isEditMode: boolean;
  articleId: string | null;
  translations: Translation[];
  availableLanguages: AvailableLanguage[];
  loading: boolean;
  activeTab: string;
  onTabChange: (language: string) => void;
  onEditTranslation: (language: string) => void;
  onGenerateTranslation: (language: string) => void;
  onRegenerateTranslation: (translationId: string) => void;
  onMarkReviewed: (translationId: string) => void;
  formValues: Partial<ArticleFormData>;
  isEditingTranslation: boolean;
  editingLanguage: string;
  translationForm: any;
  onSaveTranslation: () => void;
  onCancelTranslation: () => void;
  getLanguageFlag: (language: string) => string;
  onRefreshTranslations: () => void;
}


const TranslationTab: React.FC<TranslationTabProps> = ({
  isEditMode,
  articleId,
  translations,
  availableLanguages,
  loading,
  activeTab,
  onTabChange,
  onEditTranslation,
  onGenerateTranslation,
  onRegenerateTranslation,
  onMarkReviewed,
  formValues,
  isEditingTranslation,
  editingLanguage,
  translationForm,
  onSaveTranslation,
  onCancelTranslation,
  getLanguageFlag, 
  onRefreshTranslations,
}) => {
  

  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge status="success" text={t`Completed`} />;
      case 'PENDING':
        return <Badge status="default" text={t`Pending`} />;
      case 'PROCESSING':
        return <Badge status="processing" text={t`Processing`} />;
      case 'FAILED':
        return <Badge status="error" text={t`Failed`} />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  if (!isEditMode) {
    return (
      <Alert
        message={t`Save article first`}
        description={t`You need to save the article before managing translations.`}
        type="info"
        showIcon
      />
    );
  }

  if (isEditingTranslation) {
    return (
      <Card>

        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4}>
            {t`Editing`} {getLanguageFlag(editingLanguage)} {editingLanguage.toUpperCase()} {t`Translation`}
          </Title>
          <Space>
            <Button onClick={onCancelTranslation}>
              {t`Cancel`}
            </Button>
            <Button type="primary" onClick={onSaveTranslation}>
              {t`Save Translation`}
            </Button>
          </Space>
        </div>
        
        <Form form={translationForm} layout="vertical">
          <Form.Item
            label={t`Title`}
            name="title"  // Changed from "translatedTitle"
            rules={[{ required: true, message: t`Please enter translated title` }]}
          >
            <Input placeholder={t`Translated title`} />
          </Form.Item>
          
          <Form.Item
            label={t`Excerpt`}
            name="excerpt"  // Changed from "translatedExcerpt"
          >
            <TextArea rows={3} placeholder={t`Translated excerpt`} />
          </Form.Item>
          
          <Form.Item
            label={t`Content`}
            name="content"  // Changed from "translatedContent"
          >
            <SafeJoditWrapper
              value={translationForm.getFieldValue('content')}
              onChange={(content) => translationForm.setFieldValue('content', content)}
              height={400}
              placeholder={t`Translated content...`}
            />
          </Form.Item>
        </Form>
        
        <Divider />
        
        <Alert
          message={t`Original English Content`}
          description={
            <div>
              <p><strong>{t`Title:`}</strong> {formValues.title}</p>
              <p><strong>{t`Excerpt:`}</strong> {formValues.excerpt}</p>
            </div>
          }
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const cleanTranslationUrl = () => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  
  // Remove translation parameters after loading
  params.delete('translationId');
  params.delete('language');
  params.delete('step');
  
  const newUrl = `${url.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState({}, document.title, newUrl);
};




  return (
    <Card>

      {/* Add refresh button at the top */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 16,
        paddingBottom: 16,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Space>
          <Typography.Title level={4} style={{ margin: 0 }}>
            <TranslationOutlined /> {t`Translations Management`}
          </Typography.Title>
          {onRefreshTranslations && (
            <Button 
              icon={<SyncOutlined />}
              onClick={onRefreshTranslations}
              loading={loading}
              size="small"
              type="text"
            >
              {t`Refresh`}
            </Button>
          )}
        </Space>
        
        <Tag color="blue">
          {translations.length} {t`translations`}
        </Tag>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        tabPosition="top"
        type="card"
        // Add a key to force re-render when translations update
        key={`tabs-${translations.length}-${loading}`}
      >
        {availableLanguages.map((lang) => {
          const translation = translations.find(t => t.language === lang.language);
          const isProcessing = translation?.status === 'PROCESSING';
          
          return (
            <TabPane
              key={lang.language}
              tab={
                <Space>
                  <span style={{ fontSize: '18px' }}>{getLanguageFlag(lang.language)}</span>
                  <span>{lang.language.toUpperCase()}</span>
                  {translation && (
                    <Badge 
                      status={translation.status === 'COMPLETED' ? 'success' : 
                             translation.status === 'FAILED' ? 'error' : 
                             'processing'} 
                      size="small" 
                    />
                  )}
                </Space>
              }
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <LoadingOutlined spin />
                  <div>{t`Loading translation...`}</div>
                </div>
              ) : (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                    <Space>
                      {translation ? (
                        <div>
                          <Card size="small" title={t`Translated Title`}>
                            <p>{translation.title || t`No title translation`}</p>
                            {translation.title && (
                              <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
                                Original: {formValues.title}
                              </div>
                            )}
                          </Card>
                          
                          <Card size="small" title={t`Translated Excerpt`} style={{ marginTop: 16 }}>
                            <p>{translation.excerpt || t`No excerpt translation`}</p>
                          </Card>
                          
                          <Card size="small" title={t`Translated Content Preview`} style={{ marginTop: 16 }}>
                            {translation.content ? (
                              <div 
                                style={{ 
                                  maxHeight: '300px', 
                                  overflow: 'auto',
                                  padding: '8px',
                                  background: '#f5f5f5',
                                  borderRadius: '4px'
                                }}
                              >
                                {/* Render content based on type */}
                                {(() => {
                                  const content = translation.content;
                                  
                                  if (typeof content === 'string') {
                                    // Try to parse as JSON
                                    try {
                                      const parsed = JSON.parse(content);
                                      if (parsed?.content && Array.isArray(parsed.content)) {
                                        // It's TipTap JSON - extract text
                                        const text = parsed.content
                                          .filter((block: any) => block.type === 'paragraph')
                                          .flatMap((block: any) => 
                                            block.content?.map((text: any) => text.text).join('') || ''
                                          )
                                          .join(' ');
                                        
                                        return text.substring(0, 500) + (text.length > 500 ? '...' : '');
                                      }
                                      return content.substring(0, 500) + (content.length > 500 ? '...' : '');
                                    } catch {
                                      // It's plain text
                                      return content.substring(0, 500) + (content.length > 500 ? '...' : '');
                                    }
                                  } else if (typeof content === 'object' && content !== null) {
                                    // It's already JSON
                                    if (content.content && Array.isArray(content.content)) {
                                      const text = content.content
                                        .filter((block: any) => block.type === 'paragraph')
                                        .flatMap((block: any) => 
                                          block.content?.map((text: any) => text.text).join('') || ''
                                        )
                                        .join(' ');
                                      
                                      return text.substring(0, 500) + (text.length > 500 ? '...' : '');
                                    }
                                    // Fallback to stringify
                                    return JSON.stringify(content).substring(0, 500) + '...';
                                  }
                                  
                                  return t`No content available`;
                                })()}
                              </div>
                            ) : (
                              <Alert
                                message={t`No content available`}
                                description={t`This translation has no content yet. Click "Edit" to add content.`}
                                type="info"
                                showIcon
                              />
                            )}
                          </Card>
                        </div>
                      ) : (
                        <Tag color="default">{t`No translation yet`}</Tag>
                      )}
                    </Space>
                    
                    <Space>
                      {translation ? (
                        <>
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => {
                              onEditTranslation(lang.language);
                            }}
                            type={isEditingTranslation && editingLanguage === lang.language ? "primary" : "default"}
                          >
                            {isEditingTranslation && editingLanguage === lang.language ? t`Editing...` : t`Edit`}
                          </Button>

                          {translation.needsReview && (
                            <Button
                              icon={<CheckOutlined />}
                              onClick={() => onMarkReviewed(translation.id)}
                            >
                              {t`Mark Reviewed`}
                            </Button>
                          )}
                          <Button
                            icon={<SyncOutlined />}
                            onClick={() => onRegenerateTranslation(translation.id)}
                            loading={isProcessing}
                          >
                            {t`Regenerate`}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="primary"
                          icon={<RobotOutlined />}
                          onClick={() => onGenerateTranslation(lang.language)}
                        >
                          {t`Generate with AI`}
                        </Button>
                      )}
                    </Space>
                  </div>
                  
                  
                </>
              )}
            </TabPane>
          );
        })}
      </Tabs>
    </Card>
  );
};


const getArticleIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  console.log('Current path:', path);
  
  const patterns = [
    /\/edit\/([^/]+)/, 
    /\/articles\/edit\/([^/]+)/,
    /\/dashboard\/article-admin\/articles\/edit\/([^/]+)/,
    /\/update\/([^/]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match && match[1]) {
      console.log('Found identifier:', match[1]);
      return match[1];
    }
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const idParam = urlParams.get('id');
  if (idParam) {
    console.log('Found ID from query param:', idParam);
    return idParam;
  }
  
  console.log('No identifier found in URL');
  return null;
};

const ArticleForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [formValues, setFormValues] = useState<Partial<ArticleFormData>>({});

  // translation states
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<AvailableLanguage[]>([]);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [activeTranslationTab, setActiveTranslationTab] = useState<string>('en');
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);

  
  const [tagInput, setTagInput] = useState('');
  const { user, loading: userLoading, isAuthenticated } = useUser();
  
  // Determine user role
  const userRole = user?.role || 'ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  // Add this to track if we're in translation edit mode
  const [translationForm] = Form.useForm();
  
  const id = getArticleIdFromUrl();
  const isEditMode = !!id;


  useEffect(() => {
  return () => {
    // Clean up local storage when leaving the page
    localStorage.removeItem('pendingTranslationEdit');
  };
}, []);


  useEffect(() => {
    const initialize = async () => {
      setInitialLoading(true);
      try {
        await fetchCategories();
        if (isEditMode) {
          await fetchArticle();
        }
      } catch (error) {
        console.error('Initialize error:', error);
        message.error(t`Failed to initialize form`);
      } finally {
        setInitialLoading(false);
      }
    };
    
    initialize();
  }, [id]);

useEffect(() => {
  const handleTranslationNavigation = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const translationId = urlParams.get('translationId');
    const language = urlParams.get('language');
    const step = urlParams.get('step');
    
    if (translationId && language) {
      console.log('🎯 Translation edit mode detected:', {
        translationId,
        language,
        step
      });
      
      // Store these in component state so they persist
      setCurrentStep(step ? parseInt(step) : 4);
      setActiveTranslationTab(language);
      
      // Store the translation parameters for later use
      localStorage.setItem('pendingTranslationEdit', JSON.stringify({
        translationId,
        language,
        timestamp: Date.now()
      }));
      
      // Show notification
      message.info(t`Loading ${language.toUpperCase()} translation...`);
    }
  };
  
  handleTranslationNavigation();
}, []);

useEffect(() => {
  const pendingTranslation = localStorage.getItem('pendingTranslationEdit');
  
  if (pendingTranslation && translations.length > 0 && !isEditingTranslation) {
    try {
      const { language, translationId, timestamp } = JSON.parse(pendingTranslation);
      
      // Check if this is recent (within last 30 seconds)
      if (Date.now() - timestamp > 30000) {
        localStorage.removeItem('pendingTranslationEdit');
        return;
      }
      
      const translation = translations.find(t => 
        t.language === language && t.id === translationId
      );
      
      if (translation) {
        console.log('🔄 Auto-entering translation edit mode for:', language);
        
        // Set active tab
        setActiveTranslationTab(language);
        
        // Load translation data into form
        translationForm.setFieldsValue({
          title: translation.title || form.getFieldValue('title'),
          excerpt: translation.excerpt || form.getFieldValue('excerpt'),
          content: translation.content || form.getFieldValue('content'),
        });
        
        // Enter edit mode
        setIsEditingTranslation(true);
        setEditingTranslation(translation);
        
        // Show success message
        message.success(t`Now editing ${language.toUpperCase()} translation`);
        
        // Clean up storage after a delay
        setTimeout(() => {
          localStorage.removeItem('pendingTranslationEdit');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error loading pending translation:', error);
      localStorage.removeItem('pendingTranslationEdit');
    }
  }
}, [translations, isEditingTranslation, translationForm, form]);


useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const language = urlParams.get('language');
  
  if (language && translations.length > 0 && !isEditingTranslation) {
    const translation = translations.find(t => t.language === language);
    if (translation) {
      // Auto-enter edit mode
      handleEditTranslation(language);
      
      // Clean URL after a delay
      setTimeout(() => {
        const url = new URL(window.location.href);
        const params = new URLSearchParams(url.search);
        params.delete('translationId');
        params.delete('language');
        params.delete('step');
        window.history.replaceState({}, document.title, `${url.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      }, 1500);
    }
  }
}, [translations, isEditingTranslation]);




  // Update form values on change
  useEffect(() => {
    const updateFormValues = () => {
      const values = form.getFieldsValue(true);
      setFormValues(values);
    };

    updateFormValues();
    const timer = setInterval(updateFormValues, 500);
    
    return () => clearInterval(timer);
  }, [form]);

  const fetchCategories = async () => {
  try {
    const response = await getCategories();
    
    // Check if response is an object with data property
    let categoriesData = response;
    
    if (response && typeof response === 'object') {
      // If response has a 'data' property, use that
      if ('data' in response && Array.isArray(response.data)) {
        categoriesData = response.data;
      }
      // If response has a 'categories' property, use that
      else if ('categories' in response && Array.isArray(response.categories)) {
        categoriesData = response.categories;
      }
    }
    
    if (!Array.isArray(categoriesData)) {
      console.error('Categories is not an array:', categoriesData);
      message.error(t`Invalid categories data format`);
      setCategories([]);
      return;
    }
    
    setCategories(categoriesData || []);
    
    if (categoriesData.length === 0) {
      message.warning(t`No categories found. Please create categories first.`);
    }
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    message.error(t`Failed to load categories`);
    setCategories([]);
  }
};

const TagsInputField = ({ value = [], onChange, disabled }: { 
  value?: string[]; 
  onChange?: (value: string[]) => void;
  disabled?: boolean;
}) => {
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange?.([...value, trimmed]);
      setTagInput('');
    }
  };

  return (
    <div>
      {/* Display tags above input */}
      <div style={{ marginBottom: 8, minHeight: 32 }}>
        {value.map((tag: string) => (
          <Tag
            key={tag}
            closable={!disabled}
            onClose={() => {
              onChange?.(value.filter((t: string) => t !== tag));
            }}
            style={{ marginRight: 4, marginBottom: 4 }}
          >
            {tag}
          </Tag>
        ))}
      </div>
      
      {/* Simple input for adding new tags */}
      <Input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onPressEnter={(e) => {
          e.preventDefault();
          handleAddTag();
        }}
        onBlur={handleAddTag}
        placeholder={t`Type and press Enter`}
        disabled={disabled}
        suffix={
          <span style={{ 
            color: tagInput ? '#1890ff' : '#d9d9d9',
            fontSize: '12px',
            cursor: 'pointer'
          }} onClick={handleAddTag}>
            ↵
          </span>
        }
      />
    </div>
  );
};


  const fetchArticle = async () => {
    if (!id) return;
    
    try {
      const article = await getArticle(id);
      if (!article) return;
      
      const values = {
        title: article.title,
        excerpt: article.excerpt,
        content: article.content || '',
        categoryId: article.category?.id || article.categoryId,
        tags: article.tags || [],
        targetLanguages: article.targetLanguages || ['fr'],
        autoTranslate: article.autoTranslate !== false,
        
        isFeatured: article.isFeatured || false,
        isTrending: article.isTrending || false,
        isEditorPick: article.isEditorPick || false,
        isPopular: article.isPopular || false,
        featuredRanking: article.featuredRanking || 3,
        trendingScore: article.trendingScore || 50,
        contentType: article.contentType || 'STANDARD',
        readingLevel: article.readingLevel || 'INTERMEDIATE',
        timeToRead: article.timeToRead || 5,
        
        accessType: article.accessType || 'FREE',
        status: article.status || 'DRAFT',
        coinPrice: article.coinPrice || 10,
        coverImage: article.coverImage || '',
        metaTitle: article.metaTitle || '',
        metaDescription: article.metaDescription || '',
      };
      
      form.setFieldsValue(values);
      setFormValues(values);
      
      if (article.coverImage) {
        setCoverImageUrl(article.coverImage);
      }
      
      message.success(t`Article loaded successfully`);
      
    } catch (error: any) {
      console.error('Error fetching article:', error);
      message.error(t`Failed to load article: ${error.message}`);
    }
  };

   const getLanguageFlag = (language: string) => {
    const flags: Record<string, string> = {
      'en': '🇺🇸',
      'fr': '🇫🇷',
      'es': '🇪🇸',
      'de': '🇩🇪',
      'pt': '🇵🇹',
      'ar': '🇸🇦',
      'zh': '🇨🇳',
      'ja': '🇯🇵',
    };
    return flags[language] || '🌐';
  };

  const fetchTranslations = async () => {
  if (!id) {
    console.log('❌ No article ID for fetching translations');
    return;
  }
  
  console.log('🔍 Fetching translations. ID might be slug:', id);
  
  setTranslationLoading(true);
  try {
    // First, get the actual article to get its ID
    let articleId = id;
    
    // Check if id is a slug (contains hyphens) or ID (cuid format)
    if (id.includes('-') && !id.match(/^cm[a-z0-9]{23}$/)) {
      console.log('📌 ID appears to be a slug, fetching article to get ID...');
      const articleResponse = await fetch(`/api/articles/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (articleResponse.ok) {
        const articleData = await articleResponse.json();
        if (articleData.data?.id) {
          articleId = articleData.data.id;
          console.log('✅ Found article ID:', articleId);
        }
      }
    }
    
    console.log('📋 Final article ID for translations:', articleId);
    
    // Fetch available languages
    const langData = await getArticleAvailableLanguages(articleId);
    console.log('🌐 Available languages:', langData);
    setAvailableLanguages(langData.languages || []);
    
    // Fetch translations for this article USING THE ARTICLE ID
    const response = await fetch(`/api/articles/translations/article/${articleId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      console.error('❌ API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch translations: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('📦 Article translations loaded:', {
      success: data.success,
      count: data.count,
      data: data.data,
    });
    
    setTranslations(data.data || []);
    
  } catch (error: any) {
    console.error('❌ Error loading translations:', error);
    message.error(t`Failed to load translations: ${error.message}`);
  } finally {
    setTranslationLoading(false);
  }
};
  // Add this to fetch translations when article loads
  useEffect(() => {
    if (isEditMode && id && !initialLoading) {
      fetchTranslations();
    }
  }, [isEditMode, id, initialLoading]);

  // Function to handle translation editing
const handleEditTranslation = (language: string) => {
  console.log('🔍 Edit translation for language:', language);
  
  // Set the active tab to this language
  setActiveTranslationTab(language);
  
  const translation = translations.find(t => t.language === language);
  setEditingTranslation(translation || null);
  
  // Load translation data into form
  if (translation) {
    translationForm.setFieldsValue({
      title: translation.title || form.getFieldValue('title'),
      excerpt: translation.excerpt || form.getFieldValue('excerpt'),
      content: translation.content || form.getFieldValue('content'),
    });
  } else {
    // If no translation exists, start with original content
    translationForm.setFieldsValue({
      title: form.getFieldValue('title'),
      excerpt: form.getFieldValue('excerpt'),
      content: form.getFieldValue('content'),
    });
  }
  
  setIsEditingTranslation(true); // Use setIsEditingTranslation
  
  // Scroll to translation section if needed
  const translationSection = document.getElementById('translation-editor');
  if (translationSection) {
    translationSection.scrollIntoView({ behavior: 'smooth' });
  }
};
  // Update your handleSaveTranslation function
const handleSaveTranslation = async () => {
  try {
    const values = translationForm.getFieldsValue();
    
    console.log('💾 Saving translation values:', {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
    });
    
    if (editingTranslation) {
      // Use the content update endpoint
      const response = await fetch(`/api/articles/translations/${editingTranslation.id}/content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: values.title,
          excerpt: values.excerpt,
          content: values.content,
          plainText: extractPlainText(values.content), // Helper function to extract plain text
          needsReview: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update translation: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Translation saved:', result);
      
      message.success(t`Translation updated successfully`);
      
      // Refresh translations
      await fetchTranslations();
      
    } else {
      // Handle creating new translation
      message.info(t`Use "Generate with AI" to create a new translation`);
    }
    
    setIsEditingTranslation(false);
    
  } catch (error: any) {
    console.error('❌ Save translation error:', error);
    message.error(t`Failed to save translation: ${error.message}`);
  }
};

// Helper function to extract plain text from content
const extractPlainText = (content: any): string => {
  if (!content) return '';
  
  if (typeof content === 'string') {
    // Strip HTML tags
    return content.replace(/<[^>]*>/g, '').substring(0, 500);
  }
  
  if (typeof content === 'object') {
    // Try to extract from TipTap JSON
    if (content.content && Array.isArray(content.content)) {
      const text = content.content
        .filter((block: any) => block.type === 'paragraph')
        .flatMap((block: any) => 
          block.content?.map((text: any) => text.text).join('') || ''
        )
        .join(' ');
      return text.substring(0, 500);
    }
    
    // Fallback to stringify
    return JSON.stringify(content).substring(0, 500);
  }
  
  return String(content).substring(0, 500);
};

  // Function to generate translation with AI
  const handleGenerateTranslation = async (language: string) => {
    if (!id) return;
    
    try {
      await triggerArticleTranslation(id, language);
      message.success(t`AI translation started for ${language.toUpperCase()}`);
      fetchTranslations(); // Refresh after a delay
      setTimeout(() => fetchTranslations(), 3000);
    } catch (error: any) {
      message.error(t`Failed to generate translation: ${error.message}`);
    }
  };

  // Function to regenerate translation
  const handleRegenerateTranslation = async (translationId: string) => {
    try {
      await regenerateTranslation(translationId);
      message.success(t`Translation regeneration started`);
      setTimeout(() => fetchTranslations(), 3000);
    } catch (error: any) {
      message.error(t`Failed to regenerate translation: ${error.message}`);
    }
  };

  // Function to mark translation as reviewed
  const handleMarkReviewed = async (translationId: string) => {
    try {
      await updateTranslation(translationId, { needsReview: false });
      message.success(t`Translation marked as reviewed`);
      fetchTranslations();
    } catch (error: any) {
      message.error(t`Failed to update translation: ${error.message}`);
    }
  };

  const handleCoverImageUpload = async (file: RcFile) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await uploadImage(formData);
      
      if (result && result.url) {
        setCoverImageUrl(result.url);
        form.setFieldValue('coverImage', result.url);
        message.success(t`Cover image uploaded successfully`);
      } else {
        throw new Error('Invalid response from server');
      }
      
      return false;
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.message || t`Failed to upload cover image`);
      return false;
    }
  };

  const hasActualContent = useCallback((content: any): boolean => {
    if (!content) return false;
    
    try {
      if (typeof content === 'string') {
        const cleanContent = content
          .replace(/<[^>]*>/g, '')
          .replace(/<!--.*?-->/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const hasText = cleanContent.length > 0;
        const hasImages = content.includes('<img');
        const hasVideos = content.includes('<video') || content.includes('<iframe');
        const hasTables = content.includes('<table');
        const hasLists = content.includes('<ul>') || content.includes('<ol>');
        
        return hasText || hasImages || hasVideos || hasTables || hasLists;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking content:', error);
      return false;
    }
  }, []);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      const values = form.getFieldsValue(true);
      
      switch (currentStep) {
        case 0:
          if (!values.title?.trim()) {
            message.error(t`Please enter article title`);
            return false;
          }
          if (!values.excerpt?.trim()) {
            message.error(t`Please enter article excerpt`);
            return false;
          }
          if (!values.categoryId) {
            message.error(t`Please select a category`);
            return false;
          }
          return true;
          
        case 1:
          if (!hasActualContent(values.content)) {
            message.error(t`Please add some content to the article`);
            return false;
          }
          return true;
          
        case 2:
          return true;
          
        case 3:
          if (values.accessType === 'PREMIUM' && (!values.coinPrice || values.coinPrice < 1)) {
            message.error(t`Please enter a valid coin price`);
            return false;
          }
          if (values.status === 'SCHEDULED' && !values.scheduledFor) {
            message.error(t`Please select a schedule date`);
            return false;
          }
          return true;
      }
      
      return true;
    } catch (error) {
      console.error('Step validation error:', error);
      return false;
    }
  }, [currentStep, form, hasActualContent]);

 const handleSubmit = useCallback(async (desiredStatus: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'DRAFT') => {
  try {
    if (!formValues.title?.trim()) {
      setCurrentStep(0);
      message.error(t`Please enter article title`);
      return;
    }
    
    if (!formValues.excerpt?.trim()) {
      setCurrentStep(0);
      message.error(t`Please enter article excerpt`);
      return;
    }
    
    if (!formValues.categoryId) {
      setCurrentStep(0);
      message.error(t`Please select a category`);
      return;
    }
    
    if (!hasActualContent(formValues.content)) {
      setCurrentStep(1);
      message.error(t`Please add some content to the article`);
      return;
    }
    
    const contentForBackend = typeof formValues.content === 'string' 
      ? formValues.content 
      : String(formValues.content || '');
    
    const articleData = {
      title: formValues.title.trim(),
      excerpt: formValues.excerpt.trim(),
      content: contentForBackend,
      categoryId: formValues.categoryId,
      tags: formValues.tags || [],
      accessType: formValues.accessType || 'FREE',
      coinPrice: formValues.accessType === 'PREMIUM' ? formValues.coinPrice : 0,
      coverImage: formValues.coverImage || '',
      metaTitle: formValues.metaTitle?.trim(),
      metaDescription: formValues.metaDescription?.trim(),
      autoTranslate: formValues.autoTranslate ?? true,
      targetLanguages: formValues.autoTranslate ? (formValues.targetLanguages || ['fr']) : [],
      
      isFeatured: formValues.isFeatured || false,
      isTrending: formValues.isTrending || false,
      isEditorPick: formValues.isEditorPick || false,
      isPopular: formValues.isPopular || false,
      featuredRanking: formValues.featuredRanking || 3,
      trendingScore: formValues.trendingScore || 50,
      contentType: formValues.contentType || 'STANDARD',
      readingLevel: formValues.readingLevel || 'INTERMEDIATE',
      
      timeToRead: Number(formValues.timeToRead) || 5,
      
      // FIX: Explicitly set status from the function parameter
      status: desiredStatus, // Changed from 'status' to 'desiredStatus' for clarity
      publishedAt: desiredStatus === 'PUBLISHED' ? new Date() : undefined,
      scheduledFor: desiredStatus === 'SCHEDULED' ? formValues.scheduledFor : undefined,
    };
    
    console.log('DEBUG - Submitting article with:', {
      status: desiredStatus,
      title: articleData.title,
      scheduledFor: articleData.scheduledFor,
      publishedAt: articleData.publishedAt
    });
    
    setLoading(true);
    
    let savedArticle;
    
    if (isEditMode && id) {
      savedArticle = await updateArticle(id, articleData);
      message.success(t`Article updated successfully as ${desiredStatus.toLowerCase()}`);
    } else {
      savedArticle = await createArticle(articleData);
      message.success(t`Article created successfully as ${desiredStatus.toLowerCase()}`);
    }
    
    navigate('/dashboard/article-admin/articles');
    
  } catch (error: any) {
    console.error('Submit error:', error);
    
    let errorMessage = t`Failed to save article`;
    if (error.response?.data?.message) {
      errorMessage = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(', ')
        : error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    message.error(t`Error: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
}, [formValues, hasActualContent, isEditMode, id, navigate]);


  const handleSaveDraft = () => {
    console.log('DEBUG: Save Draft clicked - sending DRAFT status');
    handleSubmit('DRAFT');
  };

  const handlePublish = () => {
    console.log('DEBUG: Publish clicked - sending PUBLISHED status');
    handleSubmit('PUBLISHED');
  };

  const handleSchedule = () => {
    console.log('DEBUG: Schedule clicked - sending SCHEDULED status');
    handleSubmit('SCHEDULED');
  };
  const handleCancel = () => navigate('/dashboard/article-admin/articles');

  const steps = [
    {
      title: t`Basic Info`,
      content: (
        <>
        {isEditMode && translations.length > 0 && (
          <Alert
            message={t`Translations Available`}
            description={
              <Space wrap>
                {translations.map(t => (
                  <Tag key={t.language} color={t.status === 'COMPLETED' ? 'green' : 'blue'}>
                    {getLanguageFlag(t.language)} {t.language.toUpperCase()}
                    {t.needsReview && ' ⚠️'}
                  </Tag>
                ))}
              </Space>
            }
            type="info"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
          <Form.Item
            label={t`Title`}
            name="title"
            rules={[{ 
              required: true, 
              message: t`Please enter article title`,
              whitespace: true 
            }]}
          >
            <Input 
              placeholder={t`Enter a compelling title...`} 
              size="large" 
              style={{ fontSize: '16px' }}
              disabled={loading || initialLoading}
            />
          </Form.Item>

          <Form.Item
            label={t`Excerpt`}
            name="excerpt"
            rules={[{ 
              required: true, 
              message: t`Please enter article excerpt`,
              whitespace: true 
            }]}
            extra={t`A short summary that will appear in article listings`}
          >
            <TextArea 
              rows={3} 
              placeholder={t`Brief summary of your article...`}
              showCount 
              maxLength={800}
              minLength={100}
              disabled={loading || initialLoading}
            />
          </Form.Item>

          <Form.Item
            label={t`Category`}
            name="categoryId"
            rules={[{ required: true, message: t`Please select a category` }]}
          >
            <Select
              placeholder={categories.length === 0 ? t`No categories available` : t`Select category`}
              size="large"
              showSearch
              optionFilterProp="children"
              loading={initialLoading}
              disabled={initialLoading || categories.length === 0}
              notFoundContent={categories.length === 0 ? t`No categories found` : undefined}
            >
              {categories.map((category: Category) => (
                <Option key={category.id} value={category.id}>
                  <Space>
                    {category.color && (
                      <span style={{ 
                        color: category.color,
                        fontSize: '14px'
                      }}>●</span>
                    )}
                    {category.name}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          {categories.length === 0 && (
            <Alert
              type="warning"
              message={t`No categories available`}
              description={t`Please create categories first in the Categories Management section.`}
              style={{ marginBottom: 16 }}
              action={
                <Button 
                  size="small" 
                  onClick={() => navigate('/dashboard/article-admin/categories')}
                >
                  {t`Go to Categories`}
                </Button>
              }
            />
          )}

         <Form.Item
  label={t`Tags`}
  name="tags"
  extra={t`Press Enter to add tags`}
>
  <TagsInputField disabled={initialLoading} />
</Form.Item>
        </>
      ),
    },
    {
      title: t`Content`,
      content: (
        <Form.Item
          name="content"
          rules={[{ 
            required: true, 
            message: t`Please add some content to your article`,
            validator: (_, value) => {
              if (!hasActualContent(value)) {
                return Promise.reject(new Error(t`Please add some content to your article`));
              }
              return Promise.resolve();
            }
          }]}
        >
          <SafeJoditWrapper
            value={formValues.content}
            onChange={(content: string) => {
              form.setFieldValue('content', content);
              setFormValues(prev => ({ ...prev, content }));
            }}
            disabled={loading || initialLoading}
            height={500}
            placeholder={t`Start writing your amazing article...`}
          />
        </Form.Item>
      ),
    },
    {
      title: t`Media & SEO`,
      content: (
        <>
          <Form.Item label={t`Cover Image`}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleCoverImageUpload}
                maxCount={1}
                disabled={loading || initialLoading}
              >
                <Button 
                  icon={<UploadOutlined />} 
                  disabled={loading || initialLoading}
                >
                  {t`Upload Cover Image`}
                </Button>
              </Upload>
              {coverImageUrl && (
                <div style={{ marginTop: 16 }}>
                  <img
                    src={coverImageUrl}
                    alt="Cover"
                    style={{
                      width: '100%',
                      maxWidth: '400px',
                      height: 'auto',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '1px solid #f0f0f0',
                    }}
                  />
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => {
                      setCoverImageUrl('');
                      form.setFieldValue('coverImage', '');
                      setFormValues(prev => ({ ...prev, coverImage: '' }));
                    }}
                    style={{ marginTop: 8 }}
                  >
                    {t`Remove Image`}
                  </Button>
                </div>
              )}
              <Form.Item name="coverImage" noStyle>
                <Input type="hidden" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label={t`Meta Title`}
            name="metaTitle"
            extra={
              <div className="text-gray-500">
                {t`For SEO. If empty, article title will be used.`}
                <span className="text-xs italic ml-2">
                "(recomended)"
                </span>
                <span className="text-red-500/80 text-xs italic ml-2">
                  ({t`Optional if title is SEO-friendly`})
                </span>
              </div>
            }
          >
            <Input 
              placeholder={t`SEO title (60-70 characters)`} 
              disabled={loading || initialLoading}
            />
          </Form.Item>

          <Form.Item
            label={t`Meta Description`}
            name="metaDescription"
            extra={
              <div className="text-gray-500">
                {t`For SEO. If empty, excerpt will be used.`}
                <span className="text-xs italic ml-2">
                "(recomended)"
                </span>
                <span className="text-red-500/80 text-xs italic ml-2">
                  ({t`Optional if excerpt is best descriptive`})
                </span>
                
              </div>
            }
          >
            <TextArea
              rows={3}
              placeholder={t`SEO description (150-160 characters)`}
              showCount
              maxLength={160}
              disabled={loading || initialLoading}
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: t`Settings`,
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t`Access Type`}
                name="accessType"
              >
                <Select 
                  disabled={loading || initialLoading}
                >
                  <Option value="FREE">
                    <Space>
                      <EyeOutlined />
                      <span>{t`Free Access`}</span>
                    </Space>
                  </Option>
                  <Option value="PREMIUM">
                    <Space>
                      <DollarOutlined />
                      <span>{t`Premium (Requires Coins)`}</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              {formValues.accessType === 'PREMIUM' && (
                <Form.Item
                  label={t`Coin Price`}
                  name="coinPrice"
                  rules={[{ 
                    required: true, 
                    message: t`Please enter coin price`,
                    type: 'number',
                    min: 1,
                    max: 1000
                  }]}
                >
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    placeholder={t`Coins required`}
                    addonAfter={t`coins`}
                    disabled={loading || initialLoading}
                  />
                </Form.Item>
              )}
            </Col>
          </Row>

          <Form.Item
            label={t`Auto-Translate`}
            name="autoTranslate"
            valuePropName="checked"
          >
            <Switch 
              disabled={loading || initialLoading}
            />
          </Form.Item>

          {formValues.autoTranslate && (
            <Form.Item
              label={t`Target Languages`}
              name="targetLanguages"
            >
              <Select 
                mode="multiple" 
                placeholder={t`Select languages`}
                disabled={loading || initialLoading}
              >
                <Option value="fr">🇫🇷 {t`French`}</Option>
                <Option value="es">🇪🇸 {t`Spanish`}</Option>
                <Option value="de">🇩🇪 {t`German`}</Option>
                <Option value="pt">🇵🇹 {t`Portuguese`}</Option>
                <Option value="ar">🇸🇦 {t`Arabic`}</Option>
              </Select>
            </Form.Item>
          )}

          <Divider orientation="left" style={{ marginTop: 24 }}>
            <Space>
              <FireOutlined />
              <span>{t`Content Flags & Classification`}</span>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t`Content Type`}
                name="contentType"
              >
                <Select 
                  placeholder={t`Select content type`}
                  disabled={loading || initialLoading}
                >
                  {CONTENT_TYPES.map((type) => (
                    <Option key={type.value} value={type.value}>
                      <Space>
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                        <Tooltip title={type.description}>
                          <span style={{ color: '#999', fontSize: '12px' }}>ℹ️</span>
                        </Tooltip>
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={t`Reading Level`}
                name="readingLevel"
              >
                <Select 
                  placeholder={t`Select reading level`}
                  disabled={loading || initialLoading}
                >
                  {READING_LEVELS.map((level) => (
                    <Option key={level.value} value={level.value}>
                      <Badge color={level.color} text={level.label} />
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label={t`Estimated Reading Time`}
                name="timeToRead"
              >
                <Input
                  type="number"
                  min={1}
                  max={120}
                  placeholder={t`Minutes`}
                  addonAfter={t`minutes`}
                  disabled={loading || initialLoading}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ marginTop: 16 }}>
            <Space>
              <StarOutlined />
              <span>{t`Featured & Trending Settings`}</span>
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Card size="small" style={{ background: '#fafafa' }}>
                <Form.Item
                  label={
                    <Space>
                      <StarOutlined style={{ color: '#faad14' }} />
                      <span>{t`Featured Status`}</span>
                    </Space>
                  }
                  name="isFeatured"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren={t`Featured`} 
                    unCheckedChildren={t`Not Featured`}
                    disabled={loading || initialLoading}
                  />
                </Form.Item>
                
                {formValues.isFeatured && (
                  <Form.Item
                    label={t`Featured Ranking`}
                    name="featuredRanking"
                    extra={t`How prominently should this be featured?`}
                  >
                    <Rate 
                      count={5}
                      disabled={loading || initialLoading}
                    />
                  </Form.Item>
                )}
              </Card>
            </Col>
            
            <Col span={12}>
              <Card size="small" style={{ background: '#fafafa' }}>
                <Form.Item
                  label={
                    <Space>
                      <FireOutlined style={{ color: '#ff4d4f' }} />
                      <span>{t`Trending Status`}</span>
                    </Space>
                  }
                  name="isTrending"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren={t`Trending`} 
                    unCheckedChildren={t`Not Trending`}
                    disabled={loading || initialLoading}
                  />
                </Form.Item>
                
                {formValues.isTrending && (
                  <Form.Item
                    label={t`Trending Score`}
                    name="trendingScore"
                    extra={t`Higher score = more prominent in trending`}
                  >
                    <Input
                      type="range"
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      disabled={loading || initialLoading}
                    />
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <Tag color="red">{formValues.trendingScore || 50}/100</Tag>
                    </div>
                  </Form.Item>
                )}
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <span>{t`Editor's Pick`}</span>
                  </Space>
                }
                name="isEditorPick"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren={t`Editor's Choice`} 
                  unCheckedChildren={t`Standard`}
                  disabled={loading || initialLoading}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={
                  <Space>
                    <WarningOutlined style={{ color: '#722ed1' }} />
                    <span>{t`Mark as Popular`}</span>
                  </Space>
                }
                name="isPopular"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren={t`Popular`} 
                  unCheckedChildren={t`Standard`}
                  disabled={loading || initialLoading}
                />
              </Form.Item>
            </Col>
          </Row>

          <Tabs
            defaultActiveKey="publish"
            items={[
              {
                key: 'publish',
                label: t`Publish Now`,
                children: (
                  <Alert
                    message={t`Article will be published immediately`}
                    type="info"
                    showIcon
                  />
                ),
                disabled: loading || initialLoading,
              },
              {
                key: 'schedule',
                label: t`Schedule`,
                children: (
                  <Form.Item
                    label={t`Schedule Date & Time`}
                    name="scheduledFor"
                  >
                    <DatePicker
                      showTime
                      format="YYYY-MM-DD HH:mm"
                      style={{ width: '100%' }}
                      disabledDate={(current) => 
                        current && current.isBefore(dayjs().startOf('day'))
                      }
                      disabled={loading || initialLoading}
                    />
                  </Form.Item>
                ),
                disabled: loading || initialLoading,
              },
            ]}
          />
        </>
      ),
    },

    
     // new step for translations
      {
      title: t`Translations`,
      content: (
        <TranslationTab 
          isEditMode={isEditMode}
          articleId={id}
          translations={translations}
          availableLanguages={availableLanguages}
          loading={translationLoading}
          activeTab={activeTranslationTab}
          onTabChange={setActiveTranslationTab}
          onEditTranslation={handleEditTranslation} // This is the correct prop name
          onGenerateTranslation={handleGenerateTranslation}
          onRegenerateTranslation={handleRegenerateTranslation}
          onMarkReviewed={handleMarkReviewed}
          formValues={formValues}
          isEditingTranslation={isEditingTranslation}
          editingLanguage={activeTranslationTab}
          translationForm={translationForm}
          onSaveTranslation={handleSaveTranslation}
          onCancelTranslation={() => setIsEditingTranslation(false)} // Use setIsEditingTranslation
          getLanguageFlag={getLanguageFlag}
          onRefreshTranslations={fetchTranslations}
        />
      ),
    }
    ];



  if (initialLoading) {
    return (
      <div>
        <ArticleAdminNavbar 
          currentPath={window.location.pathname}
          title={t`Article Management`}
        />
        <Card
          styles={{
            body: {
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: 400
            }
          }}
        >
          <Spin size="large" />
          <div style={{ marginLeft: 16 }}>
            {isEditMode ? t`Loading article...` : t`Initializing form...`}
          </div>
        </Card>
      </div>
    );
  }


  return (
    <div>
      <ArticleAdminNavbar 
        currentPath={window.location.pathname}
        title={t`Article Management`}
      />
      
      <Breadcrumb 
        style={{ marginBottom: 16 }}
        items={[
          { 
            title: t`Dashboard`, 
            onClick: () => navigate('/dashboard') 
          },
          { 
            title: t`Article Admin`, 
            onClick: () => navigate('/dashboard/article-admin') 
          },
          { 
            title: t`Articles`, 
            onClick: () => navigate('/dashboard/article-admin/articles') 
          },
          { 
            title: isEditMode ? t`Edit Article` : t`Create New Article` 
          },
        ]}
      />

      <Card
        styles={{
          body: { padding: 24 }
        }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 24 
        }}>
          <Title level={2} style={{ margin: 0 }}>
            {isEditMode ? t`Edit Article` : t`Create New Article`}
          </Title>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            disabled={loading}
          >
            {t`Back to Articles`}
          </Button>
        </div>

        <Steps 
          current={currentStep} 
          style={{ marginBottom: 32 }}
          onChange={async (step) => {
            if (loading || initialLoading) return;
            
            if (step > currentStep) {
              const isValid = await validateCurrentStep();
              if (isValid) {
                setCurrentStep(step);
              }
            } else {
              setCurrentStep(step);
            }
          }}
        >
          {steps.map((item, index) => (
            <Step 
              key={item.title} 
              title={item.title} 
              disabled={loading || initialLoading}
            />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: '',
            excerpt: '',
            content: '',
            categoryId: undefined,
            tags: [],
            accessType: 'FREE',
            coinPrice: 10,
            coverImage: '',
            metaTitle: '',
            metaDescription: '',
            autoTranslate: true,
            targetLanguages: ['fr'],
            isFeatured: false,
            isTrending: false,
            isEditorPick: false,
            isPopular: false,
            featuredRanking: 3,
            trendingScore: 50,
            contentType: 'STANDARD',
            readingLevel: 'INTERMEDIATE',
            timeToRead: 5,
            status: 'DRAFT',
            publishedAt: undefined,
            scheduledFor: undefined,
          }}
        >
          <div style={{ minHeight: '400px' }}>
            {steps[currentStep].content}
          </div>

          <Divider />

 <div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  flexWrap: 'wrap', 
  gap: '16px' 
}}>
  {/* Left side: Cancel, Previous & Next */}
  <Space>
    <Button 
      onClick={handleCancel}
      disabled={loading}
    >
      {t`Cancel`}
    </Button>
    {currentStep > 0 && (
  <Button 
    onClick={() => setCurrentStep(currentStep - 1)}
    disabled={loading || initialLoading}
    icon={<LeftOutlined />}
  >
    {t`Previous`}
  </Button>
)}
{currentStep < steps.length - 1 && (
  <Button 
    type="primary" 
    onClick={async () => {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep(currentStep + 1);
      }
    }}
    disabled={loading || initialLoading}
    icon={<RightOutlined />}
  >
    {t`Next`}
  </Button>
)}
  </Space>

  {/* Right side: Save Draft, Publish & Schedule */}
  <Space>
    {/* Save Draft button */}
    <Button
      onClick={handleSaveDraft}
      loading={loading}
      icon={<SaveOutlined />}
      disabled={initialLoading}
    >
      {t`Save Draft`}
    </Button>
    
    {/* Publish button (only for SUPER_ADMIN) */}
    {isSuperAdmin && (
      <Button
        type="primary"
        onClick={handlePublish}
        loading={loading}
        icon={<SendOutlined />}
        disabled={initialLoading}
      >
        {t`Publish Now`}
      </Button>
    )}
    
    {/* Schedule button */}
    <Button
      type="dashed"
      onClick={handleSchedule}
      loading={loading}
      icon={<ClockCircleOutlined />}
      disabled={initialLoading}
    >
      {t`Schedule`}
    </Button>
  </Space>
</div>

          {/* <Form.Item name="status" noStyle /> */}
          <Form.Item name="publishedAt" noStyle />
        </Form>
      </Card>
    </div>
  );
};

export default ArticleForm;