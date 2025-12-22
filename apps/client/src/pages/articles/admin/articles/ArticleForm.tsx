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
  Rate,
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
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import RichTextEditor, { tiptapToHTML, htmlToTiptap } from '../../../../components/article-tiptap-editor/RichTextEditor';
import ArticleAdminNavbar from '../ArticleAdminSidebar';
import EditorSwitcher from '../../../../components/article-tiptap-editor/EditorSwitcher';

import SafeJoditWrapper from '../../../../components/article-editor/SafeJoditWrapper';
import { 
  createArticle, 
  updateArticle, 
  getArticle, 
  getCategories,
  uploadImage
} from '../../../../services/article.service';
import { RcFile } from 'antd/es/upload';
import { languages } from 'unique-names-generator';


const CONTENT_TYPES = [
  { value: 'STANDARD', label: 'Standard Article', icon: '📝', description: 'Regular informative article' },
  { value: 'GUIDE', label: 'Comprehensive Guide', icon: '📚', description: 'In-depth guide or manual' },
  { value: 'TUTORIAL', label: 'Step-by-Step Tutorial', icon: '🔧', description: 'Practical how-to guide' },
  { value: 'CASE_STUDY', label: 'Case Study', icon: '📊', description: 'Real-world analysis' },
  { value: 'RESEARCH', label: 'Research Paper', icon: '🔬', description: 'Data-driven research' },
  { value: 'INTERVIEW', label: 'Expert Interview', icon: '🎤', description: 'Q&A with professionals' },
];

const READING_LEVELS = [
  { value: 'BEGINNER', label: 'Beginner', color: 'green', description: 'Introductory, easy to understand' },
  { value: 'INTERMEDIATE', label: 'Intermediate', color: 'blue', description: 'Some prior knowledge helpful' },
  { value: 'ADVANCED', label: 'Advanced', color: 'purple', description: 'Deep technical knowledge required' },
  { value: 'EXPERT', label: 'Expert', color: 'red', description: 'Specialized, professional-level' },
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

   // Content Flags (ADD THESE)
  isFeatured: boolean;
  isTrending: boolean;
  isEditorPick: boolean;
  isPopular: boolean;
  featuredRanking: number; // 1-5 star rating
  trendingScore: number; // 1-100
  
  contentType: 'STANDARD' | 'GUIDE' | 'TUTORIAL' | 'CASE_STUDY' | 'RESEARCH' | 'INTERVIEW';
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  timeToRead: number; // minutes
}

