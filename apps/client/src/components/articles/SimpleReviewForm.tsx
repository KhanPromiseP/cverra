// src/components/article/SimpleReviewForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Rate, 
  Typography, 
  Space,
  Alert,
  Progress,
  notification
} from 'antd';
import { 
  StarOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useLingui } from '@lingui/react';
import { t } from '@lingui/macro';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SimpleReviewFormProps {
  articleId: string;
  articleTitle?: string;
  onSubmit: (values: any) => Promise<void>;
  onCancel?: () => void;
  initialValues?: any;
  isEditing?: boolean;
}

const SimpleReviewForm: React.FC<SimpleReviewFormProps> = ({
  articleId,
  articleTitle,
  onSubmit,
  onCancel,
  initialValues,
  isEditing = false
}) => {
  const [form] = Form.useForm();
  const [insightLength, setInsightLength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const insightText = Form.useWatch('insightText', form);

  useEffect(() => {
    setInsightLength(insightText?.length || 0);
  }, [insightText]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Review submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInsightQuality = () => {
    if (insightLength < 100) {
      return {
        color: '#fa541c',
        text: t`Need more depth (min 100 characters)`,
        progress: (insightLength / 100) * 100,
        remaining: 100 - insightLength
      };
    } else if (insightLength < 200) {
      return {
        color: '#faad14',
        text: t`Good insight, can be even more detailed`,
        progress: 100,
        remaining: 0
      };
    } else {
      return {
        color: '#52c41a',
        text: t`Excellent depth!`,
        progress: 100,
        remaining: 0
      };
    }
  };

  const quality = getInsightQuality();

  return (
    <div className="simple-review-form">
      {/* Article Context */}
      {articleTitle && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <Text type="secondary" className="text-sm block mb-1">
            {t`Reviewing:`}
          </Text>
          <Text strong className="text-lg">
            {articleTitle}
          </Text>
        </div>
      )}

      {/* Review Prompt */}
      <div className="mb-6 text-center">
        <Title level={4} className="!mb-2">
          {t`Share Your Professional Insight`}
        </Title>
        <Text type="secondary">
          {t`Your review helps other professionals make informed decisions`}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={initialValues || {
          rating: 0,
          insightText: ''
        }}
      >
        {/* Rating */}
        <Form.Item
          name="rating"
          label={
            <Space>
              <StarOutlined className="text-yellow-500" />
              <Text strong>{t`Rate this article`}</Text>
            </Space>
          }
          rules={[{ required: true, message: t`Please rate the article` }]}
        >
          <Rate 
            allowHalf 
            tooltips={[
              t`Poor`, 
              t`Fair`, 
              t`Good`, 
              t`Very Good`, 
              t`Excellent`
            ]}
            className="text-2xl"
          />
        </Form.Item>

        {/* Insight Text */}
        <Form.Item
          name="insightText"
          label={
            <Space direction="vertical" size={2}>
              <Text strong>{t`What professional insight did you gain?`}</Text>
              <Text type="secondary" className="text-sm">
                {t`Minimum 100 characters — be specific and valuable`}
              </Text>
            </Space>
          }
          rules={[
            { required: true, message: t`Please share your insight` },
            { min: 100, message: t`Insight must be at least 100 characters` }
          ]}
        >
          <TextArea
            rows={4}
            placeholder={t`Example: "The framework for analyzing market trends provided a new perspective on how to evaluate competitor movements. I plan to apply the 3-step methodology in my next quarterly review."`}
            showCount
            maxLength={1000}
            className="text-base"
            autoFocus
          />
        </Form.Item>

        {/* Insight Quality Indicator */}
        {insightLength > 0 && (
          <div className="mb-6 px-2">
            <div className="flex justify-between items-center mb-1">
              <Text type="secondary" className="text-sm">{t`Insight Depth`}</Text>
              <Text style={{ color: quality.color }} className="text-sm font-medium">
                {insightLength < 100 
                  ? t`${quality.remaining} more characters needed` 
                  : t`✓ Meets requirement`}
              </Text>
            </div>
            <Progress 
              percent={quality.progress}
              strokeColor={quality.color}
              showInfo={false}
              size="small"
            />
            <Text type="secondary" className="text-xs mt-1 block">
              {quality.text}
            </Text>
          </div>
        )}

        {/* Tips */}
        <Alert
          type="info"
          icon={<InfoCircleOutlined />}
          message={t`Tips for a great review`}
          description={
            <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
              <li>{t`Share specific insights you gained`}</li>
              <li>{t`Explain how you'll apply this knowledge`}</li>
              <li>{t`Avoid simple praise like "Great article!"`}</li>
            </ul>
          }
          className="mb-6"
        />

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button onClick={onCancel} disabled={isSubmitting}>
              {t`Cancel`}
            </Button>
          )}
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isSubmitting}
            disabled={insightLength < 100}
            className="min-w-[120px]"
            icon={<CheckCircleOutlined />}
          >
            {isEditing ? t`Update Review` : t`Submit Review`}
          </Button>
        </div>
      </Form>

      <style>{`
        .simple-review-form .ant-rate {
          font-size: 32px;
        }
        .simple-review-form .ant-rate-star:not(:last-child) {
          margin-right: 8px;
        }
      `}</style>
    </div>
  );
};

export default SimpleReviewForm;