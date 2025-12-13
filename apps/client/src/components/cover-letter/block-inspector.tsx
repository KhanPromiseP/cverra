// client/components/cover-letter/block-inspector.tsx
import { useState } from 'react';
import { Wand2, RefreshCw, Settings, Type, Palette, Layout, Eye } from 'lucide-react';
import { Button } from '@reactive-resume/ui';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { cn } from '@/client/libs/utils';

interface BlockInspectorProps {
  block: any;
  onUpdate: (updates: any) => void;
  onRegenerate: () => void;
  onEnhance: (instructions: string) => void;
  disabled?: boolean;
}

export const BlockInspector = ({
  block,
  onUpdate,
  onRegenerate,
  onEnhance,
  disabled = false
}: BlockInspectorProps) => {
  const [enhanceInstructions, setEnhanceInstructions] = useState('');

  const handleStyleUpdate = (property: string, value: any) => {
    onUpdate({
      formatting: {
        ...block.formatting,
        [property]: value
      }
    });
  };

  const handleEnhance = () => {
    if (enhanceInstructions.trim()) {
      onEnhance(enhanceInstructions);
      setEnhanceInstructions('');
    }
  };

  const fontSizes = [
    { value: '12px', label: 'Small (12px)' },
    { value: '14px', label: 'Normal (14px)' },
    { value: '16px', label: 'Large (16px)' },
    { value: '18px', label: 'Extra Large (18px)' },
    { value: '20px', label: 'XXL (20px)' }
  ];

  const lineHeights = [
    { value: '1.2', label: 'Compact (1.2)' },
    { value: '1.5', label: 'Normal (1.5)' },
    { value: '1.8', label: 'Relaxed (1.8)' },
    { value: '2.0', label: 'Double (2.0)' }
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Block Settings</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 capitalize">
              {block.type?.toLowerCase() || 'content'} block
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Wand2 className="w-4 h-4" />
            <span>AI Actions</span>
          </h4>
          
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={disabled}
            className="w-full justify-start border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Regenerate This Block
          </Button>

          <div className="space-y-2">
            <Label htmlFor="enhance-instructions" className="text-xs text-gray-700 dark:text-gray-300">
              Enhance with AI
            </Label>
            <Textarea
              id="enhance-instructions"
              value={enhanceInstructions}
              onChange={(e) => setEnhanceInstructions(e.target.value)}
              placeholder="Tell AI how to improve this block..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md resize-none h-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={disabled}
            />
            <Button
              onClick={handleEnhance}
              disabled={disabled || !enhanceInstructions.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Wand2 className="w-4 h-4 mr-2" />
              Enhance Block
            </Button>
          </div>
        </div>

        {/* Typography */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Type className="w-4 h-4" />
            <span>Typography</span>
          </h4>

          <div className="space-y-2">
            <Label htmlFor="font-family" className="text-xs text-gray-700 dark:text-gray-300">
              Font Family
            </Label>
            <Select
              value={block.formatting?.fontFamily || 'inherit'}
              onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
              disabled={disabled}
            >
              <SelectTrigger 
                id="font-family" 
                className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectItem value="inherit">System Default</SelectItem>
                <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                <SelectItem value="Georgia, serif">Georgia</SelectItem>
                <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                <SelectItem value="'Helvetica Neue', sans-serif">Helvetica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="font-size" className="text-xs text-gray-700 dark:text-gray-300">
              Font Size
            </Label>
            <Select
              value={block.formatting?.fontSize || '14px'}
              onValueChange={(value) => handleStyleUpdate('fontSize', value)}
              disabled={disabled}
            >
              <SelectTrigger 
                id="font-size"
                className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                {fontSizes.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="line-height" className="text-xs text-gray-700 dark:text-gray-300">
              Line Height
            </Label>
            <Select
              value={block.formatting?.lineHeight || '1.5'}
              onValueChange={(value) => handleStyleUpdate('lineHeight', value)}
              disabled={disabled}
            >
              <SelectTrigger 
                id="line-height"
                className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                {lineHeights.map((lh) => (
                  <SelectItem key={lh.value} value={lh.value}>
                    {lh.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Colors</span>
          </h4>

          <div className="space-y-2">
            <Label htmlFor="text-color" className="text-xs text-gray-700 dark:text-gray-300">
              Text Color
            </Label>
            <div className="flex space-x-2">
              <input
                type="color"
                id="text-color"
                value={block.formatting?.color || '#000000'}
                onChange={(e) => handleStyleUpdate('color', e.target.value)}
                disabled={disabled}
                className="w-10 h-10 p-1 border border-gray-200 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
              />
              <Input
                value={block.formatting?.color || '#000000'}
                onChange={(e) => handleStyleUpdate('color', e.target.value)}
                disabled={disabled}
                className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bg-color" className="text-xs text-gray-700 dark:text-gray-300">
              Background Color
            </Label>
            <div className="flex space-x-2">
              <input
                type="color"
                id="bg-color"
                value={block.formatting?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                disabled={disabled}
                className="w-10 h-10 p-1 border border-gray-200 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700"
              />
              <Input
                value={block.formatting?.backgroundColor || '#ffffff'}
                onChange={(e) => handleStyleUpdate('backgroundColor', e.target.value)}
                disabled={disabled}
                className="flex-1 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Layout */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
            <Layout className="w-4 h-4" />
            <span>Layout</span>
          </h4>

          <div className="space-y-2">
            <Label htmlFor="text-align" className="text-xs text-gray-700 dark:text-gray-300">
              Text Alignment
            </Label>
            <Select
              value={block.formatting?.alignment || 'left'}
              onValueChange={(value) => handleStyleUpdate('alignment', value)}
              disabled={disabled}
            >
              <SelectTrigger 
                id="text-align"
                className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="justify">Justify</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};