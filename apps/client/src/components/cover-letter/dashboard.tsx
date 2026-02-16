import { t, Trans } from "@lingui/macro";
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, FileText, Edit, Download, Trash2, Clock, Calendar, ChevronRight, Eye, Copy, X } from 'lucide-react';
import { Button } from '@reactive-resume/ui';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@reactive-resume/ui';
import { Badge } from '@reactive-resume/ui';
import { Input } from '@reactive-resume/ui';
import { coverLetterService } from '../../services/cover-letter.service';

export const CoverLetterDashboard = () => {
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<any>(null);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  const fetchCoverLetters = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const data = await coverLetterService.findAll();
    

    const uniqueLetters = Array.from(
      new Map(data?.map(letter => [letter.id, letter])).values()
    );
    
    // Sort by updatedAt
    uniqueLetters.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    console.log('Original count:', data?.length);
    console.log('Unique count:', uniqueLetters.length);
    
    setCoverLetters(uniqueLetters);
  } catch (error: any) {
    // ... error handling
  } finally {
    setLoading(false);
  }
};

  const deleteCoverLetter = async (id: string) => {
    if (!confirm(t`Are you sure you want to delete this letter?`)) return;

    try {
      await coverLetterService.delete(id);
      setCoverLetters(letters => letters.filter(letter => letter.id !== id));
    } catch (error) {
      console.error('Failed to delete letter:', error);
      alert(t`Failed to delete letter. Please try again.`);
    }
  };

  const openDuplicateModal = (letter: any) => {
    setSelectedLetter(letter);
    setDuplicateName(t`${letter.title || 'Untitled Letter'} (Copy)`);
    setShowDuplicateModal(true);
  };

  const closeDuplicateModal = () => {
    setShowDuplicateModal(false);
    setSelectedLetter(null);
    setDuplicateName('');
    setDuplicating(false);
  };