// Navigation helper functions
const navigateTo = (path: string) => {
  window.location.href = path;
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
      return match[1]; // Return either ID or slug
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [formValues, setFormValues] = useState<Partial<ArticleFormData>>({});
  
  const id = getArticleIdFromUrl();
  const isEditMode = !!id;


  useEffect(() => {
  console.log('DEBUG - formValues.content:', formValues.content);
  console.log('DEBUG - Type of content:', typeof formValues.content);
  
  if (formValues.content && typeof formValues.content === 'object') {
    console.log('DEBUG - Object keys:', Object.keys(formValues.content));
    console.log('DEBUG - First level structure:', {
      type: formValues.content.type,
      hasContent: Array.isArray(formValues.content.content),
      contentLength: formValues.content.content?.length
    });
  }
}, [formValues.content]);


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
        message.error('Failed to initialize form');
      } finally {
        setInitialLoading(false);
      }
    };
    
    initialize();
  }, [id]);

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
      const categoriesData = await getCategories();
      
      if (!Array.isArray(categoriesData)) {
        console.error('Categories is not an array:', categoriesData);
        message.error('Invalid categories data format');
        setCategories([]);
        return;
      }
      
      setCategories(categoriesData || []);
      
      if (categoriesData.length === 0) {
        message.warning('No categories found. Please create categories first.');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
      setCategories([]);
    }
  };

  // const fetchArticle = async () => {
  //   if (!id) {
  //     console.error('❌ No ID provided for editing');
  //     message.error('No article ID provided');
  //     return;
  //   }
    
  //   try {
  //     console.log('📡 Fetching article with identifier:', id);
      
  //     const article = await Promise.race([
  //       getArticle(id),
  //       new Promise((_, reject) => 
  //         setTimeout(() => reject(new Error('Request timeout')), 10000)
  //       )
  //     ]);
      
  //     if (!article) {
  //       console.error('❌ Article not found for identifier:', id);
  //       message.error(`Article not found: ${id}`);
  //       return;
  //     }
      
  //     const values = {
  //       title: article.title,
  //       excerpt: article.excerpt,
  //       content: article.content || { type: 'doc', content: [] },
  //       categoryId: article.category?.id || article.categoryId,
  //       tags: article.tags || [],
  //       targetLanguages: article.targetLanguages || ['fr'],
  //       autoTranslate: article.autoTranslate !== false,
  //       isFeatured: article.isFeatured || false,
  //       accessType: article.accessType || 'FREE',
  //       status: article.status || 'DRAFT',
  //       coinPrice: article.coinPrice || 10,
  //       coverImage: article.coverImage || '',
  //       metaTitle: article.metaTitle || '',
  //       metaDescription: article.metaDescription || '',
  //     };
      
  //     form.setFieldsValue(values);
  //     setFormValues(values);
      
  //     if (article.coverImage) {
  //       setCoverImageUrl(article.coverImage);
  //     }
      
  //     if (article.status === 'SCHEDULED' && article.scheduledFor) {
  //       form.setFieldValue('scheduledFor', new Date(article.scheduledFor));
  //     }
      
  //     message.success('Article loaded successfully');
      
  //   } catch (error: any) {
  //     console.error('❌ Error fetching article:', error);
  //     const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
  //     message.error(`Failed to load article: ${errorMsg}`);
      
  //     if (error.response?.status === 404) {
  //       setTimeout(() => {
  //         navigateTo('/dashboard/article-admin/articles');
  //       }, 3000);
  //     }
  //   }
  // };


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
      
      // ADD THESE (with fallbacks)
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
    
    message.success('Article loaded successfully');
    
  } catch (error: any) {
    console.error('Error fetching article:', error);
    message.error(`Failed to load article: ${error.message}`);
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
        message.success('Cover image uploaded successfully');
      } else {
        throw new Error('Invalid response from server');
      }
      
      return false;
    } catch (error: any) {
      console.error('Upload error:', error);
      message.error(error.message || 'Failed to upload cover image');
      return false;
    }
  };

  // Enhanced content validation
//   const hasActualContent = useCallback((content: any): boolean => {
//   if (!content) return false;
  
//   try {
//     // If content is a string (HTML), check if it has text or structure
//     if (typeof content === 'string') {
//       // Remove HTML tags and check for actual text
//       const textOnly = content.replace(/<[^>]*>/g, '').trim();
//       return textOnly.length > 0;
//     }
    
//     // If content is Tiptap JSON
//     if (typeof content === 'object') {
//       if (content.type === 'doc' && Array.isArray(content.content)) {
//         // Enhanced check for all content types
//         const checkForContent = (nodes: any[]): boolean => {
//           for (const node of nodes) {
//             // Check for text
//             if (node.type === 'text' && node.text && node.text.trim().length > 0) {
//               return true;
//             }
            
//             // Check for visual elements that count as content
//             if (node.type === 'enhancedHTMLBlock' || 
//                 node.type === 'customHTMLBlock' ||
//                 node.type === 'image' ||
//                 node.type === 'paragraph' ||
//                 node.type === 'heading' ||
//                 node.type === 'bulletList' ||
//                 node.type === 'orderedList' ||
//                 node.type === 'blockquote' ||
//                 node.type === 'codeBlock' ||
//                 node.type === 'horizontalRule') {
//               return true;
//             }
            
//             // Check nested content
//             if (node.content && Array.isArray(node.content)) {
//               if (checkForContent(node.content)) {
//                 return true;
//               }
//             }
//           }
//           return false;
//         };
        
//         return checkForContent(content.content);
//       }
      
//       // Check for text property
//       if (content.text && content.text.trim().length > 0) return true;
//     }
    
//     return false;
//   } catch (error) {
//     console.error('Error checking content:', error);
//     return false;
//   }
// }, []);


