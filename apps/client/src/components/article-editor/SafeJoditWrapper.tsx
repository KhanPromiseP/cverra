// components/article-editor/SafeJoditWrapper.tsx
import React from 'react';
import JoditWrapper from './JoditWrapper';

interface SafeJoditWrapperProps {
  value: any; // Accept any type
  onChange: (content: string) => void;
  disabled?: boolean;
  height?: number;
  placeholder?: string;
  uploadEndpoint?: string;
}

const SafeJoditWrapper: React.FC<SafeJoditWrapperProps> = ({
  value,
  onChange,
  disabled = false,
  height = 600,
  placeholder = 'Start writing your amazing article...',
  uploadEndpoint = '/api/upload/image'
}) => {
  // Convert any value to string for Jodit
  const stringValue = React.useMemo(() => {
    if (!value) return '';
    
    // Already a string
    if (typeof value === 'string') return value;
    
    // Tiptap JSON object
    if (typeof value === 'object' && value.type === 'doc') {
      try {
        // Import your conversion function
        // You may need to adjust this path
        const { tiptapToHTML } = require('../../utils/content-utils');
        return tiptapToHTML(value);
      } catch (error) {
        console.error('Tiptap conversion error:', error);
        return '';
      }
    }
    
    // Other objects/arrays
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    
    // Numbers, booleans, etc.
    return String(value);
  }, [value]);

  return (
    <JoditWrapper
      value={stringValue}
      onChange={onChange}
      disabled={disabled}
      height={height}
      placeholder={placeholder}
      uploadEndpoint={uploadEndpoint}
    />
  );
};

export default SafeJoditWrapper;