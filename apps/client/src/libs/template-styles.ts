// client/utils/template-styles.ts
import { TemplateStructure } from '../types/template-types';

export interface TemplateStyles {
  container?: React.CSSProperties;
  subjectLine?: React.CSSProperties;
  header?: React.CSSProperties;
  contactInfo?: React.CSSProperties;
  date?: React.CSSProperties;
  greeting?: React.CSSProperties;
  body_paragraph?: React.CSSProperties;
  closing?: React.CSSProperties;
  signature?: React.CSSProperties;
}

export const generateTemplateStyles = (structure: TemplateStructure): TemplateStyles => {
  const styles: TemplateStyles = {};
  
  // Subject line styles
  if (structure.subjectLineStyle) {
    const sls = structure.subjectLineStyle;
    
    // Base styles
    const subjectLineStyles: React.CSSProperties = {
      textTransform: sls.textTransform,
      fontWeight: sls.fontWeight,
      fontSize: sls.fontSize === 'small' ? '14px' :
                sls.fontSize === 'large' ? '18px' :
                sls.fontSize === 'x-large' ? '20px' : '16px',
      textAlign: sls.textAlign,
      marginBottom: '15px',
      fontFamily: "'Times New Roman', Georgia, serif"
    };
    
    // CRITICAL FIX: Handle underline specially for PDF export
    if (sls.textDecoration === 'underline') {
      subjectLineStyles.textDecoration = 'underline';
      subjectLineStyles.textDecorationSkipInk = 'none';
      subjectLineStyles.textUnderlineOffset = '2px';
      subjectLineStyles.WebkitTextDecorationSkip = 'ink'; // Correct Webkit property
      // Fallback for PDF engines that don't handle text-decoration
      subjectLineStyles.borderBottom = '1px solid currentColor';
      subjectLineStyles.paddingBottom = '2px';
      subjectLineStyles.display = 'inline-block';
      subjectLineStyles.width = '100%';
    } else if (sls.textDecoration === 'bold') {
      subjectLineStyles.fontWeight = 'bold';
    } else if (sls.textDecoration === 'italic') {
      subjectLineStyles.fontStyle = 'italic';
    }
    
    styles.subjectLine = subjectLineStyles;
  }
  
  // Container styles (borders and background)
  if (structure.borderStyle?.enabled) {
    const bs = structure.borderStyle;
    
    // Handle different border sides
    let borderConfig = {};
    switch (bs.sides) {
      case 'all':
        borderConfig = {
          borderStyle: bs.type,
          borderWidth: bs.width === 'thin' ? '1px' : 
                      bs.width === 'medium' ? '2px' : '3px',
          borderColor: bs.color || '#000000'
        };
        break;
      case 'top-bottom':
        borderConfig = {
          borderTop: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderBottom: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderLeft: 'none',
          borderRight: 'none'
        };
        break;
      case 'left-right':
        borderConfig = {
          borderLeft: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderRight: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderTop: 'none',
          borderBottom: 'none'
        };
        break;
      case 'top':
        borderConfig = {
          borderTop: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderBottom: 'none',
          borderLeft: 'none',
          borderRight: 'none'
        };
        break;
      case 'bottom':
        borderConfig = {
          borderBottom: `${bs.width === 'thin' ? '1px' : bs.width === 'medium' ? '2px' : '3px'} ${bs.type} ${bs.color || '#000000'}`,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none'
        };
        break;
      default:
        borderConfig = {
          borderStyle: bs.type,
          borderWidth: bs.width === 'thin' ? '1px' : 
                      bs.width === 'medium' ? '2px' : '3px',
          borderColor: bs.color || '#000000'
        };
    }
    
    styles.container = {
      ...styles.container,
      ...borderConfig,
      borderRadius: bs.radius === 'small' ? '4px' :
                   bs.radius === 'medium' ? '8px' :
                   bs.radius === 'large' ? '16px' : '0'
    };
    
    // NEW: Apply margin from edge if specified
    if (bs.margin !== undefined) {
      styles.container = {
        ...styles.container,
        margin: `${bs.margin}px`
      };
    }
    
    // NEW: Apply internal padding if specified
    if (bs.padding !== undefined) {
      styles.container = {
        ...styles.container,
        padding: `${bs.padding}px`
      };
    }
  }
  
  // Background styles
  if (structure.backgroundStyle) {
    const bg = structure.backgroundStyle;
    
    if (bg.type === 'gradient' && bg.gradient) {
      const gradient = bg.gradient;
      styles.container = {
        ...styles.container,
        background: `${gradient.type}-gradient(${gradient.direction}, ${gradient.colors.join(', ')})`,
        opacity: bg.opacity || 1
      };
    } else if (bg.type === 'solid') {
      styles.container = {
        ...styles.container,
        backgroundColor: bg.color || '#ffffff',
        opacity: bg.opacity || 1
      };
    }
  }
  
  return styles;
};
// Helper to get specific block styles
export const getBlockSpecificStyles = (blockType: string, templateStyles: TemplateStyles): React.CSSProperties => {
  switch (blockType) {
    case 'subject_line':
      return templateStyles.subjectLine || {};
    case 'header':
      return templateStyles.header || {};
    case 'contact_info':
      return templateStyles.contactInfo || {};
    case 'date':
      return templateStyles.date || {};
    case 'greeting':
      return templateStyles.greeting || {};
    case 'body_paragraph':
    case 'body_paragraph_1':
    case 'body_paragraph_2':
    case 'body_paragraph_3':
      return templateStyles.body_paragraph || {};
    case 'closing':
      return templateStyles.closing || {};
    case 'signature':
      return templateStyles.signature || {};
    default:
      return {};
  }
};

// Helper to check if template has specific styling
export const hasTemplateStyling = (structure: TemplateStructure): boolean => {
  return !!(structure.subjectLineStyle || 
           structure.borderStyle?.enabled || 
           structure.backgroundStyle);
};