// components/ArticleAdminNavbar.tsx - PROFESSIONAL VERSION
import React from 'react';
import { Card, Button, Space, Tag } from 'antd';
import { 
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  FolderOutlined,
  TranslationOutlined,
  SettingOutlined,
  EditOutlined,
  EyeOutlined,
  UnorderedListOutlined,
  ScheduleOutlined
} from '@ant-design/icons';

interface ArticleAdminNavbarProps {
  currentPath?: string;
  title?: string;
}

const ArticleAdminNavbar: React.FC<ArticleAdminNavbarProps> = ({ 
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/',
  title = 'Article Admin'
}) => {
  
  const navItems = [
    { 
      key: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardOutlined />,
      path: '/dashboard/article-admin'
    },
    { 
      key: 'articles',
      label: 'All Articles',
      icon: <FileTextOutlined />,
      path: '/dashboard/article-admin/articles'
    },
    { 
      key: 'new-article',
      label: 'New Article',
      icon: <PlusOutlined />,
      path: '/dashboard/article-admin/articles/new'
    },
    { 
      key: 'drafts',
      label: 'Drafts',
      icon: <EditOutlined />,
      path: '/dashboard/article-admin/articles/drafts'
    },
    { 
      key: 'scheduled',
      label: 'Scheduled',
      icon: <ScheduleOutlined />,
      path: '/dashboard/article-admin/articles/scheduled'
    },
    { 
      key: 'categories',
      label: 'Categories',
      icon: <FolderOutlined />,
      path: '/dashboard/article-admin/categories'
    },
    { 
      key: 'translations',
      label: 'Translations',
      icon: <TranslationOutlined />,
      path: '/dashboard/article-admin/translations'
    },
    { 
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      path: '/dashboard/article-admin/settings'
    },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard/article-admin' && currentPath === '/dashboard/article-admin') {
      return true;
    }
    if (path !== '/dashboard/article-admin' && currentPath.startsWith(path)) {
      return true;
    }
    return false;
  };

  const handleNavigation = (path: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
  };

  return (
    <Card 
      style={{ 
        marginBottom: 24,
        backgroundColor: '#f0f9ff',
        borderLeft: '4px solid #1890ff',
        borderRadius: '8px'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: '#1890ff', fontWeight: 600, fontSize: '16px' }}>
          {title}
        </h3>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => handleNavigation('/dashboard/article-admin/articles/new')}
          >
            New Article
          </Button>
        </Space>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.key}
              type={active ? 'primary' : 'default'}
              icon={item.icon}
              onClick={() => handleNavigation(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {item.label}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default ArticleAdminNavbar;