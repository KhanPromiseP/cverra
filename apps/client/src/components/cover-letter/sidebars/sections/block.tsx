// client/components/cover-letter/sidebars/sections/block.tsx
import { useState } from 'react';
import { 
  Button, 
  Input, 
  Label, 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem,
} from "@reactive-resume/ui";
import { 
  Settings, 
  Type, 
  Palette, 
  Layout, 
  Wand2, 
  RefreshCw, 
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Paintbrush,
  TextCursor,
  Move,
  Expand,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Bold,
  Italic,
  Underline,
  MousePointerClick,
  Zap,
  Sparkles,
  Target,
  Navigation,
  Compass,
  Box,
  Layers,
  Square
} from "lucide-react";
import { Textarea } from "../../../ui/textarea";
import { t } from "@lingui/macro";

import { useCoverLetterStore } from ".././../../../../stores/cover-letter";
import { coverLetterService } from "@/client/services/cover-letter.service";
import { toast } from "sonner";

export const BlockSection = () => {
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { coverLetter, selectedBlock, updateBlock, updateBlockLayout } = useCoverLetterStore();

  const selectedBlockData = coverLetter?.content?.blocks?.find((block: any) => block.id === selectedBlock) || null;
  const selectedBlockLayout = coverLetter?.content?.layout?.find((item: any) => item.i === selectedBlock) || null;

  const handleStyleUpdate = (property: string, value: string) => {
    if (!selectedBlock) return;
    
    const updatedFormatting = {
      ...selectedBlockData?.formatting,
      [property]: value
    };
    
    updateBlock(selectedBlock, {
      formatting: updatedFormatting
    });
  };

  const handleContentUpdate = (content: string) => {
    if (!selectedBlock) return;
    updateBlock(selectedBlock, { content });
  };

const handlePositionUpdate = (axis: 'x' | 'y', value: number) => {
  if (!selectedBlock) return;
  
  const currentLayout = selectedBlockLayout || { x: 0, y: 0, w: 4, h: 2, i: selectedBlock };
  
  updateBlockLayout(selectedBlock, {
    ...currentLayout,
    [axis]: Math.max(0, value)
  });
};

const handleSizeUpdate = (dimension: 'w' | 'h', value: number) => {
  if (!selectedBlock) return;
  
  const currentLayout = selectedBlockLayout || { x: 0, y: 0, w: 4, h: 2, i: selectedBlock };
  const max = dimension === 'w' ? 12 : 20;
  const min = 1;
  
  updateBlockLayout(selectedBlock, {
    ...currentLayout,
    [dimension]: Math.max(min, Math.min(max, value))
  });
};

const handleNudgePosition = (axis: 'x' | 'y', direction: 'increment' | 'decrement') => {
  if (!selectedBlock) return;
  
  const currentLayout = selectedBlockLayout || { x: 0, y: 0, w: 4, h: 2, i: selectedBlock };
  const currentValue = currentLayout[axis] || 0;
  const newValue = direction === 'increment' ? currentValue + 1 : Math.max(0, currentValue - 1);
  
  updateBlockLayout(selectedBlock, {
    ...currentLayout,
    [axis]: newValue
  });
};

const handleNudgeSize = (dimension: 'w' | 'h', direction: 'increment' | 'decrement') => {
  if (!selectedBlock) return;
  
  const currentLayout = selectedBlockLayout || { x: 0, y: 0, w: 4, h: 2, i: selectedBlock };
  const currentValue = currentLayout[dimension] || 1;
  const max = dimension === 'w' ? 12 : 20;
  const min = 1;
  
  const newValue = direction === 'increment' 
    ? Math.min(max, currentValue + 1) 
    : Math.max(min, currentValue - 1);
  
  updateBlockLayout(selectedBlock, {
    ...currentLayout,
    [dimension]: newValue
  });
};

  const handleTextDecorationUpdate = (decoration: string) => {
    if (!selectedBlock) return;
    
    const currentDecoration = selectedBlockData.formatting?.textDecoration || 'none';
    const newDecoration = currentDecoration === decoration ? 'none' : decoration;
    
    handleStyleUpdate('textDecoration', newDecoration);
  };

  const handleFontStyleUpdate = (style: string) => {
    if (!selectedBlock) return;
    
    const currentStyle = selectedBlockData.formatting?.fontStyle || 'normal';
    const newStyle = currentStyle === style ? 'normal' : style;
    
    handleStyleUpdate('fontStyle', newStyle);
  };

  const handleEnhanceBlock = async () => {
    if (!coverLetter?.id || !selectedBlock || !enhanceInstructions.trim()) return;
    
    setIsEnhancing(true);
    try {
      const result = await coverLetterService.enhanceBlock(coverLetter.id, selectedBlock, enhanceInstructions);
      useCoverLetterStore.getState().setCoverLetter(result.coverLetter);
      setEnhanceInstructions('');
      toast.success('Block enhanced successfully!');
    } catch (error) {
      console.error('Enhancement failed:', error);
      toast.error('Failed to enhance block');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRegenerateBlock = async () => {
    if (!coverLetter?.id || !selectedBlock) return;
    
    setIsEnhancing(true);
    try {
      const result = await coverLetterService.regenerateBlock(coverLetter.id, selectedBlock);
      useCoverLetterStore.getState().setCoverLetter(result.coverLetter);
      toast.success('Block regenerated successfully!');
    } catch (error) {
      console.error('Regeneration failed:', error);
      toast.error('Failed to regenerate block');
    } finally {
      setIsEnhancing(false);
    }
  };

  const fontSizes = [
    { value: '10px', label: 'XS (10px)' },
    { value: '12px', label: 'Small (12px)' },
    { value: '14px', label: 'Normal (14px)' },
    { value: '16px', label: 'Large (16px)' },
    { value: '18px', label: 'XL (18px)' },
    { value: '20px', label: 'XXL (20px)' },
    { value: '24px', label: 'Heading (24px)' },
    { value: '28px', label: 'Title (28px)' }
  ];

  const lineHeights = [
    { value: '1.0', label: 'Tight (1.0)' },
    { value: '1.2', label: 'Compact (1.2)' },
    { value: '1.4', label: 'Normal (1.4)' },
    { value: '1.5', label: 'Relaxed (1.5)' },
    { value: '1.6', label: 'Loose (1.6)' },
    { value: '1.8', label: 'Spacious (1.8)' },
    { value: '2.0', label: 'Double (2.0)' }
  ];

  const alignments = [
    { value: 'left', label: 'Left', icon: AlignLeft },
    { value: 'center', label: 'Center', icon: AlignCenter },
    { value: 'right', label: 'Right', icon: AlignRight },
    { value: 'justify', label: 'Justify', icon: AlignJustify }
  ];

  const fontFamilies = [
    { value: 'inherit', label: 'System Default' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: "'Times New Roman', serif", label: 'Times New Roman' },
    { value: "'Helvetica Neue', sans-serif", label: 'Helvetica' },
    { value: "'Garamond', serif", label: 'Garamond' },
    { value: "'Verdana', sans-serif", label: 'Verdana' },
    { value: "'Courier New', monospace", label: 'Courier New' }
  ];

  const fontWeightOptions = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Normal' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ];

  const borderRadiusOptions = [
    { value: '0px', label: 'None' },
    { value: '2px', label: 'Small' },
    { value: '4px', label: 'Medium' },
    { value: '8px', label: 'Large' },
    { value: '12px', label: 'XL' },
    { value: '16px', label: 'XXL' },
    { value: '24px', label: 'Round' },
    { value: '50%', label: 'Circle' }
  ];

  if (!selectedBlock || !selectedBlockData) {
    return (
      <section id="block" className="space-y-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Block Settings`}</h2>
        </div>
        <div className="p-6 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed">
          <MousePointerClick className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t`Click on any block to customize its settings`}</p>
          <p className="text-xs mt-1 text-gray-400">{t`Use the controls below to adjust position and styling`}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="block" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Block Controls`}</h2>
        </div>
        <div className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded capitalize">
          {selectedBlockData.type?.toLowerCase() || 'content'}
        </div>
      </div>

     
      {/* Block Content Editor */}
      <div className="space-y-3">
        <Label htmlFor="block-content" className="text-sm font-medium flex items-center space-x-2">
          <Type className="w-4 h-4" />
          <span>{t`Content`}</span>
         
        </Label>
         <span className="flex items-center gap-2">
            <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide">
              {t`Edit`}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 capitalize">
              {selectedBlockData?.type?.toLowerCase() || 'content'}
            </p>
            <h3 className="text-xs font-medium text-purple-900 dark:text-purple-100 uppercase tracking-wide">
              {t`Block Further`}
            </h3>
          </span>
        <Textarea
          id="block-content"
          value={selectedBlockData.content || ''}
          onChange={(e) => handleContentUpdate(e.target.value)}
          placeholder="Enter your content here..."
          className="min-h-[120px] resize-y text-sm dark:text-gray-800 font-mono"
          rows={6}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{selectedBlockData.content?.length || 0} characters</span>
          <span>Supports **bold**, *italic*, _underline_</span>
        </div>
      </div>


      {/* Text Formatting Quick Controls */}
      <div className="space-y-3">
        <Label className="text-xs font-medium">{t`Text Formatting`}</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={selectedBlockData.formatting?.fontWeight === '700' ? "secondary" : "outline"}
            onClick={() => handleStyleUpdate('fontWeight', selectedBlockData.formatting?.fontWeight === '700' ? '400' : '700')}
            className="h-8 text-xs"
            size="sm"
          >
            <Bold className="w-3 h-3 mr-1" />
            Bold
          </Button>
          <Button
            variant={selectedBlockData.formatting?.fontStyle === 'italic' ? "secondary" : "outline"}
            onClick={() => handleFontStyleUpdate('italic')}
            className="h-8 text-xs"
            size="sm"
          >
            <Italic className="w-3 h-3 mr-1" />
            Italic
          </Button>
          <Button
            variant={selectedBlockData.formatting?.textDecoration === 'underline' ? "secondary" : "outline"}
            onClick={() => handleTextDecorationUpdate('underline')}
            className="h-8 text-xs"
            size="sm"
          >
            <Underline className="w-3 h-3 mr-1" />
            Underline
          </Button>
        </div>
      </div>

      {/* Typography Section */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
          <Type className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{t`Typography`}</span>
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-xs">
              {t`Font Family`}
            </Label>
            <Select
              value={selectedBlockData.formatting?.fontFamily || 'inherit'}
              onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value} className="text-xs">
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size" className="text-xs">
              {t`Font Size`}
            </Label>
            <Select
              value={selectedBlockData.formatting?.fontSize || '14px'}
              onValueChange={(value) => handleStyleUpdate('fontSize', value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value} className="text-xs">
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="font-weight" className="text-xs">
              {t`Font Weight`}
            </Label>
            <Select
              value={selectedBlockData.formatting?.fontWeight || '400'}
              onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontWeightOptions.map((weight) => (
                  <SelectItem key={weight.value} value={weight.value} className="text-xs">
                    {weight.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line-height" className="text-xs">
              {t`Line Height`}
            </Label>
            <Select
              value={selectedBlockData.formatting?.lineHeight || '1.5'}
              onValueChange={(value) => handleStyleUpdate('lineHeight', value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lineHeights.map((lh) => (
                  <SelectItem key={lh.value} value={lh.value} className="text-xs">
                    {lh.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Layout & Appearance */}
      <div className="space-y-4">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
          <Layers className="w-4 h-4 text-green-600 dark:text-green-400" />
          <span>{t`Layout & Appearance`}</span>
        </h4>

       

        {/* Colors */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-xs">{t`Text Color`}</Label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={selectedBlockData.formatting?.color || '#000000'}
                onChange={(e) => handleStyleUpdate('color', e.target.value)}
                className="w-8 h-8 p-1 border rounded cursor-pointer bg-transparent"
              />
              <Input
                value={selectedBlockData.formatting?.color || '#000000'}
                onChange={(e) => handleStyleUpdate('color', e.target.value)}
                className="flex-1 h-8 text-xs"
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t`Background`}</Label>
            <div className="flex space-x-2">
              <input
                type="color"
                value={selectedBlockData.formatting?.backgroundColor || 'transparent'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="w-8 h-8 p-1 border rounded cursor-pointer bg-transparent"
              />
              <Input
                value={selectedBlockData.formatting?.backgroundColor || 'transparent'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                className="flex-1 h-8 text-xs"
                placeholder="transparent"
              />
            </div>
          </div>
        </div>

        {/* Spacing & Borders */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="padding" className="text-xs">
              {t`Padding`}
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                value={selectedBlockData.formatting?.padding?.replace('px', '') || '16'}
                onChange={(e) => handleStyleUpdate('padding', `${e.target.value}px`)}
                className="h-8 text-xs"
                placeholder="16"
                min="0"
                max="50"
              />
              <span className="flex items-center text-xs text-gray-500">px</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="border-radius" className="text-xs">
              {t`Corners`}
            </Label>
            <Select
              value={selectedBlockData.formatting?.borderRadius || '0px'}
              onValueChange={(value) => handleStyleUpdate('borderRadius', value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {borderRadiusOptions.map((radius) => (
                  <SelectItem key={radius.value} value={radius.value} className="text-xs">
                    {radius.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>


      {/* Reset & Actions */}
      <div className="pt-4 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (selectedBlock) {
                updateBlock(selectedBlock, { formatting: {} });
              }
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs h-8"
            size="sm"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            {t`Reset Styles`}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (selectedBlock && selectedBlockLayout) {
                updateBlockLayout(selectedBlock, { x: 0, y: 0, w: 4, h: 2 });
              }
            }}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs h-8"
            size="sm"
          >
            <Square className="w-3 h-3 mr-1" />
            {t`Reset Position`}
          </Button>
        </div>
      </div>
    </section>
  );
};