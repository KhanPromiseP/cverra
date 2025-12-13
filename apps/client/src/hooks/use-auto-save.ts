import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: (data: any) => void;
  delay?: number;
}

export const useAutoSave = ({ data, onSave, delay = 1000 }: UseAutoSaveOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousDataRef = useRef<string>();

  const triggerSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const currentData = JSON.stringify(data);
      
      // Only save if data has changed
      if (currentData !== previousDataRef.current) {
        previousDataRef.current = currentData;
        onSave(data);
      }
    }, delay);
  }, [data, onSave, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerSave };
};