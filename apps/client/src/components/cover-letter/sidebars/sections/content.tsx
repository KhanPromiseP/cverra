import { t, Trans } from "@lingui/macro";
import { useState } from 'react';
import { Button, Input, Label } from "@reactive-resume/ui";
import { FileText, Plus, Trash2, Copy, Move, Edit3, Check, X, ArrowUp, ArrowDown } from "lucide-react";

import { useCoverLetterStore } from "../../../../../stores/cover-letter";

interface BlockType {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const ContentSection = () => {
  const { coverLetter, selectedBlock, addBlock, removeBlock, duplicateBlock, moveBlock } = useCoverLetterStore();
  const [newBlockType, setNewBlockType] = useState('content');
  const [newBlockName, setNewBlockName] = useState('');
  const [insertPosition, setInsertPosition] = useState<'end' | 'before' | 'after'>('end');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockName, setEditingBlockName] = useState('');

  const blockTypes: BlockType[] = [
    { value: 'header', label: t`Header`, description: t`Main title section`, icon: '📝' },
    { value: 'subheader', label: t`Subheader`, description: t`Secondary heading`, icon: '🔸' },
    { value: 'content', label: t`Content`, description: t`Regular text paragraph`, icon: '📄' },
    { value: 'bullet_list', label: t`Bullet List`, description: t`Unordered list with bullet points`, icon: '•' },
    { value: 'numbered_list', label: t`Numbered List`, description: t`Ordered list with numbers`, icon: '1.' },
    { value: 'quote', label: t`Quote`, description: t`Highlighted quotation`, icon: '❝' },
    { value: 'divider', label: t`Divider`, description: t`Visual separation line`, icon: '―' },
    { value: 'contact_info', label: t`Contact Info`, description: t`Name, email, phone details`, icon: '📧' },
    { value: 'greeting', label: t`Greeting`, description: t`Opening salutation`, icon: '👋' },
    { value: 'closing', label: t`Closing`, description: t`Ending and signature`, icon: '✍️' },
    { value: 'signature', label: t`Signature`, description: t`Name and title`, icon: '🖊️' }
  ];

  const getBlockDisplayName = (block: any) => {
    if (block.customName) return block.customName;
    
    const blockType = blockTypes.find(type => type.value === block.type);
    return blockType?.label || block.type || t`Content`;
  };

  const handleAddBlock = () => {
    const selectedBlockType = blockTypes.find(type => type.value === newBlockType);
    const displayName = newBlockName.trim() || selectedBlockType?.label || t`New Block`;
    
    const newBlock = {
      type: newBlockType,
      customName: newBlockName.trim() || undefined,
      content: getDefaultContent(newBlockType),
      formatting: getDefaultFormatting(newBlockType)
    };
    
    let position = coverLetter?.content?.blocks?.length || 0;
    
    if (insertPosition !== 'end' && selectedBlock) {
      const currentIndex = coverLetter?.content?.blocks?.findIndex((b: any) => b.id === selectedBlock) || 0;
      position = insertPosition === 'before' ? currentIndex : currentIndex + 1;
    }
    
    addBlock(newBlock, position);
    
    // Reset form
    setNewBlockName('');
    setNewBlockType('content');
    setInsertPosition('end');
  };

  const getDefaultContent = (type: string): string => {
    const defaults: Record<string, string> = {
      header: t`Document Header`,
      subheader: t`Section Subheader`,
      content: t`Start writing your content here...`,
      bullet_list: t`• First item\n• Second item\n• Third item`,
      numbered_list: t`1. First step\n2. Second step\n3. Third step`,
      quote: t`This is an important quote or highlight...`,
      divider: '',
      contact_info: t`Your Name\nEmail: your.email@example.com\nPhone: (123) 456-7890`,
      greeting: t`Dear [Recipient Name],`,
      closing: t`Sincerely,`,
      signature: t`Your Name\nYour Title`
    };
    
    return defaults[type] || t`New content block...`;
  };

  const getDefaultFormatting = (type: string) => {
    const baseFormatting = {
      fontFamily: 'inherit',
      color: '#000000',
      alignment: 'left',
      lineHeight: '1.5',
      backgroundColor: 'transparent',
      padding: '16px'
    };

    const typeSpecific: Record<string, any> = {
      header: { fontSize: '24px', fontWeight: 'bold', padding: '20px' },
      subheader: { fontSize: '18px', fontWeight: '600', padding: '16px' },
      content: { fontSize: '14px', padding: '12px' },
      bullet_list: { fontSize: '14px', padding: '12px' },
      numbered_list: { fontSize: '14px', padding: '12px' },
      quote: { fontSize: '16px', fontStyle: 'italic', padding: '20px', backgroundColor: '#f8f9fa' },
      divider: { padding: '8px', backgroundColor: 'transparent' },
      contact_info: { fontSize: '12px', padding: '12px' },
      greeting: { fontSize: '14px', padding: '8px' },
      closing: { fontSize: '14px', padding: '8px' },
      signature: { fontSize: '14px', fontWeight: '600', padding: '12px' }
    };

    return { ...baseFormatting, ...typeSpecific[type] };
  };

  const handleRemoveBlock = () => {
    if (selectedBlock) {
      removeBlock(selectedBlock);
    }
  };

  const handleDuplicateBlock = () => {
    if (selectedBlock) {
      duplicateBlock(selectedBlock);
    }
  };

  const handleMoveBlock = (direction: 'up' | 'down') => {
    if (selectedBlock) {
      moveBlock(selectedBlock, direction);
    }
  };

