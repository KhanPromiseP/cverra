// components/assistant/ExportModal.tsx
import React, { useState } from 'react';
import {
  X,
  Download,
  FileJson,
  FileText,
  File,
  Image,
  FileSpreadsheet,
  Check,
  Copy,
  Loader2,
  Eye,
  Code,
  FileCode,
  Printer,
  Share2,
  Lock,
  Globe,
  Calendar,
  Filter,
  ChevronDown
} from 'lucide-react';
import { useAssistant } from '../../hooks/useAssistant';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items?: any[];
  type?: 'brain' | 'decisions' | 'summary' | 'conversation';
  data?: any;
  title?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items = [],
  type = 'brain',
  data,
  title = 'Export'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'pdf' | 'FileCode' | 'txt' | 'image'>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);

  const { getAuthHeaders, userTier } = useAssistant();

  if (!isOpen) return null;

  const generatePreview = () => {
    switch (selectedFormat) {
      case 'json':
        return JSON.stringify(formatForExport(), null, 2);
      case 'FileCode':
        return generateFileCodePreview();
      case 'csv':
        return generateCSVPreview();
      default:
        return 'Preview not available for this format';
    }
  };

  const formatForExport = () => {
    let exportData: any = {
      exportedAt: new Date().toISOString(),
      type,
      count: items.length,
    };

    if (includeMetadata) {
      exportData.metadata = {
        userTier,
        exportFormat: selectedFormat,
        dateRange,
      };
    }

    if (type === 'brain') {
      exportData.items = items.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        content: item.content,
        ...(includeTags && { tags: item.tags }),
        category: item.category,
        priority: item.priority,
        status: item.status,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        ...(includeMetadata && {
          linkedItems: item.linkedItems,
          linkedGoals: item.linkedGoals,
        }),
      }));
    } else if (type === 'decisions') {
      exportData.items = items.map(item => ({
        id: item.id,
        context: item.context,
        options: item.options,
        scores: item.scores,
        recommendation: item.recommendation,
        chosenOption: item.chosenOption,
        createdAt: item.createdAt,
      }));
    } else if (type === 'summary') {
      exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
      };
    }

    return exportData;
  };

  const generateFileCodePreview = () => {
    let FileCode = `# ${title}\n\n`;
    FileCode += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;

    if (type === 'brain') {
      items.forEach(item => {
        FileCode += `## ${item.title}\n\n`;
        FileCode += `**Type:** ${item.type}  \n`;
        if (includeTags && item.tags?.length) {
          FileCode += `**Tags:** ${item.tags.join(', ')}  \n`;
        }
        FileCode += `**Category:** ${item.category}  \n`;
        FileCode += `**Priority:** ${item.priority}/5  \n\n`;
        FileCode += `${item.content}\n\n`;
        FileCode += `---\n\n`;
      });
    }

    return FileCode;
  };

  const generateCSVPreview = () => {
    if (type === 'brain') {
      const headers = ['Title', 'Type', 'Content', 'Tags', 'Category', 'Priority', 'Created'];
      const rows = items.slice(0, 3).map(item => [
        item.title,
        item.type,
        item.content.substring(0, 50) + '...',
        item.tags?.join('|') || '',
        item.category,
        item.priority,
        new Date(item.createdAt).toLocaleDateString(),
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return csv;
    }
    return '';
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const exportData = formatForExport();
      
      switch (selectedFormat) {
        case 'json':
          downloadJSON(exportData);
          break;
        case 'csv':
          downloadCSV(exportData);
          break;
        case 'FileCode':
          downloadFileCode(exportData);
          break;
        case 'txt':
          downloadTXT(exportData);
          break;
        case 'pdf':
          await downloadPDF();
          break;
        case 'image':
          await downloadImage();
          break;
      }

      toast.success(`Exported successfully as ${selectedFormat.toUpperCase()}`);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any) => {
    if (type === 'brain') {
      const headers = ['Title', 'Type', 'Content', 'Tags', 'Category', 'Priority', 'Created', 'Updated'];
      const rows = items.map(item => [
        item.title,
        item.type,
        item.content.replace(/"/g, '""'),
        item.tags?.join('|') || '',
        item.category,
        item.priority,
        new Date(item.createdAt).toLocaleDateString(),
        new Date(item.updatedAt).toLocaleDateString(),
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const downloadFileCode = (data: any) => {
    const FileCode = generateFileCodePreview();
    const blob = new Blob([FileCode], { type: 'text/FileCode' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = (data: any) => {
    let text = '';
    if (type === 'brain') {
      items.forEach(item => {
        text += `${item.title}\n`;
        text += `${'='.repeat(item.title.length)}\n`;
        text += `Type: ${item.type}\n`;
        if (includeTags && item.tags?.length) {
          text += `Tags: ${item.tags.join(', ')}\n`;
        }
        text += `\n${item.content}\n\n`;
        text += `${'-'.repeat(50)}\n\n`;
      });
    }

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    // Create a temporary div for PDF content
    const content = document.createElement('div');
    content.className = 'p-8 bg-white dark:bg-gray-900';
    content.innerHTML = `
      <h1 style="font-size: 24px; margin-bottom: 8px;">${title}</h1>
      <p style="color: #666; margin-bottom: 24px;">Exported on ${new Date().toLocaleDateString()}</p>
      ${items.map(item => `
        <div style="margin-bottom: 32px; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="font-size: 18px; margin-bottom: 8px;">${item.title}</h2>
          <p style="color: #666; margin-bottom: 8px;">Type: ${item.type}</p>
          <p>${item.content}</p>
        </div>
      `).join('')}
    `;

    document.body.appendChild(content);

    try {
      const canvas = await html2canvas(content);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      document.body.removeChild(content);
    }
  };

  const downloadImage = async () => {
    const content = document.createElement('div');
    content.className = 'p-8 bg-white dark:bg-gray-900';
    content.innerHTML = `
      <h1 style="font-size: 24px;">${title}</h1>
      <p>Exported on ${new Date().toLocaleDateString()}</p>
    `;

    document.body.appendChild(content);

    try {
      const canvas = await html2canvas(content);
      const link = document.createElement('a');
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } finally {
      document.body.removeChild(content);
    }
  };

  const copyToClipboard = async () => {
    const preview = generatePreview();
    await navigator.clipboard.writeText(preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', icon: FileJson, description: 'Full data with structure' },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Spreadsheet compatible' },
    { value: 'FileCode', label: 'FileCode', icon: FileCode, description: 'Formatted document' },
    { value: 'txt', label: 'Plain Text', icon: FileText, description: 'Simple text format' },
    { value: 'pdf', label: 'PDF', icon: File, description: 'Printable document' },
    { value: 'image', label: 'Image', icon: Image, description: 'PNG screenshot' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card rounded-xl shadow-2xl border border-border animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Export {title}</h2>
            <span className="text-xs bg-secondary px-2 py-1 rounded-full">
              {items.length} items
            </span>
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
          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3">Export Format</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {formatOptions.map(format => (
                <button
                  key={format.value}
                  onClick={() => setSelectedFormat(format.value as any)}
                  className={`p-3 rounded-lg border-2 text-left transition ${
                    selectedFormat === format.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <format.icon className={`w-5 h-5 mb-2 ${
                    selectedFormat === format.value ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <div className="font-medium text-sm">{format.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-medium mb-2">Export Options</h3>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Include metadata (IDs, timestamps)
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeTags}
                onChange={(e) => setIncludeTags(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Include tags and categories
            </label>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="flex-1 px-3 py-2 bg-secondary rounded-lg text-sm"
              >
                <option value="all">All time</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last year</option>
              </select>
            </div>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-primary mb-3"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
            <ChevronDown className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
          </button>

          {/* Preview */}
          {showPreview && (
            <div className="relative mb-4">
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg hover:bg-muted transition"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <pre className="p-4 bg-secondary rounded-lg text-xs overflow-x-auto max-h-60">
                {generatePreview()}
              </pre>
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                  Private Export
                </h4>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  This export contains your personal data. Keep it secure and don't share with others.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition"
          >
            Cancel
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export as {selectedFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};