const duplicateLetter = async () => {
  if (!selectedLetter || !duplicateName.trim()) return;

  setDuplicating(true);
  try {
    // Pass the custom name to the backend
    const response = await coverLetterService.duplicate(
      selectedLetter.id, 
      duplicateName.trim()
    );
    
    // Extract the duplicate from the response
    const duplicated = response.data; // Assuming response has { success, message, data }
    
    // Add the duplicated letter to the list
    setCoverLetters(letters => [duplicated, ...letters]);
    
    // Show success message
    alert(t`Letter duplicated successfully as "${duplicateName}"`);
    
    closeDuplicateModal();
  } catch (error) {
    console.error('Failed to duplicate letter:', error);
    alert(t`Failed to duplicate letter. Please try again.`);
  } finally {
    setDuplicating(false);
  }
};

  // Function to safely truncate text
  const truncateText = (text: any, maxLength: number = 120) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return t`Yesterday`;
      if (diffDays < 7) return t`${diffDays} days ago`;
      if (diffDays < 30) return t`${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return t`Invalid date`;
    }
  };

  // Function to get style badge color
  const getStyleBadgeColor = (style: string) => {
    if (!style) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    
    switch (style.toLowerCase()) {
      case 'professional':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'creative':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
      case 'concise':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-800';
      case 'formal':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-14 w-14 border-[3px] border-blue-600 border-t-transparent"></div>
            <FileText className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t`Loading your letters`}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t`Please wait while we fetch your documents`}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t`Oops! Something went wrong`}</h3>
          <div className="max-w-lg mx-auto mb-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-300 font-bold">!</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">{t`Error Details`}</h4>
                  <p className="text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={fetchCoverLetters} 
              variant="outline"
              className="px-6 py-2.5 border-2 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all"
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t`Try Again`}
              </span>
            </Button>
            <Link to="/dashboard/cover-letters/wizard">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4 mr-2" />
                {t`Create New Letter`}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight 
                    bg-gradient-to-r from-slate-900 via-blue-700 to-indigo-700 
                    dark:from-white dark:via-blue-300 dark:to-indigo-300 
                    bg-clip-text text-transparent">
                    {t`All Letter Categories`}
                  </h1>

                  <p className="text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                    {t`Craft clear, professional, and purpose-driven letters with INLIRAH’s intelligent writing system.`}
                  </p>
                </div>

              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></div>
                  <span className="text-sm font-medium">
                    {coverLetters.length} {t`letter${coverLetters.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <div className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700">
                  <Calendar className="w-3 h-3 mr-2 text-gray-500" />
                  <span className="text-sm">
                    {t`Updated ${coverLetters.length > 0 ? formatDate(coverLetters[0].updatedAt) : 'never'}`}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/dashboard/cover-letters/wizard" className="w-full sm:w-auto">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center">
                    <div className="mr-3 p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      
                      <div className="text-sm opacity-80">{t`Create a new letter`}</div>
                    </div>
                  </div>
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="border-2 px-6 py-3 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all"
                onClick={fetchCoverLetters}
              >
                {t`Refresh`}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {coverLetters.length === 0 ? (
          <div className="max-w-2xl mx-auto">
            <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 overflow-hidden">
              <CardContent className="p-12 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-purple-400 dark:from-blue-900 dark:to-purple-900 rounded-full blur-2xl opacity-50"></div>
                  <div className="relative w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                    <FileText className="w-16 h-16 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t`No letters created yet`}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-lg">
                  {t`Start by creating your first professional letter. Our smart model will help you craft the perfect message.`}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                 <Link to="/dashboard/cover-letters/wizard" className="w-full sm:w-auto">
                    <Button
                      className="
                        w-full
                        sm:w-auto
                        flex items-center justify-center
                        gap-2
                        bg-gradient-to-r from-blue-600 to-indigo-600
                        hover:from-blue-700 hover:to-indigo-700
                        text-white
                        px-6 sm:px-8
                        py-4 sm:py-3
                        text-base sm:text-lg
                        rounded-xl
                        shadow-lg hover:shadow-xl
                        transition-all duration-300
                        active:scale-[0.98]
                      "
                    >
                      {t`Create First Letter`}
                      <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>

                  <Link to="/docs/#letter-builder" className="w-full sm:w-auto">
                    <Button variant="outline" className="px-8 py-3 text-lg">
                      {t`Get Help`}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{coverLetters.length}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t`Total Letters`}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg mr-3">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {coverLetters.filter(l => new Date(l.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{t`Updated this week`}</div>
                  </div>
                </div>
              </div>
              
            </div>

            {/* Letters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coverLetters.map((letter) => (
                <Card 
                  key={letter.id} 
                  className="group hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 overflow-hidden relative"
                >
                  {/* Card Header */}
                  <CardHeader className="pb-4 relative z-10">
                    <div className="flex justify-between items-start mb-3">
                      <Badge className={`text-xs font-semibold px-3 py-1 ${getStyleBadgeColor(letter.style)}`}>
                        {letter.style || t`Custom`}
                      </Badge>
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(letter.updatedAt)}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {letter.title || t`Untitled Letter`}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {truncateText(letter.content, 100)}
                    </CardDescription>
                  </CardHeader>
                  
                  {/* Card Content */}
                  <CardContent className="pb-4">
                    <div className="space-y-4">
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          {letter.company && (
                            <div className="flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 mr-2">{t`For:`}</span>
                              <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
                                {letter.company}
                              </span>
                            </div>
                          )}
                        </div>
                        {letter.wordCount && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {letter.wordCount} {t`words`}
                          </div>
                        )}
                      </div>

                      {/* Letter Preview */}
                      {letter.content && (
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none"></div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-800 max-h-32 overflow-y-auto">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                              {truncateText(letter.content, 200)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  {/* Card Footer */}
                  <CardFooter className="pt-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex w-full space-x-2">
                      <Link 
                        to={`/builder/cover-letter/${letter.id}/edit`} 
                        className="flex-1"
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all group"
                        >
                          <Edit className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                          {t`Edit`}
                        </Button>
                      </Link>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-green-50 hover:text-green-600 hover:border-green-300 dark:hover:bg-green-900/20 dark:hover:text-green-400 transition-all group"
                        onClick={() => openDuplicateModal(letter)}
                      >
                        <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all group"
                      >
                        <Download className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all group"
                        onClick={() => deleteCoverLetter(letter.id)}
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </Button>
                    </div>
                  </CardFooter>
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-100/0 to-indigo-50/0 dark:from-blue-900/0 dark:via-blue-800/0 dark:to-indigo-900/0 group-hover:from-blue-50/20 group-hover:via-blue-100/10 group-hover:to-indigo-50/20 dark:group-hover:from-blue-900/10 dark:group-hover:via-blue-800/5 dark:group-hover:to-indigo-900/10 transition-all duration-500 pointer-events-none"></div>
                </Card>
              ))}
            </div>

            {/* Footer Stats */}
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t`Showing ${coverLetters.length} letter${coverLetters.length !== 1 ? 's' : ''}`} • 
                  {t`Sorted by recent`} • 
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                    {t`Last updated: ${coverLetters.length > 0 ? formatDate(coverLetters[0].updatedAt) : 'never'}`}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Link to="/docs">
                    <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-400">
                      {t`Need help?`}
                    </Button>
                  </Link>
                  <Link to="/dashboard/cover-letters/wizard">
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      {t`Add Another`}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Duplicate Modal */}
      {showDuplicateModal && selectedLetter && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Copy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t`Duplicate Letter`}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <Trans>
                        Create a copy of "{selectedLetter.title || t`Untitled Letter`}"
                      </Trans>
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeDuplicateModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t`New Letter Name`}
                  </label>
                  <Input
                    type="text"
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    placeholder={t`Enter a name for the duplicate`}
                    className="w-full"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {t`The duplicate will contain all content from the original letter.`}
                  </p>
                </div>

                {/* Original Info */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t`Original Letter`}</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {selectedLetter.title || t`Untitled Letter`}
                      </p>
                    </div>
                    <Badge className={`${getStyleBadgeColor(selectedLetter.style)}`}>
                      {selectedLetter.style || t`Custom`}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {t`Created: ${formatDate(selectedLetter.createdAt)}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 rounded-b-2xl">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={closeDuplicateModal}
                  disabled={duplicating}
                >
                  {t`Cancel`}
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  onClick={duplicateLetter}
                  disabled={!duplicateName.trim() || duplicating}
                >
                  {duplicating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {t`Duplicating...`}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      {t`Duplicate`}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};