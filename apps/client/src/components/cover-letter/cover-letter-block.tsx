// client/components/cover-letter/cover-letter-block.tsx
import { cn } from '../../libs/utils';
import { useState, useEffect, useRef } from 'react';
import { t, Trans } from "@lingui/macro";

interface CoverLetterBlockProps {
  block: any;
  isSelected: boolean;
  onSelect: () => void;
  previewMode?: boolean;
  onContentChange?: (content: string) => void;
}

export const CoverLetterBlock = ({
  block,
  isSelected,
  onSelect,
  previewMode = false,
  onContentChange
}: CoverLetterBlockProps) => {
  const [localContent, setLocalContent] = useState(block.content || '');
  const contentRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Update local content when block changes
  useEffect(() => {
    setLocalContent(block.content || '');
  }, [block.content]);

  // When block becomes selected, focus the textarea and sync height
  useEffect(() => {
    if (isSelected && !previewMode && textareaRef.current) {
      console.log('🎯 Block selected - focusing textarea');
      textareaRef.current.focus();
      
      // Place cursor at the end of text
      const length = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(length, length);
      
      // Sync textarea height with content height
      syncTextareaHeight();
    }
  }, [isSelected, previewMode]);

  // Sync textarea height with content
  const syncTextareaHeight = () => {
    if (textareaRef.current && displayRef.current) {
      // Get the natural height of the content
      const contentHeight = displayRef.current.scrollHeight;
      
      // Set textarea height to match content height
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${contentHeight}px`;
      
      console.log('📏 Synced textarea height:', contentHeight);
    }
  };

  // Update textarea height when content changes
  useEffect(() => {
    if (isSelected && textareaRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(syncTextareaHeight, 0);
    }
  }, [localContent, isSelected]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Handle click - just select the block (which will make it editable)
  const handleClick = (e: React.MouseEvent) => {
    if (previewMode) return;
    
    e.stopPropagation();
    
    console.log('🖱️ Block clicked - selecting for edit');
    
    // Select the block (this will trigger the useEffect above to focus)
    if (!isSelected) {
      onSelect();
    }
  };

  // Debounced auto-save on content change
  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    
    if (onContentChange) {
      // Clear previous timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save (800ms debounce)
      autoSaveTimeoutRef.current = setTimeout(() => {
        console.log('⏰ Auto-saving content', {
          blockId: block.id,
          contentLength: newContent.length
        });
        onContentChange(newContent);
      }, 800);
    }
  };

  // Handle Enter key to save (but don't exit edit mode since selection = edit)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      console.log('⌨️ Ctrl+Enter - saving content');
      
      // Force immediate save
      if (onContentChange) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        onContentChange(localContent);
      }
    } else if (e.key === 'Escape') {
      // Revert to original content but stay in edit mode (stay selected)
      console.log('⌨️ Escape - reverting changes');
      setLocalContent(block.content || '');
    }
  };

  // Auto-save when losing focus (but don't deselect)
  const handleBlur = (e: React.FocusEvent) => {
    // Check if the blur is because user clicked outside the block
    const relatedTarget = e.relatedTarget as HTMLElement;
    const isClickingOutside = !contentRef.current?.contains(relatedTarget);
    
    if (isSelected && isClickingOutside && onContentChange) {
      console.log('👁️ Blur - saving content');
      
      // Clear any pending auto-save
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      // Save immediately
      onContentChange(localContent);
    }
  };

  // Auto-adjust textarea height on input
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleContentChange(e.target.value);
    
    // Auto-resize textarea to fit content
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  // Enhanced content formatting
  const formatContentForPDF = (content: string): string => {
    if (!content) return '<span style="color: #999; font-style: italic;">Click to edit</span>';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
      .replace(/_(.*?)_/g, '<u style="text-decoration: underline;">$1</u>')
      .replace(/\n/g, '<br>')
      .replace(/<br>\s*<br>/g, '<br><br>')
      .replace(/^\s+|\s+$/g, '')
      .trim();
  };

  // Get template-specific styles for this block
  const templateStyles = block.templateStyles || {};

  // Base block styles
  const blockStyles = {
    fontSize: block.formatting?.fontSize || '12pt',
    fontFamily: block.formatting?.fontFamily || "'Times New Roman', Georgia, serif",
    color: block.formatting?.color || '#000000',
    textAlign: block.formatting?.alignment || 'left',
    lineHeight: block.formatting?.lineHeight || '1.4',
    backgroundColor: block.formatting?.backgroundColor || 'transparent',
    padding: block.formatting?.padding || '8px 12px',
    fontWeight: block.formatting?.fontWeight || 'normal',
    fontStyle: block.formatting?.fontStyle || 'normal',
    textDecoration: block.formatting?.textDecoration || 'none',
    border: block.formatting?.border || 'none',
    borderRadius: block.formatting?.borderRadius || '0px',
    margin: '0',
    letterSpacing: '0.01em',
    wordSpacing: '0.02em',
    width: '100%',
    minHeight: 'auto',
    display: 'block',
    ...templateStyles
  };

  // Textarea styles - matches display exactly
  const textareaStyles: React.CSSProperties = {
  fontFamily: blockStyles.fontFamily,
  fontSize: blockStyles.fontSize,
  color: blockStyles.color,
  lineHeight: blockStyles.lineHeight,
  textAlign: (blockStyles.textAlign || 'left') as 'left' | 'right' | 'center' | 'justify',
  fontWeight: blockStyles.fontWeight as React.CSSProperties['fontWeight'],
  fontStyle: blockStyles.fontStyle as 'normal' | 'italic' | 'oblique',
  textDecoration: blockStyles.textDecoration as React.CSSProperties['textDecoration'],
  letterSpacing: blockStyles.letterSpacing,
  wordSpacing: blockStyles.wordSpacing,
  backgroundColor: 'transparent',
  padding: 0,
  margin: 0,
  border: 'none',
  outline: 'none',
  resize: 'none',
  width: '100%',
  minHeight: 'auto',
  overflow: 'hidden',
  boxSizing: 'border-box',
  whiteSpace: 'pre-wrap',
  wordWrap: 'break-word'
};

  // Content div styles
  const contentDivStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    lineHeight: 'inherit',
    color: 'inherit',
    textAlign: 'inherit',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    minHeight: 'auto',
    height: 'auto',
    width: '100%',
    padding: 0,
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word'
  };

  // Simple styling: selected = editing, no separate states
  const blockClass = cn(
    "transition-all duration-200 professional-block relative",
    isSelected && !previewMode && 'ring-1 ring-blue-400', // Very subtle selection ring
    !isSelected && !previewMode && 'hover:ring-1 hover:ring-gray-300',
    previewMode && 'cursor-default'
  );

  return (
    <div 
      ref={contentRef}
      className={blockClass}
      onClick={handleClick}
      style={blockStyles}
    >
      {/* Hidden div to measure natural content height */}
      <div
        ref={displayRef}
        className="absolute invisible whitespace-pre-wrap break-words"
        style={{
          ...contentDivStyles,
          fontFamily: blockStyles.fontFamily,
          fontSize: blockStyles.fontSize,
          lineHeight: blockStyles.lineHeight,
          width: '100%',
          padding: '8px 12px', // Match block padding for accurate measurement
          boxSizing: 'border-box'
        }}
      >
        {localContent || ' '}
      </div>

      {isSelected && !previewMode ? (
        // SELECTED = EDITING MODE: Show auto-sizing textarea
        <textarea
          ref={textareaRef}
          value={localContent}
          onChange={handleTextareaInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full p-0 m-0 bg-transparent outline-none resize-none font-inherit text-inherit leading-inherit border-0 overflow-hidden"
          style={textareaStyles}
        />
      ) : (
        // NOT SELECTED = VIEW MODE: Show static content
        <div
          className={cn(
            "outline-none w-full professional-content",
            previewMode ? "cursor-default" : "cursor-text"
          )}
          style={contentDivStyles}
          dangerouslySetInnerHTML={{ 
            __html: formatContentForPDF(block.content) 
          }}
        />
      )}

      {/* Editing indicator - only show when selected (which means editing) */}
      {isSelected && !previewMode && (
        <div className="absolute -top-7 left-0 bg-blue-400 text-white text-xs px-2 py-1 rounded pointer-events-none z-50">
         <Trans>✓ Editing • Ctrl+Enter to save • Esc to revert</Trans> 
        </div>
      )}
    </div>
  );
};