import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

interface Block {
  id: string;
  type: string;
  content: string;
  formatting?: {
    fontSize?: string;
    fontFamily?: string;
    color?: string;
    alignment?: string;
    fontWeight?: string;
    fontStyle?: string;
  };
}

interface CoverLetter {
  id: string;
  title: string;
  style: string;
  content: {
    blocks: Block[];
  };
}

export const exportToDOCX = async (coverLetter: CoverLetter): Promise<void> => {
  try {
    const children: any[] = [];

    // Add title as header
    children.push(
      new Paragraph({
        text: coverLetter.title || 'Cover Letter',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    );

    // Process each block
    coverLetter.content.blocks.forEach((block: Block) => {
      // Convert HTML content to plain text with basic formatting
      const plainText = block.content.replace(/<[^>]*>/g, '').trim();
      
      if (!plainText) return;

      const textRuns: TextRun[] = [];
      
     
// Fix docx TextRun methods
const textRun = new TextRun({
  text: block.content,
  bold: block.formatting?.fontWeight === 'bold',
  italics: block.formatting?.fontStyle === 'italic',
  color: block.formatting?.color?.replace('#', ''),
});

// Fix alignment
let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT;
switch (block.formatting?.alignment) {
  case 'center':
    alignment = AlignmentType.CENTER;
    break;
  case 'right':
    alignment = AlignmentType.RIGHT;
    break;
  case 'justify':
    alignment = AlignmentType.JUSTIFIED;
    break;
}

      // Determine spacing based on block type
      let spacing = { after: 200 };
      switch (block.type) {
        case 'header':
          spacing = { after: 400 };
          break;
        case 'greeting':
          spacing = { after: 200 };
          break;
        case 'body':
          spacing = { after: 200 };
          break;
        case 'closing':
          spacing = { after: 400 };
          break;
        case 'signature':
          spacing = { after: 600 };
          break;
      }

      children.push(
        new Paragraph({
          children: textRuns,
          alignment,
          spacing
        })
      );
    });

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: children
      }]
    });

    // Generate and download DOCX
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coverLetter.title || 'cover-letter'}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('DOCX export failed:', error);
    throw new Error('Failed to generate DOCX file. Please try again.');
  }
};