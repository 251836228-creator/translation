import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SearchResult, Language } from '../types';

// Support both standard process.env (Node/Webpack) and import.meta.env (Vite)
const getClient = () => {
  // @ts-ignore - import.meta is available in Vite environments
  const apiKey = import.meta.env?.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    console.error("Gemini API Key is missing. Please check your .env file or Vercel Environment Variables.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "" });
};

// --- Helper for Audio Decoding ---

// Helper to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to convert raw PCM data to AudioBuffer
function pcmToAudioBuffer(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): AudioBuffer {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Global context for decoding/playback to avoid "Too many AudioContexts"
let _sharedAudioContext: AudioContext | null = null;
export const getSharedAudioContext = () => {
  if (!_sharedAudioContext) {
    _sharedAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return _sharedAudioContext;
}

// 1. Analyze Text (Definition, Examples, Usage)
export const analyzeText = async (
  term: string,
  nativeLang: Language,
  targetLang: Language
): Promise<Omit<SearchResult, 'id' | 'timestamp' | 'imageUrl'>> => {
  const ai = getClient();
  
  const prompt = `
    Analyze the term/phrase: "${term}".
    Target Language: ${targetLang.name}.
    Explanation Language (Native): ${nativeLang.name}.
    
    Output a JSON object with:
    - explanation: A natural explanation in ${nativeLang.name}.
    - phonetic: IPA or simple phonetic pronunciation guide if applicable.
    - examples: Array of 2 objects { original, translation }. 'original' in ${targetLang.name}, 'translation' in ${nativeLang.name}.
    - funUsage: A conversational, witty paragraph in ${nativeLang.name} explaining cultural context, nuance, vibe, usage scenarios. Avoid textbook style. Use emojis. Be concise (max 60 words).
    - relatedWords: A string listing 2-3 synonyms or commonly confused words with brief distinction.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING },
          phonetic: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                original: { type: Type.STRING },
                translation: { type: Type.STRING }
              }
            }
          },
          funUsage: { type: Type.STRING },
          relatedWords: { type: Type.STRING }
        }
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data received");
  return JSON.parse(text);
};

// 2. Generate Image
export const generateImageForTerm = async (term: string, context: string): Promise<string | undefined> => {
  const ai = getClient();
  
  try {
    const prompt = `Generate a minimalist, colorful, vector-art style illustration representing the concept: "${term}". Context: ${context}`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Iterate parts to find image
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return undefined;
  } catch (e) {
    console.error("Image gen failed", e);
    return `https://picsum.photos/400/400?blur=2`; // Fallback
  }
};

// 3. TTS Generation
export const generateAudio = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer> => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }
        }
      }
    }
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const ctx = getSharedAudioContext();
  // Decode raw PCM (24kHz, 1 channel)
  return pcmToAudioBuffer(decode(base64Audio), ctx, 24000, 1);
};

// 4. Chat with Context
export const chatWithContext = async (
  currentHistory: {role: string, parts: {text: string}[]}[],
  newMessage: string,
  wordContext: SearchResult
): Promise<string> => {
  const ai = getClient();
  
  // Prepend system instruction as first history item roughly
  const systemPrompt = `You are a helpful language tutor. 
  Current context word: "${wordContext.term}" (${wordContext.explanation}). 
  Keep answers short, friendly, and related to the word.`;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: { systemInstruction: systemPrompt },
    history: currentHistory.map(h => ({
      role: h.role,
      parts: h.parts
    }))
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "";
};

// 5. Generate Story from Notebook
export const generateStoryFromList = async (words: SearchResult[], nativeLang: Language): Promise<string> => {
  const ai = getClient();
  const wordList = words.map(w => w.term).join(", ");
  
  const prompt = `Write a short, funny, and coherent story (max 150 words) in ${nativeLang.name} that incorporates the following words/phrases: ${wordList}. 
  Bold the used words in the text using markdown (**word**). 
  Add a translation of the bolded words in parentheses if helpful.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Could not generate story.";
};