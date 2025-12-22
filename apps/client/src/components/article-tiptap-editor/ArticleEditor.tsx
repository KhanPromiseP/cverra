import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import { CodeOutlined, EditOutlined } from '@ant-design/icons';
import RichTextEditor from './RichTextEditor';
import { tiptapToHTML, htmlToTiptap } from '../../utils/tiptap-converters';
import CodeEditor from './CodeEditor';

// Define the props interface
interface ArticleEditorProps {
  value: any; // You might want to be more specific here (e.g., `TiptapContent`)
  onChange: (content: any) => void;
  disabled?: boolean;
}

const ArticleEditor: React.FC<ArticleEditorProps> = ({ 
  value, 
  onChange, 
  disabled = false 
}) => {
  const [mode, setMode] = useState<'wysiwyg' | 'code'>('wysiwyg');
  const [htmlCache, setHtmlCache] = useState<string>('');

  const handleModeChange = (newMode: 'wysiwyg' | 'code', html?: string) => {
    if (newMode === 'code') {
      if (html) {
        setHtmlCache(html);
      } else {
        // Convert current content to HTML
        const htmlContent = tiptapToHTML(value || { type: 'doc', content: [] });
        setHtmlCache(htmlContent);
      }
      setMode('code');
    } else {
      setMode('wysiwyg');
    }
  };

  const handleCodeChange = (html: string) => {
    setHtmlCache(html);
    try {
      const tiptapJson = htmlToTiptap(html);
      onChange(tiptapJson);
    } catch (error) {
      console.error('Conversion error:', error);
      message.error('Failed to convert HTML to editor format');
    }
  };

  const handleWysiwygChange = (content: any) => {
    onChange(content);
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type={mode === 'wysiwyg' ? 'primary' : 'default'}
          icon={<EditOutlined />}
          onClick={() => handleModeChange('wysiwyg')}
        >
          Visual Editor
        </Button>
        <Button
          type={mode === 'code' ? 'primary' : 'default'}
          icon={<CodeOutlined />}
          onClick={() => handleModeChange('code')}
        >
          Code Editor
        </Button>
      </Space>

      {mode === 'wysiwyg' ? (
        <RichTextEditor
          value={value}
          onChange={handleWysiwygChange}
          disabled={disabled}
          mode={mode}
          onModeChange={handleModeChange}
        />
      ) : (
        <CodeEditor
          value={value} // Pass Tiptap JSON
          onChange={handleCodeChange}
          disabled={disabled}
          height={500}
          showPreview={true}
          showToolbar={true}
        />
      )}
    </div>
  );
};