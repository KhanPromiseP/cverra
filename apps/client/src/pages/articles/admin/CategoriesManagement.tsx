// pages/admin/CategoriesManagement.tsx - NO AUTH CHECK VERSION
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
  Tooltip
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  DragOutlined,
  SearchOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getCategories, createCategory, updateCategory, deleteCategory, updateCategoryOrder } from '../../../services/article.service';

const { Column } = Table;

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

  // Fetch categories on component mount - NO AUTH CHECK
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
        } else if (Array.isArray(dataObj.categories)) {
          categoriesData = dataObj.categories;
        } else if (Array.isArray(dataObj.items)) {
          categoriesData = dataObj.items;
        }
      }
      
      setCategories(categoriesData);
      
      if (categoriesData.length === 0) {
        message.info('No categories found. Create your first category!');
      }
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      ...category,
      color: category.color || '#1890ff',
      isActive: category.isActive !== false,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error('Failed to delete category: ' + (error.message || 'Unknown error'));
    }
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
      };
      
      console.log('Transformed data:', categoryData);
      
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryData);
        message.success('Category updated successfully');
      } else {
        await createCategory(categoryData);
        message.success('Category created successfully');
      }
      setModalVisible(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Full error:', error);
      
      // Show error but DON'T redirect
      if (error.message) {
        message.error(`Error: ${error.message}`);
      } else if (error.data?.message) {
        const messages = Array.isArray(error.data.message) 
          ? error.data.message.join(', ')
          : error.data.message;
        message.error(`Error: ${messages}`);
      } else {
        message.error('Failed to save category');
      }
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

  const saveCategoryOrder = async (orderedCategories: Category[]) => {
    try {
      const orderData = orderedCategories.map(cat => ({
        id: cat.id,
        order: cat.order,
      }));
      await updateCategoryOrder(orderData);
      message.success('Category order updated');
    } catch (error: any) {
      console.error('Save order error:', error);
      message.error('Failed to save order: ' + (error.message || 'Unknown error'));
    }
  };

  const viewArticlesByCategory = (slug: string) => {
    window.open(`/articles?category=${slug}`, '_blank');
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card
      title="Categories Management"
      extra={
        <Space>
          <Input
            placeholder="Search categories..."
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
            New Category
          </Button>
        </Space>
      }
    >
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredCategories.map(c => c.id)} strategy={verticalListSortingStrategy}>
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
              title="Category"
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
                    {record.isActive ? 'Active' : 'Inactive'}
                  </Tag>
                </Space>
              )}
            />
            <Column
              title="Slug"
              dataIndex="slug"
              key="slug"
              render={(text) => <code>{text}</code>}
            />
            <Column
              title="Description"
              dataIndex="description"
              key="description"
              ellipsis
            />
            <Column
              title="Articles"
              dataIndex="articleCount"
              key="articleCount"
              width={100}
              render={(count) => (
                <Tag color="blue">{count || 0}</Tag>
              )}
            />
            <Column
              title="Order"
              dataIndex="order"
              key="order"
              width={80}
              render={(order) => <Tag>#{order}</Tag>}
            />
            <Column
              title="Actions"
              key="actions"
              width={120}
              fixed="right"
              render={(_: any, record: Category) => (
                <Space>
                  <Tooltip title="View Articles">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => viewArticlesByCategory(record.slug)}
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    />
                  </Tooltip>
                  <Tooltip title="Delete">
                    <Popconfirm
                      title="Delete Category"
                      description="Are you sure? Articles in this category will become uncategorized."
                      onConfirm={() => handleDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                      icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Tooltip>
                </Space>
              )}
            />
          </Table>
        </SortableContext>
      </DndContext>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        destroyOnHidden={false}
        okText={editingCategory ? 'Update' : 'Create'}
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            color: '#1890ff',
            isActive: true,
          }}
        >
          <Form.Item
            label="Category Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 2, message: 'Name must be at least 2 characters' },
              { max: 50, message: 'Name cannot exceed 50 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., Career Growth, Productivity, etc." 
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[
              { max: 200, message: 'Description cannot exceed 200 characters' }
            ]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Brief description of this category"
              showCount
              maxLength={200}
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Color"
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
                  label: 'Recommended',
                  colors: [
                    '#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#f5222d',
                    '#13c2c2', '#eb2f96', '#faad14', '#a0d911', '#2f54eb'
                  ],
                },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Icon (optional)"
            name="icon"
            extra="Enter an emoji or icon name"
            rules={[
              { max: 20, message: 'Icon cannot exceed 20 characters' }
            ]}
          >
            <Input 
              placeholder="e.g., 📈 or rocket" 
              disabled={loading}
            />
          </Form.Item>

          <Form.Item
            label="Active"
            name="isActive"
            valuePropName="checked"
          >
            <Input 
              type="checkbox" 
              disabled={loading}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CategoriesManagement;