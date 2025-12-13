// EditorSwitcher.tsx - Fixed version
import React, { useState, useEffect, useRef } from 'react';
import { Tabs, message } from 'antd';
import { CodeOutlined, EditOutlined } from '@ant-design/icons';
import RichTextEditor, { tiptapToHTML, htmlToTiptap } from './RichTextEditor';
import CodeEditor from './CodeEditor';

const { TabPane } = Tabs;

interface EditorSwitcherProps {
  value?: any;
  onChange?: (content: any) => void;
  disabled?: boolean;
  height?: number;
}

const EditorSwitcher: React.FC<EditorSwitcherProps> = ({
  value,
  onChange,
  disabled,
  height = 500,
}) => {
  const [activeTab, setActiveTab] = useState('wysiwyg');
  const [htmlCache, setHtmlCache] = useState<string>('');
  const hasSwitchedToCode = useRef(false);

  // Update HTML cache when value changes (but only for code tab)
  useEffect(() => {
    if (activeTab === 'code' && value) {
      try {
        console.log('Updating HTML cache from value');
        const html = tiptapToHTML(value);
        setHtmlCache(html || '');
      } catch (error) {
        console.error('Error updating HTML cache:', error);
      }
    }
  }, [value, activeTab]);

  // Convert Tiptap to HTML when switching to code tab
  const handleTabChange = (key: string) => {
    console.log('Switching to tab:', key);
    
    if (key === 'code' && value) {
      try {
        const html = tiptapToHTML(value);
        console.log('Converted HTML length:', html?.length);
        setHtmlCache(html || '');
        hasSwitchedToCode.current = true;
      } catch (error) {
        console.error('Error converting to HTML:', error);
        message.error('Failed to switch to code editor');
        return; // Don't switch tabs if conversion fails
      }
    }
    
    setActiveTab(key);
  };

  // Handle changes from WYSIWYG editor
  const handleWysiwygChange = (content: any) => {
    console.log('WYSIWYG changed:', content);
    if (onChange) {
      onChange(content);
    }
  };

  // Handle changes from Code editor
  const handleCodeChange = (content: any) => {
    console.log('Code editor changed, content type:', typeof content);
    
    try {
      // If content is already Tiptap JSON (from auto-save), use it directly
      if (content && content.type === 'doc') {
        if (onChange) {
          onChange(content);
        }
        return;
      }
      
      // Otherwise, convert HTML to Tiptap
      const htmlString = typeof content === 'string' ? content : String(content || '');
      console.log('Converting HTML to Tiptap, length:', htmlString.length);
      
      const tiptapJson = htmlToTiptap(htmlString);
      
      if (tiptapJson && tiptapJson.type === 'doc') {
        if (onChange) {
          onChange(tiptapJson);
        }
      } else {
        console.warn('Invalid conversion result:', tiptapJson);
      }
    } catch (error) {
      console.error('Error in handleCodeChange:', error);
      message.error('Failed to process content');
    }
  };

  return (
    <div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        type="card"
        tabBarStyle={{ marginBottom: 0 }}
        items={[
          {
            key: 'wysiwyg',
            label: (
              <span>
                <EditOutlined />
                Visual Editor
              </span>
            ),
            children: (
              <div style={{ marginTop: 16 }}>
                <RichTextEditor
                  value={value}
                  onChange={handleWysiwygChange}
                  disabled={disabled}
                />
              </div>
            ),
          },
          {
            key: 'code',
            label: (
              <span>
                <CodeOutlined />
                Code Editor
              </span>
            ),
            children: (
              <div style={{ marginTop: 16 }}>
                <CodeEditor
                  value={value} // Pass current value for initialization
                  onChange={handleCodeChange}
                  disabled={disabled}
                  height={height}
                  showPreview={true}
                  showToolbar={true}
                />
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default EditorSwitcher;