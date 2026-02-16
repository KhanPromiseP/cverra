import { t, Trans } from "@lingui/macro";
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, Button, Space, Tag } from 'antd';
import { 
  DashboardOutlined,
  FileTextOutlined,
  PlusOutlined,
  FolderOutlined,
  TranslationOutlined,
  EditOutlined,
  ScheduleOutlined,
  CrownOutlined
} from '@ant-design/icons';

interface ArticleAdminNavbarProps {
  currentPath?: string;
  title?: string;
}

const ArticleAdminNavbar: React.FC<ArticleAdminNavbarProps> = ({ 
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/',
  title = t`Article Admin`
}) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('ADMIN');
  
  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'ADMIN';
    setUserRole(role);
  }, []);

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  
  // Define all possible navigation items
  const allNavItems = [
    { key: 'dashboard', label: t`Dashboard`, icon: <DashboardOutlined />, path: '/dashboard/article-admin' },
    { key: 'articles', label: t`Articles`, icon: <FileTextOutlined />, path: '/dashboard/article-admin/articles' },
    { key: 'new-article', label: t`New Article`, icon: <PlusOutlined />, path: '/dashboard/article-admin/articles/new' },
    { key: 'drafts', label: t`Drafts`, icon: <EditOutlined />, path: '/dashboard/article-admin/articles/drafts' },
    // { key: 'drafts', label: t`Draft Management`, icon: <FileTextOutlined />, link: '/dashboard/article-admin/drafts',},
    { key: 'scheduled', label: t`Scheduled`, icon: <ScheduleOutlined />, path: '/dashboard/article-admin/articles/scheduled' },
    { key: 'categories', label: t`Categories`, icon: <FolderOutlined />, path: '/dashboard/article-admin/categories', superAdminOnly: true },
    { key: 'translations', label: t`Translations`, icon: <TranslationOutlined />, path: '/dashboard/article-admin/translations' },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => 
    !item.superAdminOnly || (item.superAdminOnly && isSuperAdmin)
  );

  const isActive = (path: string) => {
    if (path === '/dashboard/article-admin' && currentPath === '/dashboard/article-admin') return true;
    if (path !== '/dashboard/article-admin' && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Card className="
      mb-6 
      bg-white dark:bg-gray-800 
      border border-gray-200 dark:border-gray-700
      rounded-lg
      shadow-sm dark:shadow-gray-900
    ">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h3 className="m-0 text-gray-800 dark:text-white font-semibold text-lg">
            {title}
          </h3>
          <Tag color={isSuperAdmin ? "purple" : "blue"} className="
            ${isSuperAdmin ? 'dark:bg-purple-900 dark:text-purple-200' : 'dark:bg-blue-900 dark:text-blue-200'}
            dark:border-opacity-50
          ">
            {isSuperAdmin ? t`Super Admin` : t`Admin`}
          </Tag>
        </div>
        
        <Button 
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleNavigation('/dashboard/article-admin/articles/new')}
          className="
            bg-blue-600 hover:bg-blue-700 
            dark:bg-blue-500 dark:hover:bg-blue-600
            border-0
          "
        >
          {t`New Article`}
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          
          return (
            <Button
              key={item.key}
              type={active ? 'primary' : 'default'}
              icon={item.icon}
              onClick={() => handleNavigation(item.path)}
              className={`
                flex items-center gap-2
                ${active ? 'shadow' : ''}
                ${active ? 
                  'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' : 
                  'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                }
              `}
            >
              {item.label}
              {item.superAdminOnly && (
                <CrownOutlined className="text-yellow-500 dark:text-yellow-400 text-xs ml-1" />
              )}
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default ArticleAdminNavbar;