

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
  
  // Border options
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