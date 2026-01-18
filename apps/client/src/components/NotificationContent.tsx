// components/NotificationContent.tsx
import React, { useState } from 'react';
import { Typography,  Tag, Space, Button } from 'antd';
import { t } from '@lingui/macro';
import { useNavigate } from 'react-router';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';

interface NotificationContentProps {
  notification: any;
  isDarkMode: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (e: React.MouseEvent) => void;
  isPreview?: boolean; // For preview mode in dropdown
}

export const NotificationContent: React.FC<NotificationContentProps> = ({ 
  notification, 
  isDarkMode,
  isExpanded = false,
  onToggleExpand,
  isPreview = false
}) => {
  const navigate = useNavigate();
  const metadata = notification.data || {};
  const tips = metadata.tips || [];
  const features = metadata.features || [];
  const actions = metadata.actions || [];
  const coins = metadata.coins;


  const { Text } = Typography;
  
  const handleActionClick = (url?: string) => {
    if (!url) return;
    if (url.startsWith('/')) {
      navigate(url);
    } else if (url.startsWith('http')) {
      window.open(url, '_blank');
    }
  };

  // For preview mode, show limited content
  if (isPreview && !isExpanded) {
    return (
      <div className="space-y-1">
        <Text strong style={{ fontSize: '14px', display: 'block', color: isDarkMode ? '#ffffffd9' : '#000000' }}>
          {notification.title}
        </Text>
        <Text style={{ 
          fontSize: '12px', 
          display: 'block',
          color: isDarkMode ? '#ffffffa6' : '#666666',
          lineHeight: 1.4
        }}>
          {notification.message}
        </Text>
        
        {/* Show expand button if there's rich content */}
        {(tips.length > 0 || features.length > 0 || coins || actions.length > 0) && (
          <Button
            type="link"
            size="small"
            onClick={onToggleExpand}
            className="p-0 h-auto text-xs"
            icon={isExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
          >
            {isExpanded ? t`Show less` : t`Show more`}
          </Button>
        )}
      </div>
    );
  }

  // Full expanded content
  return (
    <div className="space-y-3">
      {/* Title */}
      <Text strong style={{ fontSize: '15px', display: 'block', color: isDarkMode ? '#ffffffd9' : '#000000' }}>
        {notification.title}
      </Text>
      
      {/* Message */}
      {notification.message && (
        <Text style={{ 
          fontSize: '13px', 
          display: 'block',
          color: isDarkMode ? '#ffffffa6' : '#666666',
          lineHeight: 1.4
        }}>
          {notification.message}
        </Text>
      )}
      
      {/* Expand/Collapse button for rich content */}
      {(tips.length > 0 || features.length > 0 || coins || actions.length > 0) && onToggleExpand && (
        <Button
          type="link"
          size="small"
          onClick={onToggleExpand}
          className="p-0 h-auto text-xs flex items-center gap-1"
        >
          {isExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
          {isExpanded ? t`Show less` : t`Show details`}
        </Button>
      )}
      
      {/* Expanded content (only shown when expanded) */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          {/* Tips Section */}
          {metadata.type === 'TIPS' && tips.length > 0 && (
            <div className="mt-2">
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                <strong>📋 Essential Tips:</strong>
              </Text>
              <ul className="space-y-2 pl-4">
                {tips.map((tip: string, index: number) => (
                  <li key={index} className="text-sm" style={{ color: isDarkMode ? '#ffffffa6' : '#666666' }}>
                    <span className="mr-2">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Features Section */}
          {metadata.type === 'FEATURE_INTRO' && features.length > 0 && (
            <div className="mt-2">
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 8 }}>
                <strong>✨ Core Features:</strong>
              </Text>
              <div className="space-y-3">
                {features.map((feature: any, index: number) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-base mt-0.5">{feature.icon}</span>
                    <div>
                      <Text strong className="text-sm block">
                        {feature.name}
                      </Text>
                      <Text type="secondary" className="text-xs block">
                        {feature.description}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Bonus Coins */}
          {metadata.type === 'BONUS_AWARDED' && coins && (
            <div className="mt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" 
                   style={{ 
                     backgroundColor: isDarkMode ? 'rgba(250, 173, 20, 0.2)' : 'rgba(250, 173, 20, 0.1)',
                     border: `1px solid ${isDarkMode ? 'rgba(250, 173, 20, 0.3)' : 'rgba(250, 173, 20, 0.2)'}`
                   }}>
                <span className="text-lg">💰</span>
                <Text strong className="text-sm" style={{ color: '#faad14' }}>
                  +{coins} bonus coins awarded
                </Text>
              </div>
              {metadata.expiration && (
                <Text type="secondary" className="text-xs block mt-1">
                  Expires: {metadata.expiration}
                </Text>
              )}
            </div>
          )}
          
          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {actions.map((action: any, index: number) => (
                  <Button
                    key={index}
                    type="default"
                    size="small"
                    onClick={() => handleActionClick(action.url)}
                    className="flex items-center gap-1"
                    style={{ 
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <span>{action.icon}</span>
                    <span>{action.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};