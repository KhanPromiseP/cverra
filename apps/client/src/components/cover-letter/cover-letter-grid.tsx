
// // client/components/cover-letter/cover-letter-grid.tsx
// import { useCallback, useState, useEffect, useRef } from 'react';
// import { CoverLetterBlock } from './cover-letter-block';
// import { cn } from '../../libs/utils';
// import { useCoverLetterStore } from '../../../stores/cover-letter';
// import { generateTemplateStyles, getBlockSpecificStyles } from '../../libs/template-styles';

// interface CoverLetterGridProps {
//   content: any;
//   onContentChange: (content: any) => void;
//   onBlockSelect: (blockId: string) => void;
//   selectedBlock: string | null;
//   editable?: boolean;
//   previewMode?: boolean;
// }



// export const CoverLetterGrid = ({
  
//   content,
//   onContentChange,
//   onBlockSelect,
//   selectedBlock,
//   editable = true,
//   previewMode = false
// }: CoverLetterGridProps) => {
//   const { coverLetter } = useCoverLetterStore();
//   const containerRef = useRef<HTMLDivElement>(null);

  
  

//   // Get the current template structure
//   const structure = content?.structure || coverLetter?.structure || {
//     headerAlignment: 'left',
//     contactInfoPosition: 'header',
//     datePosition: 'right',
//     subjectLinePosition: 'center',
//     greetingAlignment: 'left',
//     paragraphSpacing: 'balanced',
//     signatureAlignment: 'left'
//   };

//   // Generate template styles
//   const templateStyles = generateTemplateStyles(structure);


  
//   // Apply template structure to block alignment
//   const getBlockAlignment = (blockType: string) => {
//     const alignments: Record<string, string> = {
//       'header': structure.headerAlignment,
//       'contact_info': structure.contactInfoPosition,
//       'greeting': structure.greetingAlignment,
//       'subject_line': structure.subjectLinePosition,
//       'signature': structure.signatureAlignment,
//       'date': structure.datePosition === 'right' ? 'right' : 'left'
//     };
    
//     return alignments[blockType] || 'left';
//   };

//   // Apply template structure to block positioning
//   const getBlockPositioning = (block: any, index: number) => {
//     const baseStyle = {
//       textAlign: getBlockAlignment(block.type) as 'left' | 'center' | 'right' | 'justify',
//       margin: '0 auto',
//       width: '100%'
//     };

//     // Get template-specific styles for this block type
//     const templateBlockStyles = getBlockSpecificStyles(block.type, templateStyles);

//     // Special positioning based on template structure - EXACTLY like original
//     switch (block.type) {
//       case 'header':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: structure.headerAlignment,
//           marginBottom: '20px',
//           fontSize: '24px',
//           marginTop: '50px',
//           fontWeight: 'bold'
//         };
      
//       case 'contact_info':
//         if (structure.contactInfoPosition === 'sidebar') {
//           return {
//             ...baseStyle,
//             ...templateBlockStyles,
//             textAlign: 'left',
//             width: '40%',
//             float: 'right',
//             marginTop: '60px',
//             marginLeft: '20px'
//           };
//         } else if (structure.contactInfoPosition === 'footer') {
//           return {
//             ...baseStyle,
//             ...templateBlockStyles,
//             textAlign: 'center',
//             marginTop: '20px',
//             fontSize: '12px',
//             color: '#666'
//           };
//         }
//         return { 
//           ...baseStyle, 
//           ...templateBlockStyles 
//         };
      
//       case 'date':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: structure.datePosition === 'right' ? 'right' : 'left',
//           marginBottom: '20px'
//         };
      
//       case 'greeting':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: structure.greetingAlignment,
//           marginBottom: '10px'
//         };
      
//       case 'subject_line':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: structure.subjectLinePosition || 'left',
//           marginBottom: '15px',
          
//         };
      
//       case 'body_paragraph':
//         const spacingMap: Record<string, string> = {
//           'compact': '10px',
//           'balanced': '15px',
//           'generous': '25px',
//           'creative': '20px',
//           'minimal': '5px',
//           'traditional': '20px',
//           'academic': '18px',
//           'technical': '12px'
//         };
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: 'left',
//           marginBottom: spacingMap[structure.paragraphSpacing] || '15px',
//           lineHeight: structure.paragraphSpacing === 'compact' ? '1.3' : 
//                      structure.paragraphSpacing === 'generous' ? '1.8' : '1.5'
//         };
      
//       case 'closing':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: 'left',
//           marginTop: '20px',
//           marginBottom: '10px'
//         };
      
//       case 'signature':
//         return {
//           ...baseStyle,
//           ...templateBlockStyles,
//           textAlign: structure.signatureAlignment,
//           marginTop: '40px'
//         };
      
//       default:
//         return { ...baseStyle, ...templateBlockStyles };
//     }
//   };

//   const handleBlockSelect = (blockId: string) => {
//     if (!previewMode) {
//       onBlockSelect(blockId);
//     }
//   };

//   const handleContainerClick = (e: React.MouseEvent) => {
//     if (!previewMode && selectedBlock && e.target === e.currentTarget) {
//       onBlockSelect(null as any);
//     }
//   };


// const generateBorderStyles = () => {
//   const borderStyle = coverLetter?.structure?.borderStyle;
  
//   if (!borderStyle?.enabled) {
//     return {};
//   }

//   console.log('Applying border with settings:', borderStyle);

//   // Define the same margins as the gray guidelines
//   const pageMargins = {
//     top: borderStyle.margin || 80,    // matches top-20 (5rem = 80px)
//     bottom: borderStyle.margin || 40, // matches bottom-10 (2.5rem = 40px)
//     left: borderStyle.margin || 32,   // matches left-8 (2rem = 32px)
//     right: borderStyle.margin || 32,  // matches right-8 (2rem = 32px)
//   };

//   // Create border CSS based on width
//   const borderWidthMap = {
//     'thin': '1px',
//     'medium': '2px',
//     'thick': '3px'
//   };

//   const borderCss = `${borderWidthMap[borderStyle.width as keyof typeof borderWidthMap] || '1px'} 
//                      ${borderStyle.type} 
//                      ${borderStyle.color || '#000000'}`;

//   // Calculate position for absolute border overlay
//   // This will be applied to a separate div that sits on top
//   const borderStyles = {
//     position: 'absolute' as const,
//     top: `${pageMargins.top}px`,
//     bottom: `${pageMargins.bottom}px`,
//     left: `${pageMargins.left}px`,
//     right: `${pageMargins.right}px`,
//     pointerEvents: 'none' as const,
//     zIndex: 10,
//   };

//   // Apply borders to specific sides
//   if (borderStyle.sides === 'all') {
//     Object.assign(borderStyles, {
//       border: borderCss,
//     });
//   } else {
//     if (borderStyle.sides.includes('top') || borderStyle.sides === 'top-bottom') {
//       Object.assign(borderStyles, {
//         borderTop: borderCss,
//       });
//     }
//     if (borderStyle.sides.includes('bottom') || borderStyle.sides === 'top-bottom') {
//       Object.assign(borderStyles, {
//         borderBottom: borderCss,
//       });
//     }
//     if (borderStyle.sides.includes('left') || borderStyle.sides === 'left-right') {
//       Object.assign(borderStyles, {
//         borderLeft: borderCss,
//       });
//     }
//     if (borderStyle.sides.includes('right') || borderStyle.sides === 'left-right') {
//       Object.assign(borderStyles, {
//         borderRight: borderCss,
//       });
//     }
//   }

//   return borderStyles;
// };



// // Also apply margins and padding
// const generateContainerStyles = () => {
//   const borderStyle = coverLetter?.structure?.borderStyle;
  
//   return {
//     // Border styles
//     ...generateBorderStyles(),
    
//     // Margin and padding
//     margin: borderStyle?.margin ? `${borderStyle.margin}px` : '0',
//     padding: borderStyle?.padding ? `${borderStyle.padding}px` : '50px 70px',
    
//     // Make sure background is visible
//     backgroundColor: 'white',
//   };
// };

//   // Debug: Log the current structure and content
//   useEffect(() => {
//     console.log('Current template structure:', structure);
//     console.log('Template styles generated:', templateStyles);
//     console.log('Current blocks with content:', 
//       content.blocks?.map((b: any) => ({
//         id: b.id,
//         type: b.type,
//         content: b.content,
//         hasContent: !!b.content
//       }))
//     );
//   }, [structure, content.blocks, templateStyles]);

//   // Update the return JSX to include the border overlay
// return (
//   <div className={cn(
//     "h-full pt-36 transition-all",
//     previewMode
//   )}>
//     <div 
//       ref={containerRef}
//       className={cn(
//         "pt-36 px-6 pb-6 bg-white mx-auto transition-all duration-300 professional-letter-container relative",
//         previewMode ? "border-0" : "shadow-lg border-0",
//         "min-h-[1123px] max-w-4xl"
//       )}
//       data-cover-letter-grid="true"
//       style={{ 
//         width: '1200px',
//         minHeight: '1123px',
//         position: 'relative',
//         backgroundColor: templateStyles.container?.backgroundColor || 'white',
//         background: templateStyles.container?.background,
//         ...templateStyles.container
//       }}
//       onClick={handleContainerClick}
//     >
//       {/* Apply template-specific container styles */}
//       <div 
//         className="w-full h-auto relative"
//         style={{
//           padding: structure.paragraphSpacing === 'compact' ? '40px 60px' :
//                   structure.paragraphSpacing === 'generous' ? '60px 80px' :
//                   '50px 70px'
//         }}
//       >
//         {content.blocks?.map((block: any, index: number) => {
//           const positioning = getBlockPositioning(block, index);
          
