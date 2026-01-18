import { t, Trans } from "@lingui/macro";
import { useState, useEffect } from 'react';
import { Button } from '@reactive-resume/ui';
import { Type, Check, Palette, Zap, Eye, EyeOff, Square, Minus, CornerUpLeft } from 'lucide-react';
import { useCoverLetterStore } from "../../../../../stores/cover-letter";
import { toast } from "sonner";

interface TypographySectionProps {
  disabled?: boolean;
}

type FontFamily = 'serif' | 'sans-serif' | 'monospace';
type FontSize = 'small' | 'medium' | 'large';
type BorderType = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';
type BorderWidth = 'none' | 'thin' | 'medium' | 'thick';
type BorderPosition = 'none' | 'all' | 'top-bottom' | 'left-right' | 'top' | 'bottom';

// Simple cn utility function to replace the missing import
const cn = (...classes: (string | undefined | null | boolean)[]): string => {
  return classes.filter(Boolean).join(' ');
};

export const TypographySection = ({ disabled = false }: TypographySectionProps) => {
  const { coverLetter, updateCoverLetter } = useCoverLetterStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Initialize state from current cover letter
  const [selectedFont, setSelectedFont] = useState<FontFamily>('sans-serif');
  const [selectedSize, setSelectedSize] = useState<FontSize>('medium');
  
  // NEW: Border and margin states
  const [borderType, setBorderType] = useState<BorderType>('none');
  const [borderWidth, setBorderWidth] = useState<BorderWidth>('none');
  const [borderPosition, setBorderPosition] = useState<BorderPosition>('none');
  const [borderColor, setBorderColor] = useState('#000000');
  const [borderMargin, setBorderMargin] = useState(0); // Distance from page edge to border
  const [innerPadding, setInnerPadding] = useState(0); // Space inside border

  // Enhanced font families with better visual representation
  const fontFamilies = [
    { 
      value: 'serif' as const, 
      label: t`Serif`,
      description: t`Traditional & formal`,
      fontFamily: 'Georgia, "Times New Roman", serif',
      preview: 'Aa',
      className: 'font-serif',
      style: { fontFamily: 'Georgia, "Times New Roman", serif' }
    },
    { 
      value: 'sans-serif' as const, 
      label: t`Sans Serif`,
      description: t`Clean & modern`,
      fontFamily: 'Arial, Helvetica, sans-serif',
      preview: 'Aa',
      className: 'font-sans',
      style: { fontFamily: 'Arial, Helvetica, sans-serif' }
    },
    { 
      value: 'monospace' as const, 
      label: t`Monospace`,
      description: t`Technical & structured`,
      fontFamily: '"Courier New", monospace',
      preview: 'Aa',
      className: 'font-mono',
      style: { fontFamily: '"Courier New", monospace' }
    }
  ];

  // Enhanced font sizes with better visual scaling
  const fontSizes = [
    { 
      value: 'small' as const, 
      label: t`Small`,
      description: t`Compact & professional`,
      baseSize: '13px',
      headerSize: '18px',
      preview: 'A',
      scale: 'text-sm'
    },
    { 
      value: 'medium' as const, 
      label: t`Medium`,
      description: t`Balanced & readable`,
      baseSize: '14px',
      headerSize: '22px',
      preview: 'A',
      scale: 'text-base'
    },
    { 
      value: 'large' as const, 
      label: t`Large`,
      description: t`Emphasized & accessible`,
      baseSize: '16px',
      headerSize: '26px',
      preview: 'A',
      scale: 'text-lg'
    }
  ];

  // Sync state with current cover letter
  useEffect(() => {
    if (coverLetter?.content?.blocks?.[0]?.formatting?.fontFamily) {
      const fontFamily = coverLetter.content.blocks[0].formatting.fontFamily;
      
      if (fontFamily.includes('Georgia') || fontFamily.includes('serif')) {
        setSelectedFont('serif');
      } else if (fontFamily.includes('Courier') || fontFamily.includes('monospace')) {
        setSelectedFont('monospace');
      } else {
        setSelectedFont('sans-serif');
      }
    }

    if (coverLetter?.content?.blocks?.[0]?.formatting?.fontSize) {
      const fontSize = coverLetter.content.blocks[0].formatting.fontSize;
      
      if (fontSize.includes('13') || parseInt(fontSize) <= 13) setSelectedSize('small');
      else if (fontSize.includes('16') || parseInt(fontSize) >= 16) setSelectedSize('large');
      else setSelectedSize('medium');
    }
  }, [coverLetter]);

  const getFontSizeForBlock = (blockType: string, size: FontSize) => {
    const sizeConfig = fontSizes.find(s => s.value === size);
    if (!sizeConfig) return '14px';

    switch (blockType) {
      case 'header':
        return sizeConfig.headerSize;
      case 'contact_info':
        return '12px';
      case 'date':
        return '13px';
      case 'signature':
        return '15px';
      default:
        return sizeConfig.baseSize;
    }
  };

  const handleFontChange = async (font: FontFamily) => {
    if (!coverLetter || isUpdating) {
      if (!coverLetter) toast.error(t`No cover letter found`);
      return;
    }
    
    setIsUpdating(true);
    try {
      const fontConfig = fontFamilies.find(f => f.value === font);
      if (!fontConfig) return;

      setSelectedFont(font);

      // Update all blocks with new font family
      const updatedBlocks = coverLetter.content.blocks.map((block: any) => ({
        ...block,
        formatting: {
          ...block.formatting,
          fontFamily: fontConfig.fontFamily
        }
      }));

      // Update store
      updateCoverLetter({
        content: {
          ...coverLetter.content,
          blocks: updatedBlocks
        }
      });

      toast.success(t`Font changed to ${fontConfig.label}`);
    } catch (error) {
      console.error('Failed to update font:', error);
      toast.error(t`Failed to update font`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSizeChange = async (size: FontSize) => {
    if (!coverLetter || isUpdating) {
      if (!coverLetter) toast.error(t`No cover letter found`);
      return;
    }
    
    setIsUpdating(true);
    try {
      setSelectedSize(size);

      // Update all blocks with new font sizes
      const updatedBlocks = coverLetter.content.blocks.map((block: any) => ({
        ...block,
        formatting: {
          ...block.formatting,
          fontSize: getFontSizeForBlock(block.type, size)
        }
      }));

      // Update store
      updateCoverLetter({
        content: {
          ...coverLetter.content,
          blocks: updatedBlocks
        }
      });

      const sizeConfig = fontSizes.find(s => s.value === size);
      toast.success(t`Font size changed to ${sizeConfig?.label}`);
    } catch (error) {
      console.error('Failed to update font size:', error);
      toast.error(t`Failed to update font size`);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentFont = fontFamilies.find(f => f.value === selectedFont);
  const currentSize = fontSizes.find(s => s.value === selectedSize);

  const hasCoverLetter = coverLetter && coverLetter.content?.blocks && Array.isArray(coverLetter.content.blocks);

  return (
    <section id="typography">
      {/* Enhanced Header with Preview Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Type className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t`Typography & Layout`}</h2>
            <p className="text-sm text-muted-foreground">{t`Customize fonts and spacing`}</p>
          </div>
        </div>
      </div>

      {/* Warning State */}
      {!hasCoverLetter && (
        <div className="mb-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-warning-foreground">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">
              {!coverLetter 
                ? t`Create a cover letter to customize typography` 
                : !coverLetter.content?.blocks 
                  ? t`Add content blocks to customize typography`
                  : t`Loading typography settings...`
              }
            </span>
          </div>
        </div>
      )}

      {hasCoverLetter && (
        <div className="space-y-8">
          {/* Font Family Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                {t`Font Family`}
              </label>
              {isUpdating && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  {t`Applying...`}
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {fontFamilies.map((font) => {
                const isSelected = selectedFont === font.value;
                return (
                  <button
                    key={font.value}
                    onClick={() => handleFontChange(font.value)}
                    disabled={disabled || isUpdating}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-input",
                      (disabled || isUpdating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div 
                      className={cn(
                        "text-2xl font-bold mb-2 text-center transition-all",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                      style={font.style}
                    >
                      {font.preview}
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {font.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {font.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">
                {t`Font Size`}
              </label>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {fontSizes.map((size) => {
                const isSelected = selectedSize === size.value;
                return (
                  <button
                    key={size.value}
                    onClick={() => handleSizeChange(size.value)}
                    disabled={disabled || isUpdating}
                    className={cn(
                      "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:border-input",
                      (disabled || isUpdating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "font-bold text-foreground text-center mb-3 transition-all",
                      size.scale,
                      isSelected && "text-primary"
                    )}>
                      {size.preview}
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {size.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {size.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Current Settings Summary */}
      {hasCoverLetter && (
        <div className="mt-8 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border">
          <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 text-success" />
            {t`Current Settings`}
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
              <span className="text-muted-foreground">{t`Font Family:`}</span>
              <span 
                className="font-semibold text-foreground"
                style={currentFont?.style}
              >
                {currentFont?.label}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-card/50">
              <span className="text-muted-foreground">{t`Font Size:`}</span>
              <span className="font-semibold text-foreground">
                {currentSize?.label}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};