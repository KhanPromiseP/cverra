// components/article-editor/SafeJoditWrapper.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  const [processedValue, setProcessedValue] = useState<string>('');
  const prevValueRef = useRef<any>(null);
  const isFirstRender = useRef(true);

  // Process the value whenever it changes
  useEffect(() => {
    console.log('🔄 SafeJoditWrapper value changed:', {
      hasValue: !!value,
      valueType: typeof value,
      isString: typeof value === 'string',
      isHTML: typeof value === 'string' && value?.trim()?.startsWith?.('<'),
      preview: value ? 
        (typeof value === 'string' ? value.substring(0, 100) : 'non-string') 
        : 'empty',
      prevValueType: prevValueRef.current ? typeof prevValueRef.current : 'none',
      isFirstRender: isFirstRender.current
    });

    // Store previous value for comparison
    prevValueRef.current = value;

    if (!value) {
      setProcessedValue('');
      return;
    }
    
    // Handle string values (including HTML)
    if (typeof value === 'string') {
      setProcessedValue(value);
      return;
    }
    
    // Handle TipTap JSON if needed
    if (typeof value === 'object' && value?.type === 'doc') {
      try {
        // If you have a TipTap to HTML converter, use it here
        // For now, just stringify it
        console.warn('TipTap JSON detected, stringifying for editor');
        setProcessedValue(JSON.stringify(value));
      } catch (error) {
        console.error('Error processing TipTap JSON:', error);
        setProcessedValue('');
      }
      return;
    }
    
    // Handle other objects
    if (typeof value === 'object') {
      try {
        setProcessedValue(JSON.stringify(value));
      } catch {
        setProcessedValue('');
      }
      return;
    }
    
    // Fallback for other types
    setProcessedValue(String(value));
    
    isFirstRender.current = false;
  }, [value]);

  return (
    <JoditWrapper
      key={`jodit-${processedValue?.substring(0, 50)}-${Date.now()}`}
      value={processedValue}
      onChange={onChange}
      disabled={disabled}
      height={height}
      placeholder={placeholder}
      uploadEndpoint={uploadEndpoint}
    />
  );
};

export default SafeJoditWrapper;