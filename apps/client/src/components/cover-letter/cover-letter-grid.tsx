import { t, Trans } from "@lingui/macro";
import { useCallback, useEffect, useRef, useMemo } from 'react';
import { CoverLetterBlock } from './cover-letter-block';
import { cn } from '../../libs/utils';
import { useCoverLetterStore } from '../../../stores/cover-letter';
import { generateTemplateStyles, getBlockSpecificStyles } from '../../libs/template-styles';

interface CoverLetterGridProps {
  content: any;
  onContentChange: (content: any) => void;
  onBlockSelect: (blockId: string) => void;
  selectedBlock: string | null;
  editable?: boolean;
  previewMode?: boolean;
}

export const CoverLetterGrid = ({
  content,
  onContentChange,
  onBlockSelect,
  selectedBlock,
  editable = true,
  previewMode = false
}: CoverLetterGridProps) => {
  const { coverLetter, updateBlock } = useCoverLetterStore();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const structure = useMemo(() => {
    return content?.structure || coverLetter?.structure || {
      headerAlignment: t`left`,
      contactInfoPosition: t`header`,
      datePosition: t`right`,
      subjectLinePosition: t`center`,
      greetingAlignment: t`left`,
      paragraphSpacing: t`balanced`,
      signatureAlignment: t`left`
    };
  }, [content, coverLetter]);

  // Generate template styles
  const templateStyles = generateTemplateStyles(structure);
  
  const handleBlockContentChange = useCallback((blockId: string, newContent: string) => {
    try {
      // Get current structure BEFORE updating
      const currentStructure = structure;
      
      // 1. Update the store
      updateBlock(blockId, { 
        content: newContent,
        lastModified: new Date().toISOString()
      });
      
      // 2. Create updated content
      if (onContentChange && content?.blocks) {
        const updatedBlocks = content.blocks.map((block: any) =>
          block.id === blockId ? { 
            ...block, 
            content: newContent,
            lastModified: new Date().toISOString()
          } : block
        );
        
        const updatedContent = {
          ...content,
          blocks: updatedBlocks,
          structure: currentStructure,
          lastSaved: new Date().toISOString()
        };
        
        onContentChange(updatedContent);
      }
    } catch (error) {
      console.error(t`Failed to update block content:`, error);
    }
  }, [content, updateBlock, onContentChange, structure]);

  // Apply template structure to block alignment
  const getBlockAlignment = useCallback((blockType: string) => {
    const alignments: Record<string, string> = {
      'header': structure.headerAlignment,
      'contact_info': structure.contactInfoPosition,
      'greeting': structure.greetingAlignment,
      'subject_line': structure.subjectLinePosition,
      'signature': structure.signatureAlignment,
      'date': structure.datePosition === t`right` ? t`right` : t`left`
    };
    
    return alignments[blockType] || t`left`;
  }, [structure]);

  // Apply template structure to block positioning
  const getBlockPositioning = useCallback((block: any, index: number) => {
    const baseStyle = {
      textAlign: getBlockAlignment(block.type) as 'left' | 'center' | 'right' | 'justify',
      margin: '0 auto',
      width: '100%'
    };

    // Get template-specific styles for this block type
    const templateBlockStyles = getBlockSpecificStyles(block.type, templateStyles);

    // Special positioning based on template structure
    switch (block.type) {
      case 'header':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.headerAlignment,
          marginBottom: '20px',
          fontSize: '24px',
          marginTop: '0',
          fontWeight: 'bold'
        };
      
      case 'contact_info':
        if (structure.contactInfoPosition === t`sidebar`) {
          return {
            ...baseStyle,
            ...templateBlockStyles,
            textAlign: 'left',
            width: '40%',
            float: 'right' as const,
            marginTop: '60px',
            marginLeft: '20px'
          };
        } else if (structure.contactInfoPosition === t`footer`) {
          return {
            ...baseStyle,
            ...templateBlockStyles,
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '12px',
            color: '#666'
          };
        }
        return { 
          ...baseStyle, 
          ...templateBlockStyles 
        };
      
      case 'date':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.datePosition === t`right` ? t`right` : t`left`,
          marginBottom: '20px'
        };
      
      case 'greeting':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.greetingAlignment,
          marginBottom: '10px'
        };
      
      case 'subject_line':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.subjectLinePosition || t`left`,
          marginBottom: '15px',
        };
      
      case 'body_paragraph':
        const spacingMap: Record<string, string> = {
          [t`compact`]: '10px',
          [t`balanced`]: '15px',
          [t`generous`]: '25px',
          [t`creative`]: '20px',
          [t`minimal`]: '5px',
          [t`traditional`]: '20px',
          [t`academic`]: '18px',
          [t`technical`]: '12px'
        };
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: 'left',
          marginBottom: spacingMap[structure.paragraphSpacing] || '15px',
          lineHeight: structure.paragraphSpacing === t`compact` ? '1.3' : 
                     structure.paragraphSpacing === t`generous` ? '1.8' : '1.5'
        };
      
      case 'closing':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: 'left',
          marginTop: '20px',
          marginBottom: '10px'
        };
      
      case 'signature':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.signatureAlignment,
          marginTop: '40px'
        };
      
      default:
        return { ...baseStyle, ...templateBlockStyles };
    }
  }, [structure, templateStyles, getBlockAlignment]);

  const handleBlockSelect = useCallback((blockId: string) => {
    if (!previewMode) {
      onBlockSelect(blockId);
    }
  }, [previewMode, onBlockSelect]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!previewMode && selectedBlock && e.target === e.currentTarget) {
      onBlockSelect(null as any);
    }
  };

  // CRITICAL FIX: Ensure proper rendering for PDF export
  useEffect(() => {
    if (containerRef.current) {
      // Force layout recalculation for better PDF export
      const forceReflow = () => {
        containerRef.current?.offsetHeight;
      };
      forceReflow();
      
      // Add data attribute for PDF export targeting
      containerRef.current.setAttribute('data-cover-letter-grid', 'true');
      containerRef.current.setAttribute('data-export-ready', 'true');
    }
  }, []);

  return (
  <div 
    ref={containerRef}
    className={cn(
      "professional-letter-container relative",
      previewMode ? "border-0" : "shadow-lg border-0",
      "mx-auto",
      "bg-white dark:bg-gray-900",
      "text-gray-900 dark:text-gray-100"
    )}
    data-cover-letter-grid="true"
    style={{ 
      width: '210mm',
      minHeight: '297mm',
      margin: '0 auto',
      position: 'relative',
      visibility: 'visible',
      opacity: 1,
      display: 'block',
      WebkitPrintColorAdjust: 'exact',
      printColorAdjust: 'exact',
      ...templateStyles.container
    }}
    onClick={handleContainerClick}
  >
    {/* Main content container with proper padding */}
    <div 
      className="w-full h-auto"
      style={{
        padding: structure.paragraphSpacing === t`compact` ? '20mm 25mm' :
                structure.paragraphSpacing === t`generous` ? '30mm 35mm' :
                '25mm 30mm',
        boxSizing: 'border-box',
        height: '100%',
        minHeight: 'inherit'
      }}
    >
      {content.blocks?.map((block: any, index: number) => {
        const positioning = getBlockPositioning(block, index);
        
        return (
          <div
            key={block.id}
            data-block-id={block.id}
            data-block-type={block.type}
            className={cn(
              "transition-all duration-200 relative",
              selectedBlock === block.id && !previewMode 
                ? "ring-2 ring-blue-500 z-10 shadow-md" 
                : "border-0",
              previewMode && "border-0 shadow-none cursor-default",
              editable && !previewMode && "cursor-pointer hover:shadow-sm hover:ring-1 hover:ring-gray-300",
              "pdf-export-block",
              "text-gray-900 dark:text-gray-100"
            )}
            style={{
              ...positioning,
              border: 'none',
              outline: 'none',
              clear: positioning.clear,
              textAlign: positioning.textAlign,
              float: positioning.float,
              margin: positioning.margin,
              width: positioning.width,
              visibility: 'visible',
              opacity: 1,
              display: 'block',
              position: 'static',
              transform: 'none',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
              backgroundColor: 'transparent'
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleBlockSelect(block.id);
            }}
          >
            <CoverLetterBlock
              block={{
                ...block,
                formatting: {
                  ...block.formatting,
                  alignment: positioning.textAlign
                },
                templateStyles: getBlockSpecificStyles(block.type, templateStyles)
              }}
              isSelected={selectedBlock === block.id}
              onSelect={() => handleBlockSelect(block.id)}
              previewMode={previewMode}
              onContentChange={(newContent: string) => 
                handleBlockContentChange(block.id, newContent)
              }
            />
          </div>
        );
      })}

      {/* Empty state */}
      {(!content.blocks || content.blocks.length === 0) && (
        <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">{t`No content yet`}</div>
            <div className="text-sm">{t`Add blocks from the left sidebar to get started`}</div>
          </div>
        </div>
      )}
    </div>

    {/* Page boundaries (only in edit mode) */}
    {editable && !previewMode && (
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 border-t border-gray-200" />
        <div className="absolute bottom-0 left-0 right-0 border-b border-gray-200" />
        <div className="absolute top-0 bottom-0 left-0 border-l border-gray-200" />
        <div className="absolute top-0 bottom-0 right-0 border-r border-gray-200" />
      </div>
    )}

    {/* Add print styles directly for PDF export */}
    <style>
      {`
        @media print {
          .professional-letter-container,
          .professional-letter-container * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: white !important;
            color: black !important;
          }
          .pdf-export-block {
            position: static !important;
            transform: none !important;
            page-break-inside: avoid;
          }
        }
      `}
    </style>
  </div>
);
  
};