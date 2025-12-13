// client/components/cover-letter/cover-letter-block.tsx
import { cn } from '../../libs/utils';

interface CoverLetterBlockProps {
  block: any;
  isSelected: boolean;
  onSelect: () => void;
  previewMode?: boolean;
}

export const CoverLetterBlock = ({
  block,
  isSelected,
  onSelect,
  previewMode = false
}: CoverLetterBlockProps) => {
  // Get template-specific styles for this block
  const templateStyles = block.templateStyles || {};

  // Base block styles - template styles only override if they exist
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
    // Apply template styles ONLY if they exist (they override the defaults above)
    ...templateStyles
  };

  return (
    <div 
      className={cn(
        "transition-all duration-200 professional-block",
        isSelected && !previewMode 
          ? 'ring-2 ring-blue-500 bg-blue-50 shadow-sm' 
          : 'hover:bg-gray-50',
        previewMode && 'cursor-default'
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (!previewMode) onSelect();
      }}
      style={blockStyles}
    >
      <div
        className={cn(
          "outline-none w-full professional-content",
          previewMode ? "cursor-default" : "cursor-pointer",
          "whitespace-pre-wrap break-words"
        )}
        style={{
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          color: 'inherit',
          textAlign: 'inherit',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          minHeight: 'auto',
          height: 'auto'
        }}
        dangerouslySetInnerHTML={{ 
          __html: formatContentForPDF(block.content) 
        }}
      />

      {/* Selection instructions */}
      {isSelected && !previewMode && (
        <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded pointer-events-none">
          ✓ Edit from the LeftSidebar(in Block Controls section) 
        </div>
      )}
    </div>
  );
};

// Enhanced content formatting - RESTORED ORIGINAL BEHAVIOR
const formatContentForPDF = (content: string): string => {
  if (!content) return '<span style="color: #999; font-style: italic;">Click to select, then edit in Block Controls</span>';
  
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="font-style: italic;">$1</em>')
    .replace(/_(.*?)_/g, '<u style="text-decoration: underline;">$1</u>')
    .replace(/\n/g, '<br>')
    .replace(/<br>\s*<br>/g, '<br><br>')
    .replace(/^\s+|\s+$/g, '')
    .trim();
};