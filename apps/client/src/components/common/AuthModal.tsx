// components/common/AuthModal.tsx
import React from 'react';
import { Modal, Button, Typography, Space, Divider } from 'antd';
import { 
  HeartOutlined, 
  CommentOutlined,
  BookOutlined,
  StarOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface AuthModalProps {
  visible: boolean;
  onCancel: () => void;
  action: string; // Changed from specific types to string
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
  // Action-specific content
  const getActionContent = () => {
    const currentPath = window.location.pathname;
    
    switch (action) {
      case 'like':
        return {
          icon: <HeartOutlined className="text-3xl text-red-500" />,
          title: 'Like this article?',
          description: 'Sign in to show your appreciation.',
          cta: 'Like',
          loginRedirect: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
          registerRedirect: `/auth/register?redirect=${encodeURIComponent(currentPath)}`
        };
      case 'comment':
        return {
          icon: <CommentOutlined className="text-3xl text-blue-500" />,
          title: 'Join the conversation',
          description: 'Sign in to share your thoughts.',
          cta: 'Comment',
          loginRedirect: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
          registerRedirect: `/auth/register?redirect=${encodeURIComponent(currentPath)}`
        };
      case 'reply':
        return {
          icon: <CommentOutlined className="text-3xl text-green-500" />,
          title: 'Reply to comment',
          description: 'Sign in to continue the discussion.',
          cta: 'Reply',
          loginRedirect: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
          registerRedirect: `/auth/register?redirect=${encodeURIComponent(currentPath)}`
        };
      case 'save':
        return {
          icon: <BookOutlined className="text-3xl text-green-500" />,
          title: 'Save for later',
          description: 'Sign in to bookmark this article.',
          cta: 'Save',
          loginRedirect: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
          registerRedirect: `/auth/register?redirect=${encodeURIComponent(currentPath)}`
        };
      default:
        return {
          icon: <HeartOutlined className="text-3xl text-primary" />,
          title: 'Sign in required',
          description: `Sign in to ${actionLabel || action} this article.`,
          cta: actionLabel || 'Continue',
          loginRedirect: `/auth/login?redirect=${encodeURIComponent(currentPath)}`,
          registerRedirect: `/auth/register?redirect=${encodeURIComponent(currentPath)}`
        };
    }
  };

  const actionContent = getActionContent();

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={440}
      centered
      className="auth-modal"
    >
      <div className="text-center p-2">
        {/* Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
            {actionContent.icon}
          </div>
        </div>

        {/* Title */}
        <Title level={4} className="!mb-2">
          {actionContent.title}
        </Title>

        {/* Description */}
        <Paragraph className="text-muted-foreground mb-6">
          {actionContent.description}
          {articleTitle && (
            <Text type="secondary" className="block mt-1 text-sm italic">
              "{articleTitle}"
            </Text>
          )}
        </Paragraph>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            type="primary"
            size="large"
            block
            icon={<LoginOutlined />}
            onClick={() => {
              window.location.href = actionContent.loginRedirect;
            }}
            className="h-11"
          >
            Sign In
          </Button>

          <Button
            type="default"
            size="large"
            block
            icon={<UserAddOutlined />}
            onClick={() => {
              window.location.href = actionContent.registerRedirect;
            }}
            className="h-11"
          >
            Create Account
          </Button>

          <Button
            type="link"
            size="small"
            onClick={onCancel}
            className="mt-1"
          >
            Continue as guest
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t">
          <Text type="secondary" className="text-xs">
            By signing in, you agree to our Terms and Privacy Policy
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;