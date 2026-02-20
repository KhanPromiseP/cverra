// components/assistant/sidebars/SecondBrainSidebar.tsx
import React, { useState, useEffect } from 'react';
import { Network, Tag, Brain, Loader2, Plus } from 'lucide-react';
import { BrainDumpModal } from '../BrainDumpModal';

interface SecondBrainSidebarProps {
  userId: string;
  getAuthHeaders: () => Record<string, string>;
}

export const SecondBrainSidebar: React.FC<SecondBrainSidebarProps> = ({ 
  userId, 
  getAuthHeaders 
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDumpModal, setShowDumpModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/brain/items', { headers });
      const data = await response.json();
      setItems(data.data || []);
    } catch (error) {
      console.error('Failed to fetch brain items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const notes = items.filter(i => i.type === 'NOTE').length;
  const ideas = items.filter(i => i.type === 'IDEA').length;
  const projects = items.filter(i => i.type === 'PROJECT').length;
  const tasks = items.filter(i => i.type === 'TODO').length;
  
  // Get popular tags
  const tagCount: Record<string, number> = {};
  items.forEach(item => {
    item.tags?.forEach((tag: string) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });
  
  const popularTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-5 h-5 text-blue-500" />
        <h3 className="font-semibold">Second Brain</h3>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{notes}</div>
          <div className="text-xs text-muted-foreground">Notes</div>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{ideas}</div>
          <div className="text-xs text-muted-foreground">Ideas</div>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{projects}</div>
          <div className="text-xs text-muted-foreground">Projects</div>
        </div>
        <div className="bg-secondary/50 p-2 rounded-lg text-center">
          <div className="text-lg font-bold">{tasks}</div>
          <div className="text-xs text-muted-foreground">Tasks</div>
        </div>
      </div>
      
      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Popular Tags</h4>
          <div className="flex flex-wrap gap-1">
            {popularTags.map(tag => (
              <span key={tag} className="px-2 py-1 bg-secondary text-xs rounded-full flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Items */}
      {items.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Recent</h4>
          <div className="space-y-2">
            {items.slice(0, 3).map(item => (
              <div key={item.id} className="p-2 bg-secondary/30 rounded-lg text-xs">
                <div className="font-medium line-clamp-1">{item.title || item.content}</div>
                <div className="text-muted-foreground mt-1">{item.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick Action Button */}
      <button 
        onClick={() => setShowDumpModal(true)}
        className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center justify-center gap-2 mt-2"
      >
        <Brain className="w-4 h-4" />
        Quick Brain Dump
      </button>

      {/* Brain Dump Modal */}
      {showDumpModal && (
        <BrainDumpModal
          isOpen={showDumpModal}
          onClose={() => setShowDumpModal(false)}
          onSuccess={fetchItems}
        />
      )}
    </>
  );
};