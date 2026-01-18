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
} from '@ant-design/icons';

import { ArrowLeft} from '@phosphor-icons/react';

import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
  type CategoryTranslation // Imported from service
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
  translations?: CategoryTranslation[]; // Now uses imported type
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
    ...(isDragging ? { zIndex: 999, background: '#fafafa' } : {}),
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

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
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
            translations: translations, // Optional: store translations if you want
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

  // ========== MISSING FUNCTIONS ==========

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
    
    // Refresh translations after a short delay
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

  // Filter categories based on search text
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  // ========== TRANSLATION FUNCTIONS ==========

  const handleViewTranslations = async (category: Category) => {
  setSelectedCategory(category);
  setTranslationLoading(true);
  
  console.log('📋 Category data for translations:', {
    id: category.id,
    name: category.name,
    autoTranslate: category.autoTranslate,
    targetLanguages: category.targetLanguages,
    availableLanguages: category.availableLanguages,
  });
  
  try {
    const translationsData = await getCategoryTranslations(category.id);
    
    console.log('📦 Translations data from API:', {
      rawResponse: translationsData,
      isArray: Array.isArray(translationsData),
      length: Array.isArray(translationsData) ? translationsData.length : 0,
      firstItem: Array.isArray(translationsData) && translationsData.length > 0 ? translationsData[0] : null,
    });
    
    if (Array.isArray(translationsData) && translationsData.length > 0) {
      setTranslations(translationsData);
      console.log(`✅ Loaded ${translationsData.length} translations`);
    } else {
      console.log('ℹ️ No translations found or empty array returned');
      setTranslations([]);
      
      // Show helpful message
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
      // Refresh translations
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
      
      // Refresh translations
      if (selectedCategory) {
        const updatedTranslations = await getCategoryTranslations(selectedCategory.id);
        setTranslations(updatedTranslations || []);
      }
    } catch (error: any) {
      message.error(t`Failed to update translation: ${error.message}`);
    }
  };

  // Update your existing handleEdit function
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

  // Update handleSubmit to include translation settings
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

  // Add translation status badge
  const getTranslationStatusBadge = (status: string) => {
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

  // Get language flag/emoji
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

  // Update your table columns to include translation actions
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

    <Card
    
      title={t`Categories Management`}
      extra={
        <Space>
          <div className="mr-4">
            <Button
              type="default"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => window.history.back()}
              className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 hover:-translate-x-1 shadow-sm hover:shadow"
              style={{ 
                padding: '10px 20px', 
                borderRadius: '8px',
                fontWeight: 500 
              }}
            >
              <span className="font-medium text-base">{t`Back`}</span>
            </Button>
          </div>

          <Input
            placeholder={t`Search categories...`}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            disabled={loading}
          >
            {t`New Category`}
          </Button>
        </Space>
      }
    >

     
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
          >
            <Column
              key="sort"
              width={60}
              render={() => <DragOutlined style={{ cursor: 'grab' }} />}
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
                  <span style={{ fontWeight: '500' }}>{text}</span>
                  <Tag color={record.isActive ? 'success' : 'default'}>
                    {record.isActive ? t`Active` : t`Inactive`}
                  </Tag>
                  {record.autoTranslate && (
                    <Tooltip title={t`Auto-translation enabled`}>
                      <GlobalOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  )}
                </Space>
              )}
            />
            <Column
              title={t`Slug`}
              dataIndex="slug"
              key="slug"
              render={(text) => <code>{text}</code>}
            />
            <Column
              title={t`Description`}
              dataIndex="description"
              key="description"
              ellipsis
            />
            <Column
              title={t`Articles`}
              dataIndex="articleCount"
              key="articleCount"
              width={100}
              render={(count) => (
                <Tag color="blue">{count || 0}</Tag>
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
                        <div>
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
              render={(order) => <Tag>#{order}</Tag>}
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
                    />
                  </Tooltip>
                  <Tooltip title={t`Edit`}>
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                      size="small"
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
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              )}
            />
          </Table>
        </SortableContext>
      </DndContext>

      {/* Translations Drawer */}
      <Drawer
        title={
          <Space>
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
                // Trigger retry for failed translations
                const failedTranslations = translations.filter(t => t.status === 'FAILED');
                if (failedTranslations.length > 0) {
                  failedTranslations.forEach(t => handleRegenerateTranslation(t.id));
                }
              }}
              disabled={!translations.some(t => t.status === 'FAILED')}
            >
              {t`Retry Failed`}
            </Button>
          </Space>
        }
      >
        {translationLoading ? (
          <div style={{ textAlign: 'center', padding: 50 }}>
            <SyncOutlined spin style={{ fontSize: 24 }} />
            <div>{t`Loading translations...`}</div>
          </div>
        ) : translations.length === 0 ? (
          <Empty
            description={t`No translations available`}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary"
              onClick={() => {
                if (selectedCategory?.autoTranslate && selectedCategory.targetLanguages) {
                  // Trigger translations
                  message.info(t`Translations will be processed in the background`);
                }
              }}
            >
              {t`Generate Translations`}
            </Button>
          </Empty>
        ) : (
          <Tabs defaultActiveKey="all">
            <TabPane tab={t`All Translations`} key="all">
              <Table
                dataSource={translations}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: true }}
              >
                <Column
                  title={t`Language`}
                  dataIndex="language"
                  key="language"
                  width={100}
                  render={(language) => (
                    <Space>
                      <span style={{ fontSize: '18px' }}>{getLanguageFlag(language)}</span>
                      <Tag>{language.toUpperCase()}</Tag>
                    </Space>
                  )}
                />
                <Column
                  title={t`Name`}
                  dataIndex="name"
                  key="name"
                  ellipsis
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
                      <Badge status="warning" text={t`Needs Review`} />
                    ) : (
                      <Badge status="success" text={t`Reviewed`} />
                    )
                  )}
                />
                <Column
                  title={t`Updated`}
                  dataIndex="updatedAt"
                  key="updatedAt"
                  width={120}
                  render={(date) => new Date(date).toLocaleDateString()}
                />
                <Column
                  title={t`Actions`}
                  key="actions"
                  width={100}
                  fixed="right"
                  render={(_: any, record: CategoryTranslation) => (
                    <Dropdown menu={translationActionsMenu(record)} trigger={['click']}>
                      <Button type="text" icon={<MoreOutlined />} size="small" />
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
                  action={
                    <Button size="small" type="text">
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
                >
                  <Column
                    title={t`Language`}
                    dataIndex="language"
                    key="language"
                    render={(language) => (
                      <Space>
                        <span style={{ fontSize: '18px' }}>{getLanguageFlag(language)}</span>
                        <Text strong>{language.toUpperCase()}</Text>
                      </Space>
                    )}
                  />
                  <Column
                    title={t`Current Translation`}
                    key="content"
                    render={(_: any, record: CategoryTranslation) => (
                      <div>
                        <Paragraph strong>{record.name}</Paragraph>
                        {record.description && (
                          <Paragraph type="secondary">
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
                        >
                          {t`Approve`}
                        </Button>
                        <Button
                          icon={<EditFilled />}
                          onClick={() => handleEditTranslation(record)}
                          size="small"
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
                />
              ) : (
                <Table
                  dataSource={translations.filter(t => t.status === 'FAILED')}
                  rowKey="id"
                  pagination={false}
                  size="small"
                >
                  <Column
                    title={t`Language`}
                    dataIndex="language"
                    key="language"
                    render={(language) => (
                      <Tag color="red">{language.toUpperCase()}</Tag>
                    )}
                  />
                  <Column
                    title={t`Last Attempt`}
                    dataIndex="updatedAt"
                    key="updatedAt"
                    render={(date) => new Date(date).toLocaleString()}
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
          <Card size="small" style={{ marginTop: 20 }}>
            <Row gutter={16}>
              <Col span={6}>
                <AntdStatistic
                  title={t`Total`}
                  value={translations.length}
                  prefix={<GlobalOutlined />}
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Completed`}
                  value={translations.filter(t => t.status === 'COMPLETED').length}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Needs Review`}
                  value={translations.filter(t => t.needsReview).length}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ExclamationCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <AntdStatistic
                  title={t`Failed`}
                  value={translations.filter(t => t.status === 'FAILED').length}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        )}
      </Drawer>

      {/* Edit Translation Modal */}
      <Modal
        title={
          <Space>
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
            />
          </Form.Item>
          
          <Divider />
          
          <Alert
            message={t`Original English`}
            description={
              <div>
                <Paragraph strong>{selectedCategory?.name}</Paragraph>
                {selectedCategory?.description && (
                  <Paragraph type="secondary">
                    {selectedCategory.description}
                  </Paragraph>
                )}
              </div>
            }
            type="info"
            showIcon
          />
        </Form>
      </Modal>

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
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            color: '#1890ff',
            isActive: true,
            autoTranslate: editingCategory?.autoTranslate !== false, // Add this
            targetLanguages: editingCategory?.targetLanguages || ['fr'], // Add this
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
            />
          </Form.Item>

          <Form.Item
            label={t`Auto-Translate`}
            name="autoTranslate"
            valuePropName="checked"
          >
            <Switch disabled={loading} />
          </Form.Item>

          {/* Use conditional rendering instead of direct form.getFieldValue */}
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
            <Switch disabled={loading} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CategoriesManagement;