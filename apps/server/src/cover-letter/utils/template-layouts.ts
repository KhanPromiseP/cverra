
export interface TemplateStructure {
  contactInfoPosition: 'left' | 'center' | 'right' | 'none'; 
  datePosition: 'left' | 'right' | 'none';
  greetingAlignment: 'left' | 'center' | 'right';
  paragraphSpacing: 'compact' | 'generous' | 'creative' | 'minimal' | 'traditional' | 'balanced' | 'academic' | 'technical';
  signatureAlignment: 'left' | 'center' | 'right';
  subjectLinePosition?: 'left' | 'center' | 'right' | 'none';
  
  // Subject line styling options
  subjectLineStyle?: {
    textTransform?: 'uppercase' | 'capitalize' | 'lowercase' | 'none';
    textDecoration?: 'underline' | 'bold' | 'italic' | 'none';
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
    fontSize?: 'small' | 'normal' | 'large' | 'x-large';
    textAlign?: 'left' | 'center' | 'right';
  };
  
  // Enhanced Border options with margin/padding
  borderStyle?: {
    enabled?: boolean;
    type?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    width?: 'thin' | 'medium' | 'thick' | 'custom';
    color?: string;
    radius?: 'none' | 'small' | 'medium' | 'large';
    sides?: 'all' | 'top-bottom' | 'left-right' | 'top' | 'bottom';
    // NEW: Margin from the edge of the page
    margin?: number; // pixels from edge
    padding?: number; // internal padding
  };
  
  // Background options
  backgroundStyle?: {
    type?: 'solid' | 'gradient' | 'pattern' | 'none';
    color?: string;
    gradient?: {
      type: 'linear' | 'radial';
      colors: string[];
      direction?: 'to right' | 'to bottom' | 'to bottom right' | '45deg';
    };
    opacity?: number;
  };
}

export class TemplateLayoutGenerator {
  static generateLayout(structure: TemplateStructure, blocks: any[]): any[] {
    const layout: any[] = [];
    let yPosition = 0;

    // Contact info based on position
    const contactBlock = blocks.find(b => b.type === 'contact_info');
    if (contactBlock) {
      const contactLayout = this.getContactInfoLayout(contactBlock.id, structure, yPosition);
      layout.push(contactLayout);
      if (structure.contactInfoPosition === 'right') {
        yPosition += 2;
      }
    }

    // Date position
    const dateBlock = blocks.find(b => b.type === 'date');
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

    // Subject line position (NEW)
    const subjectBlock = blocks.find(b => b.type === 'subject_line');
    if (subjectBlock && structure.subjectLinePosition && structure.subjectLinePosition !== 'none') {
      layout.push({
        i: subjectBlock.id,
        x: this.getXPosition(structure.subjectLinePosition, 8),
        y: yPosition,
        w: 8,
        h: 1,
        minW: 6,
        minH: 1
      });
      yPosition += 1;
    }

    // Rest of your existing layout code...
    const greetingBlock = blocks.find(b => b.type === 'greeting');
    if (greetingBlock) {
      layout.push({
        i: greetingBlock.id,
        x: 0,
        y: yPosition,
        w: 12,
        h: 1,
        minW: 8,
        minH: 1
      });
      yPosition += 1;
    }

    // Body paragraphs
    const bodyBlocks = blocks.filter(b => b.type.startsWith('body_paragraph'));
    bodyBlocks.forEach((block, index) => {
      const height = this.getParagraphHeight(structure.paragraphSpacing);
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

    // Closing and signature...
    const closingBlock = blocks.find(b => b.type === 'closing');
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

    const signatureBlock = blocks.find(b => b.type === 'signature');
    if (signatureBlock) {
      layout.push({
        i: signatureBlock.id,
        x: this.getXPosition(structure.signatureAlignment, 8),
        y: yPosition,
        w: 4,
        h: 1,
        minW: 3,
        minH: 1
      });
    }

    return layout;
  }

  // Your existing helper methods...
  private static getXPosition(alignment: string, defaultWidth: number): number {
    switch (alignment) {
      case 'center': return Math.floor((12 - defaultWidth) / 2);
      case 'right': return 12 - defaultWidth;
      default: return 0;
    }
  }

  private static getParagraphHeight(spacing: string): number {
    const heights: Record<string, number> = {
      compact: 3,
      generous: 4,
      creative: 5,
      minimal: 2,
      traditional: 4,
      balanced: 3,
      academic: 4,
      technical: 3
    };
    return heights[spacing] || 3;
  }

  // Your existing contact info layout method...
  private static getContactInfoLayout(blockId: string, structure: TemplateStructure, yPosition: number): any {
    switch (structure.contactInfoPosition) {
      case 'left':
        return {
          i: blockId,
          x: 0,
          y: yPosition,
          w: 4,
          h: 6,
          minW: 3,
          minH: 4
        };
      case 'right':
        return {
          i: blockId,
          x: 8,
          y: yPosition,
          w: 4,
          h: 6,
          minW: 3,
          minH: 4
        };
      case 'center':
        return {
          i: blockId,
          x: 4,
          y: yPosition,
          w: 4,
          h: 6,
          minW: 3,
          minH: 4
        };
      default:
        return {
          i: blockId,
          x: 0,
          y: yPosition,
          w: 12,
          h: 1,
          minW: 8,
          minH: 1
        };
    }
  }
}