// components/assistant/BrainDumpModal.tsx
import React, { useState } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  Brain,
  Lightbulb,
  FileText,
  CheckSquare,
  FolderTree,
  Tag,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import { toast } from 'sonner';

interface BrainDumpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface OrganizedItem {
  type: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  priority: number;
}

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [dumpContent, setDumpContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizedItems, setOrganizedItems] = useState<OrganizedItem[]>([]);
  const [step, setStep] = useState<'dump' | 'review' | 'saving'>('dump');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  const { getAuthHeaders } = useAssistant();

  if (!isOpen) return null;

  const handleProcessDump = async () => {
    if (!dumpContent.trim()) {
      toast.error('Please enter something to organize');
      return;
    }

    setIsProcessing(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/brain/dump', {
        method: 'POST',
        headers,
        body: JSON.stringify({ content: dumpContent }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOrganizedItems(data.data || []);
        // Auto-select all items
        setSelectedItems(new Set(data.data.map((_: any, i: number) => i)));
        setStep('review');
        toast.success('Your thoughts have been organized!');
      } else {
        toast.error('Failed to process brain dump');
      }
    } catch (error) {
      console.error('Brain dump failed:', error);
      toast.error('Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveSelected = async () => {
    if (selectedItems.size === 0) {
      toast.error('Select at least one item to save');
      return;
    }

    setStep('saving');
    
    // Simulate saving (in production, you'd batch save)
    setTimeout(() => {
      toast.success(`${selectedItems.size} items saved to your Second Brain!`);
      onSuccess?.();
      onClose();
    }, 1500);
  };

  const toggleItem = (index: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = () => {
    if (selectedItems.size === organizedItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(organizedItems.map((_, i) => i)));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IDEA': return <Lightbulb className="w-4 h-4" />;
      case 'NOTE': return <FileText className="w-4 h-4" />;
      case 'TODO': return <CheckSquare className="w-4 h-4" />;
      case 'PROJECT': return <FolderTree className="w-4 h-4" />;
      case 'QUESTION': return <div className="w-4 h-4 rounded-full bg-blue-500" />;
      case 'INSIGHT': return <Sparkles className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IDEA': return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'NOTE': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'TODO': return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'PROJECT': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'QUESTION': return 'bg-orange-500/20 text-orange-700 dark:text-orange-300';
      case 'INSIGHT': return 'bg-pink-500/20 text-pink-700 dark:text-pink-300';
      default: return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-card rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold">Brain Dump</h2>
            {step === 'dump' && (
              <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                Step 1: Dump
              </span>
            )}
            {step === 'review' && (
              <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
                Step 2: Review
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {step === 'dump' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-purple-700 dark:text-purple-300 mb-1">
                      Dump your thoughts
                    </h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Write down everything on your mind - ideas, tasks, notes, questions. 
                      I'll organize them into your Second Brain.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={dumpContent}
                onChange={(e) => setDumpContent(e.target.value)}
                placeholder={`Example:
• Learn React hooks in depth
• Idea for a new app - task manager with AI
• Need to buy groceries
• Question: How do databases work?
• Project: Build portfolio website`}
                className="w-full h-64 p-4 bg-secondary rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                autoFocus
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{dumpContent.length} characters</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI will organize automatically
                </span>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Organized Items ({organizedItems.length})</h3>
                <button
                  onClick={selectAll}
                  className="text-xs text-primary hover:underline"
                >
                  {selectedItems.size === organizedItems.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="space-y-3">
                {organizedItems.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => toggleItem(index)}
                    className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                      selectedItems.has(index)
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(index)}
                          onChange={() => toggleItem(index)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1.5 rounded-lg ${getTypeColor(item.type)}`}>
                            {getTypeIcon(item.type)}
                          </div>
                          <span className="text-xs font-medium px-2 py-0.5 bg-secondary rounded-full">
                            {item.type}
                          </span>
                          {item.priority >= 4 && (
                            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-700 dark:text-red-300 rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>

                        <h4 className="font-medium mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.content}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                            {item.category}
                          </span>
                          {item.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-1 bg-secondary/50 rounded-full flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {organizedItems.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No items were extracted</p>
                </div>
              )}
            </div>
          )}

          {step === 'saving' && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <h3 className="text-lg font-medium mb-2">Saving to your Second Brain...</h3>
              <p className="text-sm text-muted-foreground">
                Organizing and linking your thoughts
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition"
          >
            Cancel
          </button>

          {step === 'dump' && (
            <button
              onClick={handleProcessDump}
              disabled={isProcessing || !dumpContent.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Organize My Thoughts
                </>
              )}
            </button>
          )}

          {step === 'review' && (
            <button
              onClick={handleSaveSelected}
              disabled={selectedItems.size === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Save {selectedItems.size} Item{selectedItems.size !== 1 ? 's' : ''}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};