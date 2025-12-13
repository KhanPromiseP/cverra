// CodeEditor.tsx - Fixed version
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Tooltip, 
  Tabs,
  Modal,
  message,
  Divider,
  Select,
  Radio,
  Typography,
  Popover,
  Switch,
  Input
} from 'antd';
import { 
  CodeOutlined,
  Html5Outlined,
  CiOutlined,
  UsbOutlined,
  EyeOutlined,
  SaveOutlined,
  UndoOutlined,
  RedoOutlined,
  FullscreenOutlined,
  FormatPainterOutlined,
  ApiOutlined,
  DatabaseOutlined,
  CopyOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { tiptapToHTML, htmlToTiptap } from './RichTextEditor';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface CodeEditorProps {
  value?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  height?: number;
  language?: 'html' | 'css' | 'javascript';
  showPreview?: boolean;
  showToolbar?: boolean;
}

// Default HTML template
const defaultHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Amazing Article</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #f8f9fa;
    }
    
    .article-container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      margin: 20px 0;
    }
    
    .article-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #1890ff;
    }
    
    .article-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1a1a1a;
      margin-bottom: 10px;
      line-height: 1.2;
    }
    
    .article-meta {
      color: #666;
      font-size: 0.9rem;
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-top: 15px;
    }
    
    .article-content {
      font-size: 1.1rem;
      line-height: 1.8;
    }
    
    .article-content p {
      margin-bottom: 1.5rem;
    }
    
    .article-content h2 {
      font-size: 1.8rem;
      margin: 2.5rem 0 1rem;
      color: #262626;
      border-left: 4px solid #1890ff;
      padding-left: 15px;
    }
    
    .article-content h3 {
      font-size: 1.4rem;
      margin: 2rem 0 0.8rem;
      color: #434343;
    }
    
    .feature-block {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin: 30px 0;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
    }
    
    .call-to-action {
      text-align: center;
      background: #f0f9ff;
      border: 2px dashed #91d5ff;
      border-radius: 12px;
      padding: 30px;
      margin: 40px 0;
    }
    
    .cta-button {
      background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
    }
    
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(82, 196, 26, 0.4);
    }
    
    @media (max-width: 768px) {
      .article-container {
        padding: 20px;
        margin: 10px;
      }
      
      .article-title {
        font-size: 2rem;
      }
    }
  </style>
</head>
<body>
  <div class="article-container">
    <header class="article-header">
      <h1 class="article-title">Create Amazing Content With Full Creative Freedom</h1>
      <div class="article-meta">
        <span>📅 Today</span>
        <span>⏱️ 5 min read</span>
        <span>👁️ 1,234 views</span>
      </div>
    </header>
    
    <article class="article-content">
      <p>Welcome to the future of content creation! With this editor, you have complete control over every pixel, every animation, and every interaction.</p>
      
      <h2>Why This Rocks</h2>
      <p>Traditional editors limit your creativity. This editor sets you free. Write pure HTML, CSS, and JavaScript to create exactly what you envision.</p>
      
      <div class="feature-block">
        <h3 style="color: white; margin-top: 0;">✨ Key Features</h3>
        <ul style="color: rgba(255,255,255,0.9); margin-left: 20px;">
          <li>Full HTML/CSS/JS support</li>
          <li>Real-time preview</li>
          <li>Automatic Tiptap conversion</li>
          <li>Responsive by default</li>
          <li>Beautiful gradients & effects</li>
        </ul>
      </div>
      
      <h2>How It Works</h2>
      <p>Write your content here with all the styling you want. When you save, it automatically converts to Tiptap JSON format for storage. When editing, it converts back to HTML. Magic! ✨</p>
      
      <div class="call-to-action">
        <h3>Ready to Create Something Amazing?</h3>
        <p>Start editing and unleash your creativity!</p>
        <button class="cta-button" onclick="alert('🎉 Your amazing content is saved!')">
          🚀 Publish This Masterpiece
        </button>
      </div>
    </article>
  </div>
  
  <script>
    // Add interactivity if needed
    console.log('Article loaded successfully!');
    
    // Example: Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
  </script>
