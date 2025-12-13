// client/components/cover-letter/sidebars/sections/typography.tsx
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
      label: 'Serif',
      description: 'Traditional & formal',
      fontFamily: 'Georgia, "Times New Roman", serif',
      preview: 'Aa',
      className: 'font-serif',
      style: { fontFamily: 'Georgia, "Times New Roman", serif' }
    },
    { 
      value: 'sans-serif' as const, 
      label: 'Sans Serif',
      description: 'Clean & modern',
      fontFamily: 'Arial, Helvetica, sans-serif',
      preview: 'Aa',
      className: 'font-sans',
      style: { fontFamily: 'Arial, Helvetica, sans-serif' }
    },
    { 
      value: 'monospace' as const, 
      label: 'Monospace',
      description: 'Technical & structured',
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
      label: 'Small',
      description: 'Compact & professional',
      baseSize: '13px',
      headerSize: '18px',
      preview: 'A',
      scale: 'text-sm'
    },
    { 
      value: 'medium' as const, 
      label: 'Medium',
      description: 'Balanced & readable',
      baseSize: '14px',
      headerSize: '22px',
      preview: 'A',
      scale: 'text-base'
    },
    { 
      value: 'large' as const, 
      label: 'Large',
      description: 'Emphasized & accessible',
      baseSize: '16px',
      headerSize: '26px',
      preview: 'A',
      scale: 'text-lg'
    }
  ];

  // NEW: Border types
  const borderTypes = [
    { value: 'none' as const, label: 'No Border', icon: Square, description: 'Clean look' },
    { value: 'solid' as const, label: 'Solid', icon: Minus, description: 'Simple line' },
    { value: 'dashed' as const, label: 'Dashed', icon: Minus, description: 'Modern style' },
    { value: 'dotted' as const, label: 'Dotted', icon: Minus, description: 'Decorative' },
    { value: 'double' as const, label: 'Double', icon: Minus, description: 'Formal' }
  ];

  // NEW: Border widths
  const borderWidths = [
    { value: 'none' as const, label: 'No Border', description: 'No border line' },
    { value: 'thin' as const, label: 'Thin', description: '1px width' },
    { value: 'medium' as const, label: 'Medium', description: '2px width' },
    { value: 'thick' as const, label: 'Thick', description: '3px width' }
  ];

  // NEW: Border positions
  const borderPositions = [
    { value: 'none' as const, label: 'No Border', icon: Square, description: 'No border' },
    { value: 'all' as const, label: 'All Sides', icon: Square, description: 'Full border' },
    { value: 'top-bottom' as const, label: 'Top & Bottom', icon: Minus, description: 'Horizontal only' },
    { value: 'left-right' as const, label: 'Left & Right', icon: CornerUpLeft, description: 'Vertical only' },
    { value: 'top' as const, label: 'Top Only', icon: Minus, description: 'Top line' },
    { value: 'bottom' as const, label: 'Bottom Only', icon: Minus, description: 'Bottom line' }
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

    // NEW: Sync border settings from template structure
    if (coverLetter?.structure?.borderStyle) {
      const borderStyle = coverLetter.structure.borderStyle;
      if (borderStyle.enabled) {
        setBorderType(borderStyle.type || 'solid');
        setBorderWidth(borderStyle.width || 'thin');
        setBorderPosition(borderStyle.sides || 'all');
        setBorderColor(borderStyle.color || '#000000');
        setBorderMargin(borderStyle.margin || 0);
        setInnerPadding(borderStyle.padding || 0);
      } else {
        setBorderType('none');
        setBorderWidth('none');
        setBorderPosition('none');
      }
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
      if (!coverLetter) toast.error('No cover letter found');
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

      toast.success(`Font changed to ${fontConfig.label}`);
    } catch (error) {
      console.error('Failed to update font:', error);
      toast.error('Failed to update font');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSizeChange = async (size: FontSize) => {
    if (!coverLetter || isUpdating) {
      if (!coverLetter) toast.error('No cover letter found');
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
      toast.success(`Font size changed to ${sizeConfig?.label}`);
    } catch (error) {
      console.error('Failed to update font size:', error);
      toast.error('Failed to update font size');
    } finally {
      setIsUpdating(false);
    }
  };

 const handleBorderUpdate = async () => {
  if (!coverLetter || isUpdating) return;

  setIsUpdating(true);
  try {
    // Create border style object
    const borderStyle = {
      enabled: borderType !== 'none' && borderWidth !== 'none' && borderPosition !== 'none',
      type: borderType,
      width: borderWidth,
      sides: borderPosition,
      color: borderColor,
      margin: borderMargin,  // Distance from page edge
      padding: innerPadding, // Space inside border
    };

    console.log('Applying border settings:', borderStyle);

    // Update store
    updateCoverLetter({
      ...coverLetter,
      structure: {
        ...coverLetter.structure,
        borderStyle: borderStyle
      }
    });

    toast.success('Border settings applied');
    
  } catch (error) {
    console.error('Failed to update border settings:', error);
    toast.error('Failed to update border settings');
  } finally {
    setIsUpdating(false);
  }
};

// Update the UI labels:
<div className="grid grid-cols-2 gap-4">
  {/* Border Distance from Edge */}
  <div className="space-y-3">
    <label className="text-sm font-medium text-gray-700">
      Distance from page edge: {borderMargin}px
    </label>
    <input
      type="range"
      min="0"
      max="100"
      value={borderMargin}
      onChange={(e) => setBorderMargin(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
    <div className="text-xs text-gray-500">Distance from page edge to border</div>
  </div>

  {/* Space inside border */}
  <div className="space-y-3">
    <label className="text-sm font-medium text-gray-700">
      Space inside border: {innerPadding}px
    </label>
    <input
      type="range"
      min="0"
      max="50"
      value={innerPadding}
      onChange={(e) => setInnerPadding(Number(e.target.value))}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
    <div className="text-xs text-gray-500">Padding between border and content</div>
  </div>
</div>


  const currentFont = fontFamilies.find(f => f.value === selectedFont);
  const currentSize = fontSizes.find(s => s.value === selectedSize);

  const hasCoverLetter = coverLetter && coverLetter.content?.blocks && Array.isArray(coverLetter.content.blocks);

  return (
    <section id="typography">
      {/* Enhanced Header with Preview Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Type className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Typography & Layout</h2>
            <p className="text-sm text-gray-500">Customize fonts, borders, and spacing</p>
          </div>
        </div>
      </div>

      {/* Warning State */}
      {!hasCoverLetter && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <Palette className="w-4 h-4" />
            <span className="text-sm font-medium">
              {!coverLetter 
                ? 'Create a cover letter to customize typography' 
                : !coverLetter.content?.blocks 
                  ? 'Add content blocks to customize typography'
                  : 'Loading typography settings...'
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
              <label className="text-sm font-semibold text-gray-900">
                Font Family
              </label>
              {isUpdating && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Applying...
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
                      "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300",
                      (disabled || isUpdating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div 
                      className={cn(
                        "text-2xl font-bold mb-2 text-center transition-all",
                        isSelected ? "text-blue-600" : "text-gray-900"
                      )}
                      style={font.style}
                    >
                      {font.preview}
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isSelected ? "text-blue-900" : "text-gray-900"
                      )}>
                        {font.label}
                      </div>
                      <div className="text-xs text-gray-500">
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
              <label className="text-sm font-semibold text-gray-900">
                Font Size
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
                      "relative p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                      isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300",
                      (disabled || isUpdating) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    
                    <div className={cn(
                      "font-bold text-gray-900 text-center mb-3 transition-all",
                      size.scale,
                      isSelected && "text-blue-600"
                    )}>
                      {size.preview}
                    </div>
                    
                    <div className="text-center">
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isSelected ? "text-blue-900" : "text-gray-900"
                      )}>
                        {size.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {size.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* NEW: Border & Layout Section */}
          <div className="space-y-6 pt-4 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-900 flex items-center gap-2">
              <Square className="w-4 h-4 text-purple-600" />
              Page Borders & Margins
            </h3>

            {/* Border Type */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Border Style</label>
              <div className="grid grid-cols-3 gap-2">
                {borderTypes.map((border) => {
                  const isSelected = borderType === border.value;
                  const IconComponent = border.icon;
                  return (
                    <button
                      key={border.value}
                      onClick={() => setBorderType(border.value)}
                      disabled={isUpdating}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 text-center",
                        isSelected
                          ? "border-purple-500 bg-purple-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300",
                        isUpdating && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <IconComponent className={cn(
                        "w-4 h-4 mx-auto mb-1",
                        isSelected ? "text-purple-600" : "text-gray-500"
                      )} />
                      <div className={cn(
                        "text-xs font-medium",
                        isSelected ? "text-purple-900" : "text-gray-700"
                      )}>
                        {border.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Border Width & Position (only show if border is enabled) */}
            {borderType !== 'none' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* Border Width */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Border Width</label>
                    <div className="space-y-2">
                      {borderWidths.filter(bw => bw.value !== 'none').map((width) => {
                        const isSelected = borderWidth === width.value;
                        return (
                          <button
                            key={width.value}
                            onClick={() => setBorderWidth(width.value)}
                            disabled={isUpdating}
                            className={cn(
                              "w-full p-2 rounded border transition-all text-left",
                              isSelected
                                ? "border-purple-500 bg-purple-50 text-purple-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                              isUpdating && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <div className="text-sm font-medium">{width.label}</div>
                            <div className="text-xs text-gray-500">{width.description}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Border Position */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">Border Position</label>
                    <div className="space-y-2">
                      {borderPositions.filter(bp => bp.value !== 'none').map((position) => {
                        const isSelected = borderPosition === position.value;
                        const IconComponent = position.icon;
                        return (
                          <button
                            key={position.value}
                            onClick={() => setBorderPosition(position.value)}
                            disabled={isUpdating}
                            className={cn(
                              "w-full p-2 rounded border transition-all text-left flex items-center gap-2",
                              isSelected
                                ? "border-purple-500 bg-purple-50 text-purple-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300",
                              isUpdating && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <IconComponent className="w-3 h-3 flex-shrink-0" />
                            <div>
                              <div className="text-sm font-medium">{position.label}</div>
                              <div className="text-xs text-gray-500">{position.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Border Color */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700">Border Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={borderColor}
                      onChange={(e) => setBorderColor(e.target.value)}
                      className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={borderColor}
                        onChange={(e) => setBorderColor(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                </div>

                {/* Margin & Padding Controls */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Page Margin */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Page Margin: {borderMargin}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={borderMargin}
                      onChange={(e) => setBorderMargin(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-gray-500">Distance from page edge</div>
                  </div>

                  {/* Border Padding */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Border Padding: {innerPadding}px
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={innerPadding}
                      onChange={(e) => setInnerPadding(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="text-xs text-gray-500">Space inside border</div>
                  </div>
                </div>

                {/* Apply Border Button */}
                <Button
                  onClick={handleBorderUpdate}
                  disabled={isUpdating}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isUpdating ? 'Applying...' : 'Apply Border Settings'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Current Settings Summary */}
      {hasCoverLetter && (
        <div className="mt-8 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Current Settings
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50">
              <span className="text-gray-600">Font Family:</span>
              <span 
                className="font-semibold text-gray-900"
                style={currentFont?.style}
              >
                {currentFont?.label}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-white/50">
              <span className="text-gray-600">Font Size:</span>
              <span className="font-semibold text-gray-900">
                {currentSize?.label}
              </span>
            </div>
            {borderType !== 'none' && (
              <>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/50">
                  <span className="text-gray-600">Border:</span>
                  <span className="font-semibold text-gray-900">
                    {borderTypes.find(bt => bt.value === borderType)?.label}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-white/50">
                  <span className="text-gray-600">Page Margin:</span>
                  <span className="font-semibold text-gray-900">
                    {borderMargin}px
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
};