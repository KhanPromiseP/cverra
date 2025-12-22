import React, { useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { 
  Card, 
  Space, 
  Button, 
  Tooltip, 
  Upload, 
  Modal,
  Input,
  message,
  Dropdown,
  Menu,
  Divider
} from 'antd';
import { 
  BoldOutlined, 
  ItalicOutlined, 
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  FormatPainterOutlined,
  UndoOutlined,
  RedoOutlined,
  CodeSandboxOutlined,
  Html5Outlined,
  ApiOutlined
} from '@ant-design/icons';
import { RcFile } from 'antd/es/upload';
import { uploadImage } from '../../services/article.service';

interface RichTextEditorProps {
  value?: any;
  onChange?: (content: any) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  mode?: 'wysiwyg' | 'code';
  onModeChange?: (mode: 'wysiwyg' | 'code') => void;
}

// ==================== ENHANCED CUSTOM HTML BLOCK ====================
// This extension preserves COMPLETE HTML with all styling
const EnhancedHTMLBlock = {
  name: 'enhancedHTMLBlock',
  
  addOptions() {
    return {
      HTMLAttributes: {
        class: 'enhanced-html-block',
        'data-type': 'enhanced-html',
      },
    };
  },
  
  addGlobalAttributes() {
    return [
      {
        types: ['enhancedHTMLBlock'],
        attributes: {
          style: {
            default: null,
            parseHTML: (element: any) => element.getAttribute('style') || '',
            renderHTML: (attributes: any) => {
              return attributes.style ? { style: attributes.style } : {};
            },
          },
          class: {
            default: null,
            parseHTML: (element: any) => element.getAttribute('class') || '',
            renderHTML: (attributes: any) => {
              return attributes.class ? { class: attributes.class } : {};
            },
          },
          'data-html': {
            default: null,
            parseHTML: (element: any) => element.getAttribute('data-html') || '',
            renderHTML: (attributes: any) => {
              return attributes['data-html'] ? { 'data-html': attributes['data-html'] } : {};
            },
          },
          'data-original-html': {
            default: null,
            parseHTML: (element: any) => element.getAttribute('data-original-html') || '',
            renderHTML: (attributes: any) => {
              return attributes['data-original-html'] ? { 'data-original-html': attributes['data-original-html'] } : {};
            },
          },
        },
      },
    ];
  },
  
  parseHTML() {
    return [
      // Match any element with data-type="enhanced-html"
      {
        tag: '*[data-type="enhanced-html"]',
        priority: 100,
      },
      // Match complex styled divs
      {
        tag: 'div',
        priority: 50,
        getAttrs: (element: any) => {
          const style = element.getAttribute('style') || '';
          const className = element.getAttribute('class') || '';
          
          // Check if this looks like a complex/styled element
          const hasComplexStyling = 
            style.includes('gradient') ||
            style.includes('background:') ||
            style.includes('border-radius') ||
            style.includes('box-shadow') ||
            style.includes('grid') ||
            style.includes('flex') ||
            style.includes('transform') ||
            style.includes('animation') ||
            style.includes('transition') ||
            className.includes('feature') ||
            className.includes('cta') ||
            className.includes('block') ||
            element.tagName.toLowerCase() === 'button' ||
            element.querySelector('button') ||
            element.querySelector('.grid') ||
            element.querySelector('.flex');
          
          if (hasComplexStyling) {
            return {
              'data-type': 'enhanced-html',
              style: style,
              class: className,
              'data-original-html': element.outerHTML,
            };
          }
          return false;
        },
      },
      // Match buttons
      {
        tag: 'button',
        priority: 60,
        getAttrs: (element: any) => ({
          'data-type': 'enhanced-html',
          style: element.getAttribute('style') || '',
          class: element.getAttribute('class') || '',
          onclick: element.getAttribute('onclick') || '',
          'data-original-html': element.outerHTML,
        }),
      },
    ];
  },
  
  renderHTML({ HTMLAttributes, node }: any) {
    // If we have original HTML stored, use it directly
    if (HTMLAttributes['data-original-html']) {
      // Create a temporary element to get the tag name
      const temp = document.createElement('div');
      temp.innerHTML = HTMLAttributes['data-original-html'];
      const element = temp.firstElementChild;
      if (element) {
        return [element.tagName.toLowerCase(), HTMLAttributes, 0];
      }
    }
    
    // Otherwise create a div with the stored HTML content
    const tag = HTMLAttributes['data-html']?.startsWith('<button') ? 'button' : 'div';
    return [tag, HTMLAttributes, 0];
  },
  
  addNodeView() {
    return ({ node, HTMLAttributes, getPos }: any) => {
      const dom = document.createElement('div');
      
      // If we have original HTML, use it directly
      if (HTMLAttributes['data-original-html']) {
        dom.innerHTML = HTMLAttributes['data-original-html'];
        const element = dom.firstElementChild;
        if (element) {
          return {
            dom: element,
            contentDOM: element,
          };
        }
      }
      
      // Otherwise create a container with the HTML content
      if (HTMLAttributes['data-html']) {
        dom.innerHTML = HTMLAttributes['data-html'];
      } else if (node.textContent) {
        dom.innerHTML = node.textContent;
      }
      
      // Apply any additional attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value && key !== 'data-html' && key !== 'data-original-html') {
          dom.setAttribute(key, value.toString());
        }
      });
      
      return {
        dom,
        contentDOM: dom,
      };
    };
  },
  
  addCommands() {
    return {
      insertEnhancedHTML: (html: string) => ({ chain }: any) => {
        return chain()
          .insertContent({
            type: 'enhancedHTMLBlock',
            attrs: {
              'data-type': 'enhanced-html',
              'data-html': html,
              'data-original-html': html,
            },
          })
          .run();
      },
    };
  },
};