</body>
</html>`;

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your HTML/CSS/JS here...",
  error,
  disabled = false,
  height = 600,
  language = 'html',
  showPreview = true,
  showToolbar = true
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [code, setCode] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [activeTab, setActiveTab] = useState('code');
  const [conversionMode, setConversionMode] = useState<'auto' | 'manual'>('auto');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');

  // Initialize code from Tiptap JSON - ONLY ONCE on mount
  useEffect(() => {
    console.log('CodeEditor: Initializing with value', value);
    
    if (!isInitialized) {
      if (value) {
        try {
          const html = tiptapToHTML(value);
          console.log('CodeEditor: Converted HTML length', html?.length);
          
          if (html && typeof html === 'string' && html.trim()) {
            setCode(html);
          } else {
            setCode(defaultHTML);
          }
        } catch (error) {
          console.error('Error converting Tiptap to HTML:', error);
          setCode(defaultHTML);
        }
      } else {
        setCode(defaultHTML);
      }
      setIsInitialized(true);
    }
  }, [value, isInitialized]); // Only re-run if value or isInitialized changes

  // Handle code changes - NO auto-save, only manual save
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    console.log('Code changed, length:', newCode.length);
    setCode(newCode);
    
    // Only auto-save if explicitly enabled
    if (conversionMode === 'auto' && onChange) {
      // Debounced auto-save
      const timer = setTimeout(() => {
        try {
          const htmlString = typeof newCode === 'string' ? newCode : String(newCode || '');
          const tiptapJson = htmlToTiptap(htmlString);
          
          if (tiptapJson && tiptapJson.type === 'doc') {
            console.log('Auto-saving...');
            onChange(tiptapJson);
          }
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [conversionMode, onChange]);

  // Manual save/convert
  const handleSave = useCallback(() => {
    console.log('Manual save triggered');
    
    if (!onChange) {
      message.warning('No save handler available');
      return;
    }
    
    try {
      // Ensure code is a string
      const htmlString = typeof code === 'string' ? code : String(code || '');
      console.log('Saving HTML length:', htmlString.length);
      
      const tiptapJson = htmlToTiptap(htmlString);
      console.log('Converted Tiptap JSON:', tiptapJson);
      
      // Validate the conversion result
      if (tiptapJson && tiptapJson.type === 'doc') {
        onChange(tiptapJson);
        message.success('Content saved successfully!');
      } else {
        console.error('Invalid conversion result:', tiptapJson);
        message.error('Failed to save: Invalid content format');
      }
    } catch (error) {
      console.error('Save error:', error);
      message.error('Failed to save content');
    }
  }, [code, onChange]);

  // Preview in new window
  const handlePreview = useCallback(() => {
    const htmlString = typeof code === 'string' ? code : String(code || '');
    
    if (!htmlString.trim()) {
      message.warning('No content to preview');
      return;
    }
    
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Preview - ${new Date().toLocaleString()}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px;
              background: #f5f5f5;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            .preview-container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .preview-header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e8e8e8;
            }
            .preview-title {
              color: #1890ff;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <div class="preview-container">
            <div class="preview-header">
              <h1 class="preview-title">🕶️ Live Preview</h1>
              <p>Content preview generated at ${new Date().toLocaleTimeString()}</p>
            </div>
            ${htmlString}
          </div>
        </body>
        </html>
      `);
      previewWindow.document.close();
    }
  }, [code]);

  // Copy code to clipboard
  const handleCopy = useCallback(async () => {
    try {
      const htmlString = typeof code === 'string' ? code : String(code || '');
      await navigator.clipboard.writeText(htmlString);
      message.success('Code copied to clipboard!');
    } catch (error) {
      message.error('Failed to copy code');
    }
  }, [code]);

  // Format code (basic beautify)
  const handleFormat = useCallback(() => {
    try {
      const htmlString = typeof code === 'string' ? code : String(code || '');
      let formatted = htmlString;
      
      // Basic HTML formatting
      formatted = formatted
        .replace(/></g, '>\n<')
        .split('\n')
        .map(line => {
          const indent = (line.match(/^(\s*)/) || [''])[0].length;
          const trimmed = line.trim();
          if (trimmed.startsWith('</')) {
            return '  '.repeat(Math.max(0, indent - 2)) + trimmed;
          }
          return '  '.repeat(indent) + trimmed;
        })
        .join('\n');
      
      setCode(formatted);
      message.success('Code formatted!');
    } catch (error) {
      message.error('Formatting failed');
    }
  }, [code]);

  // Reset to default template
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: 'Reset to Template?',
      content: 'This will replace your current code with the default template.',
      okText: 'Reset',
      cancelText: 'Cancel',
      onOk: () => {
        setCode(defaultHTML);
        setIsInitialized(false); // Reset initialization to allow saving
        message.info('Reset to default template');
      }
    });
  }, []);

  // Toggle fullscreen
  const handleFullscreen = useCallback(() => {
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  // Get editor language label
  const getLanguageLabel = useCallback((lang: string) => {
    switch (lang) {
      case 'html': return 'HTML';
      case 'css': return 'CSS';
      case 'javascript': return 'JavaScript';
      default: return lang;
    }
  }, []);

  return (
    <Card 
      styles={{
        body: { 
          padding: '0',
        }
      }}
      style={{ 
        borderColor: error ? '#ff4d4f' : '#d9d9d9',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div style={{ 
          background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
          padding: '12px 16px',
          borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#e8e8e8'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <Space wrap>
            <Text strong style={{ color: theme === 'dark' ? '#fff' : '#333' }}>
              <CodeOutlined /> Code Editor
            </Text>
            
            <Divider type="vertical" />
            
            <Select
              size="small"
              value={currentLanguage}
              onChange={setCurrentLanguage}
              style={{ width: 120 }}
              disabled={disabled}
            >
              <Option value="html"><Html5Outlined /> HTML</Option>
              <Option value="css"><CiOutlined /> CSS</Option>
              <Option value="javascript"><UsbOutlined /> JavaScript</Option>
            </Select>
            
            <Divider type="vertical" />
            
            <Tooltip title="Format Code">
              <Button 
                size="small" 
                icon={<FormatPainterOutlined />}
                onClick={handleFormat}
                disabled={disabled}
              />
            </Tooltip>
            
            <Tooltip title="Copy Code">
              <Button 
                size="small" 
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={disabled}
              />
            </Tooltip>
            
            <Tooltip title="Preview">
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={handlePreview}
                disabled={disabled}
              />
            </Tooltip>
            
            <Tooltip title="Reset">
              <Button 
                size="small" 
                danger
                onClick={handleReset}
                disabled={disabled}
              >
                Reset
              </Button>
            </Tooltip>
            
            <Divider type="vertical" />
            
            <Tooltip title="Save & Convert">
              <Button 
                type="primary"
                size="small" 
                icon={<SaveOutlined />}
                onClick={handleSave}
                disabled={disabled}
              >
                Save
              </Button>
            </Tooltip>
          </Space>
          
          <Space wrap>
            <Popover
              title="Editor Settings"
              content={
                <Space direction="vertical" style={{ width: 200 }}>
                  <div>
                    <Text type="secondary">Conversion Mode</Text>
                    <Radio.Group 
                      value={conversionMode} 
                      onChange={(e) => setConversionMode(e.target.value)}
                      style={{ marginTop: 4 }}
                    >
                      <Radio.Button value="auto">Auto</Radio.Button>
                      <Radio.Button value="manual">Manual</Radio.Button>
                    </Radio.Group>
                  </div>
                  
                  <div>
                    <Text type="secondary">Font Size</Text>
                    <Select
                      size="small"
                      value={fontSize}
                      onChange={setFontSize}
                      style={{ width: '100%', marginTop: 4 }}
                    >
                      {[12, 14, 16, 18, 20, 22, 24].map(size => (
                        <Option key={size} value={size}>{size}px</Option>
                      ))}
                    </Select>
                  </div>
                  
                  <div>
                    <Text type="secondary">Theme</Text>
                    <Radio.Group 
                      value={theme} 
                      onChange={(e) => setTheme(e.target.value)}
                      style={{ marginTop: 4 }}
                    >
                      <Radio.Button value="dark">Dark</Radio.Button>
                      <Radio.Button value="light">Light</Radio.Button>
                    </Radio.Group>
                  </div>
                  
                  <div>
                    <Space>
                      <Switch 
                        checked={showLineNumbers}
                        onChange={setShowLineNumbers}
                        size="small"
                      />
                      <Text type="secondary">Line Numbers</Text>
                    </Space>
                  </div>
                  
                  <div>
                    <Space>
                      <Switch 
                        checked={wordWrap === 'on'}
                        onChange={(checked) => setWordWrap(checked ? 'on' : 'off')}
                        size="small"
                      />
                      <Text type="secondary">Word Wrap</Text>
                    </Space>
                  </div>
                </Space>
              }
              trigger="click"
            >
              <Button size="small" icon={<SettingOutlined />} />
            </Popover>
            
            <Tooltip title={fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
              <Button 
                size="small" 
                icon={<FullscreenOutlined />}
                onClick={handleFullscreen}
              />
            </Tooltip>
          </Space>
        </div>
      )}
      
      {/* Main Content */}
      <div style={{ 
        display: 'flex',
        flexDirection: fullscreen ? 'column' : 'row',
        height: fullscreen ? '100vh' : `${height}px`,
        overflow: 'hidden'
      }}>
        {/* Code Editor */}
        <div style={{ 
          flex: showPreview ? 1 : 1,
          minWidth: 0,
          borderRight: showPreview && !fullscreen ? `1px solid ${theme === 'dark' ? '#333' : '#e8e8e8'}` : 'none',
          position: 'relative'
        }}>
          {showLineNumbers && (
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '40px',
              background: theme === 'dark' ? '#252526' : '#f8f9fa',
              borderRight: `1px solid ${theme === 'dark' ? '#333' : '#e8e8e8'}`,
              color: theme === 'dark' ? '#858585' : '#666',
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              overflow: 'hidden',
              textAlign: 'right',
              padding: '8px 4px',
              fontFamily: 'monospace',
              zIndex: 1
            }}>
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
          )}
          <TextArea
            ref={textareaRef}
            value={code}
            onChange={handleCodeChange}
            placeholder={placeholder}
            disabled={disabled}
            style={{
              width: '100%',
              height: '100%',
              padding: '8px',
              paddingLeft: showLineNumbers ? '50px' : '8px',
              fontSize: `${fontSize}px`,
              lineHeight: `${fontSize * 1.5}px`,
              fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
              background: theme === 'dark' ? '#1e1e1e' : '#ffffff',
              color: theme === 'dark' ? '#d4d4d4' : '#24292e',
              border: 'none',
              outline: 'none',
              resize: 'none',
              whiteSpace: wordWrap === 'on' ? 'pre-wrap' : 'pre',
              overflow: 'auto',
              borderRadius: 0
            }}
            autoSize={false}
          />
        </div>
        
        {/* Preview Panel */}
        {showPreview && !fullscreen && (
          <div style={{ 
            flex: 1,
            minWidth: 0,
            overflow: 'auto',
            background: '#f8f9fa',
            padding: '20px'
          }}>
            <div style={{ 
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              minHeight: '100%'
            }}>
              <div style={{ 
                marginBottom: '20px',
                paddingBottom: '15px',
                borderBottom: '2px solid #1890ff'
              }}>
                <Title level={4} style={{ margin: 0 }}>
                  <EyeOutlined /> Live Preview
                </Title>
                <Text type="secondary">
                  Real-time preview of your content
                </Text>
              </div>
              
              <div 
                dangerouslySetInnerHTML={{ __html: code }}
                style={{ 
                  maxWidth: '800px',
                  margin: '0 auto'
                }}
              />
              
              <div style={{ 
                marginTop: '30px',
                padding: '20px',
                background: '#f0f9ff',
                borderRadius: '8px',
                borderLeft: '4px solid #1890ff'
              }}>
                <Title level={5} style={{ marginTop: 0 }}>
                  <DatabaseOutlined /> Storage Info
                </Title>
                <Paragraph type="secondary">
                  This content will be automatically converted to Tiptap JSON format 
                  for storage in your database. When you edit again, it converts back 
                  to HTML. Your database structure remains unchanged!
                </Paragraph>
                <Space>
                  <Button 
                    size="small" 
                    icon={<CloudUploadOutlined />}
                    onClick={handleSave}
                  >
                    Convert & Save
                  </Button>
                  <Button 
                    size="small" 
                    icon={<ApiOutlined />}
                    onClick={() => {
                      try {
                        const htmlString = typeof code === 'string' ? code : String(code || '');
                        const json = htmlToTiptap(htmlString);
                        Modal.info({
                          title: 'Tiptap JSON Preview',
                          width: 800,
                          content: (
                            <div style={{ 
                              background: '#1e1e1e',
                              color: '#d4d4d4',
                              padding: '20px',
                              borderRadius: '8px',
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              overflow: 'auto',
                              maxHeight: '400px'
                            }}>
                              <pre>{JSON.stringify(json, null, 2)}</pre>
                            </div>
                          )
                        });
                      } catch (error) {
                        message.error('Conversion failed');
                      }
                    }}
                  >
                    View JSON
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div style={{ 
        background: theme === 'dark' ? '#1e1e1e' : '#f5f5f5',
        padding: '8px 16px',
        borderTop: `1px solid ${theme === 'dark' ? '#333' : '#e8e8e8'}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        color: theme === 'dark' ? '#999' : '#666'
      }}>
        <Space>
          <span>
            <Html5Outlined /> {getLanguageLabel(currentLanguage)}
          </span>
          <Divider type="vertical" />
          <span>
            {code.length.toLocaleString()} characters
          </span>
          <Divider type="vertical" />
          <span>
            {code.split('\n').length} lines
          </span>
        </Space>
        
        <Space>
          <span>
            Conversion: {conversionMode === 'auto' ? 'Auto' : 'Manual'}
          </span>
          <Divider type="vertical" />
          <span>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </span>
          <Divider type="vertical" />
          <span>
            Status: {isInitialized ? 'Ready' : 'Initializing...'}
          </span>
        </Space>
      </div>
    </Card>
  );
};

export default CodeEditor;