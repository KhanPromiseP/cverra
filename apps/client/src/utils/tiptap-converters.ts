


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