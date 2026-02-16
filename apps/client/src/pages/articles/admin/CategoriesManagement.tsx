import { t, Trans } from "@lingui/macro";
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Input, 
  Modal, 
  Form, 
  Tag,
  ColorPicker,
  Popconfirm,
  message,
  Tooltip,
  Select,
  Switch,
  Tabs,
  Badge,
  Rate,
  Alert,
  Typography,
  Drawer,
  Descriptions,
  Empty,
  Input as AntdInput,
  Row,
  Col,
  Divider,
  Dropdown,
  MenuProps,
  Statistic as AntdStatistic,
} from 'antd';

import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  DragOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  TranslationOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  MoreOutlined,
  EyeInvisibleOutlined,
  GlobalOutlined,
  EditFilled,
  CheckOutlined,
  ArrowLeftOutlined, // Changed from phosphor icon
  CrownOutlined, // Added for SUPER_ADMIN indicator
  WarningOutlined,
} from '@ant-design/icons';

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ArticleAdminNavbar from './ArticleAdminSidebar';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  updateCategoryOrder,
  getCategoryTranslations,
  updateCategoryTranslation,
  regenerateCategoryTranslation,
  generateCategoryTranslations,
  type CategoryTranslation
} from '../../../services/article.service';

const { Column } = Table;
const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = AntdInput;

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  isActive: boolean;
  articleCount: number;
  autoTranslate?: boolean;
  targetLanguages?: string[];
  availableLanguages?: string[];
  translations?: CategoryTranslation[];
}

const SortableRow = ({ children, ...props }: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props['data-row-key'],
  });

  const style = {
    ...props.style,
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'move',
    ...(isDragging ? { zIndex: 999, background: '#fafafa', 
      dark: { background: '#1f2937' } // Dark mode dragging
    } : {}),
  };

  return (
    <tr {...props} ref={setNodeRef} style={style} {...attributes}>
      {React.Children.map(children, (child) => {
        if (child.key === 'sort') {
          return React.cloneElement(child, {
            children: (
              <div
                ref={setActivatorNodeRef}
                style={{ cursor: 'grab', padding: '8px' }}
                className="dark:text-gray-400 dark:hover:text-gray-200"
                {...listeners}
              >
                <DragOutlined />
              </div>
            ),
          });
        }
        return child;
      })}
    </tr>
  );
};

const CategoriesManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  
  // Translation management states
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [translationsDrawerVisible, setTranslationsDrawerVisible] = useState(false);
  const [translations, setTranslations] = useState<CategoryTranslation[]>([]);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<CategoryTranslation | null>(null);
  const [editTranslationModal, setEditTranslationModal] = useState(false);
  const [editForm] = Form.useForm();

  // User role state
  const [userRole, setUserRole] = useState<string>('ADMIN');
  const [accessDenied, setAccessDenied] = useState(false);

  // Check user role on component mount
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'ADMIN';
    setUserRole(role);
    
    if (role !== 'SUPER_ADMIN') {
      setAccessDenied(true);
      message.error(t`Only Super Admins can access Categories Management`);
    } else {
      fetchCategories();
    }
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories();
      
      let categoriesData: Category[] = [];
      
      if (Array.isArray(data)) {
        categoriesData = data;
      } else if (data && typeof data === 'object') {
        const dataObj = data as any;
        if (Array.isArray(dataObj.data)) {
          categoriesData = dataObj.data;
        }
      }
      
      // Fetch translation counts for each category
      const categoriesWithTranslationCounts = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const translations = await getCategoryTranslations(category.id);
            return {
              ...category,
              translationCount: translations.length,
              translations: translations,
            };
          } catch (error) {
            console.error(`Failed to fetch translations for category ${category.id}:`, error);
            return {
              ...category,
              translationCount: 0,
              translations: [],
            };
          }
        })
      );
      
      setCategories(categoriesWithTranslationCounts);
      
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      message.error(t`Failed to load categories: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // If not SUPER_ADMIN, show access denied message
  if (accessDenied) {
    return (
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="text-center py-12">
          <CloseCircleOutlined className="text-red-500 dark:text-red-400 text-5xl mb-4" />
          <Title level={3} className="dark:text-white mb-2">
            {t`Access Denied`}
          </Title>
          <Paragraph className="dark:text-gray-400 mb-6">
            {t`Only Super Administrators can access Categories Management.`}
          </Paragraph>
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {t`Go Back`}
          </Button>
        </div>
      </Card>
    );
  }

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success(t`Category deleted successfully`);
      fetchCategories();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error(t`Failed to delete category: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setCategories((prev) => {
        const oldIndex = prev.findIndex(item => item.id === active.id);
        const newIndex = prev.findIndex(item => item.id === over?.id);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        
        const updated = newOrder.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
        
        saveCategoryOrder(updated);
        
        return updated;
      });
    }
  };

  const handleGenerateTranslations = async (categoryId: string) => {
    setTranslationLoading(true);
    try {
      await generateCategoryTranslations(categoryId);
      
      message.success(t`Translation generation started. This may take a moment.`);
      
      setTimeout(async () => {
        try {
          const updatedTranslations = await getCategoryTranslations(categoryId);
          setTranslations(updatedTranslations || []);
          
          if (updatedTranslations && updatedTranslations.length > 0) {
            message.success(t`${updatedTranslations.length} translations generated successfully!`);
          } else {
            message.info(t`Translations are still processing. Check back in a moment.`);
          }
        } catch (error) {
          console.error('Error checking translations:', error);
        } finally {
          setTranslationLoading(false);
        }
      }, 2000);
    } catch (error: any) {
      console.error('Generate translations error:', error);
      message.error(t`Failed to generate translations: ${error.message || 'Unknown error'}`);
      setTranslationLoading(false);
    }
  };

  const saveCategoryOrder = async (orderedCategories: Category[]) => {
    try {
      const orderData = orderedCategories.map(cat => ({
        id: cat.id,
        order: cat.order,
      }));
      await updateCategoryOrder(orderData);
      message.success(t`Category order updated`);
    } catch (error: any) {
      console.error('Save order error:', error);
      message.error(t`Failed to save order: ${error.message || 'Unknown error'}`);
    }
  };

  const viewArticlesByCategory = (slug: string) => {
    window.open(`/articles?category=${slug}`, '_blank');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleViewTranslations = async (category: Category) => {
    setSelectedCategory(category);
    setTranslationLoading(true);
    
    try {
      const translationsData = await getCategoryTranslations(category.id);
      
      if (Array.isArray(translationsData) && translationsData.length > 0) {
        setTranslations(translationsData);
      } else {
        setTranslations([]);
        
        if (category.autoTranslate && category.targetLanguages && category.targetLanguages.length > 0) {
          message.info(
            `No translations found yet. This category is set to auto-translate to: ${category.targetLanguages.join(', ')}. ` +
            `You can generate translations manually.`
          );
        } else {
          message.warning(
            'No translations found. Enable auto-translation and set target languages to generate translations.'
          );
        }
      }
      
      setTranslationsDrawerVisible(true);
    } catch (error: any) {
      console.error('❌ Error loading translations:', error);
      message.error(`Failed to load translations: ${error.message}`);
    } finally {
      setTranslationLoading(false);
    }
  };

  const handleRegenerateTranslation = async (translationId: string) => {
    try {
      await regenerateCategoryTranslation(translationId);
      message.success(t`Translation regeneration started`);
      if (selectedCategory) {
        const updatedTranslations = await getCategoryTranslations(selectedCategory.id);
        setTranslations(updatedTranslations || []);
      }
    } catch (error: any) {
      message.error(t`Failed to regenerate translation: ${error.message}`);
    }
  };

  const handleEditTranslation = (translation: CategoryTranslation) => {
    setEditingTranslation(translation);
    editForm.setFieldsValue({
      name: translation.name,
      description: translation.description,
      needsReview: translation.needsReview,
    });
    setEditTranslationModal(true);
  };

  const handleSaveTranslation = async (values: any) => {
    if (!editingTranslation) return;
    
    try {
      await updateCategoryTranslation(editingTranslation.id, {
        name: values.name,
        description: values.description,
        needsReview: values.needsReview,
      });
      
      message.success(t`Translation updated successfully`);
      setEditTranslationModal(false);
      
      if (selectedCategory) {
        const updatedTranslations = await getCategoryTranslations(selectedCategory.id);
        setTranslations(updatedTranslations || []);
      }
    } catch (error: any) {
      message.error(t`Failed to update translation: ${error.message}`);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      color: category.color || '#1890ff',
      icon: category.icon || '',
      isActive: category.isActive !== false,
      autoTranslate: category.autoTranslate !== false,
      targetLanguages: category.targetLanguages || ['fr'],
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    console.log('Raw form values:', values);
    
    try {
      const categoryData = {
        name: values.name.trim(),
        description: values.description?.trim() || '',
        color: values.color || '#1890ff',
        icon: values.icon?.trim() || '',
        isActive: values.isActive !== undefined ? Boolean(values.isActive) : true,
        autoTranslate: values.autoTranslate !== undefined ? Boolean(values.autoTranslate) : true,
        targetLanguages: values.autoTranslate ? (values.targetLanguages || ['fr']) : [],
      };
      
      console.log('Transformed data:', categoryData);
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        message.success(t`Category updated successfully`);
      } else {
        await createCategory(categoryData);
        message.success(t`Category created successfully`);
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Full error:', error);
      
      if (error.message) {
        message.error(t`Error: ${error.message}`);
      } else if (error.data?.message) {
        const messages = Array.isArray(error.data.message) 
          ? error.data.message.join(', ')
          : error.data.message;
        message.error(t`Error: ${messages}`);
      } else {
        message.error(t`Failed to save category`);
      }
    }
  };

  const getTranslationStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge status="success" text={t`Completed`} className="dark:[&_.ant-badge-status-dot]:bg-green-500" />;
      case 'PENDING':
        return <Badge status="default" text={t`Pending`} className="dark:[&_.ant-badge-status-dot]:bg-gray-500" />;
      case 'PROCESSING':
        return <Badge status="processing" text={t`Processing`} className="dark:[&_.ant-badge-status-dot]:bg-blue-500" />;
      case 'FAILED':
        return <Badge status="error" text={t`Failed`} className="dark:[&_.ant-badge-status-dot]:bg-red-500" />;
      default:
        return <Badge status="default" text={status} className="dark:[&_.ant-badge-status-dot]:bg-gray-500" />;
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

  const translationActionsMenu = (record: CategoryTranslation): MenuProps => ({
    items: [
      {
        key: 'edit',
        label: t`Edit Translation`,
        icon: <EditOutlined />,
        onClick: () => handleEditTranslation(record),
      },
      {
        key: 'regenerate',
        label: t`Regenerate with AI`,
        icon: <SyncOutlined />,
        onClick: () => handleRegenerateTranslation(record.id),
      },
      {
        key: 'mark_reviewed',
        label: t`Mark as Reviewed`,
        icon: <CheckCircleOutlined />,
        onClick: () => handleSaveTranslation({
          ...record,
          needsReview: false,
        }),
        disabled: !record.needsReview,
      },
      {
        key: 'mark_unreviewed',
        label: t`Mark for Review`,
        icon: <EyeInvisibleOutlined />,
        onClick: () => handleSaveTranslation({
          ...record,
          needsReview: true,
        }),
        disabled: record.needsReview,
      },
    ],
  });

  return (
    <div>
      {/* Article Admin Navbar */}
        <ArticleAdminNavbar 
          currentPath={window.location.pathname}
          title={userRole === 'SUPER_ADMIN' ? t`Super Admin Dashboard` : t`Article Dashboard`}
        />
        
      {/* Header Card */}
      <Card className="mb-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          {/* Title Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 dark:text-white">
              <Button 
                type="text"
                icon={<ArrowLeftOutlined />} 
                onClick={() => window.history.back()}
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
                <div className="font-semibold text-lg flex items-center gap-2">
                  {t`Categories Management`}
                  <Tag icon={<CrownOutlined />} color="purple" className="dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700">
                    {t`Super Admin`}
                  </Tag>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t`Manage article categories and translations`}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                {categories.length} {t`categories`}
              </Tag>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder={t`Search categories...`}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="dark:[&_.ant-input]:bg-gray-700 dark:[&_.ant-input]:border-gray-600 dark:[&_.ant-input]:text-white"
              allowClear
            />
            
            <div className="col-span-2 md:col-span-1 lg:col-span-2"></div> {/* Spacer */}
            
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
              >
                {t`New Category`}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredCategories.map((c: any) => c.id)} strategy={verticalListSortingStrategy}>
            <Table
              dataSource={filteredCategories}
              rowKey="id"
              loading={loading}
              components={{
                body: {
                  row: SortableRow,
                },
              }}
              pagination={false}
              scroll={{ x: true }}
              className="
                [&_.ant-table-thead]:bg-gray-50 
                dark:[&_.ant-table-thead]:bg-gray-800 
                [&_.ant-table-cell]:dark:bg-gray-800 
                [&_.ant-table-cell]:dark:text-gray-200
                [&_.ant-table-tbody_>_tr:hover]:dark:bg-gray-700
              "
            >
              <Column
                key="sort"
                width={60}
                render={() => <DragOutlined style={{ cursor: 'grab' }} className="dark:text-gray-400" />}
              />
              <Column
                title={t`Category`}
                dataIndex="name"
                key="name"
                render={(text, record: Category) => (
                  <Space>
                    {record.color && (
                      <div style={{
                        width: 16,
                        height: 16,
                        backgroundColor: record.color,
                        borderRadius: '50%',
                      }} />
                    )}
                    <span className="font-medium dark:text-gray-100">{text}</span>
                    <Tag color={record.isActive ? 'success' : 'default'} 
                      className={`
                        ${record.isActive ? 'dark:bg-green-900 dark:text-green-200 dark:border-green-700' : 
                          'dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'}
                      `}
                    >
                      {record.isActive ? t`Active` : t`Inactive`}
                    </Tag>
                    {record.autoTranslate && (
                      <Tooltip title={t`Auto-translation enabled`}>
                        <GlobalOutlined className="text-blue-500 dark:text-blue-400" />
                      </Tooltip>
                    )}
                  </Space>
                )}
              />
              <Column
                title={t`Slug`}
                dataIndex="slug"
                key="slug"
                render={(text) => <code className="dark:text-gray-300">{text}</code>}
              />
              <Column
                title={t`Description`}
                dataIndex="description"
                key="description"
                ellipsis
                className="dark:text-gray-300"
              />
              <Column
                title={t`Articles`}
                dataIndex="articleCount"
                key="articleCount"
                width={100}
                render={(count) => (
                  <Tag color="blue" className="dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700">
                    {count || 0}
                  </Tag>
                )}
              />
              <Column
                title={t`Translations`}
                key="translations"
                width={140}
                render={(_: any, record: Category) => {
                  const targetLanguages = record.targetLanguages || [];
                  const hasTranslations = record.translations && record.translations.length > 0;
                  const translationCount = hasTranslations ? record.translations!.length : 0;
                  
                  return (
                    <Space>
                      <Tooltip 
                        title={
                          <div className="dark:text-gray-200">
                            <p><strong>Base:</strong> English (en)</p>
                            <p><strong>Targets:</strong> {targetLanguages.join(', ') || 'None'}</p>
                            <p><strong>Translations:</strong> {translationCount} created</p>
                            <p><strong>Auto-translate:</strong> {record.autoTranslate ? 'Enabled' : 'Disabled'}</p>
                          </div>
                        }
                      >
                        <Tag 
                          color={
                            !record.autoTranslate ? "default" :
                            translationCount === 0 ? "orange" :
                            translationCount === targetLanguages.length ? "green" : "blue"
                          }
                          className={`
                            ${!record.autoTranslate ? 'dark:bg-gray-700 dark:text-gray-300' : ''}
                            ${translationCount === 0 ? 'dark:bg-orange-900 dark:text-orange-200' : ''}
                            ${translationCount === targetLanguages.length ? 'dark:bg-green-900 dark:text-green-200' : ''}
                            ${translationCount > 0 && translationCount < targetLanguages.length ? 'dark:bg-blue-900 dark:text-blue-200' : ''}
                          `}
                        >
                          {record.autoTranslate ? (
                            <>
                              {translationCount}/{targetLanguages.length}
                              {translationCount === 0 && ' ⏳'}
                            </>
                          ) : (
                            'Manual'
                          )}
                        </Tag>
                      </Tooltip>
                      <Tooltip title={t`Manage Translations`}>
                        <Button
                          type="text"
                          icon={<TranslationOutlined />}
                          onClick={() => handleViewTranslations(record)}
                          size="small"
                          disabled={!record.autoTranslate && translationCount === 0}
                          className="dark:text-gray-400 hover:dark:text-blue-400"
                        />
                      </Tooltip>
                    </Space>
                  );
                }}
              />
              <Column
                title={t`Order`}
                dataIndex="order"
                key="order"
                width={80}
                render={(order) => <Tag className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">#{order}</Tag>}
              />
              <Column
                title={t`Actions`}
                key="actions"
                width={150}
                fixed="right"
                render={(_: any, record: Category) => (
                  <Space>
                    <Tooltip title={t`View Translations`}>
                      <Button
                        type="text"
                        icon={<TranslationOutlined />}
                        onClick={() => handleViewTranslations(record)}
                        size="small"
                        className="dark:text-gray-400 hover:dark:text-blue-400"
                      />
                    </Tooltip>
                    <Tooltip title={t`Edit`}>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        size="small"
                        className="dark:text-gray-400 hover:dark:text-blue-400"
                      />
                    </Tooltip>
                    <Tooltip title={t`Delete`}>
                      <Popconfirm
                        title={t`Delete Category`}
                        description={t`Are you sure? Articles in this category will become uncategorized.`}
                        onConfirm={() => handleDelete(record.id)}
                        okText={t`Yes`}
                        cancelText={t`No`}
                        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                        className="dark:[&_.ant-popconfirm-message]:text-gray-200"
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          className="hover:dark:text-red-400"
                        />
                      </Popconfirm>
                    </Tooltip>
                  </Space>
                )}
              />
            </Table>
          </SortableContext>
        </DndContext>
      </Card>

      {/* Translations Drawer */}
      <Drawer
        title={
          <Space className="dark:text-white">
            <TranslationOutlined />
            <span>
              {t`Translations for`} "{selectedCategory?.name}"
            </span>
          </Space>
        }
        placement="right"
        size="large"
        onClose={() => setTranslationsDrawerVisible(false)}
        open={translationsDrawerVisible}
        extra={
          <Space>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              onClick={() => {
                const failedTranslations = translations.filter(t => t.status === 'FAILED');
                if (failedTranslations.length > 0) {
                  failedTranslations.forEach(t => handleRegenerateTranslation(t.id));
                }
              }}
              disabled={!translations.some(t => t.status === 'FAILED')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
            >
              {t`Retry Failed`}
            </Button>
          </Space>
        }
        className="dark:bg-gray-800 [&_.ant-drawer-header]:dark:bg-gray-800 [&_.ant-drawer-header]:dark:border-gray-700 [&_.ant-drawer-body]:dark:bg-gray-800"
      >
        {translationLoading ? (
          <div className="text-center py-12 dark:text-gray-300">
            <SyncOutlined spin className="text-2xl text-blue-500 dark:text-blue-400" />
            <div>{t`Loading translations...`}</div>
          </div>
        ) : translations.length === 0 ? (
          <Empty
            description={t`No translations available`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            className="dark:text-gray-400"
          >
            <Button 
              type="primary"
              onClick={() => selectedCategory && handleGenerateTranslations(selectedCategory.id)}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
            >
              {t`Generate Translations`}
            </Button>
          </Empty>
        ) : (
          <Tabs defaultActiveKey="all" className="[&_.ant-tabs-tab]:dark:text-gray-300 [&_.ant-tabs-tab-active]:dark:text-blue-400">
            <TabPane tab={t`All Translations`} key="all">
              <Table
                dataSource={translations}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
                className="
                  [&_.ant-table-thead]:bg-gray-50 
                  dark:[&_.ant-table-thead]:bg-gray-800 
                  [&_.ant-table-cell]:dark:bg-gray-800 
                  [&_.ant-table-cell]:dark:text-gray-200
                  [&_.ant-table-tbody_>_tr:hover]:dark:bg-gray-700
                "
              >
                <Column
                  title={t`Language`}
                  dataIndex="language"
                  key="language"
                  width={100}
                  render={(language) => (
                    <Space>
                      <span style={{ fontSize: '18px' }}>{getLanguageFlag(language)}</span>
                      <Tag className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600">{language.toUpperCase()}</Tag>
                    </Space>
                  )}
                />
                <Column
                  title={t`Name`}
                  dataIndex="name"
                  key="name"
                  ellipsis
                  className="dark:text-gray-200"
                />
                <Column
                  title={t`Status`}
                  dataIndex="status"
                  key="status"
                  width={120}
                  render={(status) => getTranslationStatusBadge(status)}
                />
                <Column
                  title={t`Quality`}
                  key="quality"
                  width={100}
                  render={(_: any, record: CategoryTranslation) => (
                    <Rate 
                      disabled 
                      value={record.qualityScore} 
                      count={5} 
                      style={{ fontSize: 14 }}
                      className="[&_.ant-rate-star]:dark:text-yellow-500"
                    />
                  )}
                />
                <Column
                  title={t`Review`}
                  dataIndex="needsReview"
                  key="needsReview"
                  width={100}
                  render={(needsReview) => (
                    needsReview ? (
                      <Badge status="warning" text={t`Needs Review`} className="dark:[&_.ant-badge-status-dot]:bg-yellow-500" />
                    ) : (
                      <Badge status="success" text={t`Reviewed`} className="dark:[&_.ant-badge-status-dot]:bg-green-500" />
                    )
                  )}
                />
                <Column
                  title={t`Updated`}
                  dataIndex="updatedAt"
                  key="updatedAt"
                  width={120}
                  render={(date) => <span className="dark:text-gray-300">{new Date(date).toLocaleDateString()}</span>}
                />
                <Column
                  title={t`Actions`}
                  key="actions"
                  width={100}
                  fixed="right"
                  render={(_: any, record: CategoryTranslation) => (
                    <Dropdown 
                      menu={translationActionsMenu(record)} 
                      trigger={['click']}
                      className="dark:[&_.ant-dropdown-menu]:bg-gray-800 dark:[&_.ant-dropdown-menu-item]:text-gray-200"
                    >
                      <Button 
                        type="text" 
                        icon={<MoreOutlined />} 
                        size="small"
                        className="dark:text-gray-400 hover:dark:text-blue-400"
                      />
                    </Dropdown>
                  )}
                />
              </Table>
            </TabPane>
            
            <TabPane tab={t`Needs Review`} key="needsReview">
              {translations.filter(t => t.needsReview).length === 0 ? (
                <Alert
                  message={t`No translations need review`}
                  type="success"
                  showIcon
                  className="dark:bg-green-900/50 dark:border-green-800 dark:text-green-200"
                  action={
                    <Button size="small" type="text" className="dark:text-green-300">
                      {t`View All`}
                    </Button>
                  }
                />
              ) : (
                <Table
                  dataSource={translations.filter(t => t.needsReview)}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="dark:[&_.ant-table]:bg-gray-800"
                >
                  <Column
                    title={t`Language`}
                    dataIndex="language"
                    key="language"
                    render={(language) => (
                      <Space>
                        <span style={{ fontSize: '18px' }}>{getLanguageFlag(language)}</span>
                        <Text strong className="dark:text-white">{language.toUpperCase()}</Text>
                      </Space>
                    )}
                  />
                  <Column
                    title={t`Current Translation`}
                    key="content"
                    render={(_: any, record: CategoryTranslation) => (
                      <div className="dark:text-gray-200">
                        <Paragraph strong>{record.name}</Paragraph>
                        {record.description && (
                          <Paragraph className="dark:text-gray-400">
                            {record.description}
                          </Paragraph>
                        )}
                      </div>
                    )}
                  />
                  <Column
                    title={t`Actions`}
                    key="actions"
                    width={150}
                    render={(_: any, record: CategoryTranslation) => (
                      <Space>
                        <Button
                          type="primary"
                          icon={<CheckOutlined />}
                          onClick={() => handleSaveTranslation({
                            ...record,
                            needsReview: false,
                          })}
                          size="small"
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 border-0"
                        >
                          {t`Approve`}
                        </Button>
                        <Button
                          icon={<EditFilled />}
                          onClick={() => handleEditTranslation(record)}
                          size="small"
                          className="dark:text-blue-400 hover:dark:text-blue-300 dark:border-gray-600"
                        >
                          {t`Edit`}
                        </Button>
                      </Space>
                    )}
                  />
                </Table>
              )}
            </TabPane>
            
            <TabPane tab={t`Failed`} key="failed">
              {translations.filter(t => t.status === 'FAILED').length === 0 ? (
                <Alert
                  message={t`No failed translations`}
                  type="success"
                  showIcon
                  className="dark:bg-green-900/50 dark:border-green-800 dark:text-green-200"
                />
              ) : (
                <Table
                  dataSource={translations.filter(t => t.status === 'FAILED')}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  className="dark:[&_.ant-table]:bg-gray-800"
                >
                  <Column
                    title={t`Language`}
                    dataIndex="language"
                    key="language"
                    render={(language) => (
                      <Tag color="red" className="dark:bg-red-900 dark:text-red-200 dark:border-red-700">{language.toUpperCase()}</Tag>
                    )}
                  />
                  <Column
                    title={t`Last Attempt`}
                    dataIndex="updatedAt"
                    key="updatedAt"
                    render={(date) => <span className="dark:text-gray-300">{new Date(date).toLocaleString()}</span>}
                  />
                  <Column
                    title={t`Actions`}
                    key="actions"
                    width={100}
                    render={(_: any, record: CategoryTranslation) => (
                      <Button
                        type="primary"
                        icon={<SyncOutlined />}
                        onClick={() => handleRegenerateTranslation(record.id)}
                        size="small"
                        className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-0"
                      >
                        {t`Retry`}
                      </Button>
                    )}
                  />
                </Table>
              )}
            </TabPane>
          </Tabs>
        )}
        
        {/* Summary Stats */}
        {translations.length > 0 && (
          <Card size="small" style={{ marginTop: 20 }} className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
            <Row gutter={16}>
              <Col span={6}>
                <AntdStatistic
                  title={t`Total`}
                  value={translations.length}
                  prefix={<GlobalOutlined />}
                  className="dark:[&_.ant-statistic-title]:text-gray-300 dark:[&_.ant-statistic-content]:text-gray-200"
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Completed`}
                  value={translations.filter(t => t.status === 'COMPLETED').length}
                  prefix={<CheckCircleOutlined />}
                  className="
                    [&_.ant-statistic-content]:text-green-600 
                    dark:[&_.ant-statistic-title]:text-gray-300 
                    dark:[&_.ant-statistic-content]:text-green-400
                  "
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Needs Review`}
                  value={translations.filter(t => t.needsReview).length}
                  prefix={<WarningOutlined />}
                  className="
                    [&_.ant-statistic-content]:text-yellow-600 
                    dark:[&_.ant-statistic-title]:text-gray-300 
                    dark:[&_.ant-statistic-content]:text-yellow-400
                  "
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Failed`}
                  value={translations.filter(t => t.status === 'FAILED').length}
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
      </Drawer>

      {/* Edit Translation Modal */}
      <Modal
        title={
          <Space className="dark:text-white">
            <EditOutlined />
            <span>
              {t`Edit Translation`} ({editingTranslation?.language?.toUpperCase()})
            </span>
          </Space>
        }
        open={editTranslationModal}
        onCancel={() => {
          setEditTranslationModal(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={600}
        okText={t`Save Changes`}
        cancelText={t`Cancel`}
        destroyOnClose
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-header]:bg-gray-800"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveTranslation}
          initialValues={{
            needsReview: true,
          }}
        >
          <Alert
            message={t`Editing translation`}
            description={t`Changes made here will override the AI-generated translation.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            className="dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-200"
          />
          
          <Form.Item
            label={t`Translated Name`}
            name="name"
            rules={[
              { required: true, message: t`Please enter translated name` },
              { min: 2, message: t`Name must be at least 2 characters` },
            ]}
          >
            <Input 
              placeholder={t`Enter translated category name`}
              disabled={translationLoading}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>
          
          <Form.Item
            label={t`Translated Description`}
            name="description"
            rules={[
              { max: 500, message: t`Description cannot exceed 500 characters` }
            ]}
          >
            <TextArea
              rows={3}
              placeholder={t`Enter translated description`}
              showCount
              maxLength={500}
              disabled={translationLoading}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>
          
          <Form.Item
            label={t`Review Status`}
            name="needsReview"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren={t`Reviewed`} 
              unCheckedChildren={t`Needs Review`}
              disabled={translationLoading}
              className="dark:[&_.ant-switch-inner]:text-gray-800"
            />
          </Form.Item>
          
          <Divider className="dark:border-gray-700" />
          
          <Alert
            message={t`Original English`}
            description={
              <div className="dark:text-gray-300">
                <Paragraph strong>{selectedCategory?.name}</Paragraph>
                {selectedCategory?.description && (
                  <Paragraph className="dark:text-gray-400">
                    {selectedCategory.description}
                  </Paragraph>
                )}
              </div>
            }
            type="info"
            showIcon
            className="dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200"
          />
        </Form>
      </Modal>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? t`Edit Category` : t`Create New Category`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        destroyOnHidden={false}
        okText={editingCategory ? t`Update` : t`Create`}
        cancelText={t`Cancel`}
        className="dark:[&_.ant-modal-content]:bg-gray-800 dark:[&_.ant-modal-header]:bg-gray-800"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            color: '#1890ff',
            isActive: true,
            autoTranslate: editingCategory?.autoTranslate !== false,
            targetLanguages: editingCategory?.targetLanguages || ['fr'],
          }}
        >
          <Form.Item
            label={t`Category Name`}
            name="name"
            rules={[
              { required: true, message: t`Please enter category name` },
              { min: 2, message: t`Name must be at least 2 characters` },
              { max: 50, message: t`Name cannot exceed 50 characters` }
            ]}
          >
            <Input 
              placeholder={t`e.g., Career Growth, Productivity, etc.`} 
              disabled={loading}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>

          <Form.Item
            label={t`Description`}
            name="description"
            rules={[
              { max: 200, message: t`Description cannot exceed 200 characters` }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder={t`Brief description of this category`}
              showCount
              maxLength={200}
              disabled={loading}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>

          <Form.Item
            label={t`Color`}
            name="color"
            getValueFromEvent={(color) => {
              if (typeof color === 'object' && color.toHexString) {
                return color.toHexString();
              }
              return color;
            }}
          >
            <ColorPicker
              format="hex"
              showText
              disabled={loading}
              presets={[
                {
                  label: t`Recommended`,
                  colors: [
                    '#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#f5222d',
                    '#13c2c2', '#eb2f96', '#faad14', '#a0d911', '#2f54eb'
                  ],
                },
              ]}
              className="dark:[&_.ant-color-picker-trigger]:border-gray-600"
            />
          </Form.Item>

          <Form.Item
            label={t`Icon (optional)`}
            name="icon"
            extra={t`Enter an emoji or icon name`}
            rules={[
              { max: 20, message: t`Icon cannot exceed 20 characters` }
            ]}
          >
            <Input 
              placeholder={t`e.g., 📈 or rocket`} 
              disabled={loading}
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>

          <Form.Item
            label={t`Auto-Translate`}
            name="autoTranslate"
            valuePropName="checked"
          >
            <Switch disabled={loading} className="dark:[&_.ant-switch-inner]:text-gray-800" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.autoTranslate !== currentValues.autoTranslate
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('autoTranslate') ? (
                <Form.Item
                  label={t`Target Languages`}
                  name="targetLanguages"
                  rules={[
                    { 
                      type: 'array', 
                      min: 1, 
                      message: t`Please select at least one language` 
                    }
                  ]}
                >
                  <Select 
                    mode="multiple" 
                    placeholder={t`Select target languages`}
                    disabled={loading}
                    style={{ width: '100%' }}
                    className="dark:[&_.ant-select-selector]:bg-gray-700 dark:[&_.ant-select-selector]:border-gray-600 dark:[&_.ant-select-selection-item]:text-white"
                    dropdownClassName="dark:bg-gray-800 dark:border-gray-700"
                  >
                    <Option value="fr">🇫🇷 {t`French`}</Option>
                    <Option value="es">🇪🇸 {t`Spanish`}</Option>
                    <Option value="de">🇩🇪 {t`German`}</Option>
                    <Option value="pt">🇵🇹 {t`Portuguese`}</Option>
                    <Option value="ar">🇸🇦 {t`Arabic`}</Option>
                    <Option value="zh">🇨🇳 {t`Chinese`}</Option>
                    <Option value="ja">🇯🇵 {t`Japanese`}</Option>
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item
            label={t`Active`}
            name="isActive"
            valuePropName="checked"
          >
            <Switch disabled={loading} className="dark:[&_.ant-switch-inner]:text-gray-800" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoriesManagement;