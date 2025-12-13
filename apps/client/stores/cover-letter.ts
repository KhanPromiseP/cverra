// client/stores/cover-letter.ts
import { create } from 'zustand';



// Enhanced template utility functions
const getTemplateById = (templateId: string) => {
  const templates = {
    modern: {
      id: 'modern',
      name: 'Modern',
      style: 'Modern',
      description: 'Clean, contemporary design with left-aligned header and compact spacing',
      premium: false,
      layout: 'modern',
      structure: {
        headerAlignment: 'left',
        contactInfoPosition: 'header',
        datePosition: 'right',
        greetingAlignment: 'left',
        paragraphSpacing: 'compact',
        signatureAlignment: 'left'
      },
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#2563eb',
      backgroundColor: '#ffffff',
      spacing: 'compact'
    },
    executive: {
      id: 'executive',
      name: 'Executive',
      style: 'Executive',
      description: 'Sophisticated, centered layout with formal spacing for leadership roles',
      premium: true,
      layout: 'executive',
      structure: {
        headerAlignment: 'center',
        contactInfoPosition: 'separate',
        datePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'generous',
        signatureAlignment: 'center'
      },
      fontFamily: 'Georgia, serif',
      primaryColor: '#1e40af',
      backgroundColor: '#f8fafc',
      spacing: 'generous'
    },
    creative: {
      id: 'creative',
      name: 'Creative',
      style: 'Creative',
      description: 'Innovative layout with right-aligned elements and creative spacing',
      premium: false,
      layout: 'creative',
      structure: {
        headerAlignment: 'right',
        contactInfoPosition: 'footer',
        datePosition: 'right',
        greetingAlignment: 'left',
        paragraphSpacing: 'creative',
        signatureAlignment: 'right'
      },
      fontFamily: 'Helvetica Neue, sans-serif',
      primaryColor: '#7c3aed',
      backgroundColor: '#faf5ff',
      spacing: 'creative'
    },
    minimalist: {
      id: 'minimalist',
      name: 'Minimalist',
      style: 'Minimalist',
      description: 'Ultra-clean layout with essential information only',
      premium: false,
      layout: 'minimalist',
      structure: {
        headerAlignment: 'left',
        contactInfoPosition: 'minimal',
        datePosition: 'none',
        greetingAlignment: 'left',
        paragraphSpacing: 'minimal',
        signatureAlignment: 'left'
      },
      fontFamily: 'Verdana, sans-serif',
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      spacing: 'minimal'
    },
    traditional: {
      id: 'traditional',
      name: 'Traditional',
      style: 'Traditional',
      description: 'Classic business letter format with full block style',
      premium: false,
      layout: 'traditional',
      structure: {
        headerAlignment: 'left',
        contactInfoPosition: 'header',
        datePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'traditional',
        signatureAlignment: 'left'
      },
      fontFamily: 'Times New Roman, serif',
      primaryColor: '#1f2937',
      backgroundColor: '#ffffff',
      spacing: 'traditional'
    },
    professional: {
      id: 'professional',
      name: 'Professional',
      style: 'Professional',
      description: 'Balanced modified block style for corporate environments',
      premium: false,
      layout: 'professional',
      structure: {
        headerAlignment: 'center',
        contactInfoPosition: 'header',
        datePosition: 'right',
        greetingAlignment: 'left',
        paragraphSpacing: 'balanced',
        signatureAlignment: 'center'
      },
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#059669',
      backgroundColor: '#f0fdf4',
      spacing: 'balanced'
    },
    academic: {
      id: 'academic',
      name: 'Academic',
      style: 'Academic',
      description: 'Formal layout for research and academic positions',
      premium: true,
      layout: 'academic',
      structure: {
        headerAlignment: 'left',
        contactInfoPosition: 'detailed',
        datePosition: 'left',
        greetingAlignment: 'left',
        paragraphSpacing: 'academic',
        signatureAlignment: 'left'
      },
      fontFamily: 'Times New Roman, serif',
      primaryColor: '#4338ca',
      backgroundColor: '#f8fafc',
      spacing: 'academic'
    },
    technical: {
      id: 'technical',
      name: 'Technical',
      style: 'Technical',
      description: 'Structured layout emphasizing skills and projects',
      premium: false,
      layout: 'technical',
      structure: {
        headerAlignment: 'left',
        contactInfoPosition: 'sidebar',
        datePosition: 'right',
        greetingAlignment: 'left',
        paragraphSpacing: 'technical',
        signatureAlignment: 'left'
      },
      fontFamily: 'Consolas, monospace',
      primaryColor: '#dc2626',
      backgroundColor: '#fef2f2',
      spacing: 'technical'
    }
  };
  
  return templates[templateId as keyof typeof templates] || templates.professional;
};

// NEW: Get all available templates
const getAllTemplates = () => {
  return [
    'modern', 'executive', 'creative', 'minimalist', 
    'traditional', 'professional', 'academic', 'technical'
  ].map(id => getTemplateById(id));
};

// NEW: Enhanced layout generator based on template structure
const generateEnhancedLayout = (structure: any, blocks: any[]) => {
  const layout: any[] = [];
  let yPosition = 0;

  // Helper function to get X position based on alignment
  const getXPosition = (alignment: string, blockWidth: number) => {
    switch (alignment) {
      case 'center': return Math.floor((12 - blockWidth) / 2);
      case 'right': return 12 - blockWidth;
      default: return 0;
    }
  };

  // Header block
  const headerBlock = blocks.find((b: any) => b.type === 'header');
  if (headerBlock) {
    const headerWidth = structure.headerAlignment === 'center' ? 8 : 12;
    layout.push({
      i: headerBlock.id,
      x: getXPosition(structure.headerAlignment, headerWidth),
      y: yPosition,
      w: headerWidth,
      h: structure.headerAlignment === 'center' ? 3 : 2,
      minW: 6,
      minH: 2
    });
    yPosition += structure.headerAlignment === 'center' ? 3 : 2;
  }

  // Contact Info block
  const contactBlock = blocks.find((b: any) => b.type === 'contact_info');


  // Date position
  const dateBlock = blocks.find((b: any) => b.type === 'date');
  if (dateBlock && structure.datePosition !== 'none') {
    layout.push({
      i: dateBlock.id,
      x: structure.datePosition === 'right' ? 8 : 0,
      y: yPosition,
      w: 4,
      h: 1,
      minW: 3,
      minH: 1
    });
    yPosition += 1;
  }

  // Greeting
  const greetingBlock = blocks.find((b: any) => b.type === 'greeting');
  if (greetingBlock) {
    layout.push({
      i: greetingBlock.id,
      x: getXPosition(structure.greetingAlignment, 12),
      y: yPosition,
      w: 12,
      h: 1,
      minW: 8,
      minH: 1
    });
    yPosition += 1;
  }

  // Body paragraphs with appropriate spacing
  const bodyBlocks = blocks.filter((b: any) => b.type.startsWith('body_paragraph'));
  const paragraphHeights: Record<string, number> = {
    compact: 3,
    generous: 4,
    creative: 5,
    minimal: 2,
    traditional: 4,
    balanced: 3,
    academic: 4,
    technical: 3
  };
  
  bodyBlocks.forEach((block: any) => {
    const height = paragraphHeights[structure.paragraphSpacing] || 3;
    layout.push({
      i: block.id,
      x: 0,
      y: yPosition,
      w: 12,
      h: height,
      minW: 10,
      minH: height - 1
    });
    yPosition += height;
  });

  // Closing
  const closingBlock = blocks.find((b: any) => b.type === 'closing');
  if (closingBlock) {
    layout.push({
      i: closingBlock.id,
      x: 0,
      y: yPosition,
      w: 12,
      h: 1,
      minW: 8,
      minH: 1
    });
    yPosition += 1;
  }

  // Signature
  const signatureBlock = blocks.find((b: any) => b.type === 'signature');
  if (signatureBlock) {
    const signatureWidth = structure.signatureAlignment === 'center' ? 6 : 4;
    layout.push({
      i: signatureBlock.id,
      x: getXPosition(structure.signatureAlignment, signatureWidth),
      y: yPosition,
      w: signatureWidth,
      h: 2,
      minW: 3,
      minH: 1
    });
  }

  // Handle footer contact info
  if (contactBlock && structure.contactInfoPosition === 'footer') {
    layout.push({
      i: contactBlock.id,
      x: 0,
      y: yPosition + 2,
      w: 12,
      h: 1,
      minW: 8,
      minH: 1
    });
  }

  return layout;
};

// NEW: Get block alignment based on template structure
const getBlockAlignment = (blockType: string, structure: any) => {
  const alignments: Record<string, string> = {
    'header': structure.headerAlignment,
    'greeting': structure.greetingAlignment,
    'signature': structure.signatureAlignment,
    'date': structure.datePosition === 'right' ? 'right' : 'left'
  };
  
  return alignments[blockType] || 'left';
};

// Existing template utility functions (keep these)
const getTemplateFontFamily = (style: string) => {
  const fontMap: Record<string, string> = {
    'Modern': 'Arial, sans-serif',
    'Executive': 'Georgia, serif',
    'Creative': 'Helvetica Neue, sans-serif',
    'Minimalist': 'Verdana, sans-serif',
    'Traditional': 'Times New Roman, serif',
    'Professional': 'Arial, sans-serif',
    'Academic': 'Times New Roman, serif',
    'Technical': 'Consolas, monospace'
  };
  return fontMap[style] || 'Arial, sans-serif';
};

const getTemplateFontSize = (style: string, blockType: string) => {
  const baseSizes: Record<string, Record<string, string>> = {
    'Modern': {
      'header': '24px',
      'content': '14px',
      'default': '14px'
    },
    'Executive': {
      'header': '26px',
      'content': '15px',
      'default': '15px'
    },
    'Creative': {
      'header': '28px',
      'content': '16px',
      'default': '16px'
    },
    'Minimalist': {
      'header': '20px',
      'content': '13px',
      'default': '13px'
    },
    'Traditional': {
      'header': '22px',
      'content': '14px',
      'default': '14px'
    },
    'Professional': {
      'header': '24px',
      'content': '14px',
      'default': '14px'
    },
    'Academic': {
      'header': '22px',
      'content': '14px',
      'default': '14px'
    },
    'Technical': {
      'header': '20px',
      'content': '13px',
      'default': '13px'
    }
  };
  
  const styleSizes = baseSizes[style] || baseSizes.Professional;
  return styleSizes[blockType] || styleSizes.default;
};

const getTemplateTextColor = (style: string) => {
  const colorMap: Record<string, string> = {
    'Modern': '#1f2937',
    'Executive': '#111827',
    'Creative': '#374151',
    'Minimalist': '#000000',
    'Traditional': '#1f2937',
    'Professional': '#064e3b',
    'Academic': '#1f2937',
    'Technical': '#1f2937'
  };
  return colorMap[style] || '#1f2937';
};

const getTemplateLineHeight = (spacing: string) => {
  const lineHeights: Record<string, string> = {
    'compact': '1.3',
    'generous': '1.6',
    'creative': '1.5',
    'minimal': '1.2',
    'traditional': '1.4',
    'balanced': '1.5',
    'academic': '1.4',
    'technical': '1.3'
  };
  return lineHeights[spacing] || '1.5';
};

const applyTemplateBlocks = (template: any, existingBlocks: any[]) => {
  return existingBlocks.map((block: any) => ({
    ...block,
    formatting: {
      ...block.formatting,
      fontFamily: template.fontFamily,
      fontSize: getTemplateFontSize(template.style, block.type),
      color: getTemplateTextColor(template.style),
      backgroundColor: template.backgroundColor,
      lineHeight: getTemplateLineHeight(template.spacing)
    }
  }));
};

const applyTemplateLayout = (template: any, blocks: any[]) => {
  return blocks.map((block: any, index: number) => ({
    i: block.id,
    x: 0,
    y: index * 4,
    w: 12,
    h: 4,
    minW: 2,
    minH: 2
  }));
};

const getDefaultTemplateBlocks = (template: any) => {
  return [
    {
      id: 'header-1',
      type: 'header',
      content: 'Your Name',
      formatting: {
        fontFamily: template.fontFamily,
        fontSize: getTemplateFontSize(template.style, 'header'),
        color: getTemplateTextColor(template.style),
        alignment: 'center'
      }
    },
    {
      id: 'content-1',
      type: 'content',
      content: 'Professional cover letter content...',
      formatting: {
        fontFamily: template.fontFamily,
        fontSize: getTemplateFontSize(template.style, 'content'),
        color: getTemplateTextColor(template.style),
        alignment: 'left'
      }
    }
  ];
};

const getDefaultTemplateLayout = (template: any) => {
  const blocks = getDefaultTemplateBlocks(template);
  return applyTemplateLayout(template, blocks);
};

export interface CoverLetter {
  id: string;
  title: string;
  content: {
    blocks: any[];
    layout: any[];
    style: string;
    layoutType?: string;
    structure?: any;
    lastSaved?: string;
    category?: string;
  };
  style: string;
  layout?: string;
  structure?: any;
  createdAt: string;
  updatedAt: string;
}

interface CoverLetterState {
  coverLetter: CoverLetter | null;
  selectedBlock: string | null;
  availableTemplates: any[];
  previewTemplate: string | null;
  
  setCoverLetter: (coverLetter: CoverLetter) => void;
  setSelectedBlock: (blockId: string | null) => void;
  updateCoverLetter: (updates: Partial<CoverLetter>) => void;
  updateBlock: (blockId: string, updates: any) => void;
  updateBlockLayout: (blockId: string, layout: any) => void;
  moveBlock: (blockId: string, direction: 'up' | 'down') => void;
  resizeBlock: (blockId: string, dimension: 'width' | 'height', value: number) => void;
  addBlock: (block: any, position?: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  reorderBlocks: (sourceIndex: number, destinationIndex: number) => void;
  applyTemplate: (template: any) => void;
  updateStyle: (style: string) => void;
  applyTemplateStructure: (templateId: string) => void;
  resetToTemplate: (template: any) => void;
  
  // New enhanced methods
  setPreviewTemplate: (templateId: string | null) => void;
  getTemplateStructure: (templateId: string) => any;
  applyEnhancedTemplate: (template: any) => void;
  updateContentStructure: (structure: any) => void;
  regenerateLayout: (structure?: any) => void;
  getBlockAlignment: (blockType: string, structure: any) => string;

  addBlockAtPosition: (block: any, x: number, y: number, w?: number, h?: number) => void;

  forceUpdateLayout: (newLayout: any[]) => void;


}

export const useCoverLetterStore = create<CoverLetterState>((set, get) => ({
  coverLetter: null,
  selectedBlock: null,
  availableTemplates: getAllTemplates(),
  previewTemplate: null,
  
  setCoverLetter: (coverLetter) => set({ coverLetter }),
  
  setSelectedBlock: (selectedBlock) => set({ selectedBlock }),
  
  updateCoverLetter: (updates) => set((state) => ({
    coverLetter: state.coverLetter ? { 
      ...state.coverLetter, 
      ...updates,
      updatedAt: new Date().toISOString()
    } : null
  })),

  // Force update layout (for manual positioning)
forceUpdateLayout: (newLayout: any[]) => set((state) => {
  if (!state.coverLetter) return state;
  
  return {
    coverLetter: {
      ...state.coverLetter,
      content: {
        ...state.coverLetter.content,
        layout: newLayout,
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }
  };
}),

moveBlock: (blockId, direction) => set((state) => {
  if (!state.coverLetter?.content?.blocks || !state.coverLetter.content.layout) return state;
  
  const blocks = [...state.coverLetter.content.blocks];
  const currentIndex = blocks.findIndex(b => b.id === blockId);
  
  if (currentIndex === -1) return state;
  
  let newIndex;
  if (direction === 'up' && currentIndex > 0) {
    newIndex = currentIndex - 1;
  } else if (direction === 'down' && currentIndex < blocks.length - 1) {
    newIndex = currentIndex + 1;
  } else {
    return state; // Can't move further
  }
  
  // Swap blocks
  [blocks[currentIndex], blocks[newIndex]] = [blocks[newIndex], blocks[currentIndex]];
  
  // Update layout positions to match new order
  const updatedLayout = blocks.map((block, index) => {
    const existingLayout = state.coverLetter!.content.layout.find((item: any) => item.i === block.id);
    return {
      ...existingLayout,
      y: index * 4 // Adjust Y position based on new order
    };
  });
  
  return {
    coverLetter: {
      ...state.coverLetter,
      content: {
        ...state.coverLetter.content,
        blocks,
        layout: updatedLayout,
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    }
  };
}),



// Add block with specific position
addBlockAtPosition: (block: any, x: number, y: number, w: number = 6, h: number = 4) => set((state) => {
  if (!state.coverLetter) return state;
  
  const newBlock = {
    ...block,
    id: block.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  const newLayoutItem = {
    i: newBlock.id,
    x: Math.max(0, Math.min(11, x)), // Ensure within grid bounds
    y: y,
    w: Math.max(1, Math.min(12, w)),
    h: Math.max(1, h),
    minW: 2,
    minH: 2
  };
  
  return {
    coverLetter: {
      ...state.coverLetter,
      content: {
        ...state.coverLetter.content,
        blocks: [...state.coverLetter.content.blocks, newBlock],
        layout: [...state.coverLetter.content.layout, newLayoutItem],
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    },
    selectedBlock: newBlock.id
  };
}),
  
  updateBlock: (blockId, updates) => set((state) => {
    if (!state.coverLetter) return state;
    
    const updatedBlocks = state.coverLetter.content.blocks.map((block: any) =>
      block.id === blockId ? { ...block, ...updates } : block
    );
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          blocks: updatedBlocks,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),

  setPreviewTemplate: (templateId) => set({ previewTemplate: templateId }),
  
  getTemplateStructure: (templateId) => {
    const template = getTemplateById(templateId);
    return template.structure;
  },
  
  applyEnhancedTemplate: (template) => set((state) => {
    if (!state.coverLetter) return state;
    
    const enhancedBlocks = state.coverLetter.content.blocks.map((block: any) => ({
      ...block,
      formatting: {
        ...block.formatting,
        fontFamily: template.fontFamily,
        fontSize: getTemplateFontSize(template.style, block.type),
        color: getTemplateTextColor(template.style),
        alignment: getBlockAlignment(block.type, template.structure),
        backgroundColor: template.backgroundColor,
        lineHeight: getTemplateLineHeight(template.spacing)
      }
    }));
    
    const enhancedLayout = generateEnhancedLayout(template.structure, enhancedBlocks);
    
    return {
      coverLetter: {
        ...state.coverLetter,
        style: template.style,
        layout: template.layout,
        structure: template.structure,
        content: {
          ...state.coverLetter.content,
          style: template.style,
          layoutType: template.layout,
          structure: template.structure,
          blocks: enhancedBlocks,
          layout: enhancedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  updateContentStructure: (structure) => set((state) => {
    if (!state.coverLetter) return state;
    
    const updatedLayout = generateEnhancedLayout(structure, state.coverLetter.content.blocks);
    
    return {
      coverLetter: {
        ...state.coverLetter,
        structure: structure,
        content: {
          ...state.coverLetter.content,
          structure: structure,
          layout: updatedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  regenerateLayout: (structure) => set((state) => {
    if (!state.coverLetter) return state;
    
    const structureToUse = structure || state.coverLetter.structure;
    const updatedLayout = generateEnhancedLayout(structureToUse, state.coverLetter.content.blocks);
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          layout: updatedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  getBlockAlignment: (blockType, structure) => {
    return getBlockAlignment(blockType, structure);
  },
  
  updateBlockLayout: (blockId, layout) => set((state) => {
    if (!state.coverLetter?.content?.layout) return state;
    
    const updatedLayout = state.coverLetter.content.layout.map((item: any) =>
      item.i === blockId ? { ...item, ...layout } : item
    );
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          layout: updatedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  
  
  resizeBlock: (blockId, dimension, value) => set((state) => {
    if (!state.coverLetter?.content?.layout) return state;
    
    const layout = state.coverLetter.content.layout.find((item: any) => item.i === blockId);
    if (!layout) return state;
    
    const updatedLayout = {
      ...layout,
      w: dimension === 'width' ? Math.max(1, Math.min(12, value)) : layout.w,
      h: dimension === 'height' ? Math.max(1, value) : layout.h
    };
    
    if (dimension === 'width' && updatedLayout.x + updatedLayout.w > 12) {
      updatedLayout.x = Math.max(0, 12 - updatedLayout.w);
    }
    
    const updatedLayouts = state.coverLetter.content.layout.map((item: any) =>
      item.i === blockId ? updatedLayout : item
    );
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          layout: updatedLayouts,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  addBlock: (block, position) => set((state) => {
  if (!state.coverLetter?.content?.blocks || !state.coverLetter.content.layout) return state;
  
  const newBlock = {
    ...block,
    id: block.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  const blocks = [...state.coverLetter.content.blocks];
  
  // Insert at specified position or at the end
  if (position !== undefined && position >= 0 && position <= blocks.length) {
    blocks.splice(position, 0, newBlock);
  } else {
    blocks.push(newBlock);
  }
  
  // Regenerate layout based on new block order
  const updatedLayout = blocks.map((block, index) => {
    const existingLayout = state.coverLetter!.content.layout.find((item: any) => item.i === block.id);
    const fallbackLayout = {
      i: block.id,
      x: 0,
      y: index * 4,
      w: 6,
      h: 4,
      minW: 2,
      minH: 2
    };
    
    return existingLayout || fallbackLayout;
  });
  
  return {
    coverLetter: {
      ...state.coverLetter,
      content: {
        ...state.coverLetter.content,
        blocks,
        layout: updatedLayout,
        lastSaved: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    },
    selectedBlock: newBlock.id
  };
}),
  
  removeBlock: (blockId) => set((state) => {
    if (!state.coverLetter) return state;
    
    const updatedBlocks = state.coverLetter.content.blocks.filter((block: any) => block.id !== blockId);
    const updatedLayout = state.coverLetter.content.layout.filter((item: any) => item.i !== blockId);
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          blocks: updatedBlocks,
          layout: updatedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      selectedBlock: state.selectedBlock === blockId ? null : state.selectedBlock
    };
  }),
  
  duplicateBlock: (blockId) => set((state) => {
    if (!state.coverLetter) return state;
    
    const originalBlock = state.coverLetter.content.blocks.find((block: any) => block.id === blockId);
    const originalLayout = state.coverLetter.content.layout.find((item: any) => item.i === blockId);
    
    if (!originalBlock || !originalLayout) return state;
    
    const newBlockId = `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const duplicatedBlock = {
      ...originalBlock,
      id: newBlockId
    };
    
    const duplicatedLayout = {
      ...originalLayout,
      i: newBlockId,
      x: originalLayout.x + 1,
      y: originalLayout.y + 1
    };
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          blocks: [...state.coverLetter.content.blocks, duplicatedBlock],
          layout: [...state.coverLetter.content.layout, duplicatedLayout],
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      selectedBlock: newBlockId
    };
  }),
  
  reorderBlocks: (sourceIndex, destinationIndex) => set((state) => {
    if (!state.coverLetter) return state;
    
    const { blocks, layout } = state.coverLetter.content;
    
    const updatedBlocks = [...blocks];
    const [movedBlock] = updatedBlocks.splice(sourceIndex, 1);
    updatedBlocks.splice(destinationIndex, 0, movedBlock);
    
    const updatedLayout = updatedBlocks.map((block, index) => {
      const existingLayout = layout.find((item: any) => item.i === block.id);
      const fallbackLayout = {
        i: block.id,
        x: 0,
        y: index * 4,
        w: 6,
        h: 4
      };
      
      return {
        ...(existingLayout || fallbackLayout),
        y: index * 4
      };
    });
    
    return {
      coverLetter: {
        ...state.coverLetter,
        content: {
          ...state.coverLetter.content,
          blocks: updatedBlocks,
          layout: updatedLayout,
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),

  applyTemplate: (template) => set((state) => {
    if (!state.coverLetter) return state;
    
    return {
      coverLetter: {
        ...state.coverLetter,
        style: template.style,
        content: {
          ...state.coverLetter.content,
          style: template.style,
          blocks: state.coverLetter.content.blocks.map((block: any) => ({
            ...block,
            formatting: {
              ...block.formatting,
              fontFamily: getTemplateFontFamily(template.style),
              fontSize: getTemplateFontSize(template.style, block.type),
              color: getTemplateTextColor(template.style),
            }
          }))
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  updateStyle: (style) => set((state) => {
    if (!state.coverLetter) return state;
    
    return {
      coverLetter: {
        ...state.coverLetter,
        style,
        content: {
          ...state.coverLetter.content,
          style
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  applyTemplateStructure: (templateId) => set((state) => {
    if (!state.coverLetter) return state;
    
    const template = getTemplateById(templateId);
    if (!template) return state;
    
    return {
      coverLetter: {
        ...state.coverLetter,
        style: template.style,
        content: {
          ...state.coverLetter.content,
          style: template.style,
          blocks: applyTemplateBlocks(template, state.coverLetter.content.blocks),
          layout: applyTemplateLayout(template, state.coverLetter.content.blocks)
        },
        updatedAt: new Date().toISOString()
      }
    };
  }),
  
  resetToTemplate: (template) => set((state) => {
    if (!state.coverLetter) return state;
    
    return {
      coverLetter: {
        ...state.coverLetter,
        style: template.style,
        content: {
          style: template.style,
          blocks: getDefaultTemplateBlocks(template),
          layout: getDefaultTemplateLayout(template),
          lastSaved: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      },
      selectedBlock: null
    };
  })
}));