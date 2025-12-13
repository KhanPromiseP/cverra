import React from 'react';
import { Link, useLocation } from 'react-router';
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon, 
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useUser } from '@/client/services/user';
import { hasRole } from '@/client/types/user';

export const AdminNavigation: React.FC = () => {
  const location = useLocation();
  const { user, loading } = useUser();

  // Only show if user is admin and not loading
  if (loading || !user || !hasRole(user) || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return null;
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: ChartBarIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
    { path: '/admin/subscription-plans', label: 'Subscription Plans', icon: CurrencyDollarIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: DocumentTextIcon },
    { path: '/admin/settings', label: 'Settings', icon: CogIcon },
  ];

  return (
    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
      <h3 className="text-sm font-semibold text-blue-900 mb-3">Admin Panel</h3>
      <div className="flex flex-wrap gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-blue-600 hover:bg-blue-100 hover:text-blue-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
};