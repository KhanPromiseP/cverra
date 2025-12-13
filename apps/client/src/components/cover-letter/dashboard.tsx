// client/components/cover-letter/dashboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, FileText, Edit, Download, Trash2 } from 'lucide-react';
import { Button } from '@reactive-resume/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@reactive-resume/ui';
import { coverLetterService } from '../../services/cover-letter.service';
import { ApiTest } from './api-test';

export const CoverLetterDashboard = () => {
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  const fetchCoverLetters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await coverLetterService.findAll();
      setCoverLetters(data || []);
    } catch (error: any) {
      console.error('Failed to fetch cover letters:', error);
      
      if (error.response?.status === 401) {
        setError('Please log in to access cover letters.');
      } else if (error.response?.status === 404) {
        setError('API endpoint not found. Please check if the backend is running.');
      } else {
        setError(error.message || 'Failed to load cover letters. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteCoverLetter = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover letter?')) return;

    try {
      await coverLetterService.delete(id);
      setCoverLetters(letters => letters.filter(letter => letter.id !== id));
    } catch (error) {
      console.error('Failed to delete cover letter:', error);
      alert('Failed to delete cover letter. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <ApiTest />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading cover letters...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ApiTest />
        <div className="text-center py-8">
          <div className="text-red-600 mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <strong>Error loading cover letters:</strong>
            <div className="mt-2">{error}</div>
          </div>
          <div className="space-x-4">
            <Button onClick={fetchCoverLetters} variant="outline">
              Try Again
            </Button>
             <Link to="/dashboard/cover-letters/wizard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create New Cover Letter
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ApiTest />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cover Letters</h1>
          <p className="text-gray-600mt-2">Manage and create professional cover letters</p>
        </div>
         <Link to="/dashboard/cover-letters/wizard">
          <Button className="bg-blue-600 hover:bg-blue-700 border border-gray-800 dark:border-white">
            <Plus className="w-4 h-4 mr-2" />
            New Cover Letter
          </Button>
        </Link>
      </div>

      {coverLetters.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No cover letters yet</h3>
            <p className="text-gray-600 mb-4">Create your first AI-powered cover letter</p>
             <Link to="/dashboard/cover-letters/wizard">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Create Cover Letter
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coverLetters.map((letter) => (
            <Card key={letter.id} className="hover:shadow-lg transition-shadow  border border-gray-300 dark:border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold truncate">
                  {letter.title}
                </CardTitle>
                <CardDescription className="flex justify-between items-center">
                  <span className="capitalize">{letter.style.toLowerCase()}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(letter.updatedAt).toLocaleDateString()}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between space-x-2">
                  <Link to={`/builder/cover-letter/${letter.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCoverLetter(letter.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};