// components/articles/ClapButton.tsx
import React, { useState, useEffect } from 'react';
import { Button, Popover, Space, Typography } from 'antd';
import { LikeOutlined, LikeFilled } from '@ant-design/icons';

const { Text } = Typography;

interface ClapButtonProps {
  count: number;
  onClap: (count: number) => void;
  showCount?: boolean;
  size?: 'small' | 'middle' | 'large';
}

const ClapButton: React.FC<ClapButtonProps> = ({
  count,
  onClap,
  showCount = true,
  size = 'middle',
}) => {
  const [clapped, setClapped] = useState(false);
  const [clapCount, setClapCount] = useState(count);
  const [clapAmount, setClapAmount] = useState(1);
  const [showClapOptions, setShowClapOptions] = useState(false);

  const handleClap = (amount: number) => {
    if (!clapped) {
      setClapped(true);
      setClapCount(prev => prev + amount);
      onClap(amount);
      
      // Auto-hide popover after clap
      setTimeout(() => {
        setShowClapOptions(false);
      }, 1000);
    }
  };

  const clapOptions = [1, 3, 5, 10, 25, 50];

  const content = (
    <div style={{ padding: '8px 0' }}>
      <Space direction="vertical" size="small">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          Clap multiple times
        </Text>
        <Space wrap>
          {clapOptions.map(option => (
            <Button
              key={option}
              type={clapAmount === option ? 'primary' : 'default'}
              size="small"
              onClick={() => {
                setClapAmount(option);
                handleClap(option);
              }}
              disabled={clapped}
            >
              {option} 👏
            </Button>
          ))}
        </Space>
      </Space>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={showClapOptions}
      onOpenChange={setShowClapOptions}
      placement="bottom"
    >
      <Button
        type="text"
        icon={clapped ? <LikeFilled style={{ color: '#1890ff' }} /> : <LikeOutlined />}
        size={size}
        style={{ position: 'relative' }}
        onClick={() => {
          if (!clapped) {
            handleClap(clapAmount);
          }
        }}
      >
        {showCount && (
          <span style={{ marginLeft: 8 }}>{clapCount.toLocaleString()}</span>
        )}
        
        {/* Animated clap effect */}
        {clapped && (
          <span
            style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: '20px',
              animation: 'clapAnimation 0.5s ease-out',
            }}
          >
            👏
          </span>
        )}
        
        <style>
          {`
            @keyframes clapAnimation {
              0% {
                opacity: 0;
                transform: translateX(-50%) translateY(0) scale(0.5);
              }
              50% {
                opacity: 1;
                transform: translateX(-50%) translateY(-20px) scale(1.2);
              }
              100% {
                opacity: 0;
                transform: translateX(-50%) translateY(-40px) scale(1);
              }
            }
          `}
        </style>
      </Button>
    </Popover>
  );
};

export default ClapButton;