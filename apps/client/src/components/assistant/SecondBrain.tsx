// components/assistant/SecondBrain.tsx
import React, { useState, useEffect } from 'react';
import {
  Brain,
  Lightbulb,
  FileText,
  CheckSquare,
  FolderTree,
  Tag,
  Search,
  Plus,
  Download,
  Link2,
  Share2,
  MoreVertical,
  Edit,
  Trash2,
  Archive,
  Star,
  Network,
  Map,
  Grid,
  List,
  Sparkles,
} from 'lucide-react';
import { BrainDumpModal } from './BrainDumpModal';
import { KnowledgeGraph } from './KnowledgeGraph';
import { ExportModal } from './ExportModal';
import { useAssistant } from '../../hooks/useAssistant';

interface BrainItem {
  id: string;
  type: 'THOUGHT' | 'IDEA' | 'NOTE' | 'TODO' | 'PROJECT' | 'QUESTION' | 'INSIGHT';
  title: string;
  content: string;
  tags: string[];
  category: string;
  priority: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  linkedItems?: string[];
  linkedGoals?: string[];
}

export const SecondBrain: React.FC = () => {
  const [items, setItems] = useState<BrainItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<BrainItem[]>([]);
  const [view, setView] = useState<'grid' | 'list' | 'graph'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showDumpModal, setShowDumpModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BrainItem | null>(null);

  const { getAuthHeaders } = useAssistant();

  useEffect(() => {
    loadBrainItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedType, selectedTags]);

  const loadBrainItems = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('/api/assistant/brain/items', { headers });
      const data = await response.json();
      setItems(data.data || []);
    } catch (error) {
      console.error('Failed to load brain items:', error);
    }
  };

  const filterItems = () => {
    let filtered = [...items];

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    setFilteredItems(filtered);
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

  const allTags = Array.from(new Set(items.flatMap(item => item.tags)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Second Brain</h2>
          <p className="text-muted-foreground">Organize your thoughts, ideas, and knowledge</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDumpModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Brain Dump
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 hover:bg-muted rounded-lg"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg ${view === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('graph')}
            className={`p-2 rounded-lg ${view === 'graph' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
          >
            <Network className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your brain..."
            className="w-full pl-9 pr-4 py-2 bg-secondary rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-1.5 bg-secondary rounded-lg text-sm"
        >
          <option value="all">All Types</option>
          <option value="IDEA">Ideas</option>
          <option value="NOTE">Notes</option>
          <option value="TODO">Tasks</option>
          <option value="PROJECT">Projects</option>
          <option value="QUESTION">Questions</option>
          <option value="INSIGHT">Insights</option>
        </select>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev =>
                  prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                )}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 ${
                  selectedTags.includes(tag)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content based on view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {item.content}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {item.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-secondary text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(item.updatedAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  {item.priority >= 4 && <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />}
                  {item.linkedItems && item.linkedItems.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {item.linkedItems.length}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="bg-card border border-border rounded-lg divide-y">
          {filteredItems.map(item => (
            <div key={item.id} className="p-4 hover:bg-muted/50 flex items-center gap-4">
              <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{item.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                    {item.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {item.content}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {item.tags.slice(0, 2).map(tag => (
                  <span key={tag} className="text-xs bg-secondary px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">
                  {new Date(item.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'graph' && (
        <div className="h-[600px] bg-card border border-border rounded-lg p-4">
          <KnowledgeGraph items={filteredItems} />
        </div>
      )}

      {/* Modals */}
      <BrainDumpModal
        isOpen={showDumpModal}
        onClose={() => setShowDumpModal(false)}
        onSuccess={loadBrainItems}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        items={filteredItems}
      />
    </div>
  );
};