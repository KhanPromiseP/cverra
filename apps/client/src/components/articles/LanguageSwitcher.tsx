// components/articles/LanguageSwitcher.tsx
import React from 'react';
import { Button, Dropdown, Space, Tooltip, Badge, Modal } from 'antd';
import { GlobalOutlined, CheckOutlined, SyncOutlined } from '@ant-design/icons';
import { t, Trans } from "@lingui/macro"; // Added Lingui macro

interface LanguageSwitcherProps {
  currentLanguage: string;
  availableLanguages: string[];
  onChange: (language: string) => void;
  isMobile?: boolean;
  isLoading?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  currentLanguage,
  availableLanguages,
  onChange,
  isMobile = false,
  isLoading = false,
}) => {
  const [showMobileModal, setShowMobileModal] = React.useState(false);

  const getLanguageInfo = (code: string) => {
    const languages: Record<string, { name: string; flag: string; status?: string }> = {
      en: { name: t`English`, flag: '🇺🇸', status: 'original' },
      fr: { name: t`French`, flag: '🇫🇷' },
      es: { name: t`Spanish`, flag: '🇪🇸' },
      de: { name: t`German`, flag: '🇩🇪' },
      pt: { name: t`Portuguese`, flag: '🇵🇹' },
      ar: { name: t`Arabic`, flag: '🇸🇦' },
      zh: { name: t`Chinese`, flag: '🇨🇳' },
      ru: { name: t`Russian`, flag: '🇷🇺' },
      ja: { name: t`Japanese`, flag: '🇯🇵' },
      hi: { name: t`Hindi`, flag: '🇮🇳' },
    };

    return languages[code] || { name: code.toUpperCase(), flag: '🌐' };
  };

  // For mobile: show a modal instead of dropdown
  if (isMobile) {
    const currentInfo = getLanguageInfo(currentLanguage);
    
    return (
      <>
        <button
          onClick={() => setShowMobileModal(true)}
          className="flex items-center justify-between w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
        >
          <div className="flex items-center gap-2">
            <GlobalOutlined />
            <span><Trans>Language</Trans></span>
          </div>
          <div className="flex items-center gap-1">
            <span>{currentInfo.flag}</span>
            <span className="text-sm text-gray-500">{currentInfo.name}</span>
            {isLoading && <SyncOutlined spin className="ml-1 text-blue-500" />}
          </div>
        </button>

        <Modal
          title={t`Select Language`}
          open={showMobileModal}
          onCancel={() => setShowMobileModal(false)}
          footer={null}
          className="sm:hidden"
          width="90%"
          centered
        >
          <div className="space-y-4">
            {/* Current Language */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">
                <Trans>Current Language</Trans>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getLanguageInfo(currentLanguage).flag}</span>
                <div>
                  <div className="font-semibold">{getLanguageInfo(currentLanguage).name}</div>
                  <div className="text-sm text-gray-500">
                    <Trans>Active</Trans>
                  </div>
                </div>
                <CheckOutlined className="ml-auto text-green-500 text-lg" />
              </div>
            </div>

            {/* Available Languages */}
            <div className="space-y-2">
              {availableLanguages.map(lang => {
                const info = getLanguageInfo(lang);
                return (
                  <button
                    key={lang}
                    onClick={() => {
                      onChange(lang);
                      setShowMobileModal(false);
                    }}
                    disabled={isLoading || lang === currentLanguage}
                    className={`flex items-center justify-between w-full p-3 rounded-lg ${
                      lang === currentLanguage
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{info.flag}</span>
                      <span className="font-medium">{info.name}</span>
                      {info.status === 'original' && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          <Trans>Original</Trans>
                        </span>
                      )}
                    </div>
                    {lang === currentLanguage && (
                      <CheckOutlined className="text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-4">
                <SyncOutlined spin className="text-blue-500 text-xl mb-2" />
                <div className="text-sm text-gray-500">
                  <Trans>Switching language...</Trans>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </>
    );
  }

  // For desktop: use dropdown
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
      disabled={isLoading}
    >
      <Button 
        type="default" 
        icon={<GlobalOutlined />}
        style={{ 
          borderRadius: '20px',
          padding: '4px 16px',
          height: 'auto',
        }}
        loading={isLoading}
      >
        <Space>
          <span style={{ fontSize: '16px' }}>{currentInfo.flag}</span>
          <span>{currentInfo.name}</span>
          {currentLanguage !== 'en' && availableLanguages.includes('en') && (
            <Tooltip title={t`View original English version`}>
              <Button 
                type="text" 
                size="small" 
                style={{ fontSize: '12px', padding: 0 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('en');
                }}
                disabled={isLoading}
              >
                <Trans>Original</Trans>
              </Button>
            </Tooltip>
          )}
        </Space>
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;