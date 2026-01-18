import { t, Trans } from "@lingui/macro";
import React from 'react';
import { Modal, Button, Typography, Space, Divider } from 'antd';
import { 
  HeartOutlined, 
  CommentOutlined,
  BookOutlined,
  StarOutlined,
  LoginOutlined,
  UserAddOutlined,
  TranslationOutlined,
  LockOutlined,
  CrownOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface AuthModalProps {
  visible: boolean;
  onCancel: () => void;
  action: 'like' | 'comment' | 'save' | 'premium' | 'share' | 'reply' | 'translate' | string;
  actionLabel?: string;
  articleTitle?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  visible,
  onCancel,
  action,
  actionLabel,
  articleTitle
}) => {
  // Get the FULL current URL with query parameters and hash
  const getFullRedirectUrl = (): string => {
    // Get current URL with all components
    const currentUrl = window.location.href;
    
    // Alternative: Construct it manually to ensure it's clean
    const { pathname, search, hash } = window.location;
    const fullUrl = `${pathname}${search}${hash}`;
    
    console.log('🔗 AuthModal redirect URL:', {
      href: window.location.href,
      pathname,
      search,
      hash,
      fullUrl
    });
    
    return encodeURIComponent(fullUrl);
  };
  
  // Action-specific content with proper theming
  const getActionContent = () => {
    const redirectUrl = getFullRedirectUrl();
    
    const baseConfig = {
      loginRedirect: `/auth/login?redirect=${redirectUrl}`,
      registerRedirect: `/auth/register?redirect=${redirectUrl}`
    };
    
    switch (action) {
      case 'like':
        return {
          ...baseConfig,
          icon: <HeartOutlined />,
          iconColor: 'text-red-500 dark:text-red-400',
          iconBg: 'bg-red-50 dark:bg-red-900/30',
          title: t`Like this article?`,
          description: t`Sign in to show your appreciation and help others discover great content.`,
          cta: t`Like`,
        };
      case 'comment':
        return {
          ...baseConfig,
          icon: <CommentOutlined />,
          iconColor: 'text-blue-500 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-900/30',
          title: t`Join the conversation`,
          description: t`Sign in to share your thoughts and engage with the community.`,
          cta: t`Comment`,
        };
      case 'reply':
        return {
          ...baseConfig,
          icon: <CommentOutlined />,
          iconColor: 'text-green-500 dark:text-green-400',
          iconBg: 'bg-green-50 dark:bg-green-900/30',
          title: t`Reply to comment`,
          description: t`Sign in to continue the discussion and share your perspective.`,
          cta: t`Reply`,
        };
      case 'save':
        return {
          ...baseConfig,
          icon: <BookOutlined />,
          iconColor: 'text-green-500 dark:text-green-400',
          iconBg: 'bg-green-50 dark:bg-green-900/30',
          title: t`Save for later`,
          description: t`Sign in to bookmark this article and access it anytime from your library.`,
          cta: t`Save`,
        };
      case 'premium':
        return {
          ...baseConfig,
          icon: <CrownOutlined />,
          iconColor: 'text-purple-500 dark:text-purple-400',
          iconBg: 'bg-purple-50 dark:bg-purple-900/30',
          title: t`Premium Content`,
          description: t`Sign in to access premium articles with exclusive insights and expert analysis.`,
          cta: t`Unlock Premium`,
        };
      case 'translate':
        return {
          ...baseConfig,
          icon: <TranslationOutlined />,
          iconColor: 'text-blue-500 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-900/30',
          title: t`Request Translation`,
          description: t`Sign in to request article translations. Access knowledge in your own native preferred language.`,
          cta: t`Request Translation`,
        };
      case 'share':
        return {
          ...baseConfig,
          icon: <LoginOutlined />,
          iconColor: 'text-blue-500 dark:text-blue-400',
          iconBg: 'bg-blue-50 dark:bg-blue-900/30',
          title: t`Share Article`,
          description: t`Sign in to share this article with your network.`,
          cta: t`Share`,
        };
      default:
        return {
          ...baseConfig,
          icon: <LockOutlined />,
          iconColor: 'text-gray-500 dark:text-gray-400',
          iconBg: 'bg-gray-50 dark:bg-gray-800',
          title: t`Sign in required`,
          description: actionLabel 
            ? t`Sign in to ${actionLabel} this article.` 
            : t`Sign in to continue.`,
          cta: actionLabel || t`Continue`,
        };
    }
  };

  const actionContent = getActionContent();

  // Handle redirect with proper logging
  const handleRedirect = (url: string) => {
    console.log('🔗 Redirecting to:', url);
    
    // You can also store the current scroll position if needed
    const scrollPosition = window.scrollY;
    sessionStorage.setItem('scrollPosition', scrollPosition.toString());
    
    // Store the exact URL for post-login redirect
    localStorage.setItem('postLoginRedirect', window.location.href);
    
    window.location.href = url;
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={460}
      centered
      className="auth-modal"
      styles={{
        content: {
          backgroundColor: 'var(--modal-bg, #ffffff)',
          borderRadius: '12px',
          padding: '24px',
        },
        header: {
          borderBottom: 'none',
          paddingBottom: 0,
        },
        body: {
          padding: 0,
        }
      }}
      classNames={{
        content: '!bg-white dark:!bg-gray-900 !p-6',
        header: '!border-b-0 !pb-0 !bg-white dark:!bg-gray-900',
        body: '!p-0',
      }}
    >
      <div className="text-center">
        {/* Icon with dynamic background */}
        <div className="mb-6 flex justify-center">
          <div 
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${actionContent.iconBg}`}
          >
            <div className={`text-2xl ${actionContent.iconColor}`}>
              {actionContent.icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <Title 
          level={3} 
          className="!mb-3 text-gray-900 dark:text-white"
        >
          {actionContent.title}
        </Title>

        {/* Description */}
        <Paragraph 
          className="mb-6 text-gray-600 dark:text-gray-300"
        >
          {actionContent.description}
          {articleTitle && (
            <Text 
              className="block mt-3 px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              "{articleTitle}"
            </Text>
          )}
        </Paragraph>

        {/* Buttons */}
        <div className="space-y-3 mb-6">
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            onClick={() => handleRedirect(actionContent.loginRedirect)}
            className="h-11 font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border-blue-600 dark:border-blue-500"
          >
            {t`Sign In`}
          </Button>

          <Button
            type="default"
            size="large"
            block
            icon={<UserAddOutlined />}
            onClick={() => handleRedirect(actionContent.registerRedirect)}
            className="h-11 font-medium text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {t`Create Account`}
          </Button>

          <Button
            type="link"
            size="small"
            onClick={onCancel}
            className="mt-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t`Continue as guest`}
          </Button>
        </div>

        {/* Footer Note */}
        <div 
          className="pt-4 border-t border-gray-200 dark:border-gray-700"
        >
          <Text 
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {t`By signing in, you agree to our`}{' '}
            <a 
              href="/terms-of-service" 
              className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300"
              onClick={(e) => {
                e.preventDefault();
                // Store current URL before navigating to ToS
                localStorage.setItem('preTosRedirect', window.location.href);
                window.location.href = '/terms-of-service';
              }}
            >
              {t`Terms`}
            </a>{' '}
            {t`and`}{' '}
            <a 
              href="/privacy-policy" 
              className="text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 dark:hover:text-blue-300"
              onClick={(e) => {
                e.preventDefault();
                // Store current URL before navigating to Privacy Policy
                localStorage.setItem('prePrivacyRedirect', window.location.href);
                window.location.href = '/privacy-policy';
              }}
            >
              {t`Privacy Policy`}
            </a>
          </Text>
        </div>
      </div>

      {/* Add custom styles for better theming */}
      <style>{`
        /* Modal overlay */
        .auth-modal .ant-modal-mask {
          background-color: rgba(0, 0, 0, 0.45);
        }
        
        /* Dark mode modal overlay */
        .dark .auth-modal .ant-modal-mask {
          background-color: rgba(0, 0, 0, 0.65);
        }
        
        /* Modal content */
        .auth-modal .ant-modal-content {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid;
          border-color: #e5e7eb;
        }
        
        /* Dark mode modal content */
        .dark .auth-modal .ant-modal-content {
          border-color: #374151;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
        }
        
        /* Modal close button */
        .auth-modal .ant-modal-close {
          color: #6b7280;
        }
        
        .auth-modal .ant-modal-close:hover {
          color: #374151;
        }
        
        /* Dark mode close button */
        .dark .auth-modal .ant-modal-close {
          color: #9ca3af;
        }
        
        .dark .auth-modal .ant-modal-close:hover {
          color: #d1d5db;
        }
        
        /* Link button hover fix */
        .auth-modal .ant-btn-link:hover {
          background-color: transparent !important;
        }
        
        /* Button focus states */
        .auth-modal .ant-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .dark .auth-modal .ant-btn:focus {
          outline-color: #60a5fa;
        }
      `}</style>
    </Modal>
  );
};

export default AuthModal;