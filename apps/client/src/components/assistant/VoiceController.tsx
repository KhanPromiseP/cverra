// MINIMAL WORKING VERSION - Fewer TypeScript headaches
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceControllerProps {
  onVoiceText: (text: string) => void;
  onToggleVoiceOutput: () => void;
  isVoiceOutputEnabled: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({ 
  onVoiceText, 
  onToggleVoiceOutput,
  isVoiceOutputEnabled 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isBrowserSpeechAvailable, setIsBrowserSpeechAvailable] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Simple check without complex types
    const hasSpeechAPI = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsBrowserSpeechAvailable(hasSpeechAPI);
    
    if (hasSpeechAPI) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
    }
  }, []);

  const handleVoiceInput = useCallback(async () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Voice recognition not available');
      return;
    }

    // Set up handlers directly
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onVoiceText(transcript);
      toast.success(`"${transcript}"`, { duration: 1500 });
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.log('Speech error:', event.error);
      toast.info('Voice service unavailable. Please type instead.', {
        action: { label: 'Type', onClick: () => {
          const text = prompt('Type your message:');
          if (text) onVoiceText(text);
        }}
      });
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('Listening... Speak now');
    } catch (error) {
      console.error('Failed to start:', error);
      toast.error('Voice recognition failed');
      setIsListening(false);
    }
  }, [isListening, onVoiceText]);

  const handleManualInput = useCallback(() => {
    const text = prompt('Type your message:');
    if (text) onVoiceText(text);
  }, [onVoiceText]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isBrowserSpeechAvailable ? handleVoiceInput : handleManualInput}
        className={`
          p-2 rounded-lg transition-all
          ${isListening ? 'bg-red-500 animate-pulse' : 
            isBrowserSpeechAvailable ? 'bg-green-500 hover:bg-green-600' : 
            'bg-gray-500 hover:bg-gray-600'}
          text-white hover:shadow-md
        `}
        title={isBrowserSpeechAvailable ? 
          (isListening ? 'Stop listening' : 'Start voice input') : 
          'Type message (voice unavailable)'}
      >
        {isBrowserSpeechAvailable ? 
          (isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />) : 
          <Keyboard className="w-5 h-5" />
        }
      </button>

      <button
        onClick={onToggleVoiceOutput}
        className={`p-2 rounded-lg ${isVoiceOutputEnabled ? 'text-blue-500' : 'text-gray-400'}`}
      >
        {isVoiceOutputEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </button>
    </div>
  );
};