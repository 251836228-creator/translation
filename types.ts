export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  SEARCH = 'SEARCH',
  RESULT = 'RESULT',
  NOTEBOOK = 'NOTEBOOK',
  FLASHCARDS = 'FLASHCARDS',
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  voiceName?: string; // For TTS mapping
}

export interface ExampleSentence {
  original: string;
  translation: string;
}

export interface SearchResult {
  id: string; // Unique ID for storage
  term: string;
  phonetic?: string;
  explanation: string; // Native language explanation
  examples: ExampleSentence[];
  funUsage: string; // The "chatty" explanation
  relatedWords: string;
  imageUrl?: string; // Base64 or URL
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UserSettings {
  nativeLang: Language;
  targetLang: Language;
}

export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', voiceName: 'Puck' },
  { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳', voiceName: 'Kore' }, // Fallback to EN voices for demo if specific Lang voice not available in preview
  { code: 'es', name: 'Spanish', flag: '🇪🇸', voiceName: 'Charon' },
  { code: 'fr', name: 'French', flag: '🇫🇷', voiceName: 'Fenrir' },
  { code: 'de', name: 'German', flag: '🇩🇪', voiceName: 'Puck' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', voiceName: 'Kore' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷', voiceName: 'Zephyr' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', voiceName: 'Aoede' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', voiceName: 'Charon' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', voiceName: 'Zephyr' },
];