// ==================== ROBUST CONVERSION FUNCTIONS ====================

// Generate a unique ID for HTML elements
const generateId = () => `html-block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Convert Tiptap JSON to HTML - PRESERVES ALL STYLING
 */
export const tiptapToHTML = (tiptapJson: any): string => {
  if (!tiptapJson || !tiptapJson.content || !Array.isArray(tiptapJson.content)) {
    return '';
  }
  
  const convertNode = (node: any): string => {
    if (!node || !node.type) return '';
    
    // Handle enhanced HTML blocks (stores complete HTML)
    if (node.type === 'enhancedHTMLBlock') {
      const originalHtml = node.attrs?.['data-original-html'];
      const storedHtml = node.attrs?.['data-html'];
      
      if (originalHtml) {
        return originalHtml;
      }
      
      if (storedHtml) {
        return storedHtml;
      }
      
      // Fallback: render with style and class
      const style = node.attrs?.style || '';
      const className = node.attrs?.class || '';
      const dataType = node.attrs?.['data-type'] || 'enhanced-html';
      
      let attrs = `data-type="${dataType}"`;
      if (style) attrs += ` style="${style}"`;
      if (className) attrs += ` class="${className}"`;
      
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<div ${attrs}>${children}</div>`;
    }
    
    // Handle custom HTML blocks
    if (node.type === 'customHTMLBlock') {
      const style = node.attrs?.style || '';
      const className = node.attrs?.class || '';
      const dataType = node.attrs?.['data-type'] || 'custom-html';
      
      let attrs = `data-type="${dataType}"`;
      if (style) attrs += ` style="${style}"`;
      if (className) attrs += ` class="${className}"`;
      
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<div ${attrs}>${children}</div>`;
    }
    
    // Handle text with marks
    if (node.type === 'text') {
      let text = node.text || '';
      
      if (node.marks && Array.isArray(node.marks)) {
        // Apply marks in reverse order (inner to outer)
        const marks = [...node.marks].reverse();
        
        marks.forEach((mark: any) => {
          switch (mark.type) {
            case 'bold':
              text = `<strong>${text}</strong>`;
              break;
            case 'italic':
              text = `<em>${text}</em>`;
              break;
            case 'underline':
              text = `<u>${text}</u>`;
              break;
            case 'code':
              text = `<code>${text}</code>`;
              break;
            case 'link':
              const href = mark.attrs?.href || '#';
              const target = mark.attrs?.target || '_blank';
              const rel = mark.attrs?.rel || 'noopener noreferrer';
              text = `<a href="${href}" target="${target}" rel="${rel}">${text}</a>`;
              break;
            case 'textStyle':
              const style = mark.attrs?.style || '';
              if (style) {
                text = `<span style="${style}">${text}</span>`;
              }
              break;
          }
        });
      }
      
      return text;
    }
    
    // Handle paragraphs
    if (node.type === 'paragraph') {
      const align = node.attrs?.textAlign || 'left';
      const style = node.attrs?.style || '';
      const children = node.content ? node.content.map(convertNode).join('') : '';
      
      let styleAttr = `text-align: ${align}`;
      if (style) styleAttr += `; ${style}`;
      
      return `<p style="${styleAttr}">${children}</p>`;
    }
    
    // Handle headings
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const align = node.attrs?.textAlign || 'left';
      const style = node.attrs?.style || '';
      const children = node.content ? node.content.map(convertNode).join('') : '';
      
      let styleAttr = `text-align: ${align}`;
      if (style) styleAttr += `; ${style}`;
      
      return `<h${level} style="${styleAttr}">${children}</h${level}>`;
    }
    
    // Handle lists
    if (node.type === 'bulletList') {
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<ul>${children}</ul>`;
    }
    
    if (node.type === 'orderedList') {
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<ol>${children}</ol>`;
    }
    
    if (node.type === 'listItem') {
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<li>${children}</li>`;
    }
    
    // Handle blockquotes
    if (node.type === 'blockquote') {
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<blockquote>${children}</blockquote>`;
    }
    
    // Handle code blocks
    if (node.type === 'codeBlock') {
      const children = node.content ? node.content.map(convertNode).join('') : '';
      return `<pre><code>${children}</code></pre>`;
    }
    
    // Handle images
    if (node.type === 'image') {
      const src = node.attrs?.src || '';
      const alt = node.attrs?.alt || '';
      const title = node.attrs?.title || '';
      const style = node.attrs?.style || 'max-width: 100%; border-radius: 8px;';
      const align = node.attrs?.textAlign || 'center';
      
      return `<div style="text-align: ${align}; margin: 1em 0;">
                <img src="${src}" alt="${alt}" title="${title}" style="${style}" />
              </div>`;
    }
    
    // Handle horizontal rules
    if (node.type === 'horizontalRule') {
      return '<hr />';
    }
    
    // Default: try to render children
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(convertNode).join('');
    }
    
    return '';
  };
  
  try {
    const html = tiptapJson.content.map(convertNode).join('');
    return html || '';
  } catch (error) {
    console.error('Tiptap to HTML conversion error:', error);
    return '';
  }
};

/**
 * Convert HTML to Tiptap JSON - PRESERVES ALL STYLING
 */
export const htmlToTiptap = (html: any): any => {
  // Handle non-string inputs
  if (!html) {
    return { type: 'doc', content: [] };
  }
  
  // Convert to string
  const htmlString = typeof html === 'string' ? html : String(html);
  
  if (htmlString.trim() === '') {
    return { type: 'doc', content: [] };
  }
  
  try {
    return parseComplexHTML(htmlString);
  } catch (error) {
    console.error('HTML to Tiptap conversion error:', error);
    return { type: 'doc', content: [] };
  }
};

/**
 * Enhanced HTML parser that preserves ALL styling and structure
 */
const parseComplexHTML = (htmlString: string): any => {
  const container = document.createElement('div');
  container.innerHTML = htmlString;
  
  const convertElement = (element: Element, depth = 0): any => {
    if (depth > 20) return null; // Prevent infinite recursion
    
    const tagName = element.tagName.toLowerCase();
    const style = element.getAttribute('style') || '';
    const className = element.getAttribute('class') || '';
    const onclick = element.getAttribute('onclick') || '';
    const outerHTML = element.outerHTML;
    
    // Check if this is a complex/styled element that should be preserved as-is
    const isComplexElement = 
      tagName === 'button' ||
      style.includes('gradient') ||
      style.includes('background:') ||
      style.includes('border-radius') ||
      style.includes('box-shadow') ||
      style.includes('grid') ||
      style.includes('flex') ||
      style.includes('display: grid') ||
      style.includes('display: flex') ||
      style.includes('transform') ||
      style.includes('animation') ||
      style.includes('transition') ||
      className.includes('feature') ||
      className.includes('cta') ||
      className.includes('block') ||
      element.children.length > 2 || // Multiple nested elements
      element.querySelector('button') ||
      element.querySelector('.grid') ||
      element.querySelector('.flex');
    
    // For complex elements, store the COMPLETE HTML
    if (isComplexElement) {
      return {
        type: 'enhancedHTMLBlock',
        attrs: {
          'data-type': 'enhanced-html',
          style,
          class: className,
          onclick,
          'data-html': outerHTML,
          'data-original-html': outerHTML,
        },
        content: [], // No content needed since we store the full HTML
      };
    }
    
    // Handle standard HTML elements
    switch (tagName) {
      case 'p':
        const alignMatch = style.match(/text-align:\s*([^;]+)/);
        const align = alignMatch ? alignMatch[1] : 'left';
        
        const pContent: any[] = [];
        element.childNodes.forEach(child => {
          if (child.nodeType === 3) {
            const text = child.textContent?.trim();
            if (text) {
              pContent.push({ type: 'text', text });
            }
          } else if (child.nodeType === 1) {
            const childElement = child as Element;
            const childTag = childElement.tagName.toLowerCase();
            const childText = childElement.textContent?.trim();
            
            if (childText) {
              const marks: any[] = [];
              
              if (childTag === 'strong' || childTag === 'b') {
                marks.push({ type: 'bold' });
              }
              if (childTag === 'em' || childTag === 'i') {
                marks.push({ type: 'italic' });
              }
              if (childTag === 'u') {
                marks.push({ type: 'underline' });
              }
              if (childTag === 'code') {
                marks.push({ type: 'code' });
              }
              if (childTag === 'a') {
                marks.push({
                  type: 'link',
                  attrs: {
                    href: childElement.getAttribute('href') || '#',
                    target: childElement.getAttribute('target') || '_blank',
                    rel: childElement.getAttribute('rel') || 'noopener noreferrer',
                  },
                });
              }
              if (childElement.getAttribute('style')) {
                marks.push({
                  type: 'textStyle',
                  attrs: {
                    style: childElement.getAttribute('style'),
                  },
                });
              }
              
              pContent.push({
                type: 'text',
                text: childText,
                marks: marks.length > 0 ? marks : undefined,
              });
            }
          }
        });
        
        if (pContent.length === 0) return null;
        
        return {
          type: 'paragraph',
          attrs: { 
            textAlign: align, 
            style: style.replace(/text-align:[^;]+;?/, '').trim() 
          },
          content: pContent,
        };
        
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(tagName.charAt(1));
        const headingText = element.textContent?.trim();
        
        if (!headingText) return null;
        
        const headingAlignMatch = style.match(/text-align:\s*([^;]+)/);
        const headingAlign = headingAlignMatch ? headingAlignMatch[1] : 'left';
        
        return {
          type: 'heading',
          attrs: { 
            level, 
            textAlign: headingAlign,
            style: style.replace(/text-align:[^;]+;?/, '').trim()
          },
          content: [{ type: 'text', text: headingText }],
        };
        
      case 'ul':
        const ulItems: any[] = [];
        element.querySelectorAll('li').forEach(li => {
          const liContent = li.textContent?.trim();
          if (liContent) {
            ulItems.push({
              type: 'listItem',
              content: [{ 
                type: 'text', 
                text: liContent 
              }],
            });
          }
        });
        
        if (ulItems.length === 0) return null;
        
        return {
          type: 'bulletList',
          content: ulItems,
        };
        
      case 'ol':
        const olItems: any[] = [];
        element.querySelectorAll('li').forEach(li => {
          const liContent = li.textContent?.trim();
          if (liContent) {
            olItems.push({
              type: 'listItem',
              content: [{ 
                type: 'text', 
                text: liContent 
              }],
            });
          }
        });
        
        if (olItems.length === 0) return null;
        
        return {
          type: 'orderedList',
          content: olItems,
        };
        
      case 'blockquote':
        const quoteText = element.textContent?.trim();
        if (!quoteText) return null;
        
        return {
          type: 'blockquote',
          content: [{ type: 'text', text: quoteText }],
        };
        
      case 'pre':
        const codeText = element.textContent?.trim();
        if (!codeText) return null;
        
        return {
          type: 'codeBlock',
          content: [{ type: 'text', text: codeText }],
        };
        
      case 'img':
        return {
          type: 'image',
          attrs: {
            src: element.getAttribute('src') || '',
            alt: element.getAttribute('alt') || '',
            title: element.getAttribute('title') || '',
            style: element.getAttribute('style') || 'max-width: 100%; border-radius: 8px;',
          },
        };
        
      case 'hr':
        return { type: 'horizontalRule' };
        
      case 'div':
        // Check div's children
        const children = Array.from(element.children).map(child => 
          convertElement(child, depth + 1)
        ).filter(Boolean);
        
        if (children.length > 0) {
          return {
            type: 'paragraph',
            attrs: { style },
            content: children,
          };
        }
        
        // Simple div with text
        const divText = element.textContent?.trim();
        if (divText) {
          return {
            type: 'paragraph',
            attrs: { style },
            content: [{ type: 'text', text: divText }],
          };
        }
        
        return null;
        
      default:
        // For unknown elements, extract text
        const text = element.textContent?.trim();
        if (text) {
          return {
            type: 'text',
            text,
          };
        }
        return null;
    }
  };
  
  const content: any[] = [];
  container.childNodes.forEach(child => {
    if (child.nodeType === 1) {
      const converted = convertElement(child as Element);
      if (converted) content.push(converted);
    }
  });
  
  return {
    type: 'doc',
    content: content.length > 0 ? content : [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Content' }],
      },
    ],
  };
};

// ==================== EDITOR COMPONENT ====================

const MenuBar: React.FC<{ 
  editor: any;
  onSwitchToCode?: () => void;
}> = ({ editor, onSwitchToCode }) => {
  const [imageModalVisible, setImageModalVisible] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState('');
  const [linkModalVisible, setLinkModalVisible] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const addImage = useCallback(() => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setImageModalVisible(false);
    }
  }, [editor, imageUrl]);

  const setLink = useCallback(() => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setLinkModalVisible(false);
    }
  }, [editor, linkUrl]);

  const uploadProps = {
    beforeUpload: async (file: RcFile) => {
      try {
        const formData = new FormData();
        formData.append('image', file);
        const result = await uploadImage(formData);
        editor.chain().focus().setImage({ src: result.url }).run();
        message.success('Image uploaded successfully');
        return false;
      } catch (error) {
        message.error('Failed to upload image');
        return false;
      }
    },
    showUploadList: false,
  };

  const insertEnhancedBlock = useCallback((type: 'ai' | 'cta' | 'feature') => {
    let html = '';
    
    switch (type) {
      case 'ai':
        html = `<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; padding: 30px; color: white; margin: 30px 0; box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);">
          <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 25px;">
            <div style="font-size: 40px; background: rgba(255, 255, 255, 0.2); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center;">🤖</div>
            <h3 style="font-size: 28px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">AI-Powered Assistant</h3>
          </div>
          <p style="font-size: 18px; line-height: 1.6; opacity: 0.9; margin-bottom: 30px;">
            Experience next-generation content creation with our intelligent AI assistant.
          </p>
          <button style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; border: none; padding: 16px 40px; font-size: 18px; border-radius: 50px; cursor: pointer; box-shadow: 0 10px 20px rgba(238,90,36,0.3);">
            🚀 Try AI Assistant
          </button>
        </div>`;
        break;
        
      case 'cta':
        html = `<div style="background: #f0f9ff; border: 2px dashed #91d5ff; border-radius: 12px; padding: 30px; margin: 40px 0; text-align: center;">
          <h3 style="color: #1890ff; margin-top: 0;">Ready to Get Started?</h3>
          <p style="color: #666; margin-bottom: 20px;">Take the next step in your journey.</p>
          <button style="background: #1890ff; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer;">
            🚀 Get Started Now
          </button>
        </div>`;
        break;
        
      case 'feature':
        html = `<div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); border-radius: 16px; padding: 25px; color: white; margin: 30px 0;">
          <h3 style="color: white; margin-top: 0;">✨ Premium Feature</h3>
          <p style="opacity: 0.9;">Unlock exclusive content and features.</p>
        </div>`;
        break;
    }
    
    editor.chain().focus().insertEnhancedHTML(html).run();
    message.success('Enhanced block inserted');
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <Space wrap style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
        {onSwitchToCode && (
          <>
            <Tooltip title="Switch to Code Editor">
              <Button
                type="primary"
                icon={<CodeSandboxOutlined />}
                onClick={onSwitchToCode}
              >
                Switch to Code Mode
              </Button>
            </Tooltip>
            <Divider type="vertical" />
          </>
        )}

        <Tooltip title="Bold">
          <Button
            type={editor.isActive('bold') ? 'primary' : 'text'}
            icon={<BoldOutlined />}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
        </Tooltip>
        <Tooltip title="Italic">
          <Button
            type={editor.isActive('italic') ? 'primary' : 'text'}
            icon={<ItalicOutlined />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
        </Tooltip>
        <Tooltip title="Underline">
          <Button
            type={editor.isActive('underline') ? 'primary' : 'text'}
            icon={<UnderlineOutlined />}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          />
        </Tooltip>

        <Space.Compact>
          <Tooltip title="Align Left">
            <Button
              type={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'text'}
              icon={<AlignLeftOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            />
          </Tooltip>
          <Tooltip title="Align Center">
            <Button
              type={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'text'}
              icon={<AlignCenterOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            />
          </Tooltip>
          <Tooltip title="Align Right">
            <Button
              type={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'text'}
              icon={<AlignRightOutlined />}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            />
          </Tooltip>
        </Space.Compact>

        <Tooltip title="Bullet List">
          <Button
            type={editor.isActive('bulletList') ? 'primary' : 'text'}
            icon={<UnorderedListOutlined />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
        </Tooltip>
        <Tooltip title="Numbered List">
          <Button
            type={editor.isActive('orderedList') ? 'primary' : 'text'}
            icon={<OrderedListOutlined />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
        </Tooltip>

        <Tooltip title="Insert Link">
          <Button
            type="text"
            icon={<LinkOutlined />}
            onClick={() => setLinkModalVisible(true)}
          />
        </Tooltip>

        <Tooltip title="Insert Image">
          <Upload {...uploadProps}>
            <Button type="text" icon={<PictureOutlined />} />
          </Upload>
        </Tooltip>

        <Dropdown
          overlay={
            <Menu
              items={[
                {
                  key: 'ai',
                  icon: <Html5Outlined />,
                  label: 'AI Block (Enhanced)',
                  onClick: () => insertEnhancedBlock('ai'),
                },
                {
                  key: 'cta',
                  icon: <ApiOutlined />,
                  label: 'Call to Action',
                  onClick: () => insertEnhancedBlock('cta'),
                },
                {
                  key: 'feature',
                  icon: <CodeOutlined />,
                  label: 'Feature Block',
                  onClick: () => insertEnhancedBlock('feature'),
                },
              ]}
            />
          }
          trigger={['click']}
        >
          <Button type="text" icon={<Html5Outlined />}>
            Enhanced Blocks
          </Button>
        </Dropdown>

        <Tooltip title="Code">
          <Button
            type={editor.isActive('code') ? 'primary' : 'text'}
            icon={<CodeOutlined />}
            onClick={() => editor.chain().focus().toggleCode().run()}
          />
        </Tooltip>

        <Tooltip title="Clear Format">
          <Button
            type="text"
            icon={<FormatPainterOutlined />}
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          />
        </Tooltip>

        <Tooltip title="Undo">
          <Button
            type="text"
            icon={<UndoOutlined />}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
        </Tooltip>
        <Tooltip title="Redo">
          <Button
            type="text"
            icon={<RedoOutlined />}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </Tooltip>
      </Space>

      <Modal
        title="Insert Link"
        open={linkModalVisible}
        onOk={setLink}
        onCancel={() => setLinkModalVisible(false)}
      >
        <Input
          placeholder="Enter URL (e.g., https://example.com)"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onPressEnter={setLink}
        />
      </Modal>

      <Modal
        title="Insert Image"
        open={imageModalVisible}
        onOk={addImage}
        onCancel={() => setImageModalVisible(false)}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Upload {...uploadProps}>
            <Button icon={<PictureOutlined />}>Upload Image</Button>
          </Upload>
          <div style={{ textAlign: 'center', margin: '16px 0' }}>OR</div>
          <Input
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onPressEnter={addImage}
          />
        </Space>
      </Modal>
    </>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start writing your article...",
  error,
  disabled,
  mode = 'wysiwyg',
  onModeChange
}) => {
  const editorRef = useRef<any>(null);
  
  const hasContent = useCallback((content: any): boolean => {
  if (!content) return false;
  
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  
  if (typeof content === 'object') {
    if (content.type === 'doc' && Array.isArray(content.content)) {
      // Enhanced check that recognizes complex HTML blocks
      const hasAnyContent = (nodes: any[]): boolean => {
        for (const node of nodes) {
          // Check for text nodes
          if (node.type === 'text' && node.text && node.text.trim().length > 0) {
            return true;
          }
          
          // Check for enhanced HTML blocks (they contain content!)
          if (node.type === 'enhancedHTMLBlock' || node.type === 'customHTMLBlock') {
            return true; // These blocks ALWAYS count as content
          }
          
          // Check for images
          if (node.type === 'image') {
            return true;
          }
          
          // Check for other visual elements
          if (node.type === 'paragraph' || 
              node.type === 'heading' || 
              node.type === 'bulletList' || 
              node.type === 'orderedList' ||
              node.type === 'blockquote' ||
              node.type === 'codeBlock' ||
              node.type === 'horizontalRule') {
            return true;
          }
          
          // Recursively check nested content
          if (node.content && Array.isArray(node.content)) {
            if (hasAnyContent(node.content)) {
              return true;
            }
          }
        }
        return false;
      };
      
      return hasAnyContent(content.content);
    }
    
    // Check for direct text property
    if (content.text && content.text.trim().length > 0) return true;
  }
  
  return false;
}, []);

const debugContent = useCallback((content: any) => {
  console.log('Editor Content Debug:');
  console.log('Content type:', typeof content);
  console.log('Has doc?', content?.type === 'doc');
  console.log('Has content array?', Array.isArray(content?.content));
  console.log('Content nodes:', content?.content);
  
  if (content?.content && Array.isArray(content.content)) {
    content.content.forEach((node: any, index: number) => {
      console.log(`Node ${index}:`, {
        type: node.type,
        attrs: node.attrs,
        hasContent: node.content?.length > 0,
        text: node.text,
      });
    });
  }
}, []);

  const editor = useEditor({
  extensions: [
    StarterKit.configure({
      history: { depth: 100 },
    }),
    Placeholder.configure({
      placeholder,
    }),
    Typography,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Image.configure({
      inline: true,
      allowBase64: true,
    }),
    // EnhancedHTMLBlock,
  ],
  content: value || { type: 'doc', content: [] },
  onUpdate: ({ editor }) => {
    const json = editor.getJSON();
    debugContent(json);
    const content = json.type === 'doc' ? json : { type: 'doc', content: [] };
    
    // ALWAYS call onChange if there are any enhanced HTML blocks
    const hasEnhancedBlocks = content.content?.some((node: any) => 
      node.type === 'enhancedHTMLBlock' || node.type === 'customHTMLBlock'
    );
    
    if (hasEnhancedBlocks || hasContent(content)) {
      onChange?.(content);
    } else {
      onChange?.({ type: 'doc', content: [] });
    }
  },
  editorProps: {
    attributes: {
      class: error 
        ? 'tiptap-editor tiptap-editor-error' 
        : 'tiptap-editor',
      'data-has-content': hasContent(value) ? 'true' : 'false',
    },
  },
  immediatelyRender: false,
});

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  useEffect(() => {
    if (editor && value && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const handleSwitchToCode = useCallback(() => {
    if (editor) {
      try {
        const tiptapJson = editor.getJSON();
        const html = tiptapToHTML(tiptapJson);
        
        message.info('Switching to code editor...');
        localStorage.setItem('editor-html-cache', html);
        
        if (onModeChange) {
          onModeChange('code');
        }
      } catch (error) {
        console.error('Error converting to HTML:', error);
        message.error('Failed to switch to code mode');
      }
    }
  }, [editor, onModeChange]);

  return (
    <Card 
      styles={{
        body: { 
          padding: '16px',
        }
      }}
      style={{ 
        borderColor: error ? '#ff4d4f' : '#d9d9d9',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <MenuBar editor={editor} onSwitchToCode={handleSwitchToCode} />
      <EditorContent 
        editor={editor} 
        style={{ minHeight: '400px' }}
      />
      <style>{`
        .tiptap-editor {
          min-height: 400px;
          padding: 16px;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
          outline: none;
        }
        .tiptap-editor-error {
          border-color: #ff4d4f;
        }
        .tiptap-editor:focus {
          border-color: #40a9ff;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
        
        /* Basic styling */
        .tiptap-editor p {
          margin-bottom: 1em;
          line-height: 1.6;
        }
        .tiptap-editor h1 {
          font-size: 2em;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
          font-weight: bold;
        }
        .tiptap-editor h2 {
          font-size: 1.5em;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
          font-weight: bold;
        }
        .tiptap-editor h3 {
          font-size: 1.17em;
          margin-top: 1em;
          margin-bottom: 1em;
          font-weight: bold;
        }
        .tiptap-editor ul, .tiptap-editor ol {
          padding-left: 2em;
          margin-bottom: 1em;
        }
        .tiptap-editor blockquote {
          border-left: 3px solid #ddd;
          margin-left: 0;
          margin-right: 0;
          padding-left: 1em;
          font-style: italic;
        }
        .tiptap-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .tiptap-editor a {
          color: #1890ff;
          text-decoration: underline;
        }
        
        /* Enhanced HTML blocks - PRESERVE ALL STYLING */
        .tiptap-editor [data-type="enhanced-html"] {
          all: initial; /* Reset all styles */
          display: block !important;
          margin: 2em 0 !important;
        }
        
        .tiptap-editor [data-type="enhanced-html"] * {
          all: unset; /* Reset child styles */
        }
        
        .tiptap-editor .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        /* Make sure enhanced blocks render properly */
        .tiptap-editor > div > div[data-type="enhanced-html"] {
          display: block !important;
          position: relative;
        }
      `}</style>
    </Card>
  );
};

export default RichTextEditor;
// export { tiptapToHTML, htmlToTiptap };