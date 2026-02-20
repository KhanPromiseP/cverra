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
import { useAuthStore } from '@/client/stores/auth'; // Import your auth store

interface ArticleAdminNavbarProps {
  currentPath?: string;
  title?: string;
}

const ArticleAdminNavbar: React.FC<ArticleAdminNavbarProps> = ({ 
  currentPath = typeof window !== 'undefined' ? window.location.pathname : '/',
  title = t`Article Admin`
}) => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Get user from auth store (this is the secure source)
  const { user } = useAuthStore();
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Method 1: Get role from auth store (if available)
        if (user?.role) {
          setUserRole(user.role);
          setLoading(false);
          return;
        }
        
        // Method 2: Fetch role from API as fallback
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role || 'ADMIN');
        } else {
          console.error('Failed to fetch user role');
          setUserRole('ADMIN'); // Fallback, but still not secure
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('ADMIN');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  // Only check for SUPER_ADMIN - regular admins should NOT see super admin features
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  
  // Define all possible navigation items
  const allNavItems = [
    { key: 'dashboard', label: t`Dashboard`, icon: <DashboardOutlined />, path: '/dashboard/article-admin' },
    { key: 'articles', label: t`Articles`, icon: <FileTextOutlined />, path: '/dashboard/article-admin/articles' },
    { key: 'new-article', label: t`New Article`, icon: <PlusOutlined />, path: '/dashboard/article-admin/articles/new' },
    { key: 'drafts', label: t`Drafts`, icon: <EditOutlined />, path: '/dashboard/article-admin/articles/drafts' },
    { key: 'scheduled', label: t`Scheduled`, icon: <ScheduleOutlined />, path: '/dashboard/article-admin/articles/scheduled' },
    { key: 'categories', label: t`Categories`, icon: <FolderOutlined />, path: '/dashboard/article-admin/categories', superAdminOnly: true },
    { key: 'translations', label: t`Translations`, icon: <TranslationOutlined />, path: '/dashboard/article-admin/translations' },
  ];

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => 
    !item.superAdminOnly || (item.superAdminOnly && isSuperAdmin)
  );

  // Log for debugging (remove in production)
  useEffect(() => {
    console.log('Current user role:', userRole);
    console.log('Is super admin:', isSuperAdmin);
    console.log('Filtered nav items:', navItems.map(item => item.key));
  }, [userRole, isSuperAdmin, navItems]);

  const isActive = (path: string) => {
    if (path === '/dashboard/article-admin' && currentPath === '/dashboard/article-admin') return true;
    if (path !== '/dashboard/article-admin' && currentPath.startsWith(path)) return true;
    return false;
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (loading) {
    return (
      <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="flex justify-center items-center h-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

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
          <Tag color={isSuperAdmin ? "purple" : "blue"} className={`
            ${isSuperAdmin ? 'dark:bg-purple-900 dark:text-purple-200' : 'dark:bg-blue-900 dark:text-blue-200'}
            dark:border-opacity-50
          `}>
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