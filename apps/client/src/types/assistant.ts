// types/assistant.ts
export type AssistantMode = 
  | 'GENERAL_ASSISTANT'
  | 'TUTOR'
  | 'CAREER_COACH'
  | 'CONTENT_GUIDE';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
  metadata?: Record<string, any>;
  referencedArticles?: Array<{
    id: string;
    title: string;
    slug: string;
    relevance: number;
  }>;
}

export interface AssistantMemory {
  id: string;
  topic: string;
  summary: string;
  importance: number;
  contextType: string;
  tags: string[];
  updatedAt: Date;
  lastAccessed: Date;
  source?: string;
}

export interface AssistantAnalytics {
  totalConversations: number;
  totalMessages: number;
  totalTokens: number;
  preferredMode: AssistantMode;
  averageResponseTime: number;
  satisfactionScore: number;
}

// Add Conversation interface to match hook
export interface Conversation {
  id: string;
  title?: string;
  mode: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;

  isStarred?: boolean;
  isPinned?: boolean;
  isArchived?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  archivedAt?: string;
  restoredAt?: string;
}

// Web Speech API Types
export interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

export interface SpeechRecognitionType {
  new (): {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    onstart: (() => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  };
  prototype: {
    start: () => void;
    stop: () => void;
    abort: () => void;
  };
}

// Voice State Types
export interface VoiceState {
  isListening: boolean;
  isVoiceEnabled: boolean;
  isSpeaking: boolean;
  interimTranscript: string;
  voiceSupported: {
    input: boolean;
    output: boolean;
  };
}

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionType;
    webkitSpeechRecognition: SpeechRecognitionType;
  }
}

// Voice Settings Type
export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  voiceName?: string;
  language: string;
}