const hasActualContent = useCallback((content: any): boolean => {
  if (!content) return false;
  
  try {
    // Handle HTML string from Jodit
    if (typeof content === 'string') {
      // Remove HTML tags, comments, and whitespace
      const cleanContent = content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/<!--.*?-->/g, '') // Remove HTML comments
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Check for actual text content
      const hasText = cleanContent.length > 0;
      
      // Check for media elements
      const hasImages = content.includes('<img');
      const hasVideos = content.includes('<video') || content.includes('<iframe');
      const hasTables = content.includes('<table');
      const hasLists = content.includes('<ul>') || content.includes('<ol>');
      
      return hasText || hasImages || hasVideos || hasTables || hasLists;
    }
    
    // Handle Tiptap JSON (backward compatibility)
    if (typeof content === 'object' && content.type === 'doc') {
      const checkNodes = (nodes: any[]): boolean => {
        return nodes.some((node: any) => {
          // Text node with content
          if (node.type === 'text' && node.text?.trim().length > 0) return true;
          
          // Visual elements
          if (['image', 'paragraph', 'heading', 'bulletList', 'orderedList', 
               'blockquote', 'codeBlock', 'horizontalRule', 'enhancedHTMLBlock'].includes(node.type)) {
            return true;
          }
          
          // Check nested content
          if (node.content && Array.isArray(node.content)) {
            return checkNodes(node.content);
          }
          
          return false;
        });
      };
      
      return checkNodes(content.content || []);
    }
    
    return false;
  } catch (error) {
    console.error('Error checking content:', error);
    return false;
  }
}, []);

  // Validate current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    try {
      const values = form.getFieldsValue(true);
      
      switch (currentStep) {
        case 0: // Basic Info
          if (!values.title?.trim()) {
            message.error('Please enter article title');
            return false;
          }
          if (!values.excerpt?.trim()) {
            message.error('Please enter article excerpt');
            return false;
          }
          if (!values.categoryId) {
            message.error('Please select a category');
            return false;
          }
          return true;
          
        case 1: // Content
          if (!hasActualContent(values.content)) {
            message.error('Please add some content to the article');
            return false;
          }
          return true;
          
        case 2: // Media & SEO
          return true;
          
        case 3: // Settings
          if (values.accessType === 'PREMIUM' && (!values.coinPrice || values.coinPrice < 1)) {
            message.error('Please enter a valid coin price');
            return false;
          }
          if (values.status === 'SCHEDULED' && !values.scheduledFor) {
            message.error('Please select a schedule date');
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

  // Main submit function
//   const handleSubmit = useCallback(async (status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'DRAFT') => {
//   try {
//     console.log('Current form values before submit:', formValues);
    
//     // Validate required fields
//     if (!formValues.title?.trim()) {
//       setCurrentStep(0);
//       message.error('Please enter article title');
//       return;
//     }
    
//     if (!formValues.excerpt?.trim()) {
//       setCurrentStep(0);
//       message.error('Please enter article excerpt');
//       return;
//     }
    
//     if (!formValues.categoryId) {
//       setCurrentStep(0);
//       message.error('Please select a category');
//       return;
//     }
    
//     if (!hasActualContent(formValues.content)) {
//       setCurrentStep(1);
//       message.error('Please add some content to the article');
//       return;
//     }
    
//     // Determine if we should trigger translations
//     const shouldTriggerTranslations = 
//       formValues.autoTranslate && 
//       formValues.targetLanguages && 
//       formValues.targetLanguages.length > 0 &&
//       status === 'PUBLISHED'; // Only trigger for published articles
    
//     // Prepare data with valid Tiptap structure
//     const articleData = {
//       title: formValues.title.trim(),
//       excerpt: formValues.excerpt.trim(),
//       content: formValues.content || { type: 'doc', content: [] },
//       categoryId: formValues.categoryId,
//       tags: formValues.tags || [],
//       accessType: formValues.accessType || 'FREE',
//       coinPrice: formValues.accessType === 'PREMIUM' ? formValues.coinPrice : 0,
//       coverImage: formValues.coverImage || '',
//       metaTitle: formValues.metaTitle?.trim(),
//       metaDescription: formValues.metaDescription?.trim(),
//       autoTranslate: formValues.autoTranslate ?? true,
//       targetLanguages: formValues.autoTranslate ? (formValues.targetLanguages || ['fr']) : [],
//       isFeatured: formValues.isFeatured || false,
//       status,
//       publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
//       scheduledFor: status === 'SCHEDULED' ? formValues.scheduledFor : undefined,
//     };
    
//     console.log('Submitting article data:', articleData);
    
//     setLoading(true);
    
//     let savedArticle;
    
//     if (isEditMode && id) {
//       savedArticle = await updateArticle(id, articleData);
//       message.success('Article updated successfully');
//     } else {
//       savedArticle = await createArticle(articleData);
//       message.success('Article created successfully');
//     }
    
    
    
//     navigateTo('/dashboard/article-admin/articles');
//   } catch (error: any) {
//     console.error('Submit error:', error);
    
//     let errorMessage = 'Failed to save article';
//     if (error.response?.data?.message) {
//       errorMessage = Array.isArray(error.response.data.message)
//         ? error.response.data.message.join(', ')
//         : error.response.data.message;
//     } else if (error.message) {
//       errorMessage = error.message;
//     }
    
//     message.error(`Error: ${errorMessage}`);
//   } finally {
//     setLoading(false);
//   }
// }, [formValues, hasActualContent, isEditMode, id]);



// Main submit function
const handleSubmit = useCallback(async (status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' = 'DRAFT') => {
  try {
    console.log('Current form values before submit:', formValues);
    
    // Validate required fields
    if (!formValues.title?.trim()) {
      setCurrentStep(0);
      message.error('Please enter article title');
      return;
    }
    
    if (!formValues.excerpt?.trim()) {
      setCurrentStep(0);
      message.error('Please enter article excerpt');
      return;
    }
    
    if (!formValues.categoryId) {
      setCurrentStep(0);
      message.error('Please select a category');
      return;
    }
    
    if (!hasActualContent(formValues.content)) {
      setCurrentStep(1);
      message.error('Please add some content to the article');
      return;
    }
    
    // Determine if we should trigger translations
    const shouldTriggerTranslations = 
      formValues.autoTranslate && 
      formValues.targetLanguages && 
      formValues.targetLanguages.length > 0 &&
      status === 'PUBLISHED'; // Only trigger for published articles
    
    // CRITICAL FIX: Ensure content is string for backend
    // Jodit already gives us HTML string, but let's be safe
    const contentForBackend = typeof formValues.content === 'string' 
      ? formValues.content 
      : String(formValues.content || '');
    
    // Prepare data with HTML string (not Tiptap JSON)
     const articleData = {
      title: formValues.title.trim(),
      excerpt: formValues.excerpt.trim(),
      content: formValues.content || '',
      categoryId: formValues.categoryId,
      tags: formValues.tags || [],
      accessType: formValues.accessType || 'FREE',
      coinPrice: formValues.accessType === 'PREMIUM' ? formValues.coinPrice : 0,
      coverImage: formValues.coverImage || '',
      metaTitle: formValues.metaTitle?.trim(),
      metaDescription: formValues.metaDescription?.trim(),
      autoTranslate: formValues.autoTranslate ?? true,
      targetLanguages: formValues.autoTranslate ? (formValues.targetLanguages || ['fr']) : [],
      
      // ADD THESE FIELDS
      isFeatured: formValues.isFeatured || false,
      isTrending: formValues.isTrending || false,
      isEditorPick: formValues.isEditorPick || false,
      isPopular: formValues.isPopular || false,
      featuredRanking: formValues.featuredRanking || 3,
      trendingScore: formValues.trendingScore || 50,
      contentType: formValues.contentType || 'STANDARD',
      readingLevel: formValues.readingLevel || 'INTERMEDIATE',
      timeToRead: formValues.timeToRead || 5,
      
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      scheduledFor: status === 'SCHEDULED' ? formValues.scheduledFor : undefined,
    };
    
    
    console.log('Submitting article data:', articleData);
    
    setLoading(true);
    
    let savedArticle;
    
    if (isEditMode && id) {
      savedArticle = await updateArticle(id, articleData);
      message.success('Article updated successfully');
    } else {
      savedArticle = await createArticle(articleData);
      message.success('Article created successfully');
    }
    
    navigateTo('/dashboard/article-admin/articles');
  } catch (error: any) {
    console.error('Submit error:', error);
    
    let errorMessage = 'Failed to save article';
    if (error.response?.data?.message) {
      errorMessage = Array.isArray(error.response.data.message)
        ? error.response.data.message.join(', ')
        : error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    message.error(`Error: ${errorMessage}`);
  } finally {
    setLoading(false);
  }
}, [formValues, hasActualContent, isEditMode, id]);

// trigger translations
const triggerArticleTranslations = async (articleId: string, targetLanguages: string[]) => {
  try {
    // Call the backend translation endpoint directly
    const response = await fetch(`/api/articles/${articleId}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        languages: targetLanguages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation request failed: ${response.status}`);
    }

    const result = await response.json();
    console.log('Translation trigger result:', result);
    
    return result;
  } catch (error) {
    console.error('Error triggering translations:', error);
    throw error;
  }
};


  const handleSaveDraft = () => handleSubmit('DRAFT');
  const handlePublish = () => handleSubmit('PUBLISHED');
  const handleSchedule = () => handleSubmit('SCHEDULED');
  const handleCancel = () => navigateTo('/dashboard/article-admin/articles');

  const steps = [
    {
      title: 'Basic Info',
      content: (
        <>
          <Form.Item
            label="Title"
            name="title"
            rules={[{ 
              required: true, 
              message: 'Please enter article title',
              whitespace: true 
            }]}
          >
            <Input 
              placeholder="Enter a compelling title..." 
              size="large" 
              style={{ fontSize: '16px' }}
              disabled={loading || initialLoading}
              value={formValues.title}
              onChange={(e) => {
                form.setFieldValue('title', e.target.value);
                setFormValues(prev => ({ ...prev, title: e.target.value }));
              }}
            />
          </Form.Item>

          <Form.Item
            label="Excerpt"
            name="excerpt"
            rules={[{ 
              required: true, 
              message: 'Please enter article excerpt',
              whitespace: true 
            }]}
            extra="A short summary that will appear in article listings"
          >
            <TextArea 
              rows={3} 
              placeholder="Brief summary of your article..."
              showCount 
              maxLength={800}
              minLength={100}
              disabled={loading || initialLoading}
              value={formValues.excerpt}
              onChange={(e) => {
                form.setFieldValue('excerpt', e.target.value);
                setFormValues(prev => ({ ...prev, excerpt: e.target.value }));
              }}
            />
          </Form.Item>

          <Form.Item
            label="Category"
            name="categoryId"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select
              placeholder={categories.length === 0 ? "No categories available" : "Select category"}
              size="large"
              showSearch
              optionFilterProp="children"
              loading={initialLoading}
              disabled={initialLoading || categories.length === 0}
              notFoundContent={categories.length === 0 ? "No categories found" : undefined}
              value={formValues.categoryId}
              onChange={(value) => {
                form.setFieldValue('categoryId', value);
                setFormValues(prev => ({ ...prev, categoryId: value }));
              }}
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
              message="No categories available"
              description="Please create categories first in the Categories Management section."
              style={{ marginBottom: 16 }}
              action={
                <Button 
                  size="small" 
                  onClick={() => navigateTo('/dashboard/article-admin/categories')}
                >
                  Go to Categories
                </Button>
              }
            />
          )}

          <Form.Item
            label="Tags"
            name="tags"
            extra="Press Enter to add tags"
          >
            <Select
              mode="tags"
              placeholder="Add relevant tags"
              style={{ width: '100%' }}
              disabled={initialLoading}
              value={formValues.tags}
              onChange={(value) => {
                form.setFieldValue('tags', value);
                setFormValues(prev => ({ ...prev, tags: value }));
              }}
            />
          </Form.Item>
        </>
      ),
    },
    
{
  title: 'Content',
  content: (
    // <Form.Item
    //   name="content"
    //   rules={[{ 
    //     required: true, 
    //     message: 'Please add some content to your article',
    //     validator: (_, value) => {
    //       if (!hasActualContent(value)) {
    //         return Promise.reject(new Error('Please add some content to your article'));
    //       }
    //       return Promise.resolve();
    //     }
    //   }]}
    // >
    //   <EditorSwitcher
    //     value={formValues.content}
    //     onChange={(content) => {
    //       form.setFieldValue('content', content);
    //       setFormValues(prev => ({ ...prev, content }));
    //     }}
    //     disabled={loading || initialLoading}
    //     height={500}
    //   />
    // </Form.Item>


    // jodit editor
    <Form.Item
      name="content"
      rules={[{ 
        required: true, 
        message: 'Please add some content to your article',
        validator: (_, value) => {
          if (!hasActualContent(value)) {
            return Promise.reject(new Error('Please add some content to your article'));
          }
          return Promise.resolve();
        }
      }]}
    >
      <SafeJoditWrapper
        value={formValues.content} // Can be string, object, or anything
        onChange={(content: string) => {
          form.setFieldValue('content', content);
          setFormValues(prev => ({ ...prev, content }));
        }}
        disabled={loading || initialLoading}
        height={500}
        placeholder="Start writing your amazing article..."
      />
    </Form.Item>
  ),
},
    {
      title: 'Media & SEO',
      content: (
        <>
          <Form.Item label="Cover Image">
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
                  Upload Cover Image
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
                      height: '500px',
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
                    Remove Image
                  </Button>
                </div>
              )}
              <Form.Item name="coverImage" noStyle>
                <Input type="hidden" />
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item
            label="Meta Title"
            name="metaTitle"
            extra="For SEO. If empty, article title will be used."
          >
            <Input 
              placeholder="SEO title (60-70 characters)" 
              disabled={loading || initialLoading}
              value={formValues.metaTitle}
              onChange={(e) => {
                form.setFieldValue('metaTitle', e.target.value);
                setFormValues(prev => ({ ...prev, metaTitle: e.target.value }));
              }}
            />
          </Form.Item>

          <Form.Item
            label="Meta Description"
            name="metaDescription"
            extra="For SEO. If empty, excerpt will be used."
          >
            <TextArea
              rows={3}
              placeholder="SEO description (150-160 characters)"
              showCount
              maxLength={160}
              disabled={loading || initialLoading}
              value={formValues.metaDescription}
              onChange={(e) => {
                form.setFieldValue('metaDescription', e.target.value);
                setFormValues(prev => ({ ...prev, metaDescription: e.target.value }));
              }}
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: 'Settings',
      content: (
        <>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Access Type"
                name="accessType"
              >
                <Select 
                  disabled={loading || initialLoading}
                  value={formValues.accessType}
                  onChange={(value) => {
                    form.setFieldValue('accessType', value);
                    setFormValues(prev => ({ ...prev, accessType: value }));
                  }}
                >
                  <Option value="FREE">
                    <Space>
                      <EyeOutlined />
                      <span>Free Access</span>
                    </Space>
                  </Option>
                  <Option value="PREMIUM">
                    <Space>
                      <DollarOutlined />
                      <span>Premium (Requires Coins)</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              {formValues.accessType === 'PREMIUM' && (
                <Form.Item
                  label="Coin Price"
                  name="coinPrice"
                  rules={[{ 
                    required: true, 
                    message: 'Please enter coin price',
                    type: 'number',
                    min: 1,
                    max: 1000
                  }]}
                >
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    placeholder="Coins required"
                    addonAfter="coins"
                    disabled={loading || initialLoading}
                    value={formValues.coinPrice}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      form.setFieldValue('coinPrice', value);
                      setFormValues(prev => ({ ...prev, coinPrice: value }));
                    }}
                  />
                </Form.Item>
              )}
            </Col>
          </Row>

          <Form.Item
            label="Auto-Translate"
            name="autoTranslate"
            valuePropName="checked"
          >
            <Switch 
              disabled={loading || initialLoading}
              checked={formValues.autoTranslate}
              onChange={(checked) => {
                form.setFieldValue('autoTranslate', checked);
                setFormValues(prev => ({ ...prev, autoTranslate: checked }));
              }}
            />
          </Form.Item>

          {formValues.autoTranslate && (
            <Form.Item
              label="Target Languages"
              name="targetLanguages"
            >
              <Select 
                mode="multiple" 
                placeholder="Select languages"
                disabled={loading || initialLoading}
                value={formValues.targetLanguages}
                onChange={(value) => {
                  form.setFieldValue('targetLanguages', value);
                  setFormValues(prev => ({ ...prev, targetLanguages: value }));
                }}
              >
                <Option value="fr">🇫🇷 French</Option>
                <Option value="es">🇪🇸 Spanish</Option>
                <Option value="de">🇩🇪 German</Option>
                <Option value="pt">🇵🇹 Portuguese</Option>
                <Option value="ar">🇸🇦 Arabic</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item
            label="Featured Article"
            name="isFeatured"
            valuePropName="checked"
          >
            <Switch 
              disabled={loading || initialLoading}
              checked={formValues.isFeatured}
              onChange={(checked) => {
                form.setFieldValue('isFeatured', checked);
                setFormValues(prev => ({ ...prev, isFeatured: checked }));
              }}
            />
          </Form.Item>

          <Divider orientation="left" style={{ marginTop: 24 }}>
          <Space>
            <FireOutlined />
            <span>Content Flags & Classification</span>
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Content Type"
              name="contentType"
            >
              <Select 
                placeholder="Select content type"
                disabled={loading || initialLoading}
                value={formValues.contentType}
                onChange={(value) => {
                  form.setFieldValue('contentType', value);
                  setFormValues(prev => ({ ...prev, contentType: value }));
                }}
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
              label="Reading Level"
              name="readingLevel"
            >
              <Select 
                placeholder="Select reading level"
                disabled={loading || initialLoading}
                value={formValues.readingLevel}
                onChange={(value) => {
                  form.setFieldValue('readingLevel', value);
                  setFormValues(prev => ({ ...prev, readingLevel: value }));
                }}
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
              label="Estimated Reading Time"
              name="timeToRead"
            >
              <Input
                type="number"
                min={1}
                max={120}
                placeholder="Minutes"
                addonAfter="minutes"
                disabled={loading || initialLoading}
                value={formValues.timeToRead}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  form.setFieldValue('timeToRead', value);
                  setFormValues(prev => ({ ...prev, timeToRead: value }));
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ marginTop: 16 }}>
          <Space>
            <StarOutlined />
            <span>Featured & Trending Settings</span>
          </Space>
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" style={{ background: '#fafafa' }}>
              <Form.Item
                label={
                  <Space>
                    <StarOutlined style={{ color: '#faad14' }} />
                    <span>Featured Status</span>
                  </Space>
                }
                name="isFeatured"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Featured" 
                  unCheckedChildren="Not Featured"
                  disabled={loading || initialLoading}
                  checked={formValues.isFeatured}
                  onChange={(checked) => {
                    form.setFieldValue('isFeatured', checked);
                    setFormValues(prev => ({ ...prev, isFeatured: checked }));
                  }}
                />
              </Form.Item>
              
              {formValues.isFeatured && (
                <Form.Item
                  label="Featured Ranking"
                  name="featuredRanking"
                  extra="How prominently should this be featured?"
                >
                  <Rate 
                    count={5}
                    value={formValues.featuredRanking}
                    onChange={(value: any) => {
                      form.setFieldValue('featuredRanking', value);
                      setFormValues(prev => ({ ...prev, featuredRanking: value }));
                    }}
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
                    <span>Trending Status</span>
                  </Space>
                }
                name="isTrending"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Trending" 
                  unCheckedChildren="Not Trending"
                  disabled={loading || initialLoading}
                  checked={formValues.isTrending}
                  onChange={(checked) => {
                    form.setFieldValue('isTrending', checked);
                    setFormValues(prev => ({ ...prev, isTrending: checked }));
                  }}
                />
              </Form.Item>
              
              {formValues.isTrending && (
                <Form.Item
                  label="Trending Score"
                  name="trendingScore"
                  extra="Higher score = more prominent in trending"
                >
                  <Input
                    type="range"
                    min={1}
                    max={100}
                    style={{ width: '100%' }}
                    value={formValues.trendingScore}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      form.setFieldValue('trendingScore', value);
                      setFormValues(prev => ({ ...prev, trendingScore: value }));
                    }}
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
                  <span>Editor's Pick</span>
                </Space>
              }
              name="isEditorPick"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Editor's Choice" 
                unCheckedChildren="Standard"
                disabled={loading || initialLoading}
                checked={formValues.isEditorPick}
                onChange={(checked) => {
                  form.setFieldValue('isEditorPick', checked);
                  setFormValues(prev => ({ ...prev, isEditorPick: checked }));
                }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  <WarningOutlined
               style={{ color: '#722ed1' }} />
                  <span>Mark as Popular</span>
                </Space>
              }
              name="isPopular"
              valuePropName="checked"
            >
              <Switch 
                checkedChildren="Popular" 
                unCheckedChildren="Standard"
                disabled={loading || initialLoading}
                checked={formValues.isPopular}
                onChange={(checked) => {
                  form.setFieldValue('isPopular', checked);
                  setFormValues(prev => ({ ...prev, isPopular: checked }));
                }}
              />
            </Form.Item>
          </Col>
        </Row>

          <Tabs
            defaultActiveKey="publish"
            items={[
              {
                key: 'publish',
                label: 'Publish Now',
                children: (
                  <Alert
                    message="Article will be published immediately"
                    type="info"
                    showIcon
                  />
                ),
                disabled: loading || initialLoading,
              },
              {
                key: 'schedule',
                label: 'Schedule',
                children: (
                  <Form.Item
                    label="Schedule Date & Time"
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
                      value={formValues.scheduledFor}
                      onChange={(date) => {
                        form.setFieldValue('scheduledFor', date);
                        setFormValues(prev => ({ ...prev, scheduledFor: date }));
                      }}
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
  ];

  if (initialLoading) {
    return (
      <div>
        <ArticleAdminNavbar 
          currentPath={window.location.pathname}
          title="Article Management"
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
            {isEditMode ? "Loading article..." : "Initializing form..."}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <ArticleAdminNavbar 
        currentPath={window.location.pathname}
        title="Article Management"
      />
      
      <Breadcrumb 
        style={{ marginBottom: 16 }}
        items={[
          { 
            title: 'Dashboard', 
            onClick: () => navigateTo('/dashboard') 
          },
          { 
            title: 'Article Admin', 
            onClick: () => navigateTo('/dashboard/article-admin') 
          },
          { 
            title: 'Articles', 
            onClick: () => navigateTo('/dashboard/article-admin/articles') 
          },
          { 
            title: isEditMode ? 'Edit Article' : 'New Article' 
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
            {isEditMode ? 'Edit Article' : 'Create New Article'}
          </Title>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={handleCancel}
            disabled={loading}
          >
            Back to Articles
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
            // content: { type: 'doc', content: [] },
            content: '', // empty string for JODIT, not Tiptap JSON
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
            <Space>
              <Button 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button 
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={loading || initialLoading}
                >
                  Previous
                </Button>
              )}
            </Space>

            <Space>
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
                >
                  Next
                </Button>
              )}
            </Space>

            <Space>
              <Button
                onClick={handleSaveDraft}
                loading={loading}
                icon={<SaveOutlined />}
                disabled={initialLoading}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                onClick={handlePublish}
                loading={loading}
                icon={<SendOutlined />}
                disabled={initialLoading}
              >
                Publish Now
              </Button>
              <Button
                type="dashed"
                onClick={handleSchedule}
                loading={loading}
                icon={<ClockCircleOutlined />}
                disabled={initialLoading}
              >
                Schedule
              </Button>
            </Space>
          </div>

          <Form.Item name="status" noStyle />
          <Form.Item name="publishedAt" noStyle />
        </Form>
      </Card>
    </div>
  );
};

export default ArticleForm;