//           return (
//             <div
//               key={block.id}
//               data-block-id={block.id}
//               className={cn(
//                 "transition-all duration-200 relative",
//                 selectedBlock === block.id && !previewMode 
//                   ? "ring-2 ring-blue-500 z-10 shadow-md" 
//                   : "border-0",
//                 previewMode && "border-0 shadow-none cursor-default",
//                 editable && !previewMode && "cursor-pointer hover:shadow-sm hover:ring-1 hover:ring-gray-300"
//               )}
//               style={{
//                 ...positioning,
//                 border: 'none',
//                 outline: 'none',
//                 clear: (positioning as any).clear,
//                 textAlign: positioning.textAlign as any,
//                 float: (positioning as any).float,
//                 margin: positioning.margin as any,
//                 width: positioning.width as any,
//               }}
//               onClick={(e) => {
//                 e.stopPropagation();
//                 handleBlockSelect(block.id);
//               }}
//             >
//               <CoverLetterBlock
//                 block={{
//                   ...block,
//                   formatting: {
//                     ...block.formatting,
//                     alignment: positioning.textAlign
//                   },
//                   templateStyles: getBlockSpecificStyles(block.type, templateStyles)
//                 }}
//                 isSelected={selectedBlock === block.id}
//                 onSelect={() => handleBlockSelect(block.id)}
//                 previewMode={previewMode}
//               />
//             </div>
//           );
//         })}

//         {/* Empty state */}
//         {(!content.blocks || content.blocks.length === 0) && (
//           <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg mt-20">
//             <div className="text-center">
//               <div className="text-lg font-medium mb-2">No content yet</div>
//               <div className="text-sm">Add blocks to get started</div>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Page boundaries (gray guidelines) */}
//       {editable && !previewMode && (
//         <div className="absolute inset-0 pointer-events-none">
//           <div className="absolute top-20 left-8 right-8 border-t border-gray-200" />
//           <div className="absolute bottom-10 left-8 right-8 border-b border-gray-200" />
//           <div className="absolute top-20 bottom-10 left-8 border-l border-gray-200" />
//           <div className="absolute top-20 bottom-10 right-8 border-r border-gray-200" />
//         </div>
//       )}

//       {/* User-defined border overlay (appears on top of gray guidelines) */}
//       {coverLetter?.structure?.borderStyle?.enabled && (
//         <div 
//           className="absolute pointer-events-none"
//           style={generateBorderStyles()}
//         />
//       )}
//     </div>
//   </div>
// );
// };










