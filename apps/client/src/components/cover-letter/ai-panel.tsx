// client/components/cover-letter/ai-panel.tsx
import { useState } from 'react';
import { Wand2, RefreshCw, Zap, Sparkles, Bot, Lightbulb } from 'lucide-react';
import { Button } from '@reactive-resume/ui';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { cn } from '@/client/libs/utils';

interface AIPanelProps {
  selectedBlock: string | null;
  selectedBlockData: any;
  onEnhanceBlock: (instructions: string) => void;
  onRegenerateBlock: () => void;
  coverLetterStyle: string;
  disabled?: boolean;
}

export const AIPanel = ({
  selectedBlock,
  selectedBlockData,
  onEnhanceBlock,
  onRegenerateBlock,
  coverLetterStyle,
  disabled = false
}: AIPanelProps) => {
  const [enhanceInstructions, setEnhanceInstructions] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!enhanceInstructions.trim()) return;
    
    setIsEnhancing(true);
    try {
      await onEnhanceBlock(enhanceInstructions);
      setEnhanceInstructions('');
    } finally {
      setIsEnhancing(false);
    }
  };

  const quickEnhance = (action: string) => {
    const instructions = {
      'professional': 'Make this more professional and business-appropriate',
      'concise': 'Make this more concise and to the point',
      'impactful': 'Make this more impactful with stronger action verbs and achievements',
      'friendly': 'Make this more friendly and approachable',
      'formal': 'Make this more formal and traditional',
      'creative': 'Make this more creative and engaging',
      'persuasive': 'Make this more persuasive with compelling arguments'
    }[action];
    
    if (instructions) {
      onEnhanceBlock(instructions);
    }
  };

  const aiSuggestions = [
    { icon: Zap, label: 'More Professional', action: 'professional' },
    { icon: Sparkles, label: 'More Impactful', action: 'impactful' },
    { icon: Bot, label: 'More Concise', action: 'concise' },
    { icon: Lightbulb, label: 'More Creative', action: 'creative' }
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Wand2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Enhance your cover letter with AI
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Selected Block Info */}
        {selectedBlock && selectedBlockData && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
              Selected Block
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 capitalize mb-2">
              {selectedBlockData.type?.toLowerCase() || 'content'}
            </p>
            <div className="text-xs text-blue-600 dark:text-blue-400 line-clamp-2 bg-white dark:bg-gray-800 p-2 rounded border">
              {selectedBlockData.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
            </div>
          </div>
        )}

        {!selectedBlock && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Select a block to use AI features
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {selectedBlock && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Quick Actions</span>
            </h4>
            
            <Button
              variant="outline"
              onClick={onRegenerateBlock}
              disabled={disabled}
              className="w-full justify-start border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate This Block
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {aiSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.action}
                  variant="outline"
                  onClick={() => quickEnhance(suggestion.action)}
                  disabled={disabled}
                  size="sm"
                  className="capitalize text-xs border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <suggestion.icon className="w-3 h-3 mr-1" />
                  {suggestion.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Enhancement */}
        {selectedBlock && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
              Custom Enhancement
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="ai-instructions" className="text-xs text-gray-700 dark:text-gray-300">
                Instructions for AI
              </Label>
              <Textarea
                id="ai-instructions"
                value={enhanceInstructions}
                onChange={(e) => setEnhanceInstructions(e.target.value)}
                placeholder="E.g., 'Make this more achievement-oriented with metrics' or 'Rephrase to sound more confident'"
                className="min-h-[100px] resize-none text-sm border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={disabled}
              />
            </div>

            <Button
              onClick={handleEnhance}
              disabled={disabled || !enhanceInstructions.trim() || isEnhancing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isEnhancing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enhancing...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Enhance Block
                </>
              )}
            </Button>
          </div>
        )}

        {/* AI Tips */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-2 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>AI Tips</span>
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Be specific about what you want to improve</li>
            <li>• Mention tone, length, or specific changes</li>
            <li>• Reference the current style: <strong>{coverLetterStyle}</strong></li>
            <li>• Ask for metrics or achievements to be added</li>
            <li>• Specify if you want it more formal or casual</li>
          </ul>
        </div>
      </div>
    </div>
  );
};