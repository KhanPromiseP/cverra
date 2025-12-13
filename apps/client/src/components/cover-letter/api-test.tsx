// client/components/cover-letter/api-test.tsx
import { useEffect, useState } from 'react';
import { coverLetterService } from '../../services/cover-letter.service';

export const ApiTest = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testApi = async () => {
      try {
        setStatus('loading');
        const data = await coverLetterService.findAll();
        setStatus('success');
        setMessage(`API connected! Found ${data.length} cover letters`);
      } catch (error: any) {
        setStatus('error');
        setMessage(`API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
    };

    testApi();
  }, []);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-bold mb-2">API Connection Test</h3>
      <div className={`
        ${status === 'loading' ? 'text-blue-600' : ''}
        ${status === 'success' ? 'text-green-600' : ''}
        ${status === 'error' ? 'text-red-600' : ''}
      `}>
        {status === 'loading' && 'Testing API connection...'}
        {status === 'success' && `✅ ${message}`}
        {status === 'error' && `❌ ${message}`}
      </div>
    </div>
  );
};