  const startEditingName = (block: any) => {
    setEditingBlockId(block.id);
    setEditingBlockName(getBlockDisplayName(block));
  };

  const saveBlockName = () => {
    if (editingBlockId && editingBlockName.trim()) {
      const { updateBlock } = useCoverLetterStore.getState();
      updateBlock(editingBlockId, { customName: editingBlockName.trim() });
    }
    setEditingBlockId(null);
    setEditingBlockName('');
  };

  const cancelEditingName = () => {
    setEditingBlockId(null);
    setEditingBlockName('');
  };

  const canMoveUp = (index: number) => index > 0;
  const canMoveDown = (index: number) => index < (coverLetter?.content?.blocks?.length || 0) - 1;

  return (
    <section id="content" className="space-y-4">
      <div className="flex items-center space-x-2">
        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t`Content Blocks`}</h2>
      </div>

      {/* Add New Block */}
      <div className="space-y-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center">
          <Plus className="w-4 h-4 mr-2 text-blue-600" />
          {t`Add New Block`}
        </h4>
        
        <div className="space-y-3">
          {/* Block Type Selection */}
          <div>
            <Label htmlFor="block-type" className="text-xs font-medium mb-2 block">
              {t`Block Type`}
            </Label>
            <select
              id="block-type"
              value={newBlockType}
              onChange={(e) => setNewBlockType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {blockTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label} - {type.description}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Name */}
          <div>
            <Label htmlFor="block-name" className="text-xs font-medium mb-2 block">
              {t`Custom Name (Optional)`}
            </Label>
            <Input
              id="block-name"
              value={newBlockName}
              onChange={(e) => setNewBlockName(e.target.value)}
              placeholder={t`Give this block a custom name...`}
              className="w-full text-sm"
            />
          </div>

          {/* Insert Position */}
          {(coverLetter?.content?.blocks && coverLetter.content.blocks.length > 0) && (
            <div>
              <Label className="text-xs font-medium mb-2 block text-indigo-700 text-center">
                {t`Insert Position respect to the currently selected block`}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={insertPosition === 'end' ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setInsertPosition('end')}
                  className="text-xs h-8"
                >
                  {t`At End`}
                </Button>
                <Button
                  variant={insertPosition === 'before' ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setInsertPosition('before')}
                  disabled={!selectedBlock}
                  className="text-xs h-8"
                >
                  {t`Before`}
                </Button>
                <Button
                  variant={insertPosition === 'after' ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setInsertPosition('after')}
                  disabled={!selectedBlock}
                  className="text-xs h-8"
                >
                  {t`After`}
                </Button>
              </div>
              {!selectedBlock && insertPosition !== 'end' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t`Select a block to insert before/after it`}
                </p>
              )}
            </div>
          )}

          {/* Add Button */}
          <Button
            onClick={handleAddBlock}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t`Add Block`}
          </Button>
        </div>
      </div>

      {/* Block Actions */}
      {selectedBlock && (
        <div className="space-y-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border">
          <h4 className="font-medium text-sm text-gray-900 dark:text-white flex items-center">
            <Edit3 className="w-4 h-4 mr-2 text-green-600" />
            {t`Selected Block Actions`}
          </h4>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleDuplicateBlock}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Copy className="w-4 h-4 mr-2" />
              {t`Duplicate`}
            </Button>
            
            <Button
              onClick={handleRemoveBlock}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t`Delete`}
            </Button>
          </div>

          {/* Move Controls */}
          <div className="pt-2 border-t border-green-200 dark:border-green-800">
            <Label className="text-xs font-medium mb-2 block">
              {t`Move Block`}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleMoveBlock('up')}
                variant="outline"
                size="sm"
                disabled={!canMoveUp(coverLetter?.content?.blocks?.findIndex((b: any) => b.id === selectedBlock) || 0)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                {t`Move Up`}
              </Button>
              <Button
                onClick={() => handleMoveBlock('down')}
                variant="outline"
                size="sm"
                disabled={!canMoveDown(coverLetter?.content?.blocks?.findIndex((b: any) => b.id === selectedBlock) || 0)}
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                {t`Move Down`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Blocks List */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900 dark:text-white">
          {t`All Blocks`} ({coverLetter?.content?.blocks?.length || 0})
        </h4>
        
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {coverLetter?.content?.blocks?.map((block: any, index: number) => (
            <div
              key={block.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                selectedBlock === block.id
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 ring-2 ring-blue-200 dark:ring-blue-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
              }`}
              onClick={() => useCoverLetterStore.getState().setSelectedBlock(block.id)}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <Move className="w-4 h-4 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  {editingBlockId === block.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editingBlockName}
                        onChange={(e) => setEditingBlockName(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveBlockName();
                          if (e.key === 'Escape') cancelEditingName();
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={saveBlockName}
                        className="h-7 w-7 p-0 text-green-600"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={cancelEditingName}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center space-x-2 group cursor-text"
                      onDoubleClick={() => startEditingName(block)}
                    >
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {getBlockDisplayName(block)}
                      </span>
                      <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span className="capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                      {block.type}
                    </span>
                    <span>•</span>
                    <span>{t`Position ${index + 1}`}</span>
                    {block.customName && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600 dark:text-blue-400">{t`Custom Name`}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                <div className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>

        {(!coverLetter?.content?.blocks || coverLetter.content.blocks.length === 0) && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-default">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t`No blocks yet`}</p>
            <p className="text-xs mt-1">{t`Add your first block above`}</p>
          </div>
        )}
      </div>
    </section>
  );
};