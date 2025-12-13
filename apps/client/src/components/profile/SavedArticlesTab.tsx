import { useState } from "react";
import { Button } from "@reactive-resume/ui";
import { 
  BookmarkSimple, 
  Trash, 
  Eye,
  Calendar,
  Clock,
  FolderOpen
} from "@phosphor-icons/react";
import { ArticleCard } from "@/client/components/articles/ArticleCard";
import { apiClient } from "@/client/services/api-client";

interface SavedArticlesTabProps {
  articles: any[];
  onRefresh: () => void;
}

export function SavedArticlesTab({ articles = [], onRefresh }: SavedArticlesTabProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleUnsave = async (articleId: string) => {
    try {
      await apiClient.delete(`/articles/${articleId}/save`);
      onRefresh();
    } catch (error) {
      console.error('Failed to unsave article:', error);
    }
  };

  const handleUnsaveSelected = async () => {
    try {
      await Promise.all(
        selectedIds.map(id => apiClient.delete(`/articles/${id}/save`))
      );
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      console.error('Failed to unsave selected articles:', error);
    }
  };

  const handleToggleSelect = (articleId: string) => {
    setSelectedIds(prev => 
      prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  if (!articles?.length) {
    return (
      <div className="text-center py-12">
        <BookmarkSimple className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No saved articles yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Save articles you want to read later by clicking the bookmark icon
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved Articles ({articles.length})
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Articles you've bookmarked for later
          </p>
        </div>
        
        {selectedIds.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleUnsaveSelected}>
            <Trash className="mr-2" size={16} />
            Remove Selected ({selectedIds.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((item) => (
        <div key={item.id} className="relative group">
            <div className="absolute top-2 left-2 z-10">
            <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => handleToggleSelect(item.id)}
                className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            />
            </div>
            <ArticleCard article={item.article} />
            <div className="absolute top-[165px] right-6 opacity-0 group-hover:opacity-100 transition-opacity">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleUnsave(item.id);
    }}
    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg"
    title="Remove from saved"
  >
    <Trash size={16} />
  </button>
</div>
        </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} />
            <span>Organize into collections (coming soon)</span>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh List
        </Button>
      </div>
    </div>
  );
}