// client/components/cover-letter/cover-letter-grid.tsx
import { useCallback, useState, useEffect, useRef } from 'react';
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
  const { coverLetter } = useCoverLetterStore();
  const containerRef = useRef<HTMLDivElement>(null);

  
  

  // Get the current template structure
  const structure = content?.structure || coverLetter?.structure || {
    headerAlignment: 'left',
    contactInfoPosition: 'header',
    datePosition: 'right',
    subjectLinePosition: 'center',
    greetingAlignment: 'left',
    paragraphSpacing: 'balanced',
    signatureAlignment: 'left'
  };

  // Generate template styles
  const templateStyles = generateTemplateStyles(structure);


  
  // Apply template structure to block alignment
  const getBlockAlignment = (blockType: string) => {
    const alignments: Record<string, string> = {
      'header': structure.headerAlignment,
      'contact_info': structure.contactInfoPosition,
      'greeting': structure.greetingAlignment,
      'subject_line': structure.subjectLinePosition,
      'signature': structure.signatureAlignment,
      'date': structure.datePosition === 'right' ? 'right' : 'left'
    };
    
    return alignments[blockType] || 'left';
  };

  // Apply template structure to block positioning
  const getBlockPositioning = (block: any, index: number) => {
    const baseStyle = {
      textAlign: getBlockAlignment(block.type) as 'left' | 'center' | 'right' | 'justify',
      margin: '0 auto',
      width: '100%'
    };

    // Get template-specific styles for this block type
    const templateBlockStyles = getBlockSpecificStyles(block.type, templateStyles);

    // Special positioning based on template structure - EXACTLY like original
    switch (block.type) {
      case 'header':
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: structure.headerAlignment,
          marginBottom: '20px',
          fontSize: '24px',
          marginTop: '50px',
          fontWeight: 'bold'
        };
      
      case 'contact_info':
        if (structure.contactInfoPosition === 'sidebar') {
          return {
            ...baseStyle,
            ...templateBlockStyles,
            textAlign: 'left',
            width: '40%',
            float: 'right',
            marginTop: '60px',
            marginLeft: '20px'
          };
        } else if (structure.contactInfoPosition === 'footer') {
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
          textAlign: structure.datePosition === 'right' ? 'right' : 'left',
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
          textAlign: structure.subjectLinePosition || 'left',
          marginBottom: '15px',
          
        };
      
      case 'body_paragraph':
        const spacingMap: Record<string, string> = {
          'compact': '10px',
          'balanced': '15px',
          'generous': '25px',
          'creative': '20px',
          'minimal': '5px',
          'traditional': '20px',
          'academic': '18px',
          'technical': '12px'
        };
        return {
          ...baseStyle,
          ...templateBlockStyles,
          textAlign: 'left',
          marginBottom: spacingMap[structure.paragraphSpacing] || '15px',
          lineHeight: structure.paragraphSpacing === 'compact' ? '1.3' : 
                     structure.paragraphSpacing === 'generous' ? '1.8' : '1.5'
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
  };

  const handleBlockSelect = (blockId: string) => {
    if (!previewMode) {
      onBlockSelect(blockId);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!previewMode && selectedBlock && e.target === e.currentTarget) {
      onBlockSelect(null as any);
    }
  };

  // Debug: Log the current structure and content
  useEffect(() => {
    console.log('Current template structure:', structure);
    console.log('Template styles generated:', templateStyles);
    console.log('Current blocks with content:', 
      content.blocks?.map((b: any) => ({
        id: b.id,
        type: b.type,
        content: b.content,
        hasContent: !!b.content
      }))
    );
  }, [structure, content.blocks, templateStyles]);

  return (
    <div className={cn(
      "h-full pt-36 transition-all",
      previewMode
    )}>
      <div 
        ref={containerRef}
        className={cn(
          "pt-36 px-6 pb-6 bg-white mx-auto transition-all duration-300 professional-letter-container relative",
          previewMode ? "border-0" : "shadow-lg border-0",
          "min-h-[1123px] max-w-4xl"
        )}
        data-cover-letter-grid="true"
        style={{ 
          width: '1200px',
          minHeight: '1123px',
          position: 'relative',
          // margin: '0px, 80px, 90px, 89px',
          // Apply template container styles (borders, background, etc.)
          // But maintain white background as fallback
          backgroundColor: templateStyles.container?.backgroundColor || 'white',
          background: templateStyles.container?.background,
          ...templateStyles.container
        }}
        onClick={handleContainerClick}
      >
        {/* Apply template-specific container styles */}
        <div 
          className="w-full h-auto p-8"
          style={{
            padding: structure.paragraphSpacing === 'compact' ? '40px 60px' :
                    structure.paragraphSpacing === 'generous' ? '60px 80px' :
                    '50px 70px'
          }}
        >
          {content.blocks?.map((block: any, index: number) => {
            const positioning = getBlockPositioning(block, index);
            
            return (
              <div
                key={block.id}
                data-block-id={block.id}
                className={cn(
                  "transition-all duration-200 relative",
                  selectedBlock === block.id && !previewMode 
                    ? "ring-2 ring-blue-500 z-10 shadow-md" 
                    : "border-0",
                  previewMode && "border-0 shadow-none cursor-default",
                  editable && !previewMode && "cursor-pointer hover:shadow-sm hover:ring-1 hover:ring-gray-300"
                )}
                style={{
                  ...positioning,
                  border: 'none',
                  outline: 'none',
                  clear: (positioning as any).clear,
                  textAlign: positioning.textAlign as any,
                  float: (positioning as any).float,
                  margin: positioning.margin as any,
                  width: positioning.width as any,
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
                    // Pass template styles to the block
                    templateStyles: getBlockSpecificStyles(block.type, templateStyles)
                  }}
                  isSelected={selectedBlock === block.id}
                  onSelect={() => handleBlockSelect(block.id)}
                  previewMode={previewMode}
                />
              </div>
            );
          })}

          {/* Empty state */}
          {(!content.blocks || content.blocks.length === 0) && (
            <div className="flex items-center justify-center h-32 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg mt-20">
              <div className="text-center">
                <div className="text-lg font-medium mb-2">No content yet</div>
                <div className="text-sm">Add blocks to get started</div>
              </div>
            </div>
          )}
        </div>

        {/* Page boundaries */}
        {editable && !previewMode && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-8 right-8 border-t border-gray-200" />
            <div className="absolute bottom-10 left-8 right-8 border-b border-gray-200" />
            <div className="absolute top-20 bottom-10 left-8 border-l border-gray-200" />
            <div className="absolute top-20 bottom-10 right-8 border-r border-gray-200" />
          </div>
        )}
      </div>
    </div>
  );
};