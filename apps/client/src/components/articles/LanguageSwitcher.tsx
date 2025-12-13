// components/articles/LanguageSwitcher.tsx
import React from 'react';
import { Button, Dropdown, Space, Tooltip, Badge } from 'antd';
import { GlobalOutlined, CheckOutlined, SyncOutlined } from '@ant-design/icons';

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: string[];
  onChange: (language: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  availableLanguages,
  onChange,
}) => {
  const getLanguageInfo = (code: string) => {
    const languages: Record<string, { name: string; flag: string; status?: string }> = {
      en: { name: 'English', flag: '🇺🇸', status: 'original' },
      fr: { name: 'French', flag: '🇫🇷' },
      es: { name: 'Spanish', flag: '🇪🇸' },
      de: { name: 'German', flag: '🇩🇪' },
      pt: { name: 'Portuguese', flag: '🇵🇹' },
      ar: { name: 'Arabic', flag: '🇸🇦' },
      zh: { name: 'Chinese', flag: '🇨🇳' },
      ru: { name: 'Russian', flag: '🇷🇺' },
      ja: { name: 'Japanese', flag: '🇯🇵' },
      hi: { name: 'Hindi', flag: '🇮🇳' },
    };

    return languages[code] || { name: code.toUpperCase(), flag: '🌐' };
  };

  const menuItems = availableLanguages.map(lang => {
    const info = getLanguageInfo(lang);
    return {
      key: lang,
      label: (
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <span style={{ fontSize: '18px' }}>{info.flag}</span>
            <span>{info.name}</span>
          </Space>
          {lang === currentLanguage && <CheckOutlined style={{ color: '#52c41a' }} />}
          {info.status === 'original' && (
            <Badge dot size="small" style={{ backgroundColor: '#1890ff' }} />
          )}
        </Space>
      ),
      onClick: () => onChange(lang),
    };
  });

  const currentInfo = getLanguageInfo(currentLanguage);

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button 
        type="default" 
        icon={<GlobalOutlined />}
        style={{ 
          borderRadius: '20px',
          padding: '4px 16px',
          height: 'auto',
        }}
      >
        <Space>
          <span style={{ fontSize: '16px' }}>{currentInfo.flag}</span>
          <span>{currentInfo.name}</span>
          {currentLanguage !== 'en' && availableLanguages.includes('en') && (
            <Tooltip title="View original English version">
              <Button 
                type="text" 
                size="small" 
                style={{ fontSize: '12px', padding: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('en');
                }}
              >
                Original
              </Button>
            </Tooltip>
          )}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;